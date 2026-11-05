(() => {
  const halo = document.querySelector('.pointer-halo');
  if (!halo) return;

  const pointer = window.matchMedia('(min-width: 701px) and (hover: hover) and (pointer: fine)');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const state = { x: 0, y: 0, region: null, frame: 0 };

  function clearHighlight() {
    if (state.region) state.region.removeAttribute('data-lit');
    state.region = null;
    halo.classList.remove('is-visible', 'is-link');
    if (state.frame) cancelAnimationFrame(state.frame);
    state.frame = 0;
  }

  function paint() {
    state.frame = 0;
    halo.style.setProperty('--pointer-x', `${state.x}px`);
    halo.style.setProperty('--pointer-y', `${state.y}px`);
    if (state.region) {
      const bounds = state.region.getBoundingClientRect();
      state.region.style.setProperty('--spot-x', `${state.x - bounds.left}px`);
      state.region.style.setProperty('--spot-y', `${state.y - bounds.top}px`);
    }
  }

  document.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || !pointer.matches || motion.matches) return;
    state.x = event.clientX;
    state.y = event.clientY;
    const region = event.target.closest('[data-spotlight]');
    if (region !== state.region) {
      if (state.region) state.region.removeAttribute('data-lit');
      state.region = region;
      if (region) region.setAttribute('data-lit', '');
    }
    halo.classList.add('is-visible');
    halo.classList.toggle('is-link', Boolean(event.target.closest('a')));
    if (!state.frame) state.frame = requestAnimationFrame(paint);
  }, { passive: true });

  document.documentElement.addEventListener('pointerleave', clearHighlight);
  document.addEventListener('pointercancel', clearHighlight);
  document.addEventListener('keydown', clearHighlight);
  window.addEventListener('blur', clearHighlight);
  window.addEventListener('scroll', clearHighlight, { passive: true });
  pointer.addEventListener('change', clearHighlight);
  motion.addEventListener('change', clearHighlight);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clearHighlight();
  });
})();
