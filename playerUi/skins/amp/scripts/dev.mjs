// npm run dev: serves this folder and reloads the page when a source file changes.
//   PORT=8002 npm run dev          choose the port (default 8000)
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { watch } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';

const ROOT = resolve('.');
const PORT = Number(process.env.PORT) || 8000;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.vtt': 'text/vtt; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.map': 'application/json',
};
const RELOAD = `<script>new EventSource('/__reload').onmessage = () => location.reload();</script>`;

const clients = new Set();
let timer;
watch(ROOT, { recursive: true }, (_, file) => {
  if (!file || /^(node_modules|dist|\.git)/.test(file)) return;
  clearTimeout(timer);
  timer = setTimeout(() => clients.forEach(res => res.write('data: reload\n\n')), 50);
});

function resolvePath(urlPath) {
  const clean = normalize(decodeURIComponent(urlPath.split('?')[0])).replace(/^(\.\.[/\\])+/, '');
  return join(ROOT, clean);
}

createServer(async (req, res) => {
  if (req.url === '/__reload') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', Connection: 'keep-alive' });
    clients.add(res);
    req.on('close', () => clients.delete(res));
    return;
  }
  try {
    let file = resolvePath(req.url);
    if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
    let body = await readFile(file);
    const type = TYPES[extname(file)] || 'application/octet-stream';
    if (type.startsWith('text/html')) body = Buffer.from(body.toString().replace('</body>', `${RELOAD}</body>`));
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' });
    res.end(body);
  } catch {
    res.writeHead(404).end('Not found');
  }
}).listen(PORT, () => {
  console.log(`http://localhost:${PORT}/index.html`);
});
