const fs = require('fs');
const path = require('path');

const FAVICON_DIR = path.join(__dirname, '..', 'public', 'uploads', 'favicons');

async function downloadIcon(imageUrl) {
    try {
        const parsed = new URL(imageUrl);

        const response = await fetch(imageUrl, { signal: AbortSignal.timeout(4000) });
        if (!response.ok) return null;

        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('text/html')) return null;

        const buffer = Buffer.from(await response.arrayBuffer());
        if (!buffer.length) return null;

        if (!fs.existsSync(FAVICON_DIR)) fs.mkdirSync(FAVICON_DIR, { recursive: true });

        const ext = path.extname(parsed.pathname.split('?')[0]) || '.ico';
        const filename = `${Date.now()}-${parsed.hostname.replace(/[^a-z0-9.-]/gi, '')}${ext}`;
        fs.writeFileSync(path.join(FAVICON_DIR, filename), buffer);

        return `/uploads/favicons/${filename}`;
    } catch (err) {
        return null;
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
    if (declared) {
        const result = await downloadIcon(declared);
        if (result) return result;
    }

    // Fall back to the legacy root path if the page declared nothing (or it failed to load).
    try {
        const parsed = new URL(pageUrl);
        const icoUrl = `${parsed.protocol}//${parsed.host}/favicon.ico`;
        return await downloadIcon(icoUrl);
    } catch (err) {
        return null;
    }
}

module.exports = { fetchFavicon, downloadIcon };
