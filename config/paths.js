const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');

// The Docker volumes mount exactly these defaults — the overrides exist so the test suite
// can run against throwaway folders instead of a real installation's data.
const DATA_DIR = process.env.DATA_DIR || path.join(ROOT_DIR, 'data');
const BACKUPS_DIR = process.env.BACKUPS_DIR || path.join(ROOT_DIR, 'backups');

// A relative sqlite "file:" path has always meant relative to the prisma folder, and existing
// installations rely on that. The driver would otherwise read it relative to the working directory.
function dbFilePath() {
    const raw = (process.env.DATABASE_URL || '').replace(/^file:/, '').split('?')[0];
    return path.resolve(ROOT_DIR, 'prisma', raw);
}

function fileUrl(filePath) {
    return `file:${filePath.split(path.sep).join('/')}`;
}

module.exports = { ROOT_DIR, DATA_DIR, BACKUPS_DIR, dbFilePath, fileUrl };
