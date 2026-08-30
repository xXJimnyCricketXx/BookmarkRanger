const prisma = require('../config/db');
const { resolveTags } = require('../utils/tags');

exports.list = async (req, res) => {
    const activeTags = (req.query.tags || '').split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
    const q = req.query.q || '';

    const where = {};
    const AND = [];
    if (activeTags.length) AND.push({ tags: { some: { name: { in: activeTags } } } });
    if (q) {
        AND.push({
            OR: [
                { title: { contains: q } },
                { shortDescription: { contains: q } },
                { code: { contains: q } }
            ]
        });
    }
    if (AND.length) where.AND = AND;

    const snippets = await prisma.snippet.findMany({ where, include: { tags: true }, orderBy: { createdAt: 'desc' } });

    const allSnippetsForTags = await prisma.snippet.findMany({ include: { tags: true } });
    const tagCounts = {};
    for (const snippet of allSnippetsForTags) {
        for (const tag of snippet.tags) {
            tagCounts[tag.name] = (tagCounts[tag.name] || 0) + 1;
        }
    }
    const tags = Object.entries(tagCounts).sort((a, b) => a[0].localeCompare(b[0]));

    res.render('snippets', {
        title: 'Snippets',
        snippets,
        tags,
        activeTags,
        total: allSnippetsForTags.length,
        q
    });
};

exports.showAddForm = (req, res) => {
    res.render('snippet-form', { title: 'Neues Snippet', snippet: null });
};

exports.showEditForm = async (req, res) => {
    const snippet = await prisma.snippet.findUnique({ where: { id: parseInt(req.params.id, 10) }, include: { tags: true } });
    res.render('snippet-form', { title: 'Snippet bearbeiten', snippet });
};

exports.detail = async (req, res) => {
    const snippet = await prisma.snippet.findUnique({ where: { id: parseInt(req.params.id, 10) }, include: { tags: true } });
    if (!snippet) return res.status(404).render('404', { title: '404' });
    res.render('snippet-detail', { title: snippet.title, snippet });
};

exports.create = async (req, res) => {
    const { title, shortDescription, language, code, documentation, tags } = req.body;
    const allTags = `${tags || ''},${language || ''}`;

    await prisma.snippet.create({
        data: {
            title,
            shortDescription: shortDescription || null,
            language: (language || '').toLowerCase(),
            code,
            documentation: documentation || null,
            tags: { connect: await resolveTags(allTags) }
        }
    });

    res.redirect(`${res.locals.baseUrl}/snippets`);
};

exports.update = async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const { title, shortDescription, language, code, documentation, tags } = req.body;
    const allTags = `${tags || ''},${language || ''}`;

    await prisma.snippet.update({
        where: { id },
        data: {
            title,
            shortDescription: shortDescription || null,
            language: (language || '').toLowerCase(),
            code,
            documentation: documentation || null,
            tags: { set: await resolveTags(allTags) }
        }
    });

    res.redirect(`${res.locals.baseUrl}/snippets/${id}`);
};

exports.delete = async (req, res) => {
    await prisma.snippet.delete({ where: { id: parseInt(req.params.id, 10) } });
    res.redirect(`${res.locals.baseUrl}/snippets`);
};

exports.togglePin = async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const snippet = await prisma.snippet.findUnique({ where: { id } });
    await prisma.snippet.update({ where: { id }, data: { isPinned: !snippet.isPinned } });
    res.redirect(req.get('Referer') || `${res.locals.baseUrl}/snippets`);
};
