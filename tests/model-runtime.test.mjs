import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const source = fs.readFileSync(new URL('../shared/model-runtime.js', import.meta.url), 'utf8');
function harness() {
  const window = new EventTarget(), document = new EventTarget();
  document.hidden = false;
  window.innerWidth = 800; window.innerHeight = 600;
  const rect = {top:0,left:0,width:300,height:300,bottom:300,right:300};
  const element = {getBoundingClientRect: () => rect};
  let now = 100, id = 0, observe;
  const frames = new Map();
  vm.runInNewContext(source, { window, document, setTimeout, clearTimeout,
    performance: { now: () => now },
    requestAnimationFrame(fn) { frames.set(++id, fn); return id; },
    cancelAnimationFrame(key) { frames.delete(key); },
    IntersectionObserver: class { constructor(fn) { observe = fn; } observe() {} disconnect() {} },
  });
  // The browser exposes IntersectionObserver on window as well as the global object.
  // Add it before creating the loop so its visibility observer is installed.
  window.IntersectionObserver = true;
  return { runtime: window.ModelRuntime, frames, window, document, element,
    visible(value, measured = rect) { observe([{isIntersecting:value,boundingClientRect:measured}]); },
    step(ms = 40) { now += ms; const pending = [...frames.values()]; frames.clear(); pending.forEach(fn => fn(now)); },
  };
}
test('model loop coalesces invalidations, sleeps idle and suspends without catching up', () => {
  const h = harness(); let count = 0, moving = false, dt;
  const loop = h.runtime.loop({element: h.element, draw(step) { count++; dt=step; return moving; }});
  loop.invalidate(); assert.equal(h.frames.size, 0, 'loading cannot draw');
  loop.start(); loop.invalidate(); loop.invalidate(); assert.equal(h.frames.size, 1);
  h.step(); assert.equal(count, 1); assert.equal(h.frames.size, 0);
  moving = true; loop.invalidate(); h.step(); assert.equal(h.frames.size, 1);
  h.visible(false); assert.equal(h.frames.size, 0);
  h.step(20000); assert.equal(count, 2);
  h.visible(true); h.step(); assert(dt < .1, 'offscreen time is excluded');
  h.document.hidden = true; h.document.dispatchEvent(new Event('visibilitychange'));
  assert.equal(h.frames.size, 0);
  h.document.hidden = false; h.document.dispatchEvent(new Event('visibilitychange'));
  assert.equal(h.frames.size, 1);
  h.window.dispatchEvent(new Event('pagehide')); assert.equal(h.frames.size, 0);
  h.window.dispatchEvent(new Event('pageshow')); assert.equal(h.frames.size, 1);
  loop.dispose(); loop.invalidate(); h.visible(true); assert.equal(h.frames.size, 0);
});
test('a stale offscreen observation cannot suppress the final responsive resize paint', () => {
  const h = harness(); let count = 0;
  const loop = h.runtime.loop({element:h.element, draw() { count++; }});
  loop.start(); h.step();
  loop.invalidate();
  h.visible(false, {top:1000,left:0,width:292,height:594});
  h.step(); assert.equal(count,2); assert.equal(h.frames.size,0);
  loop.dispose();
});
function assets(h, timeout = 1000) {
  const requests = [];
  const THREE = { SRGBColorSpace:'srgb', TextureLoader: class {
    load(url, done, progress, fail) {
      const texture = { disposals: 0, dispose() { this.disposals++; } };
      requests.push({url,done,fail,texture}); return texture;
    }
  }};
  return { requests, store: h.runtime.textures(THREE, {capabilities:{getMaxAnisotropy:()=>8}}, {timeout}) };
}
test('texture requests deduplicate by URL and orientation and release their ownership', async () => {
  const {store, requests} = assets(harness());
  const a=store.load('same'), b=store.load('same'), c=store.load('same',{flipY:false});
  assert.equal(a,b); assert.equal(requests.length,2);
  requests.forEach(r=>r.done(r.texture));
  const [first,,other]=await Promise.all([a,b,c]);
  assert.equal(first.colorSpace,'srgb'); assert.equal(first.flipY,true); assert.equal(other.flipY,false);
  assert.equal(first.anisotropy,4);
  store.dispose(); assert.equal(first.disposals,1); assert.equal(other.disposals,1);
  assert.equal(await store.load('new'),null); assert.equal(requests.length,2);
});
test('disposing during loading settles promises and discards every late result', async () => {
  const {store,requests}=assets(harness());
  const pending=store.load('late'); store.dispose();
  assert.equal(await pending,null);
  requests[0].done(requests[0].texture);
  assert.equal(requests[0].texture.colorSpace,undefined);
  assert(requests[0].texture.disposals>=1);
});
test('texture errors and timeouts reject once and late completion cannot revive a request', async () => {
  const {store,requests}=assets(harness(),15);
  const failed=store.load('error'); requests[0].fail(new Error('decode failed'));
  await assert.rejects(failed,/decode failed/);
  const timed=store.load('stuck'); await assert.rejects(timed,/timed out/);
  requests[1].done(requests[1].texture);
  assert.equal(requests[1].texture.colorSpace,undefined);
  store.dispose();
});
