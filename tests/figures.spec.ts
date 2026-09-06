import { test, expect } from '@playwright/test';

// No figure ships unverified (plan §8): outside the Ficha, the ledger and /trayectoria/, the body carries no digit at all.
const PAGES = ['/es/', '/en/', '/es/vision/', '/en/vision/', '/es/proyectos/selvadentro/', '/en/projects/amelia-tulum/', '/es/proyectos/aldea-zama/'];

test.describe('no figures where figures are forbidden', () => {
  test.beforeEach(async ({ page: _page }, testInfo) => { testInfo.skip(testInfo.project.name !== 'desktop', 'desktop only'); });
  for (const p of PAGES) {
    test(`${p}`, async ({ page }) => {
      await page.goto(p);
      const text = await page.evaluate(() => {
        const main = document.querySelector('main')!.cloneNode(true) as HTMLElement;
        main.querySelectorAll('[data-figures-ok], script, style, noscript, svg, picture, img, .plano').forEach((e) => e.remove());
        return main.textContent || '';
      });
      expect(text).not.toMatch(/[0-9]/);
    });
  }
});
