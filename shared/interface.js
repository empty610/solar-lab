(() => {
  'use strict';
  const settings = document.currentScript.dataset;
  const page = document.querySelector('.site-shell') || document.querySelector('main');
  page?.classList.add('interface-page');
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
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href]');
    if (
      !page ||
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
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    event.preventDefault();
    page.classList.add('interface-leaving');
    setTimeout(() => location.assign(destination.href), 200);
  });
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) page?.classList.remove('interface-leaving');
  });
})();
