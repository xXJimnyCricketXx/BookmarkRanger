const bcrypt = require('bcryptjs');
const prisma = require('../config/db');

exports.showSetup = (req, res) => {
    res.render('setup', { title: 'Setup', error: null });
};

exports.setup = async (req, res) => {
    const existing = await prisma.account.count();
    if (existing > 0) return res.redirect(`${res.locals.baseUrl}/login`);

    const { username, password, passwordConfirm } = req.body;

    if (!username || !password || password.length < 6 || password !== passwordConfirm) {
        return res.render('setup', { title: 'Setup', error: 'setup.invalid' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const account = await prisma.account.create({ data: { username, passwordHash } });

    req.session.userId = account.id;
    req.session.username = account.username;
    res.redirect(`${res.locals.baseUrl}/`);
};
