const {siteRoot, browserChannel} = require('../support/runtime.cjs');
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const cases = [
  ['mercury', 'science.js', 'tick', '#play', '#time-slider'],
  ['venus', 'index.html', 'frame', '#play', '#day'],
  ['mars', 'simulation.js', 'frame', '#play', '#day'],
  ['jupiter', 'app.js', 'tick', '#play-orbits', '#time-slider'],
  ['europa', 'app.js', 'tick', '#play-orbits', '#time-slider'],
];
(async () => {
  const {createPreviewServer} = await import('../../scripts/preview.mjs');
  const server = createPreviewServer(siteRoot);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({channel:browserChannel, headless:true, args:['--enable-unsafe-swiftshader']});
  const results = [];
  try {
    for (const [name, file, callback, play, slider] of cases) {
      const page = await browser.newPage({reducedMotion:'reduce', viewport:{width:1366,height:900}});
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.addInitScript(({file, callback}) => {
        window.activityFrames = 0;
        const raf = requestAnimationFrame;
        window.requestAnimationFrame = fn => {
          const tracked = fn.name === callback && (new Error().stack || '').includes(file);
          return raf.call(window, now => { if (tracked) activityFrames++; fn(now); });
        };
      }, {file:file === 'index.html' ? '/venus/' : file, callback});
      await page.goto(base + '/' + name + '/');
      await page.locator(play).scrollIntoViewIfNeeded();
      await page.locator(play).click();
      const start = Number(await page.locator(slider).inputValue());
      await page.waitForFunction(({slider,start}) => Number(document.querySelector(slider).value) > start, {slider,start});
      // Venus keeps a live timeline near its footer; Jupiter/Europa also have
      // a clock-driven model at the top. Move away from every clock consumer.
      await page.evaluate(name => scrollTo(0, ['jupiter','europa'].includes(name) ? document.body.scrollHeight : 0), name);
      await page.waitForTimeout(350);
      const time = await page.locator(slider).inputValue(), before = await page.evaluate(() => activityFrames);
      await page.waitForTimeout(600);
      const offscreenCallbacks = await page.evaluate(n => activityFrames - n, before);
      assert.equal(offscreenCallbacks, 0, name + ' offscreen RAF callbacks');
      assert.equal(await page.locator(slider).inputValue(), time, name + ' preserves time while offscreen');
      assert.equal(await page.locator(play).getAttribute('aria-pressed'), 'true', 'playback selection survives sleep');
      await page.locator(play).scrollIntoViewIfNeeded();
      await page.waitForFunction(({slider,time}) => Number(document.querySelector(slider).value) > Number(time), {slider,time});
      await page.evaluate(() => dispatchEvent(new PageTransitionEvent('pagehide')));
      const hidden = await page.locator(slider).inputValue();
      await page.waitForTimeout(250);
      assert.equal(await page.locator(slider).inputValue(), hidden, 'pagehide suspends the clock');
      await page.evaluate(() => dispatchEvent(new PageTransitionEvent('pageshow', {persisted:true})));
      await page.waitForFunction(({slider,hidden}) => Number(document.querySelector(slider).value) > Number(hidden), {slider,hidden});
      if (['jupiter', 'europa'].includes(name)) {
        await page.locator('#model-stage').scrollIntoViewIfNeeded();
        const prior = Number(await page.locator(slider).inputValue());
        await page.waitForFunction(({slider,prior}) => Number(document.querySelector(slider).value) > prior, {slider,prior});
      }
      assert.deepEqual(errors, []);
      results.push({name, offscreenCallbacks, resumed:true});
      console.log('PASS: ' + name + ': visible playback, offscreen sleep, resume and page lifecycle');
      await page.close();
    }
    const sky = await browser.newPage({reducedMotion:'reduce'});
    await sky.route('**/mars/sky-model.js*', async route => {
      const response = await route.fetch();
      await route.fulfill({response, body:await response.text() + '\n;window.skyCalls=0;const rawPosition=MarsSkyModel.position;MarsSkyModel.position=(...args)=>{skyCalls++;return rawPosition(...args);};'});
    });
    await sky.goto(base + '/mars/');
    const counts = await sky.evaluate(() => {
      const {start,end,stationary} = MarsSkyModel;
      const samples = Array.from({length:661}, (_,i) => start + (end-start)*i/660);
      const legacySegment = (from,to) => to > from ? [from,...samples.filter(t=>t>from&&t<to),to].map((t,i) => {
        const p = MarsSkyView.pointAt(t);
        return `${i ? 'L' : 'M'}${p.x.toFixed(3)},${p.y.toFixed(3)}`;
      }).join(' ') : '';
      const results = [];
      for (const day of [0, 100, MarsModel.OPPOSITION, 500, MarsModel.CYCLE]) {
        skyCalls = 0;
        MarsOrbitControl.setDay(day, true);
        const calls = skyCalls;
        const shown = Math.max(start,Math.min(end,MarsSkyView.timeForDay(day)));
        const full = legacySegment(start,Math.min(shown,stationary[0]))+' '+legacySegment(stationary[1],shown);
        const retro = legacySegment(stationary[0],Math.min(shown,stationary[1]));
        if (document.getElementById('sky-full-path').getAttribute('d') !== full ||
            document.getElementById('sky-retro-path').getAttribute('d') !== retro) throw Error('Changed scientific trail');
        results.push({day,calls});
      }
      return results;
    });
    assert(counts.every(result => result.calls <= 7), 'trail updates calculate at most six boundary positions plus the marker');
    results.push({sky:counts});
    console.log('PASS: cached Mars trails match original paths exactly, with at most seven position calculations per update');
    await sky.close();
    fs.writeFileSync(path.join(__dirname, '../../.qa/activity-results.json'), JSON.stringify(results,null,2));
  } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode=1; });
