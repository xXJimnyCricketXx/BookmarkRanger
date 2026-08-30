function parseSearchQuery(query) {
    const tokens = (query || '').trim().split(/\s+/).filter(Boolean);
    let language = null;
    let tags = [];
    const text = [];

    for (const token of tokens) {
        if (token.toLowerCase().startsWith('lang:')) {
            language = token.slice(5).toLowerCase();
        } else if (token.toLowerCase().startsWith('tags:')) {
            tags = token.slice(5).split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
        } else {
            text.push(token);
        }
    }

    return { text: text.join(' '), tags, language };
}

function bookmarkSearchWhere(parsed) {
    const AND = [];
    if (parsed.text) {
        AND.push({
            OR: [
                { title: { contains: parsed.text } },
                { url: { contains: parsed.text } },
                { description: { contains: parsed.text } }
            ]
        });
    }
    if (parsed.tags.length) {
        AND.push({ tags: { some: { name: { in: parsed.tags } } } });
    }
    return AND.length ? { AND } : {};
}

function snippetSearchWhere(parsed) {
    const AND = [];
    if (parsed.text) {
        AND.push({
            OR: [
                { title: { contains: parsed.text } },
                { shortDescription: { contains: parsed.text } },
                { code: { contains: parsed.text } },
                { documentation: { contains: parsed.text } }
            ]
        });
    }
    if (parsed.tags.length) {
        AND.push({ tags: { some: { name: { in: parsed.tags } } } });
    }
    if (parsed.language) {
        AND.push({ language: { equals: parsed.language } });
    }
    return AND.length ? { AND } : {};
}

module.exports = { parseSearchQuery, bookmarkSearchWhere, snippetSearchWhere };
