const prisma = require('../config/db');

async function resolveTags(tagsString) {
    const names = [...new Set(
        (tagsString || '').split(',').map((t) => t.trim().toLowerCase()).filter(Boolean)
    )];

    const tags = [];
    for (const name of names) {
        const tag = await prisma.tag.upsert({ where: { name }, update: {}, create: { name } });
        tags.push({ id: tag.id });
    }
    return tags;
}

module.exports = { resolveTags };
