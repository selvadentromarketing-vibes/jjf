import { chromium } from '@playwright/test';
const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
p.on('pageerror', e => console.log('[pageerror]', e.message));
p.on('console', m => { const t=m.text(); if (/WebGL|context/i.test(t)) console.log('[console]', m.type(), t); });

await p.addInitScript(() => {
  const w = window;
  w.__draws = 0; w.__ios = []; w.__glCanvases = [];
  const d = WebGLRenderingContext.prototype.drawArrays;
  WebGLRenderingContext.prototype.drawArrays = function (...a) { w.__draws++; return d.apply(this, a); };
  const gc = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (t, ...r) { const c = gc.call(this, t, ...r); if (c && /webgl/.test(t)) w.__glCanvases.push(this); return c; };
  const RIO = w.IntersectionObserver;
  w.IntersectionObserver = class extends RIO { constructor(...a){ super(...a); w.__ios.push(this); this.__disc=false; } disconnect(){ this.__disc=true; return super.disconnect(); } };
});

await p.goto('http://127.0.0.1:4321/es/proyectos/selvadentro/', { waitUntil: 'load' });
await p.waitForTimeout(3500);
console.log('is-lit canvas present:', await p.evaluate(() => !!document.querySelector('.light-field.is-lit')));
const d0 = await p.evaluate(() => window.__draws);
await p.waitForTimeout(1000);
const d1 = await p.evaluate(() => window.__draws);
console.log('draws/sec while on the project page:', d1 - d0);

await p.evaluate(() => { const a=document.createElement('a'); a.href='/es/trayectoria/'; document.body.appendChild(a); a.click(); });
await p.waitForTimeout(2500);
console.log('url now:', await p.evaluate(()=>location.pathname), '| .light-field in DOM:', await p.evaluate(()=>document.querySelectorAll('.light-field').length));
const d2 = await p.evaluate(() => window.__draws);
await p.waitForTimeout(2000);
const d3 = await p.evaluate(() => window.__draws);
console.log('draws over 2s AFTER navigating away from the light page:', d3 - d2);
console.log('IO instances / undisconnected:', await p.evaluate(() => [window.__ios.length, window.__ios.filter(o=>!o.__disc).length]));
console.log('WebGL contexts created, still not lost:', await p.evaluate(() => window.__glCanvases.length));

// keep navigating to force Chrome past its live-context cap
for (const r of ['/es/proyectos/selvazama/','/es/proyectos/amelia-tulum/','/es/proyectos/aldea-zama/','/es/proyectos/hacienda-sacala/','/es/proyectos/yucatan-country-club/','/es/proyectos/selvadentro/','/es/proyectos/selvazama/','/es/proyectos/amelia-tulum/']) {
  await p.evaluate((h) => { const a=document.createElement('a'); a.href=h; document.body.appendChild(a); a.click(); }, r);
  await p.waitForTimeout(2200);
}
console.log('after 8 more navigations -> WebGL contexts created:', await p.evaluate(()=>window.__glCanvases.length),
  '| IO undisconnected:', await p.evaluate(()=>window.__ios.filter(o=>!o.__disc).length),
  '| lit canvas on the current page:', await p.evaluate(()=>!!document.querySelector('.light-field.is-lit')));
await b.close();
