const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');

// The Docker volumes mount exactly these defaults — the overrides exist so the test suite
// can run against throwaway folders instead of a real installation's data.
const DATA_DIR = process.env.DATA_DIR || path.join(ROOT_DIR, 'data');
const BACKUPS_DIR = process.env.BACKUPS_DIR || path.join(ROOT_DIR, 'backups');

module.exports = { ROOT_DIR, DATA_DIR, BACKUPS_DIR };
