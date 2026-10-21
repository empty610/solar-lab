const {siteRoot,browserChannel}=require('../support/runtime.cjs');
const {chromium}=require('playwright');
const assert=require('node:assert/strict'),path=require('node:path');
const {pathToFileURL}=require('node:url');
(async()=>{
 const {createPreviewServer}=await import('../../scripts/preview.mjs');
 const server=createPreviewServer(siteRoot);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({channel:browserChannel,headless:true,args:['--enable-unsafe-swiftshader']});
 const errors=[];
 const watch=page=>page.on('pageerror',e=>errors.push(e.message));
 try{
  const mars=await browser.newPage({viewport:{width:1366,height:900},reducedMotion:'reduce'}),requests=[];
  watch(mars);
  mars.on('request',r=>requests.push(r.url()));
  await mars.goto(base+'/mars/#pioneer');
  assert(await mars.locator('#pioneer-panel').isVisible());
  assert(!requests.some(url=>url.endsWith('/mars-texture.jpg')),'history entry does not download hidden map/fallback texture');
  assert(!requests.some(url=>url.includes('/vendor/three')),'history entry does not download model library');
  assert(!requests.some(url=>url.endsWith('/milky-way-2mass.jpg')),'history entry defers screen-distant sky background');
  await mars.locator('#model-tab').click();await mars.waitForFunction(()=>window.MarsModelView?.loaded);
  assert(requests.some(url=>url.endsWith('/mars-texture.jpg')),'visible model prepares original texture');
  await mars.locator('#rovers-tab').click();await mars.locator('.world-texture').scrollIntoViewIfNeeded();
  await mars.locator('.world-texture').evaluate(img=>img.decode());
  await mars.locator('#world-expand').click();await mars.locator('#world-map-dialog .world-texture').evaluate(img=>img.decode());
  await mars.keyboard.press('Escape');await mars.close();
  console.log('PASS: Mars history skips hidden texture; model, rover map and enlarged map still load');

  for(const name of ['mars','venus'])for(const setting of ['online','offline','nojs']){
   const offline=setting==='offline',nojs=setting==='nojs';
   const page=await browser.newPage({viewport:{width:1366,height:900},reducedMotion:'reduce',javaScriptEnabled:!nojs}),images=[];
   watch(page);
   page.on('request',r=>{if(r.url().endsWith('/milky-way-2mass.jpg'))images.push(r.url());});
   await page.goto(offline?pathToFileURL(path.join(siteRoot,name,'index.html')).href:base+'/'+name+'/');
   if(!nojs)assert.equal(images.length,0,name+' initial view defers sky background');
   await page.locator('.sky-stage').scrollIntoViewIfNeeded();await page.locator('.sky-background').evaluate(img=>img.decode());
   assert.equal(images.length,1,name+' visible sky loads original background');
   const layout=await page.locator('.sky-stage').evaluate(e=>{const r=e.getBoundingClientRect(),i=e.querySelector('img').getBoundingClientRect();return {width:Math.abs(r.width-i.width),height:Math.abs(r.height-i.height),overlay:getComputedStyle(e,'::before').backgroundImage};});
   assert(layout.width<=2&&layout.height<=2&&layout.overlay.includes('linear-gradient'),'sky retains full-size image and gradient overlay');
   if(setting==='online')await page.locator('.sky-stage').screenshot({path:path.join(__dirname,'../../.qa/loading-media-'+name+'.png')});
   await page.close();
  }
  console.log('PASS: Mars/Venus sky backgrounds load on approach and preserve layout online and offline');

  for(const settings of [{},{javaScriptEnabled:false},{offline:true},{viewport:{width:390,height:844}}]){
   const {offline,...options}=settings;
   const page=await browser.newPage({viewport:{width:1366,height:900},reducedMotion:'reduce',...options}),images=[];
   watch(page);
   page.on('request',r=>{if(/\/assets\/(?:pluto|charon)\.png$/.test(r.url()))images.push(r.url());});
   await page.goto(offline?pathToFileURL(path.join(siteRoot,'pluto/index.html')).href:base+'/pluto/');
   if(options.javaScriptEnabled!==false)assert.equal(images.length,0,'initial Pluto skips screen-distant binary PNGs: '+JSON.stringify(settings));
   await page.locator('#binary-svg').scrollIntoViewIfNeeded();
   await page.waitForFunction(()=>[...document.querySelectorAll('#binary-svg img')].every(img=>img.complete&&img.naturalWidth>0));
   assert.equal(images.length,2,'both original disks load when binary diagram approaches');
   assert(await page.locator('#binary-pluto, #binary-charon').evaluateAll(groups=>groups.every(g=>g.getAttribute('transform')?.startsWith('translate('))),'both bodies retain their orbit positions');
   assert(await page.locator('#binary-svg img').evaluateAll(imgs=>imgs.every(img=>Math.abs(img.getBoundingClientRect().width-img.getBoundingClientRect().height)<1)),'disks remain square');
   if(options.javaScriptEnabled!==false){
    await page.locator('#binary-phase').evaluate(slider=>{slider.value='90';slider.dispatchEvent(new Event('input',{bubbles:true}));});
    const quarter=await page.evaluate(()=>({phase:PlutoBinary.state.phase,positions:['binary-pluto','binary-charon'].map(id=>{const g=document.getElementById(id),m=g.transform.baseVal.consolidate().matrix;return [m.e,m.f,g.querySelector('foreignObject').getAttribute('transform')];})}));
    assert.equal(quarter.phase,90);assert.deepEqual(quarter.positions,[[325,255,'rotate(90)'],[325,531,'rotate(90)']],'quarter orbit keeps positions and tidal orientation');
    await page.locator('#binary-reset').evaluate(button=>button.click());
   }
   assert(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)),'binary diagram fits viewport');
   if(!offline&&options.javaScriptEnabled!==false&&!options.viewport)await page.locator('#binary-svg').screenshot({path:path.join(__dirname,'../../.qa/loading-media-pluto.png')});
   await page.close();
  }
  console.log('PASS: original binary disks defer and render on desktop, mobile, file URLs and without JavaScript');
  const failed=await browser.newPage({reducedMotion:'reduce'});
  watch(failed);
  await failed.route('**/vendor/three*.js*',route=>route.abort());await failed.goto(base+'/mars/');
  await failed.locator('.planet-fallback').waitFor({state:'visible'});await failed.locator('.planet-fallback img').evaluate(img=>img.decode());
  await failed.close();console.log('PASS: model failure still displays the original Mars fallback image');
  assert.deepEqual(errors,[],'no diagram or loading errors');
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
