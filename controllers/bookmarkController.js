const prisma = require('../config/db');
const { resolveTags } = require('../utils/tags');
const { fetchFavicon, downloadIcon } = require('../utils/favicon');
const { orderByFor } = require('../utils/sorting');
const { getSettings } = require('../utils/settings');

async function categoriesFor(boardId, settings) {
    return prisma.category.findMany({
        where: { boardId },
        orderBy: { order: 'asc' },
        include: { bookmarks: { orderBy: orderByFor(settings.sortingType), include: { tags: true } } }
    });
}

exports.list = async (req, res) => {
    const settings = await getSettings();
    const boards = await prisma.board.findMany({ orderBy: { order: 'asc' } });

    let activeBoard = null;
    if (boards.length) {
        const requestedId = parseInt(req.query.board, 10);
        activeBoard = boards.find((b) => b.id === requestedId) || boards[0];
    }

    const categories = activeBoard ? await categoriesFor(activeBoard.id, settings) : [];

    res.render('bookmarks', { title: 'Lesezeichen', boards, activeBoard, categories });
};

// Renders just the board panel (toolbar + categories) so the board tabs can swap boards
// via fetch() instead of a full page reload — the tab bar itself never gets touched.
exports.boardPanel = async (req, res) => {
    const settings = await getSettings();
    const activeBoard = await prisma.board.findUnique({ where: { id: parseInt(req.params.id, 10) } });
    if (!activeBoard) return res.status(404).send('Not found');

    const categories = await categoriesFor(activeBoard.id, settings);

    res.render('partials/board-panel', { activeBoard, categories }, (err, html) => {
        if (err) return res.status(500).send('Render error');
        res.json({ html, boardName: activeBoard.name });
    });
};

exports.createBoard = async (req, res) => {
    const { name } = req.body;
    if (name && name.trim()) {
        const count = await prisma.board.count();
        const board = await prisma.board.create({ data: { name: name.trim(), order: count } });
        return res.redirect(`${res.locals.baseUrl}/bookmarks?board=${board.id}`);
    }
    res.redirect(`${res.locals.baseUrl}/bookmarks`);
};

exports.renameBoard = async (req, res) => {
    const { name } = req.body;
    const id = parseInt(req.params.id, 10);
    if (name && name.trim()) {
        await prisma.board.update({ where: { id }, data: { name: name.trim() } });
    }
    res.redirect(`${res.locals.baseUrl}/bookmarks?board=${id}`);
};

exports.deleteBoard = async (req, res) => {
    await prisma.board.delete({ where: { id: parseInt(req.params.id, 10) } });
    res.redirect(`${res.locals.baseUrl}/bookmarks`);
};

exports.createCategory = async (req, res) => {
    const { name, boardId, icon, color } = req.body;
    if (name && name.trim() && boardId) {
        const settings = await getSettings();
        const count = await prisma.category.count({ where: { boardId: parseInt(boardId, 10) } });
        await prisma.category.create({
            data: {
                name: name.trim(),
                boardId: parseInt(boardId, 10),
                icon: icon || null,
                color: color || null,
                order: count,
                isPinned: settings.pinCategoriesByDefault
            }
        });
    }
    res.redirect(`${res.locals.baseUrl}/bookmarks?board=${boardId}`);
};

exports.deleteCategory = async (req, res) => {
    const category = await prisma.category.findUnique({ where: { id: parseInt(req.params.id, 10) } });
    if (category) await prisma.category.delete({ where: { id: category.id } });
    res.redirect(`${res.locals.baseUrl}/bookmarks?board=${category ? category.boardId : ''}`);
};

exports.togglePinCategory = async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const category = await prisma.category.findUnique({ where: { id } });
    await prisma.category.update({ where: { id }, data: { isPinned: !category.isPinned } });
    res.redirect(req.get('Referer') || `${res.locals.baseUrl}/bookmarks?board=${category.boardId}`);
};

exports.showAddForm = async (req, res) => {
    const boards = await prisma.board.findMany({ orderBy: { order: 'asc' }, include: { categories: true } });
    res.render('bookmark-form', { title: 'Lesezeichen hinzufügen', boards, bookmark: null, selectedCategoryId: req.query.categoryId || null });
};

