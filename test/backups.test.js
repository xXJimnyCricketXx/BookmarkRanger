const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { TestApp, PASSWORD, ROOT, fileUrl, migrate } = require('./helpers');

const backupFiles = (app, type) => fs.readdirSync(app.backupsDir).filter((file) => (
    type === 'manual' ? /^bookmarkranger-\d/.test(file) : file.startsWith(`bookmarkranger-${type}-`)
));

function stamp(daysAgo) {
    return new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString().replace(/[:.]/g, '-');
}

// A database as an older version left it: only the first migrations applied.
function oldDatabase(app) {
    const dir = path.join(app.dir, 'old-schema');
    const migrations = path.join(dir, 'migrations');
    fs.mkdirSync(migrations, { recursive: true });
    fs.copyFileSync(path.join(ROOT, 'prisma', 'schema.prisma'), path.join(dir, 'schema.prisma'));
    fs.copyFileSync(path.join(ROOT, 'prisma', 'migrations', 'migration_lock.toml'), path.join(migrations, 'migration_lock.toml'));
    const names = fs.readdirSync(path.join(ROOT, 'prisma', 'migrations')).filter((name) => /^\d/.test(name)).sort().slice(0, 3);
    for (const name of names) {
        fs.cpSync(path.join(ROOT, 'prisma', 'migrations', name), path.join(migrations, name), { recursive: true });
    }
    const file = path.join(dir, 'old.db');
    migrate(fileUrl(file), path.join(dir, 'schema.prisma'));
    return file;
}

async function withRawDb(file, callback) {
    const client = new PrismaClient({ datasourceUrl: fileUrl(file) });
    try {
        return await callback(client);
    } finally {
        await client.$disconnect();
    }
}

const upload = (app, file) => app.post('/settings/backups/upload', null, {
    raw: fs.readFileSync(file),
    headers: { 'content-type': 'application/octet-stream' }
});

