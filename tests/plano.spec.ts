import { test, expect } from '@playwright/test';
import { readdir, readFile } from 'node:fs/promises';

// Six places; one of them has a real plan to draw. The other five were traced from aerial
// photographs and read as scribbles at the size of a screen, so they were retired: a developer's
// site cannot show a drawing that invents geometry. Those pages open on their photograph.
const SLUGS = ['selvadentro', 'aldea-zama', 'selvazama', 'yucatan-country-club', 'amelia-tulum', 'hacienda-sacala'];
const DRAWN = 'aldea-zama';
const UNDRAWN = 'selvadentro';

test.describe('el plano — the drawing becomes the place', () => {
  test('a place with a real plan opens on a drawing that draws, dissolves, and leaves the photograph', async ({ page }) => {
    test.skip(test.info().project.name === 'reduced');
    await page.goto(`/es/proyectos/${DRAWN}/`);
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
    await page.goto(`/es/proyectos/${DRAWN}/`);
    // the session's first page runs the overture; the drawing must not have finished behind it
    await expect(page.locator('html')).toHaveClass(/door-pending/);
    await page.waitForFunction(() => document.documentElement.classList.contains('door-open'), null, { timeout: 8000 });
    expect(await page.locator('.plano.is-done').count()).toBe(0);
    await expect(page.locator('.plano.is-done')).toHaveCount(1, { timeout: 12_000 });
  });

  test('it plays once per project per session', async ({ page }) => {
    test.skip(test.info().project.name === 'reduced');
    await page.goto(`/es/proyectos/${DRAWN}/`);
    await expect(page.locator('.plano.is-done')).toHaveCount(1, { timeout: 12_000 });
    await page.goto(`/es/proyectos/${UNDRAWN}/`);
    await expect(page.locator('.plano')).toHaveCount(0);
    await page.goto(`/es/proyectos/${DRAWN}/`);
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
    await page.goto(`/es/proyectos/${DRAWN}/`);
    await expect(page.locator('.plano.is-done')).toHaveCount(1, { timeout: 12_000 });
    await expect(page.locator('.plano.is-gone')).toHaveCount(0);
    expect(await page.locator('.plano').evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
  });

  test('reduced motion: the photograph, no drawing', async ({ page }) => {
    test.skip(test.info().project.name !== 'reduced');
    await page.goto(`/es/proyectos/${DRAWN}/`);
    await expect(page.locator('.plano')).toBeHidden();
    await expect(page.locator('.hero-plate')).toBeVisible();
  });

  test('no plan measures anything, and every drawing on disk is one a place declares', async () => {
    test.skip(test.info().project.name !== 'desktop');
    const dir = 'src/assets/plans';
    const files = (await readdir(dir)).filter((f) => f.endsWith('.svg')).sort();
    // The set of plans is the set of `svg:` declarations in the Spanish records — no orphan
    // drawing waiting to be wired, no declaration pointing at nothing.
    const declared: string[] = [];
    for (const f of (await readdir('src/content/projects/es')).filter((f) => f.endsWith('.md'))) {
      const m = (await readFile(`src/content/projects/es/${f}`, 'utf8')).match(/^\s+svg:\s*(\S+)/m);
      if (m) declared.push(m[1]);
    }
    expect(files).toEqual(declared.sort());
    expect(files.length).toBeGreaterThan(0);
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

  test('the drawn place draws; every other place opens on its photograph', async ({ page }) => {
    test.skip(test.info().project.name !== 'iphone');
    for (const slug of SLUGS) {
      await page.goto(`/es/proyectos/${slug}/`);
      if (slug === DRAWN) {
        await expect(page.locator(`.plano[data-plano="${slug}"]`), slug).toHaveCount(1);
        await expect(page.locator('.plano.is-done'), slug).toHaveCount(1, { timeout: 12_000 });
      } else {
        await expect(page.locator('.plano'), `${slug} shows a drawing it does not have`).toHaveCount(0);
        await expect(page.locator('.project-hero .hero-plate'), slug).toBeVisible();
      }
    }
  });
});

// The index rows carried the six drawings for a day (B6). With five of them retired the feature is
// parked: an index where one row draws and five do not reads as broken. The code path stays for
// when the studios' plans arrive; the pages must not show it until then.
test.describe('the index and the drawings', () => {
  test('no index row carries a drawing until the plans are real', async ({ page }) => {
    test.skip(test.info().project.name !== 'desktop');
    for (const p of ['/es/', '/es/proyectos/']) {
      await page.goto(p);
      await expect(page.locator('[data-row-plan]'), p).toHaveCount(0);
    }
  });
});
