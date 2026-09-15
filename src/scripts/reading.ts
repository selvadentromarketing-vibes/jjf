// The reading rail knows where you are: the chapter whose head has passed a line a third of the
// way down the screen is the current one. Read on a frame, not on every scroll event.
const rails: { links: HTMLAnchorElement[]; targets: HTMLElement[] }[] = [];
let bound = false;
let ticking = false;

export function initReading() {
  rails.length = 0;
  document.querySelectorAll<HTMLElement>('[data-rail]').forEach((rail) => {
    const links = Array.from(rail.querySelectorAll<HTMLAnchorElement>('.rail-list a[href^="#"]'));
    const targets = links.map((a) => document.getElementById(decodeURIComponent(a.hash.slice(1)))).filter((t): t is HTMLElement => !!t);
    if (targets.length) rails.push({ links, targets });
  });
  if (!bound) {
    bound = true;
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(pick); } }, { passive: true });
  }
  pick();
}

function pick() {
  ticking = false;
  const probe = innerHeight * 0.38;
  for (const { links, targets } of rails) {
    let current = targets[0];
    for (const t of targets) if (t.getBoundingClientRect().top <= probe) current = t;
    for (const a of links) {
      const on = decodeURIComponent(a.hash.slice(1)) === current.id;
      if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    }
  }
}
