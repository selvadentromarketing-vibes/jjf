import { chromium } from 'playwright';
const EXE='/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const BASE='http://127.0.0.1:4321';
const b=await chromium.launch({executablePath:EXE});
const p=await (await b.newContext({viewport:{width:1280,height:800}})).newPage();
const act=()=>p.evaluate(()=>{const el=document.activeElement;const r=el.getBoundingClientRect();
  return `${el.tagName.toLowerCase()}${el.id?'#'+el.id:''}${el.name?'[name='+el.name+']':''} "${(el.textContent||el.value||'').trim().slice(0,24)}" y=${Math.round(r.y)} h=${Math.round(r.height)}`;});

console.log('=== E: skip link ===');
await p.goto(BASE+'/es/',{waitUntil:'networkidle'}); await p.waitForTimeout(2600);
await p.keyboard.press('Tab');
console.log('tab1 =', await act());
await p.keyboard.press('Enter'); await p.waitForTimeout(500);
console.log('after activating skip link, activeElement =', await act());
console.log('main tabindex =', await p.evaluate(()=>document.getElementById('main').getAttribute('tabindex')));
await p.keyboard.press('Tab');
console.log('next Tab lands on =', await act());

console.log('\n=== F: 2.4.11 focus not obscured — tab the whole home page ===');
await p.goto(BASE+'/es/',{waitUntil:'networkidle'}); await p.waitForTimeout(2600);
const navH = await p.evaluate(()=>Math.round(document.querySelector('.nav').getBoundingClientRect().bottom));
for(let i=0;i<14;i++){
  await p.keyboard.press('Tab'); await p.waitForTimeout(250);
  const r = await p.evaluate(()=>{const el=document.activeElement;const b=el.getBoundingClientRect();
    return {tag:el.tagName,txt:(el.textContent||'').trim().slice(0,22),top:Math.round(b.top),bottom:Math.round(b.bottom),h:Math.round(b.height)};});
  const under = r.bottom <= navH && r.bottom>0;
  console.log(`  ${String(i+1).padStart(2)} ${r.tag} "${r.txt}" top=${r.top} bottom=${r.bottom} navBottom=${navH} ${under?'  <-- ENTIRELY UNDER FIXED NAV':''}${r.bottom<0||r.top>800?'  <-- OFFSCREEN':''}`);
}

console.log('\n=== G: form validation error announcement + success focus ===');
await p.goto(BASE+'/es/contacto/',{waitUntil:'networkidle'}); await p.waitForTimeout(1500);
await p.locator('button[data-open="message"]').click(); await p.waitForTimeout(400);
await p.locator('button.submit').click(); await p.waitForTimeout(400);
console.log('after invalid submit: activeElement =', await act());
console.log('error node =', await p.evaluate(()=>{const e=document.querySelector('[data-form-error]');return JSON.stringify({hidden:e.hidden,text:e.textContent,role:e.getAttribute('role'),live:e.getAttribute('aria-live')});}));
console.log('consent checkbox aria-invalid =', await p.evaluate(()=>document.querySelector('[name=consentimiento]').getAttribute('aria-invalid')));

// now a valid submit, intercepting the API
await p.route('**/api/lead', r=>r.fulfill({status:200,contentType:'application/json',body:'{"ok":true}'}));
await p.fill('#contacto-es-nombre','Prueba');
await p.fill('#contacto-es-email','a@b.com');
await p.check('[name=consentimiento]');
await p.locator('button.submit').focus();
await p.keyboard.press('Enter');
await p.waitForTimeout(900);
console.log('after successful submit: activeElement =', await act());
console.log('sent panel =', await p.evaluate(()=>{const s=document.querySelector('[data-form-sent]');return JSON.stringify({hidden:s.hidden,role:s.getAttribute('role'),live:s.getAttribute('aria-live'),text:s.textContent.trim().slice(0,60)});}));
await p.keyboard.press('Tab');
console.log('Tab after success lands on =', await act());
await b.close();
