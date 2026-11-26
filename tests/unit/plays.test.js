// Beta and public copies stay apart on one device, and finished games are counted without tracking anyone.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { channelOf } from '../../site/kit/channel.js';
import { playEvent, shouldSend, CAP, COUNTER_CODE, PUBLIC_HOST } from '../../site/kit/plays.js';

test('the beta copy is recognised by its folder', () => {
  assert.equal(channelOf('/Under-The-C/beta/note-flash/'), 'beta');
  assert.equal(channelOf('/Under-The-C/note-flash/'), 'stable');
  assert.equal(channelOf('/'), 'stable');
});

test('milestones name the place and the count, and stop at 10plus', () => {
  assert.equal(playEvent(1, true), 'home-play-1');
  assert.equal(playEvent(4, false), 'tab-play-4');
  assert.equal(playEvent(CAP, true), 'home-play-10plus');
});

test('only the public site sends, only with a counter code, and only up to the cap', () => {
  const ok = { code: 'abc', host: PUBLIC_HOST, channel: 'stable', n: 3 };
  assert.equal(shouldSend(ok), true);
  assert.equal(shouldSend({ ...ok, code: '' }), false);
  assert.equal(shouldSend({ ...ok, channel: 'beta' }), false);
  assert.equal(shouldSend({ ...ok, host: '127.0.0.1' }), false);
  assert.equal(shouldSend({ ...ok, n: CAP + 1 }), false);
  assert.match(COUNTER_CODE, /^[a-z0-9-]*$/, 'a plain GoatCounter code, nothing else');
});

/** Runs sw.js as if served from `swPath`, with a fake cache store holding `keys`. Returns what it deleted. */
async function activate(swPath, keys) {
  const listeners = {};
  const deleted = [];
  const self = {
    location: new URL(`https://tchris43.github.io${swPath}`),
    addEventListener: (type, fn) => { listeners[type] = fn; },
    skipWaiting: () => {}, clients: { claim: async () => {} },
  };
  const caches = { keys: async () => keys, delete: async k => { deleted.push(k); return true; } };
  vm.runInNewContext(readFileSync(new URL('../../site/sw.js', import.meta.url), 'utf8'), { self, caches, URL, Promise, fetch: () => {} });
  let done;
  listeners.activate({ waitUntil: p => { done = p; } });
  await done;
  return { deleted, listeners };
}

test('a public-site update clears only its own old offline files, never the beta copy\'s', async () => {
  const { deleted } = await activate('/Under-The-C/sw.js', ['under-the-c-old', 'under-the-c-__VERSION__', 'beta-old']);
  assert.deepEqual(deleted, ['under-the-c-old']);
});

test('a beta update clears only beta\'s old offline files', async () => {
  const { deleted } = await activate('/Under-The-C/beta/sw.js', ['under-the-c-old', 'beta-old', 'beta-__VERSION__']);
  assert.deepEqual(deleted, ['beta-old']);
});

test('the public helper leaves beta pages to the beta helper', async () => {
  const { listeners } = await activate('/Under-The-C/sw.js', []);
  let handled = false;
  listeners.fetch({ request: { method: 'GET', url: 'https://tchris43.github.io/Under-The-C/beta/note-flash/' }, respondWith: p => { handled = true; p.catch(() => {}); } });
  assert.equal(handled, false);
  listeners.fetch({ request: { method: 'GET', url: 'https://tchris43.github.io/Under-The-C/note-flash/' }, respondWith: p => { handled = true; p.catch(() => {}); } });
  assert.equal(handled, true);
});
