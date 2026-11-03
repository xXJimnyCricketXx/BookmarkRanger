const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { DATA_DIR } = require('./paths');

const SECRET_PATH = path.join(DATA_DIR, 'session_secret');
// The example values from .env.example and older Unraid templates are public, so they
// count as "not set" instead of silently signing sessions with a known secret.
const PLACEHOLDERS = new Set(['change-this-secret', 'ChangeThisToAComplexSecret']);

// SESSION_SECRET wins if set — otherwise one is generated on first start and kept in the
// data volume, so logins survive a restart without any manual configuration.
function getSessionSecret() {
    const fromEnv = process.env.SESSION_SECRET;
    if (fromEnv && !PLACEHOLDERS.has(fromEnv)) return fromEnv;

    if (fs.existsSync(SECRET_PATH)) return fs.readFileSync(SECRET_PATH, 'utf8').trim();

    const secret = crypto.randomBytes(32).toString('hex');
    fs.mkdirSync(path.dirname(SECRET_PATH), { recursive: true });
    fs.writeFileSync(SECRET_PATH, secret, { mode: 0o600 });
    return secret;
}

module.exports = { getSessionSecret };
