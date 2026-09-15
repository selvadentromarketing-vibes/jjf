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
    // Under a second from navigation to an interactive page, load included.
    expect(Date.now() - t0).toBeLessThan(2500);
    // The next session's first page: a click during the overture finishes it at once.
    await page.evaluate(() => sessionStorage.removeItem('jjf-door'));
    await page.reload();
    await expect(page.locator('#door')).toHaveAttribute('data-state', 'overture');
    await page.mouse.click(720, 450);
    await expect(page.locator('#door')).toHaveAttribute('data-state', 'closed', { timeout: 800 });
    await expect(page.locator('html')).toHaveClass(/door-open/);
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
