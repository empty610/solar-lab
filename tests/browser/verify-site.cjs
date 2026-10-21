const { siteRoot, browserChannel } = require('../support/runtime.cjs');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = siteRoot;
const pages = [
  'terminal',
  'mercury',
  'venus',
  'mars',
  'jupiter',
  'saturn',
  'uranus',
  'neptune',
  'europa',
  'pluto',
];
const nextStation = { mercury:'venus', venus:'mars', mars:'jupiter', jupiter:'saturn', saturn:'uranus', uranus:'neptune', neptune:'pluto', pluto:'terminal', europa:'saturn' };
function files(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === '.git') return [];
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? files(file) : [file];
  });
}
function existsWithExactCase(file) {
  if (!fs.existsSync(file)) return false;
  const relative = path.relative(root, file);
  let directory = root;
  for (const name of relative.split(path.sep)) {
    if (!fs.readdirSync(directory).includes(name)) return false;
    directory = path.join(directory, name);
  }
  return true;
}
for (const file of files(root)) {
  assert(fs.statSync(file).size < 25 * 1024 * 1024, 'Cloudflare asset limit: ' + file);
  if (!/\.(html|css)$/.test(file)) continue;
  const text = fs.readFileSync(file, 'utf8').replace(/url\((["'])data:[\s\S]*?\1\)/g, '');
  const referencePattern = file.endsWith('.html')
    ? /(?:src|href)=["']([^"']+)["']|url\(["']?([^\s)'";]+)["']?\)/g
    : /url\(["']?([^\s)'";]+)["']?\)/g;
  for (const match of text.matchAll(referencePattern)) {
    const reference = match[1] || match[2];
    if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(reference)) continue;
    const url = reference.split(/[?#]/)[0];
    if (!url) continue;
    let target = url.startsWith('/') ? path.join(root, url) : path.resolve(path.dirname(file), url);
    if (fs.existsSync(target) && fs.statSync(target).isDirectory())
      target = path.join(target, 'index.html');
    assert(
      existsWithExactCase(target),
      'Missing or incorrectly cased reference: ' + file + ' -> ' + reference,
    );
  }
}
const mime = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.mp3': 'audio/mpeg',
};
const server = http.createServer((request, response) => {
  let file = path.resolve(
    root,
    '.' + decodeURIComponent(new URL(request.url, 'http://localhost').pathname),
  );
  if (file !== root && !file.startsWith(root + path.sep)) {
    response.writeHead(400);
    response.end();
    return;
  }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) {
    response.writeHead(404);
    response.end();
    return;
  }
  response.writeHead(200, {
    'Content-Type': mime[path.extname(file)] || 'application/octet-stream',
  });
  fs.createReadStream(file).pipe(response);
});
(async () => {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({
    channel: browserChannel,
    headless: true,
    args: ['--enable-unsafe-swiftshader'],
  });
  const errors = [];
  try {
    const nojs = await browser.newPage({ javaScriptEnabled: false });
    await nojs.goto(base + '/terminal/index.html');
    assert.equal(await nojs.locator('.no-script a').count(), 9);
    assert(await nojs.locator('.no-script a[href="../uranus/index.html"]').isVisible());
    await nojs.close();
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    page.on('pageerror', (error) => { errors.push(error.message); console.error(page.url() + '\n' + error.stack); });
    page.on('response', (response) => {
      if (response.url().startsWith(base) && response.status() >= 400)
        errors.push(response.status() + ' ' + response.url());
    });
    await page.goto(base + '/');
    await page.waitForURL('**/terminal/');
    await page.waitForFunction(() => window.SolarAtlasLabels);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1200);
    const top = await page.locator('#explorer').evaluate((e) => e.getBoundingClientRect().top);
    await page.locator('#catalog-tab').click();
    await page.waitForTimeout(700);
    await page.locator('#catalog').evaluate(async (element) => {
      await new Promise(requestAnimationFrame);
      await Promise.all(element.getAnimations().map((animation) => animation.finished.catch(() => {})));
    });
    assert(await page.locator('#catalog').isVisible());
    assert.equal(await page.evaluate(() => scrollY), 0);
    assert(
      Math.abs(
        (await page.locator('#catalog').evaluate((e) => e.getBoundingClientRect().top)) - top,
      ) < 1,
      'tabs stay in the same position',
    );
    await page.locator('.planet-card[data-select="mars"]').click();
    await page.waitForTimeout(700);
    assert(await page.locator('#explorer').isVisible());
    assert.equal(
      await page.locator('#destination').evaluate((e) => e === document.activeElement),
      true,
    );
    assert.equal(await page.locator('#enter-link').getAttribute('href'), '../mars/index.html');
    await page.locator('#catalog-tab').click();
    await page.waitForTimeout(700);
    const entries = await page
      .locator('.card-entry, .moon-entry')
      .evaluateAll((elements) => elements.map((e) => e.href));
    assert.equal(entries.length, 9);
    for (const url of entries) assert.equal((await page.request.get(url)).status(), 200);
    await page.screenshot({
      path: path.resolve(__dirname, '../../.qa/publish-catalog.png'),
      fullPage: true,
    });
    const navigationStart = Date.now();
    await page.locator('.card-entry[href="../venus/index.html"]').click();
    await page.locator('#dc-page-transition.is-active').waitFor();
    await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: false })));
    assert.equal(
      await page.locator('.dc-transition-core p').textContent(),
      'VENUS // ESTABLISHING LINK',
    );
    await page.waitForTimeout(500);
    assert(page.url().endsWith('/terminal/'), 'show the hand-off before navigating');
    assert.equal(
      await page
        .locator('.dc-transition-orbit-a')
        .evaluate((element) => getComputedStyle(element).animationName),
      'dc-orbit-a',
    );
    await page.screenshot({
      path: path.resolve(__dirname, '../../.qa/link-transition.png'),
    });
    await page.waitForURL('**/venus/');
    assert(Date.now() - navigationStart >= 1000, 'personal site one-second transition');
    await page.locator('a[aria-label="返回太阳系 Terminal"]').click();
    await page.locator('#dc-page-transition.is-active').waitFor();
    assert.equal(
      await page.locator('.dc-transition-core p').textContent(),
      'TERMINAL // ESTABLISHING LINK',
    );
    await page.waitForURL('**/terminal/');
    await page.goBack();
    assert.equal(
      await page.locator('#dc-page-transition').getAttribute('aria-hidden'),
      'true',
      'clear overlay after browser back',
    );
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page
      .locator('a[aria-label="返回太阳系 Terminal"]')
      .evaluate((element) => element.click());
    await page.locator('#dc-page-transition.is-active').waitFor();
    assert.equal(
      await page.locator('.dc-transition-orbit-a').evaluate((element) => getComputedStyle(element).animationName),
      'none',
      'reduced motion keeps a static connection screen',
    );
    await page.waitForURL('**/terminal/');
    assert.equal(
      await page.locator('#dc-page-transition.is-mounted').count(),
      0,
      'clear the reduced-motion connection screen after navigation',
    );
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    if (process.argv.includes('--navigation-only')) {
      assert.deepEqual(errors, []);
      console.log('PASS: orbit overlay, one-second hand-off, terminal return, initial pageshow, browser-back cleanup and reduced motion.');
      return;
    }
    for (const name of pages) {
      await page.goto(base + '/' + name + '/index.html');
      await page.waitForTimeout(800);
      await page.evaluate(() => {
        document
          .querySelectorAll('img[loading="lazy"]')
          .forEach((image) => (image.loading = 'eager'));
      });
      await page.evaluate(() =>
        Promise.all(
          [...document.images]
            .filter((image) => image.getAttribute('src'))
            .map((image) => image.decode()),
        ),
      );
      if (name !== 'terminal') assert(await page.locator('canvas').count(), name + ' model canvas');
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
        false,
        name + ' desktop overflow',
      );
      if (name === 'mars') {
        for (const id of ['rovers-tab', 'pioneer-tab', 'model-tab']) {
          await page.locator('#' + id).click();
          await page.waitForTimeout(800);
        }
      }
      if (name !== 'terminal') {
        const onward = page.locator('footer.journey-footer a[data-next-station]');
        assert.equal(await onward.count(), 1, name + ' has one next station');
        assert.equal(await onward.getAttribute('href'), '../' + nextStation[name] + '/index.html');
        await onward.evaluate(element => element.click());
        await page.locator('#dc-page-transition.is-active').waitFor();
        assert.equal(await page.locator('.dc-transition-core p').textContent(), nextStation[name].toUpperCase() + ' // ESTABLISHING LINK');
        await page.waitForURL('**/' + nextStation[name] + '/');
        await page.goto(base + '/' + name + '/index.html');
        await page.waitForTimeout(350);
        const back = page.locator('a[aria-label="返回太阳系 Terminal"]');
        assert.equal(await back.count(), 1, name + ' terminal back entry');
        assert(
          (await back.getAttribute('href')).endsWith('/terminal/index.html'),
          name + ' back route',
        );
        const triggers = page.locator('[data-photo], button[data-terrain], [data-image-full]');
        const count = await triggers.count();
        assert(count > 0, name + ' photo triggers');
        for (let i = 0; i < count; i++) {
          await triggers.nth(i).evaluate((element) => {
            element.focus();
            element.click();
          });
          const dialog = page.locator('dialog[open]');
          await dialog.waitFor({ state: 'visible' });
          await dialog.locator('img').evaluate((image) => image.decode());
          await page.waitForTimeout(450);
          const layout = await dialog.evaluate((element) => {
            const visual = element.querySelector(
              ':scope > img, :scope > figure > img, :scope > .dialog-image, :scope > .dialog-visual',
            );
            const copy = element.querySelector('.dialog-copy, figcaption');
            const a = visual.getBoundingClientRect(),
              b = copy.getBoundingClientRect();
            return {
              right: a.right,
              bottom: a.bottom,
              x: b.x,
              y: b.y,
              imageHeight: a.height,
              copyHeight: b.height,
            };
          });
          assert(layout.x >= layout.right - 1, name + ' image left / description right');
          assert(layout.imageHeight > 100 && layout.copyHeight > 100, name + ' dialog height');
          if (i === 0)
            await page.screenshot({
              path: path.resolve(
                __dirname,
                '../../.qa/dialog-' + name + '.png',
              ),
            });
          await page.setViewportSize({ width: 390, height: 844 });
          const mobile = await dialog.evaluate((element) => {
            const visual = element.querySelector(
              ':scope > img, :scope > figure > img, :scope > .dialog-image, :scope > .dialog-visual',
            );
            const copy = element.querySelector('.dialog-copy, figcaption');
            const a = visual.getBoundingClientRect(),
              b = copy.getBoundingClientRect();
            return {
              bottom: a.bottom,
              y: b.y,
              overflow: element.scrollWidth > element.clientWidth,
            };
          });
          assert(
            mobile.y >= mobile.bottom - 1 && !mobile.overflow,
            name + ' readable mobile dialog',
          );
          await page.keyboard.press('Escape');
          await dialog.waitFor({ state: 'hidden' });
          await page.setViewportSize({ width: 1440, height: 1000 });
        }
        if (name === 'mars') {
          await page.locator('#rovers-tab').click();
          await page.waitForTimeout(800);
          await page.locator('#world-expand').click();
          await page.waitForTimeout(450);
          assert(await page.locator('#world-map-dialog[open]').isVisible());
          const mapLayout = await page.locator('#world-map-dialog').evaluate((element) => ({
            image: element.querySelector('.world-dialog-scroll').getBoundingClientRect().right,
            copy: element.querySelector('header').getBoundingClientRect().x,
          }));
          assert(mapLayout.copy >= mapLayout.image - 1, 'Mars enlarged map layout');
          await page.keyboard.press('Escape');
          await page.locator('#world-map-dialog').waitFor({ state: 'hidden' });
        }
        await back.click({ force: true });
        await page.waitForURL('**/terminal/');
        await page.goto(base + '/' + name + '/index.html');
        await page.waitForTimeout(500);
      }
      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForTimeout(150);
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
        false,
        name + ' mobile overflow',
      );
      await page.setViewportSize({ width: 1440, height: 1000 });
      console.log('Verified: ' + name);
    }
    assert.deepEqual(errors, []);
    console.log(
      'PASS: root entry, archive links, desktop/mobile pages, model canvases, photos, tab transitions, exact-case file paths and asset sizes.',
    );
  } finally {
    await browser.close();
    server.close();
  }
})().catch((error) => {
  console.error(error);
  server.close();
  process.exitCode = 1;
});
