const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { siteRoot, browserChannel } = require('../support/runtime.cjs');

(async () => {
  const { createPreviewServer } = await import('../../scripts/preview.mjs');
  const server = createPreviewServer(siteRoot);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ channel: browserChannel, headless: true, args: ['--enable-unsafe-swiftshader'] });
  const errors = [];
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('response', response => { if (response.url().startsWith(base) && response.status() >= 400) errors.push(response.status() + ' ' + response.url()); });
  // Test-only access to the actual camera, without exposing production hooks.
  await page.route('**/vendor/OrbitControls.js*', async route => {
    const response = await route.fetch();
    await route.fulfill({response, body: await response.text() + '\n;globalThis.OrbitControls = new Proxy(globalThis.OrbitControls, {construct(Target,args) {const controls = Reflect.construct(Target,args); globalThis.__earthControls = controls; return controls;}});'});
  });
  await page.addInitScript(() => {
    // Sample rendered pixels without encoding/transferring the full-size view.
    window.__earthFrame = canvas => {
      const small = document.createElement('canvas'); small.width = small.height = 96;
      small.getContext('2d').drawImage(canvas, 0, 0, 96, 96);
      return small.toDataURL();
    };
  });
  const notes = [];
  try {
    await page.goto(base + '/earth/index.html');
    await page.waitForSelector('[data-earth-ready="true"]');
    assert.equal(await page.locator('#spin').getAttribute('aria-pressed'), 'false');
    const canvas = page.locator('#model-mount canvas');
    await page.waitForTimeout(150);
    const day = await canvas.evaluate(element => __earthFrame(element));
    await page.waitForTimeout(200);
    assert.equal(await canvas.evaluate(element => __earthFrame(element)), day, 'reduced-motion model remains still');
    await page.locator('#night').click();
    await page.waitForTimeout(120);
    assert.notEqual(await canvas.evaluate(element => __earthFrame(element)), day, 'night view changes the actual rendering');
    assert.equal(await page.locator('#night').getAttribute('aria-pressed'), 'true');
    await page.locator('#night').click();
    await page.locator('#spin').click();
    await page.waitForTimeout(150);
    const rotating = await canvas.evaluate(element => __earthFrame(element));
    await page.waitForTimeout(200);
    assert.notEqual(await canvas.evaluate(element => __earthFrame(element)), rotating, 'explicit playback moves the globe');
    await page.locator('#spin').click();
    await page.locator('#reset').click();
    notes.push('Day/night textures, playback, reset and reduced motion');
    await require('./earth-model-checks.cjs')(page);
    notes.push('Wheel/pinch/button zoom, projected latitude, smooth interruptible reset, resize and reduced motion');

    // Paused rotation isolates the texture transition from camera/globe motion.
    await page.waitForTimeout(300);
    const restingDay = await canvas.evaluate(element => __earthFrame(element));
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.locator('#night').click();
    await page.waitForTimeout(180);
    const dusk = await canvas.evaluate(element => __earthFrame(element));
    await page.waitForTimeout(180);
    const laterDusk = await canvas.evaluate(element => __earthFrame(element));
    await page.waitForTimeout(1400);
    const restingNight = await canvas.evaluate(element => __earthFrame(element));
    assert.notEqual(dusk, restingDay, 'night transition starts while rotation is paused');
    assert.notEqual(laterDusk, dusk, 'night transition renders intermediate frames');
    assert.notEqual(laterDusk, restingNight, 'transition does not immediately jump to night');
    await page.waitForTimeout(200);
    assert.equal(await canvas.evaluate(element => __earthFrame(element)), restingNight, 'transition settles to a still night view');
    await page.locator('#night').click();
    await page.waitForTimeout(180);
    const dawn = await canvas.evaluate(element => __earthFrame(element));
    assert.notEqual(dawn, restingNight, 'return to daylight also interpolates');
    const noJump = await page.evaluate(() => {
      const surface = document.querySelector('#model-mount canvas');
      const before = __earthFrame(surface);
      document.getElementById('night').click();
      document.getElementById('night').click();
      return __earthFrame(surface) === before;
    });
    assert(noJump, 'rapid reversal does not synchronously swap textures');
    await page.waitForTimeout(1600);
    assert.equal(await canvas.evaluate(element => __earthFrame(element)), restingDay, 'rapid reversal reaches the last selected view');
    await page.locator('#night').click();
    await page.waitForTimeout(180);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForTimeout(120);
    assert.equal(await canvas.evaluate(element => __earthFrame(element)), restingNight, 'reduced-motion change settles an active transition');
    await page.locator('#night').click();
    notes.push('Smooth day/night frames, paused rotation, rapid reversal and mid-transition reduced motion');

    await page.locator('#tab-ocean').focus();
    await page.keyboard.press('ArrowRight');
    assert(await page.locator('#land-panel').isVisible());
    assert.equal(await page.locator('#tab-land').getAttribute('tabindex'), '0');
    for (const layer of ['mantle', 'outer', 'inner', 'crust']) {
      await page.locator('#tab-' + layer).click();
      assert(await page.locator('#' + layer + '-panel').isVisible());
      assert(await page.locator(`.layer-shape[data-layer="${layer}"]`).evaluate(e => e.classList.contains('is-selected')));
    }
    notes.push('Keyboard tabs and all four interior layers');

    await page.emulateMedia({ reducedMotion: 'no-preference' });
    const deckHeight = await page.locator('.surface-copy .panel-deck').evaluate(e => e.offsetHeight);
    assert(await page.evaluate(() => { document.getElementById('tab-ice').click(); return document.getElementById('land-panel').inert; }), 'outgoing text is inert while fading out');
    await page.waitForFunction(() => !document.querySelector('.tab-view-enter,.tab-view-exit,.earth-figure-enter'));
    assert(await page.locator('[data-surface-figure="ice"]').isVisible(), 'art follows the selected subject');
    assert.equal(await page.locator('.surface-copy .panel-deck').evaluate(e => e.offsetHeight), deckHeight, 'chapter height remains stable');
    await page.evaluate(() => {
      document.getElementById('tab-ocean').click();
      document.getElementById('tab-land').click();
      document.getElementById('tab-cycle').click();
    });
    await page.waitForFunction(() => !document.querySelector('.tab-view-enter,.tab-view-exit,.earth-figure-enter'));
    assert(await page.locator('#cycle-panel').isVisible());
    assert(await page.locator('[data-surface-figure="cycle"]').isVisible());
    assert.equal(await page.locator('.is-leaving').count(), 0, 'rapid selection leaves no fading figure');
    await page.locator('#tab-ocean').click();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForFunction(() => !document.querySelector('.tab-view-enter,.tab-view-exit,.earth-figure-enter'));
    assert(await page.locator('#ocean-panel').isVisible());
    assert(await page.locator('[data-surface-figure="ocean"]').isVisible());
    notes.push('Animated tabs, coordinated art, stable height, rapid selection and reduced-motion changes');

    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.locator('#tab-cycle').click();
    await page.waitForFunction(() => !document.querySelector('.earth-figure-enter') && document.querySelector('[data-surface-figure="cycle"]').classList.contains('art-active'));
    const waterFlow = page.locator('[data-surface-figure="cycle"] .art-flow');
    assert.equal(await waterFlow.evaluate(e => getComputedStyle(e).animationPlayState), 'running');
    await page.locator('#art-motion').click();
    assert.equal(await page.locator('.art-active').count(), 0, 'illustration pause reaches every scene');
    assert.equal(await waterFlow.evaluate(e => getComputedStyle(e).animationPlayState), 'paused');
    await page.locator('#art-motion').click();
    await page.locator('.living-atlas').scrollIntoViewIfNeeded();
    await page.waitForFunction(() => document.querySelector('.living-atlas').classList.contains('art-active') && !document.querySelector('[data-surface-figure="cycle"]').classList.contains('art-active'));
    await page.evaluate(() => dispatchEvent(new Event('pagehide')));
    assert.equal(await page.locator('.art-active').count(), 0, 'pagehide suspends illustrations');
    await page.evaluate(() => dispatchEvent(new Event('pageshow')));
    assert(await page.locator('.living-atlas').evaluate(e => e.classList.contains('art-active')));
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForFunction(() => document.getElementById('art-motion').disabled);
    assert.equal(await page.locator('.art-active').count(), 0, 'reduced motion stops decorative playback');
    notes.push('Illustration playback, global pause, offscreen sleep, page lifecycle and reduced motion');

    // New diagram tabs must not push the reading column or the next chapter.
    for (const [figure, prefix, keys] of [
      ['.magnetic-atlas', 'mag', ['wind', 'tail', 'aurora']],
      ['.living-atlas', 'eco', ['water', 'energy', 'soil']],
    ]) {
      await page.locator(figure).scrollIntoViewIfNeeded();
      await page.locator('#' + prefix + '-' + keys[0] + '-tab').focus();
      const stable = await page.locator(figure).evaluate(e => ({ height: e.offsetHeight, scroll: scrollY }));
      await page.keyboard.press('End');
      assert.equal(await page.locator(figure).getAttribute('data-scene-focus'), keys[2]);
      assert.equal(await page.locator('#' + prefix + '-' + keys[2] + '-tab').getAttribute('tabindex'), '0');
      await page.keyboard.press('Home');
      assert.equal(await page.locator(figure).getAttribute('data-scene-focus'), keys[0]);
      assert.equal(await page.locator(figure).evaluate(e => e.offsetHeight), stable.height);
      assert.equal(await page.evaluate(() => scrollY), stable.scroll, 'keyboard selection does not move the page');
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.evaluate(({prefix, keys}) => {
        keys.forEach(key => document.getElementById(prefix + '-' + key + '-tab').click());
      }, {prefix, keys});
      await page.waitForFunction(() => !document.querySelector('.tab-view-enter,.tab-view-exit,.earth-relation-enter'));
      assert.equal(await page.locator(figure).getAttribute('data-scene-focus'), keys[2]);
      assert.equal(await page.locator(figure + ' [role="tabpanel"]:visible').count(), 1);
      assert.equal(await page.locator(figure).evaluate(e => e.offsetHeight), stable.height);
      await page.locator('#' + prefix + '-' + keys[1] + '-tab').click();
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.waitForFunction(() => !document.querySelector('.tab-view-enter,.tab-view-exit,.earth-relation-enter'));
      assert.equal(await page.locator(figure).getAttribute('data-scene-focus'), keys[1]);
      assert.equal(await page.locator(figure + ' [inert]').count(), 0);
    }
    notes.push('Magnetosphere and ecology: keyboard, stable heights/scroll, rapid selection and interrupted motion');

    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      for (const figure of ['.magnetic-atlas', '.living-atlas']) {
        const box = await page.locator(figure).boundingBox();
        assert(box.x >= 0 && box.x + box.width <= width, 'diagram fits the viewport');
        const height = await page.locator(figure).evaluate(e => e.offsetHeight);
        for (const tab of await page.locator(figure + ' [role="tab"]').all()) {
          await tab.click();
          assert.equal(await page.locator(figure).evaluate(e => e.offsetHeight), height, 'diagram height stable at ' + width);
          const fits = await page.locator(figure + ' .scene-notes').evaluate(e => e.offsetHeight >= e.querySelector('[role="tabpanel"]:not([hidden])').offsetHeight);
          assert(fits, 'caption fits reserved height at ' + width);
        }
      }
      await page.locator('.section-nav a[href="#atmosphere"]').click();
      await page.waitForFunction(() => document.querySelector('.section-nav a[aria-current]')?.hash === '#atmosphere');
      assert.equal(await page.evaluate(() => location.hash), '#atmosphere');
      assert(await page.locator('#art-motion').evaluate(button => {
        const box = button.getBoundingClientRect();
        return button.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2));
      }), 'illustration pause is not covered by the fixed back button');
      assert(await page.locator('#atmosphere-title').evaluate(e => e.getBoundingClientRect().top >= document.querySelector('.section-nav').getBoundingClientRect().bottom), 'chapter heading clears sticky navigation');
      await page.locator('#atmosphere .reading-essay').last().scrollIntoViewIfNeeded();
      await page.waitForFunction(() => document.querySelector('.section-nav a[aria-current]')?.hash === '#atmosphere');
      assert.equal(await page.locator('.section-nav a[aria-current]').count(), 1, 'long chapter retains one active location');
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    notes.push('Diagram captions at 320/390/1440px, native chapter anchors and uninterrupted chapter tracking');

    const dayLength = async () => parseFloat(await page.locator('#daylight-value').textContent());
    await page.locator('[data-angle="90"]').click();
    assert((await dayLength()) > 14.7 && (await dayLength()) < 15, 'northern summer daylight');
    await page.locator('[data-angle="270"]').click();
    assert((await dayLength()) > 9 && (await dayLength()) < 9.3, 'northern winter daylight');
    await page.locator('#latitude').fill('-40');
    assert((await dayLength()) > 14.7, 'southern seasons reverse');
    await page.locator('#latitude').fill('0');
    assert.equal(await dayLength(), 12, 'equator daylight');
    await page.locator('#latitude').fill('40');
    await page.locator('[data-angle="0"]').click();
    assert.equal(await dayLength(), 12, 'equinox daylight');
    notes.push('Season/daylight calculations at both hemispheres and the equator');

    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.locator('.moon-origin summary').click();
    await page.locator('.moon-origin').evaluate(async element => {
      await Promise.allSettled(element.getAnimations({subtree:true}).filter(a => a.effect.getTiming().iterations !== Infinity).map(a => a.finished));
    });
    assert(await page.locator('.moon-origin > p').first().isVisible(), 'expanded explanation remains readable');
    await page.locator('.moon-origin summary').press('Enter');
    await page.locator('.moon-origin').evaluate(async element => {
      await Promise.allSettled(element.getAnimations({subtree:true}).filter(a => a.effect.getTiming().iterations !== Infinity).map(a => a.finished));
    });
    assert.equal(await page.locator('.moon-origin').getAttribute('open'), null, 'keyboard closes native explanation');
    await page.locator('#earthrise-open').click();
    await page.locator('#image-dialog[open]').waitFor();
    assert.equal(await page.evaluate(() => document.documentElement.style.overflow), 'hidden');
    await page.keyboard.press('Escape');
    await page.locator('#image-dialog').waitFor({ state: 'hidden' });
    assert.equal(await page.evaluate(() => document.activeElement.id), 'earthrise-open');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    notes.push('Animated native explanations and image dialog, Escape, scroll lock and focus restoration');

    for (const width of [1440, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `no page overflow at ${width}px`);
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.evaluate(() => { document.querySelectorAll('img[loading]').forEach(image => image.loading = 'eager'); });
    await page.evaluate(() => Promise.all([...document.images].map(image => image.decode())));
    await page.screenshot({ path: path.resolve(__dirname, '../../.qa/earth-checked-full.png'), fullPage: true });
    notes.push('320/390/768/1440px layouts and all local images');

    await page.goto(base + '/terminal/');
    await page.locator('.body-point[data-select="earth"]').click();
    assert.equal(await page.locator('#enter-link').getAttribute('href'), '../earth/index.html');
    await page.locator('#enter-link').click();
    await page.waitForURL('**/earth/');
    assert(await page.locator('#title').isVisible());
    notes.push('Terminal selection and shared navigation transition');

    const fallback = await context.newPage();
    await fallback.route('**/earth-day.jpg', route => route.abort());
    await fallback.goto(base + '/earth/');
    await fallback.locator('#model-fallback:not([hidden])').waitFor();
    assert.equal(await fallback.locator('#model-mount canvas').count(), 0, 'failure disposes the canvas');
    await fallback.locator('[data-angle="90"]').click();
    assert(parseFloat(await fallback.locator('#daylight-value').textContent()) > 14.7, 'reading experiments survive model failure');
    await fallback.close();
    notes.push('Failed texture gracefully falls back without breaking reading');

    const nojs = await browser.newContext({ javaScriptEnabled: false });
    const reading = await nojs.newPage();
    await reading.goto(base + '/earth/');
    assert(await reading.locator('#model-fallback').isVisible());
    assert(await reading.locator('#mantle-panel').isVisible());
    assert(await reading.getByRole('heading', { name: '一片森林，远不止一群树。' }).isVisible());
    assert(await reading.getByRole('heading', { name: '从一朵积云，到旋转的风暴。' }).isVisible());
    assert.equal(await reading.locator('main section[id]').count(), 8);
    assert.equal(await reading.locator('.scene-notes [role="tabpanel"]:visible').count(), 6, 'all diagram explanations survive no JavaScript');
    assert.equal(await reading.locator('.scene-tabs:visible').count(), 0);
    await nojs.close();
    const offline = await context.newPage();
    offline.on('pageerror', error => errors.push(error.message));
    await offline.goto(pathToFileURL(path.join(siteRoot, 'earth/index.html')).href);
    await offline.waitForSelector('[data-earth-ready="true"]');
    await offline.locator('#night').click();
    assert.equal(await offline.locator('#night').getAttribute('aria-pressed'), 'true');
    await offline.close();
    notes.push('No-JavaScript reading and direct file:// model/night view');
    assert.deepEqual(errors, []);
    notes.forEach(note => console.log('PASS: ' + note));
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
