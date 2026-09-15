import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import path from 'node:path';

// Plan C3 — per-route payload budgets, so the phone's experience cannot drift heavier without
// someone deciding that it should.
//
// What is measured: a full scroll of the route on an iPhone, every resource the browser actually
// asked for, sized as gzip on disk rather than as the preview server happens to serve it. Netlify
// serves brotli, which is smaller, so these numbers are the pessimistic end.
//
// The caps below carry the measurement they were set from. Two of them come from the plan (§11:
// HTML under 200 KB per page, first-party JS under 110 KB gzip); the rest are the measured figure
// with room to grow, because a budget nobody can meet gets deleted and a budget with no headroom
// fails on an extra photograph.
type Budget = { total: number; media?: number };
const KB = 1024;
const SHARED = { html: 200, js: 110, css: 40, font: 140 }; // measured: 16 · 56 · 11 · 103

// The figures move between runs by up to a hundred kilobytes, because how many of the plates
// behind the index are pulled depends on how fast the scroll passes each row. The caps sit above
// the heaviest run seen, not above the average.
const ROUTES: Record<string, Budget> = {
  // The homepage carries the most photographs of any route: a real aerial as the hero (the 640 px
  // video loop is gone), the building across the page in Claro, six plates behind the index.
  '/es/': { total: 760 },                      // measured: 690 on 15 September (476–580 before the aerial)
  // The index: six plates behind the list on a phone, all of them if the scroll passes every row.
  '/es/proyectos/': { total: 480 },            // measured: 285–454
  // A project page now ends on the next place's photograph across the page.
  '/es/proyectos/selvadentro/': { total: 540 },// measured: 483 (341 before the next-place photograph)
  // Guides and contact carry a band photograph since 15 September; it is the cost of a page of type
  // having a place to stand on.
  '/es/guias/comprar-terreno-en-tulum/': { total: 300 }, // measured: 261
  '/es/contacto/': { total: 300 },             // measured: 261
};

const kindOf = (p: string) => {
  const e = path.extname(p).toLowerCase();
  if (e === '.html' || e === '') return 'html';
  if (e === '.js') return 'js';
  if (e === '.css') return 'css';
  if (['.woff2', '.woff', '.ttf'].includes(e)) return 'font';
  if (['.mp4', '.webm'].includes(e)) return 'media';
  return 'image';
};

const cache = new Map<string, number>();
async function gzipOnDisk(pathname: string) {
  if (cache.has(pathname)) return cache.get(pathname)!;
  const rel = pathname.endsWith('/') ? pathname + 'index.html' : pathname;
  let n = -1;
  try { n = gzipSync(await readFile(path.join('dist', rel))).length; } catch { /* not a built file */ }
  cache.set(pathname, n);
  return n;
}

test.describe('what a phone actually downloads', () => {
  test.beforeEach(async ({ page: _page }, testInfo) => { testInfo.skip(testInfo.project.name !== 'iphone', 'one phone is the budget'); });

  for (const [route, budget] of Object.entries(ROUTES)) {
    test(`${route} stays inside its budget`, async ({ page }) => {
      await page.goto(route, { waitUntil: 'load' });
      // Walk the whole page so lazy images and the plates behind the index are really requested.
      for (let i = 0; i < 14; i++) {
        await page.evaluate(() => window.scrollBy(0, window.innerHeight * 0.9));
        await page.waitForTimeout(220);
      }
      await page.waitForTimeout(900);

      const urls: string[] = await page.evaluate(() =>
        [location.pathname, ...performance.getEntriesByType('resource').map((e) => e.name)]
      );

      const by: Record<string, number> = {};
      for (const u of new Set(urls)) {
        let pathname: string;
        try { pathname = new URL(u, 'http://x').pathname; } catch { continue; }
        const n = await gzipOnDisk(pathname);
        if (n < 0) continue; // a data: URI, or something the build did not emit
        by[kindOf(pathname)] = (by[kindOf(pathname)] ?? 0) + n;
      }

      const media = by.media ?? 0;
      const total = Object.values(by).reduce((a, c) => a + c, 0);
      const report = Object.entries(by).map(([k, v]) => `${k} ${Math.round(v / KB)}`).join(' · ');

      for (const [k, cap] of Object.entries(SHARED)) {
        expect(Math.round((by[k] ?? 0) / KB), `${route} ${k} — ${report}`).toBeLessThanOrEqual(cap);
      }
      if (budget.media !== undefined) {
        expect(Math.round(media / KB), `${route} media — ${report}`).toBeLessThanOrEqual(budget.media);
      } else {
        expect(Math.round(media / KB), `${route} carries no media — ${report}`).toBe(0);
      }
      expect(Math.round((total - media) / KB), `${route} total without media — ${report}`).toBeLessThanOrEqual(budget.total);
    });
  }
});
