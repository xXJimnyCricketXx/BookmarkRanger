const prisma = require('../config/db');
const { getSettings } = require('../utils/settings');
const { parseSearchQuery, bookmarkSearchWhere, snippetSearchWhere } = require('../utils/search');
const { orderByFor } = require('../utils/sorting');

exports.dashboard = async (req, res) => {
    const settings = await getSettings();
    const q = req.query.q || '';
    const parsed = parseSearchQuery(q);
    const isSearch = Boolean(q);

    const pinnedBookmarks = q
        ? await prisma.bookmark.findMany({ where: bookmarkSearchWhere(parsed), include: { tags: true, category: true }, orderBy: { order: 'asc' } })
        : await prisma.bookmark.findMany({ where: { isPinned: true }, include: { tags: true, category: true }, orderBy: { order: 'asc' } });

    const pinnedSnippets = q
        ? await prisma.snippet.findMany({ where: snippetSearchWhere(parsed), include: { tags: true }, orderBy: { createdAt: 'desc' } })
        : await prisma.snippet.findMany({ where: { isPinned: true }, include: { tags: true }, orderBy: { createdAt: 'desc' } });

    const pinnedCategories = isSearch
        ? []
        : await prisma.category.findMany({
            where: { isPinned: true },
            orderBy: { order: 'asc' },
            include: { bookmarks: { orderBy: orderByFor(settings.sortingType), include: { tags: true } } }
        });

    const noResults = isSearch && pinnedBookmarks.length === 0 && pinnedSnippets.length === 0;

    let fallbackSearchHost = '';
    if (noResults) {
        try {
            fallbackSearchHost = new URL(settings.fallbackSearchUrl).hostname;
        } catch (err) {
            fallbackSearchHost = settings.fallbackSearchUrl;
        }
    }

    res.render('index', {
        title: settings.siteName,
        settings,
        pinnedBookmarks,
        pinnedSnippets,
        pinnedCategories,
        q,
        isSearch,
        noResults,
        fallbackSearchHref: noResults ? settings.fallbackSearchUrl + encodeURIComponent(q) : null,
        fallbackSearchHost
    });
};
