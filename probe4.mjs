import { chromium } from '@playwright/test';
const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
p.on('pageerror', e => console.log('[pageerror]', e.message));

const posts = [];
await p.route('**/api/lead', async (route) => {
  posts.push(route.request().postData());
  await new Promise(r => setTimeout(r, 800));           // simulate a slow function
  await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
});

await p.goto('http://127.0.0.1:4321/es/contacto/', { waitUntil: 'load' });
await p.waitForTimeout(2000);

// JOURNEY: visitor opens the "message" door
await p.click('button[data-open="message"]');
await p.waitForTimeout(400);
console.log('activeElement after opening the message door:',
  await p.evaluate(() => { const a = document.activeElement; return { tag: a.tagName, name: a.name, type: a.getAttribute('type'), ariaHidden: a.closest('[aria-hidden]')?.getAttribute('aria-hidden'), cls: a.parentElement?.parentElement?.className }; }));

// the visitor just types — the caret is wherever the page put it
await p.keyboard.type('Ana Beltran');
console.log('after typing 11 chars ->  empresa =', await p.inputValue('[name="empresa"]'), '| nombre =', await p.inputValue('[name="nombre"]'));

// they notice nothing appeared, click the visible Nombre field and type again
await p.click('#contacto-es-nombre');
await p.keyboard.type('Ana Beltran');
await p.fill('#contacto-es-email', 'ana@example.com');
await p.check('[name="consentimiento"]');
await p.click('.contact-form button[type=submit]');
await p.waitForTimeout(1600);
console.log('POST bodies captured:', posts.length);
console.log('body:', posts[0]);
console.log('thank-you shown:', await p.evaluate(() => !document.querySelector('[data-form-sent]').hidden));
await b.close();
