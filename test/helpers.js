const fs = require('fs');
const os = require('os');
const net = require('net');
const path = require('path');
const { spawn, execFileSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');

const ROOT = path.join(__dirname, '..');
const PRISMA_CLI = path.join(ROOT, 'node_modules', 'prisma', 'build', 'index.js');
const PASSWORD = 'testpass1';

function fileUrl(filePath) {
    return `file:${filePath.replace(/\\/g, '/')}`;
}

function migrate(databaseUrl, schema) {
    const args = [PRISMA_CLI, 'migrate', 'deploy'];
    if (schema) args.push('--schema', schema);
    execFileSync(process.execPath, args, {
        cwd: ROOT,
        stdio: 'pipe',
        env: { ...process.env, DATABASE_URL: databaseUrl, CHECKPOINT_DISABLE: '1' }
    });
}

function freePort() {
    return new Promise((resolve) => {
        const server = net.createServer();
        server.listen(0, '127.0.0.1', () => {
            const { port } = server.address();
            server.close(() => resolve(port));
        });
    });
}

// A real app process against throwaway folders, so tests exercise the same middleware stack
// a browser would hit and can never touch an actual installation's data.
class TestApp {
    constructor() {
        this.dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bookmarkranger-test-'));
        this.dataDir = path.join(this.dir, 'data');
        this.backupsDir = path.join(this.dir, 'backups');
        fs.mkdirSync(this.dataDir);
        fs.mkdirSync(this.backupsDir);
        this.dbPath = path.join(this.dataDir, 'test.db');
        this.databaseUrl = fileUrl(this.dbPath);
        this.cookie = '';
        migrate(this.databaseUrl);
    }

    async start() {
        this.port = await freePort();
        this.base = `http://127.0.0.1:${this.port}`;
        const env = {
            ...process.env,
            PORT: String(this.port),
            DATABASE_URL: this.databaseUrl,
            DATA_DIR: this.dataDir,
            BACKUPS_DIR: this.backupsDir
        };
        delete env.SESSION_SECRET;
        delete env.NODE_ENV;
        this.process = spawn(process.execPath, ['app.js'], { cwd: ROOT, env, stdio: process.env.TEST_DEBUG ? 'inherit' : 'ignore' });
        for (let i = 0; i < 100; i++) {
            try {
                await fetch(`${this.base}/api/health`);
                return this;
            } catch (err) {
                await new Promise((resolve) => setTimeout(resolve, 100));
            }
        }
        throw new Error('App did not start');
    }

    async stop() {
        if (!this.process) return;
        const exited = new Promise((resolve) => this.process.once('exit', resolve));
        this.process.kill();
        await exited;
        this.process = null;
    }

    async destroy() {
        await this.stop();
        fs.rmSync(this.dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
    }

    db() {
        return new PrismaClient({ datasourceUrl: this.databaseUrl });
    }

    // Keeps its session cookie like a browser unless called with { anon: true }.
    async request(method, urlPath, body, options = {}) {
        const headers = { ...(options.headers || {}) };
        if (this.cookie && !options.anon) headers.cookie = this.cookie;

        let payload;
        if (options.raw !== undefined) {
            payload = options.raw;
        } else if (options.json) {
            headers['content-type'] = 'application/json';
            payload = JSON.stringify(body);
        } else if (body) {
            headers['content-type'] = 'application/x-www-form-urlencoded';
            payload = new URLSearchParams(body).toString();
        }

        const res = await fetch(this.base + urlPath, { method, headers, body: payload, redirect: 'manual' });
        const setCookies = res.headers.getSetCookie();
        if (!options.anon) {
            for (const cookie of setCookies) {
                const pair = cookie.split(';')[0];
                const name = pair.split('=')[0];
                this.cookie = this.cookie.split('; ').filter((c) => c && !c.startsWith(`${name}=`)).concat(pair).join('; ');
            }
        }
        return { status: res.status, location: res.headers.get('location'), type: res.headers.get('content-type'), text: await res.text(), setCookies };
    }

    get(urlPath, options) {
        return this.request('GET', urlPath, null, options);
    }

    post(urlPath, body, options) {
        return this.request('POST', urlPath, body, options);
    }

    setup() {
        return this.post('/setup', { username: 'tester', password: PASSWORD, passwordConfirm: PASSWORD });
    }
}

module.exports = { TestApp, PASSWORD, ROOT, fileUrl, migrate };
