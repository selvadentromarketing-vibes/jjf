import { chromium } from '@playwright/test';
const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
p.on('pageerror', e => console.log('[pageerror]', e.message));
const posts = [];
await p.route('**/api/lead', async (route) => {
  posts.push(Date.now());
  await new Promise(r => setTimeout(r, 2500));       // a genuinely slow cold-start function
  await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
});
await p.goto('http://127.0.0.1:4321/es/contacto/', { waitUntil: 'load' });
await p.waitForTimeout(3000);
await p.click('button[data-open="message"]');
await p.fill('#contacto-es-nombre', 'Ana Beltran');
await p.fill('#contacto-es-email', 'ana@example.com');
await p.check('[name="consentimiento"]');
const btn = p.locator('.contact-form button[type=submit]');
console.log('button disabled attr while idle:', await btn.getAttribute('disabled'));
await btn.click();
await p.waitForTimeout(300);
console.log('mid-send: form has is-sending =', await p.evaluate(()=>document.querySelector('.contact-form').classList.contains('is-sending')),
            '| button disabled =', await btn.isDisabled(),
            '| pointer-events =', await btn.evaluate(e => getComputedStyle(e).pointerEvents));
await btn.click();   // impatient second click
await p.waitForTimeout(300);
await btn.click();   // third
await p.waitForTimeout(4000);
console.log('POSTs sent for one enquiry:', posts.length);
await b.close();
