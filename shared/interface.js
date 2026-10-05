(() => {
  'use strict';
  const settings = document.currentScript.dataset;
  if (settings.terminal) {
    const back = document.querySelector('.back-button, .floating.back, .back-top');
    if (back && !back.hasAttribute('hidden')) {
      back.href = settings.terminal;
      back.setAttribute('aria-label', '返回太阳系 Terminal');
      back.title = '返回太阳系 Terminal';
      if (back.classList.contains('back-top')) back.innerHTML = '← <span>BACK</span>';
    } else {
      const link = document.createElement('a');
      link.className = 'archive-back';
      link.href = settings.terminal;
      link.textContent = '← BACK';
      link.setAttribute('aria-label', '返回太阳系 Terminal');
      document.body.append(link);
    }
  }
  const observedDialogs = new WeakSet();
  function prepareDialog(dialog) {
    if (!dialog.classList.contains('archive-dialog')) dialog.classList.add('archive-dialog');
    if (!dialog.open) return;
    for (const description of dialog.querySelectorAll('.terrain-description[hidden]'))
      description.hidden = false;
    for (const toggle of dialog.querySelectorAll('.terrain-toggle:not([hidden])'))
      toggle.hidden = true;
  }
  function observeDialogs() {
    for (const dialog of document.querySelectorAll('dialog')) {
      if (observedDialogs.has(dialog)) continue;
      observedDialogs.add(dialog);
      prepareDialog(dialog);
      new MutationObserver(() => prepareDialog(dialog)).observe(dialog, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['open'],
      });
    }
  }
  observeDialogs();
  new MutationObserver(observeDialogs).observe(document.body, { childList: true });
  // Reuse the personal site's DC hand-off, including its two-frame first paint.
  const transition = document.createElement('div');
  transition.id = 'dc-page-transition';
  transition.className = 'dc-page-transition';
  transition.setAttribute('aria-hidden', 'true');
  transition.innerHTML =
    '<div class="dc-transition-core"><span class="dc-transition-orbit dc-transition-orbit-a"></span><span class="dc-transition-orbit dc-transition-orbit-b"></span><span class="dc-transition-signal"></span><p role="status" aria-live="polite"></p></div>';
  document.body.append(transition);
  const archives = [
    ['terminal', /\/(?:terminal|terminal_preview)\//i],
    ['mercury', /\/(?:mercury|mercury_preview)\//i],
    ['venus', /\/(?:venus|venus_preview)\//i],
    ['mars', /\/(?:mars|mars_preview)\//i],
    ['jupiter', /\/(?:jupiter|jupiter_preview)\//i],
    ['saturn', /\/(?:saturn|saturn_preview)\//i],
    ['neptune', /\/(?:neptune|neptune_preview)\//i],
    ['europa', /\/(?:europa|europa_preview)\//i],
    ['pluto', /\/(?:pluto|pluto_preview)\//i],
  ];
  let navigationPending = false;
  let navigationTimer;
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href]');
    if (
      !link ||
      event.defaultPrevented ||
      event.button !== 0 ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.altKey ||
      link.target ||
      link.hasAttribute('download')
    )
      return;
    const destination = new URL(link.href);
    if (
      destination.origin !== location.origin ||
      destination.pathname === location.pathname ||
      !destination.pathname.endsWith('.html')
    )
      return;
    const archive = archives.find(([, pattern]) => pattern.test(destination.pathname));
    if (!archive) return;
    // Like the original site, reduced motion keeps the connection screen visible.
    // The CSS removes orbit motion while retaining the one-second hand-off.
    event.preventDefault();
    if (navigationPending) return;
    navigationPending = true;
    transition.querySelector('p').textContent = `${archive[0].toUpperCase()} // ESTABLISHING LINK`;
    transition.setAttribute('aria-hidden', 'false');
    transition.classList.add('is-mounted');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!navigationPending) return;
        transition.classList.add('is-active');
        navigationTimer = setTimeout(() => location.assign(destination.href), 1000);
      });
    });
  });
  window.addEventListener('pageshow', (event) => {
    if (!event.persisted) return;
    clearTimeout(navigationTimer);
    navigationPending = false;
    transition.classList.remove('is-mounted', 'is-active');
    transition.setAttribute('aria-hidden', 'true');
  });
})();
