const fs = require('fs');
const path = require('path');

const FAVICON_DIR = path.join(__dirname, '..', 'public', 'uploads', 'favicons');

async function fetchFavicon(pageUrl) {
    try {
        const parsed = new URL(pageUrl);
        const icoUrl = `${parsed.protocol}//${parsed.host}/favicon.ico`;

        const response = await fetch(icoUrl, { signal: AbortSignal.timeout(4000) });
        if (!response.ok) return null;

        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('text/html')) return null;

        const buffer = Buffer.from(await response.arrayBuffer());
        if (!buffer.length) return null;

        if (!fs.existsSync(FAVICON_DIR)) fs.mkdirSync(FAVICON_DIR, { recursive: true });

        const filename = `${Date.now()}-${parsed.hostname.replace(/[^a-z0-9.-]/gi, '')}.ico`;
        fs.writeFileSync(path.join(FAVICON_DIR, filename), buffer);

        return `/uploads/favicons/${filename}`;
    } catch (err) {
        return null;
    }
}

module.exports = { fetchFavicon };
