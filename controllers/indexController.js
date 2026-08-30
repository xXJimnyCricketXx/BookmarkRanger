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
    const searchProviders = await prisma.searchProvider.findMany({ orderBy: { name: 'asc' } });
    const provider = settings.fallbackSearchProvider;

    res.render('index', {
        title: settings.siteName,
        settings,
        pinnedBookmarks,
        pinnedSnippets,
        pinnedCategories,
        q,
        isSearch,
        noResults,
        searchProviders,
        fallbackSearchHref: noResults && provider ? provider.queryTemplate + encodeURIComponent(q) : null
    });
};

// Used by the dashboard search bar via fetch() so the "no local results -> open
// external tab" decision happens without a full page reload in between — a reload
// resets the browser's user-activation state and gets window.open() popup-blocked.
exports.searchCheck = async (req, res) => {
    const settings = await getSettings();
    const q = req.query.q || '';
    const parsed = parseSearchQuery(q);

    const [bookmarkCount, snippetCount] = await Promise.all([
        prisma.bookmark.count({ where: bookmarkSearchWhere(parsed) }),
        prisma.snippet.count({ where: snippetSearchWhere(parsed) })
    ]);

    const hasResults = bookmarkCount > 0 || snippetCount > 0;
    const provider = settings.fallbackSearchProvider;

    res.json({
        hasResults,
        fallbackHref: !hasResults && provider ? provider.queryTemplate + encodeURIComponent(q) : null
    });
};

exports.createSearchProvider = async (req, res) => {
    const { name, queryTemplate } = req.body;
    if (name && name.trim() && queryTemplate && queryTemplate.trim()) {
        await prisma.searchProvider.create({ data: { name: name.trim(), queryTemplate: queryTemplate.trim() } });
    }
    res.redirect(`${res.locals.baseUrl}/`);
};
