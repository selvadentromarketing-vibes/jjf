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

test('in-app tier is named and never gets a canvas', async ({ page }) => {
  test.skip(test.info().project.name !== 'in-app');
  await page.goto('/es/');
  await expect(page.locator('html')).toHaveAttribute('data-tier', 'in_app');
  expect(await page.locator('canvas').count()).toBe(0);
  await expect(page.locator('h1.hero-title')).toBeVisible();
});

test('the phone sees the strata and the doors', async ({ page }) => {
  test.skip(test.info().project.name !== 'iphone');
  await page.goto('/es/');
  await expect(page.locator('#claro')).toBeAttached();
  await expect(page.locator('#roca .row')).toHaveCount(6);
  await page.locator('#agua').scrollIntoViewIfNeeded();
  await expect(page.locator('[data-doors] .door-link').first()).toBeVisible();
});
