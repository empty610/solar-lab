(() => {
  'use strict';
  const bodies = [
    {
      id: 'mercury',
      name: '水星',
      en: 'MERCURY',
      number: '01',
      type: '类地行星',
      color: '#8a7359',
      soft: '#eee7dc',
      poem: '离太阳最近的世界。',
      description:
        '覆满撞击坑的地表，漫长的白昼与黑夜，走进这个时间被反复解冻与冻结的世界。',
      distance: '0.39',
      year: '88',
      unit: '地球日',
      link: '../mercury/index.html',
      topics: '三维地表 · 轨道共振 · 极地冰',
      position: [55.0, 45.5],
      size: 28,
      mobile: 22,
    },
    {
      id: 'venus',
      name: '金星',
      en: 'VENUS',
      number: '02',
      type: '类地行星',
      color: '#aa8051',
      soft: '#efe4d4',
      poem: '光芒之下的灼热世界。',
      description:
        '硫酸云层，活跃的火山，被二氧化碳充斥的大气，看看这颗与地球相似的行星如何走向不同的命运。',
      distance: '0.72',
      year: '225',
      unit: '地球日',
      link: '../venus/index.html',
      topics: '三维观察 · 火山地貌 · 大气剖面',
      position: [37.8, 50.4],
      size: 38,
      mobile: 28,
    },
    {
      id: 'earth',
      name: '地球',
      en: 'EARTH',
      number: '03',
      type: '类地行星',
      color: '#6f8774',
      soft: '#e2e9df',
      poem: '所有远行的起点。',
      description: '人类于此出发探索宇宙。地球的介绍页尚未收录，它仍在这张星图上，至于独立的介绍档案将在补充后开放，你可以先看点别的。',
      distance: '1.00',
      year: '1.00',
      unit: '地球年',
      link: null,
      position: [50.6, 66.4],
      size: 21,
      mobile: 20,
    },
    {
      id: 'mars',
      name: '火星',
      en: 'MARS',
      number: '04',
      type: '类地行星',
      color: '#a16f54',
      soft: '#eee1d6',
      poem: '在红色尘埃里，寻找生命的往事。',
      description:
        '峡谷、火山与极地冰盖，保存着它与地球无比相似的过去，从这里认识这个熟悉又陌生的邻居。',
      distance: '1.52',
      year: '687',
      unit: '地球日',
      link: '../mars/index.html',
      topics: '地表观察 · 火星车 · 卫星与天空',
      position: [33.0, 36.1],
      size: 37,
      mobile: 27,
    },
    {
      id: 'jupiter',
      name: '木星',
      en: 'JUPITER',
      number: '05',
      type: '气态巨行星',
      color: '#967959',
      soft: '#eae1d4',
      poem: '流动的条纹，变幻的天空。',
      description:
        '云带与风暴不停地改写它的面孔。走近太阳系最大的行星，也走近被它的引力所牵引着的四颗卫星。',
      distance: '5.20',
      year: '11.86',
      unit: '地球年',
      link: '../jupiter/index.html',
      topics: '三维系统 · 大红斑 · 伽利略卫星',
      position: [76.4, 40.8],
      size: 84,
      mobile: 53,
    },
    {
      id: 'saturn',
      name: '土星',
      en: 'SATURN',
      number: '06',
      type: '气态巨行星',
      color: '#82704d',
      soft: '#eee7d7',
      poem: '直到时间变成一圈光环。',
      description:
        '冰粒与尘埃围成宽阔的环。走近这颗巨行星，了解时间在它身侧留下的痕迹。',
      distance: '9.58',
      year: '29.45',
      unit: '地球年',
      link: '../saturn/index.html',
      topics: '三维观察 · 行星环 · 土卫二与土卫六',
      position: [26.5, 77.5],
      size: 77,
      mobile: 46,
    },
    {
      id: 'uranus',
      name: '天王星',
      en: 'URANUS',
      number: '07',
      type: '冰巨星',
      color: '#679092',
      soft: '#e0e9e5',
      poem: '把四季，横放在轨道上。',
      description:
        '侧身旋转的青色冰巨星，细窄的行星环与漫长的四季。转动模型，让一束阳光讲述它不寻常的姿态。',
      distance: '19.2',
      year: '84',
      unit: '地球年',
      link: '../uranus/index.html',
      topics: '三维观察 · 倾斜环系 · 漫长四季',
      position: [18.0, 23.4],
      size: 28,
      mobile: 23,
    },
    {
      id: 'neptune',
      name: '海王星',
      en: 'NEPTUNE',
      number: '08',
      type: '冰巨星',
      color: '#597c8c',
      soft: '#e1e9e8',
      poem: '太阳系的远光点，风暴从未停息。',
      description:
        '蓝色的大气、明亮的云层与逆行的冰月，太阳系最外围的行星是否如你想象中冷漠？',
      distance: '30.1',
      year: '164.8',
      unit: '地球年',
      link: '../neptune/index.html',
      topics: '三维观察 · 风暴与行星环 · 海卫一',
      position: [91.9, 66.0],
      size: 59,
      mobile: 36,
    },
    {
      id: 'europa',
      name: '木卫二',
      en: 'EUROPA',
      number: 'J / Ⅱ',
      type: '木星的冰卫星',
      color: '#648477',
      soft: '#e2e9df',
      poem: '冰层之下的深邃海洋。',
      description:
        '褐色裂纹划过冰封的表面，悸动的地层在无光的海洋掀起波澜，它是否能成为太阳系内第二个生命的故乡？',
      distance: '3.55',
      distanceLabel: '绕木星一周',
      distanceUnit: '地球日',
      year: '1,561',
      yearLabel: '平均半径',
      unit: 'km',
      link: '../europa/index.html',
      topics: '三维观察 · 地下海洋 · 潮汐与探索',
    },
    {
      id: 'pluto',
      name: '冥王星',
      en: 'PLUTO',
      number: 'D / 01',
      type: '矮行星',
      color: '#94735f',
      soft: '#eee2d9',
      poem: '太阳很远，故事还在继续。',
      description:
        '在柯伊伯带，氮冰原、薄雾与水冰山脉组成一个复杂的世界。走近冥王星的“心”，也看看与它相望着的卡戎。',
      distance: '39.5',
      year: '248',
      unit: '地球年',
      link: '../pluto/index.html',
      topics: '三维观察 · 冰原与薄雾 · 冥卫一',
      position: [14, 80],
      size: 34,
      mobile: 26,
      dwarf: true,
    },
  ];
  const $ = (id) => document.getElementById(id);
  const map = $('map-bodies'),
    catalog = $('planet-catalog');
  function bodyImage(body) {
    if (!body.link) {
      const span = document.createElement('span');
      span.className = 'schematic-planet ' + body.id;
      span.setAttribute('aria-hidden', 'true');
      return span;
    }
    const image = document.createElement('img');
    image.src = 'assets/preview/' + body.id + '-128.webp';
    image.alt = '';
    image.width = 640;
    image.height = 640;
    image.draggable = false;
    return image;
  }
  for (const body of bodies.filter((body) => body.position)) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'body-point' + (!body.link ? ' unavailable' : '');
    button.dataset.select = body.id;
    button.style.cssText = `left:${body.position[0]}%;top:${body.position[1]}%;--size:${body.size}px;--mobile-size:${body.mobile}px;--hit:${Math.max(body.size, 44)}px`;
    button.setAttribute('aria-label', '选择' + body.name + (!body.link ? '，介绍页尚未收录' : ''));
    button.setAttribute('aria-pressed', 'false');
    const label = document.createElement('span');
    label.className = 'body-label';
    label.textContent = body.name;
    const english = document.createElement('small');
    english.textContent = body.link ? body.en : '待收录';
    label.append(english);
    button.append(bodyImage(body), label);
    map.append(button);
    if (body.dwarf) continue;
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'planet-card' + (!body.link ? ' unavailable' : '');
    card.dataset.select = body.id;
    card.setAttribute('aria-pressed', 'false');
    card.setAttribute('aria-label', '选择' + body.name + (!body.link ? '，介绍页尚未收录' : ''));
    const head = document.createElement('div');
    head.className = 'card-top';
    const number = document.createElement('span');
    number.textContent = body.number;
    const marker = document.createElement('span');
    marker.className = 'card-marker';
    marker.setAttribute('aria-hidden', 'true');
    marker.textContent = body.link ? '✓' : '待收录';
    head.append(number, marker);
    const picture = document.createElement('div');
    picture.className = 'card-image';
    picture.append(bodyImage(body));
    const name = document.createElement('h3');
    name.textContent = body.name;
    const en = document.createElement('p');
    en.className = 'card-english';
    en.textContent = body.en;
    const status = document.createElement('p');
    status.className = 'card-status';
    status.textContent = body.link ? body.type : '介绍页尚未收录';
    const text = document.createElement('div');
    text.className = 'card-text';
    text.append(name, en);
    const face = document.createElement('div');
    face.className = 'card-face';
    face.append(text, picture);
    card.append(head, face);
    const article = document.createElement('article');
    article.className = 'catalog-item' + (!body.link ? ' unavailable' : '');
    article.dataset.body = body.id;
    const foot = document.createElement('div');
    foot.className = 'card-footer';
    foot.append(status);
    if (body.link) {
      const link = document.createElement('a');
      link.className = 'card-entry';
      link.href = body.link;
      link.dataset.open = body.id;
      link.textContent = '进入档案';
      link.setAttribute('aria-label', '直接进入' + body.name + '档案');
      foot.append(link);
    }
    article.append(card, foot);
    catalog.append(article);
  }
  let selectedBody;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const tabs = [...document.querySelectorAll('.atlas-tabs [role="tab"]')];
  let activeView = 'explorer';
  const panelTabs = SolarUI.tabs({
    buttons: tabs,
    panels: tabs.map(tab => $(tab.getAttribute('aria-controls'))),
    onSelect(id) {
      activeView = id;
      try { sessionStorage.setItem('solar-atlas-view', id); } catch {}
      syncViewport();
    },
    onShown() {
      syncViewport();
      window.SolarAtlasLabels?.layout();
    },
  });
  function activateView(id, animate = true, onShown) {
    panelTabs.select(id, { animate, shown: onShown });
  }
  let portraitMotion;
  function select(id, announce = false) {
    const body = bodies.find((body) => body.id === id);
    if (!body) return;
    const changed = selectedBody?.id !== id;
    selectedBody = body;
    document.documentElement.style.setProperty('--accent', body.color);
    document.documentElement.style.setProperty('--accent-soft', body.soft);
    document.querySelector('.destination').style.setProperty('--accent', body.color);
    document
      .querySelectorAll('[data-select]')
      .forEach((button) =>
        button.setAttribute('aria-pressed', String(button.dataset.select === id)),
      );
    document
      .querySelectorAll('[data-orbit]')
      .forEach((orbit) =>
        orbit.classList.toggle(
          'selected',
          orbit.dataset.orbit === (id === 'europa' ? 'jupiter' : id),
        ),
      );
    $('destination-index').textContent = 'DESTINATION / ' + body.number;
    $('destination-type').textContent = body.type;
    $('selection-label').textContent = body.name;
    $('destination-name').textContent = body.name;
    $('destination-english').textContent = body.en;
    $('portrait-word').textContent = body.en;
    $('destination-poem').textContent = body.poem;
    $('destination-description').textContent = body.description;
    $('fact-one').textContent = body.distance;
    $('fact-one-label').textContent = body.distanceLabel || '平均日心距离';
    $('fact-one-unit').textContent = body.distanceUnit || 'AU';
    $('fact-two').textContent = body.year;
    $('fact-two-label').textContent = body.yearLabel || '绕太阳一周';
    $('fact-two-unit').textContent = body.unit;
    $('planet-portrait').dataset.body = id;
    $('portrait-image').hidden = !body.link;
    $('portrait-placeholder').hidden = !!body.link;
    if (body.link) {
      $('portrait-image').src = 'assets/preview/' + id + '-512.webp';
      $('portrait-image').alt = body.name + '的可视化影像';
      $('enter-link').href = body.link;
      $('enter-text').textContent = '进入' + body.name + '档案';
      $('entry-note').textContent = body.topics;
    } else {
      $('enter-link').removeAttribute('href');
    }
    $('enter-link').hidden = !body.link;
    $('entry-note').hidden = !body.link;
    $('unavailable-note').hidden = !!body.link;
    if (body.link) {
      $('dock-image').src = 'assets/preview/' + id + '-128.webp';
      $('dock-name').replaceChildren(document.createTextNode(body.name + ' '));
      const small = document.createElement('small');
      small.textContent = body.en;
      $('dock-name').append(small);
      $('dock-enter').href = body.link;
      $('dock-enter').setAttribute('aria-label', '进入' + body.name + '介绍页');
    }
    if (changed && announce) {
      portraitMotion?.cancel();
      portraitMotion = SolarUI.motion($('portrait-image'), 'selection-arrive');
    }
    if (announce)
      $('selection-status').textContent =
        '已选中' + body.name + (body.link ? '，可进入对应档案' : '，介绍页尚未收录');
    try {
      sessionStorage.setItem('solar-atlas-selection', id);
    } catch {
      /* Selection also works with browser storage disabled. */
    }
    syncViewport();
    window.SolarAtlasLabels?.layout();
  }
  function revealDestination() {
    const panel = $('destination');
    panel.scrollIntoView({ behavior: reduced.matches ? 'instant' : 'smooth', block: 'center' });
  }
  document.querySelectorAll('[data-select]').forEach((button) =>
    button.addEventListener('click', () => {
      select(button.dataset.select, true);
      if (button.classList.contains('moon-select') || button.classList.contains('planet-card')) {
        activateView('explorer', true, () => {
          $('destination').focus({ preventScroll: true });
          if (innerWidth <= 900) revealDestination();
        });
      } else if (button.classList.contains('body-point') && innerWidth <= 900) {
        revealDestination();
      }
    }),
  );
  document
    .querySelectorAll('[data-open]')
    .forEach((link) => link.addEventListener('click', () => select(link.dataset.open)));
  document
    .querySelector('.moon-entry[href="../europa/index.html"]')
    .addEventListener('click', () => select('europa'));
  // Arrow keys stay within the chosen set; ordinary Tab, Enter, and Space still work.
  for (const region of [map, catalog])
    region.addEventListener('keydown', (event) => {
      if (
        !['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key) ||
        !event.target.matches('[data-select]')
      )
        return;
      const buttons = [...region.querySelectorAll('[data-select]')],
        index = buttons.indexOf(event.target);
      const next =
        event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? buttons.length - 1
            : (index + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
      event.preventDefault();
      buttons[next].focus({ preventScroll: true });
      select(buttons[next].dataset.select, true);
    });
  function syncViewport() {
    const entry = $('enter-link').getBoundingClientRect(),
      detail = $('destination').getBoundingClientRect();
    const entryVisible =
      activeView === 'explorer' &&
      !$('enter-link').hidden &&
      entry.top >= 0 &&
      entry.bottom <= innerHeight;
    $('selection-dock').hidden =
      !selectedBody?.link || entryVisible || (activeView === 'explorer' && detail.bottom > 80);
  }
  let pending = false;
  function scheduleViewport() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      syncViewport();
    });
  }
  addEventListener('scroll', scheduleViewport, { passive: true });
  addEventListener('resize', scheduleViewport);
  addEventListener('pageshow', scheduleViewport);
  addEventListener('load', scheduleViewport);
  let initial = 'saturn';
  let initialView = 'explorer';
  try {
    initial = sessionStorage.getItem('solar-atlas-selection') || initial;
    initialView = sessionStorage.getItem('solar-atlas-view') || initialView;
  } catch {}
  select(bodies.some((body) => body.id === initial) ? initial : 'saturn');
  activateView(
    ['#explorer', '#catalog'].includes(location.hash) ? location.hash.slice(1) : initialView,
    false,
  );
  portraitMotion = SolarUI.motion($('portrait-image'), 'portrait-arrive');
  function followPanelLink() {
    if (['#explorer', '#catalog'].includes(location.hash)) activateView(location.hash.slice(1));
  }
  addEventListener('hashchange', followPanelLink);
  document.querySelector('.skip').addEventListener('click', () => activateView('explorer'));
})();
