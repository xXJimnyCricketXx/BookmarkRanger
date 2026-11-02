const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const PRESETS = require('../config/themes');
const { getSettings } = require('../utils/settings');
const { getChangelog } = require('../utils/changelog');

const BACKUPS_DIR = path.join(__dirname, '..', 'backups');
const REPO_URL = 'https://github.com/xXJimnyCricketXx/BookmarkRanger';

function settingsTitle(res, tab) {
    return `${res.locals.t('nav.settings')} — ${res.locals.t(`settings.nav_${tab}`)}`;
}

function dbFilePath() {
    // Prisma resolves a relative sqlite "file:" path relative to prisma/schema.prisma,
    // not the project root, so the backup source path must match that.
    const raw = (process.env.DATABASE_URL || '').replace(/^file:/, '');
    return path.join(__dirname, '..', 'prisma', raw);
}

exports.showTheme = async (req, res) => {
    const settings = await getSettings();
    const customThemes = await prisma.customTheme.findMany({ orderBy: { id: 'asc' } });
    res.render('settings-theme', { title: settingsTitle(res, 'theme'), settings, presets: PRESETS, customThemes });
};

exports.saveTheme = async (req, res) => {
    const settings = await getSettings();
    await prisma.settings.update({ where: { id: settings.id }, data: { themePreset: req.body.preset } });
    res.redirect(`${res.locals.baseUrl}/settings/theme`);
};

exports.showAddCustomTheme = (req, res) => {
    // "customTheme", not "theme" — the latter is the resolved site-wide theme header.ejs
    // renders its CSS variables from, and would get shadowed by this raw DB row otherwise.
    res.render('settings-theme-custom-form', { title: settingsTitle(res, 'theme'), customTheme: null });
};

exports.showEditCustomTheme = async (req, res) => {
    const customTheme = await prisma.customTheme.findUnique({ where: { id: parseInt(req.params.id, 10) } });
    if (!customTheme) return res.status(404).render('404', { title: '404' });
    res.render('settings-theme-custom-form', { title: settingsTitle(res, 'theme'), customTheme });
};

exports.createCustomTheme = async (req, res) => {
    const { name, bg, text, accent, header } = req.body;
    await prisma.customTheme.create({ data: { name, bg, text, accent, header } });
    res.redirect(`${res.locals.baseUrl}/settings/theme`);
};

exports.updateCustomTheme = async (req, res) => {
    const { name, bg, text, accent, header } = req.body;
    await prisma.customTheme.update({
        where: { id: parseInt(req.params.id, 10) },
        data: { name, bg, text, accent, header }
    });
    res.redirect(`${res.locals.baseUrl}/settings/theme`);
};

exports.deleteCustomTheme = async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const settings = await getSettings();

    if (settings.themePreset === `custom-${id}`) {
        await prisma.settings.update({ where: { id: settings.id }, data: { themePreset: 'bookmarkranger' } });
    }

    await prisma.customTheme.delete({ where: { id } });
    res.redirect(`${res.locals.baseUrl}/settings/theme`);
};

exports.showGeneral = async (req, res) => {
    const settings = await getSettings();
    const searchProviders = await prisma.searchProvider.findMany({ orderBy: { id: 'asc' } });
    res.render('settings-general', { title: settingsTitle(res, 'general'), settings, searchProviders });
};

exports.saveGeneral = async (req, res) => {
    const settings = await getSettings();
    await prisma.settings.update({
        where: { id: settings.id },
        data: {
            sortingType: req.body.sortingType,
            pinCategoriesByDefault: req.body.pinCategoriesByDefault === 'true',
            pinBookmarksByDefault: req.body.pinBookmarksByDefault === 'true',
            pinSnippetsByDefault: req.body.pinSnippetsByDefault === 'true',
            openLinksInNewTab: req.body.openLinksInNewTab === 'true',
            fallbackSearchProviderId: req.body.fallbackSearchProviderId ? parseInt(req.body.fallbackSearchProviderId, 10) : null
        }
    });
    res.redirect(`${res.locals.baseUrl}/settings/general`);
};

exports.showInterface = async (req, res) => {
    const settings = await getSettings();
    res.render('settings-interface', { title: settingsTitle(res, 'interface'), settings });
};

