(function () {
  'use strict';
  const $ = (id) => document.getElementById(id),
    stage = $('model-stage'),
    mount = $('model-mount'),
    status = $('model-status');
  const { bodies, moons, RJ, positionAt } = window.EuropaData,
    clock = window.EuropaApp.clock;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let ready = false,
    failed = false,
    visible = true,
    selected = 'europa',
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
    window.EuropaUI?.camera(selected, 'error');
    console.warn('Europa model:', error);
  }
  try {
    if (!window.THREE || !window.OrbitControls || !window.EUROPA_TEXTURES)
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
      '木卫二与木星三维模型，可拖动或用方向键转动，加减键缩放，0 键复位',
    );
    renderer.domElement.setAttribute('tabindex', '0');
    renderer.domElement.setAttribute('aria-describedby', 'view-tip');
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
    function createLabel(id) {
      const b = bodies[id],
        label = document.createElement('button');
      label.type = 'button';
      label.dataset.view = id;
      label.textContent = b.name + ' ↗';
      label.setAttribute('aria-label', '靠近观察' + b.name);
      label.style.setProperty('--moon-color', b.color);
      $('model-labels').append(label);
      labels[id] = label;
    }
    createLabel('jupiter');
    moons.forEach((id) => {
      const b = bodies[id],
        points = [];
      for (let i = 0; i <= 240; i++) {
        const p = positionAt(id, (b.period * i) / 240);
        points.push(new THREE.Vector3(p.x, p.y, p.z));
      }
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(points),
        new THREE.LineBasicMaterial({ color: b.color, transparent: true, opacity: 0.38 }),
      );
      line.visible = false;
      scene.add(line);
      rings.push(line);
      createLabel(id);
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
        ? (bodies.europa.orbit * (1 + window.EuropaData.eccentricity)) / RJ
        : id === 'jupiter'
          ? 1
          : bodies[id].radius / RJ;
    }
    function targetFor(id) {
      return id === 'system' ? new THREE.Vector3() : meshes[id].position.clone();
    }
    function finishLimits() {
      const r = radiusFor(selected);
      controls.minDistance = selected === 'system' ? 2 : r * 1.45;
      controls.maxDistance = selected === 'system' ? 140 : r * 14;
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
      $('reset-model').disabled = false;
      rotateLabel();
      if (ready && !failed) window.EuropaUI?.camera(selected, 'ready');
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
        $('reset-model').disabled = true;
        window.EuropaUI?.camera(id, 'flying');
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
        meshes[id].rotation.y = p.spin;
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
      // A full-system view widens the canvas. Preserve its active flight,
      // adjusting the destination framing for the new aspect ratio.
      if (transition) {
        const halfAngle = Math.min(
          THREE.MathUtils.degToRad(18.5),
          Math.atan(Math.tan(THREE.MathUtils.degToRad(18.5)) * camera.aspect),
        );
        transition.toDistance =
          (radiusFor(selected) / Math.sin(halfAngle)) * (selected === 'system' ? 1.11 : 1.17);
      } else focus(selected, true);
    }
    new ResizeObserver(resize).observe(mount);
    resize();
    window.EuropaView = {
      focus: (id) => focus(id),
      get selected() {
        return selected;
      },
      get ready() {
        return ready;
      },
    };
    window.EuropaApp.selectView('europa');
    function rotateLabel() {
      const auto = controls.autoRotate;
      $('rotate-model').setAttribute('aria-pressed', String(auto));
      $('rotate-model').textContent = auto ? '暂停环绕' : '自动环绕';
    }
    $('rotate-model').addEventListener('click', () => {
      controls.autoRotate = !controls.autoRotate;
      rotateLabel();
      window.EuropaApp.feedback?.(
        controls.autoRotate
          ? '自动环绕已开启。可以随时暂停观察细节。'
          : '自动环绕已暂停。拖动或用方向键转动画面。',
      );
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
      window.EuropaApp.feedback?.(
        uniform ? '已开启均匀照明，便于观察整体纹理。' : '已恢复定向照明，明暗变化呈现球体形状。',
      );
    });
    $('reset-model').addEventListener('click', () => focus(selected));
    renderer.domElement.addEventListener('keydown', (event) => {
      if (event.ctrlKey || event.metaKey || event.altKey || !ready || failed || !controls.enabled)
        return;
      const key = event.key;
      if (
        !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '=', '-', '_', '0'].includes(key)
      )
        return;
      event.preventDefault();
      if (key === '0') {
        focus(selected);
        return;
      }
      controls.autoRotate = false;
      savedRotate = false;
      controls.enableDamping = false;
      controls.update();
      const sphere = new THREE.Spherical().setFromVector3(
          camera.position.clone().sub(controls.target),
        ),
        step = event.shiftKey ? 0.24 : 0.12;
      if (key === 'ArrowLeft') sphere.theta -= step;
      if (key === 'ArrowRight') sphere.theta += step;
      if (key === 'ArrowUp') sphere.phi -= step;
      if (key === 'ArrowDown') sphere.phi += step;
      sphere.phi = THREE.MathUtils.clamp(sphere.phi, 0.08, Math.PI - 0.08);
      if (key === '+' || key === '=') sphere.radius *= 0.85;
      if (key === '-' || key === '_') sphere.radius *= 1.15;
      sphere.radius = THREE.MathUtils.clamp(
        sphere.radius,
        controls.minDistance,
        controls.maxDistance,
      );
      camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(sphere));
      camera.lookAt(controls.target);
      controls.update();
      controls.enableDamping = true;
      rotateLabel();
      window.EuropaApp.feedback?.(
        key.startsWith('Arrow')
          ? '视角已转动，自动环绕已暂停。'
          : '观察距离已调整。按 0 可以复位视角。',
      );
    });
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
              window.EUROPA_TEXTURES[id],
              (texture) => {
                texture.colorSpace = THREE.SRGBColorSpace;
                if (id === 'jupiter') texture.flipY = false;
                texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
                meshes[id].material.map = texture;
                meshes[id].material.needsUpdate = true;
                completed++;
                status.textContent = `已准备 ${completed} / 2 个天体`;
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
        status.textContent = '三维模型已就绪';
        status.classList.add('ready');
        window.EuropaUI?.camera(selected, 'ready');
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
        for (const id of Object.keys(labels)) {
          const p = meshes[id].position.clone().project(camera),
            label = labels[id];
          const shown = p.z >= -1 && p.z <= 1 && Math.abs(p.x) < 1 && Math.abs(p.y) < 1;
          label.hidden = !shown;
          if (!shown) continue;
          const radius = id === 'jupiter' ? 1 : bodies[id].radius / RJ,
            pixels =
              ((radius / camera.position.distanceTo(meshes[id].position)) * h) /
              (2 * Math.tan(THREE.MathUtils.degToRad(18.5)));
          let x = left + ((p.x + 1) * w) / 2,
            y = top + ((1 - p.y) * h) / 2 - Math.max(23, pixels + 18);
          for (const other of occupied) {
            if (Math.abs(other.x - x) < 82 && Math.abs(other.y - y) < 38) y = other.y - 38;
          }
          x = Math.max(46, Math.min(stage.clientWidth - 46, x));
          y = Math.max(22, y);
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
