const { test, before, after } = require('node:test');
const assert = require('node:assert');
const { TestApp, PASSWORD } = require('./helpers');

let app;
let db;
let boardId;
let categoryId;

async function addBookmark(title) {
    await app.post('/bookmarks', { title, url: `http://127.0.0.1:1/${title}`, categoryId });
    return db.bookmark.findFirst({ where: { title } });
}

async function pinnedPair(a, b) {
    const first = await addBookmark(a);
    const second = await addBookmark(b);
    await app.post(`/bookmarks/${first.id}/pin`);
    await app.post(`/bookmarks/${second.id}/pin`);
    await app.post('/dashboard-groups', { bookmarkIds: [first.id, second.id] }, { json: true });
    return [first, second];
}

before(async () => {
    app = await new TestApp().start();
    await app.setup();
    db = app.db();
    const board = await app.post('/bookmarks/boards', { name: 'Board' });
    boardId = Number(board.location.split('=')[1]);
    await app.post('/bookmarks/categories', { name: 'Category', boardId });
    categoryId = (await db.category.findFirst()).id;
});

after(async () => {
    await db.$disconnect();
    await app.destroy();
});

test('all main pages render', async () => {
    const pages = ['/', '/bookmarks', '/snippets', '/shared', '/settings/theme', '/settings/general', '/settings/interface', '/settings/weather', '/settings/account', '/settings/app', '/settings/backups', '/bookmarks/add', '/snippets/add', '/settings/theme/custom/add'];
    for (const page of pages) assert.strictEqual((await app.get(page)).status, 200, page);
});

test('login and account messages show text, not keys', async () => {
    const wrongLogin = await app.post('/login', { username: 'tester', password: 'wrong' }, { anon: true });
    assert.ok(wrongLogin.text.includes('Benutzername oder Passwort falsch'));

    const saved = await app.post('/settings/account', { username: 'tester', currentPassword: PASSWORD });
    assert.ok(saved.text.includes('Änderungen gespeichert'));

    const missing = await app.post('/settings/account', { username: 'tester' });
    assert.ok(missing.text.includes('Das aktuelle Passwort ist falsch'));
});

test('language switch applies to the same response', async () => {
    const res = await app.post('/settings/account', { username: 'tester', currentPassword: PASSWORD, language: 'en' });
    assert.ok(res.text.includes('Changes saved'));
    assert.match(res.text, /<title>Settings — Account/);
    await app.post('/settings/account', { username: 'tester', currentPassword: PASSWORD, language: 'de' });
});

test('delete prompts use a data attribute with the exact name', async () => {
    await addBookmark("Bob's R&D");
    const page = (await app.get(`/bookmarks?board=${boardId}`)).text;
    assert.doesNotMatch(page, /onsubmit=|return confirm/);
    assert.ok(page.includes('data-confirm="&#34;Bob&#39;s R&amp;D&#34; wirklich löschen?"'));
    assert.ok(page.includes('e.target.dataset.confirm'));
});

test('the X on a group member redirects, dragging out stays JSON', async () => {
    const [first, second] = await pinnedPair('X1', 'X2');
    const group = (await db.bookmark.findUnique({ where: { id: first.id } })).dashboardGroupId;

    const form = await app.post(`/dashboard-groups/bookmarks/${first.id}/remove`, {}, { headers: { referer: `${app.base}/` } });
    assert.strictEqual(form.status, 302);

    await app.post(`/dashboard-groups/${group}/bookmarks`, { bookmarkId: first.id }, { json: true });
    const drag = await app.post(`/dashboard-groups/bookmarks/${second.id}/remove`, {}, { json: true });
    assert.deepStrictEqual(JSON.parse(drag.text), { ok: true });
});

test('unpinning leaves the group, and empty groups disappear', async () => {
    await db.dashboardGroup.deleteMany();
    const [first, second] = await pinnedPair('U1', 'U2');

    await app.post(`/bookmarks/${first.id}/pin`);
    const unpinned = await db.bookmark.findUnique({ where: { id: first.id } });
    assert.strictEqual(unpinned.isPinned, false);
    assert.strictEqual(unpinned.dashboardGroupId, null);
    assert.strictEqual(await db.dashboardGroup.count(), 1);

    await app.post(`/bookmarks/${second.id}/delete`);
    assert.strictEqual(await db.dashboardGroup.count(), 0);
});

test('deleting a category or board removes groups left empty', async () => {
    await app.post('/bookmarks/boards', { name: 'Temp' });
    const tempBoard = await db.board.findFirst({ where: { name: 'Temp' } });
    await app.post('/bookmarks/categories', { name: 'Temp category', boardId: tempBoard.id });
    const tempCategory = await db.category.findFirst({ where: { name: 'Temp category' } });

    const ownCategory = categoryId;
    categoryId = tempCategory.id;
    await pinnedPair('C1', 'C2');
    categoryId = ownCategory;
    assert.strictEqual(await db.dashboardGroup.count(), 1);

    await app.post(`/bookmarks/boards/${tempBoard.id}/delete`);
    assert.strictEqual(await db.dashboardGroup.count(), 0);
});

