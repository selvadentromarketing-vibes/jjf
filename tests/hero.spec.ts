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

  test('the film is an enhancement: nothing is fetched before the page has loaded', async ({ page }) => {
    test.skip(test.info().project.name === 'reduced');
    // At parse time the sources carry data-src only, so the film can never compete with the plate.
    const html = await (await page.request.get('/es/')).text();
    expect(html).toContain('data-src="/media/hero/hero-desk.webm"');
    expect(html).toContain('data-src="/media/hero/hero-phone.mp4"');
    expect(html).not.toMatch(/<source[^>]+\ssrc="\/media\/hero/);
    expect(html).toContain('preload="none"');
    // ...and the plate stays the LCP element; the film fades in over it once it plays.
    await page.goto('/es/');
    await expect(page.locator('.hero .hero-video.is-ready')).toHaveCount(1, { timeout: 12_000 });
  });

  test('after the table the film loops in the land, never back to the table', async ({ page }) => {
    test.skip(test.info().project.name !== 'desktop');
    await page.goto('/es/');
    await expect(page.locator('.hero .hero-video.is-ready')).toHaveCount(1, { timeout: 12_000 });
    const loopIn = await page.locator('.hero .hero-video').evaluate((v) => Number((v as HTMLVideoElement).dataset.loopIn));
    expect(loopIn).toBeGreaterThan(0);
    // one full pass plus a loop: the clock must have wrapped to the land, not to zero
    await page.waitForTimeout(12_000);
    const t = await page.locator('.hero .hero-video').evaluate((v) => (v as HTMLVideoElement).currentTime);
    expect(t).toBeGreaterThanOrEqual(loopIn - 0.2);
  });

  test('reduced motion keeps the plate and never loads the film', async ({ page }) => {
    test.skip(test.info().project.name !== 'reduced');
    await page.goto('/es/');
    await page.waitForTimeout(2500);
    expect(await page.locator('.hero .hero-video source[src]').count()).toBe(0);
    await expect(page.locator('.hero .hero-video')).toBeHidden();
  });

  test('the camera moves without a script: the plate arrives, breathes and sinks', async ({ page }) => {
    test.skip(test.info().project.name !== 'desktop');
    await page.goto('/es/');
    await page.waitForTimeout(400);
    // Under a drawing registered onto it the plate cannot move: the plan and the film share its
    // pixels, and any scale would break the registration and jump at the cut. The camera is the
    // film's. Where no plan is drawn the plate still arrives and breathes.
    const plate = await page.evaluate(() => getComputedStyle(document.querySelector('.hero .hero-plate')!).animationName);
    const hasPlan = await page.locator('.hero.has-plano').count();
    if (hasPlan) expect(plate).toBe('none');
    else { expect(plate).toMatch(/hero-arrive/); expect(plate).toContain('hero-breathe'); }
    // No wrapper box between the grid and the picture: that is what keeps the plate an LCP candidate.
    expect(await page.locator('.hero > picture.hero-media > img.hero-plate').count()).toBe(1);
    expect(await page.locator('.hero > video.hero-video').count()).toBe(1);
    // the sink is scroll-driven where the browser can, and simply absent where it cannot
    const sink = await page.evaluate(() => getComputedStyle(document.querySelector('.hero .hero-media')!).animationName);
    expect(sink === 'hero-sink' || sink === 'none').toBe(true);
  });

  test('reduced motion holds the camera still', async ({ page }) => {
    test.skip(test.info().project.name !== 'reduced');
    await page.goto('/es/');
    await expect(page.locator('.hero .hero-plate')).toBeVisible();
    const anims = await page.evaluate(() => [
      getComputedStyle(document.querySelector('.hero .hero-media')!).animationName,
      getComputedStyle(document.querySelector('.hero .hero-plate')!).animationName,
    ]);
    expect(anims.every((a) => a === 'none')).toBe(true);
    await expect(page.locator('.hero-cue')).toBeHidden();
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

