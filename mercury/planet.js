(function () {
  'use strict';
  const stage = document.getElementById('planet-stage'),
    mount = document.getElementById('planet-mount');
  const status = document.getElementById('model-status'),
    loading = document.getElementById('model-loading');
  const error = document.getElementById('model-error');
  const rotate = document.getElementById('rotate-model'),
    lighting = document.getElementById('light-model');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let renderer,
    controls,
    failed = false,
    auto = !reduced.matches,
    uniform = false;
  let modelLoop, textureSet;
  let cleanup = () => {};
  function fail(message) {
    if (failed) return;
    failed = true;
    modelLoop?.dispose();
    textureSet?.dispose();
    cleanup();
    if (controls) controls.enabled = false;
    mount.classList.remove('ready');
    loading.hidden = true;
    error.hidden = false;
    status.textContent = '三维视图不可用';
    status.classList.remove('ready');
    rotate.disabled = true;
    lighting.disabled = true;
    document.getElementById('reset-model').disabled = true;
    console.warn(message);
  }
  document.getElementById('retry-model').addEventListener('click', () => location.reload());
  try {
    if (!window.ModelRuntime || !window.THREE || !window.OrbitControls) throw new Error('Local 3D library was not loaded');
    const scene = new THREE.Scene(),
      camera = new THREE.PerspectiveCamera(36, 1, 0.1, 60);
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'low-power',
    });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.6));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    mount.appendChild(renderer.domElement);
    cleanup = () => ModelRuntime.disposeScene(scene, renderer, controls);
    textureSet = ModelRuntime.textures(THREE, renderer);
    renderer.domElement.setAttribute('aria-label', '水星三维视图：拖拽旋转，滚轮或双指缩放');
    const ambient = new THREE.AmbientLight(0xfff9ec, 0.5),
      key = new THREE.DirectionalLight(0xfff5dc, 2.6);
    key.position.set(-3, 2, 4);
    scene.add(ambient, key);
    const fill = new THREE.DirectionalLight(0xe2e5ed, 0.22);
    fill.position.set(3, 0, -2);
    scene.add(fill);
    const geometry = new THREE.SphereGeometry(1.3, 80, 56);
    const material = new THREE.MeshStandardMaterial({
      roughness: 1,
      metalness: 0,
      color: 0xffffff,
    });
    const globe = new THREE.Mesh(geometry, material);
    globe.rotation.y = -1.1;
    scene.add(globe);
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.enablePan = false;
    controls.minDistance = 2.8;
    controls.maxDistance = 10;
    controls.rotateSpeed = 0.65;
    controls.zoomSpeed = 0.65;
    controls.target.set(0, 0, 0);
    let previousWidth = 0,
      previousHeight = 0;
    function fittedDistance() {
      const aspect = camera.aspect;
      const halfAngle = Math.min(
        THREE.MathUtils.degToRad(18),
        Math.atan(Math.tan(THREE.MathUtils.degToRad(18)) * aspect),
      );
      return (1.3 / Math.sin(halfAngle)) * 1.17;
    }
    function resetCamera() {
      const distance = fittedDistance();
      controls.enableDamping = false;
      controls.update();
      camera.position.set(0, 0.04, distance);
      controls.target.set(0, 0, 0);
      controls.update();
      controls.enableDamping = true;
    }
    function resize() {
      const w = mount.clientWidth,
        h = mount.clientHeight;
      if (failed) return;
      if (!w || !h || (w === previousWidth && h === previousHeight)) return;
      const initial = !previousWidth, previousDistance = fittedDistance();
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
      modelLoop?.invalidate();
      if (initial) resetCamera();
      else {
        camera.position.sub(controls.target).multiplyScalar(fittedDistance() / previousDistance).add(controls.target);
        controls.update();
      }
      previousWidth = w;
      previousHeight = h;
    }
    const ro = new ResizeObserver(resize);
    ro.observe(mount);
    resize();
    let interacting = false;
    controls.addEventListener('start', () => {
      interacting = true;
    });
    controls.addEventListener('end', () => {
      interacting = false;
    });

    const updateRotate = () => {
      rotate.setAttribute('aria-pressed', String(auto));
      rotate.textContent = auto ? '暂停自转' : '继续自转';
    };
    updateRotate();
    rotate.addEventListener('click', () => {
      auto = !auto;
      updateRotate();
    });
    reduced.addEventListener('change', () => {
      modelLoop?.invalidate();
      if (reduced.matches) {
        auto = false;
        updateRotate();
      }
    });
    lighting.addEventListener('click', () => {
      uniform = !uniform;
      ambient.intensity = uniform ? 2.1 : 0.5;
      key.intensity = uniform ? 0.6 : 2.6;
      lighting.setAttribute('aria-pressed', String(uniform));
      lighting.textContent = uniform ? '昼夜照明' : '均匀照明';
    });
    document.getElementById('reset-model').addEventListener('click', () => {
      resetCamera();
    });
    renderer.domElement.addEventListener('webglcontextlost', (event) => {
      event.preventDefault();
      fail('WebGL context lost');
    });
    textureSet.load('assets/mercury-surface.jpg').then(map => {
      if (failed || !map) return;
      material.map = map;
      material.needsUpdate = true;
      renderer.render(scene, camera);
      mount.classList.add('ready');
      loading.hidden = true;
      status.textContent = '地表已就绪';
      status.classList.add('ready');
      modelLoop.start();
    }).catch(fail);
    function draw(dt) {
      if (auto && !interacting) globe.rotation.y += dt * 0.055;
      const moved = controls.update();
      renderer.render(scene, camera);
      return auto || interacting || moved;
    }
    modelLoop = ModelRuntime.loop({ element: stage, draw, fps: 60 });
    modelLoop.bind(controls);
    stage.closest('section').addEventListener('click', modelLoop.invalidate);
    stage.addEventListener('keydown', modelLoop.invalidate);
  } catch (err) {
    fail(err);
  }
})();
