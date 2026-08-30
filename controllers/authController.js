const bcrypt = require('bcryptjs');
const prisma = require('../config/db');

exports.showLogin = (req, res) => {
    if (req.session.userId) return res.redirect(`${res.locals.baseUrl}/`);
    res.render('login', { title: 'Login', error: null });
};

exports.login = async (req, res) => {
    const { username, password } = req.body;
    const account = await prisma.account.findUnique({ where: { username } });

    if (!account || !(await bcrypt.compare(password, account.passwordHash))) {
        return res.render('login', { title: 'Login', error: 'auth.invalid' });
    }

    req.session.userId = account.id;
    req.session.username = account.username;
    res.redirect(`${res.locals.baseUrl}/`);
};

exports.logout = (req, res) => {
    req.session.destroy(() => res.redirect(`${res.locals.baseUrl}/login`));
};
