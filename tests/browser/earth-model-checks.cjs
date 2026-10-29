const assert = require('node:assert/strict');

module.exports = async function checkEarthModel(page) {
  const canvas = page.locator('#model-mount canvas');
  const distance = () => page.evaluate(() => __earthControls.object.position.length());
  const settleHome = () => page.waitForFunction(() => Math.abs(__earthControls.object.position.length() - __earthControls.maxDistance / 1.8) < .0001);
  await canvas.scrollIntoViewIfNeeded();
  const home = await distance();
  const initialLabel = await page.locator('#tropic-label').evaluate(e => ({left:e.getBoundingClientRect().left, top:e.getBoundingClientRect().top}));
  await page.locator('#zoom-in').click();
  assert((await distance()) < home * .9, 'zoom button approaches the globe');
  await page.waitForTimeout(120);
  assert.notDeepEqual(await page.locator('#tropic-label').evaluate(e => ({left:e.getBoundingClientRect().left,top:e.getBoundingClientRect().top})), initialLabel, 'latitude label follows actual 3D projection');
  await page.locator('#zoom-out').click();
  assert(Math.abs(await distance() - home) < .00001, 'zoom out reverses zoom in');
  await canvas.hover();
  const pageY = await page.evaluate(() => scrollY);
  await page.mouse.wheel(0, -350);
  await page.waitForTimeout(150);
  assert((await distance()) < home, 'mouse wheel zooms in');
  assert.equal(await page.evaluate(() => scrollY), pageY, 'wheel over model owns zoom');
  await page.mouse.wheel(0, 350);
  await page.waitForTimeout(150);
  assert(Math.abs(await distance() - home) < .0001, 'mouse wheel zooms out');

  // Real touch input exercises the same pointer path as a phone pinch.
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 2 });
  const box = await canvas.boundingBox(), cx = box.x + box.width / 2, cy = box.y + box.height / 2;
  const touches = gap => [{x:cx-gap,y:cy,id:1},{x:cx+gap,y:cy,id:2}];
  await cdp.send('Input.dispatchTouchEvent', {type:'touchStart',touchPoints:touches(35)});
  await cdp.send('Input.dispatchTouchEvent', {type:'touchMove',touchPoints:touches(75)});
  await cdp.send('Input.dispatchTouchEvent', {type:'touchEnd',touchPoints:[]});
  await page.waitForTimeout(150);
  assert((await distance()) < home * .85, 'two-finger spread zooms the model');
  await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: false });
  await cdp.detach();
  await page.locator('#reset').click();
  await settleHome();

  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.locator('#zoom-in').click();
  const from = await distance();
  const noJump = await page.evaluate(() => {
    const before = __earthControls.object.position.clone();
    document.getElementById('reset').click();
    return before.distanceTo(__earthControls.object.position) < 1e-9;
  });
  assert(noJump, 'reset never snaps synchronously');
  await page.waitForTimeout(200);
  const intermediate = await distance();
  assert(intermediate > from && intermediate < home, 'reset renders intermediate distances');
  await settleHome();
  await page.waitForTimeout(250);
  const resting = await canvas.evaluate(e => e.toDataURL());
  await page.waitForTimeout(200);
  assert.equal(await canvas.evaluate(e => e.toDataURL()), resting, 'reset settles without perpetual rendering changes');

  await canvas.hover();
  await page.mouse.move(cx,cy);
  await page.mouse.down();
  await page.mouse.move(cx+120,cy-50,{steps:8});
  await page.mouse.up();
  assert(await page.evaluate(() => Math.abs(__earthControls.object.position.x) > .1), 'drag changes viewing direction');
  assert(await page.evaluate(() => {
    const before = __earthControls.object.position.clone();
    document.getElementById('reset').click();
    return before.distanceTo(__earthControls.object.position) < 1e-9;
  }), 'reset flushes remaining drag inertia without jumping');
  await page.waitForTimeout(180);
  await canvas.hover();
  await page.mouse.wheel(0,-180);
  await page.waitForTimeout(100);
  const interrupted = await page.evaluate(() => __earthControls.object.position.toArray());
  await page.waitForTimeout(1100);
  const after = await page.evaluate(() => __earthControls.object.position.toArray());
  assert(after.every((v,i)=>Math.abs(v-interrupted[i]) < 1e-7), 'wheel interaction takes over an active reset');

  await page.locator('#reset').click();
  await page.waitForTimeout(160);
  assert(await page.evaluate(() => {
    const before = __earthControls.object.position.clone();
    document.getElementById('reset').click();
    return before.distanceTo(__earthControls.object.position) < 1e-9;
  }), 'repeated reset starts from current view');
  await page.evaluate(() => dispatchEvent(new Event('pagehide')));
  const hidden = await distance();
  await page.waitForTimeout(350);
  assert.equal(await distance(), hidden, 'reset sleeps while page is suspended');
  await page.evaluate(() => dispatchEvent(new Event('pageshow')));
  await settleHome();

  await page.locator('#zoom-in').click();
  await page.locator('#reset').click();
  await page.waitForTimeout(150);
  await page.setViewportSize({width:390,height:900});
  await canvas.scrollIntoViewIfNeeded();
  await settleHome();
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'zoom buttons fit mobile layout');
  await page.locator('.earth-observer').screenshot({path:require('node:path').resolve(__dirname,'../../.qa/earth-model-mobile.png')});
  await page.setViewportSize({width:1440,height:1000});
  await canvas.scrollIntoViewIfNeeded();
  await page.locator('#zoom-in').click();
  await page.locator('#reset').click();
  await page.waitForTimeout(100);
  await page.emulateMedia({reducedMotion:'reduce'});
  await settleHome();
  assert.equal(await page.locator('#spin').getAttribute('aria-pressed'), 'false');
  await page.waitForTimeout(120);
  await page.locator('.earth-observer').screenshot({path:require('node:path').resolve(__dirname,'../../.qa/earth-model-desktop.png')});
  assert.equal(await page.locator('.earth-observer').evaluate(e=>getComputedStyle(e).backgroundImage), 'none', 'blue backdrop is removed');
  assert.equal(await page.locator('.orbit-ring,.coordinate').count(), 0, 'no fixed guide remains outside the 3D model');
};
