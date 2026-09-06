// Inertial scroll at the weight constant 0.085 (plan §5). Off under reduced motion and on touch, where native is right.
import Lenis from 'lenis';
import { reduce } from './motion';

let lenis: Lenis | undefined;
export function initSmooth() {
  if (lenis || reduce() || matchMedia('(pointer: coarse)').matches) return;
  lenis = new Lenis({ lerp: 0.085, smoothWheel: true, syncTouch: false });
  const raf = (t: number) => { lenis?.raf(t); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
  document.addEventListener('astro:after-swap', () => lenis?.scrollTo(window.scrollY, { immediate: true, force: true }));
}
