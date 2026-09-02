const fs = require('fs');
const path = require('path');

const CHANGELOG_PATH = path.join(__dirname, '..', 'changelog.json');

function getChangelog() {
    try {
        const data = JSON.parse(fs.readFileSync(CHANGELOG_PATH, 'utf8'));
        return Array.isArray(data.entries) ? data.entries : [];
    } catch (err) {
        return [];
    }
}

// The app version shown in Settings and used for the update check is the newest
// entry's version in changelog.json, so bumping the version is just part of writing
// the changelog entry instead of a separate, easy-to-forget step.
function getCurrentVersion() {
    const entries = getChangelog();
    if (entries.length && entries[0].version) return entries[0].version;
    return require('../package.json').version;
}

module.exports = { getChangelog, getCurrentVersion };
