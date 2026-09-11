// Traces every project's drawing from whatever its content file names as the plan's source
// (plan §S2). Re-run whenever a source changes; replace the output by hand the moment an
// architect's DWG lands.
//
// The source is `plan.from`, looked for first among the plans the studios and the sales team have
// given us, then among the photographs. A real drawing always wins: it says what was surveyed,
// where a plate only says what the camera saw.
import { access, readdir, readFile } from 'node:fs/promises';
import { tracePlan } from './trace-plan.mjs';

const DIRS = ['src/assets/plans/source', 'src/assets/img'];
const exists = async (p) => { try { await access(p); return true; } catch { return false; } };

const dir = 'src/content/projects/es';
for (const f of (await readdir(dir)).filter((x) => x.endsWith('.md'))) {
  const src = await readFile(`${dir}/${f}`, 'utf8');
  const key = /^key:\s*(\S+)/m.exec(src)?.[1];
  const from = /^\s{2}from:\s*(\S+)/m.exec(src)?.[1] || /^hero:\s*(\S+)/m.exec(src)?.[1]?.split('/').pop();
  if (!key || !from) { console.log(`— ${f}: no key or plan source`); continue; }
  let img = null;
  for (const d of DIRS) if (await exists(`${d}/${from}`)) { img = `${d}/${from}`; break; }
  if (!img) { console.log(`— ${key}: ${from} not found in ${DIRS.join(' or ')}`); continue; }
  const r = await tracePlan(key, img);
  console.log(`${r.slug.padEnd(22)} ${r.kind.padEnd(11)} boundary ${r.boundary}  built ${String(r.built).padStart(2)}  landscape ${String(r.landscape).padStart(2)}  ${(r.bytes / 1024).toFixed(1)} KB  ← ${from}`);
}
