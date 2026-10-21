const {siteRoot,browserChannel}=require('../support/runtime.cjs');
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const headers=fs.readFileSync(path.join(siteRoot,'_headers'),'utf8');
const rules=[...headers.matchAll(/^(\/\S*)\n\s+Cache-Control: ([^\n]+)/gm)].map(([,url,value])=>({
  pattern:new RegExp('^'+url.replace(/[.+?^${}()|[\]\\]/g,'\\$&').replaceAll('*','.*')+'$'),value,
}));
assert(rules.length<=100,'Pages header rule limit');
const requests=[];
const server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const file=path.resolve(siteRoot,'.'+pathname+(pathname.endsWith('/')?'index.html':''));
  if(!file.startsWith(siteRoot+path.sep)||!fs.existsSync(file))return res.writeHead(404).end();
  requests.push(pathname);
  const matched=rules.filter(rule=>rule.pattern.test(pathname));
  assert(matched.length<=1,'no overlapping cache rules: '+pathname);
  const type={'.html':'text/html','.js':'text/javascript','.css':'text/css','.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'}[path.extname(file)]||'application/octet-stream';
  res.writeHead(200,{'Content-Type':type,'Cache-Control':matched[0]?.value||'public, max-age=14400'});
  fs.createReadStream(file).pipe(res);
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({channel:browserChannel,headless:true,args:['--enable-unsafe-swiftshader']});
 try{
  const mars=await browser.newPage({reducedMotion:'reduce'}),marsRequests=[];
  mars.on('request',request=>marsRequests.push(request.url()));
  await mars.goto(base+'/mars/');
  await mars.waitForFunction(()=>MarsModelView.loaded);
  assert(!marsRequests.some(url=>/\/rovers\//.test(url)),'hidden rover panel downloads no photos');
  assert(!marsRequests.some(url=>/mars-texture\.js/.test(url)),'HTTP does not load embedded texture');
  assert.equal(marsRequests.filter(url=>url.endsWith('/mars-texture.jpg')).length,1,'map and model share one JPG request');
  await mars.locator('#rovers-tab').click();
  for(const id of ['concept','route','surface']){
   await mars.locator('#rover-'+id+'-image').scrollIntoViewIfNeeded();
   await mars.waitForFunction(id=>{const img=document.getElementById('rover-'+id+'-image');return img.complete&&img.naturalWidth>0;},id);
  }
  await mars.goto(base+'/mars/#rovers/curiosity');
  assert(await mars.locator('#rover-panel').isVisible(),'rover deep link selects the visible panel');
  await mars.locator('#rover-route-image').scrollIntoViewIfNeeded();
  await mars.waitForFunction(()=>{const img=document.getElementById('rover-route-image');return img.complete&&img.naturalWidth>0&&/curiosity/.test(img.src);});
  await mars.locator('#world-expand').click();
  await mars.locator('#world-map-dialog[open]').waitFor();
  await mars.keyboard.press('Escape');
  await mars.close();
  console.log('PASS: hidden rover images defer; tab, deep link and map still load; Mars JPG is reused');

  const jupiter=await browser.newPage({reducedMotion:'reduce'}),jupiterRequests=[];
  jupiter.on('request',request=>jupiterRequests.push(request.url()));
  await jupiter.goto(base+'/jupiter/');
  await jupiter.waitForFunction(()=>JupiterView.ready);
  assert(!jupiterRequests.some(url=>/\/assets\/textures\.js/.test(url)),'online Jupiter skips the embedded bundle');
  const moons=()=>jupiterRequests.filter(url=>/\/assets\/(?:io|europa|ganymede|callisto)\.jpg/.test(url));
  assert.equal(moons().length,0,'initial view does not load any moon texture');
  await Promise.all([
   jupiter.waitForResponse(response=>response.url().endsWith('/assets/io.jpg')),
   jupiter.locator('[data-view="io"]').first().click(),
  ]);
  assert.equal(moons().length,1,'close-up loads only one moon');
  await jupiter.locator('[data-view="system"]').first().click();
  await jupiter.waitForFunction(()=>performance.getEntriesByType('resource').filter(e=>/\/assets\/(?:io|europa|ganymede|callisto)\.jpg/.test(e.name)).length===4);
  await jupiter.locator('[data-view="io"]').first().click();
  await jupiter.locator('[data-view="system"]').first().click();
  assert.equal(moons().length,4,'system view loads each remaining texture once');
  await jupiter.close();
  console.log('PASS: Jupiter moon textures load only when selected and are reused');

  for(const name of ['mercury','venus','mars','jupiter','saturn','uranus','neptune','europa','pluto']){
   const page=await browser.newPage({viewport:{width:1366,height:900},reducedMotion:'reduce'});
   await page.goto(base+'/'+name+'/');
   const card=page.locator('img[srcset]:visible').first();await card.scrollIntoViewIfNeeded();
   await card.evaluate(img=>img.decode());
   assert((await card.evaluate(img=>img.currentSrc)).endsWith('.webp'),name+' card selects preview');
   const preview=await card.evaluate(img=>({width:img.getBoundingClientRect().width,source:Number(img.currentSrc.match(/-(\d+)\.webp$/)?.[1])}));
   assert(preview.source>=Math.min(960,preview.width)-1,name+' preview matches the actual card width');
   const button=card.locator('xpath=ancestor::*[self::button or @data-image-full][1]');
   await button.click();
   const dialog=page.locator('dialog[open]');await dialog.waitFor();
   const image=dialog.locator('img').first();await image.evaluate(img=>img.decode());
   assert(!(await image.evaluate(img=>img.currentSrc)).includes('/previews/'),name+' dialog retains original');
   if(['mars','venus','uranus'].includes(name))await page.screenshot({path:path.join(__dirname,'../../.qa/card-preview-'+name+'.png')});
   await page.keyboard.press('Escape');
   await page.close();
  }
  console.log('PASS: all nine archives use WebP cards and original full-size dialog images');

  const context=await browser.newContext({reducedMotion:'reduce'}),page=await context.newPage();
  requests.length=0;
  await page.goto(base+'/mercury/');await page.waitForFunction(()=>document.getElementById('model-loading').hidden);
  const vendor=await page.locator('template[data-model-target]').evaluate(t=>t.content.querySelector('script[src*="three.min.js"]').getAttribute('src'));
  const vendorPath=new URL(vendor,base+'/mercury/').pathname;
  assert.equal((await page.request.get(base+vendorPath)).headers()['cache-control'],'public, max-age=31536000, immutable');
  const before=requests.filter(url=>url===vendorPath).length;
  await page.goto(base+'/jupiter/');await page.waitForFunction(()=>JupiterView.ready);
  assert.equal(requests.filter(url=>url===vendorPath).length,before,'second archive reuses cached common Three.js');
  await page.goto(base+'/terminal/');requests.length=0;
  const preparation=new Promise(resolve=>server.on('request',function listener(req){if(req.url==='/saturn/index.html'){server.off('request',listener);resolve();}}));
  const preparedStyle=page.waitForResponse(response=>new URL(response.url()).pathname.endsWith('/saturn/style.css'));
  await page.locator('#enter-link').click();await preparation;
  await preparedStyle;
  assert(new URL(page.url()).pathname==='/terminal/','destination fetch starts during the transition');
  assert(!requests.some(url=>url.endsWith('/saturn/model.js')),'transition prefetch excludes the model template');
  await page.waitForURL('**/saturn/index.html');
  await page.waitForFunction(()=>document.getElementById('model-loading').hidden);
  await context.close();
  console.log('PASS: immutable shared library is reused across archives; destination preparation starts during the transition');

  const late=await browser.newPage({reducedMotion:'reduce'}),errors=[];
  late.on('pageerror',error=>errors.push(error.message));
  await late.addInitScript(()=>{const timer=window.setTimeout;window.setTimeout=(fn,delay,...args)=>timer(fn,delay===30000?1500:delay,...args);});
  let release;const gate=new Promise(resolve=>{release=resolve;});
  await late.route('**/venus/model.js*',async route=>{await gate;await route.continue();});
  await late.goto(base+'/venus/',{waitUntil:'domcontentloaded'});
  await late.waitForFunction(()=>document.getElementById('venus-stage').dataset.modelLoad==='error');
  release();await late.waitForTimeout(250);
  // Explicitly execute the late entry as well: removing a pending script alone
  // must never be the only protection against a browser's delayed completion.
  const main=await late.locator('template[data-model-target]').evaluate(t=>t.content.querySelector('script[src*="/venus/model.js"]').getAttribute('src'));
  await late.addScriptTag({url:new URL(main,late.url()).href});
  assert.equal(await late.locator('#venus-3d canvas').count(),0,'late entry does not initialize after timeout');
  assert.deepEqual(errors,[]);
  await late.close();
  console.log('PASS: script timeout reveals fallback and late entry cannot initialize a failed model');
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
