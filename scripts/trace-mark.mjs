// Traces the JJF logo PNG into a stroke+fill SVG for the door (DrawSVG), the nav, the favicon and the OG cards.
// Prefer the designer's vector file when it arrives (plan §14 #12): drop it in as src/assets/brand/jjf-mark.svg.
import sharp from 'sharp';
import potrace from 'potrace';
import { optimize } from 'svgo';
import { access, mkdir, writeFile } from 'node:fs/promises';
import { promisify } from 'node:util';

const SRC = process.argv[2] ?? (await first(['src/assets/brand/logo.png', 'assets/logo.png', process.env.LOGO_PNG].filter(Boolean)));
const OUT = 'src/assets/brand/jjf-mark.svg';
const W = 2000;

async function first(paths) { for (const p of paths) { try { await access(p); return p; } catch {} } throw new Error('logo.png not found'); }

const { data, info } = await sharp(SRC).flatten({ background: '#ffffff' }).greyscale().resize({ width: W, kernel: 'lanczos3' }).threshold(150).png().toBuffer({ resolveWithObject: true });
const H = info.height;
const trace = promisify(potrace.trace);
const raw = await trace(data, { threshold: 128, turdSize: 60, optTolerance: 0.3, alphaMax: 1.0, color: 'black', background: 'transparent' });
const d = /\sd="([^"]+)"/.exec(raw)?.[1];
if (!d) throw new Error('potrace produced no path');

// ---- split the single potrace path into subpaths with bounding boxes ----
function parse(d) {
  const tok = d.match(/[a-zA-Z]|-?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?/g);
  const subs = []; let cur = null, cmd = '', x = 0, y = 0, sx = 0, sy = 0, i = 0;
  const num = () => parseFloat(tok[i++]);
  const isNum = () => i < tok.length && !/[a-zA-Z]/.test(tok[i]);
  const start = (px, py) => { cur = { d: `M${r(px)} ${r(py)}`, minx: px, miny: py, maxx: px, maxy: py }; subs.push(cur); };
  const pt = (px, py) => { cur.minx = Math.min(cur.minx, px); cur.maxx = Math.max(cur.maxx, px); cur.miny = Math.min(cur.miny, py); cur.maxy = Math.max(cur.maxy, py); };
  const r = (v) => Math.round(v * 10) / 10;
  while (i < tok.length) {
    if (/[a-zA-Z]/.test(tok[i])) cmd = tok[i++];
    switch (cmd) {
      case 'M': { const nx = num(), ny = num(); x = sx = nx; y = sy = ny; start(x, y); cmd = 'L'; break; }
      case 'm': { const dx = num(), dy = num(); x = sx = x + dx; y = sy = y + dy; start(x, y); cmd = 'l'; break; }
      case 'L': { const nx = num(), ny = num(); x = nx; y = ny; cur.d += `L${r(x)} ${r(y)}`; pt(x, y); break; }
      case 'l': { const dx = num(), dy = num(); x += dx; y += dy; cur.d += `L${r(x)} ${r(y)}`; pt(x, y); break; }
      case 'H': { x = num(); cur.d += `L${r(x)} ${r(y)}`; pt(x, y); break; }
      case 'h': { x += num(); cur.d += `L${r(x)} ${r(y)}`; pt(x, y); break; }
      case 'V': { y = num(); cur.d += `L${r(x)} ${r(y)}`; pt(x, y); break; }
      case 'v': { y += num(); cur.d += `L${r(x)} ${r(y)}`; pt(x, y); break; }
      case 'C': { const a = [num(), num(), num(), num(), num(), num()]; cur.d += `C${a.map(r).join(' ')}`; pt(a[0], a[1]); pt(a[2], a[3]); x = a[4]; y = a[5]; pt(x, y); break; }
      case 'c': { const a = [num(), num(), num(), num(), num(), num()]; const abs = [x + a[0], y + a[1], x + a[2], y + a[3], x + a[4], y + a[5]]; cur.d += `C${abs.map(r).join(' ')}`; pt(abs[0], abs[1]); pt(abs[2], abs[3]); x = abs[4]; y = abs[5]; pt(x, y); break; }
      case 'Z': case 'z': { cur.d += 'Z'; x = sx; y = sy; if (isNum()) { /* implicit moveto not expected */ } break; }
      default: throw new Error('unsupported path command ' + cmd);
    }
  }
  return subs;
}
const subs = parse(d).map((s) => ({ ...s, w: s.maxx - s.minx, h: s.maxy - s.miny, area: (s.maxx - s.minx) * (s.maxy - s.miny) }));
const big = subs.filter((s) => s.area > W * H * 1e-4).sort((a, b) => b.area - a.area);
// holes join the letter that contains them
const letters = [];
for (const s of big) {
  const host = letters.find((L) => L.h < H * 0.2 && s.area < L.area * 0.6 && s.minx >= L.minx && s.maxx <= L.maxx && s.miny >= L.miny && s.maxy <= L.maxy);
  if (host) { host.d += s.d; host.parts++; } else letters.push({ ...s, parts: 1 });
}
const word = letters.filter((L) => L.h < H * 0.2 && L.miny > H * 0.55);
const mark = letters.filter((L) => !word.includes(L));
console.log(`subpaths ${subs.length} → letters ${letters.length}: mark ${mark.length}, word ${word.length}`);
console.log('mark bbox', mark.map((m) => [m.minx, m.miny, m.maxx, m.maxy].map(Math.round).join(',')).join(' | '));
console.log('word bbox', word.map((m) => [m.minx, m.miny, m.maxx, m.maxy].map(Math.round).join(',')).join(' | '));

