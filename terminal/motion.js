(() => {
  'use strict';
  const chart = document.getElementById('star-map'),
    group = chart.querySelector('.orbital-paths'),
    play = document.getElementById('atlas-play'),
    speedControl = document.getElementById('atlas-speed'),
    status = document.getElementById('atlas-motion-status');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const configurations = {
    mercury: [62, 44, -0.75, 64],
    venus: [103, 73, 3.1, 83],
    earth: [146, 104, 1.46, 104],
    mars: [191, 136, 3.84, 127],
    jupiter: [266, 188, -0.31, 167],
    saturn: [321, 226, 2.27, 203],
    uranus: [371, 261, 3.84, 242],
    neptune: [421, 294, 0.35, 287],
    pluto: [445, 308, 1.15, 330],
  };
  const points = Object.entries(configurations).map(([id, values]) => ({
    id,
    element: chart.querySelector('[data-select="' + id + '"]'),
    values,
  }));
  // Labels share these coordinates instead of measuring moving DOM elements.
  const positions = Object.fromEntries(points.map(({ id }) => [id, { x: 0, y: 0 }]));
  const panel = chart.closest('[role="tabpanel"]');
  let elapsed = 0,
    speed = 1,
    playing = !reduced.matches,
    inView = true,
    last = null,
    frameId = null,
    width = 0,
    height = 0,
    scale = 1;
  for (const { element } of points) {
    element.style.left = '0';
    element.style.top = '0';
  }
  function paint(placeLabels = false) {
    if (!width || !height) return;
    for (const point of points) {
      const [rx, ry, phase, period] = point.values,
        a = phase - (elapsed / period) * Math.PI * 2,
        position = positions[point.id];
      position.x = ((450 + rx * scale * Math.cos(a)) / 920) * width;
      position.y = ((315 + ry * scale * Math.sin(a)) / 630) * height;
      point.element.style.transform =
        `translate3d(${position.x}px, ${position.y}px, 0) translate(-50%, -50%)`;
    }
    chart.dataset.elapsed = elapsed.toFixed(3);
    window.SolarAtlasLabels?.layout(placeLabels);
  }
  function resize() {
    width = chart.clientWidth;
    height = chart.clientHeight;
    scale = innerWidth <= 560 ? 0.86 : 1;
    group.setAttribute('transform', 'translate(450 315) scale(' + scale + ')');
    paint();
  }
  function canAnimate() {
    return playing && inView && !document.hidden && !panel?.hidden;
  }
  function syncAnimation() {
    last = null;
    if (frameId !== null) cancelAnimationFrame(frameId);
    frameId = canAnimate() ? requestAnimationFrame(frame) : null;
  }
  function feedback() {
    play.setAttribute('aria-pressed', String(playing));
    play.textContent = playing ? '暂停运转' : '开始运转';
    status.textContent = !playing
      ? '已暂停 · 可以选择天体'
      : '持续运转 · 可以选择天体';
  }
  play.addEventListener('click', () => {
    playing = !playing;
    feedback();
    syncAnimation();
  });
  speedControl.addEventListener('change', () => {
    speed = Number(speedControl.value);
  });
  document.getElementById('atlas-reset').addEventListener('click', () => {
    elapsed = 0;
    last = null;
    paint(true);
    feedback();
  });
  reduced.addEventListener('change', () => {
    if (reduced.matches) {
      playing = false;
      feedback();
      syncAnimation();
    }
  });
  if ('IntersectionObserver' in window)
    new IntersectionObserver(
      (entries) => {
        inView = entries[0].isIntersecting;
        syncAnimation();
      },
      { threshold: 0 },
    ).observe(chart);
  document.addEventListener('visibilitychange', syncAnimation);
  if (panel)
    new MutationObserver(syncAnimation).observe(panel, {
      attributes: true,
      attributeFilter: ['hidden'],
    });
  new ResizeObserver(resize).observe(chart);
  addEventListener('resize', resize);
  function frame(now) {
    frameId = null;
    if (!canAnimate()) return;
    const dt = last === null ? 0 : Math.min((now - last) / 1000, 0.1);
    last = now;
    elapsed += dt * speed;
    paint();
    frameId = requestAnimationFrame(frame);
  }
  window.SolarAtlasMotion = {
    getPosition(id) {
      return positions[id];
    },
    get state() {
      return { elapsed, speed, playing, inView };
    },
  };
  resize();
  feedback();
  syncAnimation();
})();
