const REPO = 'xXJimnyCricketXx/BookmarkRanger';
const RELEASES_URL = `https://api.github.com/repos/${REPO}/releases/latest`;

// Compares "1.2.3"-style versions without a semver dependency. Returns true if `latest` is newer.
function isNewer(latest, current) {
    const a = latest.replace(/^v/, '').split('.').map(Number);
    const b = current.split('.').map(Number);
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
        const diff = (a[i] || 0) - (b[i] || 0);
        if (diff !== 0) return diff > 0;
    }
    return false;
}

// No releases published yet (brand new repo) or the API is unreachable — both are expected
// states early on, so the caller shows a graceful "couldn't check" rather than an error page.
async function checkForUpdate(currentVersion) {
    try {
        const response = await fetch(RELEASES_URL, {
            headers: { Accept: 'application/vnd.github+json' },
            signal: AbortSignal.timeout(4000)
        });
        if (!response.ok) return { checked: false };

        const data = await response.json();
        if (!data.tag_name) return { checked: false };

        return {
            checked: true,
            latest: data.tag_name.replace(/^v/, ''),
            updateAvailable: isNewer(data.tag_name, currentVersion)
        };
    } catch (err) {
        return { checked: false };
    }
}

module.exports = { checkForUpdate };
