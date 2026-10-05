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
  // Explicit opt-in only. WebAudio uses a decoded buffer, avoiding MP3 reopen gaps.
  let context,
    gain,
    buffer,
    source,
    loading,
    started = 0,
    offset = 0,
    intent = false,
    playing = false,
    request = 0,
    fallback,
    fadeFrame;
  const music = $('music');
  function musicUI(message) {
    music.setAttribute('aria-pressed', String(playing));
    music.setAttribute('aria-label', playing ? '暂停音乐' : '播放音乐');
    $('music-text').textContent = message || (playing ? 'MUSIC ON' : 'MUSIC OFF');
  }
  function stop() {
    cancelAnimationFrame(fadeFrame);
    if (fallback) fallback.pause();
    if (source) {
      offset = (offset + context.currentTime - started) % buffer.duration;
      source.stop();
      source.disconnect();
      source = null;
    }
    playing = false;
    musicUI();
  }
  async function start() {
    const token = ++request;
    musicUI('LOADING');
    try {
      if (location.protocol === 'file:' || !(window.AudioContext || window.webkitAudioContext)) {
        fallback ||= new Audio('assets/ad-astra.mp3');
        fallback.loop = true;
        fallback.volume = 0;
        await fallback.play();
        if (!intent || token !== request) {
          fallback.pause();
          return;
        }
        playing = true;
        musicUI();
        const begin = performance.now();
        const fade = (now) => {
          if (!playing) return;
          fallback.volume = Math.min(0.35, ((now - begin) / 1800) * 0.35);
          if (fallback.volume < 0.35) fadeFrame = requestAnimationFrame(fade);
        };
        fadeFrame = requestAnimationFrame(fade);
        return;
      }
      if (!context) {
        context = new (window.AudioContext || window.webkitAudioContext)();
        gain = context.createGain();
        gain.connect(context.destination);
      }
      await context.resume();
      loading ||= fetch('assets/ad-astra.mp3')
        .then((r) => {
          if (!r.ok) throw Error('Audio missing');
          return r.arrayBuffer();
        })
        .then((bytes) => context.decodeAudioData(bytes));
      buffer = await loading;
      if (!intent || token !== request) return;
      source = context.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.connect(gain);
      gain.gain.cancelScheduledValues(context.currentTime);
      gain.gain.setValueAtTime(0, context.currentTime);
      gain.gain.linearRampToValueAtTime(0.35, context.currentTime + 1.8);
      started = context.currentTime;
      source.start(0, offset);
      playing = true;
      musicUI();
    } catch (error) {
      if (token !== request) return;
      intent = false;
      playing = false;
      loading = null;
      musicUI('RETRY MUSIC');
      console.warn('Music unavailable:', error);
    }
  }
  music.addEventListener('click', () => {
    intent = !intent;
    if (intent) start();
    else {
      request++;
      stop();
    }
  });
  window.addEventListener('pagehide', () => {
    intent = false;
    request++;
    stop();
  });
})();
