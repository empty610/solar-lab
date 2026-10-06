(function () {
  'use strict';
  const $ = (id) => document.getElementById(id),
    { bodies, moons, positionAt, end } = window.Jovian;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let day = 0,
    playing = false,
    speed = 0.5,
    last = 0;
  const subscribers = new Set();
  const svgNS = 'http://www.w3.org/2000/svg';
  const orbitDots = {},
    counts = {};
  function svg(tag, attrs, parent) {
    const el = document.createElementNS(svgNS, tag);
    Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
    if (parent) parent.appendChild(el);
    return el;
  }
  moons.forEach((id) => {
    const body = bodies[id],
      radius = (body.orbit / 1882700) * 220;
    svg(
      'circle',
      {
        cx: 305,
        cy: 258,
        r: radius,
        fill: 'none',
        stroke: body.color,
        'stroke-width': 1,
        'stroke-opacity': 0.4,
      },
      $('orbit-rings'),
    );
    const g = svg('g', {}, $('orbit-dots'));
    svg(
      'circle',
      { r: id === 'europa' ? 6 : 4.7, fill: body.color, stroke: '#fff8e9', 'stroke-width': 1.5 },
      g,
    );
    const label = svg('text', { x: 0, y: -13, 'text-anchor': 'middle' }, g);
    label.textContent = body.name;
    orbitDots[id] = g;
    const row = document.createElement('div');
    row.className = 'orbit-reading';
    row.style.setProperty('--moon-color', body.color);
    const name = document.createElement('span');
    name.textContent = body.name + ' / ' + body.english;
    const countWrap = document.createElement('span'),
      count = document.createElement('strong'),
      unit = document.createElement('small');
    unit.textContent = ' 圈';
    countWrap.append(count, unit);
    row.append(name, countWrap);
    $('orbit-readings').append(row);
    counts[id] = count;
  });
  function renderTime() {
    $('time-slider').value = day;
    $('time-slider').setAttribute('aria-valuetext', `${day.toFixed(2)} 个地球日`);
    $('day-label').textContent = day.toFixed(2);
    for (const id of moons) {
      const p = positionAt(id, day),
        scale = (220 / 1882700) * Jovian.RJ;
      orbitDots[id].setAttribute(
        'transform',
        `translate(${305 + p.x * scale} ${258 + p.z * scale})`,
      );
      counts[id].textContent = (day / bodies[id].period).toFixed(2);
    }
    subscribers.forEach((fn) => fn(day));
  }
  function setPlaying(value) {
    playing = value;
    last = 0;
    $('play-orbits').textContent = playing ? '暂停轨道' : day >= end ? '重新播放' : '播放轨道';
    $('play-orbits').setAttribute('aria-pressed', String(playing));
  }
  const clock = {
    get day() {
      return day;
    },
    get playing() {
      return playing;
    },
    pause() {
      setPlaying(false);
    },
    setDay(value) {
      if (!Number.isFinite(value)) return;
      day = Math.max(0, Math.min(end, value));
      setPlaying(false);
      renderTime();
    },
    subscribe(fn) {
      subscribers.add(fn);
      fn(day);
      return () => subscribers.delete(fn);
    },
  };
  $('time-slider').addEventListener('input', (e) => clock.setDay(Number(e.target.value)));
  $('play-orbits').addEventListener('click', () => {
    if (day >= end && !playing) {
      day = 0;
      renderTime();
    }
    setPlaying(!playing);
  });
  $('reset-time').addEventListener('click', () => clock.setDay(0));
  $('orbit-speed').addEventListener('change', (e) => {
    speed = Number(e.target.value);
  });
  document.addEventListener('visibilitychange', () => {
    last = 0;
  });
  function tick(now) {
    if (playing && !document.hidden) {
      if (last) day = Math.min(end, day + Math.min((now - last) / 1000, 0.08) * speed);
      last = now;
      renderTime();
      if (day >= end) setPlaying(false);
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
  renderTime();
  function facts(items) {
    $('body-facts').replaceChildren();
    for (const [label, value, unit] of items) {
      const row = document.createElement('div'),
        dt = document.createElement('dt'),
        dd = document.createElement('dd'),
        small = document.createElement('small');
      dt.textContent = label;
      dd.textContent = value;
      small.textContent = unit;
      dd.append(small);
      row.append(dt, dd);
      $('body-facts').append(row);
    }
  }
  function selectView(id, scroll = false) {
    if (id !== 'system' && !bodies[id]) return;
    clock.pause();
    document
      .querySelectorAll('.view-switch [data-view]')
      .forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === id)));
    $('model-stage').classList.toggle('is-system', id === 'system');
    $('model-stage').classList.toggle('europa-view', id === 'europa');
    $('profile-europa').hidden = id !== 'europa';
    if (id === 'system') {
      facts([
        ['伽利略卫星', '4', '颗'],
        ['最外侧轨道半径', '188.27', '万 km'],
        ['木卫四周期', '16.689', '日'],
        ['距离与大小', '同一', '比例'],
      ]);
      $('model-caption').innerHTML =
        '拖动旋转 · 滚轮 / 双指缩放<br><small>点击标签靠近卫星 · 轨道由下方时间轴控制</small>';
    } else {
      const b = bodies[id];
      $('planet-lettering').textContent = b.english.toUpperCase();
      $('profile-kicker').textContent = b.type;
      $('profile-heading').innerHTML = b.heading;
      $('profile-summary').textContent = `${b.english} profile · ${b.name}档案`;
      $('profile-description').textContent = b.description;
      $('profile-feature').textContent = b.feature;
      $('model-caption').innerHTML =
        '拖动旋转 · 滚轮 / 双指缩放<br><small>NASA / JPL · ' +
        (id === 'jupiter' ? '云层' : '表面') +
        '拼接纹理</small>';
      $('fallback-image').src = id === 'jupiter' ? 'assets/great-red-spot.jpg' : `assets/${id}.jpg`;
      $('fallback-image').alt = b.name + (id === 'jupiter' ? '大红斑影像' : '全球拼接纹理');
      if (id === 'jupiter')
        facts([
          ['平均半径', '69,911', 'km'],
          ['自转周期', '9.9', '小时'],
          ['公转周期', '11.86', '地球年'],
          ['平均日距', '5.2', 'AU'],
        ]);
      else
        facts([
          ['平均半径', b.radius.toLocaleString('en-US', { maximumFractionDigits: 1 }), 'km'],
          ['平均轨道半径', (b.orbit / 10000).toFixed(2), '万 km'],
          ['公转周期', b.period.toFixed(3), '地球日'],
          ['潮汐锁定', '1 : 1', '自转 / 公转'],
        ]);
    }
    window.JupiterView?.focus(id);
    if (scroll) {
      $('observatory').scrollIntoView({
        behavior: reduced.matches ? 'auto' : 'smooth',
        block: 'start',
      });
      document.querySelector(`.view-switch [data-view="${id}"]`).focus({ preventScroll: true });
    }
  }
  document.addEventListener('click', (e) => {
    const target = e.target.closest('[data-view],[data-focus]');
    if (target)
      selectView(target.dataset.view || target.dataset.focus, Boolean(target.dataset.focus));
  });
  window.JupiterApp = { clock, selectView };

  const layers = {
    ice: {
      kicker: '01 / Ice shell',
      title: '一层会变形的冰',
      copy: '褐色线条标记裂纹、脊和不同材料。局部冰块似乎曾断裂、漂移并重新冻结，说明表面经历过更新；表层与海洋之间如何交换物质，仍有待查明。',
    },
    ocean: {
      kicker: '02 / Subsurface ocean',
      title: '海洋藏在磁场留下的线索里',
      copy: '伽利略号测到木卫二对木星变化磁场的响应。一个全球性的导电咸水层，是解释这些观测的重要模型。海洋的盐度、深度与具体分布仍不明确，需要多种独立测量交叉约束。',
    },
    rock: {
      kicker: '03 / Rocky interior',
      title: '水与岩石接触，能带来什么？',
      copy: '如果海底与温暖的岩石相接触，水岩反应可能提供化学能和物质。潮汐耗散与放射性衰变可为内部供热，但木卫二海底是否有活跃的热液系统，目前仍是待验证的问题。',
    },
    core: {
      kicker: '04 / Metallic core',
      title: '冰海之下，仍是一颗岩石世界',
      copy: '木卫二并非一颗完全由冰组成的球。内部结构模型通常包含岩石层与富含铁的金属核心；引力和磁场等观测可帮助约束分层，但剖面中的边界不是已经实测的精确形状。',
    },
  };
  const layerButtons = [...document.querySelectorAll('[data-layer]')];
  function selectLayer(id) {
    const l = layers[id];
    if (!l) return;
    layerButtons.forEach((b) => {
      const active = b.dataset.layer === id;
      b.setAttribute('aria-selected', String(active));
      b.tabIndex = active ? 0 : -1;
    });
    $('layer-kicker').textContent = l.kicker;
    $('layer-title').textContent = l.title;
    $('layer-copy').textContent = l.copy;
    $('layer-panel').setAttribute('aria-labelledby', 'tab-' + id);
    document.querySelectorAll('.cutaway>circle').forEach((circle, index) => {
      circle.setAttribute('stroke', index === Object.keys(layers).indexOf(id) ? '#dcaf6d' : 'none');
      circle.setAttribute('stroke-width', '3');
    });
  }
  layerButtons.forEach((button, index) => {
    button.addEventListener('click', () => selectLayer(button.dataset.layer));
    button.addEventListener('keydown', (e) => {
      let next;
      if (e.key === 'ArrowRight') next = (index + 1) % 4;
      else if (e.key === 'ArrowLeft') next = (index + 3) % 4;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = 3;
      else return;
      e.preventDefault();
      selectLayer(layerButtons[next].dataset.layer);
      layerButtons[next].focus();
    });
  });
  selectLayer('ice');
  const photos = {
    storm: {
      image: 'assets/great-red-spot.jpg',
      title: '木星的大红斑',
      kicker: 'Juno / 10 July 2017',
      description:
        '这幅影像由 Björn Jónsson 使用 JunoCam 数据处理，呈现接近人眼观察的色彩。大红斑是一场巨大而长寿的风暴，周围可见复杂的云带与旋涡。署名：NASA/JPL-Caltech/SwRI/MSSS/Björn Jónsson，CC BY-NC-SA；PIA21775。',
      source: 'https://science.nasa.gov/photojournal/jupiters-great-red-spot-in-true-color/',
    },
    europa: {
      image: 'assets/europa-global.jpg',
      title: '木卫二的冰封表面',
      kicker: 'Galileo / PIA19048',
      description:
        '利用伽利略号在 1990 年代后期获取的影像重新拼接与处理，尽量接近人眼所见的色彩。长距离裂纹与脊贯穿浅色冰面，部分区域的冰壳曾破碎并重新组合。署名：NASA/JPL-Caltech/SETI Institute。',
      source: 'https://science.nasa.gov/resource/europas-stunning-surface/',
    },
  };
  const dialog = $('photo-dialog');
  document.querySelectorAll('[data-photo]').forEach((button) =>
    button.addEventListener('click', () => {
      const p = photos[button.dataset.photo];
      $('dialog-image').src = p.image;
      $('dialog-image').alt = p.title;
      $('dialog-title').textContent = p.title;
      $('dialog-kicker').textContent = p.kicker;
      $('dialog-description').textContent = p.description;
      $('dialog-source').href = p.source;
      dialog.showModal();
      dialog.scrollTop = 0;
    }),
  );
  document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) {
      const r = dialog.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)
        dialog.close();
    }
  });
})();
