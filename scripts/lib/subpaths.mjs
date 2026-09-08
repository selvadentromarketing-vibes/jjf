// Splits a potrace path 'd' into its subpaths, each with a bounding box. Shared by trace-mark and trace-plan.
export function parse(d) {
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
