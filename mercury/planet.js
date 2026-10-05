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
    ready = false,
    visible = true,
    failed = false,
    auto = !reduced.matches,
    uniform = false;
  function fail(message) {
    failed = true;
    ready = false;
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
    if (!window.THREE || !window.OrbitControls) throw new Error('Local 3D library was not loaded');
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
      previousHeight = 0,
      touched = false,
      last = 0;
    function resetCamera() {
      const aspect = Math.max(0.1, mount.clientWidth / Math.max(1, mount.clientHeight));
      const halfAngle = Math.min(
        THREE.MathUtils.degToRad(18),
        Math.atan(Math.tan(THREE.MathUtils.degToRad(18)) * aspect),
      );
      const distance = (1.3 / Math.sin(halfAngle)) * 1.17;
      camera.position.set(0, 0.04, distance);
      controls.target.set(0, 0, 0);
      controls.update();
    }
    function resize() {
      const w = mount.clientWidth,
        h = mount.clientHeight;
      if (!w || !h || (w === previousWidth && h === previousHeight)) return;
      const priorAspect = previousWidth / Math.max(1, previousHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
      if (!touched || Math.abs(priorAspect - w / h) > 0.15) {
        resetCamera();
        touched = false;
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
      touched = true;
    });
    controls.addEventListener('end', () => {
      interacting = false;
    });
    new IntersectionObserver(
      (entries) => {
        visible = entries[0].isIntersecting;
        last = 0;
      },
      { rootMargin: '80px' },
    ).observe(stage);
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
      touched = false;
    });
    renderer.domElement.addEventListener('webglcontextlost', (event) => {
      event.preventDefault();
      fail('WebGL context lost');
    });
    const texture = new THREE.TextureLoader().load(
      'assets/mercury-surface.jpg',
      (map) => {
        map.colorSpace = THREE.SRGBColorSpace;
        map.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
        material.map = map;
        material.needsUpdate = true;
        renderer.render(scene, camera);
        ready = true;
        failed = false;
        requestAnimationFrame(() => {
          mount.classList.add('ready');
          loading.hidden = true;
          status.textContent = '地表已就绪';
          status.classList.add('ready');
        });
      },
      undefined,
      () => fail('Mercury surface texture could not be loaded'),
    );
    function draw(now) {
      requestAnimationFrame(draw);
      if (!ready || failed || !visible || document.hidden) {
        last = 0;
        return;
      }
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
      last = now;
      if (auto && !interacting) globe.rotation.y += dt * 0.055;
      controls.update();
      renderer.render(scene, camera);
    }
    requestAnimationFrame(draw);
    window.addEventListener('pagehide', () => {
      last = 0;
    });
  } catch (err) {
    fail(err);
  }
})();
