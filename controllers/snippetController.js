const hljs = require('highlight.js');
const prisma = require('../config/db');
const { resolveTags } = require('../utils/tags');
const { getSettings } = require('../utils/settings');

const SORT_FIELDS = { created: 'createdAt', updated: 'updatedAt', name: 'title' };

exports.list = async (req, res) => {
    const activeTags = (req.query.tags || '').split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
    const q = req.query.q || '';

    // Combined "field_direction" token (e.g. "created_desc"), matching VHSRanger's collection sort UX.
    const [sortField, sortDir] = (req.query.sort || '').split('_');
    const sort = SORT_FIELDS[sortField] ? sortField : 'created';
    const dir = sortDir === 'asc' ? 'asc' : 'desc';
    const currentSort = `${sort}_${dir}`;

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

    const snippets = await prisma.snippet.findMany({ where, include: { tags: true }, orderBy: { [SORT_FIELDS[sort]]: dir } });

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
        q,
        currentSort
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

    const highlighted = hljs.getLanguage(snippet.language)
        ? hljs.highlight(snippet.code, { language: snippet.language })
        : hljs.highlightAuto(snippet.code);

    res.render('snippet-detail', { title: snippet.title, snippet, highlightedCode: highlighted.value });
};

exports.raw = async (req, res) => {
    const snippet = await prisma.snippet.findUnique({ where: { id: parseInt(req.params.id, 10) } });
    if (!snippet) return res.status(404).send('Not found');
    res.type('text/plain').send(snippet.code);
};

exports.create = async (req, res) => {
    const { title, shortDescription, language, code, documentation, tags } = req.body;
    const allTags = `${tags || ''},${language || ''}`;
    const settings = await getSettings();
    const count = await prisma.snippet.count();

    await prisma.snippet.create({
        data: {
            title,
            shortDescription: shortDescription || null,
            language: (language || '').toLowerCase(),
            code,
            documentation: documentation || null,
            order: count,
            isPinned: settings.pinSnippetsByDefault,
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

exports.reorder = async (req, res) => {
    const ids = (req.body.ids || []).map((id) => parseInt(id, 10));
    await prisma.$transaction(ids.map((id, index) => prisma.snippet.update({ where: { id }, data: { order: index } })));
    res.json({ ok: true });
};
