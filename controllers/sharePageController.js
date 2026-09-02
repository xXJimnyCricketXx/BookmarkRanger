const crypto = require('crypto');
const hljs = require('highlight.js');
const prisma = require('../config/db');
const { orderByFor } = require('../utils/sorting');
const { getSettings } = require('../utils/settings');

function generateToken() {
    return crypto.randomBytes(12).toString('base64url');
}

exports.list = async (req, res) => {
    const pages = await prisma.sharePage.findMany({
        orderBy: { order: 'asc' },
        include: {
            categories: { orderBy: { name: 'asc' } },
            snippets: { orderBy: { title: 'asc' } }
        }
    });
    res.render('shared', { title: res.locals.t('share.management_title'), pages });
};

exports.create = async (req, res) => {
    const { name } = req.body;
    if (name && name.trim()) {
        const count = await prisma.sharePage.count();
        await prisma.sharePage.create({ data: { name: name.trim(), token: generateToken(), order: count } });
    }
    res.redirect(`${res.locals.baseUrl}/shared`);
};

exports.rename = async (req, res) => {
    const { name } = req.body;
    const id = parseInt(req.params.id, 10);
    if (name && name.trim()) await prisma.sharePage.update({ where: { id }, data: { name: name.trim() } });
    res.redirect(`${res.locals.baseUrl}/shared`);
};

exports.delete = async (req, res) => {
    await prisma.sharePage.delete({ where: { id: parseInt(req.params.id, 10) } });
    res.redirect(`${res.locals.baseUrl}/shared`);
};

exports.removeCategory = async (req, res) => {
    await prisma.sharePage.update({
        where: { id: parseInt(req.params.id, 10) },
        data: { categories: { disconnect: { id: parseInt(req.params.categoryId, 10) } } }
    });
    res.redirect(`${res.locals.baseUrl}/shared`);
};

exports.removeSnippet = async (req, res) => {
    await prisma.sharePage.update({
        where: { id: parseInt(req.params.id, 10) },
        data: { snippets: { disconnect: { id: parseInt(req.params.snippetId, 10) } } }
    });
    res.redirect(`${res.locals.baseUrl}/shared`);
};

// Shared by the "Teilen" picker modal on categories, boards and snippets.
// mode "set" replaces the item's full share-page membership (single-item toggle);
// mode "add" only connects (used for "share whole board" — a bulk add across all
// of the board's categories, without touching pages other categories are already on).
exports.updateItemSharing = async (req, res) => {
    const { type, id } = req.params;
    const itemId = parseInt(id, 10);
    const ids = (req.body.ids || []).map((v) => parseInt(v, 10)).filter((v) => !Number.isNaN(v));
    const mode = req.body.mode === 'add' ? 'add' : 'set';
    const connect = ids.map((sharePageId) => ({ id: sharePageId }));

    if (type === 'category') {
        await prisma.category.update({
            where: { id: itemId },
            data: { sharePages: mode === 'add' ? { connect } : { set: connect } }
        });
    } else if (type === 'snippet') {
        await prisma.snippet.update({
            where: { id: itemId },
            data: { sharePages: mode === 'add' ? { connect } : { set: connect } }
        });
    } else if (type === 'board') {
        const categories = await prisma.category.findMany({ where: { boardId: itemId } });
        await prisma.$transaction(
            categories.map((category) =>
                prisma.category.update({ where: { id: category.id }, data: { sharePages: { connect } } })
            )
        );
    } else {
        return res.status(400).json({ ok: false });
    }

    res.json({ ok: true });
};

exports.publicView = async (req, res) => {
    const settings = await getSettings();
    const page = await prisma.sharePage.findUnique({
        where: { token: req.params.token },
        include: {
            categories: {
                orderBy: { name: 'asc' },
                include: { bookmarks: { orderBy: orderByFor(settings.sortingType), include: { tags: true } } }
            },
            snippets: { orderBy: { title: 'asc' }, include: { tags: true } }
        }
    });
    if (!page) return res.status(404).render('404', { title: '404' });

    const snippets = page.snippets.map((snippet) => {
        const highlighted = hljs.getLanguage(snippet.language)
            ? hljs.highlight(snippet.code, { language: snippet.language })
            : hljs.highlightAuto(snippet.code);
        return { ...snippet, highlightedCode: highlighted.value };
    });

    res.render('share-public', { title: page.name, page, snippets });
};
