// B6 — the drawn line on the index of the six.
//
// A project page opens on its plan being drawn (§S2). On /proyectos/ the same gesture runs at the
// scale of a row: as each row arrives, its plan draws itself in the column the hover panel leaves
// empty. It costs no photograph, no GPU and no request — the drawings are already in the repo and
// are inlined at build — and it is the one thing on the page that nobody without the architects'
// plans can copy.
//
// Two rules from the canon apply and are worth stating, because they are what keeps this from
// reading as a widget:
//
//   Once, never replayed.  A row draws the first time it is seen and then stays drawn. Scrolling
//                          back up a list that redraws itself is a carousel, not a set of plans.
//   Nothing travels.       Only the stroke's own length animates. The row does not move, fade or
//                          scale; the line simply arrives along itself.
import { gsap, reduce } from './motion';

const SHAPES = 'path, line, polyline, polygon, circle, ellipse, rect';
const GROUPS = ['boundary', 'built', 'landscape'];

export function initIndexPlanos() {
  const plans = Array.from(document.querySelectorAll<HTMLElement>('[data-row-plan]'));
  if (!plans.length) return;

  // Reduced motion gets the drawing, finished. The plan is information about the place, not an
  // effect, so it is present either way — it just does not draw.
  if (reduce()) {
    plans.forEach((el) => el.classList.add('is-drawn'));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        io.unobserve(e.target);
        draw(e.target as HTMLElement);
      }
    },
    // The row is drawn once it is properly on screen rather than as its first pixel appears, so
    // the drawing happens where it can be watched.
    { rootMargin: '0px 0px -22% 0px' }
  );

  for (const el of plans) {
    gsap.set(el.querySelectorAll(SHAPES), { drawSVG: '0%' });
    io.observe(el);
  }
}

function draw(el: HTMLElement) {
  const groups = GROUPS.map((g) => el.querySelector(`[data-group="${g}"]`)).filter((g): g is Element => !!g);
  const sets = groups.length
    ? groups.map((g) => Array.from(g.querySelectorAll<SVGGeometryElement>(SHAPES)))
    : [Array.from(el.querySelectorAll<SVGGeometryElement>(SHAPES))];
  const tl = gsap.timeline({ defaults: { ease: 'signature' } });
  // Boundary, then what is built, then the landscape — the order the drawing was made in.
  sets.forEach((s, i) => { if (s.length) tl.to(s, { drawSVG: '0% 100%', duration: 1.1 }, i * 0.13); });
  tl.add(() => el.classList.add('is-drawn'));
}
