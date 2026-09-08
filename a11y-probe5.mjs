import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const p=await (await b.newContext({viewport:{width:1280,height:800}})).newPage();
function srgb(c){c/=255;return c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4);}
const L=a=>0.2126*srgb(a[0])+0.7152*srgb(a[1])+0.0722*srgb(a[2]);
const ratio=(a,c)=>{const x=L(a),y=L(c);return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05);};
await p.goto('http://127.0.0.1:4321/es/vision/',{waitUntil:'networkidle'});
await p.waitForTimeout(1200);
// force the dawn extreme the solar script can produce
const out = await p.evaluate(()=>{
  const s=document.documentElement.style;
  const probe=(tint,warm)=>{
    s.setProperty('--tint',tint); s.setProperty('--linen-warmth',String(warm));
    const g=getComputedStyle(document.body).backgroundColor;
    const d=document.createElement('span'); d.className='small'; document.body.appendChild(d);
    const c=getComputedStyle(d).color; d.remove();
    return {tint,warm,ground:g,inkDim:c};
  };
  return [probe('#C99A6B',0.16), probe('#C4B7A0',0.10), probe('#E3DFD5',0.0)];
});
const parse=s=>s.match(/[\d.]+/g).slice(0,3).map(Number);
for(const o of out){
  console.log(`tint=${o.tint} warmth=${o.warm}  ground=${o.ground}  ink-dim=${o.inkDim}  ratio=${ratio(parse(o.ground),parse(o.inkDim)).toFixed(2)}:1`);
}
// screenshot the obscured-focus case
await p.goto('http://127.0.0.1:4321/es/',{waitUntil:'networkidle'});
await p.waitForTimeout(2600);
await p.evaluate(()=>{const a=[...document.querySelectorAll('a')].find(x=>x.textContent.includes('trayectoria completa'));a.scrollIntoView({block:'start'});a.focus();});
await p.waitForTimeout(700);
const r=await p.evaluate(()=>{const a=[...document.querySelectorAll('a')].find(x=>x.textContent.includes('trayectoria completa'));const b=a.getBoundingClientRect();
  const mid=document.elementFromPoint(b.x+10,b.y+b.height/2);
  return {top:Math.round(b.top),bottom:Math.round(b.bottom),hitTest:mid?mid.className||mid.tagName:'null',navVeil:getComputedStyle(document.querySelector('.nav'),'::before').opacity};});
console.log('\nledger-more focused after scrollIntoView(block:start):',JSON.stringify(r));
await p.screenshot({path:'/home/user/jjf/focus-obscured.png',clip:{x:0,y:0,width:900,height:180}});
await b.close();
