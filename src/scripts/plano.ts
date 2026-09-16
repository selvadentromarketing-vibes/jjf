// El Plano (plan §S2, revised 16 September): the drawing unrolls, left to right, the way a printed
// plan is unrolled on a table. The strokes are dash-dot, drawn in CSS; the motion is a mask that
// travels across the sheet (see .plano in global.css), so nothing here needs GSAP. Once per
// project per session. Two hosts carry it: the project hero, where the photograph takes the
// drawing's place after a beat, and the home hero, where the film does — the printed map on the
// table arriving where the drawn one was.
import { reduce, ss } from './motion';

const DRAW_MS = 2100;        // the mask's 1.8 s plus the last group's stagger
const HOLD_MS = 180;         // project page: the drawn plan, still, before the photograph dawns
const FILM_WAIT_MS = 5000;   // home: how long a finished drawing waits for a film before the plate returns
const FILM_LAG_MS = 300;     // home: the film has begun to fade in; the drawing lets go a beat later

export function initPlano() {
  const host = document.querySelector<HTMLElement>('[data-plano-host]');
  if (!host) return;
  const el = host.querySelector<HTMLElement>('.plano');
  if (!el) return; // no drawing yet: the CSS dawns the plate in
  // The sheet is four times wider than it is tall. On a phone, fitted whole, it is a hairline band
  // of noise; a slice of it at drawing size reads as a plan.
  if (matchMedia('(max-width: 700px)').matches) el.querySelector('svg')?.setAttribute('preserveAspectRatio', 'xMidYMid slice');
  // On the session's first page the door is closed over all of this. Unrolling underneath it
  // spends the whole reveal behind a forest curtain and parts onto a finished drawing — so wait
  // for the curtains to start opening and let them part onto a plan in motion.
  const html = document.documentElement;
  if (html.classList.contains('door-pending') && !html.classList.contains('door-open') && !reduce()) {
    let started = false;
    const go = () => { if (!started) { started = true; draw(host, el); } };
    addEventListener('jjf:door-open', go, { once: true });
    // If the door never reports — an error inside its timeline, a tab that never renders — draw
    // anyway. A hero that waits forever for a cue is worse than one that draws a beat late.
    setTimeout(go, 2400);
    return;
  }
  draw(host, el);
}

function draw(host: HTMLElement, el: HTMLElement) {
  const key = 'jjf-plano:' + el.dataset.plano;
  // Three of the six have no photograph the plan will let us publish yet (§10). There the drawing
  // is not an overture to a plate, it is the hero: it draws, and it stays. Fading it out would
  // leave those pages opening on an empty rectangle of paper.
  const plate = host.classList.contains('has-plate');
  // The home hero hands the drawing to the film rather than to the plate.
  const film = host.dataset.planoHold === 'film';

  if (reduce() || ss.get(key)) {
    el.classList.add('is-done');
    if (plate || film) el.classList.add('is-gone');
    host.classList.add('is-rest');
    return;
  }
  ss.set(key, '1');
  host.classList.add('plano-drawing');
  // Two frames, not one: the class has to land after the mask's starting value has been painted,
  // or there is nothing for the transition to travel from and the sheet simply appears.
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('is-drawing')));

  const gone = () => {
    el.classList.add('is-gone');
    host.classList.remove('plano-drawing');
  };
  setTimeout(() => {
    el.classList.add('is-done');
    dispatchEvent(new Event('jjf:plano-done'));
    if (film) {
      // The film says when it is on screen (hero.ts). If it never comes — Save-Data, a tier that
      // does not decode video, autoplay refused — the plate is the hero again after a wait.
      let let_go = false;
      const go = () => { if (!let_go) { let_go = true; setTimeout(gone, FILM_LAG_MS); } };
      addEventListener('jjf:hero-film', go, { once: true });
      setTimeout(() => { if (!let_go) { let_go = true; gone(); } }, FILM_WAIT_MS);
    } else if (plate) {
      setTimeout(() => { host.classList.add('is-dawn'); gone(); }, HOLD_MS);
    } else {
      host.classList.remove('plano-drawing');
    }
  }, DRAW_MS);
}