const all = [...mark, ...word];
const bb = { minx: Math.min(...all.map((s) => s.minx)), miny: Math.min(...all.map((s) => s.miny)), maxx: Math.max(...all.map((s) => s.maxx)), maxy: Math.max(...all.map((s) => s.maxy)) };
const pad = (bb.maxx - bb.minx) * 0.02;
const vb = [bb.minx - pad, bb.miny - pad, bb.maxx - bb.minx + 2 * pad, bb.maxy - bb.miny + 2 * pad].map((v) => Math.round(v)).join(' ');
const paths = (arr) => arr.map((L) => `<path d="${L.d}"/>`).join('');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" aria-hidden="true" focusable="false">` +
  `<g class="mk-fill" fill="currentColor" fill-rule="evenodd"><g class="mk-mark">${paths(mark)}</g><g class="mk-word">${paths(word)}</g></g>` +
  `<g class="mk-stroke" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"><g class="mk-mark">${paths(mark)}</g></g>` +
  `</svg>`;
const { data: out } = optimize(svg, {
  multipass: true, floatPrecision: 0,
  plugins: [{ name: 'preset-default', params: { overrides: { cleanupIds: false, mergePaths: false, collapseGroups: false, removeUselessStrokeAndFill: false, removeUnknownsAndDefaults: false } } }],
});
await mkdir('src/assets/brand', { recursive: true });
await writeFile(OUT, out);
console.log(`wrote ${OUT} (${out.length} bytes)`);

// favicon: the mark alone, bone on forest
const markOnly = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#0A0D0A"/><svg x="8" y="8" width="48" height="48" viewBox="${[Math.min(...mark.map(m=>m.minx)), Math.min(...mark.map(m=>m.miny)), Math.max(...mark.map(m=>m.maxx))-Math.min(...mark.map(m=>m.minx)), Math.max(...mark.map(m=>m.maxy))-Math.min(...mark.map(m=>m.miny))].join(' ')}" preserveAspectRatio="xMidYMid meet"><g fill="#F2EEE5" fill-rule="evenodd">${paths(mark)}</g></svg></svg>`;
await mkdir('public', { recursive: true });
await writeFile('public/favicon.svg', optimize(markOnly, { floatPrecision: 0, plugins: [{ name: 'preset-default', params: { overrides: { mergePaths: false, collapseGroups: false } } }] }).data);

// OG cards (typography-only, Phase 0): linen ground, the mark, one line per language
const og = (lines, sub) => `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<rect width="1200" height="630" fill="#EDE7DA"/>
<svg x="80" y="84" width="200" height="200" viewBox="${vb}" preserveAspectRatio="xMinYMin meet"><g fill="#0A0D0A" fill-rule="evenodd">${paths(mark)}${paths(word)}</g></svg>
${lines.map((l, i) => `<text x="80" y="${420 + i * 78}" font-family="Instrument Serif, Georgia, serif" font-size="72" letter-spacing="-1" fill="#0A0D0A">${l}</text>`).join('')}
<text x="80" y="572" font-family="Instrument Sans, Helvetica, Arial, sans-serif" font-size="24" fill="#5B5A53" letter-spacing="1">${sub}</text>
</svg>`;
await mkdir('public/og', { recursive: true });
await sharp(Buffer.from(og(['El verdadero lujo', 'no se mide en metros cuadrados.'], 'JJF Creando · Tulum · Riviera Maya'))).png().toFile('public/og/default-es.png');
await sharp(Buffer.from(og(['True luxury', 'is not measured in square metres.'], 'JJF Creando · Tulum · Riviera Maya'))).png().toFile('public/og/default-en.png');

// preview of the door composition for review
const prev = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600" viewBox="0 0 900 600"><rect width="900" height="600" fill="#0A0D0A"/><svg x="330" y="200" width="240" height="200" viewBox="${vb}" preserveAspectRatio="xMidYMid meet"><g fill="#F2EEE5" fill-rule="evenodd">${paths(mark)}${paths(word)}</g></svg><svg x="40" y="40" width="240" height="200" viewBox="${vb}" preserveAspectRatio="xMidYMid meet"><g fill="none" stroke="#F2EEE5" stroke-width="4">${paths(mark)}</g></svg></svg>`;
const previewPath = process.env.PREVIEW_PNG ?? 'mark-preview.png';
await sharp(Buffer.from(prev)).png().toFile(previewPath);
console.log('preview', previewPath);
