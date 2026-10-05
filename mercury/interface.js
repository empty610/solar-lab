/* Progressive UI enhancement: no changes to orbital math or original copy. */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const science = window.MercuryScience;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const notice = $('interaction-notice');
  let noticeTimer;
  function announce(text) {
    clearTimeout(noticeTimer);
    notice.textContent = text;
    notice.classList.add('is-visible');
    noticeTimer = setTimeout(() => notice.classList.remove('is-visible'), 2800);
  }

  // A chapter marker follows the document, without forcing the reader to scroll.
  const nav = document.querySelector('.reading-nav');
  const navTrack = nav.querySelector('.chapter-links');
  const links = [...navTrack.querySelectorAll('a')];
  const sections = links.map((a) => document.querySelector(a.hash));
  let current = '',
    scheduled = false;
  function updateReading() {
    scheduled = false;
    const threshold = nav.getBoundingClientRect().bottom + 65;
    let index = 0;
    sections.forEach((section, i) => {
      if (section.getBoundingClientRect().top <= threshold) index = i;
    });
    if (scrollY > 0 && scrollY + innerHeight >= document.documentElement.scrollHeight - 3)
      index = links.length - 1;
    const selected = links[index];
    if (current !== selected.hash) {
      current = selected.hash;
      links.forEach((link) =>
        link === selected
          ? link.setAttribute('aria-current', 'location')
          : link.removeAttribute('aria-current'),
      );
      navTrack.scrollTo({
        left: Math.max(
          0,
          selected.offsetLeft - navTrack.clientWidth / 2 + selected.offsetWidth / 2,
        ),
        behavior: reduced.matches ? 'instant' : 'smooth',
      });
    }
    const root = document.documentElement;
    const range = root.scrollHeight - innerHeight;
    $('reading-progress').style.transform =
      `scaleX(${range > 0 ? Math.min(1, Math.max(0, scrollY / range)) : 1})`;
  }
  function scheduleReading() {
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(updateReading);
    }
  }
  window.addEventListener('scroll', scheduleReading, { passive: true });
  window.addEventListener('resize', scheduleReading, { passive: true });
  window.addEventListener('pageshow', scheduleReading);
  new ResizeObserver(() => {
    document.documentElement.style.setProperty('--nav-height', nav.offsetHeight + 'px');
    scheduleReading();
  }).observe(nav);
  links.forEach((link) =>
    link.addEventListener('click', () => {
      const section = document.querySelector(link.hash);
      section.classList.remove('chapter-arrival');
      requestAnimationFrame(() => section.classList.add('chapter-arrival'));
    }),
  );
  updateReading();

  // Definitions are inline disclosures, usable by touch and keyboard as well as mouse.
  const definitions = [
    ['平均半径', '从行星中心到表面的平均距离，用来描述水星的大小；不是直径。'],
    ['公转周期', '水星绕太阳一圈所需的时间。这里的“日”使用地球日作单位。'],
    ['自转周期', '相对遥远恒星，水星转完一圈所需的时间；它与地面再次迎来正午的间隔不同。'],
    [
      '一个太阳日',
      '同一地面参考点两次正午之间的间隔。向下阅读“昼夜与内部”，看它为何约等于两个水星年。',
    ],
  ];
  const facts = document.querySelector('.planet-facts');
  const explanation = document.createElement('div');
  explanation.className = 'metric-explainer';
  explanation.id = 'metric-explainer';
  explanation.hidden = true;
  const term = document.createElement('dt'),
    description = document.createElement('dd');
  term.className = 'sr-only';
  explanation.append(term, description);
  facts.append(explanation);
  const helpButtons = [];
  [...facts.querySelectorAll(':scope > div:not(.metric-explainer)')].forEach((row, index) => {
    const dt = row.querySelector('dt'),
      button = document.createElement('button');
    button.type = 'button';
    button.className = 'metric-label';
    button.textContent = dt.textContent;
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-controls', explanation.id);
    button.setAttribute('aria-label', '解释：' + definitions[index][0]);
    dt.replaceChildren(button);
    helpButtons.push(button);
    button.addEventListener('click', () => {
      const expanded = button.getAttribute('aria-expanded') !== 'true';
      helpButtons.forEach((b) => b.setAttribute('aria-expanded', String(b === button && expanded)));
      explanation.hidden = !expanded;
      if (expanded) {
        term.textContent = definitions[index][0];
        description.textContent = definitions[index][1];
      }
      scheduleReading();
    });
  });

  // A visible text action complements each photo; both enter the existing dialog.
  const viewed = new Set();
  document.querySelectorAll('.terrain-card').forEach((card) => {
    const image = card.querySelector('[data-terrain]');
    const action = document.createElement('button');
    action.type = 'button';
    action.className = 'terrain-action';
    action.textContent = '阅读影像';
    action.setAttribute('aria-label', '阅读影像：' + card.querySelector('h3').textContent);
    action.addEventListener('click', () => image.click());
    card.querySelector('.terrain-copy').append(action);
  });
  document.addEventListener('mercury:terrainread', (event) => {
    viewed.add(event.detail);
    const card = document
      .querySelector(`[data-terrain="${event.detail}"]`)
      .closest('.terrain-card');
    card.classList.add('is-viewed');
    card.querySelector('.terrain-action').textContent = '再次阅读';
    $('terrain-progress').textContent = `${viewed.size} / 4 已查看`;
  });

  // Place a local scrubber beside the magnified solar-motion plot.
  if (science?.getState) {
    const local = document.createElement('div');
    local.className = 'local-timeline';
    const label = document.createElement('label');
    label.htmlFor = 'local-time';
    label.append('局部时间轴');
    const rangeLabel = document.createElement('span');
    rangeLabel.textContent = '76 — 100 日';
    label.append(rangeLabel);
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.id = 'local-time';
    slider.min = '76';
    slider.max = '100';
    slider.step = '0.01';
    slider.value = '88';
    slider.setAttribute('aria-label', '太阳脚步局部时间轴，76 到 100 地球日');
    slider.setAttribute('aria-describedby', 'local-time-hint');
    const hint = document.createElement('p');
    hint.id = 'local-time-hint';
    const play = document.createElement('button');
    play.type = 'button';
    play.dataset.sharedPlay = '';
    play.setAttribute('aria-pressed', 'false');
    local.append(label, slider, hint, play);
    document.querySelector('.sunstep-plot-wrap').append(local);
    slider.addEventListener('input', () => science.setDay(Number(slider.value)));
    slider.addEventListener('change', () =>
      announce(`已定位第 ${Number(slider.value).toFixed(1)} 日，轨道与昼夜同步更新`),
    );
    function syncTime(state) {
      const inWindow = state.day >= 76 && state.day <= 100;
      if (inWindow) slider.value = String(state.day);
      hint.textContent = inWindow
        ? '拖动即暂停；此处与上方轨道、昼夜共享同一时间。'
        : '当前共用时间在窗口外；拖动这里即可进入 76–100 日。';
      slider.setAttribute(
        'aria-valuetext',
        `${Number(slider.value).toFixed(1)} 地球日${inWindow ? '' : '，局部预选值，尚未应用'}`,
      );
      $('perihelion').classList.toggle('is-current', Math.abs(state.day % science.PERIOD) < 0.02);
      $('aphelion').classList.toggle(
        'is-current',
        Math.abs((state.day % science.PERIOD) - science.PERIOD / 2) < 0.02,
      );
    }
    let playbackSignature = '';
    function syncPlaying() {
      const state = science.getState();
      const signature = state.playing
        ? '播放中'
        : state.day >= science.END
          ? '演示完成'
          : state.day === 0
            ? '待播放'
            : '已暂停';
      if (signature === playbackSignature) return;
      playbackSignature = signature;
      $('simulation-state').textContent = signature;
      $('simulation-state').dataset.playing = String(state.playing);
      document.querySelectorAll('[data-shared-play]').forEach((button) => {
        button.textContent = state.playing ? '暂停联动演示' : '播放联动演示';
        button.setAttribute('aria-pressed', String(state.playing));
      });
    }
    document.querySelectorAll('[data-shared-play]').forEach((button) =>
      button.addEventListener('click', () => {
        if (
          button === play &&
          !science.getState().playing &&
          (science.getState().day < 76 || science.getState().day >= 100)
        ) {
          science.setDay(76);
          $('speed').value = '2';
          $('speed').dispatchEvent(new Event('change'));
        }
        science.toggle();
        announce(
          science.getState().playing
            ? '联动演示已开始：轨道、昼夜与太阳脚步同步'
            : '联动演示已暂停',
        );
      }),
    );
    $('show-solar-day').addEventListener('click', () => {
      science.setDay(science.END);
      announce('已定位：公转 2 圈、自转 3 圈，参考点再次迎来正午');
    });
    document.addEventListener('mercury:timechange', (event) => {
      syncTime(event.detail);
      syncPlaying();
    });
    document.addEventListener('mercury:playchange', syncPlaying);
    syncTime(science.stateAt(science.getState().day));
    syncPlaying();
  }

  const feedback = {
    'rotate-model': () =>
      $('rotate-model').getAttribute('aria-pressed') === 'true'
        ? '展示自转已继续，仍可拖动观察'
        : '展示自转已暂停，可以仔细观察地貌',
    'light-model': () =>
      $('light-model').getAttribute('aria-pressed') === 'true'
        ? '已切换均匀照明，便于查看整颗水星'
        : '已切换昼夜照明，突出明暗交界',
    'reset-model': () => '视角已回到水星中心',
    'perihelion': () => '已到近日点：比较此刻的距离与速度',
    'aphelion': () => '已到远日点：距离和速度读数已同步更新',
    'reset-time': () => '时间轴已归零，所有联动演示已暂停',
    'sunstep-jump': () => '已进入太阳反向移动的片段，试着拖动局部时间轴',
    'sunstep-peri': () => '已定位到约第 88 日的近日点',
  };
  Object.entries(feedback).forEach(([id, message]) =>
    $(id).addEventListener('click', () => announce(message())),
  );
  $('speed').addEventListener('change', () =>
    announce(`演示速度：每秒 ${$('speed').value} 个地球日`),
  );
  $('time-slider').addEventListener('change', () =>
    announce(`已定位第 ${Number($('time-slider').value).toFixed(1)} 日，所有视图同步暂停`),
  );
  const modelMode = document.createElement('span');
  modelMode.className = 'model-mode';
  document.querySelector('.model-caption p').prepend(modelMode);
  function syncModelMode() {
    modelMode.textContent = `${$('rotate-model').getAttribute('aria-pressed') === 'true' ? '自动自转' : '自转暂停'} · ${$('light-model').getAttribute('aria-pressed') === 'true' ? '均匀照明' : '昼夜照明'}`;
  }
  const modeObserver = new MutationObserver(syncModelMode);
  ['rotate-model', 'light-model'].forEach((id) =>
    modeObserver.observe($(id), { attributes: true, attributeFilter: ['aria-pressed'] }),
  );
  syncModelMode();
})();
