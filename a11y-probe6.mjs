import { chromium } from 'playwright';
import { PNG } from 'pngjs';
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const p=await (await b.newContext({viewport:{width:1280,height:800}})).newPage();
function srgb(c){c/=255;return c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4);}
const L=a=>0.2126*srgb(a[0])+0.7152*srgb(a[1])+0.0722*srgb(a[2]);
const ratio=(a,c)=>{const x=L(a),y=L(c);return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05);};
await p.goto('http://127.0.0.1:4321/es/trayectoria/',{waitUntil:'networkidle'});
await p.waitForTimeout(1400);
for (const [tint,warm] of [['#C99A6B',0.16],['#C4B7A0',0.10],['#E3DFD5',0]]) {
  await p.evaluate(([t,w])=>{const s=document.documentElement.style;s.setProperty('--tint',t);s.setProperty('--linen-warmth',String(w));},[tint,warm]);
  await p.waitForTimeout(1400);
  const box = await p.locator('.ledger-table th').first().boundingBox();
  const png = PNG.sync.read(await p.screenshot());
  const px=(x,y)=>{const i=(png.width*(y|0)+(x|0))<<2;return [png.data[i],png.data[i+1],png.data[i+2]];};
  // background sample well away from any glyph
  const bg = px(box.x+box.width+40, box.y+box.height/2);
  // darkest pixel inside the th glyph area = the ink
  let dark=[255,255,255];
  for(let x=box.x;x<box.x+box.width;x++) for(let y=box.y;y<box.y+box.height;y++){const c=px(x,y); if(L(c)<L(dark)) dark=c;}
  console.log(`tint=${tint} warmth=${warm}  ground=rgb(${bg})  darkest th ink=rgb(${dark})  ratio=${ratio(dark,bg).toFixed(2)}:1`);
}
await b.close();
