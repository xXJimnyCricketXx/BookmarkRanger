const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const PRESETS = require('../config/themes');
const { getSettings } = require('../utils/settings');

const BACKUPS_DIR = path.join(__dirname, '..', 'backups');

function dbFilePath() {
    // Prisma resolves a relative sqlite "file:" path relative to prisma/schema.prisma,
    // not the project root, so the backup source path must match that.
    const raw = (process.env.DATABASE_URL || '').replace(/^file:/, '');
    return path.join(__dirname, '..', 'prisma', raw);
}

exports.updateDarkMode = async (req, res) => {
    const theme = req.body.theme === 'light' ? 'light' : 'dark';
    await prisma.account.update({ where: { id: req.session.userId }, data: { theme } });
    res.json({ ok: true });
};

exports.showTheme = async (req, res) => {
    const settings = await getSettings();
    res.render('settings-theme', { title: 'Settings — Theme', settings, presets: PRESETS });
};

exports.saveTheme = async (req, res) => {
    const settings = await getSettings();
    await prisma.settings.update({ where: { id: settings.id }, data: { themePreset: req.body.preset } });
    res.redirect(`${res.locals.baseUrl}/settings/theme`);
};

exports.showGeneral = async (req, res) => {
    const settings = await getSettings();
    res.render('settings-general', { title: 'Settings — General', settings });
};

exports.saveGeneral = async (req, res) => {
    const settings = await getSettings();
    await prisma.settings.update({
        where: { id: settings.id },
        data: {
            sortingType: req.body.sortingType,
            pinCategoriesByDefault: req.body.pinCategoriesByDefault === 'true',
            openLinksInNewTab: req.body.openLinksInNewTab === 'true'
        }
    });
    res.redirect(`${res.locals.baseUrl}/settings/general`);
};

exports.showInterface = async (req, res) => {
    const settings = await getSettings();
    res.render('settings-interface', { title: 'Settings — Interface', settings });
};

exports.saveInterface = async (req, res) => {
    const settings = await getSettings();
    await prisma.settings.update({
        where: { id: settings.id },
        data: {
            siteName: req.body.siteName || 'BookmarkRanger',
            hideSearchBar: req.body.hideSearchBar === 'true',
            hideBookmarksSection: req.body.hideBookmarksSection === 'true',
            hideSnippetsSection: req.body.hideSnippetsSection === 'true'
        }
    });
    res.redirect(`${res.locals.baseUrl}/settings/interface`);
};

exports.showAccount = async (req, res) => {
    const account = await prisma.account.findUnique({ where: { id: req.session.userId } });
    if (!fs.existsSync(BACKUPS_DIR)) fs.mkdirSync(BACKUPS_DIR, { recursive: true });
    const backups = fs.readdirSync(BACKUPS_DIR)
        .filter((f) => f.endsWith('.db'))
        .sort()
        .reverse();
    res.render('settings-account', { title: 'Settings — Account', account, backups, error: null, success: null });
};

exports.updateAccount = async (req, res) => {
    const { username, currentPassword, newPassword, newPasswordConfirm } = req.body;
    const account = await prisma.account.findUnique({ where: { id: req.session.userId } });

    if (!(await bcrypt.compare(currentPassword, account.passwordHash))) {
        const backups = fs.readdirSync(BACKUPS_DIR).filter((f) => f.endsWith('.db')).sort().reverse();
        return res.render('settings-account', { title: 'Settings — Account', account, backups, error: 'account.wrong_password', success: null });
    }

    const data = { username: username || account.username };
    if (newPassword) {
        if (newPassword !== newPasswordConfirm || newPassword.length < 6) {
            const backups = fs.readdirSync(BACKUPS_DIR).filter((f) => f.endsWith('.db')).sort().reverse();
            return res.render('settings-account', { title: 'Settings — Account', account, backups, error: 'account.invalid_password', success: null });
        }
        data.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    const updated = await prisma.account.update({ where: { id: account.id }, data });
    req.session.username = updated.username;

    const backups = fs.readdirSync(BACKUPS_DIR).filter((f) => f.endsWith('.db')).sort().reverse();
    res.render('settings-account', { title: 'Settings — Account', account: updated, backups, error: null, success: 'account.saved' });
};

exports.createBackup = async (req, res) => {
    if (!fs.existsSync(BACKUPS_DIR)) fs.mkdirSync(BACKUPS_DIR, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const dest = path.join(BACKUPS_DIR, `bookmarkranger-${timestamp}.db`);
    fs.copyFileSync(dbFilePath(), dest);
    res.redirect(`${res.locals.baseUrl}/settings/account`);
};

exports.downloadBackup = (req, res) => {
    const file = path.join(BACKUPS_DIR, req.params.file);
    if (!file.startsWith(BACKUPS_DIR) || !fs.existsSync(file)) return res.status(404).send('Not found');
    res.download(file);
};
