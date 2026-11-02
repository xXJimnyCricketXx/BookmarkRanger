const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const { startSession } = require('../middleware/auth');

exports.showSetup = (req, res) => {
    res.render('setup', { title: 'Einrichtung', error: null });
};

exports.setup = async (req, res) => {
    const existing = await prisma.account.count();
    if (existing > 0) return res.redirect(`${res.locals.baseUrl}/login`);

    const { username, password, passwordConfirm } = req.body;

    if (typeof username !== 'string' || !username || typeof password !== 'string' || password.length < 6 || password !== passwordConfirm) {
        return res.render('setup', { title: 'Einrichtung', error: 'setup.invalid' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const account = await prisma.account.create({ data: { username, passwordHash } });

    await startSession(req, account);
    res.redirect(`${res.locals.baseUrl}/`);
};
