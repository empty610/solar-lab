(function () {
  'use strict';
  const $ = (id) => document.getElementById(id),
    mount = $('model-mount'),
    stage = $('model-stage');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)'),
    D = window.NeptuneData;
  let selected = 'neptune',
    ready = false,
    visible = true,
    failed = false,
    day = 0,
    spinning = !reduced.matches;
  let changeTimer,
    resetFlight = null,
    renderer,
    controls;
  function fail(error) {
    failed = true;
    ready = false;
    mount.classList.remove('is-ready');
    $('model-loading').hidden = true;
    $('model-fallback').hidden = false;
    $('model-status').textContent = '图文模式';
    $('model-status').classList.remove('ready');
    $('moon-label').hidden = true;
    document
      .querySelectorAll('[data-view],#lighting,#spin,#reset')
      .forEach((el) => (el.disabled = true));
    console.warn('Neptune model unavailable:', error);
  }
  function profile(id) {
    const p = D.profiles[id];
    $('body-tag').textContent = p.tag;
    $('body-title').textContent = p.title;
    $('body-copy').textContent = p.copy;
    $('body-facts').replaceChildren();
    for (const [label, value, unit] of p.facts) {
      const row = document.createElement('div'),
        dt = document.createElement('dt'),
        dd = document.createElement('dd'),
        small = document.createElement('small');
      dt.textContent = label;
      dd.textContent = value + ' ';
      small.textContent = unit;
      dd.append(small);
      row.append(dt, dd);
      $('body-facts').append(row);
    }
    document
      .querySelectorAll('[data-view]')
      .forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === id)));
    $('model-note').textContent =
      id === 'system'
        ? '球体 / 距离比例保留 · 轨道倾角近似 · 非实时星历'
        : id === 'rings'
          ? '五道主环示意 · 环宽与亮度增强'
          : 'NASA VTAD / 可视化模型';
  }
  try {
    if (!window.THREE || !window.OrbitControls || !window.NEPTUNE_MODELS)
      throw Error('Local model files are missing');
    const scene = new THREE.Scene(),
      camera = new THREE.PerspectiveCamera(36, 1, 0.01, 500);
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'low-power',
    });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.6));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    mount.append(renderer.domElement);
    renderer.domElement.setAttribute(
      'aria-label',
      '海王星与海卫一三维模型，拖动旋转，滚轮或双指缩放',
    );
    const ambient = new THREE.AmbientLight(0xe2eef5, 1.35),
      key = new THREE.DirectionalLight(0xfff5e7, 2.4);
    key.position.set(-8, 7, 12);
    scene.add(ambient, key);
    const system = new THREE.Group();
    scene.add(system);
    system.rotation.z = 0.16;
    const planetSpin = new THREE.Group(),
      moonPlane = new THREE.Group(),
      moonSpin = new THREE.Group(),
      ringGroup = new THREE.Group();
    system.add(planetSpin, moonPlane, ringGroup);
    moonPlane.rotation.x = (157.3 * Math.PI) / 180;
    moonPlane.add(moonSpin);
    const meshes = {};
    for (const id of ['neptune', 'triton']) {
      const m = window.NEPTUNE_MODELS[id],
        geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(m.positions, 3));
      geometry.setAttribute('normal', new THREE.Float32BufferAttribute(m.normals, 3));
      geometry.setAttribute('uv', new THREE.Float32BufferAttribute(m.uv, 2));
      geometry.setIndex(m.indices);
      geometry.applyQuaternion(new THREE.Quaternion(...m.rotation));
      meshes[id] = new THREE.Mesh(
        geometry,
        new THREE.MeshStandardMaterial({ roughness: 1, metalness: 0 }),
      );
      (id === 'neptune' ? planetSpin : moonSpin).add(meshes[id]);
    }
    // Thin annuli: brightness and radial width deliberately amplified, no texture dependency.
    for (const [radius, width, opacity] of [
      [41900, 750, 0.13],
      [53200, 190, 0.35],
      [55400, 2900, 0.07],
      [57600, 250, 0.2],
      [62930, 230, 0.45],
    ]) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(
          (radius - width / 2) / D.radius,
          (radius + width / 2) / D.radius,
          240,
        ),
        new THREE.MeshBasicMaterial({
          color: 0x8a9087,
          transparent: true,
          opacity,
          side: THREE.DoubleSide,
          depthWrite: false,
        }),
      );
      ring.rotation.x = -Math.PI / 2;
      ringGroup.add(ring);
    }
    const points = [];
    for (let i = 0; i <= 256; i++) {
      const a = (i / 256) * Math.PI * 2;
      points.push(
        new THREE.Vector3(
          (D.tritonOrbit / D.radius) * Math.cos(a),
          0,
          (-D.tritonOrbit / D.radius) * Math.sin(a),
        ),
      );
    }
    const track = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(points),
      new THREE.LineBasicMaterial({ color: 0x829b9f, transparent: true, opacity: 0.32 }),
    );
    moonPlane.add(track);
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.09;
    controls.enablePan = false;
    controls.rotateSpeed = 0.7;
    controls.zoomSpeed = 0.75;
    controls.minPolarAngle = 0.08;
    controls.maxPolarAngle = Math.PI - 0.08;
    const defaultDirection = new THREE.Vector3(0, 0.35, 1).normalize();
    function extent() {
      return selected === 'system'
        ? (D.tritonOrbit / D.radius) * 1.08
        : selected === 'rings'
          ? 2.6
          : 1.04;
    }
    function fitDistance() {
      const v = THREE.MathUtils.degToRad(camera.fov / 2),
        half = Math.min(v, Math.atan(Math.tan(v) * camera.aspect));
      return (extent() / Math.sin(half)) * 1.12;
    }
    function reset(immediate = false) {
      const distance = fitDistance();
      controls.minDistance = selected === 'system' ? 6 : selected === 'rings' ? 3 : 1.35;
      controls.maxDistance = Math.max(distance * 2.5, 8);
      controls.target.set(0, 0, 0);
      if (immediate || reduced.matches) {
        resetFlight = null;
        controls.enableDamping = false;
        controls.update();
        camera.position.copy(defaultDirection).multiplyScalar(distance);
        camera.lookAt(0, 0, 0);
        controls.update();
        controls.enableDamping = true;
      } else {
        controls.enableDamping = false;
        controls.update();
        const from = camera.position.clone(),
          dir = from.clone().normalize();
        resetFlight = {
          elapsed: 0,
          distance: from.length(),
          to: distance,
          dir,
          turn: new THREE.Quaternion().setFromUnitVectors(dir, defaultDirection),
        };
      }
    }
    controls.addEventListener('start', () => {
      resetFlight = null;
      controls.enableDamping = true;
    });
    function updateBodies() {
      planetSpin.rotation.y = (day / (16.11 / 24)) * Math.PI * 2 - 0.45;
      const a = (day / D.tritonPeriod) * Math.PI * 2;
      moonSpin.rotation.y = a;
      const all = selected === 'system';
      planetSpin.visible = selected !== 'triton';
      moonPlane.visible = all || selected === 'triton';
      ringGroup.visible = all || selected === 'rings';
      track.visible = all;
      meshes.triton.scale.setScalar(all ? D.tritonRadius / D.radius : 1);
      moonSpin.position.set(
        all ? (D.tritonOrbit / D.radius) * Math.cos(a) : 0,
        0,
        all ? (-D.tritonOrbit / D.radius) * Math.sin(a) : 0,
      );
    }
    function select(id) {
      if (!D.profiles[id] || failed) return;
      clearTimeout(changeTimer);
      mount.classList.add('switching');
      changeTimer = setTimeout(
        () => {
          selected = id;
          profile(id);
          updateBodies();
          spinLabel();
          reset(true);
          renderer.render(scene, camera);
          mount.classList.remove('switching');
        },
        reduced.matches ? 0 : 180,
      );
    }
    document
      .querySelectorAll('[data-view]')
      .forEach((b) => b.addEventListener('click', () => select(b.dataset.view)));
    function spinLabel() {
      $('spin').setAttribute('aria-pressed', String(spinning));
      $('spin').textContent = spinning
        ? selected === 'system'
          ? '暂停演示'
          : '暂停自转'
        : selected === 'system'
          ? '继续演示'
          : '继续自转';
      $('spin').title = '海卫一的自转与公转同步暂停，保持潮汐锁定关系';
    }
    $('spin').addEventListener('click', () => {
      spinning = !spinning;
      spinLabel();
    });
    $('lighting').addEventListener('click', () => {
      const night = $('lighting').getAttribute('aria-pressed') !== 'true';
      $('lighting').setAttribute('aria-pressed', String(night));
      $('lighting').textContent = night ? '均匀照明' : '昼夜照明';
      ambient.intensity = night ? 0.13 : 1.35;
      key.intensity = night ? 2.8 : 2.4;
    });
    $('reset').addEventListener('click', () => reset());
    let oldWidth = 0,
      oldHeight = 0;
    function resize() {
      const w = mount.clientWidth,
        h = mount.clientHeight;
      if (!w || !h || (w === oldWidth && h === oldHeight)) return;
      oldWidth = w;
      oldHeight = h;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
      reset(true);
    }
    new ResizeObserver(resize).observe(mount);
    resize();
    updateBodies();
    spinLabel();
    if ('IntersectionObserver' in window)
      new IntersectionObserver(
        (entries) => {
          visible = entries[0].isIntersecting;
        },
        { rootMargin: '100px' },
      ).observe(stage);
    reduced.addEventListener('change', () => {
      if (reduced.matches) {
        spinning = false;
        reset(true);
        spinLabel();
      }
    });
    renderer.domElement.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      fail('WebGL context lost; reload to restore.');
    });
    const loader = new THREE.TextureLoader();
    Promise.all(
      ['neptune', 'triton'].map(
        (id) =>
          new Promise((resolve, reject) =>
            loader.load(
              window.NEPTUNE_MODELS[id].texture,
              (texture) => {
                texture.colorSpace = THREE.SRGBColorSpace;
                texture.flipY = false;
                texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
                meshes[id].material.map = texture;
                meshes[id].material.needsUpdate = true;
                resolve();
              },
              undefined,
              reject,
            ),
          ),
      ),
    )
      .then(() => {
        if (failed) return;
        renderer.compile(scene, camera);
        renderer.render(scene, camera);
        ready = true;
        $('model-loading').hidden = true;
        $('model-status').textContent = '模型就绪 · 本地资源';
        $('model-status').classList.add('ready');
        mount.classList.add('is-ready');
      })
      .catch(fail);
    let last = 0,
      accumulator = 0;
    function tick(now) {
      requestAnimationFrame(tick);
      const dt = Math.min((now - last) / 1000, 0.06);
      last = now;
      if (!ready || failed || !visible || document.hidden) {
        accumulator = 0;
        return;
      }
      accumulator += dt;
      if (accumulator < 1 / 40) return;
      const step = accumulator;
      accumulator = 0;
      if (spinning) day += step * 0.025;
      updateBodies();
      if (resetFlight) {
        const f = resetFlight;
        f.elapsed += step;
        const t = Math.min(1, f.elapsed / 1.15),
          s = t * t * (3 - 2 * t);
        const q = new THREE.Quaternion().slerp(f.turn, s);
        camera.position
          .copy(f.dir)
          .applyQuaternion(q)
          .multiplyScalar(f.distance + (f.to - f.distance) * s);
        camera.lookAt(0, 0, 0);
        if (t === 1) {
          resetFlight = null;
          controls.enableDamping = true;
        }
      }
      controls.update();
      renderer.render(scene, camera);
      const label = $('moon-label');
      label.hidden = selected !== 'system';
      if (!label.hidden) {
        const v = moonSpin.getWorldPosition(new THREE.Vector3()).project(camera),
          x = (v.x * 0.5 + 0.5) * oldWidth,
          y = (-v.y * 0.5 + 0.5) * oldHeight;
        label.hidden = v.z > 1 || v.z < -1 || x < 0 || x > oldWidth || y < 0 || y > oldHeight;
        if (!label.hidden)
          label.style.transform = `translate(${Math.min(oldWidth - 142, Math.max(8, x + 9))}px,${Math.max(10, y - 28)}px)`;
      }
    }
    requestAnimationFrame(tick);
    // Read-only diagnostics for the local smoke test.
    window.NeptuneView = {
      get ready() {
        return ready;
      },
      get selected() {
        return selected;
      },
      get state() {
        return {
          day,
          spinning,
          distance: camera.position.length(),
          aspect: camera.aspect,
          extent: extent(),
        };
      },
    };
  } catch (error) {
    fail(error);
  }
})();
