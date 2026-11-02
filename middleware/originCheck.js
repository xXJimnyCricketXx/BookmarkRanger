const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

// Blocks state-changing requests sent by other websites (CSRF). Browsers always attach
// Origin to cross-site POSTs and pages can't forge it, so comparing it with the host this
// request was addressed to is enough. Requests without Origin/Referer come from non-browser
// clients, which don't carry the visitor's session cookie by accident.
function originCheck(req, res, next) {
    if (SAFE_METHODS.has(req.method)) return next();

    const source = req.get('origin') || req.get('referer');
    if (!source) return next();

    let sourceHost = null;
    try {
        sourceHost = new URL(source).host;
    } catch (err) {
        // Unparseable, e.g. "Origin: null" from a sandboxed frame — treated as foreign.
    }

    const forwardedHost = (req.get('x-forwarded-host') || '').split(',')[0].trim();
    if (sourceHost && (sourceHost === req.get('host') || sourceHost === forwardedHost)) return next();

    next(Object.assign(new Error('Cross-origin request blocked'), { status: 403 }));
}

module.exports = { originCheck };
