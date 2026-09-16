// La Marca (plan §S0, revised 16 September). First visit: the mark draws itself in one line, the
// word arrives, a beat; then the line does not fade — it becomes the first road of the plan drawn
// behind the curtains. The hairline opens, the forest parts onto the table, and the plan spreads
// from that road (plano.ts). About two and a third seconds to the hand-off; a click or a key ends
// it early. Every navigation after that is a 240 ms cross on the page itself.
//
// The morph needs the mark and the plan in one coordinate system. `.door-plan` is a full-screen SVG
// in the plate's coordinates (1920×870, sliced exactly like the film and the drawing under it); the
// mark's paths are copied into it with their geometry transformed from the HTML mark's screen box,
// so the copy sits where the mark was, and the road's path data is the morph target verbatim.
import { gsap, reduce } from './motion';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';

// The hand-off. MORPH is the literal path morph (MorphSVG, letterforms into the road): its
// mid-frames read as a tangle, so the shipped version is the unspool — the outline runs out along
// its own length, as if the pen were taking the line back, while under it the road draws itself
// with the same pen and beads into dash-dot. The morph stays one constant away.
const MORPH = false;
type Els = ReturnType<typeof els>;
const html = document.documentElement;

function els(door: HTMLElement) {
  return {
    top: door.querySelector<HTMLElement>('.door-top')!,
    bottom: door.querySelector<HTMLElement>('.door-bottom')!,
    hair: door.querySelector<HTMLElement>('.door-hair')!,
    mark: door.querySelector<HTMLElement>('.door-mark')!,
    plan: door.querySelector<SVGSVGElement>('.door-plan'),
    caption: door.querySelector<HTMLElement>('.door-caption'),
    strokes: Array.from(door.querySelectorAll<SVGPathElement>('.mk-stroke path')),
    fill: door.querySelector<SVGGElement>('.mk-fill .mk-mark')!,
    word: door.querySelector<SVGGElement>('.mk-fill .mk-word')!,
  };
}

function close(door: HTMLElement, e: Els) {
  door.dataset.state = 'closed';
  gsap.set([e.top, e.bottom, e.mark, e.hair, e.fill, e.word, e.strokes, e.caption].filter(Boolean), { clearProps: 'all' });
  for (const el of [e.mark, e.hair, e.top, e.bottom, e.caption]) if (el) el.removeAttribute('style');
  if (e.plan) { e.plan.innerHTML = ''; e.plan.style.display = ''; }
  e.mark.style.visibility = '';
}

const fire = (name: string) => dispatchEvent(new Event(name));
function open() {
  if (html.classList.contains('door-open')) return;
  html.classList.add('door-open');
  fire('jjf:door-open');
}
function morphed() {
  if (html.classList.contains('door-morphed')) return;
  html.classList.add('door-morphed');
  fire('jjf:door-morphed');
}

