import { test, expect } from '@playwright/test';

// The homepage measured a 5.9 s LCP on a phone against a 2.5 s gate, because the largest element
// Chrome would score was the lede paragraph — revealed at 1.7 s. The plate was never a candidate
// at all: Chrome does not score an absolutely positioned image. These hold that fix in place.
test.describe('the hero', () => {
  test('the plate is the largest contentful paint, and it is fast', async ({ page }) => {
    test.skip(test.info().project.name === 'reduced');
    await page.addInitScript(() => {
      (window as any).__lcp = [];
      new PerformanceObserver((l) => {
        for (const e of l.getEntries() as any[]) (window as any).__lcp.push({ t: e.startTime, cls: String(e.element?.className || '') });
      }).observe({ type: 'largest-contentful-paint', buffered: true } as any);
    });
    await page.goto('/es/');
    await page.waitForTimeout(5000);
    const lcp = await page.evaluate(() => (window as any).__lcp as { t: number; cls: string }[]);
    expect(lcp.length, 'no LCP candidate at all').toBeGreaterThan(0);
    const last = lcp[lcp.length - 1];
    expect(last.cls, `LCP element was ${last.cls}`).toContain('hero-plate');
    // Unthrottled, so this is a ceiling rather than the field number; the regression it catches is
    // an LCP element that waits on the reveal timeline again.
    expect(last.t).toBeLessThan(2500);
  });

  test('the plate is in normal flow — an absolutely positioned image is never scored', async ({ page }) => {
    test.skip(test.info().project.name !== 'desktop');
    await page.goto('/es/');
    const pos = await page.locator('.hero .hero-plate').evaluate((el) => {
      const chain: string[] = [];
      let e: HTMLElement | null = el as HTMLElement;
      while (e && !e.classList.contains('hero')) { chain.push(getComputedStyle(e).position); e = e.parentElement; }
      return chain;
    });
    expect(pos, 'the plate or an ancestor is out of flow').not.toContain('absolute');
    expect(pos).not.toContain('fixed');
  });

  test('the video is an enhancement: nothing is fetched before the page has loaded', async ({ page }) => {
    test.skip(test.info().project.name === 'reduced');
    // At parse time the sources carry data-src only, so the video can never compete with the LCP.
    const html = await (await page.request.get('/es/')).text();
    expect(html).toContain('data-src="/media/hero/hero.webm"');
    expect(html).not.toMatch(/<source[^>]+\ssrc="\/media\/hero/);
    expect(html).toContain('preload="none"');
    await page.goto('/es/');
    await expect(page.locator('.hero-video.is-ready')).toHaveCount(1, { timeout: 15_000 });
  });

  test('reduced motion keeps the still and never loads the video', async ({ page }) => {
    test.skip(test.info().project.name !== 'reduced');
    await page.goto('/es/');
    await page.waitForTimeout(1500);
    await expect(page.locator('.hero .hero-plate')).toBeVisible();
    await expect(page.locator('.hero-video')).toBeHidden();
    expect(await page.locator('.hero-video source').first().getAttribute('src')).toBeNull();
  });
});

// The same failure, one page along: /proyectos/ opens on a heading and a lede and nothing else, so
// if those wait on the reveal script they are the Largest Contentful Paint and they are late. On a
// phone at 1.6 Mbps it measured 2,296 ms against a 2,500 ms gate before the section head on that
// page stopped revealing, and 764 ms after.
test.describe('a page that opens on type', () => {
  test('the projects index paints its own head without waiting for the script', async ({ page }) => {
    test.skip(test.info().project.name === 'reduced');
    await page.addInitScript(() => {
      (window as any).__lcp = [];
      new PerformanceObserver((l) => {
        for (const e of l.getEntries() as any[]) (window as any).__lcp.push({ t: e.startTime, cls: String(e.element?.className || '') });
      }).observe({ type: 'largest-contentful-paint', buffered: true } as any);
    });
    await page.goto('/es/proyectos/');
    await page.waitForTimeout(3000);
    const lcp = await page.evaluate(() => (window as any).__lcp as { t: number; cls: string }[]);
    expect(lcp.length, 'no LCP candidate at all').toBeGreaterThan(0);
    expect(lcp[lcp.length - 1].t).toBeLessThan(2500);
    // The head of this page is not held at nothing; the same head on the homepage still reveals,
    // because you arrive at the fourth stratum already reading.
    expect(await page.locator('.projects-page .sec-head [data-reveal]').count()).toBe(0);
    // ...and it is actually visible: the masked lines are released, not painted inside their own
    // mask where nobody sees them — which is exactly what happened the first time.
    const shift = await page.locator('.projects-page .sec-head h2 .line > span').first().evaluate((el) => getComputedStyle(el).transform);
    expect(shift === 'none' || shift === 'matrix(1, 0, 0, 1, 0, 0)').toBe(true);
    await expect(page.locator('.projects-page .sec-head h2')).toBeInViewport();
    await page.goto('/es/');
    expect(await page.locator('.roca .sec-head [data-reveal]').count()).toBeGreaterThan(0);
  });
});

