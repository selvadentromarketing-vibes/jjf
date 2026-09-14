import { test, expect } from '@playwright/test';
import { readdirSync } from 'node:fs';

const SITE = 'https://jjfcreando.com';
const guideKeys = () => readdirSync('src/content/guides/es').filter((f) => f.endsWith('.md')).map((f) => f.replace(/\.md$/, ''));
const PAIRS: [string, string][] = [
  ['/es/', '/en/'],
  ['/es/contacto/', '/en/contact/'],
  ['/es/proyectos/', '/en/projects/'],
  ['/es/proyectos/selvadentro/', '/en/projects/selvadentro/'],
  ['/es/vision/', '/en/vision/'],
  ['/es/trayectoria/', '/en/track-record/'],
  ['/es/como-se-compra/', '/en/how-it-works/'],
  ['/es/guias/', '/en/guides/'],
  // Every guide, taken from the content directory, so a new one cannot ship without its pair.
  ...guideKeys().map((k) => [`/es/guias/${k}/`, `/en/guides/${k}/`] as [string, string]),
  ['/es/aviso-de-privacidad/', '/en/privacy/'],
];

test.describe('both trees on real URLs with reciprocal hreflang', () => {
  test.beforeEach(async ({ page: _page }, testInfo) => { testInfo.skip(testInfo.project.name !== 'desktop', 'desktop only'); });
  for (const [es, en] of PAIRS) {
    test(`${es} ↔ ${en}`, async ({ page }) => {
      for (const [self, lang] of [[es, 'es-MX'], [en, 'en']] as const) {
        const res = await page.goto(self);
        expect(res?.status()).toBe(200);
        await expect(page.locator('html')).toHaveAttribute('lang', lang);
        await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', SITE + self);
        await expect(page.locator('link[rel="alternate"][hreflang="es-MX"]')).toHaveAttribute('href', SITE + es);
        await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', SITE + en);
        await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute('href', SITE + es);
        expect(await page.locator('script[type="application/ld+json"]').count()).toBeGreaterThan(0);
        // Either the typographic card or a real daylight plate — never nothing, and never black.
        await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /\/og\/.+\.png$|\/_astro\/.+\.jpe?g$/);
      }
    });
  }
  test('sitemap and robots exist', async ({ request }) => {
    expect((await request.get('/sitemap-index.xml')).status()).toBe(200);
    const robots = await request.get('/robots.txt');
    expect(await robots.text()).toContain('Sitemap:');
  });
});

// The link a salesperson sends over WhatsApp is most of JJF's traffic, so the card it unfurls is
// part of the product. A project with a publishable photograph shows the place; one without shows
// the typographic card rather than a crop of something we are not allowed to publish.
test.describe('the card a shared link unfurls', () => {
  test.beforeEach(async ({ page: _page }, testInfo) => { testInfo.skip(testInfo.project.name !== 'desktop', 'desktop only'); });

  test('a project with a plate shares the plate, at the card\'s own shape', async ({ page }) => {
    await page.goto('/es/proyectos/selvadentro/');
    const src = await page.locator('meta[property="og:image"]').getAttribute('content');
    expect(src).toMatch(/\.jpe?g$/);
    await expect(page.locator('meta[property="og:image:alt"]')).toHaveCount(1);
    const box = await page.evaluate((u) => new Promise<{ w: number; h: number }>((res, rej) => {
      const i = new Image();
      i.onload = () => res({ w: i.naturalWidth, h: i.naturalHeight });
      i.onerror = rej;
      i.src = new URL(u!, location.origin).pathname;
    }), src);
    expect(box).toEqual({ w: 1200, h: 630 });
  });

  test('every page names a card, and the title carries the place', async ({ page }) => {
    for (const p of ['/es/', '/es/proyectos/aldea-zama/', '/es/guias/comprar-terreno-en-tulum/', '/en/contact/']) {
      await page.goto(p);
      await expect(page.locator('meta[property="og:image"]'), p).toHaveCount(1);
      const title = await page.locator('meta[property="og:title"]').getAttribute('content');
      expect(title, p).toBeTruthy();
    }
    await page.goto('/es/proyectos/selvadentro/');
    expect(await page.locator('meta[property="og:title"]').getAttribute('content')).toContain('Selvadentro');
  });
});
