const {siteRoot, browserChannel} = require('../support/runtime.cjs');
const {chromium} = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const pages = ['mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'europa', 'pluto'];
const stageId = name => name === 'mercury' ? 'planet-stage' : ['venus','mars'].includes(name) ? name + '-stage' : 'model-stage';
(async () => {
  const {createPreviewServer} = await import('../../scripts/preview.mjs');
  const server = createPreviewServer(siteRoot);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({channel:browserChannel, headless:true, args:['--enable-unsafe-swiftshader']});
  try {
    for (const name of pages) {
      const page = await browser.newPage({reducedMotion:'reduce'}), requests = [], errors = [];
      page.on('request', request => requests.push(request.url()));
      page.on('pageerror', error => errors.push(error.message));
      const id = stageId(name);
      await page.route('**/' + name + '/index.html', route => route.fulfill({contentType:'text/html', body:
        fs.readFileSync(path.join(siteRoot, name, 'index.html'), 'utf8').replace('id="' + id + '"', 'id="' + id + '" style="display:none"')}));
      await page.goto(base + '/' + name + '/index.html', {waitUntil:'domcontentloaded'});
      const dependencies = await page.locator('template[data-model-target]').evaluate(template =>
        [...template.content.querySelectorAll('script[src]:not([data-file-only])')].map(script => new URL(script.getAttribute('src'), document.baseURI).href));
      await page.waitForTimeout(250);
      assert(requests.every(url => !dependencies.includes(url)), name + ': hidden model downloads nothing');
      assert(await page.locator('#archive-back').count(), name + ': navigation initializes without model dependencies');
      // Basic reading and image dialogs are usable before the first model request.
      const photo = page.locator('[data-photo], button[data-terrain], [data-image-full]').first();
      await photo.evaluate(button => button.click());
      await page.locator('dialog[open]').waitFor({state:'visible'});
      await page.keyboard.press('Escape');
      await page.locator('dialog[open]').waitFor({state:'hidden'});
      await page.locator('#' + id).evaluate(stage => { stage.style.removeProperty('display'); stage.scrollIntoView(); });
      await page.waitForFunction(id => document.getElementById(id).dataset.modelLoad === 'loaded', id);
      await page.waitForFunction(name => {
        if (name === 'mars') return window.MarsModelView?.loaded;
        if (name === 'venus') return !!document.querySelector('#venus-3d canvas');
        return document.getElementById('model-loading').hidden;
      }, name);
      await page.locator('#' + id).evaluate(stage => stage.scrollIntoView());
      await page.waitForTimeout(200);
      for (const dependency of dependencies) assert.equal(requests.filter(url => url === dependency).length, 1, name + ': dependency loads once');
      assert.deepEqual(errors, [], name + ': no initialization errors');
      console.log('PASS: ' + name + ': no hidden model downloads; reading works first; visible model loads once');
      await page.close();
    }
    for (const name of pages) {
      const page = await browser.newPage({reducedMotion:'reduce'}), errors=[];
      page.on('pageerror', error => errors.push(error.message));
      await page.route('**/vendor/three*.js*', route => route.abort());
      await page.goto(base + '/' + name + '/index.html', {waitUntil:'domcontentloaded'});
      await page.locator('#' + stageId(name)).scrollIntoViewIfNeeded();
      await page.waitForFunction(id => document.getElementById(id).dataset.modelLoad === 'error', stageId(name));
      const fallback=page.locator('#model-fallback, #model-error, .planet-fallback').first();
      assert(await fallback.isVisible(), name + ': dependency failure shows existing fallback');
      assert.deepEqual(errors, [], name + ': dependency failure has no uncaught errors');
      console.log('PASS: ' + name + ': model dependency failure preserves the document');
      await page.close();
    }
    const delayed=await browser.newPage({reducedMotion:'reduce'});
    let release, requested;
    const held = new Promise(resolve=>{release=resolve;});
    const waiting = new Promise(resolve=>{requested=resolve;});
    await delayed.route('**/jupiter/assets/jupiter-geometry.js*',async route=>{requested();await held;await route.continue();});
    await delayed.goto(base+'/jupiter/',{waitUntil:'domcontentloaded'});
    await waiting;
    await delayed.locator('[data-focus="io"]').first().evaluate(button=>button.click());
    release();
    await delayed.waitForFunction(()=>document.getElementById('model-loading').hidden);
    await delayed.waitForFunction(()=>document.querySelector('[data-view="io"]').getAttribute('aria-pressed')==='true');
    assert.equal(await delayed.locator('#profile-heading').textContent(), await delayed.evaluate(()=>Jovian.bodies.io.heading.replace(/<[^>]*>/g,'')));
    await delayed.close();
    console.log('PASS: a target selected during model download survives initialization');
    const mars=await browser.newPage({reducedMotion:'reduce'}), moonRequests=[];
    mars.on('request',request=>{if(/\/moons\/(?:phobos|deimos)\.js/.test(request.url()))moonRequests.push(request.url());});
    await mars.goto(base+'/mars/');
    await mars.waitForFunction(()=>window.MarsMoons && MarsModelView.loaded);
    assert.equal(moonRequests.length,0,'Mars panorama does not download detailed moon assets');
    await mars.evaluate(()=>MarsMoons.focus('phobos'));
    await mars.waitForFunction(()=>MarsMoons.bodies.phobos.textureLoaded);
    assert.equal(moonRequests.length,1,'only the selected moon loads');
    await mars.evaluate(()=>{MarsMoons.focus('deimos');MarsMoons.focus('system');});
    await mars.waitForFunction(()=>MarsMoons.bodies.deimos.textureLoaded);
    assert.equal(await mars.evaluate(()=>MarsMoons.selected),'system','late detail cannot change the selected view');
    await mars.evaluate(()=>MarsMoons.focus('phobos'));
    assert.equal(moonRequests.length,2,'each moon detail loads once across view switches');
    assert(await mars.evaluate(()=>['phobos','deimos'].every(id=>MarsMoons.bodies[id].mesh.geometry.attributes.position.count===atob(MARS_MOON_DETAILS[id].position.data).length/4/3)),'close-ups use the original mesh');
    await mars.waitForTimeout(150);
    await mars.screenshot({path:path.join(__dirname,'../../.qa/mars-phobos-lazy.png')});
    await mars.close();
    const late=await browser.newPage({reducedMotion:'reduce'});
    let releaseMoon, moonRequested;
    const heldMoon=new Promise(resolve=>{releaseMoon=resolve;});
    const waitingMoon=new Promise(resolve=>{moonRequested=resolve;});
    await late.route('**/mars/assets/moons/phobos.js*',async route=>{moonRequested();await heldMoon;await route.continue();});
    await late.goto(base+'/mars/');
    await late.waitForFunction(()=>window.MarsMoons && MarsModelView.loaded);
    await late.evaluate(()=>MarsMoons.focus('phobos'));
    await waitingMoon;
    const geometry=await late.evaluate(()=>MarsMoons.bodies.phobos.mesh.geometry.uuid);
    await late.locator('#mars-3d canvas').evaluate(canvas=>canvas.dispatchEvent(new Event('webglcontextlost',{cancelable:true})));
    releaseMoon();
    await late.evaluate(()=>MarsMoons.bodies.phobos.detailsPromise);
    assert.equal(await late.evaluate(()=>MarsMoons.bodies.phobos.mesh.geometry.uuid),geometry,'late moon data cannot rebuild a failed model');
    assert.equal(await late.evaluate(()=>MarsModelView.loaded),false);
    await late.close();
    console.log('PASS: moon details load on selection, deduplicate, and cannot revive failed models');
    const terminal=await browser.newPage(), images=[];
    terminal.on('response', response => {if(response.request().resourceType()==='image')images.push(response);});
    await terminal.goto(base + '/terminal/');
    await terminal.waitForFunction(() => window.SolarAtlasLabels);
    await terminal.evaluate(() => Promise.all([...document.images].filter(img => img.src).map(img => img.decode().catch(()=>{}))));
    assert(images.every(response => !new URL(response.url()).pathname.endsWith('.png')), 'Terminal uses optimized previews');
    const imageBytes=(await Promise.all(images.map(async response => (await response.body()).length))).reduce((a,b)=>a+b,0);
    assert(imageBytes < 100000, 'Terminal first image payload stays below 100 KB: ' + imageBytes);
    await terminal.screenshot({path:path.join(__dirname,'../../.qa/terminal-previews-desktop.png')});
    await terminal.setViewportSize({width:390,height:844});
    await terminal.screenshot({path:path.join(__dirname,'../../.qa/terminal-previews-mobile.png')});
    console.log('PASS: Terminal first image payload ' + imageBytes + ' bytes');
    await terminal.close();
    const venus=await browser.newPage({reducedMotion:'reduce'});
    await venus.route('**/shared/vendor/three.min.js*',async route=>{
      const response=await route.fetch();
      await route.fulfill({response,body:await response.text()+`;(() => { const Original=THREE.WebGLRenderer; THREE.WebGLRenderer=new Proxy(Original,{construct(target,args){const renderer=Reflect.construct(target,args),render=renderer.render;renderer.render=function(scene,camera){window.__venusCamera=camera;return render.call(this,scene,camera);};return renderer;}}); })();`});
    });
    await venus.goto(base+'/venus/');
    await venus.waitForFunction(()=>window.__venusCamera);
    for(const width of [1366,768,390,320]){
      await venus.setViewportSize({width,height:900});
      await venus.locator('#venus-stage').scrollIntoViewIfNeeded();
      await venus.waitForTimeout(200);
      const fit=await venus.evaluate(()=>{const c=__venusCamera,ratio=1.47/(Math.sqrt(c.position.lengthSq()-1.47**2)*Math.tan(c.fov*Math.PI/360));return {vertical:ratio,horizontal:ratio/c.aspect,direction:c.position.clone().normalize().toArray()};});
      assert(fit.vertical<=.7&&fit.horizontal<=.7,'Venus initial preview fits with breathing room at '+width);
      assert.equal(await venus.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
      if(width===1366||width===390)await venus.screenshot({path:path.join(__dirname,'../../.qa/venus-preview-'+width+'.png')});
    }
    await venus.close();
    console.log('PASS: Venus preview fits desktop and mobile containers');
    const {pathToFileURL}=require('node:url');
    for(const name of ['venus','uranus','mars','jupiter']){
      const offline=await browser.newPage({reducedMotion:'reduce'});
      await offline.goto(pathToFileURL(path.join(siteRoot,name,'index.html')).href);
      await offline.waitForFunction(id=>document.getElementById(id).dataset.modelLoad==='loaded',stageId(name));
      if(name==='uranus')await offline.waitForFunction(()=>UranusView?.ready);
      else if(name==='venus') await offline.waitForFunction(()=>!!document.querySelector('#venus-3d canvas'));
      else if(name==='mars') {
        await offline.waitForFunction(()=>MarsModelView.loaded);
        await offline.locator('#rovers-tab').click();
        const map=offline.locator('.world-texture');await map.scrollIntoViewIfNeeded();
        await map.evaluate(img=>img.decode());
        assert(await map.evaluate(img=>img.complete&&img.naturalWidth>0), 'offline Mars map loads when its panel is shown');
      }
      else await offline.waitForFunction(()=>JupiterView.ready);
      await offline.close();
    }
    console.log('PASS: deferred models still work from local file URLs');
  } finally { await browser.close(); await new Promise(resolve=>server.close(resolve)); }
})().catch(error=>{console.error(error);process.exitCode=1;});
