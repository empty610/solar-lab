const {siteRoot, browserChannel} = require('../support/runtime.cjs');
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const targets = [['saturn','titan',['titan','enceladus']], ['neptune','triton',['triton']]];
async function instrument(page) {
  await page.route('**/vendor/three*.js*', async route => {
    const response = await route.fetch();
    const hook = `;(() => {const Original=THREE.WebGLRenderer;THREE.WebGLRenderer=new Proxy(Original,{construct(target,args){const r=Reflect.construct(target,args),render=r.render;r.render=function(scene,camera){window.targetScene=scene;window.targetCamera=camera;return render.call(this,scene,camera);};return r;}});})();`;
    await route.fulfill({response, body:await response.text()+hook});
  });
}
const meshCount = page => page.evaluate(() => {let count=0;targetScene.traverse(o=>{if(o.isMesh)count++;});return count;});
(async () => {
  const {createPreviewServer} = await import('../../scripts/preview.mjs');
  const server = createPreviewServer(siteRoot);
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  const base = 'http://127.0.0.1:'+server.address().port;
  const browser = await chromium.launch({channel:browserChannel,headless:true,args:['--enable-unsafe-swiftshader']});
  try {
    for (const [name,moon,allMoons] of targets) {
      const page=await browser.newPage({reducedMotion:'reduce'}), requests=[], errors=[];
      page.on('request',r=>requests.push(r.url()));page.on('pageerror',e=>errors.push(e.message));
      await instrument(page);
      await page.goto(base+'/'+name+'/');
      await page.waitForFunction(()=>document.getElementById('model-loading').hidden);
      const initial=await meshCount(page);
      assert(!requests.some(url=>allMoons.some(id=>url.includes('/'+id+'-model.js'))),'no initial moon data');
      assert.deepEqual(await page.evaluate(name=>Object.keys(window[name.toUpperCase()+'_MODELS']),name),[name]);
      let release,requested;
      const gate=new Promise(resolve=>{release=resolve;}),waiting=new Promise(resolve=>{requested=resolve;});
      await page.route('**/'+moon+'-model.js*',async route=>{requested();await gate;await route.continue();});
      await page.locator('[data-view="'+moon+'"]').first().click();await waiting;
      await page.locator('[data-view="'+name+'"]').first().click();
      await page.waitForFunction(name=>document.querySelector('[data-view="'+name+'"]').getAttribute('aria-pressed')==='true',name);
      release();
      await page.waitForFunction(initial=>{let n=0;targetScene.traverse(o=>{if(o.isMesh)n++;});return n>initial;},initial);
      assert.equal(await page.locator('[data-view="'+name+'"]').getAttribute('aria-pressed'),'true','late data cannot change selection');
      await page.locator('[data-view="system"]').first().click();
      await page.waitForFunction(expected=>{let n=0;targetScene.traverse(o=>{if(o.isMesh)n++;});return n===expected;},initial+allMoons.length);
      await page.locator('[data-view="'+moon+'"]').first().click();
      await page.locator('[data-view="system"]').first().click();
      for(const id of allMoons)assert.equal(requests.filter(url=>url.includes('/'+id+'-model.js')).length,1,id+' detail loaded once');
      await page.screenshot({path:path.join(__dirname,'../../.qa/target-'+name+'.png')});
      assert.deepEqual(errors,[]);await page.close();
      console.log('PASS: '+name+': no initial satellite meshes/data; selected targets load once; late data preserves selection');

      for(const mode of ['late','error']) {
        const failed=await browser.newPage({reducedMotion:'reduce'}),errors=[];
        failed.on('pageerror',e=>errors.push(e.message));await instrument(failed);
        await failed.goto(base+'/'+name+'/');
        await failed.waitForFunction(()=>document.getElementById('model-loading').hidden);
        let release,requested;
        const gate=new Promise(resolve=>{release=resolve;}),waiting=new Promise(resolve=>{requested=resolve;});
        await failed.route('**/'+moon+'-model.js*',async route=>{requested();if(mode==='error')await route.abort();else{await gate;await route.continue();}});
        await failed.locator('[data-view="'+moon+'"]').first().click();await waiting;
        if(mode==='late') {
          await failed.locator('#model-mount canvas').evaluate(canvas=>canvas.dispatchEvent(new Event('webglcontextlost',{cancelable:true})));
          const count=await meshCount(failed);release();
          await failed.waitForFunction(({name,moon})=>!!window[name.toUpperCase()+'_MODELS'][moon],{name,moon});
          await failed.waitForTimeout(200);assert.equal(await meshCount(failed),count,'late data cannot create meshes after failure');
        }
        await failed.locator('#model-fallback').waitFor({state:'visible'});
        assert.deepEqual(errors,[]);await failed.close();
        console.log('PASS: '+name+': '+mode+' detail failure preserves fallback');
      }
    }
    const europa=await browser.newPage({reducedMotion:'reduce'}),requests=[];
    europa.on('request',r=>requests.push(r.url()));
    await instrument(europa);
    await europa.goto(base+'/europa/');await europa.waitForFunction(()=>EuropaView.ready);
    assert(!requests.some(url=>url.includes('/assets/textures.js')),'online Europa skips embedded pair');
    assert(!requests.some(url=>url.includes('/assets/jupiter.jpg')),'online Europa skips unselected Jupiter');
    await Promise.all([
      europa.waitForResponse(response=>response.url().endsWith('/assets/jupiter.jpg')),
      europa.evaluate(() => {
        const moon=targetScene.children.find(o=>o.isMesh&&o.geometry.type==='SphereGeometry');
        const distance=targetCamera.position.distanceTo(moon.position);
        targetCamera.position.copy(moon.position).addScaledVector(moon.position.clone().normalize(),distance);
        document.getElementById('model-stage').click();
      }),
    ]);
    assert.equal(await europa.evaluate(()=>EuropaView.selected),'europa','visible companion loads without changing selected view');
    await europa.locator('[data-view="system"]').first().click();
    await europa.locator('[data-view="jupiter"]').first().click();
    assert.equal(requests.filter(url=>url.endsWith('/assets/jupiter.jpg')).length,1,'Jupiter JPG reused');
    await europa.close();console.log('PASS: Europa loads needed original JPGs, including companions entering the camera, and reuses them');
    for(const [name,moon] of [...targets,['europa','jupiter']]) {
      const offline=await browser.newPage({reducedMotion:'reduce'}),errors=[];
      offline.on('pageerror',e=>errors.push(e.message));
      await offline.goto(pathToFileURL(path.join(siteRoot,name,'index.html')).href);
      await offline.waitForFunction(()=>document.getElementById('model-loading').hidden);
      await offline.locator('[data-view="'+moon+'"]').first().click();
      if(name!=='europa')await offline.waitForFunction(({name,moon})=>!!window[name.toUpperCase()+'_MODELS'][moon],{name,moon});
      await offline.waitForTimeout(300);
      assert(await offline.locator('#model-fallback').isHidden());assert.deepEqual(errors,[]);
      await offline.close();
    }
    console.log('PASS: Saturn/Neptune detail scripts and Europa embedded textures remain usable on file URLs');
  } finally {await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
