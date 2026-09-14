import { test, expect } from '@playwright/test';
import { readdir, readFile } from 'node:fs/promises';

const SLUGS = ['selvadentro', 'aldea-zama', 'selvazama', 'yucatan-country-club', 'amelia-tulum', 'hacienda-sacala'];

test.describe('el plano — the drawing becomes the place', () => {
  test('every project opens on a drawing that draws, dissolves, and leaves the photograph', async ({ page }) => {
    test.skip(test.info().project.name === 'reduced');
    await page.goto('/es/proyectos/selvadentro/');
    const plano = page.locator('.plano');
    await expect(plano).toHaveCount(1);
    // the three layers of a plan, in the order they are drawn
    for (const id of ['#boundary', '#built', '#landscape']) await expect(plano.locator(id)).toHaveCount(1);
    // it is not finished the instant the page loads: the strokes are drawn along their own length
    const mid = await page.evaluate(() => {
      const p = document.querySelector('.plano #built path') as SVGPathElement | null;
      return p ? p.style.strokeDasharray : '';
    });
    expect(mid === '' || /px/.test(mid)).toBeTruthy();
    // ...and it ends with the photograph, not the drawing
    await expect(page.locator('.plano.is-done')).toHaveCount(1, { timeout: 12_000 });
    await expect(page.locator('.project-hero.is-dawn, .project-hero.is-rest')).toHaveCount(1);
    await expect(page.locator('.hero-plate')).toBeVisible();
    await expect(page.locator('.plano.is-gone')).toHaveCount(1);
  });

  test('the door parts onto a drawing in progress, not a finished one', async ({ page }) => {
    test.skip(test.info().project.name !== 'desktop');
    await page.goto('/es/proyectos/selvadentro/');
    // the session's first page runs the overture; the drawing must not have finished behind it
    await expect(page.locator('html')).toHaveClass(/door-pending/);
    await page.waitForFunction(() => document.documentElement.classList.contains('door-open'), null, { timeout: 8000 });
    expect(await page.locator('.plano.is-done').count()).toBe(0);
    await expect(page.locator('.plano.is-done')).toHaveCount(1, { timeout: 12_000 });
  });

  test('it plays once per project per session', async ({ page }) => {
    test.skip(test.info().project.name === 'reduced');
    await page.goto('/es/proyectos/selvadentro/');
    await expect(page.locator('.plano.is-done')).toHaveCount(1, { timeout: 12_000 });
    await page.goto('/es/proyectos/aldea-zama/');
    await expect(page.locator('.plano.is-done')).toHaveCount(1, { timeout: 12_000 });
    await page.goto('/es/proyectos/selvadentro/');
    // back inside the same session: the photograph is simply there, at rest
    await expect(page.locator('.plano.is-done')).toHaveCount(1, { timeout: 2000 });
    await expect(page.locator('.project-hero.is-rest')).toHaveCount(1);
  });

  test('a project with no publishable plate keeps its drawing as the hero', async ({ page }) => {
    test.skip(test.info().project.name !== 'desktop');
    // Three of the six have only a staging-flagged plate, which never ships (§10). Stripping the
    // class is exactly what the build does for them: the drawing must then draw and stay, not
    // fade out onto an empty sheet of paper.
    await page.addInitScript(() => {
      const strip = () => {
        const h = document.querySelector('.project-hero');
        if (!h) return false;
        h.classList.remove('has-plate');
        return true;
      };
      // document, not documentElement: at document-start the root element does not exist yet and
      // observing null throws, which fails the whole init script silently.
      if (!strip()) new MutationObserver((_m, o) => { if (strip()) o.disconnect(); }).observe(document, { childList: true, subtree: true });
    });
    await page.goto('/es/proyectos/selvadentro/');
    await expect(page.locator('.plano.is-done')).toHaveCount(1, { timeout: 12_000 });
    await expect(page.locator('.plano.is-gone')).toHaveCount(0);
    expect(await page.locator('.plano').evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
  });

  test('reduced motion: the photograph, no drawing', async ({ page }) => {
    test.skip(test.info().project.name !== 'reduced');
    await page.goto('/es/proyectos/selvadentro/');
    await expect(page.locator('.plano')).toBeHidden();
    await expect(page.locator('.hero-plate')).toBeVisible();
  });

  test('no plan measures anything', async () => {
    test.skip(test.info().project.name !== 'desktop');
    const dir = 'src/assets/plans';
    const files = (await readdir(dir)).filter((f) => f.endsWith('.svg'));
    expect(files.length).toBe(SLUGS.length);
    for (const f of files) {
      const svg = await readFile(`${dir}/${f}`, 'utf8');
      expect(svg, `${f} carries a label`).not.toMatch(/<text\b|<tspan\b/i);
      // "el verdadero lujo no se mide en metros cuadrados" applies to the blueprint too
      expect(svg.replace(/<[^>]+>/g, ''), `${f} carries a number`).not.toMatch(/\d/);
      const shapes = (svg.match(/<(path|line|polyline|polygon|circle|ellipse|rect)\b/g) || []).length;
      expect(shapes, `${f} shape budget`).toBeLessThanOrEqual(60);
      for (const id of ['boundary', 'built', 'landscape']) expect(svg, `${f} missing #${id}`).toContain(`id="${id}"`);
    }
  });

  test('every project page carries its own drawing', async ({ page }) => {
    test.skip(test.info().project.name !== 'iphone');
    for (const slug of SLUGS) {
      await page.goto(`/es/proyectos/${slug}/`);
      await expect(page.locator(`.plano[data-plano="${slug}"]`), slug).toHaveCount(1);
      await expect(page.locator('.plano.is-done'), slug).toHaveCount(1, { timeout: 12_000 });
    }
  });
});

// B6 — the same drawn line at index scale, on /proyectos/ only.
test.describe('the index of the six draws its plans', () => {
  test('every row carries its own plan, and no two repeat an id', async ({ page }) => {
    test.skip(test.info().project.name !== 'desktop');
    await page.goto('/es/proyectos/');
    for (const slug of SLUGS) await expect(page.locator(`[data-row-plan="${slug}"]`), slug).toHaveCount(1);
    // Six drawings on one page would otherwise repeat #boundary six times, which is invalid and
    // makes every lookup find the first row's drawing.
    for (const id of ['boundary', 'built', 'landscape']) {
      expect(await page.locator(`#${id}`).count(), id).toBe(0);
      expect(await page.locator(`[data-group="${id}"]`).count(), id).toBe(SLUGS.length);
    }
  });

  test('a row draws as it arrives, and stays drawn when you scroll back', async ({ page }) => {
    test.skip(test.info().project.name !== 'desktop');
    await page.goto('/es/proyectos/');
    const first = page.locator('[data-row-plan]').first();
    await expect(first).toHaveClass(/is-drawn/, { timeout: 6000 });
    // The last row is below the fold and has not been drawn yet: the strokes are held at nothing.
    const last = page.locator('[data-row-plan]').last();
    expect(await last.evaluate((el) => el.classList.contains('is-drawn'))).toBe(false);
    await last.scrollIntoViewIfNeeded();
    await expect(last).toHaveClass(/is-drawn/, { timeout: 6000 });
    // Once, never replayed: scrolling back up leaves the drawings where they are.
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);
    expect(await last.evaluate((el) => el.classList.contains('is-drawn'))).toBe(true);
  });

  test('nothing but the stroke moves, and nothing overflows', async ({ page }) => {
    test.skip(test.info().project.name !== 'iphone');
    await page.goto('/es/proyectos/');
    await page.waitForTimeout(600);
    const before = await page.locator('.row').first().boundingBox();
    await page.waitForTimeout(1600);
    const after = await page.locator('.row').first().boundingBox();
    expect(Math.round(after!.height)).toBe(Math.round(before!.height));
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('reduced motion gets the plans, finished', async ({ page }) => {
    test.skip(test.info().project.name !== 'reduced');
    await page.goto('/es/proyectos/');
    await expect(page.locator('[data-row-plan].is-drawn')).toHaveCount(SLUGS.length, { timeout: 6000 });
  });

  test('the homepage index keeps its photographs; the drawing belongs to the six', async ({ page }) => {
    test.skip(test.info().project.name !== 'desktop');
    await page.goto('/es/');
    await expect(page.locator('[data-row-plan]')).toHaveCount(0);
  });
});
