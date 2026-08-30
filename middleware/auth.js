const prisma = require('../config/db');

async function ensureSetup(req, res, next) {
    const count = await prisma.account.count();

    if (count === 0) {
        if (req.path.startsWith('/setup')) return next();
        return res.redirect(`${res.locals.baseUrl}/setup`);
    }

    if (req.path.startsWith('/setup')) {
        return res.redirect(`${res.locals.baseUrl}/login`);
    }

    next();
}

function requireAuth(req, res, next) {
    if (req.session && req.session.userId) return next();
    res.redirect(`${res.locals.baseUrl}/login`);
}

module.exports = { ensureSetup, requireAuth };
