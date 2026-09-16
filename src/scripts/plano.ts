// El Plano (plan §S2, revised 16 September): the drawing of the selling place, drawn by CSS in
// dash-dot behind a travelling mask (see .plano in global.css). Once per project per session.
//
// Two hosts. The project hero: the plan unrolls left to right over the sheet, then the photograph
// dawns behind it. The home hero: the plan is registered onto the photograph of the printed plan
// on the table (the film's first frame). The door's mark has just become the plan's first road,
// so the drawing spreads out from that road in both directions; then the film starts on that same
// frame and a hand pulls the tracing paper away — and a second mask erases the drawn lines exactly
// where the paper lifts, frame by frame from the film's clock, so drawn becomes printed.
import { reduce, ss } from './motion';

const DRAW_MS = 1800;        // the mask's 1.6 s plus the last group's stagger
const SKIP_MS = 400;         // when the visitor ended the door early
const HOLD_MS = 180;         // project page: the drawn plan, still, before the photograph dawns
const WARM_MS = 1100;        // home: the plate is let back up this long after the drawing finishes
const FILM_WAIT_MS = 5000;   // home: how long a finished drawing waits for a film before the plate returns
// The roll of tracing paper across the printed plan, measured on the film at the loop's speed:
// [seconds into the film, x of the roll as % of the frame]. The drawing is erased up to the roll.
const ROLL: [number, number][] = [
  [0, 30.7], [0.25, 37.5], [0.5, 44.8], [0.75, 51], [1, 57.3], [1.25, 63], [1.5, 69.3], [1.75, 75],
  [2, 80.2], [2.25, 83.3], [2.5, 85.9], [2.75, 89.1], [3, 90.6], [3.25, 91.7], [3.42, 100],
];
const ROLL_LEAD = 2; // % of width: the paper lifts a little ahead of the roll's bright centre

export function initPlano() {
  const host = document.querySelector<HTMLElement>('[data-plano-host]');
  if (!host) return;
  const el = host.querySelector<HTMLElement>('.plano');
  if (!el) return; // no drawing yet: the CSS dawns the plate in
  const svg = el.querySelector('svg');
  const home = host.dataset.planoHold === 'film';
  if (home && svg) {
    // Registered onto the plate: the same cover crop the photograph and the film get.
    svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    const cx = svg.dataset.seedCx, hw = svg.dataset.seedW;
    if (cx) el.style.setProperty('--c', `${cx}%`);
    if (hw) el.style.setProperty('--seed-w', `${hw}%`);
  } else if (svg && matchMedia('(max-width: 700px)').matches) {
    // The sheet is four times wider than it is tall. On a phone, fitted whole, it is a hairline
    // band of noise; a slice of it at drawing size reads as a plan.
    svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
  }
  // On the session's first page the door is closed over all of this. The home waits for the mark
  // to have become the first road; a project page waits for the curtains to start parting.
  const html = document.documentElement;
  const cue = home ? 'jjf:door-morphed' : 'jjf:door-open';
  const arrived = home ? 'door-morphed' : 'door-open';
  if (html.classList.contains('door-pending') && !html.classList.contains(arrived) && !reduce()) {
    let started = false;
    const go = () => { if (!started) { started = true; draw(host, el, home); } };
    addEventListener(cue, go, { once: true });
    // If the door never reports — an error inside its timeline, a tab that never renders — draw
    // anyway. A hero that waits forever for a cue is worse than one that draws a beat late.
    setTimeout(go, home ? 3400 : 2400);
    return;
  }
  draw(host, el, home);
}

function draw(host: HTMLElement, el: HTMLElement, home: boolean) {
  const key = 'jjf-plano:' + el.dataset.plano;
  // Three of the six have no photograph the plan will let us publish yet (§10). There the drawing
  // is not an overture to a plate, it is the hero: it draws, and it stays.
  const plate = host.classList.contains('has-plate');

  if (reduce() || ss.get(key)) {
    el.classList.add('is-done');
    if (plate || home) el.classList.add('is-gone');
    host.classList.add('is-rest');
    return;
  }
  ss.set(key, '1');
  host.classList.add('plano-drawing');
  const skipped = document.documentElement.classList.contains('door-skipped');
  if (skipped) el.classList.add('is-skip');
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
    if (home) {
      setTimeout(() => host.classList.remove('plano-drawing'), WARM_MS);
      // The film says when it is on screen (hero.ts); from then on the drawing follows the hand.
      // If it never comes — Save-Data, a tier that does not decode video, autoplay refused — the
      // plate is the hero again after a wait.
      let taken = false;
      const take = () => { if (!taken) { taken = true; follow(el, gone); } };
      addEventListener('jjf:hero-film', take, { once: true });
      setTimeout(() => { if (!taken) { taken = true; gone(); } }, FILM_WAIT_MS);
    } else if (plate) {
      setTimeout(() => { host.classList.add('is-dawn'); gone(); }, HOLD_MS);
    } else {
      host.classList.remove('plano-drawing');
    }
  }, skipped ? SKIP_MS : DRAW_MS);
}

// Erase the drawing behind the roll: every frame, the film's clock is read and the mask's edge is
// set where the paper was at that moment. The first jump (nothing to the roll's start) is eased
// by CSS over a third of a second; after that the edge tracks the hand directly.
function follow(el: HTMLElement, done: () => void) {
  const video = document.querySelector<HTMLVideoElement>('[data-hero-video]');
  if (!video) return done();
  const end = Number(video.dataset.loopIn) || ROLL[ROLL.length - 1][0];
  el.classList.add('is-following');
  setTimeout(() => el.classList.add('is-tracking'), 400);
  let raf = 0;
  const tick = () => {
    const t = video.currentTime;
    el.style.setProperty('--erase', `${at(t).toFixed(2)}%`);
    if (t >= end - 0.05 || at(t) >= 100) { cancelAnimationFrame(raf); done(); return; }
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
}
function at(t: number) {
  if (t <= ROLL[0][0]) return ROLL[0][1] - ROLL_LEAD;
  for (let i = 1; i < ROLL.length; i++) {
    const [t0, x0] = ROLL[i - 1], [t1, x1] = ROLL[i];
    if (t <= t1) return Math.min(100, x0 + ((x1 - x0) * (t - t0)) / (t1 - t0) - ROLL_LEAD);
  }
  return 100;
}
