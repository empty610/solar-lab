import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { sourceRoot, validateSite, versionHTML, cacheAssets } from './site.mjs';

// Only these fixed, local directories are ever replaced or recursively removed.
function outputPath(root, name) {
  const resolved = path.resolve(root, name);
  if (path.dirname(resolved) !== path.resolve(root) || !['dist', '.dist-stage', '.dist-previous', '.build-lock'].includes(path.basename(resolved))) {
    throw new Error('Unsafe build output: ' + resolved);
  }
  if (fs.existsSync(resolved) && fs.lstatSync(resolved).isSymbolicLink()) throw new Error('Build output cannot be a symlink: ' + resolved);
  return resolved;
}

export function buildSite(root = sourceRoot, { dryRun = false } = {}) {
  root = path.resolve(root);
  const { files, references } = validateSite(root);
  const destination = outputPath(root, 'dist');
  const staging = outputPath(root, '.dist-stage');
  const previous = outputPath(root, '.dist-previous');
  if (dryRun) return { files: files.length, references, destination, dryRun: true };
  const lock = outputPath(root, '.build-lock');
  try { fs.mkdirSync(lock); }
  catch (error) {
    if (error.code === 'EEXIST') throw new Error('Another build owns .build-lock; do not build concurrently. After a crash, confirm no build is running before removing the empty lock directory.');
    throw error;
  }
  try {
    if (fs.existsSync(previous)) throw new Error('A previous build needs recovery: ' + previous);
    fs.rmSync(staging, { recursive: true, force: true });
    fs.mkdirSync(staging);
    try {
      const assets = cacheAssets(root, files);
      for (const relative of files) {
        const from = path.join(root, relative), to = path.join(staging, relative);
        fs.mkdirSync(path.dirname(to), { recursive: true });
        if (relative.endsWith('.html')) fs.writeFileSync(to, versionHTML(fs.readFileSync(from, 'utf8'), relative, root, assets));
        else fs.copyFileSync(from, to);
      }
      for (const asset of assets.values()) {
        const file = path.join(staging, asset.path);
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, asset.data);
      }
      validateSite(staging);
      const hadPrevious = fs.existsSync(destination);
      if (hadPrevious) fs.renameSync(destination, previous);
      try { fs.renameSync(staging, destination); }
      catch (error) {
        if (hadPrevious) fs.renameSync(previous, destination);
        throw error;
      }
      fs.rmSync(previous, { recursive: true, force: true });
    } finally {
      fs.rmSync(staging, { recursive: true, force: true });
    }
    return { files: files.length, references, destination, dryRun: false };
  } finally { fs.rmdirSync(lock); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const args = process.argv.slice(2);
    if (args.some(arg => arg !== '--dry-run')) throw new Error('Supported option: --dry-run');
    const result = buildSite(sourceRoot, { dryRun: args.includes('--dry-run') });
    console.log(`${result.dryRun ? 'Validated (no writes)' : 'Built'}: ${result.files} files, ${result.references} local references -> ${result.destination}`);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
