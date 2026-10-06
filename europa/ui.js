(function () {
  'use strict';
  const $ = (id) => document.getElementById(id),
    reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const nav = $('reading-nav'),
    links = [...nav.querySelectorAll('[data-chapter]')],
    sections = links.map((link) => $(link.dataset.chapter));
  let frame = 0,
    active = -1,
    toastTimer;
  function feedback(message) {
    clearTimeout(toastTimer);
    const toast = $('action-toast');
    if (toast.textContent !== message) toast.textContent = message;
    toast.classList.add('shown');
    toastTimer = setTimeout(() => {
      toast.classList.remove('shown');
      toast.textContent = '';
    }, 3600);
  }
  function readPosition() {
    frame = 0;
    const marker = nav.offsetHeight + Math.max(36, Math.min(160, window.innerHeight * 0.22));
    let index = 0;
    sections.forEach((section, i) => {
      if (section.getBoundingClientRect().top <= marker) index = i;
    });
    const atBottom =
      window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 3;
    if (atBottom) index = links.length - 1;
    if (index !== active) {
      active = index;
      links.forEach((link, i) => {
        if (i === index) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
      const title = links[index].querySelector('strong').textContent;
      $('reading-current').textContent = '正在阅读 · ' + title;
      const scroller = nav.querySelector('.chapter-links'),
        link = links[index];
      if (scroller.scrollWidth > scroller.clientWidth) {
        const left = link.offsetLeft - scroller.offsetLeft;
        if (
          left < scroller.scrollLeft ||
          left + link.offsetWidth > scroller.scrollLeft + scroller.clientWidth
        )
          scroller.scrollTo({
            left: left - scroller.clientWidth / 2 + link.offsetWidth / 2,
            behavior: reduced.matches ? 'auto' : 'smooth',
          });
      }
    }
    const first = sections[0].getBoundingClientRect().top + window.scrollY,
      last = $('sources').getBoundingClientRect().top + window.scrollY;
    const progress = Math.max(
      0,
      Math.min(
        100,
        Math.round(((window.scrollY + marker - first) / Math.max(1, last - first)) * 100),
      ),
    );
    $('reading-progress').value = progress;
    $('reading-percent').textContent = progress + '%';
  }
  function schedule() {
    if (!frame) frame = requestAnimationFrame(readPosition);
  }
  function resize() {
    document.documentElement.style.setProperty('--reading-offset', nav.offsetHeight + 28 + 'px');
    schedule();
  }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', resize);
  new ResizeObserver(resize).observe(nav);
  resize();
  function camera(id, state) {
    const name = { europa: '木卫二近景', jupiter: '木星近景', system: '轨道全景' }[id];
    $('camera-state').dataset.state = state;
    $('model-stage').setAttribute('aria-busy', String(state === 'flying'));
    $('camera-state').textContent =
      state === 'error'
        ? '三维不可用 · 可继续阅读影像'
        : state === 'flying'
          ? '镜头移动中 → ' + name
          : name + ' · 可以观察';
  }
  window.EuropaUI = { feedback, camera };
})();
