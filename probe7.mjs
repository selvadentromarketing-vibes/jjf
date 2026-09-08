import { chromium } from '@playwright/test';
const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
const msgs = [];
p.on('console', m => msgs.push(m.type()+': '+m.text()));
p.on('pageerror', e => console.log('[pageerror]', e.message));
await p.addInitScript(() => {
  const w = window; w.__gl = 0; w.__lost = 0;
  const gc = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (t, ...r) { const c = gc.call(this, t, ...r); if (c && /webgl/.test(t)) { w.__gl++; this.addEventListener('webglcontextlost', () => w.__lost++); } return c; };
});
// pages WITHOUT any [data-light] host, so light.ts creates nothing
const plain = ['/es/vision/','/es/trayectoria/','/es/como-se-compra/','/es/aviso-de-privacidad/'];
await p.goto('http://127.0.0.1:4321' + plain[0], { waitUntil: 'load' });
await p.waitForTimeout(1200);
console.log('start: contexts=', await p.evaluate(()=>window.__gl), 'data-light hosts here=', await p.evaluate(()=>document.querySelectorAll('[data-light]').length));
for (let i = 1; i <= 20; i++) {
  const href = plain[i % plain.length];
  await p.evaluate(h => { const a=document.createElement('a'); a.href=h; document.body.appendChild(a); a.click(); }, href);
  await p.waitForTimeout(900);
  if (i % 5 === 0) console.log(`after ${i} navigations: webgl contexts created=`, await p.evaluate(()=>window.__gl), ' lost events=', await p.evaluate(()=>window.__lost));
}
console.log('--- console messages mentioning WebGL/context ---');
console.log(msgs.filter(m => /webgl|context/i.test(m)).slice(0,8).join('\n') || '(none)');
await b.close();
