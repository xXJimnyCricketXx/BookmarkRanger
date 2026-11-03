require('dotenv').config({ quiet: true });
const { defineConfig } = require('prisma/config');
const { dbFilePath, fileUrl } = require('./config/paths');

module.exports = defineConfig({
    schema: 'prisma/schema.prisma',
    migrations: { seed: 'node prisma/seed.js' },
    datasource: { url: fileUrl(dbFilePath()) }
});
