require('dotenv').config();

const path = require('path');
const express = require('express');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const middleware = require('i18next-http-middleware');

const i18next = require('./config/i18n');
const { ensureSetup, requireAuth } = require('./middleware/auth');
const { originCheck } = require('./middleware/originCheck');
const { getSessionSecret } = require('./config/sessionSecret');

const setupRoutes = require('./routes/setupRoutes');
const authRoutes = require('./routes/authRoutes');
const indexRoutes = require('./routes/indexRoutes');
const bookmarkRoutes = require('./routes/bookmarkRoutes');
const snippetRoutes = require('./routes/snippetRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const dashboardGroupRoutes = require('./routes/dashboardGroupRoutes');
const sharePageRoutes = require('./routes/sharePageRoutes');
const sharePageController = require('./controllers/sharePageController');

const PRESETS = require('./config/themes');
const prisma = require('./config/db');
const { getSettings, getThemeBase } = require('./utils/settings');
const { timeAgo } = require('./utils/timeAgo');
const { logoVariantFor, resolveTheme } = require('./utils/color');
const { getCurrentVersion } = require('./utils/changelog');

const app = express();
const PORT = process.env.PORT || 3099;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(middleware.handle(i18next));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    store: new FileStore({ path: path.join(__dirname, 'data', 'sessions'), retries: 0, logFn: () => {} }),
    secret: getSessionSecret(),
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 30, sameSite: 'lax' }
}));

app.use(async (req, res, next) => {
    res.locals.t = req.t;
    res.locals.currentLng = req.language || 'de';
    res.locals.baseUrl = process.env.BASE_URL || '';
    res.locals.allThemes = PRESETS;
    res.locals.resolveTheme = resolveTheme;
    res.locals.appVersion = getCurrentVersion();
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
        if (account) {
            res.locals.user = account;
            // The account's saved language is the source of truth once logged in — it
            // must win over the i18next cookie so the preference follows the account
            // across browsers/devices, not just the browser that last set the cookie.
            if (account.language && account.language !== req.language) {
                await req.i18n.changeLanguage(account.language);
                res.locals.t = req.t;
                res.locals.currentLng = req.language;
            }
        }
    }

    next();
});

app.use(originCheck);
// After the locals above, so an oversized or malformed body still gets the normal error page.
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(express.json({ limit: '2mb' }));

app.use(ensureSetup);

app.use('/setup', setupRoutes);
app.use('/', authRoutes);
// Public, unauthenticated share pages — reachable via their own URL, no login required.
app.get('/s/:token', sharePageController.publicView);
app.use('/', requireAuth, indexRoutes);
app.use('/bookmarks', requireAuth, bookmarkRoutes);
app.use('/snippets', requireAuth, snippetRoutes);
app.use('/settings', requireAuth, settingsRoutes);
app.use('/dashboard-groups', requireAuth, dashboardGroupRoutes);
app.use('/shared', requireAuth, sharePageRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use((req, res) => res.status(404).render('404', { title: '404' }));

// Never hands the error itself to the browser — stack traces reveal paths and internals.
// Falls back to plain text if the page can't render, e.g. when the database is down.
app.use((err, req, res, next) => {
    if (res.headersSent) return next(err);
    // Prisma's "record not found" — e.g. renaming or deleting something that's already gone.
    if (err.code === 'P2025') return res.status(404).render('404', { title: '404' });
    const status = err.status || err.statusCode || 500;
    if (status >= 500) console.error(err);
    res.status(status).render('error', { title: String(status), status }, (renderErr, html) => {
        if (renderErr) return res.type('text/plain').send(String(status));
        res.send(html);
    });
});

app.listen(PORT, () => console.log(`BookmarkRanger listening on port ${PORT}`));

module.exports = app;
