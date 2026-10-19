const { siteRoot, browserChannel } = require('../support/runtime.cjs');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = siteRoot;
const output = path.resolve(__dirname, '../../.qa');
fs.mkdirSync(output, { recursive: true });
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg' };
const server = http.createServer((req, res) => {
  let file = path.resolve(root, '.' + new URL(req.url, 'http://localhost').pathname);
  if (file !== root && !file.startsWith(root + path.sep)) { res.writeHead(400).end(); return; }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({ channel: browserChannel, headless: true, args: ['--enable-unsafe-swiftshader'] });
  const results = [];
  const check = async (name, run) => {
    try { await run(); results.push({ name, passed: true }); console.log('PASS: ' + name); }
    catch (error) { results.push({ name, passed: false, error: error.message }); console.error('FAIL: ' + name + ': ' + error.message); }
  };
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await page.goto(base + '/terminal/');
    await check('rapid tab reversals leave one visible panel with no exit animation', async () => {
      await page.evaluate(() => {
        document.querySelector('#catalog-tab').click();
        document.querySelector('#explorer-tab').click();
      });
      await page.waitForTimeout(750);
      assert.equal(await page.locator('[role=tabpanel]:not([hidden])').count(), 1);
      assert.equal(await page.locator('[role=tabpanel].tab-view-exit').count(), 0);
      assert(await page.locator('#explorer').isVisible());
      assert.equal(await page.locator('#explorer-tab').getAttribute('aria-selected'), 'true');
    });
    await check('keyboard focus keeps idle controls visible until focus leaves', async () => {
      await page.keyboard.press('Tab');
      await page.locator('#music-toggle').focus();
      await page.waitForTimeout(2400);
      assert.equal(await page.locator('#music-toggle').evaluate(e => e.classList.contains('is-idle-hidden')), false);
      await page.locator('#explorer-tab').focus();
      await page.waitForTimeout(2400);
      assert.equal(await page.locator('#music-toggle').evaluate(e => e.classList.contains('is-idle-hidden')), true);
    });
    await check('star map suspends in the catalog and resumes on return', async () => {
      await page.locator('#catalog-tab').click();
      await page.waitForTimeout(500);
      const a = await page.evaluate(() => SolarAtlasMotion.state.elapsed);
      await page.waitForTimeout(250);
      assert.equal(await page.evaluate(() => SolarAtlasMotion.state.elapsed), a);
      await page.locator('#explorer-tab').click();
      await page.waitForTimeout(700);
      assert(await page.evaluate(previous => SolarAtlasMotion.state.elapsed > previous, a));
    });
    await check('music resumes in a terminal explicitly marked as terminal', async () => {
      const musicPage = await browser.newPage();
      await musicPage.addInitScript(() => sessionStorage.setItem('site.music.mainEnabled', '1'));
      await musicPage.route('**/terminal/', async route => {
        const response = await route.fetch();
        await route.fulfill({ response, body: (await response.text()).replace('<body id="top">', '<body id="top" data-page="terminal">') });
      });
      await musicPage.goto(base + '/terminal/');
      await musicPage.mouse.click(8, 8);
      await musicPage.waitForFunction(() => !document.querySelector('#bg-music').paused, null, { timeout: 5000 });
      await musicPage.close();
    });
    await check('Pluto loading controls cannot throw before textures are ready', async () => {
      const slowPage = await browser.newPage();
      const errors = [];
      slowPage.on('pageerror', e => errors.push(e.message));
      // Hold the texture loader while keeping the real model/control initialization.
      await slowPage.addInitScript(() => {
        const original = HTMLImageElement.prototype.addEventListener;
        HTMLImageElement.prototype.addEventListener = function(type, listener, ...args) {
          return original.call(this, type, type === 'load' ? event => setTimeout(() => listener.call(this, event), 1500) : listener, ...args);
        };
      });
      await slowPage.goto(base + '/pluto/');
      assert.equal(await slowPage.evaluate(() => PlutoObservatory.state.ready), false, 'textures are still loading');
      await slowPage.evaluate(() => {
        document.querySelector('#model-light').click();
        document.querySelector('#model-reset').click();
      });
      assert.deepEqual(errors, []);
      assert.equal(await slowPage.evaluate(() => PlutoObservatory.state.night), false, 'loading controls leave the pending scene unchanged');
      await slowPage.close();
    });
    await page.addInitScript(() => {
      window.reviewFrames = { model: 0, binary: 0 };
      const original = requestAnimationFrame;
      window.requestAnimationFrame = callback => {
        const stack = new Error().stack || '';
        const key = /\/(?:pluto\/model|shared\/model-runtime)\.js(?:\?[^\s:)]*)?:/.test(stack) ? 'model'
          : /\/pluto\/app\.js(?:\?[^\s:)]*)?:/.test(stack) ? 'binary' : null;
        return original.call(window, now => { if (key) window.reviewFrames[key]++; callback(now); });
      };
    });
    await check('Pluto initializes with consistent spin state and its controls work', async () => {
      await page.goto(base + '/pluto/');
      await page.waitForFunction(() => window.PlutoObservatory?.state.ready);
      assert.equal(await page.locator('#model-spin').getAttribute('aria-pressed'), String(await page.evaluate(() => PlutoObservatory.state.spinning)));
      await page.locator('#model-light').click();
      assert.equal(await page.locator('#model-light').getAttribute('aria-pressed'), 'true');
      await page.locator('[data-view=system]').click();
      assert.equal(await page.evaluate(() => PlutoObservatory.state.view), 'system');
      await page.locator('#model-reset').click();
    });
    await check('offscreen Pluto model and paused binary schedule no animation callbacks', async () => {
      await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
      await page.waitForTimeout(700);
      const a = await page.evaluate(() => ({ ...reviewFrames }));
      await page.waitForTimeout(350);
      assert.deepEqual(await page.evaluate(() => reviewFrames), a);
      await page.locator('#model-stage').scrollIntoViewIfNeeded();
      await page.waitForFunction(previous => reviewFrames.model > previous, a.model);
    });
    await check('reduced motion initializes Pluto paused and permits manual observation', async () => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.reload();
      await page.waitForFunction(() => PlutoObservatory.state.ready);
      assert.equal(await page.evaluate(() => PlutoObservatory.state.spinning), false);
      assert.equal(await page.locator('#model-spin').getAttribute('aria-pressed'), 'false');
      await page.locator('[data-view=charon]').click();
      assert.equal(await page.evaluate(() => PlutoObservatory.state.view), 'charon');
      await page.emulateMedia({ reducedMotion: 'no-preference' });
    });
    await check('binary playback advances, pauses and resets on demand', async () => {
      await page.locator('#binary-svg').scrollIntoViewIfNeeded();
      await page.locator('#binary-play').click();
      await page.waitForTimeout(650);
      const moving = Number(await page.locator('#binary-phase').inputValue());
      assert(moving > 0);
      await page.locator('#binary-play').click();
      const paused = await page.locator('#binary-phase').inputValue();
      await page.waitForTimeout(200);
      assert.equal(await page.locator('#binary-phase').inputValue(), paused);
      await page.locator('#binary-reset').click();
      assert.equal(await page.locator('#binary-phase').inputValue(), '0');
    });
    await check('WebGL fallback keeps photos readable and disables model controls', async () => {
      const fallbackPage = await browser.newPage();
      const errors = [];
      fallbackPage.on('pageerror', error => errors.push(error.message));
      await fallbackPage.route('**/pluto/vendor/three.min.js', route => route.fulfill({ contentType: 'text/javascript', body: '' }));
      // OrbitControls also requires Three; omit both to exercise the intended fallback.
      await fallbackPage.route('**/pluto/vendor/OrbitControls.js', route => route.fulfill({ contentType: 'text/javascript', body: '' }));
      await fallbackPage.goto(base + '/pluto/');
      assert(await fallbackPage.locator('#model-fallback').isVisible());
      assert(await fallbackPage.locator('#model-light').isDisabled());
      await fallbackPage.locator('[data-photo]').first().click();
      assert(await fallbackPage.locator('#photo-dialog').isVisible());
      await fallbackPage.keyboard.press('Escape');
      assert.deepEqual(errors, []);
      await fallbackPage.close();
    });
    for (const width of [320, 390, 844, 1440]) {
      await check('terminal layout at width ' + width, async () => {
        await page.setViewportSize({ width, height: width === 844 ? 390 : 900 });
        await page.goto(base + '/terminal/');
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        await page.screenshot({ path: path.join(output, 'terminal-' + width + '.png'), fullPage: true });
      });
    }
    fs.writeFileSync(path.join(output, 'review-results.json'), JSON.stringify(results, null, 2));
    if (results.some(result => !result.passed)) process.exitCode = 1;
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
