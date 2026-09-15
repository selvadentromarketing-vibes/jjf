// La Marca (plan §S0). First visit: the mark is drawn, the hairline opens and the forest parts —
// under three quarters of a second, and a click or a key ends it early. Every navigation after
// that is a 240 ms cross on the page itself: the mark used to come back on every click, which
// cost each internal link half a second before the new page could start arriving.
import { gsap, reduce } from './motion';

type Els = ReturnType<typeof els>;
const html = document.documentElement;

function els(door: HTMLElement) {
  return {
    top: door.querySelector<HTMLElement>('.door-top')!,
    bottom: door.querySelector<HTMLElement>('.door-bottom')!,
    hair: door.querySelector<HTMLElement>('.door-hair')!,
    mark: door.querySelector<HTMLElement>('.door-mark')!,
    strokes: Array.from(door.querySelectorAll<SVGPathElement>('.mk-stroke path')),
    fill: door.querySelector<SVGGElement>('.mk-fill .mk-mark')!,
    word: door.querySelector<SVGGElement>('.mk-fill .mk-word')!,
  };
}

function close(door: HTMLElement, e: Els) {
  door.dataset.state = 'closed';
  gsap.set([e.top, e.bottom, e.mark, e.hair, e.fill, e.word, e.strokes], { clearProps: 'all' });
}

function open() {
  if (html.classList.contains('door-open')) return;
  html.classList.add('door-open');
  dispatchEvent(new Event('jjf:door-open'));
}

function overture(door: HTMLElement) {
  const e = els(door);
  door.dataset.state = 'overture';
  gsap.set([e.top, e.bottom], { clipPath: 'inset(0% 0% 0% 0%)', opacity: 1 });
  gsap.set(e.strokes, { drawSVG: '0%', opacity: 1 });
  gsap.set([e.fill, e.word], { opacity: 0 });
  gsap.set(e.hair, { opacity: 0, scaleX: 0 });
  const tl = gsap.timeline({ defaults: { ease: 'signature' }, onComplete: () => { open(); close(door, e); } })
    .to(e.strokes, { drawSVG: '0% 100%', duration: 0.36 }, 0)
    .to(e.fill, { opacity: 1, duration: 0.2, ease: 'power1.out' }, 0.2)
    .to(e.word, { opacity: 1, duration: 0.2, ease: 'power1.out' }, 0.24)
    .to([e.fill, e.word, e.strokes], { opacity: 0, duration: 0.18, ease: 'power1.in' }, 0.44)
    .to(e.hair, { opacity: 1, scaleX: 1, duration: 0.16 }, 0.42)
    .to(e.top, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.26 }, 0.46)
    .to(e.bottom, { clipPath: 'inset(100% 0% 0% 0%)', duration: 0.26 }, 0.46)
    .to(e.hair, { opacity: 0, duration: 0.16 }, 0.56)
    // The curtains starting to part is the cue anything behind them waits for: El Plano
    // begins here so the visitor watches the drawing arrive, not a finished one (plan §S2).
    .add(open, 0.46);

  // Anyone who does not want to watch does not have to. One gesture ends it; nothing is skipped
  // that the page needs, because the timeline is run to its end rather than abandoned.
  const skip = () => { if (door.dataset.state === 'overture') tl.progress(1); };
  door.addEventListener('pointerdown', skip, { once: true });
  addEventListener('keydown', skip, { once: true });
  addEventListener('wheel', skip, { once: true, passive: true });
  addEventListener('touchstart', skip, { once: true, passive: true });
}

export function initDoor() {
  const door = document.getElementById('door');
  if (!door) return;
  if (html.classList.contains('door-pending') && !reduce()) overture(door);
  else { door.dataset.state = 'closed'; html.classList.add('door-open'); }

  // Every navigation: the page crosses, the chrome stays. Under reduced motion the cross is
  // still a cross — an opacity change is not motion — but it is the only thing that happens.
  document.addEventListener('astro:before-preparation', (ev: any) => {
    const load = ev.loader;
    ev.loader = async () => {
      await gsap.to('main', { opacity: 0, duration: 0.24, ease: 'power1.out' }).then();
      await load();
      html.classList.add('soft-swap');
    };
  });

  document.addEventListener('astro:after-swap', () => {
    door.dataset.state = 'closed';
    html.classList.add('door-open');
    if (html.classList.contains('soft-swap')) {
      html.classList.remove('soft-swap');
      gsap.fromTo('main', { opacity: 0 }, { opacity: 1, duration: 0.24, ease: 'power1.out', clearProps: 'opacity' });
    }
  });
}
