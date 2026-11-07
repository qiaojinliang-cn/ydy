import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { request as httpRequest } from 'node:http';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createAppServer, validateChatPayload } from '../server.mjs';

let root;
let server;
let base;

before(async () => {
  root = await mkdtemp(join(tmpdir(), 'ydy-test-'));
  await mkdir(join(root, 'assets'), { recursive: true });
  await writeFile(join(root, 'index.html'), '<!doctype html><title>YDY</title><div id="root"></div>');
  await writeFile(join(root, 'assets', 'app.js'), 'export const ok = true;');
  server = createAppServer({ rootDir: root, apiKey: '' });
  await new Promise(done => server.listen(0, '127.0.0.1', done));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise(done => server.close(done));
  await rm(root, { recursive: true, force: true });
});

function requestWithHost(path, host) {
  const { hostname, port } = new URL(base);
  return new Promise((resolve, reject) => {
    const req = httpRequest({ host: hostname, port, path, method: 'GET', headers: { host } }, response => {
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => resolve({ status: response.statusCode, body: Buffer.concat(chunks).toString('utf8') }));
    });
    req.on('error', reject);
    req.end();
  });
}

test('health reports configuration without leaking a key', async () => {
  const response = await fetch(`${base}/api/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, configured: false, model: null });
});

test('chat refuses when no model is configured, and never fakes an answer', async () => {
  const response = await fetch(`${base}/api/chat`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ messages: [{ role: 'user', content: 'Hello' }] }) });
  assert.equal(response.status, 503);
  const payload = await response.json();
  assert.equal(payload.ok, false);
  assert.match(payload.message, /not configured/i);
});

test('chat rejects the wrong method, content type, malformed JSON, and oversized bodies', async () => {
  assert.equal((await fetch(`${base}/api/chat`)).status, 405);
  assert.equal((await fetch(`${base}/api/chat`, { method: 'POST', headers: { 'content-type': 'text/plain' }, body: 'x' })).status, 415);
  assert.equal((await fetch(`${base}/api/chat`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{oops' })).status, 400);
  const big = JSON.stringify({ messages: [{ role: 'user', content: 'x'.repeat(300 * 1024) }] });
  assert.equal((await fetch(`${base}/api/chat`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: big })).status, 413);
});

test('payload validation enforces roles, sizes, and a string context', () => {
  assert.deepEqual(validateChatPayload({ messages: [{ role: 'user', content: 'Hi' }] }), { messages: [{ role: 'user', content: 'Hi' }], context: '' });
  assert.throws(() => validateChatPayload(null), /JSON object/);
  assert.throws(() => validateChatPayload({ messages: [] }), /non-empty/);
  assert.throws(() => validateChatPayload({ messages: [{ role: 'system', content: 'x' }] }), /role/);
  assert.throws(() => validateChatPayload({ messages: [{ role: 'user', content: '   ' }] }), /non-empty/);
  assert.throws(() => validateChatPayload({ messages: [{ role: 'user', content: 'x'.repeat(8001) }] }), /limited/);
  assert.throws(() => validateChatPayload({ messages: Array.from({ length: 41 }, () => ({ role: 'user', content: 'x' })) }), /limited/);
  assert.throws(() => validateChatPayload({ messages: [{ role: 'user', content: 'x' }], context: 5 }), /context/);
});

test('a configured model returns its text and receives the system context', async () => {
  const calls = [];
  const stub = createAppServer({
    rootDir: root,
    apiKey: 'test-key',
    model: 'test-model',
    fetchImpl: async (url, init) => {
      calls.push({ url, init, body: JSON.parse(init.body) });
      return new Response(JSON.stringify({ choices: [{ message: { content: '  A real answer  ' } }] }), { status: 200 });
    }
  });
  await new Promise(done => stub.listen(0, '127.0.0.1', done));
  try {
    const response = await fetch(`http://127.0.0.1:${stub.address().port}/api/chat`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ messages: [{ role: 'user', content: 'Hello' }], context: 'Local note' }) });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true, text: 'A real answer' });
    assert.equal(calls.length, 1);
    assert.match(calls[0].url, /\/chat\/completions$/);
    assert.equal(calls[0].body.model, 'test-model');
    assert.equal(calls[0].body.messages[0].role, 'system');
    assert.match(calls[0].body.messages[0].content, /Local note/);
    assert.equal(calls[0].init.headers.authorization, 'Bearer test-key');
  } finally {
    await new Promise(done => stub.close(done));
  }
});

test('model failures surface as honest errors, never an empty success', async () => {
  const failing = createAppServer({ rootDir: root, apiKey: 'k', fetchImpl: async () => new Response('nope', { status: 500 }) });
  await new Promise(done => failing.listen(0, '127.0.0.1', done));
  try {
    const response = await fetch(`http://127.0.0.1:${failing.address().port}/api/chat`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ messages: [{ role: 'user', content: 'Hi' }] }) });
    assert.equal(response.status, 502);
    assert.equal((await response.json()).ok, false);
  } finally {
    await new Promise(done => failing.close(done));
  }
});

test('static files, SPA fallback, and traversal protection', async () => {
  const index = await fetch(`${base}/`);
  assert.equal(index.status, 200);
  assert.match(index.headers.get('content-type'), /text\/html/);
  assert.equal(await index.text(), '<!doctype html><title>YDY</title><div id="root"></div>');
  const script = await fetch(`${base}/assets/app.js`);
  assert.equal(script.status, 200);
  assert.match(script.headers.get('content-type'), /javascript/);
  const deepLink = await fetch(`${base}/strategy/some-board`);
  assert.equal(deepLink.status, 200);
  for (const path of ['/../../etc/passwd', '/%2e%2e%2f%2e%2e%2fetc%2fpasswd', '/..%2f..%2fetc%2fpasswd']) {
    const escaped = await fetch(`${base}${path}`);
    assert.ok([200, 400, 404].includes(escaped.status), `${path} returned ${escaped.status}`);
    assert.ok(!(await escaped.text()).includes('root:'));
  }
});

test('unknown API routes and non-loopback hosts are refused', async () => {
  assert.equal((await fetch(`${base}/api/unknown`)).status, 404);
  assert.equal((await requestWithHost('/api/health', 'evil.example.com')).status, 403);
  assert.equal((await fetch(`${base}/api/health`, { headers: { origin: 'https://evil.example.com' } })).status, 403);
  assert.equal((await fetch(`${base}/api/health`, { headers: { origin: `http://127.0.0.1:${new URL(base).port}` } })).status, 200);
});
