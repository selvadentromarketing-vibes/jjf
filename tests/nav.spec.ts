import { test, expect } from '@playwright/test';

// The site had no navigation for a year: a mark, the language pair and one button, with every
// other page reachable only from the footer. These hold the header to the job.
test.describe('the header', () => {
  test('the sections are in the header on a desktop, and the current one is marked', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop projects only');
    await page.goto('/es/guias/');
    const links = page.locator('.nav-links a');
    await expect(links).toHaveCount(4);
    await expect(page.locator('.nav-links a[aria-current="page"]')).toHaveText('Guías');
    // The button that opens the sheet has no business on a desktop.
    await expect(page.locator('[data-sheet-open]')).toBeHidden();
    for (const href of await links.evaluateAll((els) => els.map((e) => (e as HTMLAnchorElement).getAttribute('href')))) {
      expect((await page.request.get(href!)).status(), href!).toBe(200);
    }
  });

  test('the sheet opens in the current ground, traps focus, and Escape closes it', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'phone projects only');
    await page.goto('/es/');
    await page.waitForTimeout(1200);
    const opener = page.locator('[data-sheet-open]');
    await expect(opener).toBeVisible();
    await opener.click();
    const sheet = page.locator('[data-sheet]');
    await expect(sheet).toBeVisible();
    await expect(opener).toHaveAttribute('aria-expanded', 'true');
    // The page behind it is inert, and focus starts on the way out.
    expect(await page.locator('main[inert]').count()).toBe(1);
    await expect(page.locator('[data-sheet-close]')).toBeFocused();
    // Six places in the house serif, the sections, the language pair, WhatsApp.
    await expect(sheet.locator('.sheet-places a')).toHaveCount(6);
    await expect(sheet.locator('.sheet-links a')).toHaveCount(5);
    await expect(sheet.locator('.lang')).toBeVisible();
    // Tab cycles inside the sheet: from the last focusable back to the first.
    const count = await sheet.locator('a[href], button').count();
    for (let i = 0; i < count; i++) await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement?.closest('[data-sheet]') !== null)).toBe(true);
    await page.keyboard.press('Escape');
    await expect(sheet).toBeHidden();
    expect(await page.locator('main[inert]').count()).toBe(0);
    await expect(opener).toBeFocused();
  });

  test('a link in the sheet closes it and lands on the page', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'phone projects only');
    await page.goto('/es/');
    await page.waitForTimeout(1200);
    await page.locator('[data-sheet-open]').click();
    await page.locator('.sheet-links a[href="/es/guias/"]').click();
    await expect(page).toHaveURL(/\/es\/guias\/$/);
    await expect(page.locator('[data-sheet]')).toBeHidden();
    await expect(page.locator('h1')).toContainText('Guías');
  });
});
