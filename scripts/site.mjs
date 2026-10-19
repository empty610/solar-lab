import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { Script } from 'node:vm';

export const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const pages = ['terminal', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'europa', 'pluto'];
export const rootFiles = ['index.html', '404.html', '_headers'];
export const runtimeDirectories = [...pages, 'shared'];
const excluded = new Set(['node_modules', '_backups', 'tests', 'scripts', 'dist']);
export const slash = value => value.split(path.sep).join('/');

export function isRuntimeFile(relative) {
  const parts = slash(relative).split('/');
  if (parts.some(part => part.startsWith('.') || excluded.has(part))) return false;
  return parts.length === 1 ? rootFiles.includes(parts[0]) : runtimeDirectories.includes(parts[0]);
}

export function runtimeFiles(root = sourceRoot) {
  const files = [];
  function walk(relative) {
    const absolute = path.join(root, relative);
    const stat = fs.lstatSync(absolute);
    if (stat.isSymbolicLink()) throw new Error('Runtime symlink is not supported: ' + relative);
    if (stat.isDirectory()) {
      for (const name of fs.readdirSync(absolute).sort()) {
        if (name.startsWith('.') || excluded.has(name)) continue;
        walk(path.join(relative, name));
      }
    } else if (isRuntimeFile(relative)) files.push(slash(relative));
  }
  for (const relative of [...rootFiles, ...runtimeDirectories]) {
    if (!fs.existsSync(path.join(root, relative))) throw new Error('Missing runtime entry: ' + relative);
    walk(relative);
  }
  for (const page of pages) {
    if (!files.includes(page + '/index.html')) throw new Error('Missing page: ' + page + '/index.html');
  }
  return files.sort();
}

export function versionHTML(html, relative, root) {
  return html.replace(/((?:src|href)=(['"]))([^'"]+\.(?:js|css))([^'"]*)(\2)/g,
    (match, start, quote, reference, suffix, end) => {
      if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(reference) || /^(?:vendor|assets)\//.test(reference)) return match;
      const file = reference.startsWith('/')
        ? path.join(root, reference)
        : path.resolve(root, path.dirname(relative), reference);
      if (!file.startsWith(root + path.sep)) throw new Error('Asset outside site: ' + reference);
      const version = createHash('sha256').update(fs.readFileSync(file)).digest('hex').slice(0, 12);
      const hashAt = suffix.indexOf('#');
      const fragment = hashAt < 0 ? '' : suffix.slice(hashAt);
      const search = hashAt < 0 ? suffix : suffix.slice(0, hashAt);
      const params = new URLSearchParams(search);
      params.set('v', version);
      return `${start}${reference}?${params}${fragment}${end}`;
    });
}

export function validateSite(root = sourceRoot, { syntax = true } = {}) {
  root = path.resolve(root);
  const files = runtimeFiles(root), known = new Set(files);
  let references = 0;
  for (const relative of files) {
    const file = path.join(root, relative);
    if (fs.statSync(file).size >= 25 * 1024 * 1024) throw new Error('Asset exceeds Pages limit: ' + relative);
    if (syntax && relative.endsWith('.js') && !/(?:^|\/)(?:vendor|assets)\//.test(relative)) {
      new Script(fs.readFileSync(file, 'utf8'), { filename: relative });
    }
    if (!/\.(?:html|css)$/.test(relative)) continue;
    const text = fs.readFileSync(file, 'utf8');
    if (syntax && relative.endsWith('.html')) {
      for (const match of text.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
        if (/\bsrc\s*=|\btype\s*=\s*['"](?:module|application\/)/i.test(match[1])) continue;
        new Script(match[2], { filename: relative + ' inline script' });
      }
    }
    // Embedded SVG data may itself contain url(#filter); those are not files.
    const referencesText = text.replace(/url\((["'])data:[\s\S]*?\1\)/g, '');
    for (const match of referencesText.matchAll(/(?:src|href)=["']([^"']+)["']|url\(["']?([^\s)'";]+)["']?\)/g)) {
      const reference = match[1] || match[2];
      if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(reference)) continue;
      const url = reference.split(/[?#]/)[0];
      if (!url) continue;
      const decoded = decodeURIComponent(url);
      const target = decoded.startsWith('/') ? path.join(root, decoded) : path.resolve(path.dirname(file), decoded);
      let resolved = slash(path.relative(root, target));
      if (known.has(resolved + '/index.html')) resolved += '/index.html';
      if (!known.has(resolved)) throw new Error('Missing or incorrectly cased reference: ' + relative + ' -> ' + reference);
      references++;
    }
  }
  return { files, references };
}
