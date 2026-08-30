const prisma = require('../config/db');
const { getSettings } = require('../utils/settings');
const { parseSearchQuery, bookmarkSearchWhere, snippetSearchWhere } = require('../utils/search');

exports.dashboard = async (req, res) => {
    const settings = await getSettings();
    const q = req.query.q || '';
    const parsed = parseSearchQuery(q);

    const pinnedBookmarks = q
        ? await prisma.bookmark.findMany({ where: bookmarkSearchWhere(parsed), include: { tags: true, category: true }, orderBy: { order: 'asc' } })
        : await prisma.bookmark.findMany({ where: { isPinned: true }, include: { tags: true, category: true }, orderBy: { order: 'asc' } });

    const pinnedSnippets = q
        ? await prisma.snippet.findMany({ where: snippetSearchWhere(parsed), include: { tags: true }, orderBy: { createdAt: 'desc' } })
        : await prisma.snippet.findMany({ where: { isPinned: true }, include: { tags: true }, orderBy: { createdAt: 'desc' } });

    res.render('index', {
        title: settings.siteName,
        settings,
        pinnedBookmarks,
        pinnedSnippets,
        q,
        isSearch: Boolean(q)
    });
};
