const { siteRoot, browserChannel } = require('../support/runtime.cjs');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = siteRoot;
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.mp3': 'audio/mpeg', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
const server = http.createServer((request, response) => {
  let file = path.resolve(root, '.' + decodeURIComponent(new URL(request.url, 'http://localhost').pathname));
  if (!file.startsWith(root + path.sep)) { response.writeHead(400); response.end(); return; }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) { response.writeHead(404); response.end(); return; }
  const size = fs.statSync(file).size;
  const headers = { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Content-Length': size, 'Accept-Ranges': 'bytes' };
  const range = request.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
  if (range) {
    const start = Number(range[1]), end = range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
    response.writeHead(206, { ...headers, 'Content-Length': end - start + 1, 'Content-Range': `bytes ${start}-${end}/${size}` });
    fs.createReadStream(file, { start, end }).pipe(response);
  } else {
    response.writeHead(200, headers);
    fs.createReadStream(file).pipe(response);
  }
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = process.argv.includes('--live') ? 'https://solar.empty610.com' : 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({ channel: browserChannel, headless: true, args: ['--enable-unsafe-swiftshader'] });
  const errors = [];
  try {
    const page = await browser.newPage();
    page.on('pageerror', error => { errors.push(error.message); console.error(page.url() + '\n' + error.stack); });
    page.on('response', response => { if (response.status() >= 400) errors.push(response.status() + ' ' + response.url()); });
    const playing = async () => {
      await page.waitForFunction(() => !document.querySelector('#bg-music').paused);
      const time = await page.locator('#bg-music').evaluate(e => e.currentTime);
      await page.waitForFunction(previous => document.querySelector('#bg-music').currentTime > previous + .25, time);
      assert.equal(await page.locator('#music-toggle').getAttribute('aria-pressed'), 'true');
    };
    const backAppearance = e => {
      const css = getComputedStyle(e);
      return [css.backgroundColor, css.color, css.fontFamily, css.fontSize, css.fontWeight, css.letterSpacing, css.borderRadius, css.borderColor, css.height];
    };
    await page.goto(base + '/terminal/');
    const templateBack = await page.locator('#terminal-back').evaluate(backAppearance);
    const controlLayout = async (name) => {
      const back = page.locator('#archive-back');
      const top = page.locator('#archive-top');
      assert.equal(await back.count(), 1);
      assert.equal(await top.count(), 1);
      assert((await back.getAttribute('href')).endsWith('/terminal/index.html'));
      assert.equal(await top.getAttribute('href'), '#top');
      assert.deepEqual(await back.evaluate(backAppearance), templateBack, name + ' uses the Terminal/Venus BACK template');
      const a = await top.boundingBox(), b = await page.locator('#music-toggle').boundingBox(), c = await back.boundingBox();
      assert(a.y + a.height + 12 <= b.y, name + ' top and music have separate slots');
      assert(c.y + c.height <= a.y || c.x + c.width <= a.x, name + ' BACK has a separate slot');
      assert(await top.locator('svg').count());
      assert.equal(await back.locator('svg path').getAttribute('d'), 'M9 5 5 9l4 4M5 9h8a5 5 0 0 1 5 5v1');
    };
    for (const name of (process.argv.includes('--continuity-only') ? [] : ['mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'europa', 'pluto'])) {
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.goto(base + '/' + name + '/');
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(350);
      await controlLayout(name + ' desktop');
      assert.equal(await page.locator('audio').count(), 1, name + ' has one audio player');
      assert.equal(await page.locator('#music-toggle').count(), 1);
      assert.equal(await page.locator('#music').count(), 0, name + ' has no competing old player');
      assert(await page.locator('#bg-music').evaluate(e => e.paused));
      await page.mouse.move(20, 20);
      await page.locator('#music-toggle').click();
      await playing();
      await page.setViewportSize({ width: 390, height: 844 });
      await page.mouse.move(30, 30);
      await page.waitForTimeout(350);
      await controlLayout(name + ' mobile');
      const box = await page.locator('#music-toggle').boundingBox();
      assert(box && box.x >= 0 && box.y >= 0 && box.x + box.width <= 390 && box.y + box.height <= 844);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await page.screenshot({ path: path.resolve(__dirname, '../../.qa/music-' + name + '.png') });
      await page.waitForTimeout(2300);
      assert(await page.locator('#music-toggle').evaluate(e => e.classList.contains('is-idle-hidden')));
      await page.mouse.move(40, 40);
      await page.locator('#music-toggle').click();
      await page.waitForFunction(() => document.querySelector('#bg-music').paused);
      assert.equal(await page.evaluate(() => sessionStorage.getItem('site.music.mainEnabled')), '0');
      await page.evaluate(() => scrollTo(0, Math.min(700, document.documentElement.scrollHeight - innerHeight)));
      await page.mouse.move(50, 50);
      await page.locator('#archive-top').click();
      await page.waitForFunction(() => scrollY < 2);
      await page.locator('#archive-back').evaluate(e => e.click());
      await page.waitForURL('**/terminal/**');
      console.log('PASS: ' + name + ', music, separated controls, unified BACK, page-top and Terminal return');
    }
    await page.goto(base + '/terminal/');
    await page.locator('#catalog-tab').click();
    await page.locator('.planet-card[data-select="jupiter"]').click();
    await page.locator('#portrait-image').evaluate(image => image.decode());
    await page.locator('#planet-portrait').screenshot({ path: path.resolve(__dirname, '../../.qa/jupiter-upright.png') });
    await page.mouse.move(20, 20);
    await page.locator('#music-toggle').click();
    await playing();
    await page.waitForTimeout(600);
    await page.locator('#catalog-tab').click();
    await page.locator('.card-entry[href="../venus/index.html"]').click();
    await page.waitForURL('**/venus/**');
    await page.mouse.click(10, 10);
    await playing();
    assert(await page.locator('#bg-music').evaluate(e => e.currentTime > .6), 'archive resumes saved progress');
    await page.locator('a[aria-label="返回太阳系 Terminal"]').evaluate(e => e.click());
    await page.waitForURL('**/terminal/**');
    await page.mouse.click(10, 10);
    await playing();
    await page.mouse.move(20, 20);
    await page.locator('#music-toggle').click();
    await page.waitForFunction(() => document.querySelector('#bg-music').paused);
    await page.goto(base + '/mercury/');
    assert(await page.locator('#bg-music').evaluate(e => e.paused), 'paused preference carries to another archive');
    assert.deepEqual(errors, []);
    console.log('PASS: Terminal → Venus → Terminal music continuity and shared pause preference; no resource/JavaScript errors');
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
