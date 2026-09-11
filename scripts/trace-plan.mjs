// El Plano (plan §S2): derives a project's opening drawing from its own aerial photograph.
//
// The plan calls for the architects' DWG/DXF wherever it exists. Where it does not, it allows a
// line drawing derived from the highest aerial — under one hard condition: it must never invent
// geometry, because a developer's site that draws a building nobody built is a fidelity failure.
//
// So this traces; it does not generate. Every stroke is a reading of the plate's own pixels, and
// the drawing can only say what the photograph says. Three layers come out of three readings:
//
//   #boundary   the site outline — the hull of everything built, the shape of the intervention
//   #built      the hard surfaces — bright and un-green: roofs, decks, terraces. Drawn as the
//               smallest rectangle around each one, because that is how a plan states a building
//   #landscape  the land — the tonal masses of canopy, clearing and shore as smooth contours,
//               and any water in the frame as its own closed line
//
// No dimensions, no labels, no north arrow, no scale: a plan that does not measure (plan §8).
//
// Where a real drawing exists — the studio's or the sales masterplan — it is traced instead, and
// the tracer picks the right reading automatically: a sheet that is mostly white is a drawing and
// its own ink is followed; anything else is a photograph and is read as above.
//
// Usage: node scripts/trace-plan.mjs <slug> <image>    ·    npm run trace:plans for all six
import sharp from 'sharp';
import potrace from 'potrace';
import { optimize } from 'svgo';
import { promisify } from 'node:util';
import { mkdir, writeFile } from 'node:fs/promises';
import { components, hull, minAreaRect, simplify, smoothClosed, polygon } from './lib/shapes.mjs';
import { parse } from './lib/subpaths.mjs';

const trace = promisify(potrace.trace);
const W = 1200;                 // working width; the drawing is resolution-independent once traced
const OUT_DIR = 'src/assets/plans';

// Well under the 60 shapes the validator allows. Past this a drawing stops reading as a drawing.
const KEEP = { built: 18, landscape: 8, water: 3 };

/** The value at a percentile of a channel — thresholds that adapt to each photograph. */
function percentile(arr, p) {
  const hist = new Uint32Array(256);
  for (let i = 0; i < arr.length; i++) hist[arr[i]]++;
  let acc = 0;
  const want = arr.length * p;
  for (let v = 0; v < 256; v++) { acc += hist[v]; if (acc >= want) return v; }
  return 255;
}

// sharp promotes a one-channel raw buffer to sRGB while it works, so the result comes back
// interleaved unless it is asked for greyscale explicitly. Reading it with a stride would be
// silent and wrong: the mask would be offset from the pixels it describes.
async function blur(ch, w, h, sigma) {
  const { data, info } = await sharp(Buffer.from(ch), { raw: { width: w, height: h, channels: 1 } })
    .blur(sigma).toColourspace('b-w').raw().toBuffer({ resolveWithObject: true });
  if (info.channels !== 1) throw new Error(`expected 1 channel from blur, got ${info.channels}`);
  return new Uint8Array(data);
}

const cut = (ch, t) => { const m = new Uint8Array(ch.length); for (let i = 0; i < ch.length; i++) m[i] = ch[i] >= t ? 1 : 0; return m; };
const cutBelow = (ch, t) => { const m = new Uint8Array(ch.length); for (let i = 0; i < ch.length; i++) m[i] = ch[i] <= t ? 1 : 0; return m; };

/** Traced outlines of a binary mask, as point rings sorted by size — the mask's real shape. */
async function outlines(mask, w, h, minArea, minSpan = 0.02) {
  const png = await sharp(Buffer.from(mask.map((v) => (v ? 255 : 0))), { raw: { width: w, height: h, channels: 1 } }).png().toBuffer();
  const svg = await trace(png, { threshold: 128, turdSize: minArea, optTolerance: 1.4, alphaMax: 0, color: 'black', background: 'transparent' });
  const d = / d="([^"]+)"/.exec(svg)?.[1];
  if (!d) return [];
  return parse(d)
    .map((p) => ({ pts: points(p.d), area: (p.maxx - p.minx) * (p.maxy - p.miny), w: p.maxx - p.minx, h: p.maxy - p.miny, cx: (p.minx + p.maxx) / 2, cy: (p.miny + p.maxy) / 2 }))
    // A contour that reaches every edge is the frame, not a feature: it draws a vignette around
    // the plate and says nothing about the land.
    // ...and a sliver along one edge is the crop, not a shoreline. Water is exempt from most of
    // this by its own, much smaller, minSpan: a pool is genuinely a few pixels across up here.
    .filter((p) => p.pts.length > 4 && !(p.w > w * 0.9 && p.h > h * 0.9) && p.w > w * minSpan && p.h > h * minSpan)
    .sort((a, b) => b.area - a.area);
}

