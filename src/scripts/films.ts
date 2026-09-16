// Films below the fold: fetched only when their stratum comes near, played only while in view,
// and never on a device or a connection that should not carry them. Sources are gated by their
// own media attributes, so a phone that matches none fetches nothing.
import { reduce } from './motion';
import { onSwap } from './lifecycle';

export function initFilms() {
  const films = document.querySelectorAll<HTMLVideoElement>('[data-lazy-film]');
  if (!films.length) return;
  const saveData = (navigator as any).connection?.saveData === true;
  const tier = document.documentElement.dataset.tier;
  if (reduce() || saveData || tier === 'css' || tier === 'rest') return;
  films.forEach((video) => {
    if (video.dataset.started) return;
    video.dataset.started = '1';
    // A light layer in the same host measures its own frame rate for a second before it shows
    // (light.ts); decoding a film under that measurement would fail it. The film waits until the
    // light is lit, gone, or three seconds have passed.
    const host = video.parentElement!;
    const lightSettled = () => new Promise<void>((r) => {
      const ok = () => { const c = host.querySelector('canvas.light-field'); return !c || c.classList.contains('is-lit'); };
      if (ok()) return r();
      const mo = new MutationObserver(() => { if (ok()) { mo.disconnect(); r(); } });
      mo.observe(host, { attributes: true, childList: true, subtree: true, attributeFilter: ['class'] });
      setTimeout(() => { mo.disconnect(); r(); }, 3000);
    });
    let armed = false;
    const io = new IntersectionObserver((entries) => {
      const near = entries[0].isIntersecting;
      if (near && !armed) {
        armed = true;
        lightSettled().then(() => {
          video.querySelectorAll<HTMLSourceElement>('source[data-src]').forEach((s) => { s.src = s.dataset.src!; s.removeAttribute('data-src'); });
          video.load();
          video.addEventListener('playing', () => video.classList.add('is-ready'), { once: true });
          video.play().catch(() => {});
        });
        return;
      }
      if (!video.querySelector('source[src]')) return;
      if (near) video.play().catch(() => {});
      else video.pause();
    }, { rootMargin: '40% 0px' });
    io.observe(video);
    onSwap(() => io.disconnect());
  });
}
