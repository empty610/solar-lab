const { siteRoot, browserChannel } = require('../support/runtime.cjs');
const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), assert = require('node:assert/strict'), crypto = require('node:crypto');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = siteRoot;
const planets = ['mercury','venus','mars','jupiter','europa','saturn','uranus','neptune','pluto'];
const profiles = {jupiter:['jupiter','profile-description'],europa:['europa','profile-description'],saturn:['saturn','body-copy'],neptune:['neptune','body-copy'],uranus:['planet','view-copy'],pluto:['pluto','profile-copy']};
const mime = {'.html':'text/html','.js':'application/javascript','.css':'text/css'};
const server = http.createServer((req,res) => {
  let file = path.resolve(root, '.' + new URL(req.url,'http://localhost').pathname);
  if (!file.startsWith(root + path.sep)) return res.writeHead(400).end();
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file,'index.html');
  if (!fs.existsSync(file)) return res.writeHead(404).end();
  res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
const normalize = s => s.replace(/\s+/g,'');
(async () => {
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({channel:browserChannel,headless:true,args:['--enable-unsafe-swiftshader']});
  const results = [], errors = [];
  try {
    for (const planet of process.argv.includes('--profiles-only') ? [] : planets) {
      const source = fs.readFileSync(path.join(root,planet,'index.html'),'utf8');
      for (const match of source.matchAll(/(?:src|href)=["']([^"']+\.(?:js|css))(?:\?v=([^"']+))?["']/g)) {
        if (/^(?:assets|vendor)\//.test(match[1]) || /^https?:/.test(match[1])) continue;
        assert.equal(match[2], crypto.createHash('sha256').update(fs.readFileSync(path.resolve(root,planet,match[1]))).digest('hex').slice(0,12), planet + ' content version ' + match[1]);
      }
      for (const width of [1440,390]) {
        const page = await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});
        page.on('pageerror',e => errors.push(planet + ': ' + e.message));
        await page.goto(base + '/' + planet + '/');
        const defaultId = profiles[planet]?.[0];
        if (defaultId) await page.locator(`[data-view="${defaultId}"]`).first().click();
        const expected = await page.evaluate(html => {
          const doc = new DOMParser().parseFromString(html,'text/html');
          return [...doc.querySelectorAll('details')].map(el => ({summary:el.querySelector('summary').textContent,paragraphs:[...el.querySelectorAll('p')].map(p=>p.textContent)}));
        },source);
        const details = page.locator('details');
        assert.equal(await details.count(),expected.length);
        for (let i=0;i<expected.length;i++) {
          await details.nth(i).locator('summary').click();
          assert(await details.nth(i).getAttribute('open') !== null,planet + ' opens disclosure');
          const paragraphs = details.nth(i).locator('p');
          for (let j=0;j<expected[i].paragraphs.length;j++) {
            assert.equal(normalize(await paragraphs.nth(j).textContent()),normalize(expected[i].paragraphs[j]),planet + ' original disclosure paragraph');
            assert(await paragraphs.nth(j).isVisible(),planet + ' paragraph displayed');
          }
        }
        if (['venus','mars'].includes(planet)) {
          await page.locator('#intro-toggle').click();
          assert.equal(await page.locator('#intro-toggle').getAttribute('aria-expanded'),'true');
          const region = page.locator(planet === 'mars' ? '#mars-intro-content' : '#venus-intro');
          // The disclosure hint changes from “展开” to “收起”; compare authored
          // paragraphs rather than including that live control label in the copy.
          const raw = await page.evaluate(({html,id})=>[...new DOMParser().parseFromString(html,'text/html').getElementById(id).querySelectorAll('p')].map(p=>p.textContent),{html:source,id:planet === 'mars' ? 'mars-intro-content' : 'venus-intro'});
          assert.deepEqual((await region.locator('p').allTextContents()).map(normalize),raw.map(normalize));
          assert(await region.isVisible());
        }
        results.push(planet + ' ' + width + 'px: authored disclosures complete');
        await page.close();
      }
    }
    for (const [planet,[defaultId,copyId]] of Object.entries(profiles)) {
      const page = await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
      page.on('pageerror',e=>errors.push(planet + ': ' + e.message));
      const url = base + '/' + planet + '/index.html';
      const source = fs.readFileSync(path.join(root,planet,'index.html'),'utf8');
      const changed = source.replace(new RegExp(`(<p[^>]*id="${copyId}"[^>]*>)`), '$1<strong data-authored-sentinel>手写介绍验证</strong><br><a href="#top" data-authored-link>原文链接</a>');
      assert.notEqual(changed,source);
      await page.route(url,route=>route.fulfill({contentType:'text/html',body:changed}));
      await page.goto(url);
      await page.locator(`[data-view="${defaultId}"]`).first().click();
      const expected = await page.locator('#'+copyId).innerHTML();
      assert(await page.locator('[data-authored-sentinel]').count(),planet + ' startup authored content');
      for (const button of await page.locator(['jupiter','europa'].includes(planet) ? '.view-switch [data-view]' : '[data-view]').all()) {
        if (await button.getAttribute('data-view') === defaultId) continue;
        await button.click();
        await page.waitForTimeout(260);
        if (await button.getAttribute('data-view') === 'system' && ['jupiter','europa'].includes(planet))
          assert.equal(await page.locator('[data-authored-sentinel]').isVisible(),false,planet + ' overview hides close-up profile');
        else assert.equal(await page.locator('[data-authored-sentinel]').count(),0,planet + ' another object changes description');
        await page.locator(`[data-view="${defaultId}"]`).first().click();
        await page.waitForTimeout(260);
        assert.equal(await page.locator('#'+copyId).innerHTML(),expected,planet + ' returns to full authored markup');
      }
      results.push(planet + ': hand-edited HTML survives startup and every return');
      await page.close();
    }
    assert.deepEqual(errors,[]);
    fs.mkdirSync(path.join(__dirname, '../../.qa'),{recursive:true});
    fs.writeFileSync(path.join(__dirname, '../../.qa/authored-copy-results.json'),JSON.stringify(results,null,2));
    console.log('PASS: '+results.length+' authored-copy checks, archive versions and no script errors.');
  } finally {await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
