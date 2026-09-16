import { test, expect } from '@playwright/test';

test.describe('la marca — the door', () => {
  test('opens once per session, then never again on reload', async ({ page }) => {
    test.skip(test.info().project.name !== 'desktop');
    await page.goto('/es/');
    await expect(page.locator('html')).toHaveClass(/door-pending/);
    await expect(page.locator('#door')).toHaveAttribute('data-state', /overture|closed/);
    await expect(page.locator('#door')).toHaveAttribute('data-state', 'closed', { timeout: 8000 });
    await expect(page.locator('#door')).toBeHidden();
    expect(await page.evaluate(() => sessionStorage.getItem('jjf-door'))).toBe('1');
    await page.reload();
    await expect(page.locator('html')).not.toHaveClass(/door-pending/);
    await expect(page.locator('#door')).toBeHidden();
    // the hero copy is present after the overture
    await expect(page.locator('h1.hero-title')).toBeVisible();
  });

  test('the overture is short, and a gesture ends it early', async ({ page }) => {
    test.skip(test.info().project.name !== 'desktop');
    const t0 = Date.now();
    await page.goto('/es/');
    await expect(page.locator('#door')).toHaveAttribute('data-state', 'closed', { timeout: 8000 });
    // The overture is two and a third seconds now (the signature, the beat, the morph); with the
    // load it must still be an interactive page well inside five.
    expect(Date.now() - t0).toBeLessThan(5000);
    // The next session's first page: a click during the overture finishes it at once.
    await page.evaluate(() => sessionStorage.removeItem('jjf-door'));
    await page.reload();
    await expect(page.locator('#door')).toHaveAttribute('data-state', 'overture');
    await page.mouse.click(720, 450);
    await expect(page.locator('#door')).toHaveAttribute('data-state', 'closed', { timeout: 800 });
    await expect(page.locator('html')).toHaveClass(/door-open/);
  });

  test('on the home the mark is staged in the plan\'s coordinates and becomes its first road', async ({ page }) => {
    test.skip(test.info().project.name !== 'desktop');
    await page.goto('/es/');
    await expect(page.locator('#door')).toHaveAttribute('data-state', 'overture');
    // the mark's paths are copied into the stage; the HTML mark steps aside
    await expect(page.locator('#door .door-plan path')).not.toHaveCount(0, { timeout: 3000 });
    expect(await page.locator('#door .door-mark').evaluate((el) => getComputedStyle(el).visibility)).toBe('hidden');
    // the curtains part before the hand-off, and the hand-off comes before the door closes
    await page.waitForFunction(() => document.documentElement.classList.contains('door-open'), null, { timeout: 8000 });
    expect(await page.evaluate(() => document.documentElement.classList.contains('door-morphed'))).toBe(false);
    await page.waitForFunction(() => document.documentElement.classList.contains('door-morphed'), null, { timeout: 8000 });
    await expect(page.locator('#door')).toHaveAttribute('data-state', 'closed', { timeout: 2000 });
    // the stage is emptied and the mark is whole again for the next page
    await expect(page.locator('#door .door-plan path')).toHaveCount(0);
  });

  test('a click is a cross on the page, not the mark again', async ({ page }) => {
    test.skip(test.info().project.name !== 'desktop');
    await page.goto('/es/');
    await expect(page.locator('#door')).toHaveAttribute('data-state', 'closed', { timeout: 8000 });
    const seen: string[] = [];
    await page.exposeFunction('__doorState', (s: string) => seen.push(s));
    await page.evaluate(() => {
      const door = document.getElementById('door')!;
      new MutationObserver(() => (window as any).__doorState(door.dataset.state)).observe(door, { attributes: true, attributeFilter: ['data-state'] });
    });
    await page.click('a.cta[href="/es/contacto/"]');
    await expect(page).toHaveURL(/\/es\/contacto\/$/);
    await expect(page.locator('#door')).toBeHidden();
    expect(seen).not.toContain('beat');
    await expect(page.locator('h1')).toContainText('Cuando quieras');
  });

  test('reduced motion: no door, nothing moves', async ({ page }) => {
    test.skip(test.info().project.name !== 'reduced');
    await page.goto('/es/');
    await expect(page.locator('html')).not.toHaveClass(/door-pending/);
    await expect(page.locator('#door')).toBeHidden();
    await expect(page.locator('h1.hero-title')).toBeVisible();
    const moving = await page.evaluate(() => Array.from(document.querySelectorAll('.line > span')).filter((s) => getComputedStyle(s).transform !== 'none').length);
    expect(moving).toBe(0);
    expect(await page.locator('[data-reveal]:not(.is-in)').count()).toBe(0);
  });
});
