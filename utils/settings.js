const prisma = require('../config/db');

async function getSettings() {
    let settings = await prisma.settings.findFirst();
    if (!settings) {
        settings = await prisma.settings.create({ data: {} });
    }
    return settings;
}

module.exports = { getSettings };
