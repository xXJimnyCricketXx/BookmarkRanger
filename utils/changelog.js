const fs = require('fs');
const path = require('path');

const CHANGELOG_PATH = path.join(__dirname, '..', 'CHANGELOG.md');
const VERSION_HEADING = /^### v(\d+\.\d+\.\d+)/m;

// The app version shown in Settings and used for the update check is read straight
// from CHANGELOG.md's newest "### vX.Y.Z" heading, so bumping the version is just
// part of writing the changelog entry instead of a separate, easy-to-forget step.
function getCurrentVersion() {
    try {
        const content = fs.readFileSync(CHANGELOG_PATH, 'utf8');
        const match = content.match(VERSION_HEADING);
        if (match) return match[1];
    } catch (err) { /* fall through to package.json */ }
    return require('../package.json').version;
}

module.exports = { getCurrentVersion };
