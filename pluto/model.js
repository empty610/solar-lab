(() => {
  'use strict';
  const $ = (id) => document.getElementById(id),
    stage = $('model-stage'),
    mount = $('model-mount'),
    status = $('model-status'),
    reduced = matchMedia('(prefers-reduced-motion: reduce)');
  // Keep the authored HTML, including links and paragraph formatting, on return.
  const authoredProfile = [
    'profile-title',
    'profile-copy',
  ].map((id) => [id, [...$(id).childNodes].map((node) => node.cloneNode(true))]);
  const profiles = {
    pluto: {
      word: 'PLUTO',
      kicker: 'AN ICY WORLD, STILL CHANGING',
      title: [...$('profile-title').childNodes]
        .map((node) => node.nodeName === 'BR' ? '\n' : node.textContent).join('').trim(),
      copy: $('profile-copy').textContent.trim(),
      facts: [
        ['直径', '2,377', 'km'],
        ['自转一周', '6.4', '地球日'],
        ['天体分类', '矮行星', ''],
      ],
    },
    charon: {
      word: 'CHARON',
      kicker: 'THE OTHER HALF OF THE DANCE',
      title: '一位几乎有你\n一半大的同行者。',
      copy: '冥卫一是冥王星最大的卫星。暗红色的北极区、峡谷与不同的冰，让这颗灰白色小世界有着独立的面貌。拖动模型，沿着它的表面走一圈。',
      facts: [
        ['直径', '1,214', 'km'],
        ['公转一周', '6.4', '地球日'],
        ['发现年份', '1978', '年'],
      ],
    },
    system: {
      word: 'A SHARED ORBIT',
      kicker: 'TWO WORLDS, ONE CENTER',
      title: '围绕同一个中心，\n一起转过漫长的夜。',
      copy: '两颗天体都围绕共同质心运动。这里保留大小和中心距离的比例，因此它们看起来相隔很远。拖动改变观察角度，或缩放到更近处。',
      facts: [
        ['中心距离', '19,640', 'km'],
        ['直径之比', '≈ 1.96 : 1', ''],
        ['相伴周期', '6.4', '地球日'],
      ],
    },
  };
  let view = 'pluto',
    spinning = !reduced.matches,
    night = false,
    phase = 0,
    ready = false,
    failed = false,
    viewportWidth = 0,
    viewportHeight = 0,
    dirty = true;
  let renderer, scene, camera, controls, pluto, charon, orbit, ambient, sun, grid;
  let animate;
  let modelLoop, textureSet;
  function syncAnimation() {
    modelLoop?.invalidate();
  }
  function spinFeedback() {
    const b = $('model-spin');
    b.textContent = spinning
      ? view === 'system'
        ? '暂停公转'
        : '暂停自转'
      : view === 'system'
        ? '开始公转'
        : '开始自转';
    b.setAttribute('aria-pressed', String(spinning));
  }
  function fallback() {
    if (failed) return;
    failed = true;
    modelLoop?.dispose();
    textureSet?.dispose();
    if (scene) ModelRuntime.disposeScene(scene, renderer, controls);
    ready = false;
    if (controls) controls.enabled = false;
    mount.hidden = true;
    for (const id of ['pluto-label', 'charon-label', 'bary-label']) $(id).hidden = true;
    syncAnimation();
    stage.dataset.ready = 'false';
    $('model-loading').hidden = true;
    $('model-fallback').hidden = false;
    status.textContent = '图文浏览模式';
    status.classList.remove('ready');
    stage.querySelector('.model-hint').hidden = true;
    document.querySelectorAll('[data-view],.button-row button').forEach((b) => (b.disabled = true));
  }
  function profile() {
    const p = profiles[view];
    $('model-word').textContent = p.word;
    $('profile-kicker').textContent = p.kicker;
    $('profile-title').replaceChildren(
      ...p.title
        .split('\n')
        .flatMap((s, i) =>
          i
            ? [document.createElement('br'), document.createTextNode(s)]
            : [document.createTextNode(s)],
        ),
    );
    $('profile-copy').textContent = p.copy;
    if (view === 'pluto') {
      for (const [elementId, nodes] of authoredProfile)
        $(elementId).replaceChildren(...nodes.map((node) => node.cloneNode(true)));
    }
    $('profile-facts').replaceChildren(
      ...p.facts.map(([label, value, unit]) => {
        const div = document.createElement('div'),
          dt = document.createElement('dt'),
          dd = document.createElement('dd'),
          small = document.createElement('small');
        dt.textContent = label;
        dd.textContent = value + ' ';
        small.textContent = unit;
        dd.append(small);
        div.append(dt, dd);
        return div;
      }),
    );
    $('view-note').textContent =
      view === 'system'
        ? '大小与中心距离按比例 · 圆轨道、初始朝向和加速周期为示意'
        : '影像拼接与可视化照明 · 自转速度经过加快';
    document
      .querySelectorAll('[data-view]')
      .forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === view)));
    spinFeedback();
  }
  function fittedDistance() {
    const halfFov = Math.atan(Math.tan((camera.fov * Math.PI) / 360) * Math.min(1, camera.aspect));
    const extent = view === 'system' ? 15.8 : 1.08;
    return (extent / Math.sin(halfFov)) * 1.1;
  }
  function fit() {
    if (!camera) return;
    // Clear the small damping remainder before applying an explicit reset.
    controls.enableDamping = false;
    controls.update();
    const dist = fittedDistance();
    camera.position.set(0, dist * (view === 'system' ? 0.65 : 0.12), dist);
    controls.target.set(0, 0, 0);
    controls.minDistance = view === 'system' ? 3 : 1.65;
    controls.maxDistance = dist * 2.8;
    controls.update();
    controls.enableDamping = true;
    dirty = true;
  }
  function positions() {
    if (!pluto) return;
    if (view === 'system') {
      const r1 = 1.797,
        r2 = 14.728;
      pluto.position.set(-r1, 0, 0);
      charon.position.set(r2, 0, 0);
      pluto.scale.setScalar(1);
      charon.scale.setScalar(1214 / 2377);
      pluto.rotation.y = 0.7;
      charon.rotation.y = -1.3;
      orbit.rotation.y = phase;
      grid.visible = true;
    } else {
      pluto.position.set(0, 0, 0);
      charon.position.set(0, 0, 0);
      pluto.scale.setScalar(1);
      charon.scale.setScalar(1);
      orbit.rotation.y = 0;
      (view === 'pluto' ? pluto : charon).rotation.y = 0.7 + phase;
      grid.visible = false;
    }
    pluto.visible = view !== 'charon';
    charon.visible = view !== 'pluto';
  }
  function setView(next) {
    if (!profiles[next] || !ready) return;
    view = next;
    phase = 0;
    profile();
    positions();
    fit();
    render();
  }
  function resize() {
    if (!renderer || failed) return;
    const width = stage.clientWidth, height = stage.clientHeight;
    if (!width || !height || (width === viewportWidth && height === viewportHeight)) return;
    const initial = !viewportWidth;
    const previousDistance = fittedDistance();
    viewportWidth = width;
    viewportHeight = height;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    if (initial) fit();
    else {
      // Preserve the user's viewing direction and zoom relative to the fitted view.
      const distance = fittedDistance();
      camera.position
        .sub(controls.target)
        .multiplyScalar(distance / previousDistance)
        .add(controls.target);
      controls.maxDistance = distance * 2.8;
      controls.update();
      dirty = true;
    }
    if (ready) render();
  }
  function placeLabel(id, object, yOffset) {
    const label = $(id);
    label.hidden = view !== 'system';
    if (label.hidden) return;
    const p = object ? object.getWorldPosition(new THREE.Vector3()) : new THREE.Vector3();
    p.project(camera);
    label.style.transform =
      'translate(' +
      ((p.x + 1) * stage.clientWidth) / 2 +
      'px,' +
      (((1 - p.y) * stage.clientHeight) / 2 + yOffset) +
      'px) translateX(-50%)';
    label.hidden = p.z > 1 || p.z < -1;
  }
  function render() {
    renderer.render(scene, camera);
    placeLabel('pluto-label', pluto, 30);
    placeLabel('charon-label', charon, 22);
    placeLabel('bary-label', null, -30);
    dirty = false;
    stage.dataset.rendered = 'true';
  }
  async function init() {
    try {
      if (!window.ModelRuntime || !window.THREE || !window.OrbitControls || !window.PLUTO_MODELS)
        throw new Error('Missing local model assets');
      const T = THREE;
      scene = new T.Scene();
      renderer = new T.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
      renderer.outputColorSpace = T.SRGBColorSpace;
      renderer.toneMapping = T.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.02;
      mount.append(renderer.domElement);
      renderer.domElement.setAttribute(
        'aria-label',
        '可拖动的冥王星三维模型；使用上方按钮切换天体',
      );
      renderer.domElement.addEventListener('webglcontextlost', (event) => {
        event.preventDefault();
        fallback();
      });
      camera = new T.PerspectiveCamera(34, 1, 0.02, 250);
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.075;
      controls.enablePan = false;
      controls.rotateSpeed = 0.65;
      controls.zoomSpeed = 0.65;
      modelLoop = ModelRuntime.loop({ element: stage, fps: 30, draw: (step) => animate(step) });
      modelLoop.bind(controls);
      textureSet = ModelRuntime.textures(T, renderer);
      controls.addEventListener('change', () => {
        dirty = true;
      });
      ambient = new T.AmbientLight(0xf1eee7, 1.15);
      scene.add(ambient);
      sun = new T.DirectionalLight(0xfff3df, 2.6);
      sun.position.set(-8, 7, 12);
      scene.add(sun);
      orbit = new T.Group();
      scene.add(orbit);
      async function mesh(id) {
        const m = PLUTO_MODELS[id];
        const tex = await textureSet.load(m.texture, { flipY: false });
        if (failed || !tex) return null;
        const g = new T.BufferGeometry();
        g.setAttribute('position', new T.Float32BufferAttribute(m.positions, 3));
        g.setAttribute('normal', new T.Float32BufferAttribute(m.normals, 3));
        g.setAttribute('uv', new T.Float32BufferAttribute(m.uv, 2));
        g.setIndex(m.indices);
        g.applyQuaternion(new T.Quaternion(...m.rotation));
        const body = new T.Mesh(g, new T.MeshStandardMaterial({ map: tex, roughness: 1 }));
        orbit.add(body);
        return body;
      }
      [pluto, charon] = await Promise.all([mesh('pluto'), mesh('charon')]);
      if (failed) return;
      grid = new T.Group();
      scene.add(grid);
      for (const radius of [1.797, 14.728]) {
        const points = Array.from(
          { length: 129 },
          (_, i) =>
            new T.Vector3(
              radius * Math.cos((i / 128) * Math.PI * 2),
              0,
              radius * Math.sin((i / 128) * Math.PI * 2),
            ),
        );
        const line = new T.LineLoop(
          new T.BufferGeometry().setFromPoints(points),
          new T.LineBasicMaterial({ color: 0xbca78a, transparent: true, opacity: 0.35 }),
        );
        grid.add(line);
      }
      grid.add(
        new T.Mesh(
          new T.SphereGeometry(0.08, 16, 12),
          new T.MeshBasicMaterial({ color: 0x9e7f5b }),
        ),
      );
      ready = true;
      stage.dataset.ready = 'true';
      $('model-loading').hidden = true;
      status.textContent = '模型已就绪 · 可自由观察';
      status.classList.add('ready');
      profile();
      positions();
      resize();
      new ResizeObserver(resize).observe(stage);
      animate = function frame(step) {
        if (spinning) {
          phase += step * 0.11;
          positions();
          dirty = true;
        }
        const moved = controls.update();
        if (dirty) render();
        return spinning || moved;
      };
      modelLoop.start();
    } catch (error) {
      console.warn('3D view unavailable:', error.message);
      fallback();
    }
  }
  document
    .querySelectorAll('[data-view]')
    .forEach((b) => b.addEventListener('click', () => setView(b.dataset.view)));
  $('model-spin').addEventListener('click', () => {
    spinning = !spinning;
    spinFeedback();
    syncAnimation();
  });
  $('model-reset').addEventListener('click', () => {
    if (!ready) return;
    phase = 0;
    positions();
    fit();
    render();
  });
  $('model-light').addEventListener('click', () => {
    if (!ready) return;
    night = !night;
    ambient.intensity = night ? 0.09 : 1.15;
    sun.intensity = night ? 2.1 : 2.6;
    $('model-light').textContent = night ? '均匀照明' : '昼夜照明';
    $('model-light').setAttribute('aria-pressed', String(night));
    render();
  });
  reduced.addEventListener('change', () => {
    if (reduced.matches) {
      spinning = false;
      spinFeedback();
    }
  });

  window.PlutoObservatory = {
    setView,
    get state() {
      return { ready, view, spinning, night, phase };
    },
  };
  init();
})();
