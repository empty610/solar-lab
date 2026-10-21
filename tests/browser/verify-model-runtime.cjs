const { siteRoot, browserChannel } = require('../support/runtime.cjs');
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const measure = process.argv.includes('--measure');
const pages = ['mercury', 'venus', 'mars', 'jupiter', 'saturn', 'neptune', 'europa', 'pluto'];
const server = http.createServer((req, res) => {
  let file = path.join(siteRoot, new URL(req.url, 'http://local').pathname);
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) return res.writeHead(404).end();
  res.setHeader('Content-Type', ({'.html':'text/html', '.js':'text/javascript', '.css':'text/css'})[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
async function instrument(page, mode = '') {
  await page.addInitScript(() => {
    window.__modelStats = { renders: 0, callbacks: 0, pending: new Set(), loads: 0, disposed: 0, resizes: 0 };
    window.__textureGate = [];
    window.__background = false;
    Object.defineProperty(document, 'hidden', {get: () => __background});
    const raf = window.requestAnimationFrame, cancel = window.cancelAnimationFrame;
    window.requestAnimationFrame = callback => {
      const owned = /\/(?:model|planet|model-runtime)\.js[?:]|\/venus\//.test(new Error().stack);
      const id = raf(time => {
        __modelStats.pending.delete(id);
        if (owned) __modelStats.callbacks++;
        callback(time);
      });
      if (owned) __modelStats.pending.add(id);
      return id;
    };
    window.cancelAnimationFrame = id => { __modelStats.pending.delete(id); cancel(id); };
  });
  await page.route('**/vendor/three*.js*', async route => {
    const response = await route.fetch();
    const hook = `;(() => {
      const Renderer = THREE.WebGLRenderer;
      THREE.WebGLRenderer = new Proxy(Renderer, { construct(target, args) {
        const renderer = Reflect.construct(target, args), render = renderer.render, size = renderer.setSize;
        renderer.setSize = function(...a) { __modelStats.resizes++; return size.apply(this,a); };
        renderer.render = function(...a) {
          __modelStats.renders++;
          __modelStats.drawResize = __modelStats.resizes;
          __modelStats.direction = a[1].getWorldDirection(new THREE.Vector3()).toArray();
          return render.apply(this, a);
        };
        return renderer;
      }});
      const load = THREE.TextureLoader.prototype.load;
      THREE.TextureLoader.prototype.load = function(url, onLoad, progress, onError) {
        __modelStats.loads++;
        return load.call(this, url, texture => {
          const dispose = texture.dispose;
          texture.dispose = function() { __modelStats.disposed++; return dispose.call(this); };
          const complete = () => ${mode === 'error' ? 'onError?.(new Error("Injected texture failure"))' : 'onLoad?.(texture)'};
          ${mode === 'hold' ? '__textureGate.push(complete)' : mode ? 'setTimeout(complete, 1200)' : 'complete()'};
        }, progress, onError);
      };
    })();`;
    await route.fulfill({ response, body: await response.text() + hook });
  });
}
const snapshot = page => page.evaluate(() => ({ ...__modelStats, pending: __modelStats.pending.size }));
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({channel: browserChannel, headless: true, args: ['--enable-unsafe-swiftshader']});
  const results = [];
  try {
    for (const name of pages) {
      const page = await browser.newPage({viewport: {width: 1366, height: 900}, reducedMotion: 'reduce'});
      const errors = []; page.on('pageerror', e => errors.push(e.message));
      await instrument(page);
      const started = Date.now();
      await page.goto(base + '/' + name + '/');
      // Reduced motion starts paused, so only the initial textured render is required.
      const selector = name === 'mercury' ? '#planet-stage' : ['mars','venus'].includes(name) ? '#' + name + '-stage' : '#model-stage';
      if (name === 'mars') await page.locator('#model-tab').click();
      await page.locator(selector).scrollIntoViewIfNeeded();
      await page.waitForFunction(() => __modelStats.renders > 0);
      if (!['mars', 'venus'].includes(name)) await page.waitForFunction(() => document.querySelector('#model-loading').hidden);
      const readyMs = Date.now() - started;
      await page.waitForTimeout(1400);
      const a = await snapshot(page); await page.waitForTimeout(600); const b = await snapshot(page);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(400);
      const c = await snapshot(page); await page.waitForTimeout(600); const d = await snapshot(page);
      const result = {name, readyMs, loads: b.loads, idleRenders: b.renders-a.renders, idleCallbacks: b.callbacks-a.callbacks,
        offscreenCallbacks: d.callbacks-c.callbacks, pendingOffscreen: d.pending};
      results.push(result); console.log(JSON.stringify(result));
      assert.deepEqual(errors, [], name + ' page errors');
      if (!measure) {
        assert.equal(result.idleRenders, 0, name + ' paused renders');
        assert.equal(result.idleCallbacks, 0, name + ' paused callbacks');
        assert.equal(result.pendingOffscreen, 0, name + ' offscreen RAF');
        // Resume motion, then verify interaction invalidates a sleeping canvas.
        await page.locator(selector).scrollIntoViewIfNeeded();
        const button = page.locator(name === 'mercury' || name === 'jupiter' || name === 'europa' ? '#rotate-model' : name === 'pluto' ? '#model-spin' : name === 'mars' ? '#rotation-toggle' : '#spin');
        if (name !== 'venus') {
          const before = (await snapshot(page)).renders;
          await button.click(); await page.waitForTimeout(500);
          assert((await snapshot(page)).renders > before + 2, name + ' resumes');
          await page.evaluate(() => { __background = true; document.dispatchEvent(new Event('visibilitychange')); });
          const hidden = await snapshot(page); await page.waitForTimeout(400);
          assert.equal((await snapshot(page)).renders, hidden.renders, name + ' background stops');
          assert.equal((await snapshot(page)).pending, 0, name + ' background cancels RAF');
          await page.evaluate(() => { __background = false; document.dispatchEvent(new Event('visibilitychange')); });
          await page.waitForTimeout(400);
          assert((await snapshot(page)).renders > hidden.renders, name + ' foreground resumes');
          await button.click(); await page.waitForTimeout(1400);
        }
        const canvas = page.locator(selector + ' canvas').first();
        const box = await canvas.boundingBox();
        const before = (await snapshot(page)).renders;
        await page.mouse.move(box.x + box.width/2, box.y + box.height/2);
        await page.mouse.down(); await page.mouse.move(box.x + box.width/2 + 70, box.y + box.height/2 + 20, {steps: 5}); await page.mouse.up();
        await page.waitForFunction(() => {
          const count = __modelStats.renders;
          if (window.__settleCount !== count) { window.__settleCount = count; window.__settleTime = performance.now(); }
          return performance.now() - window.__settleTime > 400;
        }, null, { polling: 100, timeout: 8000 });
        assert((await snapshot(page)).renders > before, name + ' drag wakes canvas');
        const settled = await snapshot(page); await page.waitForTimeout(600);
        assert.equal((await snapshot(page)).renders, settled.renders, name + ' damping settles');
        await page.setViewportSize({width:390,height:844});
        await page.locator(selector).scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);
        const mobile = await snapshot(page);
        assert.equal(mobile.drawResize, mobile.resizes, name + ' final resize is painted');
        assert(Math.hypot(...mobile.direction.map((v,i) => v - settled.direction[i])) < .01, name + ' resize preserves direction');
        await page.screenshot({path: path.join(__dirname, '../../.qa/model-' + name + '-mobile.png')});
      }
      await page.close();
    }
    if (!measure) for (const name of pages) for (const mode of ['hold', 'error']) {
      const page = await browser.newPage({reducedMotion: 'reduce'});
      const errors = []; page.on('pageerror', error => errors.push(error.message));
      await instrument(page, mode);
      await page.goto(base + '/' + name + '/');
      if (name === 'mars') await page.locator('#model-tab').click();
      await page.waitForFunction(() => __modelStats.loads > 0);
      if (mode === 'hold') {
        await page.waitForFunction(() => __textureGate.length === __modelStats.loads);
        // Exercise view switches while loading, then interrupt before any texture is accepted.
        await page.locator('[data-view], [data-body]').evaluateAll(buttons => buttons.slice(0,3).forEach(button => button.click()));
        await page.locator('canvas').first().evaluate(canvas => canvas.dispatchEvent(new Event('webglcontextlost', {cancelable:true})));
      }
      const failed = () => page.waitForFunction(() => {
        const fallback = document.querySelector('#model-fallback, #model-error');
        return fallback ? !fallback.hidden : !!document.querySelector('.is-error');
      });
      await failed();
      const status = await page.evaluate(() => document.querySelector('#model-status')?.textContent || '');
      if (mode === 'hold') await page.evaluate(() => __textureGate.forEach(complete => complete()));
      await page.waitForTimeout(500);
      await failed();
      assert.equal(await page.evaluate(() => document.querySelector('#model-status')?.textContent || ''), status, name + ' late load cannot overwrite failure');
      assert.equal((await snapshot(page)).pending, 0, name + ' failure stops RAF');
      assert.deepEqual(errors, [], name + ' failure has no uncaught errors');
      console.log('PASS: ' + name + ' ' + (mode === 'hold' ? 'context loss during loading' : 'texture failure'));
      await page.close();
    }
    if (!measure) {
      const page = await browser.newPage();
      await instrument(page);
      await page.goto(base + '/mars/');
      await page.locator('#model-tab').click();
      await page.waitForFunction(() => MarsModelView.loaded);
      await page.locator('#mars-stage').scrollIntoViewIfNeeded();
      await page.waitForFunction(() => !MarsMoons.transitioning);
      await page.evaluate(() => MarsMoons.focus('phobos'));
      await page.waitForTimeout(200);
      await page.evaluate(() => { __background = true; document.dispatchEvent(new Event('visibilitychange')); });
      const position = await page.evaluate(() => MarsMoons.camera.position.toArray());
      await page.waitForTimeout(1700);
      assert.deepEqual(await page.evaluate(() => MarsMoons.camera.position.toArray()), position);
      await page.evaluate(() => { __background = false; document.dispatchEvent(new Event('visibilitychange')); });
      await page.waitForTimeout(150);
      assert(await page.evaluate(() => MarsMoons.transitioning), 'Mars flight excludes hidden time');
      await page.waitForFunction(() => !MarsMoons.transitioning);
      assert.equal(await page.evaluate(() => MarsMoons.selected), 'phobos');
      await page.close();
      console.log('PASS: Mars camera flight excludes background time and completes after return');
    }
    fs.writeFileSync(path.join(__dirname, '../../.qa/model-runtime-' + (measure ? 'baseline' : 'after') + '.json'), JSON.stringify(results, null, 2));
  } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; });
