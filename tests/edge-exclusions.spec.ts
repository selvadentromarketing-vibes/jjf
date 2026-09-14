import { test, expect } from '@playwright/test';
import { readdirSync, readFileSync, statSync } from 'node:fs';

// The locale edge function sends every unprefixed path to /es/ or /en/. That is right for pages
// and wrong for everything else, and "everything else" is a list in netlify.toml that has to be
// kept by hand. It was not: /brand/logo.png — the Organization logo in every page's JSON-LD — and
// /llms.txt were redirected to /en/…/ and 404ed for as long as they existed, and no test could
// see it because the edge function only runs on Netlify. This one reads the list and the build
// output instead, which is where the drift actually happens.
test('every root file and folder the build emits is excluded from locale routing', () => {
  test.skip(test.info().project.name !== 'desktop');
  const toml = readFileSync('netlify.toml', 'utf8');
  const m = /excludedPath\s*=\s*\[([^\]]*)\]/.exec(toml);
  expect(m, 'excludedPath not found in netlify.toml').toBeTruthy();
  const patterns = [...m![1].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
  const covered = (path: string) => patterns.some((p) => (p.endsWith('/*') ? path.startsWith(p.slice(0, -1)) : p === path));

  const missing: string[] = [];
  for (const name of readdirSync('dist')) {
    if (name === 'index.html') continue; // the one path the edge function is FOR
    const isDir = statSync(`dist/${name}`).isDirectory();
    const path = `/${name}${isDir ? '/' : ''}`;
    if (isDir && (name === 'es' || name === 'en')) continue; // covered by the /es/* and /en/* patterns
    if (!covered(isDir ? `${path}x` : path)) missing.push(path);
  }
  expect(missing, `add these to excludedPath in netlify.toml: ${missing.join(', ')}`).toEqual([]);
});
