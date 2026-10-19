const {siteRoot, browserChannel} = require('../support/runtime.cjs');
const {chromium} = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const {pathToFileURL} = require('node:url');
const output = path.resolve(__dirname, '../../.qa');
const server = http.createServer((req, res) => {
  let file = path.resolve(siteRoot, '.' + new URL(req.url, 'http://local').pathname);
  if (!file.startsWith(siteRoot + path.sep)) return res.writeHead(400).end();
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) return res.writeHead(404).end();
  res.setHeader('Content-Type', ({'.html':'text/html', '.js':'text/javascript', '.css':'text/css',
    '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.mp3':'audio/mpeg'})[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
const results = [];
async function check(name, run) {
  try { await run(); results.push({name, passed:true}); console.log('PASS: '+name); }
  catch (error) { results.push({name, passed:false, error:error.message}); console.error('FAIL: '+name+': '+error.message); }
}
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:'+server.address().port;
  const browser = await chromium.launch({channel:browserChannel, headless:true, args:['--enable-unsafe-swiftshader']});
  const errors = [];
  const newPage = async options => {
    const page = await browser.newPage({viewport:{width:1440,height:1000}, ...options});
    page.on('pageerror', error => errors.push(error.message));
    return page;
  };
  try {
    for (const name of ['terminal','mars']) await check(name+': CSS timing, reversal, keyboard and reduced motion', async () => {
      const page = await newPage();
      try {
        await page.goto(base+'/'+name+'/');
        const tablist = name === 'terminal' ? '.atlas-tabs' : '.planet-view-tabs';
        await page.locator(tablist).scrollIntoViewIfNeeded();
        const ids = await page.locator(tablist+' [role=tab]').evaluateAll(buttons => buttons.map(button => button.id));
        const current = await page.locator(tablist+' [aria-selected=true]').getAttribute('id');
        const other = ids.find(id => id !== current);
        const target = await page.locator('#'+other).getAttribute('aria-controls');
        await page.evaluate(() => document.documentElement.style.setProperty('--ui-exit-duration','650ms'));
        await page.locator('#'+other).click();
        await page.waitForTimeout(350);
        assert(await page.locator('#'+target).isHidden(), 'CSS defines exit duration beyond old 300ms timer');
        await page.waitForFunction(id => !document.getElementById(id).hidden, target);
        await page.evaluate(({ids}) => {
          for (let i=0;i<5;i++) ids.forEach(id => document.getElementById(id).click());
          document.getElementById(ids[0]).click();
        }, {ids});
        await page.waitForFunction(id => !document.getElementById(id).hidden,
          await page.locator('#'+ids[0]).getAttribute('aria-controls'));
        await page.waitForTimeout(700);
        assert.equal(await page.locator(tablist+' [aria-selected=true]').count(),1);
        assert.equal(await page.locator('.tab-view-exit,[role=tabpanel][inert]').count(),0,'rapid selection cleans exits and inert state');
        await page.locator('#'+ids[0]).focus();
        await page.keyboard.press('End');
        assert.equal(await page.evaluate(() => document.activeElement.id),ids.at(-1));
        await page.emulateMedia({reducedMotion:'reduce'});
        await page.waitForFunction(() => !document.querySelector('.tab-view-exit,[role=tabpanel][inert]'));
        await page.keyboard.press('Home');
        assert.equal(await page.locator('#'+ids[0]).getAttribute('aria-selected'),'true');
        assert(await page.locator('#'+await page.locator('#'+ids[0]).getAttribute('aria-controls')).isVisible());
      } finally { await page.close(); }
    });
    for (const name of ['mercury','venus','mars','jupiter','saturn','uranus','neptune','europa','pluto'])
      await check(name+': modal scroll lock, close focus and content scroll reset', async () => {
        const page = await newPage({reducedMotion:'reduce'});
        try {
          await page.goto(base+'/'+name+'/');
          const trigger = page.locator(':is([data-photo],button[data-terrain],[data-image-full]):visible').first();
          await trigger.waitFor();
          await page.evaluate(() => {
            document.documentElement.style.setProperty('overflow','scroll','important');
            document.body.style.overflow = 'auto';
          });
          await trigger.evaluate(element => { element.tabIndex=0; element.focus(); element.click(); });
          const modal = page.locator('dialog[open]');
          await modal.waitFor();
          assert.equal(await page.evaluate(() => document.documentElement.style.overflow),'hidden');
          await modal.locator('img').first().evaluate(image => image.decode());
          await modal.evaluate(element => {
            for (const copy of element.querySelectorAll('.dialog-copy,figcaption')) copy.scrollTop=copy.scrollHeight;
          });
          await page.keyboard.press('Escape');
          await modal.waitFor({state:'hidden'});
          assert(await trigger.evaluate(element => element === document.activeElement), 'focus returns to opener');
          assert.deepEqual(await page.evaluate(() => [document.documentElement.style.overflow,
            document.documentElement.style.getPropertyPriority('overflow'),document.body.style.overflow]), ['scroll','important','auto']);
          await trigger.evaluate(element => element.click());
          await modal.waitFor();
          assert(await modal.evaluate(element => [...element.querySelectorAll('.dialog-copy,figcaption')].every(copy => copy.scrollTop===0)));
          // Padding and image clicks do not count as backdrop clicks.
          await modal.evaluate(element => element.click());
          assert.equal(await modal.count(),1);
          await page.screenshot({path:path.join(output,'ui-'+name+'-desktop.png')});
          await page.setViewportSize({width:390,height:844});
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth>innerWidth),false);
          if (['venus','mars','saturn'].includes(name)) await page.screenshot({path:path.join(output,'ui-'+name+'-mobile.png')});
          await modal.locator('[data-dialog-close],.dialog-close,.image-dialog-close,#photo-close,#close-photo').first().click();
          await modal.waitFor({state:'hidden'});
          assert(await trigger.evaluate(element => element === document.activeElement));
        } finally { await page.close(); }
      });
    await check('nested modals and reopen during closing preserve ownership', async () => {
      const page = await newPage();
      try {
        await page.goto(base+'/jupiter/');
        await page.locator('[data-photo]').first().evaluate(button => { button.focus(); button.click(); });
        await page.evaluate(() => {
          const inner = document.createElement('dialog'); inner.id='ui-nested';
          inner.innerHTML='<button data-dialog-close>关闭</button><p>Nested modal</p>';
          document.body.append(inner); SolarUI.dialog(inner).open(document.querySelector('#photo-dialog .dialog-close'));
        });
        await page.keyboard.press('Escape');
        await page.waitForFunction(() => !document.getElementById('ui-nested').open);
        assert.equal(await page.evaluate(() => document.documentElement.style.overflow),'hidden');
        assert.equal(await page.locator('#photo-dialog[open]').count(),1);
        await page.evaluate(() => {
          const viewer=SolarUI.dialog(document.querySelector('#photo-dialog'));
          viewer.close(); viewer.open();
        });
        await page.waitForTimeout(650);
        assert.equal(await page.locator('#photo-dialog[open]').count(),1,'cancelled close cannot close reopened dialog');
        await page.keyboard.press('Escape');
        await page.waitForFunction(() => !document.querySelector('dialog[open]'));
        assert.equal(await page.evaluate(() => document.documentElement.style.overflow),'');
      } finally { await page.close(); }
    });
    await check('Mars rover navigation waits for the panel and keeps focus after closing its map', async () => {
      const page = await newPage();
      try {
        await page.goto(base+'/mars/');
        const first = await page.locator('#rover-world-map .rover-pin').first().getAttribute('data-id');
        await page.evaluate(id => {
          document.documentElement.style.setProperty('--ui-exit-duration','650ms');
          location.hash='#rovers/'+id;
        }, first);
        await page.waitForFunction(() => document.activeElement?.id==='rover-introduction');
        assert(await page.locator('#rover-panel').isVisible());
        await page.locator('#world-expand').click();
        await page.waitForFunction(() => !document.getElementById('world-map-dialog').classList.contains('ui-dialog-opening'));
        assert.equal(await page.locator('#world-map-dialog').evaluate(element => element.getAnimations().filter(a=>a.playState==='running').length),0,'map does not replay a legacy entrance');
        const pin = page.locator('#world-map-dialog .rover-pin').last();
        const chosen = await pin.getAttribute('data-id');
        await pin.click();
        await page.waitForFunction(() => !document.getElementById('world-map-dialog').open);
        await page.waitForTimeout(100);
        assert.equal(await page.evaluate(() => document.activeElement.id),'rover-introduction');
        assert.equal(await page.evaluate(() => location.hash),'#rovers/'+chosen);
      } finally { await page.close(); }
    });
    await check('backdrop closes only for an outside press; dragging from the image keeps the modal open', async () => {
      const page = await newPage();
      try {
        await page.goto(base+'/jupiter/');
        await page.locator('[data-photo]').first().click();
        const modal = page.locator('dialog[open]');
        await page.waitForTimeout(500);
        const box = await modal.locator('img').first().boundingBox();
        await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
        await page.mouse.down(); await page.mouse.move(2,2,{steps:5}); await page.mouse.up();
        assert.equal(await modal.count(),1);
        await page.mouse.click(2,2);
        await modal.waitFor({state:'hidden'});
      } finally { await page.close(); }
    });
    await check('extracted Mars and Venus styles work offline and keep content readable without JavaScript', async () => {
      for (const name of ['mars','venus']) {
        const page = await newPage({javaScriptEnabled:false});
        try {
          await page.goto(pathToFileURL(path.join(siteRoot,name,'index.html')).href);
          assert.notEqual(await page.locator('body').evaluate(element=>getComputedStyle(element).backgroundColor),'rgba(0, 0, 0, 0)');
          assert(await page.locator('main').isVisible());
          assert(await page.locator('main p').count()>15);
        } finally { await page.close(); }
      }
    });
    await check('CSS disabled still commits tabs, and hidden-page cleanup leaves no inert panel', async () => {
      const page = await newPage();
      try {
        await page.goto(base+'/terminal/');
        await page.evaluate(() => {
          [...document.styleSheets].find(sheet => sheet.href?.includes('/shared/motion.css')).disabled=true;
          document.getElementById('catalog-tab').click();
        });
        await page.waitForFunction(() => !document.getElementById('catalog').hidden, null, {timeout:1000});
        await page.evaluate(() => {
          [...document.styleSheets].find(sheet => sheet.href?.includes('/shared/motion.css')).disabled=false;
          document.getElementById('explorer-tab').click();
          window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true}));
        });
        assert.equal(await page.locator('.tab-view-exit,[role=tabpanel][inert]').count(),0);
        assert(await page.locator('#explorer').isVisible());
      } finally { await page.close(); }
    });
    await check('selection portrait uses finite CSS animation and releases it after rapid changes', async () => {
      const page = await newPage();
      try {
        await page.goto(base+'/terminal/');
        const animation = await page.evaluate(() => {
          ['mars','venus','jupiter'].forEach(id => document.querySelector('[data-select='+id+']').click());
          return getComputedStyle(document.getElementById('portrait-image')).animationName;
        });
        assert.equal(animation,'selection-arrive','CSS selection animation overrides the portrait base style');
        await page.waitForTimeout(500);
        assert.equal(await page.locator('#portrait-image.selection-arrive').count(),0);
        assert.equal(await page.locator('#portrait-image').evaluate(element => element.getAnimations().filter(a=>a.playState==='running').length),0);
      } finally { await page.close(); }
    });
    assert.deepEqual(errors,[]);
    fs.writeFileSync(path.join(output,'ui-results.json'),JSON.stringify(results,null,2));
    if(results.some(result => !result.passed)) process.exitCode=1;
  } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode=1; server.close(); });
