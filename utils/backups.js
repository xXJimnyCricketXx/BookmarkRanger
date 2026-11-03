const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { PrismaClient } = require('@prisma/client');
const prisma = require('../config/db');
const { ROOT_DIR, BACKUPS_DIR } = require('../config/paths');
const { getSettings } = require('./settings');

// Backups without a prefix are manual ones — that includes every backup made before the
// other types existed. Retention only ever touches "auto".
const FILE_NAME = /^bookmarkranger-(?:(auto|safety|upload)-)?(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z)\.db$/;
const SQLITE_HEADER = 'SQLite format 3\0';
const REQUIRED_TABLES = ['_prisma_migrations', 'Account', 'Board', 'Category', 'Bookmark', 'Snippet'];
const MIGRATIONS_DIR = path.join(ROOT_DIR, 'prisma', 'migrations');
const PRISMA_CLI = path.join(ROOT_DIR, 'node_modules', 'prisma', 'build', 'index.js');
const DAY_MS = 24 * 60 * 60 * 1000;
// Ticks are hourly, so without this slack a daily backup would slip an hour later each day.
const DUE_TOLERANCE_MS = 60 * 60 * 1000;
const SCHEDULER_INTERVAL_MS = 60 * 60 * 1000;

let restoring = false;

class BackupError extends Error {
    constructor(code) {
        super(`Backup rejected: ${code}`);
        this.code = code;
    }
}

function isRestoring() {
    return restoring;
}

function dbFilePath() {
    // Prisma resolves a relative sqlite "file:" path relative to prisma/schema.prisma,
    // not the project root, so the path here must match that.
    const raw = (process.env.DATABASE_URL || '').replace(/^file:/, '').split('?')[0];
    return path.resolve(ROOT_DIR, 'prisma', raw);
}

function fileUrl(filePath) {
    return `file:${filePath.replace(/\\/g, '/')}`;
}

function parseFileName(file) {
    const match = FILE_NAME.exec(file);
    if (!match) return null;
    const createdAt = new Date(match[2].replace(/T(\d+)-(\d+)-(\d+)-(\d+)Z/, 'T$1:$2:$3.$4Z'));
    return { file, type: match[1] || 'manual', createdAt };
}

function newFileName(type) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `bookmarkranger-${type === 'manual' ? '' : `${type}-`}${timestamp}.db`;
}

function listBackups() {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
    return fs.readdirSync(BACKUPS_DIR)
        .map(parseFileName)
        .filter(Boolean)
        .map((backup) => ({ ...backup, size: fs.statSync(path.join(BACKUPS_DIR, backup.file)).size }))
        .sort((a, b) => b.createdAt - a.createdAt);
}

// Only names this app generated can ever resolve, so a request can't reach outside the folder.
function resolveBackup(file) {
    if (!parseFileName(file)) return null;
    const filePath = path.join(BACKUPS_DIR, file);
    return fs.existsSync(filePath) ? filePath : null;
}

function removeQuietly(filePath) {
    fs.rmSync(filePath, { force: true });
}

// VACUUM INTO instead of copying the file: it gives a consistent snapshot even if something
// is writing at that moment. The .tmp name keeps a half-written file out of the list.
async function createBackup(type = 'manual') {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
    const file = newFileName(type);
    const dest = path.join(BACKUPS_DIR, file);
    const temp = `${dest}.tmp`;
    try {
        await prisma.$executeRawUnsafe(`VACUUM INTO '${temp.replace(/'/g, "''")}'`);
        fs.renameSync(temp, dest);
    } finally {
        removeQuietly(temp);
    }
    return file;
}

function deleteBackup(file) {
    const filePath = resolveBackup(file);
    if (!filePath) return false;
    fs.rmSync(filePath);
    return true;
}

function hasSqliteHeader(filePath) {
    const fd = fs.openSync(filePath, 'r');
    try {
        const buffer = Buffer.alloc(SQLITE_HEADER.length);
        fs.readSync(fd, buffer, 0, buffer.length, 0);
        return buffer.toString('latin1') === SQLITE_HEADER;
    } finally {
        fs.closeSync(fd);
    }
}

