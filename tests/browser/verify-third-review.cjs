const { siteRoot, browserChannel } = require('../support/runtime.cjs');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = siteRoot;
const output = path.resolve(__dirname, '../../.qa');
fs.mkdirSync(output, { recursive: true });
const types = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.jpg':'image/jpeg', '.png':'image/png', '.svg':'image/svg+xml' };
const server = http.createServer((req, res) => {
  let file = path.resolve(root, '.' + new URL(req.url, 'http://localhost').pathname);
  if (file !== root && !file.startsWith(root + path.sep)) return res.writeHead(400).end();
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) return res.writeHead(404).end();
  res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
const cases = [
  ['mercury', 'science.js', 'tick', '#play', '#time-slider', '#reset-time'],
  ['venus', '', 'frame', '#play', '#day', '#reset'],
  ['mars', 'simulation.js', 'frame', '#play', '#day', '#reset'],
  ['jupiter', 'app.js', 'tick', '#play-orbits', '#time-slider', '#reset-time'],
  ['europa', 'app.js', 'tick', '#play-orbits', '#time-slider', '#reset-time'],
  ['saturn', 'app.js', 'orbitFrame', '#orbit-play', '#orbit-time', '#orbit-reset'],
  ['neptune', 'app.js', 'orbitFrame', '#orbit-play', '#orbit-time', '#orbit-reset'],
];
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({ channel:browserChannel, headless:true, args:['--enable-unsafe-swiftshader'] });
  const results = [];
  async function check(name, run) {
    try { await run(); results.push({ name, passed:true }); console.log('PASS: '+name); }
    catch (error) { results.push({ name, passed:false, error:error.message }); console.error('FAIL: '+name+': '+error.message); }
  }
  try {
    for (const [name, file, callback, play, slider, reset] of cases) {
      await check(name + ': idle has zero callbacks; playback, pause and reset work', async () => {
        const page = await browser.newPage({ reducedMotion:'reduce' });
        try {
          const errors = [];
          page.on('pageerror', error => errors.push(error.message));
          await page.addInitScript(({ marker, callback }) => {
            window.reviewFrames = 0;
            const original = requestAnimationFrame;
            window.requestAnimationFrame = fn => {
              const tracked = fn.name === callback && (new Error().stack || '').includes(marker);
              return original.call(window, now => { if (tracked) reviewFrames++; fn(now); });
            };
          }, { marker:'/'+name+'/'+file, callback });
          await page.goto(base+'/'+name+'/');
          await page.locator(play).scrollIntoViewIfNeeded();
          await page.waitForTimeout(300);
          const idle = await page.evaluate(() => reviewFrames);
          await page.waitForTimeout(250);
          const idleDelta = await page.evaluate(previous => reviewFrames - previous, idle);
          assert.equal(idleDelta, 0, name + ' paused callbacks in 250ms: '+idleDelta);
          const start = Number(await page.locator(slider).inputValue());
          await page.locator(play).evaluate(e => e.click());
          await page.waitForTimeout(650);
          assert(Number(await page.locator(slider).inputValue()) > start, 'playback advances time');
          await page.locator(play).evaluate(e => e.click());
          await page.waitForTimeout(100);
          const stopped = await page.locator(slider).inputValue();
          const frames = await page.evaluate(() => reviewFrames);
          await page.waitForTimeout(250);
          assert.equal(await page.evaluate(() => reviewFrames), frames, 'pause cancels callbacks');
          assert.equal(await page.locator(slider).inputValue(), stopped, 'paused time stays fixed');
          await page.locator(reset).evaluate(e => e.click());
          assert.equal(Number(await page.locator(slider).inputValue()), 0);
          assert.deepEqual(errors, []);
        } finally { await page.close(); }
      });
    }
    await check('Venus background suspension and return preserve simulation time', async () => {
      const page = await browser.newPage();
      try {
        await page.addInitScript(() => {
          window.reviewHidden = false;
          window.reviewTimeOffset = 0;
          Object.defineProperty(document, 'hidden', { get: () => reviewHidden });
          const original = requestAnimationFrame;
          window.requestAnimationFrame = fn => original.call(window, now => fn(now + reviewTimeOffset));
        });
        await page.goto(base+'/venus/');
        await page.locator('#play').evaluate(e => e.click());
        await page.waitForTimeout(200);
        await page.evaluate(() => { reviewHidden = true; document.dispatchEvent(new Event('visibilitychange')); });
        const hidden = Number(await page.locator('#day').inputValue());
        await page.waitForTimeout(200);
        assert.equal(Number(await page.locator('#day').inputValue()), hidden, 'hidden time stays fixed');
        await page.evaluate(() => { reviewTimeOffset = 120000; reviewHidden = false; document.dispatchEvent(new Event('visibilitychange')); });
        await page.waitForTimeout(200);
        const after = Number(await page.locator('#day').inputValue());
        assert(after >= hidden && after - hidden < 10, 'return has no two-minute time jump');
      } finally { await page.close(); }
    });
    await check('Mercury context loss during texture loading remains in fallback', async () => {
      const page = await browser.newPage();
      try {
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.route('**/mercury/vendor/three.min.js', async route => {
          const response = await route.fetch();
          await route.fulfill({ response, body:(await response.text()) + '\n;const originalLoad = THREE.TextureLoader.prototype.load; THREE.TextureLoader.prototype.load = function(url, onLoad, ...rest) { return originalLoad.call(this, url, texture => { window.releaseMercuryTexture = () => onLoad(texture); }, ...rest); };' });
        });
        await page.goto(base+'/mercury/');
        await page.waitForFunction(() => window.releaseMercuryTexture);
        await page.locator('#planet-mount canvas').evaluate(canvas => canvas.dispatchEvent(new Event('webglcontextlost', { cancelable:true })));
        await page.evaluate(() => releaseMercuryTexture());
        await page.waitForTimeout(300);
        assert.equal(await page.locator('#model-status').textContent(), '三维视图不可用');
        assert.equal(await page.locator('#planet-mount').evaluate(e => e.classList.contains('ready')), false);
        assert(await page.locator('#rotate-model').isDisabled());
        assert(await page.locator('#model-error').isVisible());
        assert.deepEqual(errors, []);
      } finally { await page.close(); }
    });
    fs.writeFileSync(path.join(output, 'third-review-results.json'), JSON.stringify(results, null, 2));
    if (results.some(r => !r.passed)) process.exitCode = 1;
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
