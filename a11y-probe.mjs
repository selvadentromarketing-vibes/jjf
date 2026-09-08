import { chromium } from 'playwright';
const BASE = process.env.BASE || 'https://claude-session-overview-voqe3e--jjfcreando.netlify.app';
const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const ctx = await b.newContext();
const p = await ctx.newPage();
p.on('pageerror', e => console.log('PAGEERROR', e.message));

async function desc(h) {
  return await h.evaluate(el => {
    const parts=[el.tagName.toLowerCase()];
    if(el.id)parts.push('#'+el.id);
    if(el.name)parts.push('[name='+el.name+']');
    if(el.className&&typeof el.className==='string')parts.push('.'+el.className.trim().split(/\s+/).join('.'));
    const r=el.getBoundingClientRect();
    const ah=el.closest('[aria-hidden="true"]');
    return `${parts.join('')} rect=${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.width)}x${Math.round(r.height)} insideAriaHidden=${!!ah} text="${(el.textContent||'').trim().slice(0,30)}"`;
  });
}

console.log('=== A: open the "message" door with the keyboard, see where focus lands ===');
await p.goto(BASE+'/es/contacto/', {waitUntil:'networkidle'});
await p.waitForTimeout(1200);
const btn = p.locator('button[data-open="message"]');
await btn.focus();
console.log('focus before Enter :', await desc(await p.evaluateHandle(()=>document.activeElement)));
await p.keyboard.press('Enter');
await p.waitForTimeout(400);
console.log('focus after Enter  :', await desc(await p.evaluateHandle(()=>document.activeElement)));
console.log('activeElement in viewport?:', await p.evaluate(()=>{const r=document.activeElement.getBoundingClientRect();return r.right>0&&r.left<innerWidth&&r.bottom>0&&r.top<innerHeight;}));

console.log('\n=== B: form error / success live-region semantics ===');
console.log(await p.evaluate(()=>{
  const e=document.querySelector('[data-form-error]');
  const s=document.querySelector('[data-form-sent]');
  const f=document.querySelector('[data-contact-form]');
  const j=o=>o?JSON.stringify({role:o.getAttribute('role'),ariaLive:o.getAttribute('aria-live'),id:o.id,hidden:o.hidden,tabindex:o.getAttribute('tabindex')}):'null';
  return 'error='+j(e)+'\nsent ='+j(s)+'\nfields with aria-describedby='+document.querySelectorAll('[data-contact-form] [aria-describedby]').length+'\nfields with aria-invalid='+document.querySelectorAll('[data-contact-form] [aria-invalid]').length+'\nrequired inputs='+[...document.querySelectorAll('[data-contact-form] [required]')].map(i=>i.name).join(',');
}));

console.log('\n=== C: focus ring contrast on a linen page ===');
await p.goto(BASE+'/es/vision/', {waitUntil:'networkidle'});
await p.waitForTimeout(1500);
console.log(await p.evaluate(()=>{
  const cs=getComputedStyle(document.documentElement);
  const body=getComputedStyle(document.body);
  return 'html[data-ground]='+document.documentElement.dataset.ground+
    '\n--ground computed = '+cs.getPropertyValue('--ground').trim()+
    '\nbody background   = '+body.backgroundColor+
    '\n--tint            = '+cs.getPropertyValue('--tint').trim();
}));
await p.keyboard.press('Tab');
await p.keyboard.press('Tab');
await p.keyboard.press('Tab');
console.log(await p.evaluate(()=>{
  const el=document.activeElement; const cs=getComputedStyle(el);
  return 'focused='+el.tagName+' "'+(el.textContent||'').trim().slice(0,25)+'" outline='+cs.outlineColor+' / '+cs.outlineWidth+' / '+cs.outlineStyle;
}));

console.log('\n=== D: 2.4.11 focus obscured by the fixed nav ===');
await p.goto(BASE+'/es/', {waitUntil:'networkidle'});
await p.waitForTimeout(2500);
console.log(await p.evaluate(()=>{
  const nav=document.querySelector('.nav').getBoundingClientRect();
  return 'nav height='+Math.round(nav.height)+' scroll-padding-top='+getComputedStyle(document.documentElement).scrollPaddingTop;
}));

await b.close();
