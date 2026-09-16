// El Plano, from a sales master plan (plan §S2).
//
// The earlier tracer read photographs: it outlined tonal masses and drew the smallest rectangle
// around each bright patch, and on a master plan that gave blobs — the scribbles that got the
// traced plans retired. A master plan is not a photograph. Its information is the road network,
// drawn as white bands on green, and the water, drawn blue. This reads exactly those two things
// and nothing else:
//
//   roads  → a mask of bright, unsaturated pixels, cleaned of the lot symbols by component size,
//            thinned to a one-pixel skeleton (Zhang–Suen), walked into polylines, simplified
//   water  → a mask of saturated blue, one ellipse per body
//
// Every line is the centreline of a band that is in the sheet. Nothing is invented, nothing is
// outlined twice, and no lot, number or label survives (plan §8: a plan that does not measure).
//
// Usage: node scripts/trace-roads.mjs [slug=selvadentro] [image=src/assets/masterplans/<slug>.webp]
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';

const slug = process.argv[2] || 'selvadentro';
const image = process.argv[3] || `src/assets/masterplans/${slug}.webp`;
const OUT_DIR = 'src/assets/plans';
const W = 2400;

// The drawn sheet sits inside a decorative border of canopy and sector names: crop to the sheet.
// Measured on the Selvadentro plate; a different plate names its own crop here.
const CROPS = { selvadentro: { x: 0.025, y: 0.19, w: 0.95, h: 0.60 } };
const crop = CROPS[slug] ?? { x: 0, y: 0, w: 1, h: 1 };

const ROAD_SCORE = 96;       // floor on the whiteness score (max channel minus 1.3 × saturation)
const LOCAL_R = 14;          // px: neighbourhood the score is read against
const LOCAL_DIFF = Number(process.env.TRACE_LOCAL_DIFF || 30); // how far above its neighbourhood a road pixel stands
const DILATE = 2;            // px: at this resolution a road is a dotted band, and the dots sit up to 4px apart
const MIN_COMPONENT = 5000;  // px² at W after closing: a lot symbol is ~600, a numbered disc ~1600, a road loop tens of thousands
const MIN_POLYLINE = 0.018;  // of the width: shorter skeleton pieces are spurs, not roads
const SIMPLIFY = 1.6;        // px, Douglas–Peucker tolerance
const MIN_WATER = 120;       // px²: a pool is small at this scale, a speck is smaller

const meta = await sharp(image).metadata();
const region = { left: Math.round(meta.width * crop.x), top: Math.round(meta.height * crop.y), width: Math.round(meta.width * crop.w), height: Math.round(meta.height * crop.h) };
const { data, info } = await sharp(image).extract(region).resize(W, null, { kernel: 'lanczos3' }).raw().toBuffer({ resolveWithObject: true });
const w = info.width, h = info.height, ch = info.channels;

// ---- masks ----
const road = new Uint8Array(w * h);
const water = new Uint8Array(w * h);
// Whiteness: bright and unsaturated at once. A road on this sheet is a pale band with the canopy
// bleeding through, so neither brightness nor saturation alone separates it. And the sheet is not
// evenly lit — the east half is paler — so the score is read against its own neighbourhood: a
// road is what stands out from the ground around it, wherever it is.
const score = new Float32Array(w * h);
for (let p = 0, i = 0; p < w * h; p++, i += ch) {
  const r = data[i], g = data[i + 1], b = data[i + 2];
  const M = Math.max(r, g, b), m = Math.min(r, g, b);
  score[p] = M - 1.3 * (M - m);
  // Cenote water on the sheet is teal: green and blue together well above red.
  if ((g + b) / 2 > r + 45 && b > 105 && g > 105) water[p] = 1;
}
{
  // Local mean by integral image, radius LOCAL_R.
  const I = new Float64Array((w + 1) * (h + 1));
  for (let y = 1; y <= h; y++) { let row = 0; for (let x = 1; x <= w; x++) { row += score[(y - 1) * w + (x - 1)]; I[y * (w + 1) + x] = I[(y - 1) * (w + 1) + x] + row; } }
  const R = LOCAL_R;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const x0 = Math.max(0, x - R), x1 = Math.min(w, x + R + 1), y0 = Math.max(0, y - R), y1 = Math.min(h, y + R + 1);
    const sum = I[y1 * (w + 1) + x1] - I[y0 * (w + 1) + x1] - I[y1 * (w + 1) + x0] + I[y0 * (w + 1) + x0];
    const mean = sum / ((x1 - x0) * (y1 - y0));
    const p = y * w + x;
    if (score[p] - mean >= LOCAL_DIFF && score[p] >= ROAD_SCORE) road[p] = 1;
  }
}
// The band of a road is read as a dotted line at this resolution — lot symbols, the dashed trails
// and the sheet's own texture break it every few pixels. A small dilation closes those gaps
// before anything is measured; the thinning afterwards does not care how wide the band was.
for (let round = 0; round < DILATE; round++) {
  const src = road.slice();
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (src[y * w + x]) continue;
    let hit = 0;
    for (let dy = -1; dy <= 1 && !hit; dy++) for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && ny >= 0 && nx < w && ny < h && src[ny * w + nx]) { hit = 1; break; }
    }
    if (hit) road[y * w + x] = 1;
  }
}

