// Colour-as-weather: the ground follows the stratum crossing the centre of the viewport, in both directions. The marker changes colour only.
export function initGround() {
  const html = document.documentElement;
  const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-ground]'));
  const marker = document.querySelector<HTMLElement>('[data-marker]');
  if (!sections.length) return;
  const setStratum = (s?: string) => {
    if (!marker) return;
    marker.querySelectorAll<HTMLElement>('[data-stratum-label]').forEach((l) => {
      if (l.dataset.stratumLabel === s) l.setAttribute('data-active', ''); else l.removeAttribute('data-active');
    });
    marker.classList.toggle('is-out', s === 'cenote');
  };
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) {
      if (!en.isIntersecting) continue;
      const el = en.target as HTMLElement;
      if (el.dataset.ground) html.dataset.ground = el.dataset.ground;
      if (el.dataset.stratum) setStratum(el.dataset.stratum);
    }
  }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
  sections.forEach((s) => io.observe(s));
}
