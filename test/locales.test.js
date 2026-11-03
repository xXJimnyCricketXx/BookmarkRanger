const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { ROOT } = require('./helpers');

const de = require('../locales/de/translation.json');
const en = require('../locales/en/translation.json');

const flatten = (object, prefix = '') => Object.entries(object).flatMap(([key, value]) => (
    value && typeof value === 'object' ? flatten(value, `${prefix}${key}.`) : [`${prefix}${key}`]
));
const lookup = (object, key) => key.split('.').reduce((value, part) => (value == null ? value : value[part]), object);

function sourceFiles(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const entryPath = path.join(dir, entry.name);
        return entry.isDirectory() ? sourceFiles(entryPath) : [entryPath];
    });
}

test('German and English define the same keys', () => {
    assert.deepStrictEqual(flatten(de).sort(), flatten(en).sort());
});

test('every translation key used in the code exists', () => {
    const files = ['views', 'controllers', 'middleware'].flatMap((dir) => sourceFiles(path.join(ROOT, dir)));
    const used = new Set();
    for (const file of files) {
        const source = fs.readFileSync(file, 'utf8');
        for (const match of source.matchAll(/\bt\(\s*['"]([a-zA-Z0-9_.]+)['"]/g)) used.add(match[1]);
        for (const match of source.matchAll(/(?:error|success|notice):\s*'([a-zA-Z_]+\.[a-zA-Z_.]+)'/g)) used.add(match[1]);
    }
    const missing = [...used].filter((key) => lookup(de, key) === undefined);
    assert.deepStrictEqual(missing, []);
});