// ---- connected components (8-neighbour), by size ----
function components(mask) {
  const label = new Int32Array(w * h).fill(-1);
  const comps = [];
  const stack = [];
  for (let s = 0; s < w * h; s++) {
    if (!mask[s] || label[s] >= 0) continue;
    const id = comps.length;
    const c = { id, size: 0, minx: w, miny: h, maxx: 0, maxy: 0, sx: 0, sy: 0 };
    stack.push(s); label[s] = id;
    while (stack.length) {
      const p = stack.pop();
      const x = p % w, y = (p - x) / w;
      c.size++; c.sx += x; c.sy += y;
      if (x < c.minx) c.minx = x; if (x > c.maxx) c.maxx = x; if (y < c.miny) c.miny = y; if (y > c.maxy) c.maxy = y;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const q = ny * w + nx;
        if (mask[q] && label[q] < 0) { label[q] = id; stack.push(q); }
      }
    }
    comps.push(c);
  }
  return { label, comps };
}

const { label: roadLabel, comps: roadComps } = components(road);
const keepRoad = new Uint8Array(roadComps.length);
for (const c of roadComps) {
  // Big enough, and not a compact blob (a pool deck, a clubhouse roof): a road component is long
  // relative to its area.
  const span = Math.max(c.maxx - c.minx, c.maxy - c.miny);
  if (c.size >= MIN_COMPONENT && span > w * 0.08) keepRoad[c.id] = 1;
}
const skel = new Uint8Array(w * h);
for (let p = 0; p < w * h; p++) if (road[p] && keepRoad[roadLabel[p]]) skel[p] = 1;
const dbg = (...a) => { if (process.env.TRACE_DEBUG) console.error('[trace]', ...a); };
if (process.env.TRACE_DEBUG) {
  const sum = roadComps.reduce((a, c) => a + c.size, 0);
  console.error('[trace] largest', roadComps.slice().sort((a, b) => b.size - a.size).slice(0, 12).map((c) => `${c.size}@${c.minx}-${c.maxx}x${c.miny}-${c.maxy}${keepRoad[c.id] ? '*' : ''}`).join(' '));
  console.error('[trace] component px sum', sum, 'vs road px', road.reduce((a, b) => a + b, 0), 'labelled', roadLabel.reduce((a, v) => a + (v >= 0 ? 1 : 0), 0));
  const dir = process.env.TRACE_DEBUG_DIR || '.';
  await sharp(Buffer.from(road.map((v) => (v ? 255 : 0))), { raw: { width: w, height: h, channels: 1 } }).png().toFile(`${dir}/dbg-road.png`);
  await sharp(Buffer.from(skel.map((v) => (v ? 255 : 0))), { raw: { width: w, height: h, channels: 1 } }).png().toFile(`${dir}/dbg-kept.png`);
}
dbg('size', w, h, 'road px', road.reduce((a, b) => a + b, 0), 'components', roadComps.length, 'kept', keepRoad.reduce((a, b) => a + b, 0), 'top sizes', roadComps.map((c) => c.size).sort((a, b) => b - a).slice(0, 8).join(','), 'skel px before thin', skel.reduce((a, b) => a + b, 0));

