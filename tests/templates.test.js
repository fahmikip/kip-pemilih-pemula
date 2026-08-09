const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const router = fs.readFileSync('src/Router.gs', 'utf8');
const htmlFiles = new Set(fs.readdirSync('src').filter(name => name.endsWith('.html')).map(name => path.basename(name, '.html')));
const references = [];
for (const source of [router].concat([...htmlFiles].map(name => fs.readFileSync(path.join('src', name + '.html'), 'utf8')))) {
  for (const match of source.matchAll(/(?:createTemplateFromFile|include_)\(['"]([^'"]+)['"]\)/g)) references.push(match[1]);
}
assert.ok(references.length >= 3, 'referensi template tidak ditemukan');
for (const name of references) {
  assert.equal(name.includes('/'), false, 'Nama template Apps Script harus datar: ' + name);
  assert.ok(htmlFiles.has(name), 'Template tidak ditemukan: ' + name);
}
console.log('Template checks passed:', references.join(', '));