test('a bad id in group creation leaves nothing behind', async () => {
    const bookmark = await addBookmark('G1');
    const res = await app.post('/dashboard-groups', { bookmarkIds: [bookmark.id, 999999] }, { json: true });
    assert.strictEqual(res.status, 404);
    assert.strictEqual(await db.dashboardGroup.count(), 0);
    assert.strictEqual((await db.bookmark.findUnique({ where: { id: bookmark.id } })).dashboardGroupId, null);
});

test('pinned snippets follow the dragged order and the sorting setting', async () => {
    for (const title of ['S1', 'S2', 'S3']) await app.post('/snippets', { title, language: 'js', code: '1' });
    const snippets = await db.snippet.findMany({ where: { title: { in: ['S1', 'S2', 'S3'] } }, orderBy: { id: 'asc' } });
    for (const snippet of snippets) await app.post(`/snippets/${snippet.id}/pin`);

    const order = async () => {
        const page = (await app.get('/')).text;
        return snippets
            .map((snippet) => [snippet.title, page.indexOf(`/snippets/${snippet.id}"`)])
            .sort((a, b) => a[1] - b[1])
            .map(([title]) => title)
            .join();
    };

    await db.settings.updateMany({ data: { sortingType: 'custom' } });
    await app.post('/snippets/reorder', { ids: [snippets[1].id, snippets[2].id, snippets[0].id] }, { json: true });
    assert.strictEqual(await order(), 'S2,S3,S1');

    await db.settings.updateMany({ data: { sortingType: 'name' } });
    assert.strictEqual(await order(), 'S1,S2,S3');
    await db.settings.updateMany({ data: { sortingType: 'createdAt' } });
});

test('unknown or invalid ids show the not-found page', async () => {
    const requests = [
        ['GET', '/bookmarks/9999/edit'], ['GET', '/bookmarks/abc/edit'], ['GET', '/bookmarks/99999999999999/edit'],
        ['GET', '/snippets/9999/edit'], ['GET', '/snippets/abc'], ['POST', '/bookmarks/9999/pin'],
        ['POST', '/snippets/9999/pin'], ['POST', '/bookmarks/categories/9999/pin'], ['POST', '/bookmarks/boards/9999/delete'],
        ['POST', '/shared/9999/delete'], ['POST', '/snippets/9999/delete'], ['POST', '/settings/theme/custom/9999/delete']
    ];
    for (const [method, url] of requests) {
        assert.strictEqual((await app.request(method, url)).status, 404, `${method} ${url}`);
    }
});

test('malformed reorder lists and repeated query values do not crash', async () => {
    assert.strictEqual((await app.post('/bookmarks/reorder', { ids: '5' }, { json: true })).status, 200);
    for (const url of ['/?q=a&q=b', '/api/search-check?q=a&q=b', '/snippets?q=a&q=b', '/snippets?sort=a&sort=b']) {
        assert.strictEqual((await app.get(url)).status, 200, url);
    }
});

test('snippets up to 2 MB are accepted', async () => {
    const res = await app.post('/snippets', { title: 'Big', language: 'js', code: 'x'.repeat(1024 * 1024) });
    assert.strictEqual(res.status, 302);
});

test('bookmarks fall back to the local icon', async () => {
    const board = await db.board.create({ data: { name: 'icons' } });
    const category = await db.category.create({ data: { name: 'c', boardId: board.id } });
    await db.bookmark.create({ data: { title: 'none', url: 'https://example.com/', isPinned: true, categoryId: category.id } });
    await db.bookmark.create({ data: { title: 'own', url: 'https://example.org/', icon: 'https://example.org/own.png', isPinned: true, categoryId: category.id } });

    const fallback = '/ressources/bookmark-fallback.svg';
    const pages = [await app.get('/'), await app.get(`/bookmarks/boards/${board.id}/panel`)];
    for (const page of pages) {
        assert.strictEqual(page.status, 200);
        // The panel arrives as JSON, with its quotes escaped.
        const html = page.text.replaceAll('\\"', '"');
        assert.ok(html.includes(`<img src="${fallback}"`));
        assert.ok(html.includes('<img src="https://example.org/own.png"'));
        assert.ok(html.includes(`data-fallback="${fallback}"`));
    }
    const file = await app.get(fallback);
    assert.strictEqual(file.status, 200);
    assert.match(file.type, /svg/);

    await db.board.delete({ where: { id: board.id } });
});

test('dates are stored in the format existing databases use', async () => {
    const board = await db.board.create({ data: { name: 'dates' } });
    const [{ type }] = await db.$queryRawUnsafe('SELECT typeof(createdAt) AS type FROM Board WHERE id = ?', board.id);
    assert.strictEqual(type, 'integer');
    assert.ok(Math.abs(board.createdAt.getTime() - Date.now()) < 60000);
    await db.board.delete({ where: { id: board.id } });
});

// Last on purpose: invalidates the session the other tests use.
test('a session whose account no longer exists goes back to login', async () => {
    const other = await db.account.create({ data: { username: 'other', passwordHash: 'x' } });
    await db.account.delete({ where: { id: (await db.account.findFirst({ where: { username: 'tester' } })).id } });
    const res = await app.get('/');
    assert.strictEqual(res.status, 302);
    assert.match(res.location, /\/login$/);
    await db.account.delete({ where: { id: other.id } });
});
