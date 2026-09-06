// La Marca (plan §S0). First visit: the mark is drawn, CREANDO fades in, a hairline opens and the forest parts (≈1.6 s).
// Every click: the beat (180 ms) with the mark drawn on it (320 ms), the swap, a 240 ms exit. Language toggles and reduced motion get a 240 ms cross.
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

function overture(door: HTMLElement) {
  const e = els(door);
  door.dataset.state = 'overture';
  gsap.set([e.top, e.bottom], { clipPath: 'inset(0% 0% 0% 0%)', opacity: 1 });
  gsap.set(e.strokes, { drawSVG: '0%', opacity: 1 });
  gsap.set([e.fill, e.word], { opacity: 0 });
  gsap.set(e.hair, { opacity: 0, scaleX: 0 });
  gsap.timeline({ defaults: { ease: 'signature' }, onComplete: () => close(door, e) })
    .to(e.strokes, { drawSVG: '0% 100%', duration: 0.8 }, 0)
    .to(e.fill, { opacity: 1, duration: 0.32, ease: 'power1.out' }, 0.5)
    .to(e.word, { opacity: 1, duration: 0.32, ease: 'power1.out' }, 0.6)
    .to([e.fill, e.word, e.strokes], { opacity: 0, duration: 0.32, ease: 'power1.in' }, 0.92)
    .to(e.hair, { opacity: 1, scaleX: 1, duration: 0.24 }, 0.9)
    .to(e.top, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.6 }, 1.0)
    .to(e.bottom, { clipPath: 'inset(100% 0% 0% 0%)', duration: 0.6 }, 1.0)
    .to(e.hair, { opacity: 0, duration: 0.24 }, 1.2)
    .add(() => html.classList.add('door-open'), 1.0);
}

function beatIn(door: HTMLElement): Promise<void> {
  const e = els(door);
  door.dataset.state = 'beat';
  gsap.set([e.top, e.bottom], { clipPath: 'inset(0% 0% 0% 0%)', opacity: 0 });
  gsap.set(e.hair, { opacity: 0 });
  gsap.set(e.mark, { opacity: 1 });
  gsap.set(e.strokes, { drawSVG: '0%', opacity: 1 });
  gsap.set([e.fill, e.word], { opacity: 0 });
  return new Promise((resolve) => {
    gsap.timeline({ defaults: { ease: 'signature' }, onComplete: resolve })
      .to([e.top, e.bottom], { opacity: 1, duration: 0.18, ease: 'power1.out' }, 0)
      .to(e.strokes, { drawSVG: '0% 100%', duration: 0.32 }, 0.18)
      .to(e.fill, { opacity: 1, duration: 0.24, ease: 'power1.out' }, 0.26);
  });
}

function beatOut(door: HTMLElement) {
  const e = els(door);
  door.dataset.state = 'closing';
  gsap.timeline({ onComplete: () => close(door, e) })
    .to([e.top, e.bottom, e.mark], { opacity: 0, duration: 0.24, ease: 'power1.inOut' }, 0);
}

export function initDoor() {
  const door = document.getElementById('door');
  if (!door) return;
  if (html.classList.contains('door-pending') && !reduce()) overture(door);
  else door.dataset.state = 'closed';

  document.addEventListener('astro:before-preparation', (ev: any) => {
    const soft = reduce() || !!ev.sourceElement?.closest?.('[data-lang-toggle]');
    const load = ev.loader;
    ev.loader = async () => {
      if (soft) {
        await gsap.to('main', { opacity: 0, duration: 0.24, ease: 'power1.out' }).then();
        await load();
        html.classList.add('soft-swap');
        return;
      }
      await Promise.all([beatIn(door), load()]);
    };
  });

  document.addEventListener('astro:after-swap', () => {
    if (html.classList.contains('soft-swap')) {
      html.classList.remove('soft-swap');
      gsap.fromTo('main', { opacity: 0 }, { opacity: 1, duration: 0.24, ease: 'power1.out', clearProps: 'opacity' });
    } else if (door.dataset.state === 'beat') {
      beatOut(door);
    }
  });
}
