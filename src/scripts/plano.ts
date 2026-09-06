// El Plano (plan §S2): the drawing draws on in three groups over 1.1 s, holds a beat, and the photograph arrives inside it. Once per project per session.
import { gsap, reduce, ss } from './motion';

const SHAPES = 'path, line, polyline, polygon, circle, ellipse, rect';

export function initPlano() {
  const hero = document.querySelector<HTMLElement>('.project-hero');
  if (!hero) return;
  const el = hero.querySelector<HTMLElement>('.plano');
  if (!el) return; // no drawing yet: the CSS dawns the plate in
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
