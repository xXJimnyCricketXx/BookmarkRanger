const prisma = require('../config/db');

// A group only exists through its bookmarks — deleting or unpinning the last one (also via
// its category or board) would otherwise leave an empty box behind on the dashboard.
function removeEmptyGroups() {
    return prisma.dashboardGroup.deleteMany({ where: { bookmarks: { none: {} } } });
}

module.exports = { removeEmptyGroups };
