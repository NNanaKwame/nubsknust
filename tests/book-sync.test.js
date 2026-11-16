import test from 'node:test';
import assert from 'node:assert/strict';
import { syncBooks, listDriveChildren, retryGemini } from '../generate-books.js';

const file = { id: 'one', name: 'Book.pdf', category: 'doctrine', createdTime: '2026-01-01', modifiedTime: '2026-02-01' };
const metadata = { title: 'Book', author: 'Author', description: 'Summary' };

test('new and legacy books are processed, unchanged books skip extraction', async () => {
  let calls = 0;
  const extract = async () => { calls++; return metadata; };
  const first = await syncBooks([file], [], extract);
  assert.equal(first.processed, 1);
  const second = await syncBooks([file], first.items, extract);
  assert.equal(calls, 1);
  assert.deepEqual(second.items, first.items);
  await syncBooks([file], [{ id: file.id, ...metadata }], extract);
  assert.equal(calls, 2);
});

test('modified PDFs reprocess; category moves reuse metadata; removed books disappear', async () => {
  const first = await syncBooks([file], [], async () => metadata);
  const moved = await syncBooks([{ ...file, category: 'leadership' }], first.items, () => { throw Error('should skip'); });
  assert.equal(moved.items[0].categoryName, 'Leadership');
  const changed = await syncBooks([{ ...file, modifiedTime: '2026-03-01' }], first.items, async () => ({ ...metadata, title: 'Revised' }));
  assert.equal(changed.items[0].title, 'Revised');
  assert.equal(changed.processed, 1);
  assert.deepEqual((await syncBooks([], first.items, () => {})).items, []);
});

test('extraction failures abort without mutating previous metadata', async () => {
  const existing = [{ id: file.id, ...metadata, modifiedTime: 'old' }];
  const copy = structuredClone(existing);
  await assert.rejects(syncBooks([file], existing, async () => { throw Error('quota'); }), /quota/);
  assert.deepEqual(existing, copy);
});

test('Drive listing follows pagination and rejects failed responses', async () => {
  const originalFetch = globalThis.fetch;
  const urls = [];
  try {
    globalThis.fetch = async url => {
      urls.push(new URL(url));
      return { ok: true, json: async () => urls.length === 1 ? { files: [file], nextPageToken: 'next' } : { files: [{ ...file, id: 'two' }] } };
    };
    assert.equal((await listDriveChildren('folder', 'test')).length, 2);
    assert.equal(urls[1].searchParams.get('pageToken'), 'next');
    globalThis.fetch = async () => ({ ok: false, status: 403 });
    await assert.rejects(listDriveChildren('folder', 'test'), /403/);
  } finally { globalThis.fetch = originalFetch; }
});


test('transient Gemini failures retry, permanent errors stop, and retries are bounded', async () => {
  let calls = 0;
  const options = { sleep: async () => {}, warn: () => {} };
  assert.equal(await retryGemini(async () => { if (++calls < 3) throw Error('fetch failed'); return 'ok'; }, options), 'ok');
  assert.equal(calls, 3);
  calls = 0;
  await assert.rejects(retryGemini(async () => { calls++; throw Object.assign(Error('Forbidden'), {status:403}); }, options));
  assert.equal(calls, 1);
  calls = 0;
  await assert.rejects(retryGemini(async () => { calls++; throw Object.assign(Error('Unavailable'), {status:503}); }, options));
  assert.equal(calls, 3);
});
