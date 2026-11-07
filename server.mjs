import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const DEFAULT_PORT = 7817;
const MAX_BODY = 256 * 1024;
const MAX_MESSAGES = 40;
const MAX_MESSAGE_CHARS = 8000;
const MAX_CONTEXT_CHARS = 30_000;
const ALLOWED_HOSTS = new Set(['127.0.0.1', 'localhost', '[::1]']);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8'
};

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

function sendJson(response, status, payload) {
  const body = JSON.stringify(payload);
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body),
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'no-referrer'
  });
  response.end(body);
}

function hostOf(request) {
  const header = String(request.headers.host ?? '');
  if (!header) return '';
  if (header.startsWith('[')) return header.slice(0, header.indexOf(']') + 1);
  return header.split(':')[0].toLowerCase();
}
function originOf(request) {
  const origin = request.headers.origin;
  if (typeof origin !== 'string' || !origin) return null;
  try { return new URL(origin).host; } catch { return 'invalid'; }
}

function assertLocalRequest(request) {
  const host = hostOf(request);
  if (host && !ALLOWED_HOSTS.has(host)) throw new HttpError(403, 'This server only answers loopback requests.');
  const origin = originOf(request);
  if (origin === 'invalid') throw new HttpError(403, 'Malformed Origin header.');
  if (origin) {
    const name = origin.split(':')[0].toLowerCase();
    if (!ALLOWED_HOSTS.has(name) && name !== 'localhost') throw new HttpError(403, 'Cross-origin requests are not allowed.');
  }
}

const HARD_BODY_LIMIT = 4 * 1024 * 1024;

function readBody(request) {
  return new Promise((resolveBody, rejectBody) => {
    const chunks = [];
    let size = 0;
    let tooLarge = false;
    request.on('data', chunk => {
      size += chunk.length;
      if (size > HARD_BODY_LIMIT) { rejectBody(new HttpError(413, 'The request body is too large.')); request.destroy(); return; }
      if (size > MAX_BODY) { tooLarge = true; return; }
      chunks.push(chunk);
    });
    request.on('end', () => {
      if (tooLarge) { rejectBody(new HttpError(413, 'The request body is too large.')); return; }
      resolveBody(Buffer.concat(chunks).toString('utf8'));
    });
    request.on('error', () => rejectBody(new HttpError(400, 'The request could not be read.')));
  });
}

export function validateChatPayload(value) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new HttpError(400, 'Send a JSON object with messages.');
  const { messages, context } = value;
  if (!Array.isArray(messages) || messages.length === 0) throw new HttpError(400, 'messages must be a non-empty array.');
  if (messages.length > MAX_MESSAGES) throw new HttpError(400, `messages is limited to ${MAX_MESSAGES} entries.`);
  const clean = messages.map(entry => {
    if (typeof entry !== 'object' || entry === null) throw new HttpError(400, 'Every message needs a role and content.');
    const { role, content } = entry;
    if (role !== 'user' && role !== 'assistant') throw new HttpError(400, 'Each message role must be "user" or "assistant".');
    if (typeof content !== 'string' || !content.trim()) throw new HttpError(400, 'Each message needs non-empty content.');
    if (content.length > MAX_MESSAGE_CHARS) throw new HttpError(400, `A message is limited to ${MAX_MESSAGE_CHARS} characters.`);
    return { role, content };
  });
  if (context !== undefined && typeof context !== 'string') throw new HttpError(400, 'context must be a string when provided.');
  if (typeof context === 'string' && context.length > MAX_CONTEXT_CHARS) throw new HttpError(400, `context is limited to ${MAX_CONTEXT_CHARS} characters.`);
  return { messages: clean, context: context ?? '' };
}

async function askModel({ messages, context }, options) {
  const { apiKey, baseUrl, model, fetchImpl, timeoutMs } = options;
  if (!apiKey) throw new HttpError(503, 'Chat is not configured. Set OPENAI_API_KEY on the server to enable it.');
  const system = ['You are the assistant inside YDY, a calm workspace for creative work. Answer in plain prose, stay grounded in the supplied local context, never invent data.', context ? `Local context the user selected:\n${context}` : ''].filter(Boolean).join('\n\n');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, messages: [{ role: 'system', content: system }, ...messages], temperature: 0.6 }),
      signal: controller.signal
    });
    if (!response.ok) throw new HttpError(502, `The model service answered ${response.status}.`);
    const payload = await response.json();
    const text = payload?.choices?.[0]?.message?.content;
    if (typeof text !== 'string' || !text.trim()) throw new HttpError(502, 'The model service returned an empty answer.');
    return text.trim();
  } catch (error) {
    if (error instanceof HttpError) throw error;
    if (error?.name === 'AbortError') throw new HttpError(504, 'The model service took too long to answer.');
    throw new HttpError(502, 'The model service is unreachable.');
  } finally { clearTimeout(timer); }
}

