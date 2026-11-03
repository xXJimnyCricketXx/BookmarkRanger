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
    // res.locals.user, not just the session: after a restore the account behind an old
    // session may no longer exist.
    if (res.locals.user) return next();
    res.redirect(`${res.locals.baseUrl}/login`);
}

// A fresh session id on login, so an id planted in the browser beforehand stays worthless.
function startSession(req, account) {
    return new Promise((resolve, reject) => {
        req.session.regenerate((err) => {
            if (err) return reject(err);
            req.session.userId = account.id;
            req.session.username = account.username;
            resolve();
        });
    });
}

module.exports = { ensureSetup, requireAuth, startSession };