// The stage for the morph: the mark, copied into the plan's coordinates, and the road it becomes.
function stage(e: Els) {
  const seed = document.querySelector<SVGPathElement>('[data-plano-host] .plano svg #seed');
  const markSvg = e.mark.querySelector('svg');
  if (!seed || !e.plan || !markSvg) return null;
  // The mark goes where the road is, so the line runs out and the road draws in the same place;
  // the hairline and the parting follow it. The road's centre is given as % of the plate, and the
  // plate's height fills the viewport on every screen, so the % holds for the viewport too.
  const cy = Number(seed.ownerSVGElement?.dataset.seedCy);
  if (cy > 0 && cy < 100) {
    e.mark.style.transform = `translateY(${(cy - 50).toFixed(1)}svh)`;
    e.hair.style.top = `${cy}%`;
    e.top.style.height = `${cy}%`;
    e.bottom.style.height = `${100 - cy}%`;
    if (e.caption && cy > 62) e.caption.style.bottom = `${Math.max(3, 100 - cy - 6).toFixed(0)}svh`;
  }
  // The stage has to be laid out before its matrix means anything: shown first, measured second.
  e.plan.style.display = 'block';
  e.plan.getBoundingClientRect();
  const cm = markSvg.getScreenCTM(), cp = e.plan.getScreenCTM();
  if (!cm || !cp) { e.plan.style.display = ''; return null; }
  const M = cp.inverse().multiply(cm);
  const tx = (d: string) => {
    const raw = MorphSVGPlugin.stringToRawPath(d) as number[][];
    for (const seg of raw) for (let i = 0; i < seg.length; i += 2) {
      const x = seg[i], y = seg[i + 1];
      seg[i] = M.a * x + M.c * y + M.e;
      seg[i + 1] = M.b * x + M.d * y + M.f;
    }
    return MorphSVGPlugin.rawPathToString(raw);
  };
  const ns = 'http://www.w3.org/2000/svg';
  const fills = document.createElementNS(ns, 'g');
  fills.setAttribute('class', 'dp-fill');
  fills.setAttribute('fill', 'currentColor');
  fills.setAttribute('fill-rule', 'evenodd');
  const fillMark = document.createElementNS(ns, 'g');
  const fillWord = document.createElementNS(ns, 'g');
  markSvg.querySelectorAll<SVGPathElement>('.mk-fill .mk-mark path').forEach((p) => { const c = document.createElementNS(ns, 'path'); c.setAttribute('d', tx(p.getAttribute('d')!)); fillMark.appendChild(c); });
  markSvg.querySelectorAll<SVGPathElement>('.mk-fill .mk-word path').forEach((p) => { const c = document.createElementNS(ns, 'path'); c.setAttribute('d', tx(p.getAttribute('d')!)); fillWord.appendChild(c); });
  fills.append(fillMark, fillWord);
  const stroke = document.createElementNS(ns, 'path');
  stroke.setAttribute('class', 'dp-stroke');
  stroke.setAttribute('d', tx(e.strokes[0].getAttribute('d')!));
  // The road, in the stage, in the plan's own weight: drawn by the same pen, then handed to the
  // drawing underneath, which shows the same road at the same place the moment the door closes.
  const road = document.createElementNS(ns, 'path');
  road.setAttribute('class', 'dp-road');
  road.setAttribute('d', seed.getAttribute('d')!);
  e.plan.append(fills, stroke, road);
  e.mark.style.visibility = 'hidden';
  return { stroke, road, fillMark, fillWord, seedD: seed.getAttribute('d')! };
}

