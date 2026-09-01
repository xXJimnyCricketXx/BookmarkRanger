// One-off maintenance script: retries favicon detection for bookmarks that have none yet
// (e.g. ones added before the <link rel="icon"> lookup existed). Run with: node scripts/backfill-favicons.js
const { PrismaClient } = require('@prisma/client');
const { fetchFavicon } = require('../utils/favicon');

const prisma = new PrismaClient();

(async () => {
    const bookmarks = await prisma.bookmark.findMany({ where: { icon: null } });
    console.log(`Found ${bookmarks.length} bookmark(s) without an icon.`);

    let updated = 0;
    for (const bookmark of bookmarks) {
        const icon = await fetchFavicon(bookmark.url);
        if (icon) {
            await prisma.bookmark.update({ where: { id: bookmark.id }, data: { icon } });
            console.log(`✓ ${bookmark.title} -> ${icon}`);
            updated++;
        } else {
            console.log(`✗ ${bookmark.title} (${bookmark.url}) — still no icon found`);
        }
    }

    console.log(`Done. ${updated}/${bookmarks.length} updated.`);
    await prisma.$disconnect();
})();
