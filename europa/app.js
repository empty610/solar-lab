(function () {
  'use strict';
  const $ = (id) => document.getElementById(id),
    { bodies, positionAt, RJ, end, eccentricity } = window.EuropaData;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)'),
    subscribers = new Set();
  let day = 0,
    playing = false,
    speed = 0.3,
    last = 0;
  const feedback = (message) => window.EuropaUI.feedback(message);
  const plotScale = 220 / bodies.europa.orbit;
  $('orbit-path').setAttribute(
    'd',
    Array.from({ length: 241 }, (_, i) => {
      const p = positionAt('europa', (end * i) / 240);
      return (
        (i ? 'L' : 'M') +
        (305 + p.x * RJ * plotScale).toFixed(3) +
        ' ' +
        (258 + p.z * RJ * plotScale).toFixed(3)
      );
    }).join(' ') + ' Z',
  );
  const low = (1 + eccentricity) ** -3,
    high = (1 - eccentricity) ** -3;
  function renderTime() {
    const p = positionAt('europa', day),
      x = 305 + p.x * RJ * plotScale,
      y = 258 + p.z * RJ * plotScale;
    $('time-slider').value = day;
    $('time-slider').setAttribute('aria-valuetext', day.toFixed(2) + ' 个地球日');
    $('day-label').textContent = day.toFixed(2);
    $('europa-dot').setAttribute('transform', `translate(${x} ${y})`);
    $('face-mark').setAttribute('cx', -Math.cos(p.spin) * 5);
    $('face-mark').setAttribute('cy', Math.sin(p.spin) * 5);
    $('tidal-link').setAttribute('x1', '305');
    $('tidal-link').setAttribute('y1', '258');
    $('tidal-link').setAttribute('x2', x);
    $('tidal-link').setAttribute('y2', y);
    $('distance-label').textContent = Math.round(p.distance).toLocaleString('en-US') + ' km';
    $('tide-label').textContent = p.tide.toFixed(3) + ' ×';
    $('turn-label').textContent = (day / end).toFixed(2) + ' 圈';
    const stretch = 0.08 + (0.17 * (p.tide - low)) / (high - low);
    $('flex-ice').setAttribute('rx', 36 * (1 + stretch));
    $('flex-ice').setAttribute('ry', 36 / (1 + stretch));
    $('flex-cracks').setAttribute(
      'transform',
      `translate(110 58) scale(${1 + stretch} ${1 / (1 + stretch)}) translate(-110 -58)`,
    );
    document
      .querySelectorAll('[data-day]')
      .forEach((button) =>
        button.setAttribute(
          'aria-pressed',
          String(Math.abs(Number(button.dataset.day) - day) < 0.001),
        ),
      );
    const named =
      [
        ['近木点', 0],
        ['四分之一周', end / 4],
        ['远木点', end / 2],
        ['四分之三周', (end * 3) / 4],
      ].find(([, time]) => Math.abs(time - day) < 0.004) ||
      (end - day < 0.004 ? ['近木点 · 完成一周'] : null);
    $('phase-label').textContent = named ? named[0] : '公转途中';
    const diff = (p.tide - 1) * 100;
    $('tide-explanation').textContent =
      Math.abs(diff) < 0.05
        ? '当前潮汐作用接近平均距离处的参考值。'
        : '当前潮汐作用比平均距离处约' +
          (diff > 0 ? '强 ' : '弱 ') +
          Math.abs(diff).toFixed(1) +
          '%。观察距离如何随时间改变。';
    subscribers.forEach((fn) => fn(day));
  }
  function setPlaying(value) {
    playing = value;
    last = 0;
    $('play-orbits').textContent = playing ? '暂停轨道' : day >= end ? '重新播放' : '播放轨道';
    $('play-orbits').setAttribute('aria-pressed', String(playing));
    const state = playing
      ? '正在播放 · 二维与三维同步'
      : day >= end
        ? '一周已完成 · 可以重新播放'
        : '已暂停 · 可以拖动时间轴';
    if ($('orbit-state').textContent !== state) $('orbit-state').textContent = state;
  }
  const clock = {
    get day() {
      return day;
    },
    get playing() {
      return playing;
    },
    pause() {
      const wasPlaying = playing;
      setPlaying(false);
      if (wasPlaying)
        $('orbit-feedback').textContent = '切换观察视角后轨道已暂停，可回到演示继续播放。';
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
  $('time-slider').addEventListener('input', (event) => {
    clock.setDay(Number(event.target.value));
    const message = '时间调整中，距离与强度随滑块同步变化。';
    if ($('orbit-feedback').textContent !== message) $('orbit-feedback').textContent = message;
  });
  $('time-slider').addEventListener('change', () => {
    $('orbit-feedback').textContent =
      '时间已调整到 ' + day.toFixed(2) + ' 日。距离与相对潮汐强度已同步更新。';
  });
  document.querySelectorAll('[data-day]').forEach((button) =>
    button.addEventListener('click', () => {
      clock.setDay(Number(button.dataset.day));
      $('orbit-feedback').textContent =
        '已选' + button.textContent + '。' + $('tide-explanation').textContent;
    }),
  );
  $('play-orbits').addEventListener('click', () => {
    if (day >= end && !playing) {
      day = 0;
      renderTime();
    }
    setPlaying(!playing);
    $('orbit-feedback').textContent = playing
      ? '正在演示完整公转，留意绿色点的朝向与强度读数。'
      : '轨道已暂停，可拖动时间轴或选择公转阶段。';
  });
  $('reset-time').addEventListener('click', () => {
    clock.setDay(0);
    $('orbit-feedback').textContent = '时间已重置到近木点。比较远木点，看看距离与强度的变化。';
  });
  $('orbit-speed').addEventListener('change', (event) => {
    speed = Number(event.target.value);
    $('orbit-feedback').textContent = '播放速度已调整为 ' + speed + ' 地球日 / 秒。';
  });
  document.addEventListener('visibilitychange', () => {
    last = 0;
  });
  function tick(now) {
    if (playing && !document.hidden) {
      if (last) day = Math.min(end, day + Math.min((now - last) / 1000, 0.08) * speed);
      last = now;
      renderTime();
      if (day >= end) {
        setPlaying(false);
        $('orbit-feedback').textContent =
          '一次完整公转已完成；同步自转也完成一圈。可以重新播放或比较公转阶段。';
      }
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
      .forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.view === id)));
    $('model-stage').classList.toggle('is-system', id === 'system');
    $('model-stage').classList.toggle('europa-view', id === 'europa');
    $('profile-europa').hidden = id !== 'europa';
    $('view-tip').textContent = {
      europa: '从冰面开始：拖动画面，寻找交错的裂纹。',
      jupiter: '观察它的引力伙伴：云层纹理提供了转动时的参照。',
      system: '比较位置关系：天体与距离同比例，点击标签可进入近景。',
    }[id];
    if (id === 'system') {
      facts([
        ['观察对象', '2', '个天体'],
        ['木卫二轨道半径', '67.11', '万 km'],
        ['轨道偏心率', '0.009', ''],
        ['大小与距离', '同一', '比例'],
      ]);
      $('model-caption').innerHTML =
        '拖动环绕 · 滚轮 / 双指缩放<br><small>点击木卫二标签靠近 · 轨道与下方演示同步</small>';
    } else {
      const b = bodies[id];
      $('planet-lettering').textContent = b.english.toUpperCase();
      $('profile-kicker').textContent = b.type;
      $('profile-heading').innerHTML = b.heading;
      $('profile-summary').textContent = b.name + '档案 · 展开了解';
      $('profile-description').textContent = b.description;
      $('profile-feature').textContent = b.feature;
      $('model-caption').innerHTML =
        '拖动环绕 · 滚轮 / 双指缩放<br><small>NASA / VTAD · ' +
        (id === 'europa' ? '全球冰面' : '云层') +
        '拼接纹理</small>';
      if (id === 'europa')
        facts([
          ['平均半径', '1,560.8', 'km'],
          ['公转周期', '3.551', '地球日'],
          ['平均轨道半径', '67.11', '万 km'],
          ['同步自转', '1 : 1', '自转 / 公转'],
        ]);
      else
        facts([
          ['平均半径', '69,911', 'km'],
          ['赤道半径', '71,492', 'km'],
          ['自转周期', '9.9', '小时'],
          ['木卫二周期', '3.551', '地球日'],
        ]);
    }
    window.EuropaView?.focus(id);
    if (scroll) {
      $('observatory').scrollIntoView({
        behavior: reduced.matches ? 'auto' : 'smooth',
        block: 'start',
      });
      document.querySelector(`.view-switch [data-view="${id}"]`).focus({ preventScroll: true });
    }
  }
  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-view],[data-focus]');
    if (button)
      selectView(button.dataset.view || button.dataset.focus, Boolean(button.dataset.focus));
  });
  window.EuropaApp = { clock, selectView, feedback };

  const layers = {
    ice: {
      kicker: '01 / ICE SHELL',
      title: '一层会变形的冰',
      copy: '我们先从最外侧的冰壳开始。交错的裂纹、脊和带记录着它的拉伸与更新，破碎后重新排列的冰块则提示，这层外壳并没有一直保持原来的样貌。冰壳有多厚、内部如何变形、表面材料能不能抵达下方的海洋，都是重要问题。剖面中这一圈的宽度只是示意，不能用来读出真实厚度。',
    },
    ocean: {
      kicker: '02 / SUBSURFACE OCEAN',
      title: '海洋藏在磁场留下的线索里',
      copy: '看不到海洋，为什么仍然认为它存在？伽利略号测到木卫二对木星变化磁场的响应，全球性的导电咸水层能够解释这种感应信号。这样，我们便从外部测量中得到了一条通向冰下的线索。不过，海洋究竟有多深、含有多少盐、不同区域是否存在差异，都需要更多观测来约束。',
    },
    rock: {
      kicker: '03 / ROCKY INTERIOR',
      title: '水与岩石相遇，可能带来化学能',
      copy: '再向下，我们来到可能与海水接触的岩石海床。水与温暖岩石之间的反应，可能向海洋提供化学物质与可利用的能量，潜在的热液活动也因此受到关注。地球海底的类似过程给了我们研究的参照；木卫二是否存在这样的活动、活动有多强、能持续多久，目前还没有确定答案。',
    },
    core: {
      kicker: '04 / METALLIC CORE',
      title: '冰海之下，仍有致密的内部',
      copy: '走到剖面的最深处，会发现木卫二还有岩石和金属构成的内部。常见结构模型包含富含铁的核心，外侧由岩石层包裹，再往外才是海洋与冰壳。研究人员结合引力等观测来判断这些层次的可能分布。图上清晰的边界方便我们理解模型，实际内部的组成、状态和各层尺寸仍有不确定性。',
    },
  };
  function bindTabs(selector, key, onSelect) {
    const buttons = [...document.querySelectorAll(selector)];
    function select(id) {
      buttons.forEach((button) => {
        const active = button.dataset[key] === id;
        button.setAttribute('aria-selected', String(active));
        button.tabIndex = active ? 0 : -1;
      });
      $('' + (key === 'layer' ? 'layer-step' : 'instrument-step')).textContent =
        buttons.findIndex((button) => button.dataset[key] === id) + 1 + ' / ' + buttons.length;
      onSelect(id);
    }
    buttons.forEach((button, index) => {
      button.addEventListener('click', () => select(button.dataset[key]));
      button.addEventListener('keydown', (event) => {
        let next;
        if (event.key === 'ArrowRight') next = (index + 1) % buttons.length;
        else if (event.key === 'ArrowLeft') next = (index + buttons.length - 1) % buttons.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = buttons.length - 1;
        else return;
        event.preventDefault();
        select(buttons[next].dataset[key]);
        buttons[next].focus();
      });
    });
    select(buttons[0].dataset[key]);
  }
  bindTabs('[data-layer]', 'layer', (id) => {
    const layer = layers[id];
    $('layer-kicker').textContent = layer.kicker;
    $('layer-title').textContent = layer.title;
    $('layer-copy').textContent = layer.copy;
    $('layer-panel').setAttribute('aria-labelledby', 'tab-' + id);
    document.querySelectorAll('[data-layer-label]').forEach((label) => {
      label.classList.toggle('selected-layer', label.dataset.layerLabel === id);
    });
    document.querySelectorAll('.cutaway>circle').forEach((circle, index) => {
      circle.setAttribute('stroke', index === Object.keys(layers).indexOf(id) ? '#dcaf6d' : 'none');
      circle.setAttribute('stroke-width', '3');
    });
  });
  const instruments = {
    radar: {
      kicker: 'RADAR / REASON',
      title: '用雷达追踪冰中的界面。',
      copy: '雷达向冰壳发送电磁信号，再接收从不同界面返回的回波。通过比较这些信号，研究人员寻找冰中的层次、液态水线索，以及冰壳与海洋可能存在的联系。实际探测深度受冰的成分和结构影响；能否辨认某个界面，还要结合其他测量判断。这样的调查，是在逐步约束冰下结构。',
    },
    magnetic: {
      kicker: 'MAGNETOMETER / ECM',
      title: '从感应磁场约束海洋。',
      copy: '海水中的盐让它能够导电，而木星变化的磁场可以在这样的导电层中产生感应响应。磁力计记录木卫二附近的磁场，再结合等离子体测量，分辨周围环境的影响与卫星本身的信号。研究人员希望借此约束海洋的深度、盐度与冰壳厚度，让那片尚未看见的海洋逐渐拥有可检验的参数。',
    },
    chemistry: {
      kicker: 'SPECTROMETERS / MISE & MASPEX',
      title: '把颜色变成成分的线索。',
      copy: '如果仅仅观察颜色，我们很难知道红褐色区域到底含有什么。红外光谱仪研究地表不同材料的光谱特征，质谱仪则分析极稀薄大气中的分子；如果遇到羽流，也有机会调查其中的气体。这些测量将帮助我们研究冰、盐与其他成分及其来源。有机物是一条化学线索，仍需要解释它由怎样的过程形成。',
    },
  };
  bindTabs('[data-instrument]', 'instrument', (id) => {
    const instrument = instruments[id];
    $('instrument-kicker').textContent = instrument.kicker;
    $('instrument-title').textContent = instrument.title;
    $('instrument-copy').textContent = instrument.copy;
    $('instrument-panel').setAttribute('aria-labelledby', 'instrument-' + id);
  });
  const photos = {
    europa: {
      image: 'assets/europa-global.jpg',
      title: '木卫二的冰封表面',
      kicker: 'GALILEO / PIA19048',
      description:
        '这幅全球影像由伽利略号在 1990 年代后期取得的数据重新拼接和处理，尽量接近人眼可见的颜色。你可以沿着浅色冰面上的红褐色线条观察：它们在不同方向交错，又与局部较暗的区域相连，对应着脊、裂纹与材料分布的差异。全球影像让我们认识它的整体轮廓，更具体的地质关系，还需要近距离照片与其他测量来解释。NASA/JPL-Caltech/SETI Institute。',
      source: 'https://science.nasa.gov/resource/europas-stunning-surface/',
    },
    bands: {
      image: 'assets/bands.jpg',
      title: '交错的脊与带状地形',
      kicker: 'GALILEO / 26 SEPTEMBER 1998 / PIA23872',
      description:
        '图幅约 285 千米宽，高分辨率灰度影像与较低分辨率的颜色数据结合，并经过增强色处理。先看细长的脊，再看更宽、更平坦的带，你会发现同一片冰面保留着不同形式的活动痕迹。线条的交叉与截断，帮助研究人员判断活动的先后关系。这里的蓝白色与红褐色用于突出差异，不能直接当作人在现场看到的色彩。NASA/JPL-Caltech/SETI Institute。',
      source: 'https://science.nasa.gov/photojournal/crisscrossing-bands/',
    },
    chaos: {
      image: 'assets/chaos.jpg',
      title: '阿革诺尔线附近的混沌地形',
      kicker: 'GALILEO / 26 SEPTEMBER 1998 / PIA23873',
      description:
        '这幅约 280 千米宽的增强色影像，呈现了阿革诺尔线附近的混沌地形。你可以把带着旧纹路的冰块想象成拼图碎片：一些块体曾平移、旋转或倾斜，后来又冻结在新的位置。图像底部横贯的宽带是阿革诺尔线。这样的地形记录了冰壳的变化，液态水是否以及如何参与其形成，仍需要研究。我们看到的仍是冰面，而非地下海洋的直接照片。NASA/JPL-Caltech/SETI Institute。',
      source: 'https://science.nasa.gov/photojournal/chaos-near-agenor-linea/',
    },
  };
  const dialog = $('photo-dialog'),
    photoIds = ['bands', 'chaos', 'europa'],
    image = $('dialog-image');
  let photoIndex = 0,
    photoOpener;
  function imageReady() {
    if (image.complete && image.naturalWidth) {
      $('photo-state').hidden = true;
      $('photo-retry').hidden = true;
      image.classList.remove('loading');
    }
  }
  image.addEventListener('load', imageReady);
  image.addEventListener('error', () => {
    $('photo-state').hidden = false;
    $('photo-state').textContent = '影像未能加载，请重试或查看影像来源。';
    $('photo-retry').hidden = false;
    image.classList.remove('loading');
  });
  function showPhoto(index) {
    photoIndex = (index + photoIds.length) % photoIds.length;
    const photo = photos[photoIds[photoIndex]];
    $('photo-state').textContent = '正在加载影像…';
    $('photo-state').hidden = false;
    $('photo-retry').hidden = true;
    image.classList.add('loading');
    image.alt = photo.title;
    image.src = photo.image;
    $('dialog-title').textContent = photo.title;
    $('dialog-kicker').textContent = photo.kicker;
    $('dialog-description').textContent = photo.description;
    $('dialog-source').href = photo.source;
    $('photo-count').textContent = photoIndex + 1 + ' / ' + photoIds.length;
    dialog.scrollTop = 0;
    imageReady();
  }
  document.querySelectorAll('[data-photo]').forEach((button) =>
    button.addEventListener('click', () => {
      photoOpener = button;
      showPhoto(photoIds.indexOf(button.dataset.photo));
      dialog.showModal();
    }),
  );
  $('photo-prev').addEventListener('click', () => showPhoto(photoIndex - 1));
  $('photo-next').addEventListener('click', () => showPhoto(photoIndex + 1));
  $('photo-retry').addEventListener('click', () => showPhoto(photoIndex));
  dialog.addEventListener('keydown', (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      showPhoto(photoIndex + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
  document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => photoOpener?.focus({ preventScroll: true }));
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) {
      const r = dialog.getBoundingClientRect();
      if (
        event.clientX < r.left ||
        event.clientX > r.right ||
        event.clientY < r.top ||
        event.clientY > r.bottom
      )
        dialog.close();
    }
  });
})();
