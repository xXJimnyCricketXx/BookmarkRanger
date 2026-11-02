// Ids posted by the drag-and-drop lists. Anything that isn't a list of numbers is dropped
// instead of crashing the handler.
function parseIds(value) {
    if (!Array.isArray(value)) return [];
    return value.map((id) => parseInt(id, 10)).filter((id) => Number.isInteger(id));
}

module.exports = { parseIds };
