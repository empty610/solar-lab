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
      poem: '离太阳最近，时间却走得很慢。',
      description:
        '被撞击坑写满的地表，漫长的白昼与黑夜。转动这颗小小的岩石世界，读懂它独特的自转与公转节奏。',
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
      poem: '云层之下，是另一种炽热。',
      description:
        '厚重的大气遮住了地表。穿过云层，走近火山平原与高地，看看这颗与地球相近的行星如何走向不同的命运。',
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
      poem: '所有远行，都从这里开始。',
      description: '我们观察太阳系的起点。地球仍在这张星图上，独立的介绍档案将在补充后开放。',
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
      poem: '在红色尘埃里，寻找水的往事。',
      description:
        '峡谷、火山与极地冰盖，保存着一颗行星的过去。跟随巡视器的车辙，重新认识这个熟悉又陌生的邻居。',
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
      poem: '眼前的条纹，是流动的天空。',
      description:
        '云带与风暴不停地改写它的面孔。走近太阳系最大的行星，也走近被它的引力牵引的四颗伽利略卫星。',
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
      poem: '把时间，写成一圈光环。',
      description:
        '冰粒与尘埃围成宽阔的环。走近这颗巨行星，看看环的缝隙，也看看它身边那些独特的卫星。',
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
      poem: '遥远的青色世界，等待下一次展开。',
      description:
        '天王星的介绍页尚未收录。它的位置在这里保留，你也可以先走向更远处，进入海王星的观察档案。',
      distance: '19.2',
      year: '84',
      unit: '地球年',
      link: null,
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
      poem: '抵达光的远岸，风暴从未停息。',
      description:
        '蓝色大气、明亮云羽与逆行的冰月。在漫长的公转周期里，重新感受外太阳系的距离与时间。',
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
      poem: '一层冰壳，一个海洋世界。',
      description:
        '褐色裂纹划过冰封的表面。跟随影像与探测线索，了解冰壳下的海洋、潮汐作用，以及对宜居环境的追问。',
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
        '在柯伊伯带，氮冰原、薄雾与水冰山脉组成一个复杂的世界。走近冥王星，也看看与它彼此相望的冥卫一。',
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
    image.src = 'assets/' + body.id + '.png';
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
  let tabTransition = 0;
  function activateView(id, animate = true, onShown) {
    if (!tabs.some((tab) => tab.getAttribute('aria-controls') === id)) return;
    const next = $(id);
    const previous = $(activeView);
    if (activeView === id && !previous.classList.contains('tab-view-exit')) {
      if (!next.hidden) onShown?.();
      return;
    }
    const token = ++tabTransition;
    activeView = id;
    for (const tab of tabs) {
      const active = tab.getAttribute('aria-controls') === id;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    }
    const delay = animate && !reduced.matches && previous !== next ? 300 : 0;
    if (delay) {
      previous.classList.remove('tab-view-enter');
      previous.classList.add('tab-view-exit');
    }
    try {
      sessionStorage.setItem('solar-atlas-view', id);
    } catch {
      /* Tabs also work with browser storage disabled. */
    }
    syncViewport();
    setTimeout(() => {
      if (token !== tabTransition) return;
      for (const tab of tabs) {
        const panel = $(tab.getAttribute('aria-controls'));
        const active = panel === next;
        panel.hidden = !active;
        panel.classList.remove('tab-view-enter', 'tab-view-exit');
        if (active && delay) requestAnimationFrame(() => panel.classList.add('tab-view-enter'));
      }
      syncViewport();
      window.SolarAtlasLabels?.layout();
      onShown?.();
    }, delay);
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activateView(tab.getAttribute('aria-controls')));
    tab.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const next =
        event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? tabs.length - 1
            : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      activateView(tabs[next].getAttribute('aria-controls'));
      tabs[next].focus({ preventScroll: true });
    });
  });
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
      $('portrait-image').src = 'assets/' + id + '.png';
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
      $('dock-image').src = 'assets/' + id + '.png';
      $('dock-name').replaceChildren(document.createTextNode(body.name + ' '));
      const small = document.createElement('small');
      small.textContent = body.en;
      $('dock-name').append(small);
      $('dock-enter').href = body.link;
      $('dock-enter').setAttribute('aria-label', '进入' + body.name + '介绍页');
    }
    if (changed && announce && !reduced.matches) {
      $('portrait-image')
        .getAnimations()
        .forEach((animation) => animation.cancel());
      $('portrait-image').animate(
        [
          { opacity: 0.2, transform: 'translateY(7px) scale(.97)' },
          { opacity: 1, transform: 'translateY(0) scale(1)' },
        ],
        { duration: 320, easing: 'ease-out' },
      );
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
  function followPanelLink() {
    if (['#explorer', '#catalog'].includes(location.hash)) activateView(location.hash.slice(1));
  }
  addEventListener('hashchange', followPanelLink);
  document.querySelector('.skip').addEventListener('click', () => activateView('explorer'));
})();