// ---- Zhang–Suen thinning ----
function thin(img) {
  const at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : img[y * w + x]);
  let changed = true;
  const toClear = [];
  while (changed) {
    changed = false;
    for (let pass = 0; pass < 2; pass++) {
      toClear.length = 0;
      for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
        if (!img[y * w + x]) continue;
        const p2 = at(x, y - 1), p3 = at(x + 1, y - 1), p4 = at(x + 1, y), p5 = at(x + 1, y + 1), p6 = at(x, y + 1), p7 = at(x - 1, y + 1), p8 = at(x - 1, y), p9 = at(x - 1, y - 1);
        const B = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9;
        if (B < 2 || B > 6) continue;
        const seq = [p2, p3, p4, p5, p6, p7, p8, p9, p2];
        let A = 0;
        for (let k = 0; k < 8; k++) if (seq[k] === 0 && seq[k + 1] === 1) A++;
        if (A !== 1) continue;
        if (pass === 0 ? (p2 * p4 * p6 !== 0 || p4 * p6 * p8 !== 0) : (p2 * p4 * p8 !== 0 || p2 * p6 * p8 !== 0)) continue;
        toClear.push(y * w + x);
      }
      if (toClear.length) { changed = true; for (const p of toClear) img[p] = 0; }
    }
  }
}
thin(skel);
dbg('skel px after thin', skel.reduce((a, b) => a + b, 0));

// ---- skeleton → polylines ----
const N8 = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
const on = (x, y) => x >= 0 && y >= 0 && x < w && y < h && skel[y * w + x] === 1;
// 8-connectivity, minus the diagonal steps an orthogonal step already covers: without this every
// staircase corner of a thinned line counts as a junction and the network shatters into pieces.
const nb = (x, y) => { const out = []; for (const [dx, dy] of N8) { const nx = x + dx, ny = y + dy; if (!on(nx, ny)) continue; if (dx && dy && (on(x + dx, y) || on(x, y + dy))) continue; out.push([nx, ny]); } return out; };
const degree = new Uint8Array(w * h);
for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (skel[y * w + x]) degree[y * w + x] = nb(x, y).length;
const visited = new Uint8Array(w * h);
const polylines = [];
function walk(x0, y0, x1, y1) {
  // From a node (x0,y0) along its neighbour (x1,y1) until the next node.
  const pts = [[x0, y0], [x1, y1]];
  visited[y1 * w + x1] = 1;
  let px = x0, py = y0, cx = x1, cy = y1;
  for (let guard = 0; guard < w * h; guard++) {
    if (degree[cy * w + cx] !== 2) break;
    const next = nb(cx, cy).find(([nx, ny]) => !(nx === px && ny === py));
    if (!next) break;
    [px, py] = [cx, cy]; [cx, cy] = next;
    pts.push([cx, cy]);
    if (visited[cy * w + cx]) break;
    visited[cy * w + cx] = 1;
  }
  return pts;
}
// Nodes first: endpoints and junctions.
for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
  const p = y * w + x;
  if (!skel[p] || degree[p] === 2) continue;
  visited[p] = 1;
  for (const [nx, ny] of nb(x, y)) if (!visited[ny * w + nx]) polylines.push(walk(x, y, nx, ny));
}
// Then pure loops: no node anywhere on them.
for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
  const p = y * w + x;
  if (!skel[p] || visited[p]) continue;
  visited[p] = 1;
  const [nx, ny] = nb(x, y)[0] ?? [x, y];
  const pts = walk(x, y, nx, ny);
  pts.push([x, y]);
  polylines.push(pts);
}

// ---- simplify and smooth ----
function dp(pts, eps) {
  if (pts.length < 3) return pts;
  const [ax, ay] = pts[0], [bx, by] = pts[pts.length - 1];
  let imax = 0, dmax = 0;
  const L = Math.hypot(bx - ax, by - ay) || 1e-9;
  for (let i = 1; i < pts.length - 1; i++) {
    const [x, y] = pts[i];
    const d = Math.abs((bx - ax) * (ay - y) - (ax - x) * (by - ay)) / L;
    if (d > dmax) { dmax = d; imax = i; }
  }
  if (dmax <= eps) return [pts[0], pts[pts.length - 1]];
  return [...dp(pts.slice(0, imax + 1), eps).slice(0, -1), ...dp(pts.slice(imax), eps)];
}
function chaikin(pts, closed) {
  if (pts.length < 3) return pts;
  const out = closed ? [] : [pts[0]];
  const n = closed ? pts.length : pts.length - 1;
  for (let i = 0; i < n; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % pts.length];
    out.push([x0 * 0.75 + x1 * 0.25, y0 * 0.75 + y1 * 0.25], [x0 * 0.25 + x1 * 0.75, y0 * 0.25 + y1 * 0.75]);
  }
  if (!closed) out.push(pts[pts.length - 1]);
  return out;
}
const length = (pts) => { let s = 0; for (let i = 1; i < pts.length; i++) s += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return s; };
const isClosed = (pts) => Math.hypot(pts[0][0] - pts[pts.length - 1][0], pts[0][1] - pts[pts.length - 1][1]) < 3;

