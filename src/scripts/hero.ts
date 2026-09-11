// The hero's video (plan §S1). An enhancement over the poster, never a condition of it.
//
// Nothing is fetched until the page has loaded, so the video can never compete with the LCP
// element it sits behind. If it will not play — Low Power Mode, an in-app browser that blocks
// autoplay, a codec nobody has — the poster stays, and the poster is the designed hero.
import { reduce } from './motion';

export function initHero() {
  const video = document.querySelector<HTMLVideoElement>('[data-hero-video]');
  if (!video || video.dataset.started) return;

  // Reduced motion gets the still, by contract. Save-Data means the visitor asked for less.
  const saveData = (navigator as any).connection?.saveData === true;
  if (reduce() || saveData) return;
  video.dataset.started = '1';

  const start = () => {
    video.querySelectorAll<HTMLSourceElement>('source[data-src]').forEach((s) => {
      s.src = s.dataset.src!;
      s.removeAttribute('data-src');
    });
    video.load();
    // 'playing' rather than 'canplay': the cross-fade should wait for frames, not for a promise.
    video.addEventListener('playing', () => video.classList.add('is-ready'), { once: true });
    video.play().catch(() => {});
  };

  const idle = (window as any).requestIdleCallback ?? ((fn: () => void) => setTimeout(fn, 300));
  if (document.readyState === 'complete') idle(start);
  else addEventListener('load', () => idle(start), { once: true });

  // Off screen it is only heat. The browser does this for background tabs; it does not do it for
  // a hero six screens above the visitor.
  const io = new IntersectionObserver((entries) => {
    if (!video.src && !video.querySelector('source[src]')) return;
    if (entries[0].isIntersecting) video.play().catch(() => {});
    else video.pause();
  }, { rootMargin: '10% 0px' });
  io.observe(video);
}
