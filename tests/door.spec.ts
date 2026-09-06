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

  test('every click carries the beat with the mark, then the new page', async ({ page }) => {
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
    await expect(page.locator('#door')).toHaveAttribute('data-state', 'closed', { timeout: 5000 });
    expect(seen).toContain('beat');
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
