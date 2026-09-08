// Geometry for El Plano's tracer: connected components, convex hulls, minimum-area rectangles.
// A plan reads as a plan because its built forms are straight. These turn the blobs a threshold
// finds in a photograph into the quadrilaterals a drawing would use for them — an abstraction of
// what is there, never an addition to it.

/** Labels the set pixels of a binary mask into blobs. Returns {pixels, area, minx, ...} per blob. */
export function components(mask, w, h, minArea = 0) {
  const seen = new Uint8Array(w * h);
  const out = [];
  const stack = new Int32Array(w * h);
  for (let start = 0; start < w * h; start++) {
    if (!mask[start] || seen[start]) continue;
    let top = 0, area = 0;
    stack[top++] = start; seen[start] = 1;
    const pts = [];
    let minx = w, miny = h, maxx = 0, maxy = 0;
    while (top) {
      const i = stack[--top];
      const x = i % w, y = (i / w) | 0;
      area++;
      if (x < minx) minx = x; if (x > maxx) maxx = x;
      if (y < miny) miny = y; if (y > maxy) maxy = y;
      // only edge pixels are needed for a hull, and keeping them all is what made this slow
      if (!mask[i - 1] || !mask[i + 1] || !mask[i - w] || !mask[i + w] || x === 0 || y === 0 || x === w - 1 || y === h - 1) pts.push([x, y]);
      if (x > 0 && mask[i - 1] && !seen[i - 1]) { seen[i - 1] = 1; stack[top++] = i - 1; }
      if (x < w - 1 && mask[i + 1] && !seen[i + 1]) { seen[i + 1] = 1; stack[top++] = i + 1; }
      if (y > 0 && mask[i - w] && !seen[i - w]) { seen[i - w] = 1; stack[top++] = i - w; }
      if (y < h - 1 && mask[i + w] && !seen[i + w]) { seen[i + w] = 1; stack[top++] = i + w; }
    }
    if (area >= minArea) out.push({ pts, area, minx, miny, maxx, maxy });
  }
  return out.sort((a, b) => b.area - a.area);
}

/** Andrew's monotone chain. */
export function hull(points) {
  const p = points.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (p.length < 3) return p;
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [];
  for (const q of p) { while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop(); lower.push(q); }
  const upper = [];
  for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], q) <= 0) upper.pop(); upper.push(q); }
  lower.pop(); upper.pop();
  return lower.concat(upper);
}

/** Rotating calipers: the smallest rectangle containing a hull, as four corners. */
export function minAreaRect(h) {
  if (h.length < 3) return null;
  let best = null;
  for (let i = 0; i < h.length; i++) {
    const [x1, y1] = h[i], [x2, y2] = h[(i + 1) % h.length];
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len;      // edge direction
    let minu = Infinity, maxu = -Infinity, minv = Infinity, maxv = -Infinity;
    for (const [x, y] of h) {
      const u = x * ux + y * uy, v = -x * uy + y * ux;
      if (u < minu) minu = u; if (u > maxu) maxu = u;
      if (v < minv) minv = v; if (v > maxv) maxv = v;
    }
    const area = (maxu - minu) * (maxv - minv);
    if (!best || area < best.area) best = { area, ux, uy, minu, maxu, minv, maxv };
  }
  const { ux, uy, minu, maxu, minv, maxv } = best;
  const at = (u, v) => [u * ux - v * uy, u * uy + v * ux];
  return { corners: [at(minu, minv), at(maxu, minv), at(maxu, maxv), at(minu, maxv)], area: best.area };
}

/** Ramer–Douglas–Peucker. */
export function simplify(pts, eps) {
  if (pts.length < 3) return pts;
  const d2 = (p, a, b) => {
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const l = dx * dx + dy * dy;
    if (!l) return (p[0] - a[0]) ** 2 + (p[1] - a[1]) ** 2;
    let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l;
    t = Math.max(0, Math.min(1, t));
    return (p[0] - a[0] - t * dx) ** 2 + (p[1] - a[1] - t * dy) ** 2;
  };
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  const e2 = eps * eps;
  while (stack.length) {
    const [a, b] = stack.pop();
    let far = -1, fd = 0;
    for (let i = a + 1; i < b; i++) { const d = d2(pts[i], pts[a], pts[b]); if (d > fd) { fd = d; far = i; } }
    if (fd > e2 && far > 0) { keep[far] = 1; stack.push([a, far], [far, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}

/** A closed path through points, smoothed with Catmull-Rom→bezier. Used for the landscape marks. */
export function smoothClosed(pts, r = 1) {
  if (pts.length < 3) return '';
  const n = pts.length;
  const f = (v) => Math.round(v * 10) / 10;
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6 * r, p1[1] + (p2[1] - p0[1]) / 6 * r];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6 * r, p2[1] - (p3[1] - p1[1]) / 6 * r];
    d += `C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d + 'Z';
}

export const polygon = (pts) => pts.length ? `M${pts.map(([x, y]) => `${Math.round(x * 10) / 10} ${Math.round(y * 10) / 10}`).join('L')}Z` : '';
