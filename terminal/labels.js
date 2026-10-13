(() => {
  'use strict';
  const chart = document.getElementById('star-map');
  const sun = chart.querySelector('.sun-disc');
  const sunName = chart.querySelector('.sun-name');
  const layer = document.createElement('div');
  layer.className = 'map-label-layer';
  layer.setAttribute('aria-hidden', 'true');
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('map-label-leaders');
  svg.setAttribute('aria-hidden', 'true');
  const labels = [...chart.querySelectorAll('.body-point')].map((point) => {
    const label = point.querySelector('.body-label');
    label.dataset.body = point.dataset.select;
    label.dataset.unavailable = String(point.classList.contains('unavailable'));
    layer.append(label);
    const line = document.createElementNS(svg.namespaceURI, 'line');
    svg.append(line);
    return { point, label, line };
  });
  chart.append(svg, layer);
  let width = 0,
    height = 0,
    measure = true,
    sunRadius = 0,
    sunLabel,
    lastPlacement = -Infinity;
  function refresh() {
    width = chart.clientWidth;
    height = chart.clientHeight;
    measure = true;
    layout();
  }
  function overlaps(a, b) {
    return a.x < b.x + b.w + 4 && a.x + a.w + 4 > b.x && a.y < b.y + b.h + 4 && a.y + a.h + 4 > b.y;
  }
  function touches(rect, disc) {
    const x = Math.max(rect.x, Math.min(disc.x, rect.x + rect.w));
    const y = Math.max(rect.y, Math.min(disc.y, rect.y + rect.h));
    return Math.hypot(x - disc.x, y - disc.y) < disc.r + 5;
  }
  function layout(force = false) {
    if (!width || !height || chart.closest('[hidden]')) return;
    for (const item of labels) {
      const selected = item.point.getAttribute('aria-pressed') === 'true';
      if (item.label.dataset.selected !== String(selected)) {
        item.label.dataset.selected = String(selected);
        measure = true;
      }
    }
    const now = performance.now();
    // Follow the planets every frame; only reconsider collision avoidance at
    // 10 Hz, or immediately when label sizes/selection change.
    const place = force || measure || now - lastPlacement >= 100;
    if (place) lastPlacement = now;
    if (measure) {
      for (const item of labels) {
        item.w = item.label.offsetWidth;
        item.h = item.label.offsetHeight;
        item.r = item.point.querySelector('img, .schematic-planet').offsetWidth / 2;
      }
      sunRadius = sun.offsetWidth / 2;
      sunLabel = {
        x: width * 0.48913 - sunName.offsetWidth / 2,
        y: height * 0.5 + sunName.offsetTop - sun.offsetHeight / 2,
        w: sunName.offsetWidth,
        h: sunName.offsetHeight,
      };
      measure = false;
    }
    const discs = labels.map((item) => {
      const position = window.SolarAtlasMotion?.getPosition(item.point.dataset.select);
      return {
        x: position?.x ?? (parseFloat(item.point.style.left) / 100) * width,
        y: position?.y ?? (parseFloat(item.point.style.top) / 100) * height,
        r: item.r,
        item,
      };
    });
    const occupied = [sunLabel];
    const obstacles = [...discs, { x: width * 0.48913, y: height / 2, r: sunRadius }];
    // Inner planets have the least room. Place their labels first and keep all
    // labels above the planet images, outside every disc and existing label.
    for (const disc of discs) {
      const { item, x, y, r } = disc;
      const preferred = ['mercury', 'pluto'].includes(item.point.dataset.select) ? -1 : 1;
      const candidates = [];
      if (!place && item.position) {
        candidates.push({ x: x + item.offsetX, y: y + item.offsetY });
      } else
        for (const gap of [8, 20, 36, 56, 80, 112]) {
          candidates.push(
            { x: x - item.w / 2, y: y + r + gap, direction: 1 },
            { x: x - item.w / 2, y: y - r - gap - item.h, direction: -1 },
            { x: x + r + gap, y: y - item.h / 2 },
            { x: x - r - gap - item.w, y: y - item.h / 2 },
            { x: x + r + gap, y: y + r + gap },
            { x: x - r - gap - item.w, y: y - r - gap - item.h },
            { x: x + r + gap, y: y - r - gap - item.h },
            { x: x - r - gap - item.w, y: y + r + gap },
          );
        }
      let best;
      let score = Infinity;
      let placement;
      for (const [index, candidate] of candidates.entries()) {
        const rect = {
          x: Math.max(3, Math.min(width - item.w - 3, candidate.x)),
          y: Math.max(3, Math.min(height - item.h - 3, candidate.y)),
          w: item.w,
          h: item.h,
        };
        const blocked =
          occupied.some((other) => overlaps(rect, other)) ||
          obstacles.some((other) => touches(rect, other));
        const distance = Math.hypot(rect.x + rect.w / 2 - x, rect.y + rect.h / 2 - y);
        const movement = item.position
          ? Math.hypot(rect.x - item.position.x, rect.y - item.position.y)
          : 0;
        const cost =
          (blocked ? 10000 : 0) +
          distance +
          Math.min(movement, 30) * 0.35 +
          (index === item.placement ? 0 : 10) +
          (candidate.direction === preferred ? 0 : 8);
        if (cost < score) {
          best = rect;
          score = cost;
          placement = index;
        }
      }
      occupied.push(best);
      item.position = best;
      if (place) {
        item.placement = placement;
        item.offsetX = best.x - x;
        item.offsetY = best.y - y;
      }
      item.label.style.transform = `translate3d(${best.x}px, ${best.y}px, 0)`;
      const endX = Math.max(best.x, Math.min(x, best.x + best.w));
      const endY = Math.max(best.y, Math.min(y, best.y + best.h));
      const distance = Math.hypot(endX - x, endY - y);
      item.line.style.display = distance > r + 16 ? '' : 'none';
      if (distance <= r + 16) continue;
      item.line.setAttribute('x1', x + ((endX - x) * (r + 3)) / distance);
      item.line.setAttribute('y1', y + ((endY - y) * (r + 3)) / distance);
      item.line.setAttribute('x2', endX);
      item.line.setAttribute('y2', endY);
    }
  }
  window.SolarAtlasLabels = { layout };
  new ResizeObserver(refresh).observe(chart);
  document.fonts.ready.then(refresh);
  refresh();
})();
