import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { sourceRoot } from './site.mjs';

// This local compatibility entry replaces an obsolete launcher, not archive assets.
// It is intentionally outside the build: publication still uses only sourceRoot.
export function repairLocalTerminal() {
  const workspace = path.dirname(sourceRoot);
  const entry = path.join(workspace, 'previews', 'terminal_preview', 'index.html');
  if (!fs.existsSync(entry)) return { changed: false, reason: 'No legacy Terminal entry', entry };
  const marker = 'solar-lab-canonical-terminal-entry';
  const original = fs.readFileSync(entry, 'utf8');
  if (original.includes(marker)) return { changed: false, reason: 'Already linked to current Terminal', entry };
  const backupDirectory = path.join(workspace, '_backups', 'terminal-entry-' + new Date().toISOString().replace(/[:.]/g, '-'));
  fs.mkdirSync(backupDirectory, { recursive: true });
  const backup = path.join(backupDirectory, 'index.html');
  fs.copyFileSync(entry, backup, fs.constants.COPYFILE_EXCL);
  const target = path.relative(path.dirname(entry), path.join(sourceRoot, 'terminal', 'index.html'))
    .split(path.sep).map(encodeURIComponent).join('/');
  const html = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="${marker}" content="true" />
  <meta http-equiv="refresh" content="0; url=${target}" />
  <title>进入 Solar Lab 总览</title>
  <script>
    const destination = new URL(${JSON.stringify(target)}, location.href);
    destination.search = location.search;
    destination.hash = location.hash;
    location.replace(destination.href);
  </script>
</head>
<body><p><a href="${target}">进入 Solar Lab 最新总览</a></p></body>
</html>
`;
  fs.writeFileSync(entry, html);
  return { changed: true, entry, target, backup };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  console.log(JSON.stringify(repairLocalTerminal(), null, 2));
}
