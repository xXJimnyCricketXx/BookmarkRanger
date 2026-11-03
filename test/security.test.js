const { test, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { TestApp, PASSWORD } = require('./helpers');

const TECHNICAL_DETAILS = /node_modules|at .*\.js:\d+|Illegal arguments|PrismaClient/;

let app;
let setupResponse;
let categoryId;

before(async () => {
    app = await new TestApp().start();
    setupResponse = await app.setup();
    const board = await app.post('/bookmarks/boards', { name: 'Board' });
    const boardId = board.location.split('=')[1];
    await app.post('/bookmarks/categories', { name: 'Category', boardId });
    const panel = JSON.parse((await app.get(`/bookmarks/boards/${boardId}/panel`)).text);
    categoryId = panel.categories[0].id;
});

after(() => app.destroy());

test('session cookie is HttpOnly and SameSite=Lax', () => {
    const cookie = setupResponse.setCookies.find((c) => c.startsWith('connect.sid'));
    assert.match(cookie, /HttpOnly/i);
    assert.match(cookie, /SameSite=Lax/i);
});

test('session secret is generated privately when none is set', () => {
    const secret = fs.readFileSync(path.join(app.dataDir, 'session_secret'), 'utf8');
    assert.strictEqual(secret.length, 64);
});

test('health endpoint is public', async () => {
    const res = await app.get('/api/health', { anon: true });
    assert.strictEqual(res.status, 200);
    assert.deepStrictEqual(JSON.parse(res.text), { status: 'ok' });
});

test('requests from other origins are blocked', async () => {
    for (const headers of [{ origin: 'https://evil.example' }, { origin: 'null' }, { referer: 'https://evil.example/page' }]) {
        const res = await app.post('/bookmarks/boards', { name: 'Blocked' }, { headers });
        assert.strictEqual(res.status, 403, JSON.stringify(headers));
    }
});

test('same-origin and proxied requests pass', async () => {
    assert.strictEqual((await app.post('/bookmarks/boards', { name: 'Own' }, { headers: { origin: app.base } })).status, 302);
    const proxied = await app.post('/bookmarks/boards', { name: 'Proxied' }, { headers: { origin: 'https://bm.example', 'x-forwarded-host': 'bm.example' } });
    assert.strictEqual(proxied.status, 302);
});

test('only http(s) bookmark addresses are stored', async () => {
    for (const url of ['javascript:alert(1)', 'JaVaScRiPt:alert(1)', 'java\nscript:alert(1)', 'data:text/html,x', 'example.com']) {
        const res = await app.post('/bookmarks', { title: 'Rejected', url, categoryId });
        assert.strictEqual(res.status, 400, url);
    }
    const db = app.db();
    assert.strictEqual(await db.bookmark.count({ where: { title: 'Rejected' } }), 0);
    await db.$disconnect();
});

test('errors reveal no technical details', async () => {
    const responses = await Promise.all([
        app.post('/login', { username: 'tester' }, { anon: true }),
        app.post('/snippets', { title: 'too big', language: 'js', code: 'x'.repeat(3 * 1024 * 1024) }),
        app.post('/snippets/reorder', null, { raw: '{bad json', headers: { 'content-type': 'application/json' } })
    ]);
    assert.deepStrictEqual(responses.map((res) => res.status), [200, 413, 400]);
    for (const res of responses) assert.doesNotMatch(res.text, TECHNICAL_DETAILS);
});

test('custom greeting is shown as text', async () => {
    const greeting = '<img src=x onerror=alert(1)> {username}';
    await app.post('/settings/interface', {
        customGreetings: Array(4).fill(greeting).join(';'),
        customWeekdayNames: 'a;b;c;d;e;f;g',
        customMonthNames: 'a;b;c;d;e;f;g;h;i;j;k;l',
        siteName: 'Test'
    });
    const page = (await app.get('/')).text;
    assert.ok(!page.includes('<img src=x'));
    assert.ok(page.includes('&lt;img src=x'));
    assert.ok(page.includes('username-highlight'));
});

test('login starts a new session', async () => {
    const before = app.cookie;
    const res = await app.post('/login', { username: 'tester', password: PASSWORD });
    assert.strictEqual(res.status, 302);
    assert.notStrictEqual(app.cookie, before);
    assert.strictEqual((await app.get('/')).status, 200);
});

// Last on purpose: this locks the test client's IP out of logging in.
test('login locks after 10 failures but keeps existing sessions', async () => {
    for (let i = 0; i < 10; i++) {
        const res = await app.post('/login', { username: 'tester', password: 'wrong' }, { anon: true });
        assert.strictEqual(res.status, 200);
    }
    assert.strictEqual((await app.post('/login', { username: 'tester', password: PASSWORD }, { anon: true })).status, 429);
    assert.strictEqual((await app.get('/')).status, 200);
});
