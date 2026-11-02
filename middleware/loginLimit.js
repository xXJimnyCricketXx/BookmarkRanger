const MAX_FAILURES = 10;
const WINDOW_MS = 15 * 60 * 1000;

// In-memory only, same reasoning as the weather cache — a restart resetting the counter
// doesn't matter for slowing down password guessing on a single-account app.
const failures = new Map();

function isLimited(ip) {
    const entry = failures.get(ip);
    if (!entry) return false;
    if (entry.resetAt <= Date.now()) {
        failures.delete(ip);
        return false;
    }
    return entry.count >= MAX_FAILURES;
}

function limitLogin(req, res, next) {
    if (!isLimited(req.ip)) return next();
    res.status(429).render('login', { title: 'Anmelden', error: 'login.too_many_attempts' });
}

function recordFailure(ip) {
    const now = Date.now();
    for (const [key, entry] of failures) {
        if (entry.resetAt <= now) failures.delete(key);
    }
    const entry = failures.get(ip) || { count: 0, resetAt: now + WINDOW_MS };
    entry.count += 1;
    failures.set(ip, entry);
}

function clearFailures(ip) {
    failures.delete(ip);
}

module.exports = { limitLogin, recordFailure, clearFailures };
