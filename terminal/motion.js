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
  let elapsed = 0,
    speed = 1,
    playing = !reduced.matches,
    hovered = false,
    focused = false,
    inView = true,
    last = 0,
    accumulator = 0;
  function paint() {
    const scale = innerWidth <= 560 ? 0.86 : 1;
    group.setAttribute('transform', 'translate(450 315) scale(' + scale + ')');
    for (const point of points) {
      const [rx, ry, phase, period] = point.values,
        a = phase - (elapsed / period) * Math.PI * 2;
      point.element.style.left = ((450 + rx * scale * Math.cos(a)) / 920) * 100 + '%';
      point.element.style.top = ((315 + ry * scale * Math.sin(a)) / 630) * 100 + '%';
    }
    chart.dataset.elapsed = elapsed.toFixed(3);
    window.SolarAtlasLabels?.layout();
  }
  function feedback() {
    play.setAttribute('aria-pressed', String(playing));
    play.textContent = playing ? '暂停运转' : '开始运转';
    status.textContent = !playing
      ? '已暂停 · 可以选择天体'
      : hovered || focused
        ? '暂时停驻 · 移开后继续'
        : '持续运转 · 悬停可停驻';
  }
  play.addEventListener('click', () => {
    playing = !playing;
    feedback();
  });
  speedControl.addEventListener('change', () => {
    speed = Number(speedControl.value);
  });
  document.getElementById('atlas-reset').addEventListener('click', () => {
    elapsed = 0;
    paint();
    feedback();
  });
  chart.addEventListener('pointerenter', (event) => {
    if (event.pointerType === 'mouse') {
      hovered = true;
      feedback();
    }
  });
  chart.addEventListener('pointerleave', () => {
    hovered = false;
    feedback();
  });
  chart.addEventListener('focusin', () => {
    focused = true;
    feedback();
  });
  chart.addEventListener('focusout', () => {
    queueMicrotask(() => {
      focused = chart.contains(document.activeElement);
      feedback();
    });
  });
  reduced.addEventListener('change', () => {
    if (reduced.matches) {
      playing = false;
      feedback();
    }
  });
  if ('IntersectionObserver' in window)
    new IntersectionObserver(
      (entries) => {
        inView = entries[0].isIntersecting;
        last = 0;
      },
      { threshold: 0 },
    ).observe(chart);
  document.addEventListener('visibilitychange', () => {
    last = 0;
  });
  addEventListener('resize', paint);
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = last ? Math.min((now - last) / 1000, 0.1) : 0;
    last = now;
    if (!playing || hovered || focused || !inView || document.hidden || chart.closest('[hidden]'))
      return;
    accumulator += dt;
    if (accumulator < 1 / 30) return;
    elapsed += accumulator * speed;
    accumulator = 0;
    paint();
  }
  paint();
  feedback();
  requestAnimationFrame(frame);
  window.SolarAtlasMotion = {
    get state() {
      return { elapsed, speed, playing, hovered, focused, inView };
    },
  };
})();
