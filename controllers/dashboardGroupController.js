const prisma = require('../config/db');
const { parseIds } = require('../utils/ids');

// Dragging bookmark A onto bookmark B (neither already grouped) — create a new
// dashboard-only box holding both, so they display stacked instead of side by side.
exports.create = async (req, res) => {
    const ids = parseIds(req.body.bookmarkIds);
    if (ids.length < 2) {
        return res.status(400).json({ error: 'need at least 2 valid bookmark ids' });
    }

    // One transaction, so an unknown bookmark id can't leave an empty group behind.
    const group = await prisma.$transaction(async (tx) => {
        const created = await tx.dashboardGroup.create({
            data: { name: req.body.name || res.locals.t('dashboard.new_group'), order: 0 }
        });
        for (const [index, id] of ids.entries()) {
            await tx.bookmark.update({ where: { id }, data: { dashboardGroupId: created.id, dashboardGroupOrder: index } });
        }
        return created;
    });

    res.json({ ok: true, groupId: group.id });
};

// Dragging a bookmark (standalone or from another group) onto an existing group box.
exports.addBookmark = async (req, res) => {
    const groupId = parseInt(req.params.id, 10);
    const bookmarkId = parseInt(req.body.bookmarkId, 10);

    const existing = await prisma.bookmark.findUnique({ where: { id: bookmarkId } });
    const previousGroupId = existing ? existing.dashboardGroupId : null;
    const count = await prisma.bookmark.count({ where: { dashboardGroupId: groupId } });

    await prisma.bookmark.update({
        where: { id: bookmarkId },
        data: { dashboardGroupId: groupId, dashboardGroupOrder: count }
    });

    // Coming from a different group that this move just emptied out — clean it up.
    if (previousGroupId && previousGroupId !== groupId) {
        const remaining = await prisma.bookmark.count({ where: { dashboardGroupId: previousGroupId } });
        if (remaining === 0) await prisma.dashboardGroup.delete({ where: { id: previousGroupId } });
    }

    res.json({ ok: true });
};

// Dragging a bookmark out of its group back into the standalone pinned area.
exports.removeBookmark = async (req, res) => {
    const bookmarkId = parseInt(req.params.bookmarkId, 10);
    const bookmark = await prisma.bookmark.findUnique({ where: { id: bookmarkId } });
    if (!bookmark) return res.status(404).json({ error: 'not found' });

    const groupId = bookmark.dashboardGroupId;
    await prisma.bookmark.update({ where: { id: bookmarkId }, data: { dashboardGroupId: null } });

    if (groupId) {
        const remaining = await prisma.bookmark.count({ where: { dashboardGroupId: groupId } });
        if (remaining === 0) await prisma.dashboardGroup.delete({ where: { id: groupId } });
    }

    // Dragging out posts JSON and reloads itself, the X button is a plain form.
    if (!req.is('json')) return res.redirect(req.get('Referer') || `${res.locals.baseUrl}/`);
    res.json({ ok: true });
};

exports.rename = async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const name = (req.body.name || '').trim();
    if (name) await prisma.dashboardGroup.update({ where: { id }, data: { name } });
    res.redirect(req.get('Referer') || `${res.locals.baseUrl}/`);
};

exports.delete = async (req, res) => {
    const id = parseInt(req.params.id, 10);
    await prisma.bookmark.updateMany({ where: { dashboardGroupId: id }, data: { dashboardGroupId: null } });
    await prisma.dashboardGroup.delete({ where: { id } });
    res.redirect(req.get('Referer') || `${res.locals.baseUrl}/`);
};

exports.reorderGroups = async (req, res) => {
    const ids = parseIds(req.body.ids);
    await prisma.$transaction(ids.map((id, index) => prisma.dashboardGroup.update({ where: { id }, data: { order: index } })));
    res.json({ ok: true });
};

exports.reorderMembers = async (req, res) => {
    const ids = parseIds(req.body.ids);
    await prisma.$transaction(ids.map((id, index) => prisma.bookmark.update({ where: { id }, data: { dashboardGroupOrder: index } })));
    res.json({ ok: true });
};