// Throws a BackupError unless the file is an intact BookmarkRanger database this version can
// migrate forward. Also keeps out a database without an account — restoring that would open
// the setup page to whoever visits next.
async function validateBackup(filePath) {
    if (!hasSqliteHeader(filePath)) throw new BackupError('invalid');

    const client = new PrismaClient({ datasourceUrl: fileUrl(filePath) });
    try {
        const [check] = await client.$queryRawUnsafe('PRAGMA quick_check');
        if (Object.values(check)[0] !== 'ok') throw new BackupError('invalid');

        const tables = await client.$queryRawUnsafe("SELECT name FROM sqlite_master WHERE type = 'table'");
        const tableNames = new Set(tables.map((table) => table.name));
        if (REQUIRED_TABLES.some((table) => !tableNames.has(table))) throw new BackupError('invalid');

        const applied = await client.$queryRawUnsafe('SELECT migration_name FROM _prisma_migrations WHERE rolled_back_at IS NULL');
        const known = new Set(fs.readdirSync(MIGRATIONS_DIR));
        if (applied.some((row) => !known.has(row.migration_name))) throw new BackupError('newer');

        const [{ count }] = await client.$queryRawUnsafe('SELECT COUNT(*) AS count FROM Account');
        if (Number(count) === 0) throw new BackupError('no_account');
    } catch (err) {
        throw err instanceof BackupError ? err : new BackupError('invalid');
    } finally {
        await client.$disconnect();
    }
}

function runMigrations(filePath) {
    return new Promise((resolve, reject) => {
        execFile(process.execPath, [PRISMA_CLI, 'migrate', 'deploy'], {
            cwd: ROOT_DIR,
            timeout: 120000,
            env: { ...process.env, DATABASE_URL: fileUrl(filePath), CHECKPOINT_DISABLE: '1' }
        }, (err) => (err ? reject(err) : resolve()));
    });
}

// Everything risky happens on a copy: the live database is only replaced once that copy is
// migrated and verified and a safety backup exists, so any failure leaves it untouched.
async function restoreBackup(file) {
    const source = resolveBackup(file);
    if (!source) throw new BackupError('invalid');

    const live = dbFilePath();
    const candidate = `${live}.restore`;
    restoring = true;
    try {
        await validateBackup(source);
        fs.copyFileSync(source, candidate);
        await runMigrations(candidate);
        await validateBackup(candidate);
        await createBackup('safety');

        await prisma.$disconnect();
        removeQuietly(`${live}-journal`);
        fs.renameSync(candidate, live);
    } finally {
        removeQuietly(candidate);
        removeQuietly(`${candidate}-journal`);
        restoring = false;
    }
}

function applyRetention(settings, now = Date.now()) {
    listBackups()
        .filter((backup) => backup.type === 'auto')
        .forEach((backup, index) => {
            const expired = now - backup.createdAt.getTime() > settings.backupKeepDays * DAY_MS;
            if (index >= settings.backupKeepCount && expired) deleteBackup(backup.file);
        });
}

async function runScheduledBackup(now = Date.now()) {
    if (restoring) return;
    const settings = await getSettings();
    if (!settings.autoBackupEnabled) return;
    // Before setup there's nothing worth keeping, and a restore couldn't use it anyway.
    if ((await prisma.account.count()) === 0) return;

    const [latest] = listBackups().filter((backup) => backup.type === 'auto');
    const dueIn = settings.autoBackupIntervalDays * DAY_MS - DUE_TOLERANCE_MS;
    if (!latest || now - latest.createdAt.getTime() >= dueIn) await createBackup('auto');

    applyRetention(settings, now);
}

// Inside the app instead of a separate cron service — checking on start also catches up on
// a backup that came due while the container was stopped.
function startBackupScheduler() {
    const tick = () => runScheduledBackup().catch((err) => console.error('Scheduled backup failed:', err));
    tick();
    setInterval(tick, SCHEDULER_INTERVAL_MS).unref();
}

module.exports = {
    BackupError,
    isRestoring,
    listBackups,
    resolveBackup,
    newFileName,
    createBackup,
    deleteBackup,
    validateBackup,
    restoreBackup,
    applyRetention,
    startBackupScheduler
};
