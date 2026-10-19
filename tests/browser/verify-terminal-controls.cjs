const { siteRoot, browserChannel } = require('../support/runtime.cjs');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = siteRoot;
const server = http.createServer((request, response) => {
  let file = path.resolve(root, '.' + decodeURIComponent(new URL(request.url, 'http://localhost').pathname));
  if (!file.startsWith(root + path.sep)) { response.writeHead(400); response.end(); return; }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) { response.writeHead(404); response.end(); return; }
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg' };
  response.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(response);
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const live = process.argv.includes('--live');
  const base = live ? 'https://solar.empty610.com' : 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({ channel: browserChannel, headless: true });
  const errors = [];
  try {
    const page = await browser.newPage();
    if (!live) await page.route('https://empty610.com/**', route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><main id="main"><section id="projects" class="enter">Projects return fixture</section></main>' }));
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.status() >= 400) errors.push(response.status() + ' ' + response.url()); });
    for (const [width, height] of [[1777, 711], [1366, 768], [844, 390], [390, 844], [320, 568]]) {
      await page.setViewportSize({ width, height });
      await page.goto(base + '/terminal/');
      await page.evaluate(() => document.fonts.ready);
      await page.mouse.move(10, 10);
      await page.waitForTimeout(350);
      const back = page.locator('#terminal-back');
      const music = page.locator('#music-toggle');
      assert.equal(await back.getAttribute('href'), 'https://empty610.com/#projects');
      assert.equal(await back.evaluate(e => getComputedStyle(e).opacity), '1', 'BACK appears on entry/input');
      const backBox = await back.boundingBox();
      const tabBox = await page.locator('.atlas-tabs').boundingBox();
      assert(backBox.x + backBox.width <= width && backBox.y >= 0);
      assert(tabBox.y >= backBox.y + backBox.height || tabBox.x + tabBox.width <= backBox.x, 'BACK does not cover tabs');
      await page.screenshot({ path: path.resolve(__dirname, '../../.qa/terminal-controls-' + width + '.png') });
      await page.waitForTimeout(2200);
      assert(await back.evaluate(e => e.classList.contains('is-idle-hidden')), 'Venus two-second idle rule');
      assert(await music.evaluate(e => e.classList.contains('is-idle-hidden')));
      await page.keyboard.press('Tab');
      await page.waitForTimeout(350);
      assert.equal(await back.evaluate(e => getComputedStyle(e).opacity), '1', 'keyboard restores controls');
      await page.mouse.move(20, 20);
      await music.click();
      await page.waitForFunction(() => !document.querySelector('#bg-music').paused && document.querySelector('#bg-music').currentTime > .3);
      assert.equal(await music.getAttribute('aria-pressed'), 'true');
      assert.equal(await page.evaluate(() => sessionStorage.getItem('site.music.mainEnabled')), '1');
      const audio = await page.locator('#bg-music').evaluate(e => ({ volume: e.volume, loop: e.loop, error: e.error }));
      assert.equal(audio.volume, .4);
      assert(audio.loop && !audio.error);
      await page.reload();
      await page.mouse.click(10, 10);
      await page.waitForFunction(() => !document.querySelector('#bg-music').paused && document.querySelector('#bg-music').currentTime > .3);
      const resumedTime = await page.locator('#bg-music').evaluate(e => e.currentTime);
      await page.waitForFunction(time => document.querySelector('#bg-music').currentTime > time + .25, resumedTime);
      await page.mouse.move(20, 20);
      await music.click();
      await page.waitForFunction(() => document.querySelector('#bg-music').paused && document.querySelector('#music-toggle').getAttribute('aria-pressed') === 'false');
      assert.equal(await music.getAttribute('aria-pressed'), 'false');
      assert.equal(await page.evaluate(() => sessionStorage.getItem('site.music.mainEnabled')), '0');
      await page.reload();
      assert(await page.locator('#bg-music').evaluate(e => e.paused), 'paused preference survives reload');
      console.log(`PASS: ${width} × ${height}, BACK, idle rules, audio playback/pause and preference`);
    }
    await page.mouse.move(30, 30);
    await page.locator('#terminal-back').click();
    await page.waitForURL('https://empty610.com/#projects');
    await page.waitForFunction(() => !document.querySelector('#main').hidden && document.querySelector('#projects').classList.contains('enter'));
    assert.deepEqual(errors, []);
    console.log('PASS: terminal BACK reaches personal Projects section; resources and JavaScript');
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