async function serveStatic(request, response, rootDir) {
  const url = new URL(request.url ?? '/', 'http://127.0.0.1');
  let pathname;
  try { pathname = decodeURIComponent(url.pathname); } catch { throw new HttpError(400, 'Malformed path.'); }
  if (pathname.includes('\0')) throw new HttpError(400, 'Malformed path.');
  const root = resolve(rootDir);
  const candidate = resolve(root, `.${normalize(pathname)}`);
  if (candidate !== root && !candidate.startsWith(root + sep)) throw new HttpError(404, 'Not found.');
  let file = candidate;
  let info = await stat(file).catch(() => null);
  if (info?.isDirectory()) { file = join(file, 'index.html'); info = await stat(file).catch(() => null); }
  if (!info?.isFile()) {
    const html = join(root, 'index.html');
    const fallback = await stat(html).catch(() => null);
    if (!fallback?.isFile()) throw new HttpError(404, 'The app has not been built yet. Run npm run build.');
    file = html; info = fallback;
  }
  const type = MIME[extname(file).toLowerCase()] ?? 'application/octet-stream';
  response.writeHead(200, {
    'content-type': type,
    'content-length': info.size,
    'cache-control': file.endsWith('index.html') ? 'no-store' : 'public, max-age=3600',
    'x-content-type-options': 'nosniff'
  });
  createReadStream(file).pipe(response);
}

export function createAppServer(options = {}) {
  const settings = {
    rootDir: options.rootDir ?? join(HERE, 'dist'),
    apiKey: options.apiKey ?? process.env.OPENAI_API_KEY ?? '',
    baseUrl: options.baseUrl ?? process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1',
    model: options.model ?? process.env.YDY_MODEL ?? 'gpt-4o-mini',
    fetchImpl: options.fetchImpl ?? globalThis.fetch,
    timeoutMs: options.timeoutMs ?? 60_000
  };
  const hits = new Map();
  const limited = key => {
    const now = Date.now();
    const window = (hits.get(key) ?? []).filter(time => now - time < 60_000);
    window.push(now);
    hits.set(key, window);
    return window.length > 30;
  };
  return createServer(async (request, response) => {
    try {
      assertLocalRequest(request);
      const path = new URL(request.url ?? '/', 'http://127.0.0.1').pathname;
      if (path === '/api/health') {
        if (request.method !== 'GET' && request.method !== 'HEAD') throw new HttpError(405, 'Use GET for /api/health.');
        sendJson(response, 200, { ok: true, configured: Boolean(settings.apiKey), model: settings.apiKey ? settings.model : null });
        return;
      }
      if (path === '/api/chat') {
        if (request.method !== 'POST') throw new HttpError(405, 'Use POST for /api/chat.');
        const type = String(request.headers['content-type'] ?? '');
        if (!type.toLowerCase().startsWith('application/json')) throw new HttpError(415, 'Send application/json.');
        if (limited(request.socket.remoteAddress ?? 'local')) throw new HttpError(429, 'Too many messages. Wait a minute and try again.');
        const raw = await readBody(request);
        let payload;
        try { payload = JSON.parse(raw); } catch { throw new HttpError(400, 'The body is not valid JSON.'); }
        const clean = validateChatPayload(payload);
        const text = await askModel(clean, settings);
        sendJson(response, 200, { ok: true, text });
        return;
      }
      if (path.startsWith('/api/')) throw new HttpError(404, 'Unknown API route.');
      if (request.method !== 'GET' && request.method !== 'HEAD') throw new HttpError(405, 'This server only serves files with GET.');
      await serveStatic(request, response, settings.rootDir);
    } catch (error) {
      const status = error instanceof HttpError ? error.status : 500;
      const message = error instanceof HttpError ? error.message : 'The server hit an unexpected error.';
      if (!response.headersSent) sendJson(response, status, { ok: false, message });
      else response.destroy();
    }
  });
}

const isEntry = process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));
if (isEntry) {
  const port = Number(process.env.PORT ?? DEFAULT_PORT);
  const server = createAppServer({});
  server.listen(port, '127.0.0.1', () => {
    process.stdout.write(`YDY is running at http://127.0.0.1:${port}\n`);
    process.stdout.write(`${process.env.OPENAI_API_KEY ? 'Chat is configured.' : 'Chat is not configured: set OPENAI_API_KEY to enable it.'}\n`);
  });
  const stop = () => server.close(() => process.exit(0));
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
}
