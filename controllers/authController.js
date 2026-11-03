const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const { startSession } = require('../middleware/auth');
const { recordFailure, clearFailures } = require('../middleware/loginLimit');

exports.showLogin = (req, res) => {
    if (req.session.userId) return res.redirect(`${res.locals.baseUrl}/`);
    res.render('login', { title: res.locals.t('login.title'), error: null, notice: req.query.restored ? 'login.restored' : null });
};

exports.login = async (req, res) => {
    const { username, password } = req.body;
    const validInput = typeof username === 'string' && typeof password === 'string';
    const account = validInput ? await prisma.account.findUnique({ where: { username } }) : null;

    if (!account || !(await bcrypt.compare(password, account.passwordHash))) {
        recordFailure(req.ip);
        return res.render('login', { title: res.locals.t('login.title'), error: 'login.invalid' });
    }

    clearFailures(req.ip);
    await startSession(req, account);
    res.redirect(`${res.locals.baseUrl}/`);
};

exports.logout = (req, res) => {
    req.session.destroy(() => res.redirect(`${res.locals.baseUrl}/login`));
};