/** The anchor points of a path — enough for simplification and re-smoothing. */
function points(d) {
  const out = [];
  const re = /[ML]\s*(-?[\d.]+)[ ,]+(-?[\d.]+)|C[^ML]*?(-?[\d.]+)[ ,]+(-?[\d.]+)\s*(?=[MLCZz]|$)/g;
  let m;
  while ((m = re.exec(d))) out.push(m[1] !== undefined ? [+m[1], +m[2]] : [+m[3], +m[4]]);
  return out;
}

/**
 * The row where the sky stops — found by asking each row how much of it is vegetation.
 * Colour tests for "sky" fail on a sunset and on water; the ground in every one of these frames
 * is green and the sky never is, so the first row that is meaningfully green is the horizon.
 * Returns 0 when the frame has no sky in it, which is what a plan-like aerial should look like.
 */
function horizon(data, w, h, c) {
  const step = Math.max(1, Math.round(w / 300));
  const limit = Math.floor(h * 0.6);
  for (let y = 0; y < limit; y++) {
    let green = 0, seen = 0;
    for (let x = 0; x < w; x += step) {
      const i = (y * w + x) * c;
      if (data[i + 1] - (data[i] + data[i + 2]) / 2 > 9) green++;
      seen++;
    }
    if (green / seen > 0.22) return y > h * 0.03 ? Math.min(y + Math.round(h * 0.012), limit) : 0;
  }
  return 0;
}

export async function tracePlan(slug, src) {
  // A drawing is mostly paper. Flattening onto white first matters: these arrive with alpha, and
  // dropping the alpha channel instead would turn every transparent pixel black and make the
  // whitest sheet in the folder look like the darkest photograph in it.
  const { data, info } = await sharp(src).flatten({ background: '#ffffff' }).resize({ width: W, kernel: 'lanczos3' }).raw().toBuffer({ resolveWithObject: true });
  const paper = whiteFraction(data, info);
  if (paper > 0.7) return traceDrawing(slug, data, info, paper);
  return tracePhotograph(slug, data, info);
}

function whiteFraction(data, info) {
  const n = info.width * info.height;
  const c = info.channels;
  let white = 0;
  for (let i = 0; i < n; i += 7) if (data[i * c] > 242 && data[i * c + 1] > 242 && data[i * c + 2] > 242) white++;
  return white / Math.ceil(n / 7);
}

/**
 * A sheet of paper with ink on it: follow the ink. The groups are what a lotting plan actually
 * has rather than what a photograph has — the property edge, the parcels drawn as solid, and the
 * roads and lot lines that make up the rest of the fabric.
 *
 * Everything small goes: a plan carries a logo, a legend and a wordmark, and a drawing that keeps
 * them is a drawing that measures. Glyphs are the smallest marks on any of these sheets, so one
 * size floor removes all of it without a hand-drawn mask.
 */