exports.saveInterface = async (req, res) => {
    const settings = await getSettings();
    const { customGreetings, customWeekdayNames, customMonthNames } = req.body;

    await prisma.settings.update({
        where: { id: settings.id },
        data: {
            siteName: req.body.siteName || 'BookmarkRanger',
            hideSearchBar: req.body.hideSearchBar === 'true',
            disableSearchAutofocus: req.body.disableSearchAutofocus === 'true',
            hideBookmarksSection: req.body.hideBookmarksSection === 'true',
            hideSnippetsSection: req.body.hideSnippetsSection === 'true',
            hideHeadline: req.body.hideHeadline === 'true',
            hideDate: req.body.hideDate === 'true',
            hideTime: req.body.hideTime === 'true',
            hideWeather: req.body.hideWeather === 'true',
            dateFormat: req.body.dateFormat === 'month-first' ? 'month-first' : 'day-first',
            // Each list needs its exact expected count (4 greetings, 7 weekdays, 12 months) —
            // a malformed value would otherwise index out of bounds when the header renders.
            customGreetings: splitList(customGreetings).length === 4 ? customGreetings.trim() : settings.customGreetings,
            customWeekdayNames: splitList(customWeekdayNames).length === 7 ? customWeekdayNames.trim() : settings.customWeekdayNames,
            customMonthNames: splitList(customMonthNames).length === 12 ? customMonthNames.trim() : settings.customMonthNames
        }
    });
    res.redirect(`${res.locals.baseUrl}/settings/interface`);
};

exports.showWeather = async (req, res) => {
    const settings = await getSettings();
    res.render('settings-weather', { title: settingsTitle(res, 'weather'), settings });
};

exports.saveWeather = async (req, res) => {
    const settings = await getSettings();
    const lat = parseFloat(req.body.weatherLat);
    const lon = parseFloat(req.body.weatherLon);

    await prisma.settings.update({
        where: { id: settings.id },
        data: {
            weatherLat: Number.isFinite(lat) ? lat : null,
            weatherLon: Number.isFinite(lon) ? lon : null,
            weatherUnit: req.body.weatherUnit === 'fahrenheit' ? 'fahrenheit' : 'celsius',
            weatherExtra: req.body.weatherExtra === 'cloud_coverage' ? 'cloud_coverage' : 'humidity'
        }
    });
    res.redirect(`${res.locals.baseUrl}/settings/weather`);
};

function splitList(value) {
    return (value || '').split(';').map((s) => s.trim()).filter(Boolean);
}

exports.showAccount = async (req, res) => {
    const account = await prisma.account.findUnique({ where: { id: req.session.userId } });
    res.render('settings-account', { title: settingsTitle(res, 'account'), account, error: null, success: null });
};

exports.updateAccount = async (req, res) => {
    const { username, language, currentPassword, newPassword, newPasswordConfirm } = req.body;
    const account = await prisma.account.findUnique({ where: { id: req.session.userId } });

    if (typeof currentPassword !== 'string' || !(await bcrypt.compare(currentPassword, account.passwordHash))) {
        return res.render('settings-account', { title: settingsTitle(res, 'account'), account, error: 'account.wrong_password', success: null });
    }

    const data = { username: username || account.username };
    if (language === 'de' || language === 'en') data.language = language;
    if (newPassword) {
        if (newPassword !== newPasswordConfirm || newPassword.length < 6) {
            return res.render('settings-account', { title: settingsTitle(res, 'account'), account, error: 'account.invalid_password', success: null });
        }
        data.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    const updated = await prisma.account.update({ where: { id: account.id }, data });
    req.session.username = updated.username;

    // Applies immediately on this same response — app.js also re-applies it on every
    // later request from the account itself, but that only takes effect once this
    // handler's own render has already picked a language for the page it's showing.
    if (data.language) {
        await req.i18n.changeLanguage(data.language);
        res.locals.t = req.t;
        res.locals.currentLng = req.language;
    }

    res.render('settings-account', { title: settingsTitle(res, 'account'), account: updated, error: null, success: 'account.saved' });
};

exports.showApp = (req, res) => {
    res.render('settings-app', { title: settingsTitle(res, 'app'), repoUrl: REPO_URL, changelog: getChangelog() });
};

exports.showBackups = (req, res) => {
    if (!fs.existsSync(BACKUPS_DIR)) fs.mkdirSync(BACKUPS_DIR, { recursive: true });
    const backups = fs.readdirSync(BACKUPS_DIR).filter((f) => f.endsWith('.db')).sort().reverse();
    res.render('settings-backups', { title: settingsTitle(res, 'backups'), backups });
};

exports.createBackup = async (req, res) => {
    if (!fs.existsSync(BACKUPS_DIR)) fs.mkdirSync(BACKUPS_DIR, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const dest = path.join(BACKUPS_DIR, `bookmarkranger-${timestamp}.db`);
    fs.copyFileSync(dbFilePath(), dest);
    res.redirect(`${res.locals.baseUrl}/settings/backups`);
};

exports.downloadBackup = (req, res) => {
    const file = path.join(BACKUPS_DIR, req.params.file);
    if (!file.startsWith(BACKUPS_DIR) || !fs.existsSync(file)) return res.status(404).send('Not found');
    res.download(file);
};