dbg('polylines raw', polylines.length, 'lengths', polylines.map(length).sort((a, b) => b - a).slice(0, 10).map((n) => n.toFixed(0)).join(','));
const lines = polylines
  .filter((pts) => length(pts) >= w * MIN_POLYLINE)
  .map((pts) => { const closed = isClosed(pts); return { closed, pts: chaikin(dp(pts, SIMPLIFY), closed), len: length(pts) }; })
  .sort((a, b) => b.len - a.len);

const f = (n) => (Math.round(n * 10) / 10).toString();
const pathD = (l) => `M${l.pts.map(([x, y]) => `${f(x)} ${f(y)}`).join('L')}${l.closed ? 'Z' : ''}`;

// ---- water ----
const { comps: waterComps } = components(water);
// The numbered teal discs on the legend are the same colour as the water and must not become
// ponds: they are near-perfect circles of one size. Water is irregular.
const isDisc = (c) => { const bw = c.maxx - c.minx + 1, bh = c.maxy - c.miny + 1; return bw >= 18 && bw <= 40 && bh >= 18 && bh <= 40 && Math.abs(bw - bh) <= 4 && c.size / (bw * bh) > 0.6; };
const ponds = waterComps.filter((c) => c.size >= MIN_WATER && !isDisc(c)).map((c) => ({ cx: (c.minx + c.maxx) / 2, cy: (c.miny + c.maxy) / 2, rx: Math.max(3, (c.maxx - c.minx) / 2), ry: Math.max(3, (c.maxy - c.miny) / 2) }));

// ---- assemble ----
// The boundary is the sheet and the longest closed loop; the rest of the network splits into
// three paths by length so the reveal can lead with the main roads.
const boundaryLoop = lines.find((l) => l.closed);
const rest = lines.filter((l) => l !== boundaryLoop);
const tercile = Math.ceil(rest.length / 3) || 1;
const built = [0, 1, 2].map((k) => rest.slice(k * tercile, (k + 1) * tercile)).filter((g) => g.length);
const svg = [
  `<svg xmlns="http://www.w3.org/2000/svg" fill="none" aria-hidden="true" viewBox="0 0 ${w} ${h}">`,
  `<g id="boundary"><rect x="1" y="1" width="${w - 2}" height="${h - 2}"/>${boundaryLoop ? `<path d="${pathD(boundaryLoop)}"/>` : ''}</g>`,
  `<g id="built">${built.map((g) => `<path d="${g.map(pathD).join('')}"/>`).join('')}</g>`,
  `<g id="landscape">${ponds.map((p) => `<ellipse cx="${f(p.cx)}" cy="${f(p.cy)}" rx="${f(p.rx)}" ry="${f(p.ry)}"/>`).join('')}</g>`,
  `</svg>`,
].join('');
await mkdir(OUT_DIR, { recursive: true });
await writeFile(`${OUT_DIR}/${slug}.svg`, svg);
console.log(`${slug}: ${lines.length} road lines (${boundaryLoop ? 'with' : 'no'} closed loop), ${ponds.length} water bodies, ${(svg.length / 1024).toFixed(1)} KB → ${OUT_DIR}/${slug}.svg`);

// A check plate for the eye: the drawing over the sheet it was read from.
if (process.env.TRACE_PREVIEW) {
  const over = svg.replace('fill="none"', 'fill="none" stroke="#ff2a2a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"');
  const base = await sharp(image).extract(region).resize(w).png().toBuffer();
  await sharp(base).composite([{ input: Buffer.from(over), top: 0, left: 0 }]).png().toFile(process.env.TRACE_PREVIEW);
  console.log(`preview → ${process.env.TRACE_PREVIEW}`);
}
