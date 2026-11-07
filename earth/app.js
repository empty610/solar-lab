(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  // Decorative scenes keep their phase while hidden and never own a JS frame loop.
  const artToggle = $('art-motion');
  let artEnabled = true;
  try { artEnabled = localStorage.getItem('solar-earth-art-motion') !== 'off'; } catch { /* Storage is optional, including file://. */ }
  const artScenes = [...document.querySelectorAll('[data-earth-scene]')].map(element => ({ element, visible: false }));
  function syncArt() {
    const playing = artEnabled && !reduced.matches;
    artScenes.forEach(({ element, visible }) => element.classList.toggle('art-active', playing && visible));
    artToggle.setAttribute('aria-pressed', String(playing));
    artToggle.querySelector('b').textContent = reduced.matches ? '静态' : playing ? '开启' : '暂停';
    artToggle.disabled = reduced.matches;
    artToggle.title = reduced.matches ? '已遵循系统的减少动态效果设置' : '开启或暂停插画中的水流、磁场、生态路径与光晕';
  }
  artScenes.forEach(record => SolarUI.activity([record.element], visible => { record.visible = visible; syncArt(); }));
  artToggle.hidden = false;
  artToggle.addEventListener('click', () => {
    artEnabled = !artEnabled;
    try { localStorage.setItem('solar-earth-art-motion', artEnabled ? 'on' : 'off'); } catch { /* Reading does not depend on storage. */ }
    syncArt();
  });
  reduced.addEventListener('change', syncArt);
  syncArt();
  const surfaceTabs = [...document.querySelectorAll('.tab-row [role="tab"]')];
  const plates = [...document.querySelectorAll('[data-surface-figure]')];
  let plateEntrance;
  SolarUI.tabs({
    buttons: surfaceTabs,
    panels: surfaceTabs.map(button => $(button.getAttribute('aria-controls'))),
    onSelect(id) {
      plateEntrance?.cancel();
      plates.forEach(plate => plate.classList.toggle('is-leaving', !plate.hidden && plate.dataset.surfaceFigure !== id.replace('-panel', '')));
    },
    onShown(id) {
      const next = plates.find(plate => plate.dataset.surfaceFigure === id.replace('-panel', ''));
      const changed = next.hidden;
      plates.forEach(plate => { plate.hidden = plate !== next; plate.classList.remove('is-leaving'); });
      if (changed) plateEntrance = SolarUI.motion(next, 'earth-figure-enter');
    },
  });
  const layerTabs = [...document.querySelectorAll('.layer-tabs [role="tab"]')];
  const highlight = id => document.querySelectorAll('.layer-shape').forEach(shape => shape.classList.toggle('is-selected', shape.dataset.layer === id.replace('-panel', '')));
  SolarUI.tabs({ buttons: layerTabs, panels: layerTabs.map(button => $(button.getAttribute('aria-controls'))), onSelect: highlight });
  highlight('crust-panel');

  // Shared tabs retain keyboard and interruption behavior. The scene and its
  // caption commit together; all descriptions remain readable without JS.
  document.querySelectorAll('.scene-controls').forEach(controls => {
    const figure = controls.closest('figure');
    const buttons = [...controls.querySelectorAll('[role="tab"]')];
    const panels = buttons.map(button => $(button.getAttribute('aria-controls')));
    panels.forEach((panel, index) => { panel.hidden = index !== 0; });
    controls.querySelector('.scene-tabs').hidden = false;
    let entrance;
    const tabs = SolarUI.tabs({ buttons, panels, onShown(id) {
      entrance?.cancel();
      const key = $(id).dataset.sceneKey;
      figure.dataset.sceneFocus = key;
      const layer = figure.querySelector('[data-scene-layer="' + key + '"]');
      if (layer) entrance = SolarUI.motion(layer, 'earth-relation-enter');
    } });
    tabs.select(panels[0].id, { animate: false });
  });

  // Reserve the tallest note at the current width so switching a topic does
  // not move the following chapter. Hidden notes remain hidden to readers.
  const decks = [...document.querySelectorAll('.panel-deck, .surface-atlas')];
  const deckWidths = new WeakMap();
  function reservePanels(deck, force = false) {
    const width = deck.clientWidth;
    if (!width || (!force && deckWidths.get(deck) === width)) return;
    deckWidths.set(deck, width);
    deck.classList.add('is-measuring');
    const height = Math.ceil(Math.max(...[...deck.children].map(panel => panel.getBoundingClientRect().height)));
    deck.classList.remove('is-measuring');
    deck.style.setProperty('--panel-height', height + 'px');
  }
  decks.forEach(deck => reservePanels(deck));
  if ('ResizeObserver' in window) {
    const sizing = new ResizeObserver(entries => entries.forEach(entry => reservePanels(entry.target)));
    decks.forEach(deck => sizing.observe(deck));
  } else window.addEventListener('resize', () => decks.forEach(deck => reservePanels(deck)));
  document.fonts?.ready.then(() => decks.forEach(deck => reservePanels(deck, true)));

  const viewer = SolarUI.dialog($('image-dialog'));
  $('earthrise-open').addEventListener('click', event => viewer.open(event.currentTarget));

  const seasons = [
    ['MARCH EQUINOX / 春分附近', '阳光，接近直射赤道。', '南北半球获得的日照较为对称，各地昼夜大致等长。'],
    ['JUNE SOLSTICE / 夏至附近', '北半球，迎来漫长白昼。', '北半球朝向太阳倾斜，白昼通常较长；南半球此时进入冬季。'],
    ['SEPTEMBER EQUINOX / 秋分附近', '日与夜，再次接近平分。', '太阳直射位置回到赤道附近，北半球进入秋季，南半球进入春季。'],
    ['DECEMBER SOLSTICE / 冬至附近', '北半球，等待日光归来。', '北半球背向太阳倾斜，白昼通常较短；南半球此时进入夏季。'],
  ];
  const seasonButtons = [...document.querySelectorAll('[data-angle]')];
  function updateSeason() {
    const angle = Number($('orbit-position').value), rad = angle * Math.PI / 180;
    const lat = Number($('latitude').value), declination = 23.44 * Math.sin(rad) * Math.PI / 180;
    const cosine = -Math.tan(lat * Math.PI / 180) * Math.tan(declination);
    const hours = cosine <= -1 ? 24 : cosine >= 1 ? 0 : 24 * Math.acos(cosine) / Math.PI;
    const x = 340 - Math.sin(rad) * 238, y = 190 - Math.cos(rad) * 118;
    $('orbit-earth').setAttribute('transform', `translate(${x.toFixed(2)} ${y.toFixed(2)})`);
    $('sun-ray').setAttribute('x2', x); $('sun-ray').setAttribute('y2', y);
    $('orbit-output').textContent = angle + '°';
    $('latitude-output').textContent = lat === 0 ? '赤道 0°' : `${lat > 0 ? '北纬' : '南纬'} ${Math.abs(lat)}°`;
    $('latitude').setAttribute('aria-valuetext', $('latitude-output').textContent);
    $('daylight-value').replaceChildren(document.createTextNode(hours.toFixed(1) + ' '), Object.assign(document.createElement('small'), { textContent: '小时' }));
    $('daylight-fill').style.width = hours / 24 * 100 + '%';
    const quarter = Math.round(angle / 90) % 4;
    const exact = angle % 90 === 0;
    $('season-label').textContent = exact ? seasons[quarter][0] : 'BETWEEN SEASONS / 四季之间';
    $('season-title').textContent = exact ? seasons[quarter][1] : `太阳直射${Math.abs(declination) < 0.0001 ? '赤道' : (declination > 0 ? '北纬 ' : '南纬 ') + (Math.abs(declination) * 180 / Math.PI).toFixed(1) + '°'}附近。`;
    $('season-description').textContent = exact ? seasons[quarter][2] : '缓慢移动公转位置，观察太阳直射纬度和当地昼长如何连续变化。';
    seasonButtons.forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.angle) === angle)));
  }
  let seasonEntrance;
  seasonButtons.forEach(button => button.addEventListener('click', () => {
    seasonEntrance?.cancel();
    $('orbit-position').value = button.dataset.angle;
    updateSeason();
    seasonEntrance = SolarUI.motion(document.querySelector('.season-summary'), 'earth-summary-enter');
  }));
  const directSeasonUpdate = () => { seasonEntrance?.cancel(); updateSeason(); };
  $('orbit-position').addEventListener('input', directSeasonUpdate);
  $('latitude').addEventListener('input', directSeasonUpdate);
  updateSeason();

  const links = [...document.querySelectorAll('.section-nav a')];
  const nav = document.querySelector('.section-nav');
  const navTrack = nav.querySelector('.wrap');
  const chapters = links.map(link => document.querySelector(link.hash));
  chapters.forEach(chapter => { chapter.tabIndex = -1; });
  let progressFrame, lastCurrent, chapterCue;
  function updateProgress() {
    progressFrame = null;
    const readingLine = nav.offsetHeight + 80;
    const bounds = chapters.map(chapter => chapter.getBoundingClientRect());
    const start = $('portrait').offsetTop - nav.offsetHeight;
    const length = document.documentElement.scrollHeight - innerHeight - start;
    nav.style.setProperty('--reading-progress', Math.max(0, Math.min(1, (scrollY - start) / Math.max(1, length))).toFixed(4));
    let index = -1;
    bounds.forEach((bound, i) => { if (bound.top <= readingLine) index = i; });
    if (scrollY + innerHeight >= document.documentElement.scrollHeight - 3) index = links.length - 1;
    const current = links[index];
    links.forEach(link => current === link ? link.setAttribute('aria-current', 'location') : link.removeAttribute('aria-current'));
    if (current) {
      const distance = index + 1 < bounds.length ? bounds[index + 1].top - bounds[index].top : bounds[index].height;
      current.style.setProperty('--chapter-progress', Math.max(0, Math.min(1, (readingLine - bounds[index].top) / distance)).toFixed(4));
    }
    if (current && current !== lastCurrent) {
      lastCurrent = current;
      chapterCue?.cancel();
      const eyebrow = chapters[index].querySelector('.eyebrow');
      if (eyebrow) chapterCue = SolarUI.motion(eyebrow, 'earth-chapter-cue');
      const trackBounds = navTrack.getBoundingClientRect(), linkBounds = current.getBoundingClientRect();
      if (linkBounds.left < trackBounds.left || linkBounds.right > trackBounds.right) {
        navTrack.scrollTo({ left: navTrack.scrollLeft + linkBounds.left - trackBounds.left - 20, behavior: reduced.matches ? 'instant' : 'smooth' });
      }
    }
    if (!current) lastCurrent = null;
  }
  function scheduleProgress() {
    if (!progressFrame) progressFrame = requestAnimationFrame(updateProgress);
  }
  function measureNav() {
    document.documentElement.style.setProperty('--earth-nav-offset', nav.offsetHeight + 24 + 'px');
    scheduleProgress();
  }
  window.addEventListener('scroll', scheduleProgress, { passive: true });
  window.addEventListener('resize', measureNav);
  window.addEventListener('pageshow', scheduleProgress);
  if ('ResizeObserver' in window) new ResizeObserver(scheduleProgress).observe(document.querySelector('main'));
  measureNav();
  if ('IntersectionObserver' in window) {
    // Observe first appearances without hiding any content before JavaScript.
    // SolarUI settles finite motion on reduced-motion, background and pagehide.
    const arrival = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        arrival.unobserve(entry.target);
        SolarUI.motion(entry.target, 'earth-arrive');
      });
    }, { threshold: .08 });
    document.querySelectorAll('.section-heading, .reading-route, .surface-atlas, .sky-art, .cutaway, .moon-visual, .reading-essay > header, .perspective-photo, .living-atlas, .timeline li, .fact-strip > div').forEach(element => arrival.observe(element));
  }
  SolarUI.motion(document.querySelector('.hero-copy'), 'earth-arrive');
  SolarUI.motion(document.querySelector('.earth-observer'), 'earth-arrive');
})();
