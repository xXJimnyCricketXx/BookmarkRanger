const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const { dbFilePath, fileUrl } = require('./paths');

// Existing databases store dates as milliseconds. The driver's default format would write new
// rows as text next to them, which breaks sorting and comparing dates.
function createClient(filePath = dbFilePath()) {
    const adapter = new PrismaBetterSqlite3({ url: fileUrl(filePath) }, { timestampFormat: 'unixepoch-ms' });
    return new PrismaClient({ adapter });
}

module.exports = { createClient };
