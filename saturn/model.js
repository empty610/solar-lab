(function () {
  'use strict';
  const $ = (id) => document.getElementById(id),
    D = window.SaturnData,
    mount = $('model-mount'),
    stage = $('model-stage'),
    reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let selected = 'saturn',
    ready = false,
    failed = false,
    visible = true,
    day = 0,
    spinning = !reduced.matches,
    changeTimer,
    flight,
    renderer,
    controls;
  const moonIds = ['titan', 'enceladus'],
    ui = [...document.querySelectorAll('[data-view],#lighting,#spin,#reset')];
  function fail(error) {
    ready = false;
    failed = true;
    mount.classList.remove('is-ready');
    $('model-loading').hidden = true;
    $('model-fallback').hidden = false;
    $('model-status').textContent = '图文模式';
    ui.forEach((b) => (b.disabled = true));
    moonIds.forEach((id) => ($(id + '-label').hidden = true));
    console.warn('Saturn model unavailable:', error);
  }
  function profile() {
    const p = D.profiles[selected];
    $('body-tag').textContent = p.tag;
    $('body-title').textContent = p.title;
    $('body-copy').textContent = p.copy;
    $('body-facts').replaceChildren();
    p.facts.forEach(([label, value, unit]) => {
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
    });
    document
      .querySelectorAll('[data-view]')
      .forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === selected)));
    $('model-note').textContent =
      selected === 'system'
        ? '仅两颗卫星 · 尺度保留 / 圆轨道近似 · 非实时星历'
        : selected === 'titan'
          ? 'NASA VTAD / 表面地图 · 非隔雾肉眼视图'
          : 'NASA VTAD / 原始模型与环贴图';
  }
  try {
    if (!window.THREE || !window.OrbitControls || !window.SATURN_MODELS)
      throw Error('Missing local model dependencies');
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
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.append(renderer.domElement);
    renderer.domElement.setAttribute('aria-label', '土星与两颗卫星的三维模型，可拖动旋转与缩放');
    const ambient = new THREE.AmbientLight(0xf3eee2, 1.1),
      key = new THREE.DirectionalLight(0xfff4dd, 2.7);
    key.position.set(-8, 7, 12);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    Object.assign(key.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3, near: 1, far: 40 });
    key.shadow.camera.updateProjectionMatrix();
    key.shadow.bias = -0.0002;
    scene.add(ambient, key);
    const system = new THREE.Group();
    system.rotation.z = (-26.73 * Math.PI) / 180;
    scene.add(system);
    const planetSpin = new THREE.Group(),
      rings = new THREE.Group(),
      moonGroups = {},
      moonMeshes = {},
      tracks = [];
    system.add(planetSpin, rings);
    const materialRecords = [];
    for (const id of ['saturn', ...moonIds]) {
      const group = id === 'saturn' ? planetSpin : new THREE.Group();
      if (id !== 'saturn') {
        moonGroups[id] = group;
        system.add(group);
      }
      const m = window.SATURN_MODELS[id];
      for (const part of m.parts) {
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(part.positions, 3));
        geometry.setAttribute('normal', new THREE.Float32BufferAttribute(part.normals, 3));
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(part.uv, 2));
        geometry.setIndex(part.indices);
        geometry.applyQuaternion(new THREE.Quaternion(...part.rotation));
        const mat = new THREE.MeshStandardMaterial({
          roughness: 1,
          metalness: 0,
          side: part.ring ? THREE.DoubleSide : THREE.FrontSide,
          transparent: part.ring,
          alphaTest: part.ring ? 0.03 : 0,
          depthWrite: !part.ring,
        });
        const mesh = new THREE.Mesh(geometry, mat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        (part.ring ? rings : group).add(mesh);
        if (id !== 'saturn') moonMeshes[id] = mesh;
        materialRecords.push({ mat, id, index: part.texture, ring: part.ring });
      }
    }
    for (const id of moonIds) {
      const points = [];
      for (let i = 0; i <= 240; i++) {
        const a = (i / 240) * 2 * Math.PI,
          r = D.moons[id].orbit / D.radius;
        points.push(new THREE.Vector3(r * Math.cos(a), 0, -r * Math.sin(a)));
      }
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(points),
        new THREE.LineBasicMaterial({ color: 0xa38c60, transparent: true, opacity: 0.28 }),
      );
      system.add(line);
      tracks.push(line);
    }
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.09;
    controls.enablePan = false;
    controls.rotateSpeed = 0.7;
    controls.zoomSpeed = 0.7;
    controls.minPolarAngle = 0.05;
    controls.maxPolarAngle = Math.PI - 0.05;
    function extent() {
      return selected === 'system'
        ? (D.moons.titan.orbit / D.radius) * 1.035
        : moonIds.includes(selected)
          ? 1.04
          : 2.4;
    }
    function distance() {
      const v = THREE.MathUtils.degToRad(camera.fov / 2),
        angle = Math.min(v, Math.atan(Math.tan(v) * camera.aspect));
      return (extent() / Math.sin(angle)) * 1.08;
    }
    function direction() {
      return new THREE.Vector3(0, selected === 'rings' ? 2.8 : 0.6, 1).normalize();
    }
    function reset(immediate = false) {
      controls.enableDamping = false;
      controls.update();
      flight = null;
      controls.target.set(0, 0, 0);
      const to = distance(),
        dir = direction();
      controls.minDistance = selected === 'system' ? 24 : moonIds.includes(selected) ? 1.35 : 2.75;
      controls.maxDistance = Math.max(to * 2.3, 10);
      if (immediate || reduced.matches) {
        camera.position.copy(dir).multiplyScalar(to);
        camera.lookAt(0, 0, 0);
        controls.update();
        controls.enableDamping = true;
      } else {
        const from = camera.position.clone();
        flight = {
          t: 0,
          from: from.length(),
          to,
          dir: from.clone().normalize(),
          turn: new THREE.Quaternion().setFromUnitVectors(from.normalize(), dir),
        };
      }
    }
    controls.addEventListener('start', () => {
      flight = null;
      controls.enableDamping = true;
    });
    function updateBodies() {
      const all = selected === 'system',
        planet = selected === 'saturn' || selected === 'rings' || all;
      planetSpin.visible = planet;
      rings.visible = planet;
      planetSpin.rotation.y = (day / (10.7 / 24)) * Math.PI * 2;
      for (const id of moonIds) {
        const group = moonGroups[id],
          m = D.moons[id],
          p = D.moonPosition(id, day);
        group.visible = all || selected === id;
        group.position.set(all ? p.x : 0, 0, all ? p.z : 0);
        group.rotation.y = p.angle;
        moonMeshes[id].scale.setScalar(all ? m.radius / D.radius : 1);
      }
      tracks.forEach((t) => (t.visible = all));
    }
    function spinUI() {
      $('spin').setAttribute('aria-pressed', String(spinning));
      $('spin').textContent = spinning
        ? selected === 'system'
          ? '暂停演示'
          : '暂停自转'
        : selected === 'system'
          ? '继续演示'
          : '继续自转';
      $('spin').title = '所有球体的自转、公转同步暂停，卫星保持同步自转';
    }
    function select(id) {
      if (!D.profiles[id] || failed) return;
      clearTimeout(changeTimer);
      flight = null;
      mount.classList.add('switching');
      changeTimer = setTimeout(
        () => {
          selected = id;
          profile();
          updateBodies();
          spinUI();
          reset(true);
          renderer.render(scene, camera);
          mount.classList.remove('switching');
        },
        reduced.matches ? 0 : 200,
      );
    }
    document
      .querySelectorAll('[data-view]')
      .forEach((b) => b.addEventListener('click', () => select(b.dataset.view)));
    document
      .querySelectorAll('[data-look]')
      .forEach((a) => a.addEventListener('click', () => select(a.dataset.look)));
    $('spin').addEventListener('click', () => {
      spinning = !spinning;
      spinUI();
    });
    $('lighting').addEventListener('click', () => {
      const night = $('lighting').getAttribute('aria-pressed') !== 'true';
      $('lighting').setAttribute('aria-pressed', String(night));
      $('lighting').textContent = night ? '均匀照明' : '昼夜照明';
      ambient.intensity = night ? 0.09 : 1.1;
      key.intensity = night ? 3 : 2.7;
    });
    $('reset').addEventListener('click', () => reset());
    let w = 0,
      h = 0;
    new ResizeObserver(() => {
      const nw = mount.clientWidth,
        nh = mount.clientHeight;
      if (!nw || !nh || (w === nw && h === nh)) return;
      w = nw;
      h = nh;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
      reset(true);
    }).observe(mount);
    if ('IntersectionObserver' in window)
      new IntersectionObserver((entries) => (visible = entries[0].isIntersecting), {
        rootMargin: '100px',
      }).observe(stage);
    reduced.addEventListener('change', () => {
      if (reduced.matches) {
        spinning = false;
        spinUI();
        reset(true);
      }
    });
    renderer.domElement.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      fail('WebGL context lost; reload to restore');
    });
    const loader = new THREE.TextureLoader(),
      textures = {};
    for (const [id, m] of Object.entries(window.SATURN_MODELS))
      textures[id] = m.textures.map(
        (url) =>
          new Promise((resolve, reject) =>
            loader.load(
              url,
              (texture) => {
                texture.colorSpace = THREE.SRGBColorSpace;
                texture.flipY = false;
                texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
                resolve(texture);
              },
              undefined,
              reject,
            ),
          ),
      );
    Promise.all(
      materialRecords.map(async (rec) => {
        const texture = await textures[rec.id][rec.index];
        rec.mat.map = texture;
        rec.mat.needsUpdate = true;
      }),
    )
      .then(() => {
        if (failed) return;
        profile();
        updateBodies();
        spinUI();
        reset(true);
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
      acc = 0;
    function frame(now) {
      requestAnimationFrame(frame);
      const dt = Math.min((now - last) / 1000, 0.06);
      last = now;
      if (!ready || failed || !visible || document.hidden) {
        acc = 0;
        return;
      }
      acc += dt;
      if (acc < 1 / 35) return;
      const step = acc;
      acc = 0;
      if (spinning) day += step * 0.025;
      updateBodies();
      if (flight) {
        const f = flight;
        f.t += step;
        const t = Math.min(f.t / 1.3, 1),
          s = t * t * (3 - 2 * t),
          q = new THREE.Quaternion().slerp(f.turn, s);
        camera.position
          .copy(f.dir)
          .applyQuaternion(q)
          .multiplyScalar(f.from + (f.to - f.from) * s);
        camera.lookAt(0, 0, 0);
        if (t === 1) {
          flight = null;
          controls.enableDamping = true;
        }
      }
      controls.update();
      renderer.render(scene, camera);
      for (const id of moonIds) {
        const label = $(id + '-label');
        label.hidden = selected !== 'system';
        if (label.hidden) continue;
        const p = moonGroups[id].getWorldPosition(new THREE.Vector3()).project(camera),
          x = (p.x * 0.5 + 0.5) * w,
          y = (-p.y * 0.5 + 0.5) * h;
        label.hidden = p.z > 1 || p.z < -1 || x < 0 || x > w || y < 0 || y > h;
        if (!label.hidden)
          label.style.transform =
            'translate(' +
            Math.max(6, Math.min(w - label.offsetWidth - 6, x + 8)) +
            'px,' +
            Math.max(8, y - 28) +
            'px)';
      }
    }
    requestAnimationFrame(frame);
    window.SaturnView = {
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
          extent: extent(),
          distance: camera.position.length(),
          target: controls.target.toArray(),
          moons: moonIds.map((id) => ({
            id,
            angle: moonGroups[id].rotation.y,
            position: moonGroups[id].position.toArray(),
          })),
        };
      },
    };
  } catch (error) {
    fail(error);
  }
})();
