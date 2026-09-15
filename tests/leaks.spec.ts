import { test, expect } from '@playwright/test';

// The ClientRouter keeps the window across pages. Three modules used to hang listeners and a
// WebGL context on it and never let go, so every return to the homepage added another scroll
// handler doing layout reads on every frame, and another GL context. These count.
test.describe('nothing outlives its page', () => {
  test('window listeners and canvases hold steady across five round trips', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop projects only');
    const client = await page.context().newCDPSession(page);
    const listeners = async () => {
      const { result } = await client.send('Runtime.evaluate', { expression: 'window' });
      const { listeners } = await client.send('DOMDebugger.getEventListeners', { objectId: result.objectId! });
      const by: Record<string, number> = {};
      for (const l of listeners) by[l.type] = (by[l.type] ?? 0) + 1;
      return by;
    };
    const canvases = () => page.locator('canvas').count();

    await page.goto('/es/');
    await expect(page.locator('#door')).toHaveAttribute('data-state', 'closed', { timeout: 8000 });
    await page.waitForTimeout(1500);
    const before = await listeners();
    const canvasesBefore = await canvases();

    for (let i = 0; i < 5; i++) {
      await page.click('#roca .row:first-child a');
      await expect(page).toHaveURL(/\/es\/proyectos\/selvadentro\/$/);
      await page.waitForTimeout(700);
      await page.click('.nav-mark');
      await expect(page).toHaveURL(/\/es\/$/);
      await page.waitForTimeout(700);
    }
    await page.waitForTimeout(1500);
    const after = await listeners();
    for (const type of ['scroll', 'resize', 'pointermove']) {
      expect(after[type] ?? 0, `${type} listeners grew: ${JSON.stringify(before)} → ${JSON.stringify(after)}`).toBeLessThanOrEqual(before[type] ?? 0);
    }
    expect(await canvases(), 'a WebGL context per visit').toBeLessThanOrEqual(canvasesBefore);
  });
});
