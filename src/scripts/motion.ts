// One GSAP setup for the whole site: DrawSVG draws the mark and the plans; CustomEase carries the signature curve.
import { gsap } from 'gsap';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { CustomEase } from 'gsap/CustomEase';

gsap.registerPlugin(DrawSVGPlugin, CustomEase);
CustomEase.create('signature', 'M0,0 C0.16,1 0.3,1 1,1');

export const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

const store = (s: () => Storage) => ({
  get(k: string): string | null { try { return s().getItem(k); } catch { return null; } },
  set(k: string, v: string) { try { s().setItem(k, v); } catch { /* private mode */ } },
});
export const ss = store(() => sessionStorage);
export const ls = store(() => localStorage);
export { gsap };
