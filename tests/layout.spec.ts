import { test, expect } from '@playwright/test';

const PAGES = ['/es/', '/en/', '/es/proyectos/selvadentro/', '/es/contacto/', '/en/how-it-works/', '/es/trayectoria/'];

test.describe('no horizontal overflow', () => {
  test.beforeEach(async ({ page: _page }, testInfo) => { testInfo.skip(testInfo.project.name !== 'desktop', 'desktop only'); });
  for (const w of [390, 768, 1440]) {
    for (const p of PAGES) {
      test(`${p} at ${w}`, async ({ page }) => {
        await page.setViewportSize({ width: w, height: 844 });
        await page.goto(p);
        await page.waitForTimeout(300);
        const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(over).toBeLessThanOrEqual(0);
      });
    }
  }
});

// The plan said the in-app arrival never sees a canvas. That was written to protect the browser
// where 99.6 % of Meta leads land — and then it became the rule that gave the site's primary
// arrival the least. The contract is now narrower and says what it was actually protecting
// against: no ambient light layer, because that is the one that runs a shader continuously over
// a whole surface. The index panel is allowed, because it is event-driven, idles to zero rAF the
// moment it goes dark, and is the only showpiece a phone has.
test('in-app tier is named and never gets the ambient light layer', async ({ page }) => {
  test.skip(test.info().project.name !== 'in-app');
  await page.goto('/es/');
  await expect(page.locator('html')).toHaveAttribute('data-tier', 'in_app');
  await page.waitForTimeout(2600);
  expect(await page.locator('canvas.light-field').count()).toBe(0);
  await expect(page.locator('h1.hero-title')).toBeVisible();
  // ...and the photograph is there without it, which was always the point.
  await expect(page.locator('.hero .hero-plate')).toBeVisible();
});

test('the phone sees the strata and the doors', async ({ page }) => {
  test.skip(test.info().project.name !== 'iphone');
  await page.goto('/es/');
  await expect(page.locator('#claro')).toBeAttached();
  await expect(page.locator('#roca .row')).toHaveCount(6);
  await page.locator('#agua').scrollIntoViewIfNeeded();
  await expect(page.locator('[data-doors] .door-link').first()).toBeVisible();
});