async function traceDrawing(slug, data, info, paper) {
  const { width: w, height: h, channels: c } = info;
  const n = w * h;
  const ink = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const l = 0.2126 * data[i * c] + 0.7152 * data[i * c + 1] + 0.0722 * data[i * c + 2];
    ink[i] = l < 236 ? 1 : 0;
  }
  // Blurring then cutting high leaves only marks thicker than a line: the filled parcels.
  const solid = cut(await blur(ink.map((v) => (v ? 255 : 0)), w, h, Math.max(2, w * 0.004)), 210);
  const MIN_SPAN = 0.025;

  const fills = (await outlines(solid, w, h, Math.round(n * 3e-4), MIN_SPAN)).slice(0, 14);
  const all = await outlines(ink, w, h, Math.round(n * 1e-5), MIN_SPAN);
  const [edge, ...rest] = all;
  const boundary = edge ? [{ d: smoothClosed(simplify(edge.pts, w * 0.002), 0.4) }] : [];
  // A parcel already drawn as solid should not be drawn a second time as an outline.
  const near = (a, b) => Math.abs(a - b) < w * 0.02;
  const drawn = rest
    .filter((p) => !fills.some((f) => near(f.cx, p.cx) && near(f.cy, p.cy)))
    .slice(0, 60 - fills.length - boundary.length - 4)
    .map((p) => ({ d: smoothClosed(simplify(p.pts, w * 0.0025), 0.4) }));
  const built = fills.map((f) => ({ d: smoothClosed(simplify(f.pts, w * 0.003), 0.5) }));

  return write(slug, w, h, 0, boundary, built, drawn, { kind: 'drawing', paper });
}

async function tracePhotograph(slug, data, info) {
  const { width: w, height: h, channels: c } = info;
  const n = w * h;

  // A plan is of the ground. Most of these plates are shot from a drone with the horizon in them,
  // and a contour drawn along a cloud edge is not a landscape mark, it is nonsense with a nice
  // line. So find where the sky ends and draw only below it.
  const sky = horizon(data, w, h, c);

  const lum = new Uint8Array(n);
  const hard = new Uint8Array(n);   // un-green: roofs, decks, roads, sand — what was built
  const wet = new Uint8Array(n);    // blue over red, and not dark: pools, cenotes, sea
  for (let i = 0; i < n; i++) {
    const r = data[i * c], g = data[i * c + 1], b = data[i * c + 2];
    const l = (0.2126 * r + 0.7152 * g + 0.0722 * b) | 0;
    lum[i] = l;
    const green = g - (r + b) / 2;
    // Un-greenness, not brightness: a dark thatched roof is as built as a white one, and
    // reading brightness alone lost every building that sits in its own shadow.
    const un = Math.max(0, 255 - 7 * Math.max(green, 0));
    hard[i] = (l < 45 ? un * 0.3 : un) | 0;      // the deepest shadow is canopy, not architecture
    wet[i] = Math.max(0, Math.min(255, 128 + (b - r) * 1.6 + (g - r) * 0.6 - Math.max(0, 70 - l))) | 0;
    if ((i / w | 0) < sky) { hard[i] = 0; wet[i] = 0; lum[i] = 0; }
  }
  const groundTop = sky;
  const ground = h - sky;

  const s = Math.max(1.5, w * 0.0035);
  const px = (a) => Math.round(n * a);

  // ---- built: rectangles around the hard surfaces ----------------------------------------
  const hardBlur = await blur(hard, w, h, s);
  const builtBlobs = components(cut(hardBlur, percentile(hardBlur, 0.9)), w, h, px(4e-4)).slice(0, KEEP.built * 2);
  const built = [];
  for (const b of builtBlobs) {
    const rect = minAreaRect(hull(b.pts));
    if (!rect) continue;
    // a rectangle far larger than the blob it came from is a smear, not a building
    if (b.area / rect.area < 0.45) continue;
    built.push({ d: polygon(rect.corners), area: rect.area });
    if (built.length >= KEEP.built) break;
  }

  // ---- boundary: the hull of everything built — the shape of the intervention -------------
  const allBuilt = builtBlobs.slice(0, KEEP.built).flatMap((b) => b.pts);
  const boundary = [];
  if (allBuilt.length > 8) {
    const ring = hull(allBuilt);
    const bw = Math.max(...ring.map((p) => p[0])) - Math.min(...ring.map((p) => p[0]));
    const bh = Math.max(...ring.map((p) => p[1])) - Math.min(...ring.map((p) => p[1]));
    // Where the built reaches every edge, the site simply is the frame and an outline around it
    // is a rectangle pretending to be information. Those projects open without one.
    if (bw < w * 0.94 || bh < ground * 0.9) boundary.push({ d: polygon(simplify(ring.concat([ring[0]]), w * 0.004).slice(0, -1)) });
  }

  // ---- landscape: the tonal masses, and the water ----------------------------------------
  // The land's own shape, not its convex hull: a shoreline that bends back on itself is the
  // whole point of a landscape mark, and a hull straightens exactly that away. potrace follows
  // the contour; the simplification afterwards is what keeps it a drawing rather than a map.
  const lumBlur = await blur(lum, w, h, s * 7);
  const marks = [];
  for (const [t, dark] of [[percentile(lumBlur, 0.3), true], [percentile(lumBlur, 0.62), false]]) {
    for (const c of await outlines(dark ? cutBelow(lumBlur, t) : cut(lumBlur, t), w, h, px(5e-3))) {
      if (c.pts.length < 6) continue;
      const ring = simplify(c.pts, w * 0.006);
      if (ring.length >= 5) marks.push({ d: smoothClosed(ring, 0.85), area: c.area });
    }
  }
  const wetBlur = await blur(wet, w, h, s * 2);
  const water = (await outlines(cut(wetBlur, Math.max(150, percentile(wetBlur, 0.97))), w, h, px(6e-4), 0.006))
    .slice(0, KEEP.water)
    .map((c) => ({ d: smoothClosed(simplify(c.pts, w * 0.0035), 0.85), area: c.area }));
  const landscape = [...marks.sort((a, b) => b.area - a.area).slice(0, KEEP.landscape), ...water];

  return write(slug, w, h, groundTop, boundary, built, landscape, { kind: 'photograph', water: water.length });
}

