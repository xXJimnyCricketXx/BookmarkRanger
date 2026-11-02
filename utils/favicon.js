const { isHttpUrl } = require('./url');

// Favicons are never downloaded or stored locally — a bookmark's icon field is just the
// discovered image URL, hotlinked straight from the bookmarked site itself (like the link
// itself, it depends on that site being reachable, so this adds no new dependency). This
// keeps icons out of the database/filesystem entirely: nothing to clean up when a bookmark
// is deleted, and nothing that can end up out of sync when the database is moved between
// environments.
async function isLikelyImage(imageUrl) {
    if (!isHttpUrl(imageUrl)) return false;
    try {
        const response = await fetch(imageUrl, { signal: AbortSignal.timeout(4000) });
        if (!response.ok) return false;
        const contentType = response.headers.get('content-type') || '';
        return !contentType.includes('text/html');
    } catch (err) {
        return false;
    }
}

// Reads the page's own <link rel="icon"/"shortcut icon"/"apple-touch-icon" ...> — the same
// thing a browser tab does — instead of just guessing /favicon.ico, which many modern sites
// don't serve at all (their real icon lives at some other path or CDN).
async function findDeclaredIconUrl(pageUrl) {
    try {
        const response = await fetch(pageUrl, {
            signal: AbortSignal.timeout(4000),
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BookmarkRangerBot/1.0)' }
        });
        if (!response.ok) return null;
        if (!(response.headers.get('content-type') || '').includes('text/html')) return null;

        const html = await response.text();
        const candidates = [];
        for (const tag of html.matchAll(/<link\s+[^>]*>/gi)) {
            const rel = tag[0].match(/rel=["']([^"']+)["']/i)?.[1]?.toLowerCase();
            const href = tag[0].match(/href=["']([^"']+)["']/i)?.[1];
            if (!rel || !href || !rel.includes('icon')) continue;
            // Plain "icon" / "shortcut icon" over apple-touch-icon or other icon variants.
            const priority = (rel === 'icon' || rel === 'shortcut icon') ? 0 : 1;
            candidates.push({ href, priority });
        }
        if (!candidates.length) return null;
        candidates.sort((a, b) => a.priority - b.priority);
        return new URL(candidates[0].href, pageUrl).href;
    } catch (err) {
        return null;
    }
}

async function fetchFavicon(pageUrl) {
    const declared = await findDeclaredIconUrl(pageUrl);
    if (declared && (await isLikelyImage(declared))) return declared;

    // Fall back to the legacy root path if the page declared nothing (or it failed to load).
    try {
        const parsed = new URL(pageUrl);
        const icoUrl = `${parsed.protocol}//${parsed.host}/favicon.ico`;
        return (await isLikelyImage(icoUrl)) ? icoUrl : null;
    } catch (err) {
        return null;
    }
}

// For a manually entered icon URL — just confirms it actually resolves to an image
// before storing it, same quality bar as the auto-discovered case.
async function verifyIconUrl(imageUrl) {
    return (await isLikelyImage(imageUrl)) ? imageUrl : null;
}

module.exports = { fetchFavicon, verifyIconUrl };
