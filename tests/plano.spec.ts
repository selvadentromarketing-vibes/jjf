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
