// Traces every project's drawing from the plate named in its Spanish content file (plan §S2).
// Re-run whenever a plate changes; replace the output by hand the moment an architect's DWG lands.
import { readdir, readFile } from 'node:fs/promises';
import { tracePlan } from './trace-plan.mjs';

const dir = 'src/content/projects/es';
for (const f of (await readdir(dir)).filter((x) => x.endsWith('.md'))) {
  const src = await readFile(`${dir}/${f}`, 'utf8');
  const key = /^key:\s*(\S+)/m.exec(src)?.[1];
  const hero = /^hero:\s*(\S+)/m.exec(src)?.[1];
  if (!key || !hero) { console.log(`— ${f}: no key or hero`); continue; }
  const img = 'src/assets/img/' + hero.split('/').pop();
  const r = await tracePlan(key, img);
  console.log(`${r.slug.padEnd(22)} boundary ${r.boundary}  built ${String(r.built).padStart(2)}  landscape ${String(r.landscape).padStart(2)} (${r.water} water)  ${(r.bytes / 1024).toFixed(1)} KB`);
}
