// The offline helper must save every file the site needs, or a game breaks when there's no internet.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const SITE = new URL('../../site/', import.meta.url).pathname;
const sw = readFileSync(join(SITE, 'sw.js'), 'utf8');
const listed = [...sw.match(/const FILES = \[([\s\S]*?)\];/)[1].matchAll(/'([^']+)'/g)].map(m => m[1]);

/** @param {string} dir @returns {string[]} */
function filesIn(dir) {
  return readdirSync(dir).flatMap(name => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? filesIn(path) : [relative(SITE, path)];
  });
}

test('every file in site/ is saved for offline play', () => {
  const missing = filesIn(SITE).filter(f => f !== 'sw.js' && !listed.includes(f));
  assert.deepEqual(missing, []);
});

test('every saved file exists, and every game folder is saved by its own address', () => {
  for (const f of listed) {
    const path = f === './' ? join(SITE, 'index.html') : f.endsWith('/') ? join(SITE, f, 'index.html') : join(SITE, f);
    assert.ok(existsSync(path), f);
  }
  for (const dir of readdirSync(SITE).filter(d => existsSync(join(SITE, d, 'index.html')))) {
    assert.ok(listed.includes(`${dir}/`), `${dir}/ must be listed so it opens offline`);
  }
});

test('the offline helper only handles this site, and is stamped with a version on deploy', () => {
  assert.match(sw, /origin !== self\.location\.origin\) return/);
  assert.match(sw, /const VERSION = '__VERSION__'/);
  const ci = readFileSync(new URL('../../.github/workflows/ci.yml', import.meta.url), 'utf8');
  assert.match(ci, /s\/__VERSION__\/\$\{GITHUB_SHA\}\//);
});

test('every page links the app manifest and home-screen icon', () => {
  for (const page of ['index.html', 'under-the-sea/index.html', 'who-lives-here/index.html', 'note-flash/index.html', 'practice-buddy/index.html']) {
    const html = readFileSync(join(SITE, page), 'utf8');
    assert.match(html, /rel="manifest" href="(\.\.\/)?manifest\.webmanifest"/, page);
    assert.match(html, /rel="apple-touch-icon"/, page);
  }
  const manifest = JSON.parse(readFileSync(join(SITE, 'manifest.webmanifest'), 'utf8'));
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.start_url, './');
  assert.ok(manifest.icons.some(i => i.sizes === '512x512' && i.purpose === 'maskable'));
});
