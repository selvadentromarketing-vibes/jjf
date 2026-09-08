import { chromium } from '@playwright/test';
const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
p.on('pageerror', e => console.log('[pageerror]', e.message));
await p.goto('http://127.0.0.1:4321/es/', { waitUntil: 'load' });
await p.waitForTimeout(2500);
// scroll a long way down the homepage
await p.mouse.wheel(0, 4000);
await p.waitForTimeout(1500);
console.log('scrollY on home before nav:', await p.evaluate(() => Math.round(window.scrollY)));
// client-side nav
await p.evaluate(() => { const a = document.createElement('a'); a.href='/es/vision/'; document.body.appendChild(a); a.click(); });
await p.waitForTimeout(2500);
console.log('scrollY right after nav:', await p.evaluate(() => Math.round(window.scrollY)), 'url', await p.evaluate(()=>location.pathname));
// small wheel nudge
await p.mouse.move(640, 450);
await p.mouse.wheel(0, 100);
await p.waitForTimeout(300);
console.log('scrollY 300ms after a 100px wheel nudge:', await p.evaluate(() => Math.round(window.scrollY)));
await p.waitForTimeout(1500);
console.log('scrollY 1.8s after the nudge:', await p.evaluate(() => Math.round(window.scrollY)));
console.log('page height:', await p.evaluate(() => document.documentElement.scrollHeight));
await b.close();
