import { chromium } from '@playwright/test';
const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
p.on('pageerror', e => console.log('[pageerror]', e.message));

await p.addInitScript(() => {
  const w = window;
  w.__stats = { io: 0, ioDisconnect: 0, resize: 0, resizeRemoved: 0, gl: 0, glLost: 0, raf: 0 };
  const RealIO = w.IntersectionObserver;
  w.IntersectionObserver = class extends RealIO {
    constructor(...a) { super(...a); w.__stats.io++; }
    disconnect() { w.__stats.ioDisconnect++; return super.disconnect(); }
  };
  const addL = w.addEventListener.bind(w);
  const remL = w.removeEventListener.bind(w);
  w.addEventListener = function (t, ...r) { if (t === 'resize') w.__stats.resize++; return addL(t, ...r); };
  w.removeEventListener = function (t, ...r) { if (t === 'resize') w.__stats.resizeRemoved++; return remL(t, ...r); };
  const gc = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, ...r) {
    const ctx = gc.call(this, type, ...r);
    if (ctx && /webgl/.test(type)) { w.__stats.gl++; w.__glCanvases = w.__glCanvases || []; w.__glCanvases.push(new WeakRef(this)); }
    return ctx;
  };
});

const stat = async (label) => console.log(label, JSON.stringify(await p.evaluate(() => ({
  ...window.__stats,
  liveCanvases: document.querySelectorAll('canvas.light-field').length,
  detachedGl: (window.__glCanvases || []).filter(r => { const c = r.deref(); return c && !c.isConnected; }).length,
}))));

await p.goto('http://127.0.0.1:4321/es/proyectos/selvadentro/', { waitUntil: 'load' });
await p.waitForTimeout(3000);
await stat('after initial project page:');

const routes = ['/es/proyectos/selvazama/', '/es/proyectos/amelia-tulum/', '/es/proyectos/aldea-zama/', '/es/proyectos/hacienda-sacala/'];
for (const r of routes) {
  await p.evaluate((href) => { const a = document.createElement('a'); a.href = href; document.body.appendChild(a); a.click(); }, r);
  await p.waitForTimeout(2600);
  await stat('after nav -> ' + r);
}
// force a gc-ish pause
await p.waitForTimeout(1500);
await stat('final:');
console.log('WebGL context count on page (live objects):', await p.evaluate(() => (window.__glCanvases||[]).filter(x=>x.deref()).length));
await b.close();
