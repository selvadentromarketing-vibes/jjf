import { chromium } from 'playwright';
const EXE='/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const BASE='http://127.0.0.1:4321';
const b=await chromium.launch({executablePath:EXE});
const ctx=await b.newContext({viewport:{width:1280,height:800}});
const p=await ctx.newPage();

console.log('=== H: Shift+Tab backwards — is the focused link hidden behind the fixed nav? ===');
await p.goto(BASE+'/es/',{waitUntil:'networkidle'}); await p.waitForTimeout(2600);
await p.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));
await p.waitForTimeout(600);
// walk forward to the end, then come back up
for(let i=0;i<24;i++) await p.keyboard.press('Tab');
await p.waitForTimeout(400);
const navB=await p.evaluate(()=>Math.round(document.querySelector('.nav').getBoundingClientRect().bottom));
for(let i=0;i<12;i++){
  await p.keyboard.press('Shift+Tab'); await p.waitForTimeout(220);
  const r=await p.evaluate(()=>{const el=document.activeElement;const x=el.getBoundingClientRect();
    return {tag:el.tagName,txt:(el.textContent||'').trim().slice(0,24),top:Math.round(x.top),bottom:Math.round(x.bottom),inNav:!!el.closest('.nav')};});
  if(r.inNav) continue;
  const flag = r.bottom<=navB ? '  <-- FULLY BEHIND THE FIXED NAV (2.4.11)' : (r.top<navB ? '  <-- partly behind nav' : '');
  console.log(`  ${r.tag} "${r.txt}" top=${r.top} bottom=${r.bottom} navBottom=${navB}${flag}`);
}

console.log('\n=== I: reduced motion — is everything actually present? ===');
const rp=await (await b.newContext({viewport:{width:1280,height:800},reducedMotion:'reduce'})).newPage();
await rp.goto(BASE+'/es/',{waitUntil:'networkidle'}); await rp.waitForTimeout(1500);
console.log(await rp.evaluate(()=>{
  const bad=[...document.querySelectorAll('[data-reveal]')].filter(e=>{const cs=getComputedStyle(e);return parseFloat(cs.opacity)<0.99;});
  return 'invisible [data-reveal] blocks: '+bad.length+
  '\ndoor display: '+getComputedStyle(document.getElementById('door')).display+
  '\nmarker opacity: '+getComputedStyle(document.querySelector('.marker')).opacity+
  '\nlight-field: '+(document.querySelector('.light-field')?getComputedStyle(document.querySelector('.light-field')).display:'none-present')+
  '\nindex-panel: '+(document.querySelector('.index-panel')?'PRESENT':'absent')+
  '\ngrain anim: '+getComputedStyle(document.querySelector('.grain'),'::after').animationName;
}));

console.log('\n=== J: no-JS render (scripting off) ===');
const nj=await (await b.newContext({javaScriptEnabled:false,viewport:{width:1280,height:800}})).newPage();
await nj.goto(BASE+'/es/',{waitUntil:'domcontentloaded'}); await nj.waitForTimeout(800);
console.log(await nj.evaluate(()=>{
  const rev=[...document.querySelectorAll('[data-reveal]')];
  const inv=rev.filter(e=>parseFloat(getComputedStyle(e).opacity)<0.99);
  const h1=document.querySelector('h1');
  return 'total [data-reveal]='+rev.length+'  invisible='+inv.length+
   '\nh1 opacity='+(h1?getComputedStyle(h1).opacity:'n/a')+
   '\nh1 line span transform='+(h1?getComputedStyle(h1.querySelector('.line > span')||h1).transform:'n/a')+
   '\nhtml classes='+document.documentElement.className;
}));

console.log('\n=== K: door overlay blocks the page on first visit ===');
const dp=await (await b.newContext({viewport:{width:1280,height:800}})).newPage();
await dp.goto(BASE+'/es/',{waitUntil:'domcontentloaded'});
await dp.waitForTimeout(150);
console.log(await dp.evaluate(()=>{
  const d=document.getElementById('door');const cs=getComputedStyle(d);
  const hit=document.elementFromPoint(640,400);
  return 'door display='+cs.display+' pointerEvents='+cs.pointerEvents+' ariaHidden='+d.getAttribute('aria-hidden')+' inert='+d.hasAttribute('inert')+
  '\nelementFromPoint(centre)='+(hit?hit.className||hit.tagName:'null');
}));
await b.close();
