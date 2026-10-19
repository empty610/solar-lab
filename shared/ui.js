/* Native UI lifecycle. Pages own their content and visual design. */
(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const running = new Set();
  let settling = false;

  // CSS defines timing; JS only commits state once those animations finish.
  function motion(element, className, complete = () => {}) {
    let settled = false;
    const action = {
      cancel: () => settle(false),
      finish: () => settle(true),
    };
    function settle(commit) {
      if (settled) return;
      settled = true;
      running.delete(action);
      element.classList.remove(className);
      if (commit) complete();
    }
    running.add(action);
    element.classList.remove(className);
    if (settling || reduced.matches || document.hidden || element.hidden) {
      action.finish();
      return action;
    }
    // A new selection can restart the same finite CSS animation.
    void element.offsetWidth;
    const before = new Set(element.getAnimations());
    element.classList.add(className);
    const animations = element.getAnimations().filter(animation =>
      !before.has(animation) && animation.effect?.getTiming().iterations !== Infinity);
    if (!animations.length) action.finish();
    else Promise.allSettled(animations.map(animation => animation.finished)).then(action.finish);
    return action;
  }
  const finishMotion = () => {
    settling = true;
    try { [...running].forEach(action => action.finish()); }
    finally { settling = false; }
  };
  reduced.addEventListener('change', () => { if (reduced.matches) finishMotion(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) finishMotion(); });
  window.addEventListener('pagehide', finishMotion);

  function tabs({ buttons, panels, onSelect = () => {}, onShown = () => {} }) {
    let selected = panels.find(panel => !panel.hidden)?.id;
    let revision = 0, pending, entrance;
    function select(id, { animate = true, focus = false, shown = () => {} } = {}) {
      const next = panels.find(panel => panel.id === id);
      if (!next) return;
      const prior = selected;
      const token = ++revision;
      pending?.cancel();
      entrance?.cancel();
      panels.forEach(panel => {
        panel.classList.remove('tab-view-enter', 'tab-view-exit');
        panel.inert = false;
      });
      selected = id;
      buttons.forEach(button => {
        const active = button.getAttribute('aria-controls') === id;
        button.setAttribute('aria-selected', String(active));
        button.tabIndex = active ? 0 : -1;
        if (active && focus) button.focus({ preventScroll: true });
      });
      onSelect(id, prior);
      const previous = panels.find(panel => !panel.hidden);
      const commit = () => {
        if (token !== revision) return;
        panels.forEach(panel => {
          panel.hidden = panel !== next;
          panel.inert = false;
          panel.classList.remove('tab-view-enter', 'tab-view-exit');
        });
        if (animate && previous !== next) entrance = motion(next, 'tab-view-enter');
        onShown(id);
        shown();
      };
      if (animate && previous && previous !== next) {
        previous.inert = true;
        if (previous.contains(document.activeElement))
          buttons.find(button => button.getAttribute('aria-controls') === id)?.focus({ preventScroll: true });
        pending = motion(previous, 'tab-view-exit', commit);
      } else commit();
    }
    buttons.forEach((button, index) => {
      button.addEventListener('click', () => select(button.getAttribute('aria-controls')));
      button.addEventListener('keydown', event => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1
          : (index + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
        select(buttons[next].getAttribute('aria-controls'), { focus: true });
      });
    });
    return { select, get selected() { return selected; } };
  }

  const viewers = new WeakMap(), locked = new Set();
  let overflow;
  function lock(dialog) {
    if (!locked.size) {
      overflow = [document.documentElement, document.body].map(element => ({
        element, value: element.style.getPropertyValue('overflow'),
        priority: element.style.getPropertyPriority('overflow'),
      }));
      overflow.forEach(({element}) => element.style.setProperty('overflow', 'hidden'));
    }
    locked.add(dialog);
  }
  function unlock(dialog) {
    locked.delete(dialog);
    if (locked.size || !overflow) return;
    overflow.forEach(({element, value, priority}) => {
      if (value) element.style.setProperty('overflow', value, priority);
      else element.style.removeProperty('overflow');
    });
    overflow = null;
  }
  function restoreFocus(element) {
    if (!element?.isConnected || element.closest('[inert]')) return;
    if (locked.size && ![...locked].some(dialog => dialog.contains(element))) return;
    const temporary = element.tabIndex < 0 && !element.hasAttribute('tabindex');
    if (temporary) {
      element.setAttribute('tabindex', '-1');
      element.addEventListener('blur', () => {
        if (element.getAttribute('tabindex') === '-1') element.removeAttribute('tabindex');
      }, {once:true});
    }
    element.focus({ preventScroll: true });
  }
  function dialog(element) {
    if (viewers.has(element)) return viewers.get(element);
    element.classList.add('archive-dialog');
    let opener, opening, closing, opened = false, outside = false;
    const closeSelector = '[data-dialog-close],.dialog-close,.image-dialog-close,#photo-close,#close-photo';
    const outsideBounds = event => {
      const rect = element.getBoundingClientRect();
      return event.clientX < rect.left || event.clientX > rect.right
        || event.clientY < rect.top || event.clientY > rect.bottom;
    };
    function cleanup() {
      if (!opened) return;
      opened = false;
      opening?.cancel();
      closing?.cancel();
      closing = null;
      unlock(element);
      restoreFocus(opener);
      opener = null;
    }
    const viewer = {
      open(trigger = document.activeElement) {
        closing?.cancel();
        closing = null;
        opening?.cancel();
        if (!opened) {
          opener = trigger;
          if (!element.open) element.showModal();
          opened = true;
          lock(element);
        }
        element.scrollTop = 0;
        element.querySelectorAll('.dialog-copy,figcaption,.world-dialog-scroll').forEach(copy => copy.scrollTop = 0);
        opening = motion(element, 'ui-dialog-opening');
      },
      close({ animate = true } = {}) {
        if (!element.open || closing) return;
        opening?.cancel();
        const finish = () => {
          element.close();
          cleanup();
        };
        if (animate) closing = motion(element, 'ui-dialog-closing', finish);
        else finish();
      },
    };
    element.addEventListener('cancel', event => { event.preventDefault(); viewer.close(); });
    element.addEventListener('close', () => { if (!element.open) cleanup(); });
    element.addEventListener('pointerdown', event => {
      outside = event.target === element && outsideBounds(event);
    });
    element.addEventListener('click', event => {
      if (event.target.closest(closeSelector)) {
        event.preventDefault();
        viewer.close();
      } else if (event.target === element && outside && outsideBounds(event)) viewer.close();
      outside = false;
    });
    viewers.set(element, viewer);
    return viewer;
  }
  window.SolarUI = Object.freeze({ motion, tabs, dialog });
})();
