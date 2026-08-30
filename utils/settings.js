const prisma = require('../config/db');
const PRESETS = require('../config/themes');

async function getSettings() {
    let settings = await prisma.settings.findFirst({ include: { fallbackSearchProvider: true } });
    if (!settings) {
        settings = await prisma.settings.create({ data: {}, include: { fallbackSearchProvider: true } });
    }
    return settings;
}

// User-created themes are stored in the DB and referenced as "custom-<id>",
// system themes are the hardcoded presets in config/themes.js.
async function getThemeBase(themePresetKey) {
    if (themePresetKey && themePresetKey.startsWith('custom-')) {
        const id = parseInt(themePresetKey.slice(7), 10);
        const custom = await prisma.customTheme.findUnique({ where: { id } });
        if (custom) return custom;
    }
    return PRESETS[themePresetKey] || PRESETS.bookmarkranger;
}

module.exports = { getSettings, getThemeBase };