describe('backups', () => {
    let app;
    let db;

    before(async () => {
        app = await new TestApp().start();
        await app.setup();
        db = app.db();
    });

    after(async () => {
        await db.$disconnect();
        await app.destroy();
    });

    test('manual backup is a complete, valid copy', async () => {
        await app.post('/bookmarks/boards', { name: 'In backup' });
        const res = await app.post('/settings/backups');
        assert.strictEqual(res.status, 302);

        const [file] = backupFiles(app, 'manual');
        const boards = await withRawDb(path.join(app.backupsDir, file), (client) => client.board.count({ where: { name: 'In backup' } }));
        assert.strictEqual(boards, 1);
    });

    test('backups can be downloaded and deleted, other paths cannot', async () => {
        const [file] = backupFiles(app, 'manual');
        const download = await app.get(`/settings/backups/${file}`);
        assert.strictEqual(download.status, 200);

        for (const name of ['..%2f..%2fapp.js', '..%2fdata%2ftest.db', 'other.db']) {
            assert.strictEqual((await app.get(`/settings/backups/${name}`)).status, 404, name);
            assert.strictEqual((await app.post(`/settings/backups/${name}/delete`)).status, 404, name);
            assert.strictEqual((await app.post(`/settings/backups/${name}/restore`)).status, 404, name);
        }

        const copy = `bookmarkranger-${stamp(0)}.db`;
        fs.copyFileSync(path.join(app.backupsDir, file), path.join(app.backupsDir, copy));
        assert.strictEqual((await app.post(`/settings/backups/${copy}/delete`)).status, 302);
        assert.ok(!fs.existsSync(path.join(app.backupsDir, copy)));
    });

    test('settings are stored and out-of-range values are limited', async () => {
        await app.post('/settings/backups/settings', { autoBackupEnabled: 'true', autoBackupIntervalDays: '3', backupKeepCount: '5', backupKeepDays: '60' });
        let settings = await db.settings.findFirst();
        assert.deepStrictEqual([settings.autoBackupEnabled, settings.autoBackupIntervalDays, settings.backupKeepCount, settings.backupKeepDays], [true, 3, 5, 60]);

        await app.post('/settings/backups/settings', { autoBackupIntervalDays: '0', backupKeepCount: '-4', backupKeepDays: 'abc' });
        settings = await db.settings.findFirst();
        assert.deepStrictEqual([settings.autoBackupEnabled, settings.autoBackupIntervalDays, settings.backupKeepCount, settings.backupKeepDays], [false, 1, 1, 60]);
    });

    test('garbage and foreign files are refused on upload', async () => {
        const before = fs.readdirSync(app.backupsDir).length;

        const garbage = await app.post('/settings/backups/upload', null, { raw: Buffer.from('not a database'), headers: { 'content-type': 'application/octet-stream' } });
        assert.strictEqual(garbage.status, 400);
        assert.strictEqual(JSON.parse(garbage.text).message, 'invalid');

        const corrupt = Buffer.concat([Buffer.from('SQLite format 3\0'), Buffer.alloc(4096, 7)]);
        const broken = await app.post('/settings/backups/upload', null, { raw: corrupt, headers: { 'content-type': 'application/octet-stream' } });
        assert.strictEqual(JSON.parse(broken.text).message, 'invalid');

        const foreignFile = path.join(app.dir, 'foreign.db');
        await withRawDb(foreignFile, (client) => client.$executeRawUnsafe('CREATE TABLE Other (id INTEGER)'));
        assert.strictEqual(JSON.parse((await upload(app, foreignFile)).text).message, 'invalid');

        assert.strictEqual(fs.readdirSync(app.backupsDir).length, before);
    });

    test('a database without an account is refused', async () => {
        const fresh = new TestApp();
        try {
            assert.strictEqual(JSON.parse((await upload(app, fresh.dbPath)).text).message, 'no_account');
        } finally {
            await fresh.destroy();
        }
    });

    test('a backup from a newer version is refused', async () => {
        const [file] = backupFiles(app, 'manual');
        const newer = path.join(app.dir, 'newer.db');
        fs.copyFileSync(path.join(app.backupsDir, file), newer);
        await withRawDb(newer, (client) => client.$executeRawUnsafe(
            "INSERT INTO _prisma_migrations (id, checksum, migration_name, started_at, applied_steps_count) VALUES ('x', 'x', '29990101000000_future', 0, 1)"
        ));
        assert.strictEqual(JSON.parse((await upload(app, newer)).text).message, 'newer');
    });

    test('a failed restore changes nothing and keeps the session', async () => {
        await db.$disconnect();
        const [file] = backupFiles(app, 'manual');
        const broken = path.join(app.dir, 'broken.db');
        fs.copyFileSync(path.join(app.backupsDir, file), broken);
        // A half-applied migration: valid at first sight, but "migrate deploy" refuses it.
        await withRawDb(broken, (client) => client.$executeRawUnsafe(
            "UPDATE _prisma_migrations SET finished_at = NULL WHERE migration_name = (SELECT MAX(migration_name) FROM _prisma_migrations)"
        ));
        await upload(app, broken);
        const [uploaded] = backupFiles(app, 'upload');
        const safetyBefore = backupFiles(app, 'safety').length;
        const liveBefore = fs.readFileSync(app.dbPath);

        const res = await app.post(`/settings/backups/${uploaded}/restore`);
        assert.match(res.location, /message=failed$/);
        assert.ok(liveBefore.equals(fs.readFileSync(app.dbPath)));
        assert.strictEqual(backupFiles(app, 'safety').length, safetyBefore);
        assert.strictEqual((await app.get('/settings/backups')).status, 200);
        assert.ok(!fs.readdirSync(app.dataDir).some((name) => name.includes('.restore')));
        fs.rmSync(path.join(app.backupsDir, uploaded));
    });

    test('restore replaces the data, keeps a safety copy and ends all sessions', async () => {
        const [file] = backupFiles(app, 'manual');
        await app.post('/bookmarks/boards', { name: 'After backup' });
        await db.$disconnect();

        const res = await app.post(`/settings/backups/${file}/restore`);
        assert.strictEqual(res.status, 302);
        assert.match(res.location, /\/login\?restored=1$/);
        assert.ok((await app.get(res.location, { anon: true })).text.includes('Bitte melde dich neu an'));

        const check = app.db();
        assert.strictEqual(await check.board.count({ where: { name: 'After backup' } }), 0);
        assert.strictEqual(await check.board.count({ where: { name: 'In backup' } }), 1);
        await check.$disconnect();

        const [safety] = backupFiles(app, 'safety');
        const kept = await withRawDb(path.join(app.backupsDir, safety), (client) => client.board.count({ where: { name: 'After backup' } }));
        assert.strictEqual(kept, 1);

        assert.strictEqual((await app.get('/')).status, 302);
        assert.strictEqual((await app.post('/login', { username: 'tester', password: PASSWORD })).status, 302);
        assert.strictEqual((await app.get('/settings/backups')).status, 200);
    });

    test('a backup from an older version is migrated on restore', async () => {
        const old = oldDatabase(app);
        await withRawDb(old, (client) => client.$executeRawUnsafe(
            "INSERT INTO Account (username, passwordHash, createdAt) VALUES ('tester', '$2b$10$abcdefghijklmnopqrstuuJ7bJ0N8v0k8l1Xz3z3z3z3z3z3z3z3z', 0)"
        ));

        const uploaded = await upload(app, old);
        assert.strictEqual(JSON.parse(uploaded.text).message, 'uploaded');
        const [file] = backupFiles(app, 'upload');

        const res = await app.post(`/settings/backups/${file}/restore`);
        assert.match(res.location, /\/login\?restored=1$/);

        const check = app.db();
        assert.strictEqual((await check.settings.count()), 0);
        const columns = await check.$queryRawUnsafe('PRAGMA table_info(Settings)');
        assert.ok(columns.some((column) => column.name === 'autoBackupIntervalDays'));
        await check.$disconnect();
        assert.strictEqual((await app.get('/login')).status, 200);
    });
});

