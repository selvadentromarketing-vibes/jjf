// The hero's film (plan §S1). An enhancement over the plate, never a condition of it.
//
// Nothing is fetched until the page has loaded, so the film can never compete with the plate for
// the largest paint. It waits for the plate's arrival to finish — and, when the hero carries the
// drawn plan, for the drawing to finish unrolling — before it fades in, so the first thing anyone
// sees is the photograph coming into focus, then the plan drawn over it, and only then the printed
// plan on the table taking the drawn one's place. If it will not play — Low Power Mode, an in-app
// browser that blocks autoplay, Save-Data, reduced motion — the plate stays, and the plate is the
// designed hero.
import { reduce } from './motion';
import { onSwap } from './lifecycle';

const ARRIVAL_MS = 2600;
const PLANO_WAIT_MS = 4000; // a drawing that never reports done does not hold the film forever

export function initHero() {
  const video = document.querySelector<HTMLVideoElement>('[data-hero-video]');
  if (!video || video.dataset.started) return;
  const saveData = (navigator as any).connection?.saveData === true;
  // A device that cannot carry a shader is not asked to decode a film either.
  const tier = document.documentElement.dataset.tier;
  if (reduce() || saveData || tier === 'css' || tier === 'rest') return;
  video.dataset.started = '1';

  const arrived = new Promise<void>((r) => setTimeout(r, Math.max(0, ARRIVAL_MS - performance.now())));
  const plano = video.parentElement?.querySelector<HTMLElement>('.plano');
  const drawn = new Promise<void>((r) => {
    if (!plano || plano.classList.contains('is-done')) return r();
    addEventListener('jjf:plano-done', () => r(), { once: true });
    setTimeout(r, PLANO_WAIT_MS);
  });

  const start = () => {
    video.querySelectorAll<HTMLSourceElement>('source[data-src]').forEach((s) => {
      s.src = s.dataset.src!;
      s.removeAttribute('data-src');
    });
    video.load();
    // 'playing' rather than 'canplay': the cross-fade should wait for frames, not for a promise —
    // and never before the plate has finished arriving or the plan has finished unrolling.
    video.addEventListener('playing', () => {
      Promise.all([arrived, drawn]).then(() => {
        video.classList.add('is-ready');
        dispatchEvent(new Event('jjf:hero-film'));
      });
    }, { once: true });
    video.play().catch(() => {});
  };

  const idle = (window as any).requestIdleCallback ?? ((fn: () => void) => setTimeout(fn, 300));
  if (document.readyState === 'complete') idle(start);
  else addEventListener('load', () => idle(start), { once: true });

  // Off screen it is only heat.
  const io = new IntersectionObserver((entries) => {
    if (!video.querySelector('source[src]')) return;
    if (entries[0].isIntersecting) video.play().catch(() => {});
    else video.pause();
  }, { rootMargin: '10% 0px' });
  io.observe(video);
  onSwap(() => io.disconnect());
}
