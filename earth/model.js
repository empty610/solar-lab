(() => {
  'use strict';
  const mount = document.getElementById('model-mount');
  const stage = document.getElementById('model-stage');
  const $ = id => document.getElementById(id);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let renderer, scene, camera, controls, loop, textures, resizeObserver, globe, halo;
  let failed = false, ready = false, rotating = !reduced.matches, night = false, fittedDistance = 0;
  let clouds, nightTransition, resetTransition, tropicAnchor;
  const nightBlend = { value: 0 };
  function blendNight(value) {
    nightBlend.value = value;
    globe.material.emissiveIntensity = .7 * value;
    clouds.material.opacity = .82 * (1 - value);
    clouds.visible = value < 1;
  }
  function advanceNight(dt) {
    if (!nightTransition) return;
    nightTransition.elapsed = Math.min(.9, nightTransition.elapsed + dt);
    const t = nightTransition.elapsed / .9;
    const eased = t * t * (3 - 2 * t);
    blendNight(nightTransition.from + (nightTransition.to - nightTransition.from) * eased);
    if (t === 1) nightTransition = null;
  }
  const homeRotation = -1.65;
  const shortestAngle = angle => Math.atan2(Math.sin(angle), Math.cos(angle));
  function clearInertia() {
    // Flush OrbitControls' private damping accumulator without moving the view.
    const position = camera.position.clone(), target = controls.target.clone();
    const damping = controls.enableDamping;
    controls.enableDamping = false;
    controls.update();
    camera.position.copy(position);
    controls.target.copy(target);
    controls.update();
    controls.enableDamping = damping;
  }
  function advanceReset(dt) {
    if (!resetTransition) return;
    const state = resetTransition;
    state.elapsed = Math.min(.9, state.elapsed + dt);
    const t = state.elapsed / .9;
    const ease = t * t * t * (t * (6 * t - 15) + 10);
    const radius = fittedDistance * (state.ratio + (1 - state.ratio) * ease);
    const phi = state.phi + (Math.atan2(1, .08) - state.phi) * ease;
    const theta = state.theta + shortestAngle(-state.theta) * ease;
    camera.position.setFromSpherical(new THREE.Spherical(radius, phi, theta));
    globe.rotation.y = state.globe + shortestAngle(homeRotation - state.globe) * ease;
    clouds.rotation.y = state.clouds + shortestAngle(homeRotation - state.clouds) * ease;
    if (t === 1) resetTransition = null;
  }
  function resetView() {
    if (!ready) return;
    clearInertia();
    const position = new THREE.Spherical().setFromVector3(camera.position);
    resetTransition = { elapsed: 0, ratio: position.radius / fittedDistance,
      theta: position.theta, phi: position.phi, globe: globe.rotation.y, clouds: clouds.rotation.y };
    if (reduced.matches) advanceReset(.9);
    controls.update();
    loop.invalidate();
  }
  function zoomView(factor) {
    if (!ready) return;
    resetTransition = null;
    clearInertia();
    camera.position.setLength(THREE.MathUtils.clamp(camera.position.length() * factor, controls.minDistance, controls.maxDistance));
    controls.update();
    loop.invalidate();
  }
  function updateAnnotation() {
    const label = $('tropic-label');
    const point = tropicAnchor.getWorldPosition(new THREE.Vector3());
    const facing = point.dot(camera.position.clone().sub(point)) > 0;
    point.project(camera);
    const x = (point.x + 1) * mount.clientWidth / 2, y = (1 - point.y) * mount.clientHeight / 2;
    label.hidden = !facing || point.z < -1 || point.z > 1 || x < 12 || x > mount.clientWidth - 12 || y < 12 || y > mount.clientHeight - 45;
    // Percent coordinates also adapt immediately before the next resize frame.
    label.style.setProperty('--tropic-x', x / mount.clientWidth * 100 + '%');
    label.style.setProperty('--tropic-y', y / mount.clientHeight * 100 + '%');
  }
  const controlsButtons = [...document.querySelectorAll('.model-controls button')];
  controlsButtons.forEach(button => { button.disabled = true; });
  const updateSpin = () => { $('spin').textContent = rotating ? '暂停自转' : '开启自转'; $('spin').setAttribute('aria-pressed', String(rotating)); };
  updateSpin();
  function fail(error) {
    if (failed) return;
    failed = true;
    ready = false;
    resetTransition = null;
    $('tropic-label').hidden = true;
    loop?.dispose();
    resizeObserver?.disconnect();
    textures?.dispose();
    if (scene) ModelRuntime.disposeScene(scene, renderer, controls);
    renderer?.domElement.remove();
    $('model-loading').hidden = true;
    $('model-fallback').hidden = false;
    $('model-status').textContent = '静态影像模式';
    controlsButtons.forEach(button => { button.disabled = true; });
    console.warn('Earth view unavailable:', error?.message || error);
  }
  function fit(reset = false) {
    if (failed || !camera) return;
    const width = Math.max(1, mount.clientWidth), height = Math.max(1, mount.clientHeight);
    renderer.setSize(width, height);
    camera.aspect = width / height;
    const vertical = camera.fov * Math.PI / 360;
    const halfAngle = Math.min(vertical, Math.atan(Math.tan(vertical) * camera.aspect));
    const distance = 1.08 / Math.sin(halfAngle) / 0.82;
    const zoomRatio = fittedDistance && !reset ? camera.position.length() / fittedDistance : 1;
    if (reset) camera.position.set(0, 0.08, 1).normalize();
    camera.position.setLength(distance * zoomRatio);
    fittedDistance = distance;
    controls.minDistance = Math.max(1.5, distance * 0.58);
    controls.maxDistance = distance * 1.8;
    camera.updateProjectionMatrix();
    controls.update();
    loop?.invalidate();
  }
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.setAttribute('aria-label', '可拖动旋转、滚轮或双指缩放的地球模型，球面标出北回归线');
    renderer.domElement.setAttribute('role', 'img');
    renderer.domElement.addEventListener('webglcontextlost', event => { event.preventDefault(); fail(new Error('WebGL context lost')); });
    mount.append(renderer.domElement);
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
    camera.position.set(0, .08, 5);
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = .08;
    controls.enablePan = false;
    controls.enableZoom = true;
    controls.zoomSpeed = .65;
    controls.rotateSpeed = .5;
    // OrbitControls handles wheel and two-pointer pinch on the canvas only.
    controls.touches.ONE = THREE.TOUCH.ROTATE;
    controls.touches.TWO = THREE.TOUCH.DOLLY_PAN;
    controls.addEventListener('start', () => { resetTransition = null; });
    const light = new THREE.DirectionalLight(0xffffff, 2.4);
    light.position.set(-3, 4, 6); scene.add(light);
    scene.add(new THREE.AmbientLight(0xdce9f7, 1.35));
    const earthGroup = new THREE.Group();
    earthGroup.rotation.z = -23.44 * Math.PI / 180;
    scene.add(earthGroup);
    globe = new THREE.Mesh(new THREE.SphereGeometry(1, 80, 64), new THREE.MeshPhongMaterial({ color: 0xffffff, shininess: 8, specular: 0x263a42 }));
    globe.rotation.y = -1.65;
    // Keep both maps resident and blend in linear color space. No texture swap
    // or shader recompilation is needed while the observer changes views.
    globe.material.onBeforeCompile = shader => {
      shader.uniforms.earthNightMix = nightBlend;
      shader.fragmentShader = 'uniform float earthNightMix;\n' + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `
        #include <map_fragment>
        diffuseColor.rgb = mix(diffuseColor.rgb,
          diffuse * texture2D(emissiveMap, vEmissiveMapUv).rgb, earthNightMix);
      `);
    };
    globe.material.customProgramCacheKey = () => 'earth-day-night-blend';
    earthGroup.add(globe);
    const latitude = 23.44 * Math.PI / 180, radius = 1.018;
    const points = Array.from({ length: 160 }, (_, i) => {
      const longitude = i / 160 * Math.PI * 2;
      return new THREE.Vector3(radius * Math.cos(latitude) * Math.sin(longitude),
        radius * Math.sin(latitude), radius * Math.cos(latitude) * Math.cos(longitude));
    });
    const tropic = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(points),
      new THREE.LineDashedMaterial({ color: 0xf0dba1, transparent: true, opacity: .7, dashSize: .035, gapSize: .025 }));
    tropic.computeLineDistances();
    earthGroup.add(tropic);
    tropicAnchor = new THREE.Object3D();
    tropicAnchor.position.set(radius * Math.cos(latitude) * Math.sin(-homeRotation),
      radius * Math.sin(latitude), radius * Math.cos(latitude) * Math.cos(-homeRotation));
    globe.add(tropicAnchor);
    clouds = new THREE.Mesh(new THREE.SphereGeometry(1.009, 80, 64), new THREE.MeshPhongMaterial({ color: 0xffffff, transparent: true, opacity: .82, depthWrite: false }));
    clouds.rotation.y = globe.rotation.y;
    earthGroup.add(clouds);
    halo = new THREE.Mesh(new THREE.SphereGeometry(1.025, 64, 48), new THREE.ShaderMaterial({
      uniforms: { glow: { value: new THREE.Color('#80c0d0') } },
      vertexShader: 'varying vec3 vNormal; varying vec3 vPosition; void main(){ vec4 p=modelViewMatrix*vec4(position,1.0); vNormal=normalize(normalMatrix*normal); vPosition=p.xyz; gl_Position=projectionMatrix*p; }',
      fragmentShader: 'uniform vec3 glow; varying vec3 vNormal; varying vec3 vPosition; void main(){ float rim=1.0-abs(dot(normalize(vNormal),normalize(-vPosition))); gl_FragColor=vec4(glow,pow(rim,4.0)*0.25); }',
      transparent: true, depthWrite: false, side: THREE.FrontSide,
    }));
    scene.add(halo);
    loop = ModelRuntime.loop({ element: stage, draw: dt => {
      if (!ready || failed) return false;
      if (rotating && !resetTransition) { globe.rotation.y += dt * .045; clouds.rotation.y += dt * .047; }
      advanceNight(dt);
      advanceReset(dt);
      const moving = controls.update();
      renderer.render(scene, camera);
      updateAnnotation();
      return rotating || moving || !!nightTransition || !!resetTransition;
    } });
    loop.bind(controls);
    fit(true);
    resizeObserver = new ResizeObserver(() => fit());
    resizeObserver.observe(mount);
    textures = ModelRuntime.textures(THREE, renderer);
    const textureURLs = window.EarthFileTextures || { day: new URL('assets/earth-day.jpg', document.baseURI).href, night: new URL('assets/earth-night.png', document.baseURI).href, clouds: new URL('assets/clouds.jpg', document.baseURI).href };
    Promise.all([textures.load(textureURLs.day), textures.load(textureURLs.night), textures.load(textureURLs.clouds)]).then(([day, dark, cloudMap]) => {
      if (failed || !day || !dark || !cloudMap) return;
      clouds.material.alphaMap = cloudMap;
      clouds.material.needsUpdate = true;
      globe.material.map = day;
      globe.material.emissiveMap = dark;
      globe.material.emissive.set(0xffffff);
      globe.material.emissiveIntensity = 0;
      globe.material.needsUpdate = true;
      ready = true;
      $('model-loading').hidden = true;
      $('model-status').textContent = '地表观察 / SURFACE';
      controlsButtons.forEach(button => { button.disabled = false; });
      stage.dataset.earthReady = 'true';
      loop.start();
    }).catch(fail);
    $('spin').addEventListener('click', () => { if (!ready) return; rotating = !rotating; updateSpin(); loop.invalidate(); });
    $('night').addEventListener('click', () => {
      if (!ready) return;
      night = !night;
      // Reverse from the currently visible blend, including rapid clicks.
      nightTransition = reduced.matches ? null : { from: nightBlend.value, to: night ? 1 : 0, elapsed: 0 };
      if (reduced.matches) blendNight(night ? 1 : 0);
      $('night').setAttribute('aria-pressed', String(night));
      $('night').textContent = night ? '返回白昼' : '夜间灯光';
      $('model-status').textContent = night ? '夜间灯光合成 / NIGHT' : '地表观察 / SURFACE';
      loop.invalidate();
    });
    $('reset').addEventListener('click', resetView);
    $('zoom-in').addEventListener('click', () => zoomView(.86));
    $('zoom-out').addEventListener('click', () => zoomView(1 / .86));
    reduced.addEventListener('change', () => {
      if (!reduced.matches || failed) return;
      rotating = false;
      updateSpin();
      nightTransition = null;
      if (resetTransition) { advanceReset(.9); controls.update(); }
      if (ready) blendNight(night ? 1 : 0);
      loop?.invalidate();
    });
  } catch (error) { fail(error); }
})();
