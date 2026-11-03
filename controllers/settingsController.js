const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Transform } = require('stream');
const { pipeline } = require('stream/promises');
const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const PRESETS = require('../config/themes');
const { getSettings } = require('../utils/settings');
const { getChangelog } = require('../utils/changelog');
const { BACKUPS_DIR } = require('../config/paths');
const backups = require('../utils/backups');

const MAX_UPLOAD_BYTES = 256 * 1024 * 1024;
const REPO_URL = 'https://github.com/xXJimnyCricketXx/BookmarkRanger';

function settingsTitle(res, tab) {
    return `${res.locals.t('nav.settings')} — ${res.locals.t(`settings.nav_${tab}`)}`;
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

const BACKUP_MESSAGES = {
    created: false, saved: false, uploaded: false, deleted: false,
    invalid: true, newer: true, no_account: true, too_large: true, failed: true
};

function backupsRedirect(res, message) {
    res.redirect(`${res.locals.baseUrl}/settings/backups?message=${message}`);
}

function backupErrorMessage(err) {
    if (err instanceof backups.BackupError) return err.code;
    console.error(err);
    return 'failed';
}

function intInRange(value, min, max, fallback) {
    const number = parseInt(value, 10);
    if (Number.isNaN(number)) return fallback;
    return Math.min(Math.max(number, min), max);
}

exports.showBackups = async (req, res) => {
    const settings = await getSettings();
    const key = req.query.message;
    const message = Object.hasOwn(BACKUP_MESSAGES, key) ? { key, isError: BACKUP_MESSAGES[key] } : null;
    res.render('settings-backups', { title: settingsTitle(res, 'backups'), settings, backups: backups.listBackups(), message });
};

exports.saveBackupSettings = async (req, res) => {
    const settings = await getSettings();
    const updated = await prisma.settings.update({
        where: { id: settings.id },
        data: {
            autoBackupEnabled: req.body.autoBackupEnabled === 'true',
            autoBackupIntervalDays: intInRange(req.body.autoBackupIntervalDays, 1, 365, settings.autoBackupIntervalDays),
            backupKeepCount: intInRange(req.body.backupKeepCount, 1, 1000, settings.backupKeepCount),
            backupKeepDays: intInRange(req.body.backupKeepDays, 1, 3650, settings.backupKeepDays)
        }
    });
    if (updated.autoBackupEnabled) backups.applyRetention(updated);
    backupsRedirect(res, 'saved');
};

exports.createBackup = async (req, res) => {
    await backups.createBackup();
    backupsRedirect(res, 'created');
};

exports.downloadBackup = (req, res) => {
    const file = backups.resolveBackup(req.params.file);
    if (!file) return res.status(404).render('404', { title: '404' });
    res.download(file);
};

exports.deleteBackup = (req, res) => {
    if (!backups.deleteBackup(req.params.file)) return res.status(404).render('404', { title: '404' });
    backupsRedirect(res, 'deleted');
};

// Sent as the raw request body by the page's script, and streamed to disk because a backup
// can be far larger than what the form parsers accept.
exports.uploadBackup = async (req, res) => {
    if (!req.is('application/octet-stream')) return res.status(400).json({ message: 'invalid' });

    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
    const temp = path.join(BACKUPS_DIR, `upload-${crypto.randomBytes(8).toString('hex')}.tmp`);
    let received = 0;
    const limiter = new Transform({
        transform(chunk, encoding, callback) {
            received += chunk.length;
            if (received > MAX_UPLOAD_BYTES) return callback(new backups.BackupError('too_large'));
            callback(null, chunk);
        }
    });

    try {
        await pipeline(req, limiter, fs.createWriteStream(temp));
        await backups.validateBackup(temp);
        fs.renameSync(temp, path.join(BACKUPS_DIR, backups.newFileName('upload')));
        res.json({ message: 'uploaded' });
    } catch (err) {
        const message = backupErrorMessage(err);
        res.status(message === 'too_large' ? 413 : message === 'failed' ? 500 : 400).json({ message });
    } finally {
        fs.rmSync(temp, { force: true });
        fs.rmSync(`${temp}-journal`, { force: true });
    }
};

exports.restoreBackup = async (req, res) => {
    if (!backups.resolveBackup(req.params.file)) return res.status(404).render('404', { title: '404' });

    try {
        await backups.restoreBackup(req.params.file);
    } catch (err) {
        return backupsRedirect(res, backupErrorMessage(err));
    }

    // The restored data can hold another password, so every open session ends here.
    const store = req.sessionStore;
    req.session.destroy(() => {
        store.clear(() => res.redirect(`${res.locals.baseUrl}/login?restored=1`));
    });
};
