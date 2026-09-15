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

  test('the side panel is for cursors; a touch device keeps each row\'s own still', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'phone projects only');
    await page.goto('/es/');
    await page.locator('#roca').scrollIntoViewIfNeeded();
    await page.waitForTimeout(900);
    // The column panel holds one position beside a cursor; with no cursor there is no canvas at all.
    expect(await page.locator('canvas.index-panel').count()).toBe(0);
    await expect(page.locator('#roca .row .still').first()).toBeVisible();
  });

  test('it rests on a photograph, follows the hover, and goes dark only when the list has gone', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop projects only');
    await page.goto('/es/');
    await page.locator('#roca').scrollIntoViewIfNeeded();
    await page.waitForTimeout(900);

    const panel = page.locator('canvas.index-panel');
    if (!(await panel.count())) test.skip(true, 'no WebGL in this environment');

    // At rest, with the list on screen, the column beside the names is a photograph, not a hole.
    await expect(panel).toHaveClass(/is-on/, { timeout: 2000 });

    await page.hover('#roca .row:nth-child(3) a');
    await expect(panel).toHaveClass(/is-on/, { timeout: 2000 });

    // Leaving the list leaves the last photograph where it was.
    await page.hover('#roca .sec-head h2');
    await page.waitForTimeout(700);
    await expect(panel).toHaveClass(/is-on/);

    // Scrolling past the list is what turns it off — and it must finish rather than decay forever.
    // The light goes out over 600 ms once the list has left; under a loaded test runner the frames
    // that carry it run late, so the wait is generous and the assertion is only that it ends.
    await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' as ScrollBehavior }));
    await expect(panel).not.toHaveClass(/is-on/, { timeout: 6000 });
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

  test('a phone lights the place it has scrolled to', async ({ page }) => {
    test.skip(test.info().project.name !== 'iphone');
    await page.goto('/es/');
    await page.waitForTimeout(2600);
    // No plate behind the list any more: the stills carry the photographs and the light is a class.
    expect(await page.locator('canvas.index-panel').count()).toBe(0);
    await expect(page.locator('.row .still').first()).toBeVisible();

    const litName = async () => page.locator('.row a.is-lit-row .name').textContent().catch(() => null);
    const scrollTo = async (off: number) => {
      await page.evaluate((o) => {
        const r = document.querySelector('[data-index]')!.getBoundingClientRect();
        window.scrollTo({ top: r.top + window.scrollY + o, behavior: 'instant' as ScrollBehavior });
      }, off);
      await page.waitForTimeout(900);
    };
    await scrollTo(120);
    const first = await litName();
    expect(first, 'no row is lit').toBeTruthy();
    // Scrolling on changes which place has your attention, and the light follows.
    await scrollTo(520);
    expect(await litName(), 'the lit row did not follow the scroll').not.toBe(first);
    // Past the list, the light goes out.
    await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' as ScrollBehavior }));
    await page.waitForTimeout(1400);
    await expect(page.locator('.row a.is-lit-row')).toHaveCount(0);
  });
});
