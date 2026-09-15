// The hero's film (plan §S1). An enhancement over the plate, never a condition of it.
//
// Nothing is fetched until the page has loaded, so the film can never compete with the plate for
// the largest paint. It waits for the plate's arrival to finish before it fades in, so the first
// thing anyone sees is the photograph coming into focus and only then the land beginning to move.
// If it will not play — Low Power Mode, an in-app browser that blocks autoplay, Save-Data, reduced
// motion — the plate stays, and the plate is the designed hero.
import { reduce } from './motion';
import { onSwap } from './lifecycle';

const ARRIVAL_MS = 2600;

export function initHero() {
  const video = document.querySelector<HTMLVideoElement>('[data-hero-video]');
  if (!video || video.dataset.started) return;
  const saveData = (navigator as any).connection?.saveData === true;
  // A device that cannot carry a shader is not asked to decode a film either.
  const tier = document.documentElement.dataset.tier;
  if (reduce() || saveData || tier === 'css' || tier === 'rest') return;
  video.dataset.started = '1';

  const start = () => {
    video.querySelectorAll<HTMLSourceElement>('source[data-src]').forEach((s) => {
      s.src = s.dataset.src!;
      s.removeAttribute('data-src');
    });
    video.load();
    // 'playing' rather than 'canplay': the cross-fade should wait for frames, not for a promise —
    // and never before the plate has finished arriving.
    video.addEventListener('playing', () => {
      const wait = Math.max(0, ARRIVAL_MS - performance.now());
      setTimeout(() => video.classList.add('is-ready'), wait);
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
