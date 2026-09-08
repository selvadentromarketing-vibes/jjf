import { test, expect } from '@playwright/test';

// Almost every arrival is a phone, and roughly half the buyers are over 45 (plan §2). These are
// the defects a desktop review never sees, all of which were live until they were measured.
const PAGES = ['/es/', '/es/contacto/', '/es/proyectos/selvadentro/', '/en/how-it-works/'];

test.describe('the phone', () => {
  test.skip(({ isMobile }) => !isMobile, 'phone projects only');

  for (const path of PAGES) {
    test(`${path} does not zoom when a field is focused`, async ({ page }) => {
      await page.goto(path);
      // iOS zooms the whole page when a focused control is under 16px. Checkboxes and radios are
      // exempt: they never receive that treatment.
      const tooSmall = await page.evaluate(() =>
        [...document.querySelectorAll('select, textarea, input:not([type=checkbox]):not([type=radio]):not([type=hidden])')]
          .filter((el) => parseFloat(getComputedStyle(el).fontSize) < 16)
          .map((el) => `${(el as HTMLInputElement).name || el.tagName}: ${getComputedStyle(el).fontSize}`)
      );
      expect(tooSmall).toEqual([]);
    });

    test(`${path} has thumb-sized targets`, async ({ page }) => {
      await page.goto(path);
      await page.waitForTimeout(400);
      const small = await page.evaluate(() =>
        [...document.querySelectorAll('a, button, input[type=checkbox], input[type=radio]')]
          .filter((el) => {
            const b = el.getBoundingClientRect();
            if (!b.width || !b.height) return false; // not rendered
            return b.height < 32; // the honest floor for a thumb on a link
          })
          .map((el) => `${el.tagName} "${(el.textContent || '').trim().slice(0, 20)}": ${Math.round(el.getBoundingClientRect().height)}px`)
      );
      expect(small).toEqual([]);
    });

    test(`${path} keeps body copy readable`, async ({ page }) => {
      await page.goto(path);
      await page.waitForTimeout(400);
      const tiny = await page.evaluate(() =>
        [...document.querySelectorAll('p, span, li, label, dd, dt, figcaption, td, th')]
          .filter((el) => el.textContent?.trim() && !el.children.length && el.getClientRects().length)
          .filter((el) => parseFloat(getComputedStyle(el).fontSize) < 12)
          .map((el) => `${el.className || el.tagName}: ${getComputedStyle(el).fontSize}`)
      );
      expect(tiny).toEqual([]);
    });
  }

  test('the page owns the notch and the home indicator', async ({ page }) => {
    await page.goto('/es/');
    // viewport-fit=cover hands the insets to the page; unhandled, content sits under the notch.
    const meta = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(meta).toContain('viewport-fit=cover');
    const usesInsets = await page.evaluate(() =>
      [...document.styleSheets].some((sheet) => {
        try { return [...sheet.cssRules].some((r) => r.cssText.includes('safe-area-inset')); } catch { return false; }
      })
    );
    expect(usesInsets, 'stylesheet must handle safe-area insets').toBe(true);
  });
});
