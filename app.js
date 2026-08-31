require('dotenv').config();

const path = require('path');
const express = require('express');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const middleware = require('i18next-http-middleware');

const i18next = require('./config/i18n');
const { ensureSetup, requireAuth } = require('./middleware/auth');

const setupRoutes = require('./routes/setupRoutes');
const authRoutes = require('./routes/authRoutes');
const indexRoutes = require('./routes/indexRoutes');
const bookmarkRoutes = require('./routes/bookmarkRoutes');
const snippetRoutes = require('./routes/snippetRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const dashboardGroupRoutes = require('./routes/dashboardGroupRoutes');

const PRESETS = require('./config/themes');
const prisma = require('./config/db');
const { getSettings, getThemeBase } = require('./utils/settings');
const { timeAgo } = require('./utils/timeAgo');
const { logoVariantFor, resolveTheme } = require('./utils/color');

const app = express();
const PORT = process.env.PORT || 3099;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(middleware.handle(i18next));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    store: new FileStore({ path: path.join(__dirname, 'data', 'sessions'), retries: 0, logFn: () => {} }),
    secret: process.env.SESSION_SECRET || 'dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 30 }
}));

app.use(async (req, res, next) => {
    res.locals.t = req.t;
    res.locals.currentLng = req.language || 'de';
    res.locals.baseUrl = process.env.BASE_URL || '';
    res.locals.allThemes = PRESETS;
    res.locals.resolveTheme = resolveTheme;
    res.locals.appVersion = require('./package.json').version;
    res.locals.timeAgo = timeAgo;
    res.locals.user = null;
    res.locals.settings = await getSettings();

    const activePreset = await getThemeBase(res.locals.settings.themePreset);
    const theme = resolveTheme(activePreset);
    res.locals.theme = theme;
    res.locals.isDark = theme.isDarkBg;
    // Which logo file (light-text vs dark-text) reads best is derived from the navbar's
    // actual color, not hardcoded per preset, so this also works for future custom themes.
    res.locals.logoVariant = logoVariantFor(theme.navbar);

    if (req.session && req.session.userId) {
        const account = await prisma.account.findUnique({ where: { id: req.session.userId } });
        if (account) res.locals.user = account;
    }

    next();
});

app.use(ensureSetup);

app.use('/setup', setupRoutes);
app.use('/', authRoutes);
app.use('/', requireAuth, indexRoutes);
app.use('/bookmarks', requireAuth, bookmarkRoutes);
app.use('/snippets', requireAuth, snippetRoutes);
app.use('/settings', requireAuth, settingsRoutes);
app.use('/dashboard-groups', requireAuth, dashboardGroupRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use((req, res) => res.status(404).render('404', { title: '404' }));

app.listen(PORT, () => console.log(`BookmarkRanger listening on port ${PORT}`));

module.exports = app;
