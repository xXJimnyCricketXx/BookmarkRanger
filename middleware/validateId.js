// SQLite ids are 32-bit here — "abc" or an oversized number can't match anything, and
// would otherwise reach Prisma as an invalid argument and end in a 500.
const MAX_ID = 2147483647;

function validateId(req, res, next, value) {
    if (/^\d+$/.test(value) && Number(value) <= MAX_ID) return next();
    res.status(404).render('404', { title: '404' });
}

module.exports = { validateId };
