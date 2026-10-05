/* A teaching model, not an ephemeris. Distances in AU; time in Earth days. */
(function () {
  'use strict';
  const TAU = Math.PI * 2,
    PERIOD = 87.969,
    A = 0.387098,
    ECC = 0.20563;
  const AU_KM = 149597870.7,
    MU = 1.32712440018e11,
    END = PERIOD * 2;
  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
  function stateAt(day) {
    const mean = (TAU * day) / PERIOD;
    const m = ((mean % TAU) + TAU) % TAU;
    let e = m;
    for (let i = 0; i < 8; i++) e -= (e - ECC * Math.sin(e) - m) / (1 - ECC * Math.cos(e));
    const x = A * (Math.cos(e) - ECC),
      y = A * Math.sqrt(1 - ECC * ECC) * Math.sin(e);
    const r = Math.hypot(x, y),
      earthAngle = 2.1 + (TAU * day) / 365.256;
    const ex = Math.cos(earthAngle),
      ey = Math.sin(earthAngle);
    const dx = ex - x,
      dy = ey - y,
      delta = Math.hypot(dx, dy);
    const phaseCos = clamp((-x * dx - y * dy) / (r * delta), -1, 1);
    const elongation = (Math.acos(clamp((ex * dx + ey * dy) / delta, -1, 1)) * 180) / Math.PI;
    const east = -ex * (y - ey) - -ey * (x - ex) >= 0;
    const trueAngle = Math.atan2(y, x),
      spinAngle = mean * 1.5 + Math.PI;
    const trueUnwrapped =
      2 * Math.atan2(Math.sqrt(1 + ECC) * Math.sin(e / 2), Math.sqrt(1 - ECC) * Math.cos(e / 2)) +
      TAU * Math.floor(day / PERIOD);
    const meanMotion = TAU / PERIOD;
    const solarAngleDeg = ((trueUnwrapped - 1.5 * mean) * 180) / Math.PI;
    const solarRateDegPerDay =
      (((meanMotion * Math.sqrt(1 - ECC * ECC)) / (1 - ECC * Math.cos(e)) ** 2 - 1.5 * meanMotion) *
        180) /
      Math.PI;
    const markerAngle = spinAngle - trueAngle;
    return {
      day,
      x,
      y,
      ex,
      ey,
      r,
      delta,
      east,
      phaseCos,
      illuminated: (1 + phaseCos) / 2,
      elongation,
      speed: Math.sqrt(MU * (2 / (r * AU_KM) - 1 / (A * AU_KM))),
      irradiance: 1 / (r * r),
      diameter: ((2 * 2439.7) / (delta * AU_KM)) * 206264.806,
      revolutions: day / PERIOD,
      rotations: (1.5 * day) / PERIOD,
      markerAngle,
      solarAngleDeg,
      solarRateDegPerDay,
      solarAltitude: (Math.asin(clamp(-Math.cos(markerAngle), -1, 1)) * 180) / Math.PI,
    };
  }
  window.MercuryScience = { stateAt, PERIOD, END };
  if (typeof document === 'undefined') return;
  const $ = (id) => document.getElementById(id);
  const phaseCanvas = $('phase-canvas'),
    ctx = phaseCanvas.getContext('2d');
  let day = 0,
    playing = false,
    speed = 6,
    lastFrame = 0,
    renderAfter = 0;
  const point = (x, y) => [310 + 210 * x, 248 - 210 * y];
  let path = '';
  for (let i = 0; i <= 180; i++) {
    const e = (i / 180) * TAU;
    const [x, y] = point(A * (Math.cos(e) - ECC), A * Math.sqrt(1 - ECC * ECC) * Math.sin(e));
    path += `${i ? 'L' : 'M'}${x.toFixed(3)} ${y.toFixed(3)}`;
  }
  $('mercury-orbit').setAttribute('d', path + 'Z');
  function drawPhase(s) {
    if (!ctx) return;
    const size = 140,
      image = ctx.createImageData(size, size),
      radius = 65;
    const sx = Math.sqrt(Math.max(0, 1 - s.phaseCos * s.phaseCos)) * (s.east ? 1 : -1);
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        const nx = (x - size / 2) / radius,
          ny = (y - size / 2) / radius,
          q = nx * nx + ny * ny;
        if (q > 1) continue;
        const nz = Math.sqrt(1 - q),
          light = Math.max(0, nx * sx + nz * s.phaseCos);
        const shade = 0.13 + 0.87 * Math.sqrt(light),
          i = (y * size + x) * 4;
        image.data[i] = 203 * shade;
        image.data[i + 1] = 192 * shade;
        image.data[i + 2] = 168 * shade;
        image.data[i + 3] = Math.min(255, (1 - q) * 24000);
      }
    // The offscreen disk is drawn at a fixed resolution; phase changes, not layout.
    const off = drawPhase.buffer || (drawPhase.buffer = document.createElement('canvas'));
    off.width = size;
    off.height = size;
    off.getContext('2d').putImageData(image, 0, 0);
    ctx.clearRect(0, 0, 200, 200);
    ctx.drawImage(off, 0, 0, 200, 200);
  }
  function render() {
    const s = stateAt(day),
      [mx, my] = point(s.x, s.y),
      [ex, ey] = point(s.ex, s.ey);
    $('mercury-dot').setAttribute('transform', `translate(${mx} ${my})`);
    $('earth-dot').setAttribute('transform', `translate(${ex} ${ey})`);
    for (const [id, a, b, c, d] of [
      ['sight-line', ex, ey, mx, my],
      ['radius-line', 310, 248, mx, my],
    ]) {
      const line = $(id);
      line.setAttribute('x1', a);
      line.setAttribute('y1', b);
      line.setAttribute('x2', c);
      line.setAttribute('y2', d);
    }
    $('distance').textContent = s.r.toFixed(3);
    $('velocity').textContent = s.speed.toFixed(1);
    $('irradiance').textContent = s.irradiance.toFixed(2);
    $('elongation').textContent = s.elongation.toFixed(1);
    $('diameter').textContent = s.diameter.toFixed(1);
    $('illumination').textContent = (s.illuminated * 100).toFixed(1) + '%';
    $('phase-name').textContent =
      s.illuminated < 0.03
        ? '近新相'
        : s.illuminated > 0.97
          ? '近满相'
          : s.illuminated < 0.48
            ? '弯月相'
            : s.illuminated > 0.52
              ? '凸月相'
              : '近半相';
    $('visibility-label').textContent =
      s.elongation < 5 ? '接近太阳方向' : s.east ? '东侧 · 昏星方向' : '西侧 · 晨星方向';
    $('orbit-count').textContent = s.revolutions.toFixed(2) + ' 圈';
    $('spin-count').textContent = s.rotations.toFixed(2) + ' 圈';
    $('sun-altitude').textContent = s.solarAltitude.toFixed(1) + '°';
    const px = 327 + 64 * Math.cos(s.markerAngle),
      py = 128 - 64 * Math.sin(s.markerAngle);
    $('surface-marker').setAttribute('cx', px);
    $('surface-marker').setAttribute('cy', py);
    $('surface-radius').setAttribute('x2', px);
    $('surface-radius').setAttribute('y2', py);
    $('day-label').textContent = day.toFixed(1);
    $('time-slider').value = day;
    $('time-slider').setAttribute('aria-valuetext', `${day.toFixed(1)} 个地球日`);
    phaseCanvas.setAttribute(
      'aria-label',
      `水星相位示意，照明比例 ${(s.illuminated * 100).toFixed(1)}%`,
    );
    drawPhase(s);
    document.dispatchEvent(new CustomEvent('mercury:timechange', { detail: s }));
  }
  function setPlaying(value) {
    playing = value;
    lastFrame = 0;
    $('play').textContent = playing ? '暂停演示' : day >= END ? '重新播放' : '播放演示';
    $('play').setAttribute('aria-pressed', String(playing));
    $('sun-toggle').setAttribute('aria-pressed', String(playing));
    $('sun-toggle').setAttribute('aria-label', playing ? '暂停轨道演示' : '播放轨道演示');
    document.dispatchEvent(
      new CustomEvent('mercury:playchange', { detail: { playing, day, speed } }),
    );
  }
  function toggle() {
    if (day >= END && !playing) {
      day = 0;
      render();
    }
    setPlaying(!playing);
  }
  $('play').addEventListener('click', toggle);
  $('sun-toggle').addEventListener('click', toggle);
  $('sun-toggle').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggle();
    }
  });
  function setDay(value) {
    day = clamp(value, 0, END);
    setPlaying(false);
    render();
  }
  window.MercuryScience.setDay = setDay;
  // UI controls subscribe to the same simulation; no second timer or duplicate state.
  window.MercuryScience.toggle = toggle;
  window.MercuryScience.getState = () => ({ day, playing, speed });
  $('time-slider').addEventListener('input', (e) => setDay(Number(e.target.value)));
  $('reset-time').addEventListener('click', () => setDay(0));
  $('perihelion').addEventListener('click', () => setDay(0));
  $('aphelion').addEventListener('click', () => setDay(PERIOD / 2));
  $('speed').addEventListener('change', (e) => {
    speed = Number(e.target.value);
  });
  document.addEventListener('visibilitychange', () => {
    lastFrame = 0;
  });
  function tick(now) {
    if (playing && !document.hidden) {
      if (lastFrame) day = Math.min(END, day + Math.min((now - lastFrame) / 1000, 0.1) * speed);
      lastFrame = now;
      if (now >= renderAfter || day >= END) {
        render();
        renderAfter = now + 32;
      }
      if (day >= END) setPlaying(false);
    }
    requestAnimationFrame(tick);
  }
  render();
  requestAnimationFrame(tick);
})();
