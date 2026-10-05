(() => {
  'use strict';
  const $ = (id) => document.getElementById(id),
    reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const photos = {
    heart: {
      file: 'pluto-global.jpg',
      title: '一颗由冰勾勒出的心',
      kicker: 'PLUTO / ENHANCED COLOR',
      copy: '新视野号在 2015 年 7 月 14 日获取的增强色影像。明亮的汤博区构成心形轮廓；增强色帮助区分表面物质差异，并非肉眼所见的自然颜色。',
      url: 'https://science.nasa.gov/resource/the-rich-color-variations-of-pluto/',
    },
    haze: {
      file: 'pluto-haze.jpg',
      title: '在背光的一侧，看见蓝色',
      kicker: 'PLUTO / BLUE HAZE',
      copy: '飞掠后回望冥王星，逆光照亮了大气中的微小颗粒。这里展示的是薄雾散射出的蓝色，不是地表海洋，也不代表空气可以呼吸。',
      url: 'https://www.nasa.gov/image-article/plutos-blue-sky/',
    },
    mountains: {
      file: 'pluto-mountains.jpg',
      title: '冰山、冰原，与一层层薄雾',
      kicker: 'PLUTO / NEAR SUNSET',
      copy: '2015 年 7 月 14 日，低角度阳光照出山脉、平原与层状薄雾。这张影像跨越约 1,250 千米的地形。水冰在冥王星的低温下足够坚硬，能够支撑高山。',
      url: 'https://science.nasa.gov/resource/plutos-majestic-mountains-frozen-plains-and-foggy-hazes/',
    },
  };
  const dialog = $('photo-dialog');
  document.querySelectorAll('[data-photo]').forEach((button) =>
    button.addEventListener('click', () => {
      const p = photos[button.dataset.photo];
      $('photo-image').src = 'assets/' + p.file;
      $('photo-image').alt = button.querySelector('img').alt;
      $('photo-title').textContent = p.title;
      $('photo-kicker').textContent = p.kicker;
      $('photo-description').textContent = p.copy;
      $('photo-source').href = p.url;
      dialog.showModal();
      document.body.style.overflow = 'hidden';
    }),
  );
  $('photo-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    const r = dialog.getBoundingClientRect();
    if (
      event.clientX < r.left ||
      event.clientX > r.right ||
      event.clientY < r.top ||
      event.clientY > r.bottom
    )
      dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.body.style.overflow = '';
  });
  document.querySelector('[data-focus=charon]').addEventListener('click', () => {
    window.PlutoObservatory?.setView('charon');
    $('observatory').scrollIntoView({ behavior: reduced.matches ? 'instant' : 'smooth' });
    document.querySelector('[data-view=charon]').focus({ preventScroll: true });
  });
  let phase = 0,
    playing = false,
    last = 0,
    inView = false;
  const slider = $('binary-phase'),
    play = $('binary-play');
  function paint() {
    const angle = (phase * Math.PI) / 180,
      c = Math.cos(angle),
      s = Math.sin(angle),
      p = [325 - 30 * c, 285 - 30 * s],
      m = [325 + 246 * c, 285 + 246 * s];
    for (const [id, pos, direction] of [
      ['binary-pluto', p, 14],
      ['binary-charon', m, -7],
    ]) {
      const group = $(id);
      group.setAttribute('transform', 'translate(' + pos.join(' ') + ')');
      group.querySelector('image').setAttribute('transform', 'rotate(' + phase + ')');
      const dot = group.querySelector('.facing-dot');
      dot.setAttribute('cx', direction * c);
      dot.setAttribute('cy', direction * s);
    }
    const line = $('binary-connection');
    for (const [name, value] of Object.entries({ x1: p[0], y1: p[1], x2: m[0], y2: m[1] }))
      line.setAttribute(name, value);
    slider.value = phase;
    $('phase-value').textContent = Math.round(phase) + '°';
    slider.setAttribute('aria-valuetext', Math.round(phase) + '度');
  }
  function feedback() {
    play.textContent = playing ? '暂停双星舞步' : '播放双星舞步';
    play.setAttribute('aria-pressed', String(playing));
  }
  slider.addEventListener('input', () => {
    playing = false;
    phase = Number(slider.value);
    paint();
    feedback();
  });
  play.addEventListener('click', () => {
    playing = !playing;
    feedback();
  });
  $('binary-reset').addEventListener('click', () => {
    playing = false;
    phase = 0;
    paint();
    feedback();
  });
  reduced.addEventListener('change', () => {
    if (reduced.matches) {
      playing = false;
      feedback();
    }
  });
  if ('IntersectionObserver' in window)
    new IntersectionObserver((entries) => {
      inView = entries[0].isIntersecting;
      last = 0;
    }).observe($('binary-svg'));
  else inView = true;
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = last ? Math.min((now - last) / 1000, 0.1) : 0;
    last = now;
    if (playing && inView && !document.hidden) {
      phase = (phase + dt * 9) % 360;
      paint();
    }
  }
  paint();
  requestAnimationFrame(frame);
  const links = [...document.querySelectorAll('.reading-nav a')],
    sections = links.map((a) => document.querySelector(a.hash));
  let pending = false;
  function updateNav() {
    pending = false;
    let index = 0;
    sections.forEach((section, i) => {
      if (section.getBoundingClientRect().top < 180) index = i;
    });
    links.forEach((a, i) => {
      if (i === index) a.setAttribute('aria-current', 'location');
      else a.removeAttribute('aria-current');
    });
  }
  addEventListener(
    'scroll',
    () => {
      if (!pending) {
        pending = true;
        requestAnimationFrame(updateNav);
      }
    },
    { passive: true },
  );
  updateNav();
  window.PlutoBinary = {
    get state() {
      return { phase, playing, inView };
    },
  };
})();
