// Shared by bookmarks and snippets — both have title/createdAt/order fields.
function orderByFor(sortingType) {
    if (sortingType === 'name') return { title: 'asc' };
    if (sortingType === 'custom') return { order: 'asc' };
    return { createdAt: 'desc' };
}

module.exports = { orderByFor };
