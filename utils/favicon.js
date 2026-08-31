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

// Auto-detection: only checks the domain's root /favicon.ico (no <link rel="icon"> HTML
// parsing), so sites that only serve theirs from another path/CDN come back with none —
// that's what the manual iconUrl override in the bookmark form is for.
async function fetchFavicon(pageUrl) {
    try {
        const parsed = new URL(pageUrl);
        const icoUrl = `${parsed.protocol}//${parsed.host}/favicon.ico`;
        return await downloadIcon(icoUrl);
    } catch (err) {
        return null;
    }
}

module.exports = { fetchFavicon, downloadIcon };
