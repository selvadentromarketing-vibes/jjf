import { test, expect } from '@playwright/test';

// The index hover panel is an enhancement for a pointer-and-hover device. What must hold on every
// device is that the index works as a plain list of links underneath it.
test.describe('the index hover panel', () => {
  test('the index is six real links with or without it', async ({ page }) => {
    await page.goto('/es/');
    const rows = page.locator('#roca .row a');
    await expect(rows).toHaveCount(6);
    for (const href of await rows.evaluateAll((els) => els.map((e) => (e as HTMLAnchorElement).getAttribute('href')))) {
      expect(href).toMatch(/^\/es\/proyectos\/[a-z-]+\/$/);
    }
  });

  test('it never appears on a touch device', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'phone projects only');
    await page.goto('/es/');
    await page.locator('#roca').scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    expect(await page.locator('canvas.index-panel').count()).toBe(0);
  });

  test('it lights on hover and goes dark on leave', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop projects only');
    await page.goto('/es/');
    await page.locator('#roca').scrollIntoViewIfNeeded();
    await page.waitForTimeout(900);

    const panel = page.locator('canvas.index-panel');
    if (!(await panel.count())) test.skip(true, 'no WebGL in this environment');

    await page.hover('#roca .row:nth-child(3) a');
    await expect(panel).toHaveClass(/is-on/, { timeout: 2000 });

    // Out is slower than in, and it must actually finish rather than decay forever.
    await page.hover('#roca .sec-head h2');
    await expect(panel).not.toHaveClass(/is-on/, { timeout: 2000 });
  });

  test('focus is hover, so the keyboard sees the same thing', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop projects only');
    await page.goto('/es/');
    await page.locator('#roca').scrollIntoViewIfNeeded();
    await page.waitForTimeout(900);
    const panel = page.locator('canvas.index-panel');
    if (!(await panel.count())) test.skip(true, 'no WebGL in this environment');

    await page.locator('#roca .row:first-child a').focus();
    await expect(panel).toHaveClass(/is-on/, { timeout: 2000 });
  });

  test('reduced motion gets no panel', async ({ browser, isMobile }) => {
    test.skip(isMobile, 'desktop projects only');
    const ctx = await browser.newContext({ reducedMotion: 'reduce' });
    const p = await ctx.newPage();
    await p.goto((test.info().project.use.baseURL ?? 'http://localhost:4321') + '/es/');
    await p.locator('#roca').scrollIntoViewIfNeeded();
    await p.waitForTimeout(900);
    expect(await p.locator('canvas.index-panel').count()).toBe(0);
    await ctx.close();
  });

  test('the panel column is reserved so rows never run under the photograph', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop projects only');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/es/');
    await page.waitForTimeout(500);
    // This reservation depends on source order in the stylesheet: .roca's own padding shorthand
    // comes later and would otherwise win, silently undoing it.
    const pad = await page.evaluate(() => parseFloat(getComputedStyle(document.querySelector('.roca')!).paddingRight));
    expect(pad).toBeGreaterThan(400);
  });
});
