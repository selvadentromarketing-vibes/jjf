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
        await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /\/og\/.+\.png$/);
      }
    });
  }
  test('sitemap and robots exist', async ({ request }) => {
    expect((await request.get('/sitemap-index.xml')).status()).toBe(200);
    const robots = await request.get('/robots.txt');
    expect(await robots.text()).toContain('Sitemap:');
  });
});
