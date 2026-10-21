const { siteRoot, browserChannel } = require('../support/runtime.cjs');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = siteRoot;
const output = path.resolve(__dirname, '../../.qa');
fs.mkdirSync(output, { recursive:true });
const oldApp = fs.readFileSync(path.resolve(__dirname, '../fixtures/legacy-terminal-app.js'), 'utf8');
let legacy = true;
let unversionedHTML = false;
const requests = [];
const types = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.mp3':'audio/mpeg'};
const server = http.createServer((req,res) => {
  const url = new URL(req.url,'http://localhost');
  requests.push(url.pathname+url.search);
  let file = path.resolve(root,'.'+url.pathname);
  if (file !== root && !file.startsWith(root+path.sep)) return res.writeHead(400).end();
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file=path.join(file,'index.html');
  if (!fs.existsSync(file)) return res.writeHead(404).end();
  let data=fs.readFileSync(file);
  if(url.pathname==='/terminal/app.js' && legacy)data=Buffer.from(oldApp);
  if(file.endsWith(path.join('terminal','index.html')) && (legacy || unversionedHTML)) {
    data=Buffer.from(data.toString('utf8')
      .replace(/(src|href)="\.\.\/shared\/cache\/[a-f0-9]{12}\/([^"?]+\.(?:js|css))\?[^" ]*"/g,
        (_, attribute, source) => attribute + '="' + path.posix.relative('terminal', source) + '"')
      .replace(/(src|href)="([^"?#]+\.(?:js|css))\?[^" ]*"/g,'$1="$2"'));
  }
  res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':file.endsWith('.html')?'public, max-age=0, must-revalidate':'public, max-age=14400, must-revalidate'});
  res.end(data);
});
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const live=process.argv.includes('--live');
  const base=live?'https://solar.empty610.com':'http://127.0.0.1:'+server.address().port;
  const browser=await chromium.launch({channel:browserChannel,headless:true,args:['--enable-unsafe-swiftshader']});
  try {
    for (const width of [1440,390]) {
      const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
      try {
        const page=await context.newPage();
        page.setDefaultNavigationTimeout(live ? 60000 : 30000);
        const errors=[];
        page.on('pageerror',e=>errors.push(e.message));
        page.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400)errors.push(r.status()+' '+r.url());});
        if(!live) {
          legacy=true;
          await page.goto(base+'/terminal/', {waitUntil:'domcontentloaded'});
          assert(await page.locator('.body-point[data-select="uranus"]').evaluate(e=>e.classList.contains('unavailable')),'legacy script was cached');
          await page.locator('.body-point[data-select="uranus"]').evaluate(e=>e.click());
          assert(await page.locator('#enter-link').isHidden());
          legacy=false;
          unversionedHTML=true;
          await page.goto(base+'/terminal/', {waitUntil:'domcontentloaded'});
          assert(await page.locator('.body-point[data-select="uranus"]').evaluate(e=>e.classList.contains('unavailable')), 'unchanged script URL keeps the fresh legacy cache even after the server upgrades');
          console.log('REPRODUCED: '+width+'px, unchanged script URL keeps Uranus unavailable after server upgrade');
          unversionedHTML=false;
          requests.length=0;
        }
        await page.goto(base+'/terminal/', {waitUntil:'domcontentloaded'});
        const appURL=await page.locator('script[src*="/terminal/app.js"]').getAttribute('src');
        assert.match(appURL,/\/cache\/[a-f0-9]{12}\/terminal\/app\.js\?v=[a-f0-9]{12}$/,'Terminal requests a content-addressed app');
        assert(await page.locator('.body-point[data-select="uranus"]').evaluate(e=>!e.classList.contains('unavailable')));
        await page.locator('.body-point[data-select="uranus"]').evaluate(e=>e.click());
        assert.equal(await page.locator('#destination-name').textContent(),'天王星');
        assert.equal(await page.locator('#enter-link').getAttribute('href'),'../uranus/index.html');
        assert(await page.locator('#enter-link').isVisible());
        assert(await page.locator('#unavailable-note').isHidden());
        await page.locator('#enter-link').click();
        await page.waitForURL(/\/uranus\/(?:index\.html)?$/);
        await page.waitForFunction(()=>window.UranusView?.ready);
        await page.locator('#archive-back').evaluate(e=>e.click());
        await page.waitForURL(/\/terminal\/(?:index\.html)?$/);
        await page.locator('#catalog-tab').click();
        const direct=page.locator('.card-entry[data-open="uranus"]');
        assert.equal(await direct.count(),1);
        await direct.click();
        await page.waitForURL(/\/uranus\/(?:index\.html)?$/);
        await page.goBack();
        await page.locator('.planet-card[data-select="uranus"]').focus();
        await page.keyboard.press('Enter');
        await page.waitForFunction(()=>!document.querySelector('#explorer').hidden);
        assert.equal(await page.locator('#enter-link').getAttribute('href'),'../uranus/index.html');
        assert.equal(await page.locator('#dock-enter').getAttribute('href'),'../uranus/index.html');
        await page.screenshot({path:path.join(output,'uranus-entry-'+(live?'live-':'cache-')+width+'.png'),fullPage:true});
        if(!live){const fetched=new URL(appURL,base+'/terminal/');assert(requests.includes(fetched.pathname+fetched.search),'new script URL was fetched despite an old fresh cache entry');}
        assert.deepEqual(errors,[]);
        console.log('PASS: '+width+'px, '+(live?'live entries':'upgrade from cached unavailable Uranus')+', star map, catalog, keyboard, dock and Uranus model');
      } finally {await context.close();}
    }
    const nojs=await browser.newPage({javaScriptEnabled:false});
    await nojs.goto(base+'/terminal/');
    await nojs.locator('.no-script a[href="../uranus/index.html"]').click();
    await nojs.waitForURL(/\/uranus\/(?:index\.html)?$/);
    await nojs.close();
    console.log('PASS: no-JavaScript Uranus entry');
  } finally {await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
