(function () {
  'use strict';
  const $ = (id) => document.getElementById(id),
    stage = $('model-stage'),
    mount = $('model-mount'),
    status = $('model-status');
  const { bodies, moons, RJ, positionAt } = window.Jovian,
    clock = window.JupiterApp.clock;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let ready = false,
    failed = false,
    visible = true,
    selected = 'jupiter',
    renderer,
    controls,
    transition = null;
  function fail(error) {
    failed = true;
    ready = false;
    $('model-loading').hidden = true;
    $('model-fallback').hidden = false;
    status.textContent = '三维视图不可用';
    status.classList.remove('ready');
    ['rotate-model', 'light-model', 'reset-model'].forEach((id) => ($(id).disabled = true));
    console.warn('Jupiter model:', error);
  }
  try {
    if (!window.THREE || !window.OrbitControls || !window.JOVIAN_TEXTURES)
      throw new Error('Local libraries or textures missing');
    const scene = new THREE.Scene(),
      camera = new THREE.PerspectiveCamera(37, 1, 0.001, 500);
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'low-power',
    });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.6));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    mount.appendChild(renderer.domElement);
    renderer.domElement.setAttribute(
      'aria-label',
      '木星及四颗伽利略卫星三维模型，可拖动旋转和缩放',
    );
    const ambient = new THREE.AmbientLight(0xfff7e8, 0.5),
      key = new THREE.DirectionalLight(0xfff7e8, 2.6),
      fill = new THREE.DirectionalLight(0xc5d7e3, 0.2);
    key.position.set(-30, 20, 40);
    fill.position.set(35, 4, -30);
    scene.add(ambient, key, fill);
    const meshes = {},
      rings = [],
      labels = {};
    Object.entries(bodies).forEach(([id, b]) => {
      const radius = id === 'jupiter' ? 1 : b.radius / RJ;
      const material = new THREE.MeshStandardMaterial({
        roughness: 1,
        metalness: 0,
        color: 0xffffff,
      });
      let geometry;
      if (id === 'jupiter') {
        const source = window.JUPITER_GEOMETRY;
        if (!source) throw new Error('Jupiter geometry missing');
        geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(source.positions, 3));
        geometry.setAttribute('normal', new THREE.Float32BufferAttribute(source.normals, 3));
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(source.uv, 2));
        geometry.setIndex(source.indices);
      } else geometry = new THREE.SphereGeometry(radius, 80, 56);
      const mesh = new THREE.Mesh(geometry, material);
      if (id === 'jupiter') mesh.rotation.y = -1.1;
      meshes[id] = mesh;
      scene.add(mesh);
    });
    moons.forEach((id) => {
      const b = bodies[id],
        radius = b.orbit / RJ,
        points = [];
      for (let i = 0; i <= 240; i++) {
        const angle = (i / 240) * Math.PI * 2;
        points.push(new THREE.Vector3(radius * Math.cos(angle), 0, -radius * Math.sin(angle)));
      }
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(points),
        new THREE.LineBasicMaterial({ color: b.color, transparent: true, opacity: 0.38 }),
      );
      line.visible = false;
      scene.add(line);
      rings.push(line);
      const label = document.createElement('button');
      label.type = 'button';
      label.dataset.view = id;
      label.textContent = b.name;
      label.setAttribute('aria-label', '靠近观察' + b.name);
      label.style.setProperty('--moon-color', b.color);
      $('model-labels').append(label);
      labels[id] = label;
    });
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.enablePan = false;
    controls.rotateSpeed = 0.65;
    controls.zoomSpeed = 0.7;
    controls.autoRotate = !reduced.matches;
    controls.autoRotateSpeed = 0.35;
    let savedRotate = controls.autoRotate;
    const viewDirection = new THREE.Vector3(0, 0.48, 1).normalize();
    function radiusFor(id) {
      return id === 'system'
        ? bodies.callisto.orbit / RJ
        : id === 'jupiter'
          ? 1
          : bodies[id].radius / RJ;
    }
    function targetFor(id) {
      return id === 'system' ? new THREE.Vector3() : meshes[id].position.clone();
    }
    function finishLimits() {
      const r = radiusFor(selected);
      controls.minDistance = selected === 'system' ? 7 : r * 1.45;
      controls.maxDistance = selected === 'system' ? 230 : r * 14;
      camera.near = selected === 'system' ? 0.01 : r * 0.015;
      camera.updateProjectionMatrix();
    }
    function finishFlight() {
      transition = null;
      finishLimits();
      controls.enabled = true;
      controls.enableDamping = true;
      controls.autoRotate = savedRotate && !reduced.matches;
      $('rotate-model').disabled = false;
      rotateLabel();
    }
    function focus(id, immediate = false) {
      if (id !== 'system' && !meshes[id]) return;
      const fromId = selected;
      if (!transition) savedRotate = controls.autoRotate;
      controls.autoRotate = false;
      controls.enabled = false;
      controls.enableDamping = false;
      controls.update();
      $('rotate-model').disabled = true;
      selected = id;
      const isSystem = id === 'system';
      $('model-labels').hidden = !isSystem || failed;
      rings.forEach((r) => (r.visible = isSystem));
      const target = targetFor(id),
        r = radiusFor(id),
        halfAngle = Math.min(
          THREE.MathUtils.degToRad(18.5),
          Math.atan(Math.tan(THREE.MathUtils.degToRad(18.5)) * camera.aspect),
        );
      const distance = (r / Math.sin(halfAngle)) * (isSystem ? 1.11 : 1.17);
      if (immediate || reduced.matches || !ready) {
        camera.position.copy(target).addScaledVector(viewDirection, distance);
        controls.target.copy(target);
        camera.lookAt(target);
        finishFlight();
      } else {
        // Keep every body at its existing size and position. As in the Mars
        // scene, retreat before transferring a close-up, then zoom in gradually.
        const fromPos = camera.position.clone(),
          fromTarget = controls.target.clone(),
          fromDistance = Math.max(fromPos.distanceTo(fromTarget), 0.000001);
        controls.minDistance = 0;
        controls.maxDistance = 500;
        camera.near = Math.min(0.01, radiusFor(fromId) * 0.015, r * 0.015);
        camera.updateProjectionMatrix();
        const fromDirection = fromPos.sub(fromTarget).normalize();
        transition = {
          fromTarget,
          target,
          fromDistance,
          toDistance: distance,
          fromDirection,
          turn: new THREE.Quaternion().setFromUnitVectors(fromDirection, viewDirection),
          elapsed: 0,
          retreat: fromId !== 'system' && fromId !== id,
          escapeDistance: Math.max(fromDistance * 1.35, distance * 1.15, 3.6),
        };
      }
    }
    function updatePositions(day) {
      for (const id of moons) {
        const p = positionAt(id, day);
        meshes[id].position.set(p.x, p.y, p.z);
        meshes[id].rotation.y = p.angle;
      }
      if (transition) transition.target.copy(targetFor(selected));
      else if (selected !== 'system' && selected !== 'jupiter') {
        const next = targetFor(selected),
          shift = next.clone().sub(controls.target);
        camera.position.add(shift);
        controls.target.copy(next);
      }
    }
    clock.subscribe(updatePositions);
    let oldW = 0,
      oldH = 0;
    function resize() {
      const w = mount.clientWidth,
        h = mount.clientHeight;
      if (!w || !h || (w === oldW && h === oldH)) return;
      oldW = w;
      oldH = h;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      focus(selected, true);
    }
    new ResizeObserver(resize).observe(mount);
    resize();
    window.JupiterView = {
      focus: (id) => focus(id),
      get selected() {
        return selected;
      },
      get ready() {
        return ready;
      },
    };
    window.JupiterApp.selectView('jupiter');
    function rotateLabel() {
      const auto = controls.autoRotate;
      $('rotate-model').setAttribute('aria-pressed', String(auto));
      $('rotate-model').textContent = auto ? '暂停环绕' : '自动环绕';
    }
    $('rotate-model').addEventListener('click', () => {
      controls.autoRotate = !controls.autoRotate;
      rotateLabel();
    });
    rotateLabel();
    reduced.addEventListener('change', () => {
      if (reduced.matches) {
        controls.autoRotate = false;
        savedRotate = false;
        if (transition) focus(selected, true);
        rotateLabel();
      }
    });
    let uniform = false;
    $('light-model').addEventListener('click', () => {
      uniform = !uniform;
      ambient.intensity = uniform ? 2.1 : 0.5;
      key.intensity = uniform ? 0.5 : 2.6;
      $('light-model').setAttribute('aria-pressed', String(uniform));
      $('light-model').textContent = uniform ? '定向照明' : '均匀照明';
    });
    $('reset-model').addEventListener('click', () => focus(selected));
    renderer.domElement.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      fail('WebGL context lost');
    });
    new IntersectionObserver(
      (entries) => {
        visible = entries[0].isIntersecting;
      },
      { rootMargin: '100px' },
    ).observe(stage);
    let completed = 0;
    const loader = new THREE.TextureLoader();
    Promise.all(
      Object.keys(bodies).map(
        (id) =>
          new Promise((resolve, reject) =>
            loader.load(
              window.JOVIAN_TEXTURES[id],
              (texture) => {
                texture.colorSpace = THREE.SRGBColorSpace;
                if (id === 'jupiter') texture.flipY = false;
                texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
                meshes[id].material.map = texture;
                meshes[id].material.needsUpdate = true;
                completed++;
                status.textContent = `已准备 ${completed} / 5 个天体`;
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
        renderer.render(scene, camera);
        ready = true;
        mount.classList.add('ready');
        $('model-loading').hidden = true;
        status.textContent = '5 个天体已就绪';
        status.classList.add('ready');
      })
      .catch(fail);
    let last = 0,
      lastRender = 0;
    function draw(now) {
      requestAnimationFrame(draw);
      if (!ready || failed || !visible || document.hidden) {
        last = 0;
        return;
      }
      if (now - lastRender < 25) return;
      lastRender = now;
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
      last = now;
      if (transition) {
        const f = transition;
        f.elapsed += dt;
        const t = Math.min(1, f.elapsed / 1.55),
          ease = (x) => x * x * (3 - 2 * x),
          clamp = (x) => Math.max(0, Math.min(1, x));
        const travel = f.retreat ? ease(clamp((t - 0.36) / 0.36)) : ease(Math.min(1, t / 0.72));
        const zoom = f.retreat ? ease(clamp((t - 0.54) / 0.46)) : ease(clamp((t - 0.28) / 0.72));
        controls.target.lerpVectors(f.fromTarget, f.target, travel);
        const turn = new THREE.Quaternion().slerpQuaternions(
          new THREE.Quaternion(),
          f.turn,
          ease(f.retreat ? Math.min(1, t / 0.36) : t),
        );
        const direction = f.fromDirection.clone().applyQuaternion(turn);
        const distance = f.retreat
          ? t < 0.36
            ? f.fromDistance + (f.escapeDistance - f.fromDistance) * ease(t / 0.36)
            : Math.exp(Math.log(f.escapeDistance) * (1 - zoom) + Math.log(f.toDistance) * zoom)
          : Math.exp(Math.log(f.fromDistance) * (1 - zoom) + Math.log(f.toDistance) * zoom);
        camera.position.copy(controls.target).addScaledVector(direction, distance);
        camera.lookAt(controls.target);
        if (t === 1) finishFlight();
      } else controls.update();
      renderer.render(scene, camera);
      if (selected === 'system') {
        const left = mount.offsetLeft,
          top = mount.offsetTop,
          w = mount.clientWidth,
          h = mount.clientHeight,
          occupied = [];
        for (const id of moons) {
          const p = meshes[id].position.clone().project(camera),
            label = labels[id];
          const shown = p.z >= -1 && p.z <= 1 && Math.abs(p.x) < 1 && Math.abs(p.y) < 1;
          label.hidden = !shown;
          if (!shown) continue;
          let x = left + ((p.x + 1) * w) / 2,
            y = top + ((1 - p.y) * h) / 2 - 19;
          for (const other of occupied) {
            if (Math.abs(other.x - x) < 65 && Math.abs(other.y - y) < 29) y = other.y - 30;
          }
          x = Math.max(36, Math.min(stage.clientWidth - 36, x));
          y = Math.max(16, y);
          occupied.push({ x, y });
          label.style.left = x + 'px';
          label.style.top = y + 'px';
        }
      }
    }
    requestAnimationFrame(draw);
  } catch (error) {
    fail(error);
  }
})();