/** The box the ink actually occupies. Every path here is absolute, so every number pair is a
 *  point; control points count too, which only ever errs outwards. */
function inkBox(groups) {
  let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;
  for (const arr of groups) for (const { d } of arr) {
    const nums = d.match(/-?\d+(?:\.\d+)?/g) || [];
    for (let i = 0; i + 1 < nums.length; i += 2) {
      const x = +nums[i], y = +nums[i + 1];
      if (x < minx) minx = x; if (x > maxx) maxx = x;
      if (y < miny) miny = y; if (y > maxy) maxy = y;
    }
  }
  return Number.isFinite(minx) ? { minx, miny, maxx, maxy } : null;
}

async function write(slug, w, h, top, boundary, built, landscape, meta) {
  // Trim the paper. A plan sheet carries wide margins and a photograph's drawing rarely reaches
  // its edges; keeping them would letterbox every drawing into a stamp inside the hero frame.
  const box = inkBox([boundary, built, landscape]);
  let vx = 0, vy = top, vw = w, vh = h - top;
  if (box) {
    const pad = Math.max(box.maxx - box.minx, box.maxy - box.miny) * 0.02;
    vx = box.minx - pad; vy = box.miny - pad;
    vw = box.maxx - box.minx + pad * 2; vh = box.maxy - box.miny + pad * 2;
  }
  const r = (v) => Math.round(v * 10) / 10;
  const g = (id, arr) => `<g id="${id}">${arr.map((p) => `<path d="${p.d}"/>`).join('')}</g>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${r(vx)} ${r(vy)} ${r(vw)} ${r(vh)}" preserveAspectRatio="xMidYMid meet" fill="none" aria-hidden="true" focusable="false">`
    + g('boundary', boundary) + g('built', built) + g('landscape', landscape) + '</svg>';
  const { data: out } = optimize(svg, {
    multipass: true, floatPrecision: 1,
    plugins: [{ name: 'preset-default', params: { overrides: { cleanupIds: false, mergePaths: false, collapseGroups: false, removeUselessStrokeAndFill: false, removeEmptyContainers: false } } }],
  });
  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(`${OUT_DIR}/${slug}.svg`, out);
  return { slug, ...meta, boundary: boundary.length, built: built.length, landscape: landscape.length, bytes: out.length };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [slug, src] = process.argv.slice(2);
  if (!slug || !src) { console.error('usage: node scripts/trace-plan.mjs <slug> <image>'); process.exit(1); }
  const r = await tracePlan(slug, src);
  console.log(`${r.slug} [${r.kind}]: boundary ${r.boundary}, built ${r.built}, landscape ${r.landscape} — ${(r.bytes / 1024).toFixed(1)} KB`);
}
