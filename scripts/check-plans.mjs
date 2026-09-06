// Validates every plan SVG (plan §9): no text, the three groups, ≤ 60 shapes, ≤ 80 KB gzip, no digits.
import { readdir, readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';

const dir = 'src/assets/plans';
let files = [];
try { files = (await readdir(dir)).filter((f) => f.endsWith('.svg')); } catch { files = []; }
if (!files.length) { console.log('check:plans — no plan SVGs yet'); process.exit(0); }
let bad = 0;
for (const f of files) {
  const s = await readFile(`${dir}/${f}`, 'utf8');
  const problems = [];
  if (/<text\b|<tspan\b/i.test(s)) problems.push('contains <text> — plans carry no dimensions or labels');
  for (const g of ['boundary', 'built', 'landscape']) if (!new RegExp(`id="${g}"`).test(s)) problems.push(`missing group #${g}`);
  const shapes = (s.match(/<(path|line|polyline|polygon|circle|ellipse|rect)\b/g) || []).length;
  if (shapes > 60) problems.push(`${shapes} shapes > 60`);
  const gz = gzipSync(s).length;
  if (gz > 80 * 1024) problems.push(`${(gz / 1024).toFixed(0)} KB gzip > 80 KB`);
  if (/\d/.test(s.replace(/<[^>]+>/g, ''))) problems.push('digits in text content');
  if (problems.length) { bad++; console.error(`✗ ${f}\n  - ${problems.join('\n  - ')}`); }
  else console.log(`✓ ${f} (${shapes} shapes, ${(gz / 1024).toFixed(0)} KB gzip)`);
}
process.exit(bad ? 1 : 0);