function overture(door: HTMLElement) {
  const e = els(door);
  door.dataset.state = 'overture';
  const s = stage(e);
  const strokes: SVGElement[] = s ? [s.stroke] : e.strokes;
  const fill: SVGElement = s ? s.fillMark : e.fill;
  const word: SVGElement = s ? s.fillWord : e.word;
  gsap.set([e.top, e.bottom], { clipPath: 'inset(0% 0% 0% 0%)', opacity: 1 });
  gsap.set(strokes, { drawSVG: '0%', opacity: 1 });
  gsap.set([fill, word], { opacity: 0 });
  if (s) gsap.set(s.road, { drawSVG: '0%' });
  gsap.set(e.hair, { opacity: 0, scaleX: 0 });
  if (e.caption) gsap.set(e.caption, { opacity: 0 });

  const tl = gsap.timeline({ defaults: { ease: 'signature' }, onComplete: () => { open(); morphed(); close(door, e); } })
    // the signature
    .to(strokes, { drawSVG: '0% 100%', duration: 1.1 }, 0)
    .to(fill, { opacity: 1, duration: 0.4, ease: 'power1.out' }, 0.6)
    .to(word, { opacity: 1, duration: 0.35, ease: 'power1.out' }, 0.7)
    // the beat, with the founder's line
    .to(e.caption ?? {}, { opacity: 1, duration: 0.35, ease: 'power1.out' }, 1.2)
    // the line goes on: fill and word let go, the hairline opens through the mark's centre
    .to([fill, word], { opacity: 0, duration: 0.25, ease: 'power1.in' }, 1.55)
    .to(e.hair, { opacity: 1, scaleX: 1, duration: 0.16 }, 1.55);
  if (s && MORPH) {
    // The morph. DrawSVG owns the dash pattern while it draws; clear it so the stroke is one solid
    // line again, morph the letterforms into the road, thin the line to the plan's weight, and in
    // the last beat let the solid line bead into dash-dot — the moment it becomes a drawing.
    tl.set(s.stroke, { clearProps: 'strokeDasharray,strokeDashoffset' }, 1.55)
      .to(s.stroke, { morphSVG: { shape: s.seedD, type: 'rotational', map: 'complexity' }, strokeWidth: 1.2, duration: 0.75 }, 1.55)
      .set(s.stroke, { strokeDasharray: '9 0 1.6 0' }, 1.95)
      .to(s.stroke, { strokeDasharray: '9 5 1.6 5', duration: 0.35, ease: 'power1.inOut' }, 1.95);
  } else if (s) {
    // The unspool: the fill has let go and the outline is a line again; it runs out from its start
    // while, under it, the road draws in, then the solid road beads into dash-dot.
    tl.to(s.stroke, { drawSVG: '100% 100%', duration: 0.55 }, 1.6)
      .to(s.road, { drawSVG: '0% 100%', duration: 0.6 }, 1.7)
      .set(s.road, { clearProps: 'strokeDasharray,strokeDashoffset' }, 2.3)
      .set(s.road, { strokeDasharray: '9 0 1.6 0' }, 2.3)
      .to(s.road, { strokeDasharray: '9 5 1.6 5', duration: 0.3, ease: 'power1.inOut' }, 2.3);
  } else {
    tl.to(strokes, { opacity: 0, duration: 0.25, ease: 'power1.in' }, 1.55);
  }
  tl.to(e.top, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.6 }, 1.7)
    .to(e.bottom, { clipPath: 'inset(100% 0% 0% 0%)', duration: 0.6 }, 1.7)
    // The curtains starting to part is the cue the page waits for (plan §S2).
    .add(open, 1.7)
    .to(e.caption ?? {}, { opacity: 0, duration: 0.3, ease: 'power1.in' }, 1.9)
    .to(e.hair, { opacity: 0, duration: 0.16 }, 2.2)
    // The road on the door now coincides with the road in the drawing: hand over.
    .add(morphed, s && !MORPH ? 2.6 : 2.3);

  // Anyone who does not want to watch does not have to. One gesture ends it; nothing is skipped
  // that the page needs, because the timeline is run to its end rather than abandoned.
  const skip = () => { if (door.dataset.state === 'overture') { html.classList.add('door-skipped'); tl.progress(1); } };
  door.addEventListener('pointerdown', skip, { once: true });
  addEventListener('keydown', skip, { once: true });
  addEventListener('wheel', skip, { once: true, passive: true });
  addEventListener('touchstart', skip, { once: true, passive: true });
}

export function initDoor() {
  const door = document.getElementById('door');
  if (!door) return;
  if (html.classList.contains('door-pending') && !reduce()) overture(door);
  else { door.dataset.state = 'closed'; html.classList.add('door-open'); }

  // Every navigation: the page crosses, the chrome stays. Under reduced motion the cross is
  // still a cross — an opacity change is not motion — but it is the only thing that happens.
  document.addEventListener('astro:before-preparation', (ev: any) => {
    const load = ev.loader;
    ev.loader = async () => {
      await gsap.to('main', { opacity: 0, duration: 0.24, ease: 'power1.out' }).then();
      await load();
      html.classList.add('soft-swap');
    };
  });

  document.addEventListener('astro:after-swap', () => {
    door.dataset.state = 'closed';
    html.classList.add('door-open');
    if (html.classList.contains('soft-swap')) {
      html.classList.remove('soft-swap');
      gsap.fromTo('main', { opacity: 0 }, { opacity: 1, duration: 0.24, ease: 'power1.out', clearProps: 'opacity' });
    }
  });
}
