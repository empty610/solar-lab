import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { sourceRoot, isRuntimeFile } from './site.mjs';

const mime = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.json':'application/json', '.svg':'image/svg+xml', '.jpg':'image/jpeg', '.png':'image/png', '.webp':'image/webp', '.mp3':'audio/mpeg', '.md':'text/plain; charset=utf-8', '.txt':'text/plain; charset=utf-8' };
const legacyRoutes = {
  '/terminal_preview/':'/terminal/', '/mercury_preview/preview_v2/':'/mercury/',
  '/venus_preview/':'/venus/', '/mars_preview/':'/mars/', '/jupiter_preview/preview_v1/':'/jupiter/',
  '/saturn_preview/':'/saturn/', '/uranus_preview/':'/uranus/', '/Neptune_preview/':'/neptune/',
  '/Europa_preview/':'/europa/', '/pluto_preview/':'/pluto/',
};

export function createPreviewServer(root = sourceRoot) {
  root = path.resolve(root);
  return http.createServer((request, response) => {
    if (!['GET', 'HEAD'].includes(request.method)) return response.writeHead(405, { Allow:'GET, HEAD' }).end();
    let file;
    try {
      const url = new URL(request.url, 'http://localhost');
      const pathname = decodeURIComponent(url.pathname);
      const alias = Object.keys(legacyRoutes).find(prefix => pathname.startsWith(prefix));
      if (alias) {
        let destination = legacyRoutes[alias] + pathname.slice(alias.length);
        if (alias === '/venus_preview/' && destination.endsWith('/venus_v3.html')) destination = '/venus/index.html';
        return response.writeHead(302, { Location: destination + url.search, 'Cache-Control':'no-store' }).end();
      }
      const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\//, '').replace(/\/$/, '/index.html');
      file = path.resolve(root, relative);
      if (!file.startsWith(root + path.sep)) return response.writeHead(404).end();
      if (fs.existsSync(file) && fs.lstatSync(file).isDirectory()) file = path.join(file, 'index.html');
      const resolved = path.relative(root, file);
      if (!isRuntimeFile(resolved)) return response.writeHead(404).end();
      // Reject symlink escapes even inside an otherwise allowed runtime directory.
      if (!fs.realpathSync(file).startsWith(fs.realpathSync(root) + path.sep)) return response.writeHead(404).end();
    } catch (error) { return response.writeHead(error.code === 'ENOENT' ? 404 : 400).end(); }
    const stat = fs.statSync(file);
    if (!stat.isFile()) return response.writeHead(404).end();
    let start = 0, end = stat.size - 1, status = 200;
    const headers = { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff', 'Accept-Ranges':'bytes' };
    if (request.headers.range) {
      const match = request.headers.range.match(/^bytes=(\d*)-(\d*)$/);
      if (!match || (!match[1] && !match[2])) return response.writeHead(416, { 'Content-Range':`bytes */${stat.size}` }).end();
      if (match[1]) { start = Number(match[1]); if (match[2]) end = Math.min(Number(match[2]), end); }
      else start = Math.max(0, stat.size - Number(match[2]));
      if (start > end || start < 0) return response.writeHead(416, { 'Content-Range':`bytes */${stat.size}` }).end();
      status = 206;
      headers['Content-Range'] = `bytes ${start}-${end}/${stat.size}`;
    }
    headers['Content-Length'] = Math.max(0, end - start + 1);
    response.writeHead(status, headers);
    if (request.method === 'HEAD' || stat.size === 0) return response.end();
    const stream = fs.createReadStream(file, { start, end });
    stream.on('error', () => response.destroy());
    response.on('close', () => stream.destroy());
    stream.pipe(response);
  });
}

export function startPreview(args = process.argv.slice(2)) {
  if (args.some(arg => arg !== '--dist')) throw new Error('Supported option: --dist');
  const root = args.includes('--dist') ? path.join(sourceRoot, 'dist') : sourceRoot;
  if (!fs.existsSync(path.join(root, 'terminal/index.html'))) throw new Error('Run npm run build before previewing dist.');
  const port = Number(process.env.PORT || 8810);
  const server = createPreviewServer(root);
  server.on('error', error => { console.error(error.message); process.exitCode = 1; });
  server.listen(port, '127.0.0.1', () => console.log(`Solar Lab (${args.includes('--dist') ? 'dist' : 'source'}): http://127.0.0.1:${server.address().port}/terminal/index.html`));
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try { startPreview(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
