import { chromium } from '@playwright/test';
const exe = process.env.CHROMIUM_PATH;
const b = await chromium.launch(exe ? { executablePath: exe } : {});
const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
p.on('console', m => { if (m.type()==='error') console.log('[console.error]', m.text()); });
p.on('pageerror', e => console.log('[pageerror]', e.message));

await p.goto('http://127.0.0.1:4321/es/', { waitUntil: 'load' });
await p.waitForTimeout(2500);
const before = await p.evaluate(() => ({
  htmlClass: document.documentElement.className,
  htmlStyle: document.documentElement.getAttribute('style'),
  tier: document.documentElement.dataset.tier,
  panes: [...document.querySelectorAll('.door-pane')].map(e => ({ id: e.id, display: getComputedStyle(e).display, h: e.getBoundingClientRect().height })),
}));
console.log('BEFORE NAV', JSON.stringify(before, null, 1));

// client-side navigation via the nav link
await p.click('a[href="/es/vision/"]').catch(async () => { console.log('no vision link'); });
await p.waitForTimeout(2500);
const mid = await p.evaluate(() => ({ url: location.pathname, htmlClass: document.documentElement.className, htmlStyle: document.documentElement.getAttribute('style'), tier: document.documentElement.dataset.tier }));
console.log('AFTER NAV 1', JSON.stringify(mid, null, 1));

await p.click('a[href="/es/contacto/"]').catch(async e => console.log('no contacto link', e.message));
await p.waitForTimeout(2500);
const after = await p.evaluate(() => ({
  url: location.pathname,
  htmlClass: document.documentElement.className,
  panes: [...document.querySelectorAll('.door-pane')].map(e => ({ id: e.id, display: getComputedStyle(e).display, h: Math.round(e.getBoundingClientRect().height), open: e.classList.contains('is-open') })),
  buttons: [...document.querySelectorAll('[data-open]')].map(e => e.getAttribute('aria-expanded')),
}));
console.log('AFTER NAV 2 (contacto)', JSON.stringify(after, null, 1));

// Compare with a hard load of the same page
const p2 = await b.newPage({ viewport: { width: 1280, height: 900 } });
await p2.goto('http://127.0.0.1:4321/es/contacto/', { waitUntil: 'load' });
await p2.waitForTimeout(1500);
console.log('HARD LOAD contacto', JSON.stringify(await p2.evaluate(() => ({
  htmlClass: document.documentElement.className,
  panes: [...document.querySelectorAll('.door-pane')].map(e => ({ id: e.id, display: getComputedStyle(e).display, h: Math.round(e.getBoundingClientRect().height) })),
})), null, 1));
await b.close();
