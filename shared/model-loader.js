/* Keep three-dimensional dependencies out of the document's startup queue. */
(() => {
  'use strict';
  const pending = new Map();
  function loadScript(url, { timeout = 30000 } = {}) {
    const source = new URL(url, document.baseURI).href;
    if (!pending.has(source)) pending.set(source, new Promise((resolve, reject) => {
      const script = document.createElement('script');
      let settled = false;
      const finish = error => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        script.onload = script.onerror = null;
        if (error) { script.remove(); reject(error); }
        else resolve();
      };
      const timer = setTimeout(() => finish(new Error('Timed out loading ' + source)), timeout);
      script.fetchPriority = 'high';
      script.onload = () => finish();
      script.onerror = () => finish(new Error('Could not load ' + source));
      script.src = source;
      document.head.append(script);
    }));
    return pending.get(source);
  }
  async function loadDetail(id) {
    const template = [...document.querySelectorAll('template[data-model-detail]')]
      .find(element => element.dataset.modelDetail === id);
    if (!template) throw new Error('Missing model detail: ' + id);
    for (const script of template.content.querySelectorAll('script[src]'))
      await loadScript(script.getAttribute('src'));
  }
  window.ModelLoader = Object.freeze({ loadScript, loadDetail });
  for (const template of document.querySelectorAll('template[data-model-target]')) {
    const stage = document.getElementById(template.dataset.modelTarget);
    if (!stage) continue;
    const section = stage.closest('section') || stage;
    const buttons = [...section.querySelectorAll('[data-view], .model-controls button, .model-actions button, .button-row button')]
      .map(button => [button, button.disabled]);
    buttons.forEach(([button]) => { button.disabled = true; });
    let started = false, requestedView;
    const scripts = [...template.content.querySelectorAll('script[src]')]
      .filter(script => !script.hasAttribute('data-file-only') || location.protocol === 'file:');
    const restore = () => buttons.forEach(([button, disabled]) => { button.disabled = disabled; });
    const rememberView = event => {
      const target = event.target.closest('[data-view], [data-focus], [data-look]');
      if (target) requestedView = target.dataset.view || target.dataset.focus || target.dataset.look;
    };
    document.addEventListener('click', rememberView, true);
    function finishSelection() {
      if (!['loaded', 'error'].includes(stage.dataset.modelLoad)) return;
      const loading = document.getElementById('model-loading');
      if (stage.dataset.modelLoad === 'loaded' && loading && !loading.hidden) return;
      selectionObserver.disconnect();
      document.removeEventListener('click', rememberView, true);
      const fallback = document.getElementById('model-fallback') || document.getElementById('model-error');
      if (stage.dataset.modelLoad === 'error' || (fallback && !fallback.hidden)) return;
      if (requestedView) [...section.querySelectorAll('[data-view]')]
        .find(button => button.dataset.view === requestedView)?.click();
    }
    const selectionObserver = new MutationObserver(finishSelection);
    selectionObserver.observe(section, { subtree: true, attributes: true, attributeFilter: ['hidden', 'data-model-load'] });
    function fail(error) {
      stage.dataset.modelLoad = 'error';
      stage.classList.add('is-error');
      const loading = document.getElementById('model-loading');
      if (loading) loading.hidden = true;
      const fallback = document.getElementById('model-fallback') || document.getElementById('model-error');
      if (fallback) fallback.hidden = false;
      const status = document.getElementById('model-status');
      if (status) status.textContent = '图文模式';
      buttons.forEach(([button]) => { button.disabled = true; });
      console.warn('Model dependencies unavailable:', error);
    }
    async function start() {
      if (started || document.hidden || !stage.getClientRects().length || stage.closest('[hidden]')) return;
      started = true;
      observer?.disconnect();
      document.removeEventListener('visibilitychange', check);
      stage.dataset.modelLoad = 'loading';
      // Fetch visible-model dependencies together, then execute in dependency
      // order. Preloading never evaluates a dependent script after a failure.
      const preloads = scripts.map(source => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'script';
        link.fetchPriority = 'high';
        link.href = new URL(source.getAttribute('src'), document.baseURI).href;
        document.head.append(link);
        return link;
      });
      // Mars also uses this original JPG in hidden reading panels. Those images
      // stay lazy; prepare the texture only when its model is actually visible.
      if (/^https?:$/.test(location.protocol) && template.dataset.modelImageSrc) {
        const image = document.createElement('link');
        image.rel = 'preload';
        image.as = 'image';
        image.fetchPriority = 'high';
        image.href = new URL(template.dataset.modelImageSrc, document.baseURI).href;
        document.head.append(image);
        preloads.push(image);
      }
      try {
        for (const [index, source] of scripts.entries()) {
          if (index === scripts.length - 1) restore();
          await loadScript(source.getAttribute('src'));
        }
        stage.dataset.modelLoad = 'loaded';
      } catch (error) { fail(error); }
      finally { preloads.forEach(link => link.remove()); }
    }
    function check() {
      const rect = stage.getBoundingClientRect();
      if (rect.bottom > 0 && rect.top < innerHeight && rect.right > 0 && rect.left < innerWidth) start();
    }
    const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) start();
    }) : null;
    observer?.observe(stage);
    document.addEventListener('visibilitychange', check);
    if (!observer) {
      addEventListener('scroll', check, { passive: true });
      addEventListener('resize', check);
      new MutationObserver(check).observe(section, { attributes: true, subtree: true, attributeFilter: ['hidden'] });
    }
    document.getElementById('retry-model')?.addEventListener('click', () => {
      if (stage.dataset.modelLoad === 'error') location.reload();
    });
    check();
  }
})();
