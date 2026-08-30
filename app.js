require('dotenv').config();

const path = require('path');
const express = require('express');
const session = require('express-session');
const middleware = require('i18next-http-middleware');

const i18next = require('./config/i18n');
const { ensureSetup, requireAuth } = require('./middleware/auth');

const setupRoutes = require('./routes/setupRoutes');
const authRoutes = require('./routes/authRoutes');
const indexRoutes = require('./routes/indexRoutes');
const bookmarkRoutes = require('./routes/bookmarkRoutes');
const snippetRoutes = require('./routes/snippetRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

const PRESETS = require('./config/themes');
const prisma = require('./config/db');
const { getSettings } = require('./utils/settings');

const app = express();
const PORT = process.env.PORT || 3099;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(middleware.handle(i18next));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
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
    res.locals.appVersion = '0.1.0';
    res.locals.user = null;
    res.locals.isDark = true;
    res.locals.settings = await getSettings();

    if (req.session && req.session.userId) {
        const account = await prisma.account.findUnique({ where: { id: req.session.userId } });
        if (account) {
            res.locals.user = account;
            res.locals.isDark = account.theme !== 'light';
        }
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

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use((req, res) => res.status(404).render('404', { title: '404' }));

app.listen(PORT, () => console.log(`BookmarkRanger listening on port ${PORT}`));

module.exports = app;
