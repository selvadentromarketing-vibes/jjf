import { test, expect } from '@playwright/test';

// The light layer is an enhancement and must never be load-bearing. These assert what has to be
// true whether or not the device can actually run it — which is why none of them require the
// canvas to exist. Whether it renders depends on the GPU in front of it; whether the page is
// correct without it does not.
test.describe('the light layer', () => {
  test('the photograph is present and correct with or without it', async ({ page }) => {
    await page.goto('/es/');
    await page.waitForTimeout(2600);
    const plate = page.locator('.hero .hero-plate').first();
    await expect(plate).toBeVisible();
    // A hero that only exists inside the canvas would vanish on every device that drops the layer.
    expect(await plate.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(100);
  });

  test('it never intercepts a pointer or reaches a screen reader', async ({ page }) => {
    await page.goto('/es/');
    await page.waitForTimeout(2600);
    // There is more than one surface now — the canopy and the water — and the contract is the
    // same for every one of them.
    const fields = page.locator('canvas.light-field');
    const n = await fields.count();
    for (let i = 0; i < n; i++) {
      const f = fields.nth(i);
      await expect(f).toHaveAttribute('aria-hidden', 'true');
      const s = await f.evaluate((el) => ({ pe: getComputedStyle(el).pointerEvents, blend: getComputedStyle(el).mixBlendMode, additive: el.classList.contains('is-additive') }));
      expect(s.pe).toBe('none');
      // Soft-light where it modulates a photograph; screen where it is the photograph.
      expect(s.blend).toBe(s.additive ? 'screen' : 'soft-light');
    }
  });

  test('reduced motion gets no canvas at all', async ({ page, browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce' });
    const p = await ctx.newPage();
    await p.goto((test.info().project.use.baseURL ?? 'http://localhost:4321') + '/es/');
    await p.waitForTimeout(2600);
    expect(await p.locator('canvas.light-field').count()).toBe(0);
    await ctx.close();
  });

  test('the in-app browser gets no canvas', async ({ page }) => {
    test.skip(test.info().project.name !== 'in-app', 'in-app project only');
    await page.goto('/es/');
    await page.waitForTimeout(2600);
    await expect(page.locator('html')).toHaveAttribute('data-tier', 'in_app');
    expect(await page.locator('canvas.light-field').count()).toBe(0);
  });
});
