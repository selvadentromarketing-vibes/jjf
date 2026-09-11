import { test, expect } from '@playwright/test';

// Agua was specified around a photograph that was never commissioned — a cenote at water level,
// with the rock above scrolling off it. Water light is the one thing in the descent cheaper to
// compute than to photograph, so the surface is drawn. These assert the stratum is a place
// whether or not the device can run the light.
test.describe('agua — the water table', () => {
  test('the water is there, full bleed, and holds still while the rock scrolls off it', async ({ page }) => {
    await page.goto('/es/');
    const water = page.locator('.agua-water');
    await expect(water).toHaveCount(1);
    const box = await water.evaluate((el) => ({
      position: getComputedStyle(el).position,
      width: Math.round(el.getBoundingClientRect().width),
      viewport: window.innerWidth,
    }));
    expect(box.position, 'the lid cannot scroll off a surface that scrolls with it').toBe('sticky');
    expect(box.width, 'the water is inset by the section gutter').toBeGreaterThanOrEqual(box.viewport - 1);
  });

  test('where there is a GPU, the caustics are screened over the ground', async ({ page }) => {
    test.skip(test.info().project.name === 'reduced' || test.info().project.name === 'in-app');
    await page.goto('/es/');
    await page.evaluate(() => {
      const a = document.querySelector('.agua')!;
      scrollTo({ top: a.getBoundingClientRect().top + scrollY + 200, behavior: 'instant' as ScrollBehavior });
    });
    const canvas = page.locator('.agua-water canvas.light-field');
    await expect(canvas).toHaveCount(1, { timeout: 10_000 });
    // Screen, not soft-light: there is no photograph here for the light to modulate.
    expect(await canvas.evaluate((el) => getComputedStyle(el).mixBlendMode)).toBe('screen');
    await expect(canvas).toHaveClass(/is-lit/, { timeout: 10_000 });
  });

  test('with no GPU and with reduced motion the stratum is still a place', async ({ page }) => {
    test.skip(test.info().project.name !== 'reduced' && test.info().project.name !== 'in-app');
    await page.goto('/es/');
    await page.waitForTimeout(1200);
    await expect(page.locator('.agua-water')).toHaveCount(1);
    await expect(page.locator('.agua-water canvas.light-field')).toHaveCount(0);
    // The ground carries the water on its own.
    const bg = await page.locator('.agua-water').evaluate((el) => getComputedStyle(el).backgroundImage);
    expect(bg).toContain('gradient');
  });

  test('the ledger stays legible over it', async ({ page }) => {
    await page.goto('/es/');
    await page.evaluate(() => {
      const a = document.querySelector('.agua')!;
      scrollTo({ top: a.getBoundingClientRect().top + scrollY + 200, behavior: 'instant' as ScrollBehavior });
    });
    await page.waitForTimeout(2000);
    // A veil sits between the caustics and the words; without it the light reads across a name.
    const veil = await page.locator('.agua-water').evaluate((el) => getComputedStyle(el, '::after').backgroundImage);
    expect(veil).toContain('gradient');
    await expect(page.locator('.ledger li').first()).toBeVisible();
  });
});
