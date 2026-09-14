// Colour-as-weather: the ground follows the stratum you are entering, in both directions. The
// marker changes colour only.
//
// It used to switch when a stratum reached the centre of the screen. Measured at 390×844 that
// meant you scrolled half a viewport into Claro — the daylight stratum the darkness budget (§1)
// is measured against — before the paper turned light, and the same half-viewport of the wrong
// ground on the way back out of every stratum. Now the probe sits ahead of you: at 62 % of the
// viewport height scrolling down, 38 % scrolling up, so the ground you are arriving at is the
// ground you see arrive.
let scrollBound = false;

export function initGround() {
  const html = document.documentElement;
  if (!scrollBound) {
    scrollBound = true;
    const onScrolled = () => html.classList.toggle('scrolled', window.scrollY > 48);
    addEventListener('scroll', onScrolled, { passive: true });
    document.addEventListener('astro:after-swap', onScrolled);
    onScrolled();
  }

  // Not the root: Base.astro stamps the page's opening ground on <html>, which matches the same
  // selector and, being first in the document, was the "stratum" the probe found at every scroll.
  const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-ground]')).filter((s) => s !== html);
  const marker = document.querySelector<HTMLElement>('[data-marker]');
  if (!sections.length) return;

  const setStratum = (s?: string) => {
    if (!marker) return;
    marker.querySelectorAll<HTMLElement>('[data-stratum-label]').forEach((l) => {
      if (l.dataset.stratumLabel === s) l.setAttribute('data-active', ''); else l.removeAttribute('data-active');
    });
    marker.classList.toggle('is-out', s === 'cenote');
  };

  let lastY = window.scrollY;
  let down = true;
  let ticking = false;
  let current: HTMLElement | null = null;

  const pick = () => {
    ticking = false;
    const y = window.scrollY;
    if (y !== lastY) down = y > lastY;
    lastY = y;
    // The probe leads the direction of travel.
    const probe = innerHeight * (down ? 0.62 : 0.38);
    let hit: HTMLElement | null = null;
    for (const s of sections) {
      const r = s.getBoundingClientRect();
      if (r.top <= probe && r.bottom > probe) { hit = s; break; }
    }
    // Between strata — a passage with no ground of its own — keep the last one rather than flicker.
    if (!hit || hit === current) return;
    current = hit;
    if (hit.dataset.ground) html.dataset.ground = hit.dataset.ground;
    if (hit.dataset.stratum) setStratum(hit.dataset.stratum);
  };

  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(pick); } };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll, { passive: true });
  pick();
}
