// Bookmarks end up as plain links, also on public share pages — anything but http(s)
// (javascript:, data:, ...) could run in this app's origin when clicked.
function isHttpUrl(value) {
    if (typeof value !== 'string') return false;
    try {
        const { protocol } = new URL(value);
        return protocol === 'http:' || protocol === 'https:';
    } catch (err) {
        return false;
    }
}

module.exports = { isHttpUrl };
