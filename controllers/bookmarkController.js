const prisma = require('../config/db');
const { resolveTags } = require('../utils/tags');
const { fetchFavicon } = require('../utils/favicon');
const { orderByFor } = require('../utils/sorting');
const { getSettings } = require('../utils/settings');

exports.list = async (req, res) => {
    const settings = await getSettings();
    const boards = await prisma.board.findMany({ orderBy: { order: 'asc' } });

    let activeBoard = null;
    if (boards.length) {
        const requestedId = parseInt(req.query.board, 10);
        activeBoard = boards.find((b) => b.id === requestedId) || boards[0];
    }

    let categories = [];
    if (activeBoard) {
        categories = await prisma.category.findMany({
            where: { boardId: activeBoard.id },
            orderBy: { order: 'asc' },
            include: { bookmarks: { orderBy: orderByFor(settings.sortingType), include: { tags: true } } }
        });
    }

    res.render('bookmarks', { title: 'Lesezeichen', boards, activeBoard, categories });
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

exports.deleteBoard = async (req, res) => {
    await prisma.board.delete({ where: { id: parseInt(req.params.id, 10) } });
    res.redirect(`${res.locals.baseUrl}/bookmarks`);
};

exports.createCategory = async (req, res) => {
    const { name, boardId, icon, color } = req.body;
    if (name && name.trim() && boardId) {
        const count = await prisma.category.count({ where: { boardId: parseInt(boardId, 10) } });
        await prisma.category.create({
            data: {
                name: name.trim(),
                boardId: parseInt(boardId, 10),
                icon: icon || null,
                color: color || null,
                order: count
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
    const { title, url, description, categoryId, tags } = req.body;
    const settings = await getSettings();
    const icon = await fetchFavicon(url);
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
    const { title, url, description, categoryId, tags } = req.body;
    const existing = await prisma.bookmark.findUnique({ where: { id } });

    let icon = existing.icon;
    if (url !== existing.url) {
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
