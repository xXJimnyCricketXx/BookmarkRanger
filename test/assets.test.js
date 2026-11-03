const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { ROOT } = require('./helpers');

test('the built stylesheet matches the current views', () => {
    const output = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'bookmarkranger-css-')), 'tailwind.css');
    execFileSync(process.execPath, [
        path.join(ROOT, 'node_modules', 'tailwindcss', 'lib', 'cli.js'),
        '-c', 'tailwind.config.js', '-i', 'assets/tailwind.css', '-o', output, '--minify'
    ], { cwd: ROOT, stdio: 'pipe' });
    const built = fs.readFileSync(path.join(ROOT, 'public', 'vendor', 'tailwind.min.css'), 'utf8');
    assert.strictEqual(fs.readFileSync(output, 'utf8'), built, 'run "npm run build:css"');
    fs.rmSync(path.dirname(output), { recursive: true, force: true });
});

test('pages load no scripts or styles from other servers', () => {
    const external = /<(script|link)[^>]+(src|href)="https?:/;
    const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => (
        entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]
    ));
    for (const file of walk(path.join(ROOT, 'views'))) {
        assert.ok(!external.test(fs.readFileSync(file, 'utf8')), file);
    }
});