describe('automatic backups', () => {
    let app;

    before(async () => {
        app = await new TestApp().start();
        await app.setup();
    });

    after(() => app.destroy());

    test('no backup happens before setup', async () => {
        const fresh = await new TestApp().start();
        try {
            assert.strictEqual((await fresh.get('/api/health')).status, 200);
            await fresh.stop();
            assert.deepStrictEqual(fs.readdirSync(fresh.backupsDir), []);
        } finally {
            await fresh.destroy();
        }
    });

    test('a start catches up on a due backup, but not twice', async () => {
        await app.stop();
        await app.start();
        await waitFor(() => backupFiles(app, 'auto').length === 1);

        await app.stop();
        await app.start();
        await app.get('/api/health');
        await new Promise((resolve) => setTimeout(resolve, 500));
        assert.strictEqual(backupFiles(app, 'auto').length, 1);
    });

    test('the interval counts in days', async () => {
        const db = app.db();
        await db.settings.updateMany({ data: { autoBackupIntervalDays: 3 } });
        await db.$disconnect();
        for (const file of backupFiles(app, 'auto')) fs.rmSync(path.join(app.backupsDir, file));
        const source = backupSource(app);

        fs.copyFileSync(source, path.join(app.backupsDir, `bookmarkranger-auto-${stamp(2)}.db`));
        await app.stop();
        await app.start();
        await new Promise((resolve) => setTimeout(resolve, 500));
        assert.strictEqual(backupFiles(app, 'auto').length, 1, 'not due after 2 of 3 days');

        fs.rmSync(path.join(app.backupsDir, backupFiles(app, 'auto')[0]));
        fs.copyFileSync(source, path.join(app.backupsDir, `bookmarkranger-auto-${stamp(4)}.db`));
        await app.stop();
        await app.start();
        await waitFor(() => backupFiles(app, 'auto').length === 2);
    });

    test('retention keeps the newest ones and never touches other types', async () => {
        const db = app.db();
        await db.settings.updateMany({ data: { backupKeepCount: 2, backupKeepDays: 30 } });
        await db.$disconnect();
        const source = backupSource(app);
        for (const file of backupFiles(app, 'auto')) fs.rmSync(path.join(app.backupsDir, file));

        const auto = (days) => `bookmarkranger-auto-${stamp(days)}.db`;
        const files = {
            newest: auto(0),
            second: auto(40),
            old: auto(50),
            older: auto(60),
            recentThird: null,
            manual: `bookmarkranger-${stamp(400)}.db`,
            safety: `bookmarkranger-safety-${stamp(400)}.db`,
            uploaded: `bookmarkranger-upload-${stamp(400)}.db`
        };
        for (const name of Object.values(files).filter(Boolean)) fs.copyFileSync(source, path.join(app.backupsDir, name));

        await app.stop();
        await app.start();
        await waitFor(() => !fs.existsSync(path.join(app.backupsDir, files.older)));

        const left = fs.readdirSync(app.backupsDir);
        for (const kept of [files.newest, files.second, files.manual, files.safety, files.uploaded]) assert.ok(left.includes(kept), kept);
        assert.ok(!left.includes(files.old));
    });

    test('nothing runs while automatic backups are off', async () => {
        const db = app.db();
        await db.settings.updateMany({ data: { autoBackupEnabled: false } });
        await db.$disconnect();
        for (const file of backupFiles(app, 'auto')) fs.rmSync(path.join(app.backupsDir, file));

        await app.stop();
        await app.start();
        await new Promise((resolve) => setTimeout(resolve, 500));
        assert.strictEqual(backupFiles(app, 'auto').length, 0);
    });
});

function backupSource(app) {
    const dest = path.join(app.dir, 'source.db');
    fs.copyFileSync(app.dbPath, dest);
    return dest;
}

async function waitFor(condition) {
    for (let i = 0; i < 100; i++) {
        if (condition()) return;
        await new Promise((resolve) => setTimeout(resolve, 100));
    }
    assert.fail('Condition not reached in time');
}
