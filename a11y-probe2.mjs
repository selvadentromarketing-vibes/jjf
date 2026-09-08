import { chromium } from 'playwright';
import { PNG } from 'pngjs';
const EXE='/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const BASE='http://127.0.0.1:4321';
const b=await chromium.launch({executablePath:EXE});
const p=await (await b.newContext({viewport:{width:1280,height:800}})).newPage();

function srgb(c){c/=255;return c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4);}
const L=([r,g,bl])=>0.2126*srgb(r)+0.7152*srgb(g)+0.0722*srgb(bl);
const ratio=(a,c)=>{const x=L(a),y=L(c);return ((Math.max(x,y)+0.05)/(Math.min(x,y)+0.05));};

async function sample(page, name){
  const buf = await page.screenshot();
  const png = PNG.sync.read(buf);
  const px=(x,y)=>{const i=(png.width*y+x)<<2;return [png.data[i],png.data[i+1],png.data[i+2]];};
  return {png,px,name};
}

for (const url of ['/es/vision/','/es/trayectoria/','/es/proyectos/selvadentro/','/es/contacto/']) {
  await p.goto(BASE+url,{waitUntil:'networkidle'});
  await p.waitForTimeout(1800);
  const ground = await p.evaluate(()=>document.documentElement.dataset.ground);
  // focus the nav CTA (always present, near top)
  await p.evaluate(()=>{document.querySelector('a.cta').focus();});
  await p.waitForTimeout(200);
  const box = await p.locator('a.cta').boundingBox();
  const s = await sample(p);
  // outline sits 6px outside the box, 1px thick -> sample at box.x-7 .. box.x-6 on the mid-height
  const my = Math.round(box.y+box.height/2);
  const ringX = Math.round(box.x-7);
  const ring = s.px(ringX, my);
  const bg = s.px(Math.round(box.x-20), my);
  console.log(`${url.padEnd(30)} ground=${(ground||'').padEnd(7)} ring=rgb(${ring}) bg=rgb(${bg}) contrast=${ratio(ring,bg).toFixed(2)}:1`);
}

console.log('\n=== field underline (non-text contrast) on /es/contacto/ ===');
await p.goto(BASE+'/es/contacto/',{waitUntil:'networkidle'});
await p.waitForTimeout(1500);
await p.locator('button[data-open="message"]').click();
await p.waitForTimeout(500);
const fb = await p.locator('#contacto-es-nombre').boundingBox();
await p.evaluate(()=>document.activeElement.blur());
await p.waitForTimeout(300);
const s2 = await sample(p);
const fieldBox = await p.locator('.field').first().boundingBox();
const lineY = Math.round(fieldBox.y+fieldBox.height-1);
const line = s2.px(Math.round(fieldBox.x+50), lineY);
const above = s2.px(Math.round(fieldBox.x+50), lineY-8);
console.log(`field bottom border rgb(${line}) vs ground rgb(${above}) = ${ratio(line,above).toFixed(2)}:1  (WCAG 1.4.11 needs 3:1)`);
console.log('computed border:', await p.evaluate(()=>{const f=document.querySelector('.field');const cs=getComputedStyle(f);return cs.borderBottomColor+' '+cs.borderBottomWidth;}));
console.log('computed input:', await p.evaluate(()=>{const i=document.querySelector('#contacto-es-nombre');const cs=getComputedStyle(i);return 'border='+cs.borderTopStyle+' bg='+cs.backgroundColor;}));

await b.close();
