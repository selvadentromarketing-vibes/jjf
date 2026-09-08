// El Plano (plan §S2): the drawing draws on in three groups over 1.1 s, holds a beat, and the photograph arrives inside it. Once per project per session.
import { gsap, reduce, ss } from './motion';

const SHAPES = 'path, line, polyline, polygon, circle, ellipse, rect';

export function initPlano() {
  const hero = document.querySelector<HTMLElement>('.project-hero');
  if (!hero) return;
  const el = hero.querySelector<HTMLElement>('.plano');
  if (!el) return; // no drawing yet: the CSS dawns the plate in
  // On the session's first page the door is closed over all of this. Drawing underneath it spends
  // the whole 1.1 s behind a forest curtain and parts onto a finished drawing — so wait for the
  // curtains to start opening and let them part onto a plan in progress.
  const html = document.documentElement;
  if (html.classList.contains('door-pending') && !html.classList.contains('door-open') && !reduce()) {
    // Blank the strokes now: until the timeline runs they are at full length, and a stray paint
    // in that window would show the finished drawing before it is drawn.
    if (!ss.get('jjf-plano:' + el.dataset.plano)) gsap.set(el.querySelectorAll(SHAPES), { drawSVG: '0%' });
    let started = false;
    const go = () => { if (!started) { started = true; draw(hero, el); } };
    addEventListener('jjf:door-open', go, { once: true });
    // If the door never reports — an error inside its timeline, a tab that never renders — draw
    // anyway. A hero that waits forever for a cue is worse than one that draws a beat late.
    setTimeout(go, 2400);
    return;
  }
  draw(hero, el);
}

function draw(hero: HTMLElement, el: HTMLElement) {
  const key = 'jjf-plano:' + el.dataset.plano;
  const strokes = Array.from(el.querySelectorAll<SVGGeometryElement>(SHAPES));
  if (reduce() || ss.get(key) || !strokes.length) { el.classList.add('is-done'); hero.classList.add('is-rest'); return; }
  ss.set(key, '1');
  const groups = ['#boundary', '#built', '#landscape'].map((s) => el.querySelector(s)).filter((g): g is Element => !!g);
  const sets = groups.length ? groups.map((g) => Array.from(g.querySelectorAll<SVGGeometryElement>(SHAPES))) : [strokes];
  gsap.set(strokes, { drawSVG: '0%' });
  const tl = gsap.timeline({ defaults: { ease: 'signature' } });
  sets.forEach((s, i) => { if (s.length) tl.to(s, { drawSVG: '0% 100%', duration: 1.1 }, i * 0.13); });
  tl.addLabel('drawn')
    .add(() => hero.classList.add('is-dawn'), 'drawn+=0.18')
    .to(el, { opacity: 0, duration: 0.6, ease: 'power1.inOut' }, 'drawn+=0.18')
    .add(() => el.classList.add('is-done'));
}
