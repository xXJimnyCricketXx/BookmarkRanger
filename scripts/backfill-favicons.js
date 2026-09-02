// One-off maintenance script: (re-)runs favicon detection for bookmarks that have none yet,
// or whose icon still points at the old locally-stored-file format (/uploads/favicons/...)
// from before icons became hotlinked URLs — re-resolving those also fixes the case where a
// bookmarks database was copied to an environment that doesn't have the matching icon files
// on disk. Run with: node scripts/backfill-favicons.js
const { PrismaClient } = require('@prisma/client');
const { fetchFavicon } = require('../utils/favicon');

const prisma = new PrismaClient();

(async () => {
    const bookmarks = await prisma.bookmark.findMany({
        where: { OR: [{ icon: null }, { icon: { startsWith: '/uploads/favicons/' } }] }
    });
    console.log(`Found ${bookmarks.length} bookmark(s) to (re-)resolve.`);

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
