/* Mercury's apparent solar motion near the second perihelion in the shared teaching timeline. */
(function () {
  'use strict';
  const science = window.MercuryScience;
  if (!science || typeof science.setDay !== 'function') return;
  const $ = (id) => document.getElementById(id);
  const dayMin = 76,
    dayMax = 100;
  const xAt = (day) => 54 + ((day - dayMin) / (dayMax - dayMin)) * 566;
  const yAt = (day) => 144 - (science.stateAt(day).solarAngleDeg + 180) * 25.5;
  function turn(lo, hi) {
    const sign = Math.sign(science.stateAt(lo).solarRateDegPerDay);
    for (let i = 0; i < 44; i++) {
      const mid = (lo + hi) / 2;
      if (Math.sign(science.stateAt(mid).solarRateDegPerDay) === sign) lo = mid;
      else hi = mid;
    }
    return (lo + hi) / 2;
  }
  const start = turn(80, 87),
    end = turn(89, 96);
  const points = [];
  for (let i = 0; i <= 240; i++) {
    const day = dayMin + ((dayMax - dayMin) * i) / 240;
    points.push(`${i ? 'L' : 'M'}${xAt(day).toFixed(2)} ${yAt(day).toFixed(2)}`);
  }
  $('sunstep-line').setAttribute('d', points.join(' '));
  $('sunstep-area').setAttribute('d', `${points.join(' ')} L620 246 L54 246 Z`);
  $('sunstep-window').setAttribute('x', xAt(start));
  $('sunstep-window').setAttribute('y', 36);
  $('sunstep-window').setAttribute('width', xAt(end) - xAt(start));
  $('sunstep-window').setAttribute('height', 211);
  $('sunstep-start').textContent = `第 ${start.toFixed(1)} 日`;
  $('sunstep-end').textContent = `第 ${end.toFixed(1)} 日`;
  $('sunstep-duration').textContent = `约 ${(end - start).toFixed(1)} 日`;
  function update(state) {
    $('sunstep-day').textContent = state.day.toFixed(1);
    const inView = state.day >= dayMin && state.day <= dayMax;
    $('sunstep-cursor').style.display = inView ? '' : 'none';
    $('sunstep-dot').style.display = inView ? '' : 'none';
    if (inView) {
      const x = xAt(state.day),
        y = yAt(state.day);
      $('sunstep-cursor').setAttribute('x1', x);
      $('sunstep-cursor').setAttribute('x2', x);
      $('sunstep-dot').setAttribute('cx', x);
      $('sunstep-dot').setAttribute('cy', y);
    }
    const status = $('sunstep-state');
    const reversing = state.day > start && state.day < end;
    const message = !inView
      ? '当前不在放大窗口'
      : reversing
        ? '太阳视运动正在反向'
        : '太阳沿通常方向移动';
    if (status.textContent !== message) status.textContent = message;
    status.dataset.mode = reversing ? 'reverse' : 'normal';
  }
  document.addEventListener('mercury:timechange', (event) => update(event.detail));
  $('sunstep-jump').addEventListener('click', () => science.setDay(start + 0.5));
  $('sunstep-peri').addEventListener('click', () => science.setDay(science.PERIOD));
  update(science.stateAt(0));
})();
