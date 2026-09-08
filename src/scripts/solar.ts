// The site keeps Tulum's hour (plan §1): sun elevation → --tint, --tint-strength, --linen-warmth. Night clamps to the hour before dawn.
import { getPosition } from 'suncalc';

const LAT = 20.21, LON = -87.47;
const STOPS = ['#C99A6B', '#C4B7A0', '#CFC7B4', '#D9D3C6', '#E3DFD5']; // low warm sun → high neutral sun

function hex(c: string) { return [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16)); }
function ramp(t: number) {
  const x = Math.min(Math.max(t, 0), 1) * (STOPS.length - 1);
  const i = Math.min(Math.floor(x), STOPS.length - 2), f = x - i;
  const a = hex(STOPS[i]), b = hex(STOPS[i + 1]);
  return `rgb(${a.map((v, k) => Math.round(v + (b[k] - v) * f)).join(' ')})`;
}

export function applySolar(date = new Date()) {
  const { altitude } = getPosition(date, LAT, LON);
  const el = Math.max((altitude * 180) / Math.PI, -6); // pre-dawn floor
  const t = Math.min(Math.max((el + 6) / 66, 0), 1);
  const s = document.documentElement.style;
  s.setProperty('--tint', ramp(t));
  s.setProperty('--tint-strength', (0.2 - 0.09 * t).toFixed(3));
  s.setProperty('--linen-warmth', (0.16 * (1 - t)).toFixed(3));
  // How much the light layer leans warm: full at dawn and dusk, neutral at noon.
  s.setProperty('--light-warmth', (1 - t).toFixed(3));
}

let timer: number | undefined;
export function initSolar() {
  applySolar();
  if (timer) return;
  const toMinute = 60000 - (Date.now() % 60000);
  timer = window.setTimeout(() => { applySolar(); window.setInterval(() => applySolar(), 60000); }, toMinute);
}
