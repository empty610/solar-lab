import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';
import { buildSite } from '../scripts/build.mjs';
import { createPreviewServer } from '../scripts/preview.mjs';
import { pages } from '../scripts/site.mjs';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'solar-lab-build-'));
  t.after(() => {
    const resolved = path.resolve(root);
    if (path.dirname(resolved) !== path.resolve(os.tmpdir()) || !path.basename(resolved).startsWith('solar-lab-build-')) throw new Error('Unsafe fixture cleanup');
    fs.rmSync(resolved, { recursive: true, force: true });
  });
  function put(relative, data) {
    const file = path.join(root, relative);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, data);
  }
  put('index.html', '<a href="terminal/index.html">开始</a>');
  put('404.html', '<h1>404</h1>');
  put('_headers', '/shared/*\n  Cache-Control: no-cache\n');
  for (const name of pages) put(name + '/index.html', '<h1>手写原文</h1><p><strong>原格式</strong>仍在。</p><script src="../shared/runtime.js?mode=read&v=old#notes"></script><link href="../shared/style.css" rel="stylesheet">');
  put('shared/runtime.js', 'window.fixture = true;');
  put('shared/style.css', 'body{background:url("data:image/svg+xml,%3Csvg filter=\'url(%23n)\'/%3E")}');
  put('shared/audio/sample.mp3', '0123456789abcdef');
  put('tests/private.txt', 'not a public asset');
  put('shared/.env', 'FAKE_FIXTURE=not-a-secret');
  put('mars/.qa/private.html', 'not a public asset');
  return { root, put };
}

function snapshot(root, skipOutput = false) {
  const result = {};
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (skipOutput && dir === root && ['dist', '.dist-stage', '.dist-previous'].includes(entry.name)) continue;
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(file);
      else result[path.relative(root, file)] = createHash('sha256').update(fs.readFileSync(file)).digest('hex');
    }
  }
  walk(root);
  return result;
}

test('build preserves source, authored markup, binary bytes and URL fragments; excludes development files', t => {
  const { root } = fixture(t), before = snapshot(root, true);
  buildSite(root);
  assert.deepEqual(snapshot(root, true), before);
  const html = fs.readFileSync(path.join(root, 'dist/mars/index.html'), 'utf8');
  assert(html.includes('<p><strong>原格式</strong>仍在。</p>'));
  assert.match(html, /runtime\.js\?mode=read&v=[a-f0-9]{12}#notes/);
  assert(fs.readFileSync(path.join(root,'dist/shared/audio/sample.mp3')).equals(fs.readFileSync(path.join(root,'shared/audio/sample.mp3'))));
  for (const file of ['tests/private.txt','shared/.env','mars/.qa/private.html']) assert(!fs.existsSync(path.join(root,'dist',file)));
});

test('repeated builds are deterministic, remove stale output and change versions after an asset edit', t => {
  const { root, put } = fixture(t);
  buildSite(root);
  const first = snapshot(path.join(root,'dist'));
  put('dist/stale.txt','obsolete');
  buildSite(root);
  assert.deepEqual(snapshot(path.join(root,'dist')), first);
  const oldHTML = fs.readFileSync(path.join(root,'dist/mars/index.html'),'utf8');
  put('shared/runtime.js','window.fixture = false;');
  buildSite(root);
  assert.notEqual(fs.readFileSync(path.join(root,'dist/mars/index.html'),'utf8'), oldHTML);
});

test('missing or incorrectly cased dependencies leave the last valid output intact', t => {
  const { root, put } = fixture(t);
  buildSite(root);
  const before = snapshot(path.join(root,'dist'));
  put('pluto/index.html','<script src="missing.js"></script>');
  assert.throws(()=>buildSite(root),/Missing or incorrectly cased reference/);
  assert.deepEqual(snapshot(path.join(root,'dist')), before);
  put('pluto/index.html','<script src="../shared/Runtime.js"></script>');
  assert.throws(()=>buildSite(root),/incorrectly cased/);
  assert.deepEqual(snapshot(path.join(root,'dist')), before);
});

test('dry run validates without creating output', t => {
  const { root } = fixture(t), before = snapshot(root);
  assert.equal(buildSite(root,{dryRun:true}).dryRun,true);
  assert.deepEqual(snapshot(root),before);
});

test('a concurrent build cannot remove staging or replace existing output', t => {
  const { root, put } = fixture(t);
  buildSite(root);
  const before = snapshot(path.join(root,'dist'));
  put('.dist-stage/owned-by-other-process.txt','keep');
  fs.mkdirSync(path.join(root,'.build-lock'));
  assert.throws(()=>buildSite(root),/Another build owns/);
  assert.equal(fs.readFileSync(path.join(root,'.dist-stage/owned-by-other-process.txt'),'utf8'),'keep');
  assert.deepEqual(snapshot(path.join(root,'dist')),before);
});

test('invalid application JavaScript is rejected before replacing a good build', t => {
  const { root, put } = fixture(t);
  buildSite(root);
  const before = snapshot(path.join(root,'dist'));
  put('shared/runtime.js','function broken( {');
  assert.throws(()=>buildSite(root),SyntaxError);
  assert.deepEqual(snapshot(path.join(root,'dist')),before);
});

test('development server serves canonical source, redirects legacy entries and supports audio seeking', async t => {
  const { root, put } = fixture(t);
  const server = createPreviewServer(root);
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try {
    const base = 'http://127.0.0.1:'+server.address().port;
    assert.equal((await fetch(base+'/')).status,200);
    put('mars/index.html','<p>刚刚修改的原文</p>');
    assert((await (await fetch(base+'/mars/')).text()).includes('刚刚修改的原文'));
    const redirect=await fetch(base+'/uranus_preview/index.html',{redirect:'manual'});
    assert.equal(redirect.status,302);
    assert.equal(redirect.headers.get('location'),'/uranus/index.html');
    assert.equal((await fetch(base+'/venus_preview/venus_v3.html',{redirect:'manual'})).headers.get('location'),'/venus/index.html');
    const audio=await fetch(base+'/shared/audio/sample.mp3',{headers:{Range:'bytes=3-6'}});
    assert.equal(audio.status,206);assert.equal(await audio.text(),'3456');
    assert.equal((await fetch(base+'/shared/audio/sample.mp3',{headers:{Range:'bytes=99-'}})).status,416);
    assert.equal((await fetch(base+'/shared/runtime.js',{method:'HEAD'})).headers.get('cache-control'),'no-store');
    for (const url of ['/tests/private.txt','/shared/.env','/mars/.qa/private.html','/package.json','/.git/config']) assert.equal((await fetch(base+url)).status,404);
    assert.equal((await fetch(base+'/shared/%E0%A4%A')).status,400);
  } finally { await new Promise(resolve=>server.close(resolve)); }
});