exports.showEditForm = async (req, res) => {
    const bookmark = await prisma.bookmark.findUnique({ where: { id: parseInt(req.params.id, 10) }, include: { tags: true } });
    const boards = await prisma.board.findMany({ orderBy: { order: 'asc' }, include: { categories: true } });
    res.render('bookmark-form', { title: 'Lesezeichen bearbeiten', boards, bookmark, selectedCategoryId: bookmark.categoryId });
};

exports.create = async (req, res) => {
    const { title, url, description, categoryId, tags, iconUrl } = req.body;
    const settings = await getSettings();
    const icon = iconUrl && iconUrl.trim() ? await downloadIcon(iconUrl.trim()) : await fetchFavicon(url);
    const count = await prisma.bookmark.count({ where: { categoryId: parseInt(categoryId, 10) } });

    const bookmark = await prisma.bookmark.create({
        data: {
            title,
            url,
            description: description || null,
            icon,
            categoryId: parseInt(categoryId, 10),
            order: count,
            isPinned: settings.pinBookmarksByDefault,
            tags: { connect: await resolveTags(tags) }
        },
        include: { category: true }
    });

    res.redirect(`${res.locals.baseUrl}/bookmarks?board=${bookmark.category.boardId}`);
};

exports.update = async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const { title, url, description, categoryId, tags, iconUrl } = req.body;
    const existing = await prisma.bookmark.findUnique({ where: { id } });

    let icon = existing.icon;
    if (iconUrl && iconUrl.trim()) {
        icon = (await downloadIcon(iconUrl.trim())) || icon;
    } else if (url !== existing.url) {
        icon = (await fetchFavicon(url)) || icon;
    }

    const bookmark = await prisma.bookmark.update({
        where: { id },
        data: {
            title,
            url,
            description: description || null,
            icon,
            categoryId: parseInt(categoryId, 10),
            tags: { set: await resolveTags(tags) }
        },
        include: { category: true }
    });

    res.redirect(`${res.locals.baseUrl}/bookmarks?board=${bookmark.category.boardId}`);
};

exports.delete = async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const bookmark = await prisma.bookmark.findUnique({ where: { id }, include: { category: true } });
    if (bookmark) {
        await prisma.bookmark.delete({ where: { id } });
        return res.redirect(`${res.locals.baseUrl}/bookmarks?board=${bookmark.category.boardId}`);
    }
    res.redirect(`${res.locals.baseUrl}/bookmarks`);
};

exports.togglePin = async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const bookmark = await prisma.bookmark.findUnique({ where: { id }, include: { category: true } });
    await prisma.bookmark.update({ where: { id }, data: { isPinned: !bookmark.isPinned } });
    res.redirect(req.get('Referer') || `${res.locals.baseUrl}/bookmarks?board=${bookmark.category.boardId}`);
};

exports.moveBookmark = async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const direction = req.params.direction;
    const bookmark = await prisma.bookmark.findUnique({ where: { id }, include: { category: true } });
    if (!bookmark) return res.redirect(req.get('Referer') || `${res.locals.baseUrl}/bookmarks`);

    const siblings = await prisma.bookmark.findMany({ where: { categoryId: bookmark.categoryId }, orderBy: { order: 'asc' } });
    const index = siblings.findIndex((b) => b.id === id);
    const swapIndex = direction === 'up' ? index - 1 : index + 1;

    if (swapIndex >= 0 && swapIndex < siblings.length) {
        const other = siblings[swapIndex];
        await prisma.$transaction([
            prisma.bookmark.update({ where: { id: bookmark.id }, data: { order: other.order } }),
            prisma.bookmark.update({ where: { id: other.id }, data: { order: bookmark.order } })
        ]);
    }

    res.redirect(req.get('Referer') || `${res.locals.baseUrl}/bookmarks?board=${bookmark.category.boardId}`);
};

exports.reorder = async (req, res) => {
    const ids = (req.body.ids || []).map((id) => parseInt(id, 10));
    await prisma.$transaction(ids.map((id, index) => prisma.bookmark.update({ where: { id }, data: { order: index } })));
    res.json({ ok: true });
};

exports.reorderCategories = async (req, res) => {
    const ids = (req.body.ids || []).map((id) => parseInt(id, 10));
    await prisma.$transaction(ids.map((id, index) => prisma.category.update({ where: { id }, data: { order: index } })));
    res.json({ ok: true });
};
