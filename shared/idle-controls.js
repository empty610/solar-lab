(() => {
  const controls = Array.from(document.querySelectorAll('[data-idle-hide]'));
  if (!controls.length) return;

  let timer;
  let inputFrame = null;
  const visibleControls = () => controls.filter((control) => control.getClientRects().length > 0);
  const reveal = () => {
    window.clearTimeout(timer);
    const visible = visibleControls();
    visible.forEach((control) => control.classList.remove('is-idle-hidden'));
    if (!document.hidden && visible.length) {
      timer = window.setTimeout(() => {
        visibleControls().forEach((control) => {
          // Keep a keyboard user's current target visible until they leave it.
          if (!control.matches(':focus-visible')) control.classList.add('is-idle-hidden');
        });
      }, 2000);
    }
  };
  const scheduleReveal = () => {
    if (inputFrame !== null) return;
    inputFrame = requestAnimationFrame(() => {
      inputFrame = null;
      reveal();
    });
  };

  // Coalesce pointer movement so high-frequency input measures layout once per frame.
  document.addEventListener('pointermove', scheduleReveal, { passive: true });
  ['pointerdown', 'touchstart', 'keydown'].forEach((type) => {
    document.addEventListener(type, reveal, { passive: true });
  });
  controls.forEach((control) => {
    control.addEventListener('focus', reveal);
    control.addEventListener('blur', reveal);
    control.addEventListener('pointerenter', reveal);
  });
  window.addEventListener('idle-controls-reset', reveal);
  window.addEventListener('pageshow', reveal);
  document.addEventListener('visibilitychange', reveal);
  window.addEventListener('pagehide', () => {
    window.clearTimeout(timer);
    if (inputFrame !== null) cancelAnimationFrame(inputFrame);
    inputFrame = null;
  });
  reveal();
})();
