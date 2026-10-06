(function () {
  'use strict';
  const $ = (id) => document.getElementById(id),
    D = window.NeptuneData,
    reduced = matchMedia('(prefers-reduced-motion: reduce)');
  // Every orbital control reads/writes this one state, so the Sun and buttons never drift.
  let years = 0,
    orbitPlaying = !reduced.matches,
    speed = 3,
    orbitVisible = true,
    last = 0;
  const orbit = $('orbit'),
    slider = $('orbit-time'),
    sun = $('sun-toggle'),
    play = $('orbit-play');
  function syncOrbit() {
    play.textContent = orbitPlaying ? '暂停演示' : '继续演示';
    play.setAttribute('aria-pressed', String(orbitPlaying));
    sun.setAttribute('aria-pressed', String(orbitPlaying));
    sun.setAttribute('aria-label', orbitPlaying ? '暂停日心轨道演示' : '继续日心轨道演示');
  }
  function drawOrbit() {
    const angles = D.heliocentric(years);
    for (const [id, r, a] of [
      ['earth', 78, angles.earth],
      ['neptune', 208, angles.neptune],
    ])
      $(id + '-dot').setAttribute(
        'transform',
        `translate(${300 + r * Math.cos(a)},${265 - r * Math.sin(a)})`,
      );
    $('year-value').textContent = years.toFixed(1);
    $('orbit-progress').textContent =
      '海王星公转 ' + ((years / D.neptuneYear) * 100).toFixed(1) + '%';
    slider.value = String(years);
  }
  function toggleOrbit() {
    orbitPlaying = !orbitPlaying;
    syncOrbit();
  }
  play.addEventListener('click', toggleOrbit);
  sun.addEventListener('click', toggleOrbit);
  sun.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleOrbit();
    }
  });
  slider.addEventListener('input', () => {
    years = Number(slider.value);
    orbitPlaying = false;
    syncOrbit();
    drawOrbit();
  });
  $('orbit-reset').addEventListener('click', () => {
    years = 0;
    drawOrbit();
  });
  $('orbit-speed').addEventListener('change', (e) => {
    speed = Number(e.target.value);
  });
  if ('IntersectionObserver' in window)
    new IntersectionObserver((entries) => {
      orbitVisible = entries[0].isIntersecting;
    }).observe(orbit);
  reduced.addEventListener('change', () => {
    if (reduced.matches) {
      orbitPlaying = false;
      syncOrbit();
    }
  });
  function orbitFrame(now) {
    const dt = Math.min((now - last) / 1000, 0.08);
    last = now;
    if (orbitPlaying && orbitVisible && !document.hidden) {
      years = (years + dt * speed) % D.neptuneYear;
      drawOrbit();
    }
    requestAnimationFrame(orbitFrame);
  }
  syncOrbit();
  drawOrbit();
  requestAnimationFrame(orbitFrame);
  window.NeptuneOrbit = {
    get state() {
      return { years, playing: orbitPlaying, speed };
    },
  };
  // Native dialog supplies focus trapping, Escape and focus restoration.
  const dialog = $('photo-dialog');
  document.querySelectorAll('[data-photo]').forEach((button) =>
    button.addEventListener('click', () => {
      const photo = D.photos[button.dataset.photo];
      $('photo-image').src = photo.src;
      $('photo-image').alt = photo.title;
      $('photo-title').textContent = photo.title;
      $('photo-tag').textContent = photo.tag;
      $('photo-description').replaceChildren();
      for (const text of [...photo.paragraphs, '影像来源：' + photo.credit]) {
        const p = document.createElement('p');
        p.textContent = text;
        $('photo-description').append(p);
      }
      $('photo-source').href = photo.url;
      dialog.showModal();
      dialog.scrollTop = 0;
      document.documentElement.style.overflow = 'hidden';
    }),
  );
  $('close-photo').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    document.documentElement.style.overflow = '';
  });
  dialog.addEventListener('click', (e) => {
    if (e.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)
      dialog.close();
  });
  // Fade in only when JS and IntersectionObserver are available; otherwise show all content.
  if ('IntersectionObserver' in window && !reduced.matches) {
    document.documentElement.classList.add('motion');
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in-view');
            observer.unobserve(e.target);
          }
        }),
      { threshold: 0.05 },
    );
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
  }
  const floating = [...document.querySelectorAll('.floating')];
  let idle;
  function wake() {
    clearTimeout(idle);
    floating.forEach((el) => el.classList.remove('is-idle'));
    idle = setTimeout(
      () =>
        floating.forEach((el) => {
          if (el !== document.activeElement) el.classList.add('is-idle');
        }),
      2000,
    );
  }
  ['pointermove', 'pointerdown', 'keydown'].forEach((type) =>
    window.addEventListener(type, wake, { passive: true }),
  );
  floating.forEach((el) => {
    el.addEventListener('focus', wake);
    el.addEventListener('blur', wake);
  });
  window.addEventListener('pageshow', wake);
  wake();
})();
