const { siteRoot, browserChannel } = require('../support/runtime.cjs');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = siteRoot;
const output = path.resolve(__dirname, '../../.qa');
fs.mkdirSync(output, { recursive: true });
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.jpg': 'image/jpeg', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  let file = path.resolve(root, '.' + new URL(req.url, 'http://localhost').pathname);
  if (file !== root && !file.startsWith(root + path.sep)) return res.writeHead(400).end();
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) return res.writeHead(404).end();
  res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({ channel: browserChannel, headless: true, args: ['--enable-unsafe-swiftshader'] });
  const results = [];
  async function check(name, run) {
    try { await run(); results.push({ name, passed: true }); console.log('PASS: ' + name); }
    catch (error) { results.push({ name, passed: false, error: error.message }); console.error('FAIL: ' + name + ': ' + error.message); }
  }
  try {
    await check('viewport resize preserves the user camera direction', async () => {
      const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
      try {
        await page.route('**/vendor/OrbitControls.js*', async route => {
          const response = await route.fetch();
          await route.fulfill({ response, body: (await response.text()) + '\nconst OriginalControls = window.OrbitControls; window.OrbitControls = function(camera, element) { window.reviewCamera = camera; return new OriginalControls(camera, element); };' });
        });
        await page.goto(base + '/pluto/');
        await page.waitForFunction(() => PlutoObservatory.state.ready);
        await page.locator('#model-stage').scrollIntoViewIfNeeded();
        const box = await page.locator('#model-mount canvas').boundingBox();
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width / 2 + 120, box.y + box.height / 2 + 60, { steps: 12 });
        await page.mouse.up();
        await page.waitForTimeout(3000);
        const before = await page.evaluate(() => reviewCamera.position.clone().normalize().toArray());
        assert(Math.abs(before[0]) > .1, 'drag changed the camera direction');
        await page.setViewportSize({ width: 1280, height: 900 });
        await page.waitForTimeout(500);
        const after = await page.evaluate(() => reviewCamera.position.clone().normalize().toArray());
        assert(Math.hypot(...after.map((v, i) => v - before[i])) < .01, 'resize preserves direction: ' + JSON.stringify({ before, after }));
        await page.setViewportSize({ width: 390, height: 844 });
        await page.waitForTimeout(500);
        const mobile = await page.evaluate(() => reviewCamera.position.clone().normalize().toArray());
        assert(Math.hypot(...mobile.map((v, i) => v - before[i])) < .01, 'mobile layout preserves direction');
        await page.locator('#model-reset').click();
        assert(Math.abs(await page.evaluate(() => reviewCamera.position.x)) < .001, 'explicit reset still resets');
      } finally { await page.close(); }
    });
    await check('model initialization and view switching preserve the authored Pluto copy', async () => {
      const page = await browser.newPage({ reducedMotion: 'reduce' });
      try {
        await page.goto(base + '/pluto/');
        await page.waitForFunction(() => PlutoObservatory.state.ready);
        assert.equal(await page.locator('#profile-title').textContent(), '小小的世界，不小的惊喜。');
        assert.match(await page.locator('#profile-copy').textContent(), /那可不是一块静止的装饰/);
        await page.locator('[data-view=charon]').click();
        await page.locator('[data-view=pluto]').click();
        assert.equal(await page.locator('#profile-title').textContent(), '小小的世界，不小的惊喜。');
      } finally { await page.close(); }
    });
    await check('context loss during loading remains in fallback after textures settle', async () => {
      const page = await browser.newPage();
      try {
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.route('**/pluto/assets/models.js*', async route => {
          const response = await route.fetch();
          const gate = '\nwindow.reviewTextureGate = []; const originalLoad = THREE.TextureLoader.prototype.load; THREE.TextureLoader.prototype.load = function(url, onLoad, ...args) { return originalLoad.call(this, url, texture => reviewTextureGate.push(() => onLoad(texture)), ...args); };';
          await route.fulfill({ response, body: (await response.text()) + gate });
        });
        await page.goto(base + '/pluto/');
        await page.waitForFunction(() => reviewTextureGate.length === 2);
        await page.locator('#model-mount canvas').evaluate(canvas => canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true })));
        assert(await page.locator('#model-fallback').isVisible());
        await page.evaluate(() => reviewTextureGate.forEach(resolve => resolve()));
        await page.waitForTimeout(500);
        assert.equal(await page.evaluate(() => PlutoObservatory.state.ready), false);
        assert.equal(await page.locator('#model-status').textContent(), '图文浏览模式');
        assert(await page.locator('#model-light').isDisabled());
        assert.deepEqual(errors, []);
      } finally { await page.close(); }
    });
    fs.writeFileSync(path.join(output, 'second-review-results.json'), JSON.stringify(results, null, 2));
    if (results.some(result => !result.passed)) process.exitCode = 1;
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
