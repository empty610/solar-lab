/* Small lifecycle helpers for the existing Three.js pages; no scene or UI policy here. */
(() => {
  'use strict';
  function loop({ element, draw, fps = 40 }) {
    let active = false, visible = true, suspended = false, disposed = false;
    let frame = null, last = 0, elapsed = 0;
    const runnable = () => active && visible && !document.hidden && !suspended && !disposed;
    function cancel() {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      last = 0;
      elapsed = 0;
    }
    function invalidate() {
      if (!runnable() || frame !== null) return;
      if (!last) last = performance.now();
      frame = requestAnimationFrame(tick);
    }
    function tick(now) {
      frame = null;
      if (!runnable()) { cancel(); return; }
      elapsed += Math.min((now - last) / 1000, 0.08);
      last = now;
      if (elapsed < 1 / fps) { invalidate(); return; }
      const step = elapsed;
      elapsed = 0;
      // Controls may invalidate during draw while damping is still moving.
      const continuing = draw(step, now);
      if (continuing) invalidate();
      if (frame === null) last = 0;
    }
    function sync() { cancel(); invalidate(); }
    const observer = 'IntersectionObserver' in window ? new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      // A queued entry can describe the layout before a responsive breakpoint moved
      // this model. Verify stale geometry so it cannot cancel the final resize paint.
      const rect = element.getBoundingClientRect(), measured = entry.boundingClientRect;
      if (['top', 'left', 'width', 'height'].some(key => Math.abs(rect[key] - measured[key]) > 1)) {
        visible = rect.width > 0 && rect.height > 0 && rect.bottom > -100 && rect.right > -100
          && rect.top < window.innerHeight + 100 && rect.left < window.innerWidth + 100;
      }
      sync();
    }, { rootMargin: '100px' }) : null;
    observer?.observe(element);
    const hide = () => { suspended = true; cancel(); };
    const show = () => { suspended = false; sync(); };
    document.addEventListener('visibilitychange', sync);
    window.addEventListener('pagehide', hide);
    window.addEventListener('pageshow', show);
    const bindings = [];
    return {
      invalidate,
      start() { active = true; invalidate(); },
      bind(controls) {
        for (const type of ['start', 'change', 'end']) {
          controls.addEventListener(type, invalidate);
          bindings.push(() => controls.removeEventListener(type, invalidate));
        }
      },
      dispose() {
        disposed = true;
        cancel();
        observer?.disconnect();
        document.removeEventListener('visibilitychange', sync);
        window.removeEventListener('pagehide', hide);
        window.removeEventListener('pageshow', show);
        bindings.forEach(remove => remove());
      },
    };
  }

  function textures(THREE, renderer, { timeout = 30000 } = {}) {
    const cache = new Map(), owned = new Set(), pending = new Set();
    let disposed = false;
    return {
      load(url, { flipY = true } = {}) {
        if (disposed) return Promise.resolve(null);
        // Keep large embedded data URLs by reference instead of serializing duplicate keys.
        if (!cache.has(url)) cache.set(url, new Map());
        const variants = cache.get(url);
        if (variants.has(flipY)) return variants.get(flipY);
        const promise = new Promise((resolve, reject) => {
          let finished = false;
          const finish = (error, texture) => {
            if (finished) return;
            finished = true;
            clearTimeout(timer);
            pending.delete(abandon);
            if (error) reject(error); else resolve(texture);
          };
          const abandon = () => finish(null, null);
          const timer = setTimeout(() => finish(new Error('Model texture timed out')), timeout);
          pending.add(abandon);
          const texture = new THREE.TextureLoader().load(url, map => {
            if (disposed || finished) { map.dispose(); return; }
            map.colorSpace = THREE.SRGBColorSpace;
            map.flipY = flipY;
            map.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
            finish(null, map);
          }, undefined, error => finish(error || new Error('Model texture failed')));
          owned.add(texture);
        });
        variants.set(flipY, promise);
        return promise;
      },
      dispose() {
        if (disposed) return;
        disposed = true;
        pending.forEach(abandon => abandon());
        owned.forEach(texture => texture.dispose());
        owned.clear();
        cache.clear();
      },
    };
  }

  function disposeScene(scene, renderer, controls) {
    controls?.dispose();
    const resources = new Set();
    scene?.traverse(object => {
      if (object.geometry) resources.add(object.geometry);
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.filter(Boolean).forEach(material => resources.add(material));
      if (object.shadow) resources.add(object.shadow);
    });
    resources.forEach(resource => resource.dispose());
    renderer?.dispose();
  }
  window.ModelRuntime = Object.freeze({ loop, textures, disposeScene });
})();
