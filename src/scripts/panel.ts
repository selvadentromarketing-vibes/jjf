// La Llegada, the index hover panel (plan §S2, desktop).
//
// Hover a place in the index and its photograph surfaces out of the dark in the empty column.
// Three rules from the plan shape every decision here:
//
//   Lit, not slid.   The panel never moves with the cursor. It holds one position and the light
//                    inside it rakes instead. Cursor-following plates read as a widget; a print
//                    that stays put and changes its light reads as a room.
//   Dark pixels first. Moving between places is a luminance-ordered dissolve, not a cross-fade:
//                    the new photograph arrives out of its own shadows.
//   Slower out than in. 300ms to light, 600ms to go dark. Light arrives faster than it leaves.
//
// This is an enhancement on a pointer-and-hover device. Touch gets the inline stills, reduced
// motion gets nothing, and the index is a plain list of links underneath all of it.
import { reduce, ls } from './motion';

const IN_MS = 300;
const OUT_MS = 600;
const DISSOLVE_MS = 600;
const RAKE = 0.15;   // how far the light leans, at the pointer's extremes
const WEIGHT = 0.085; // the site's one inertia constant
const HOVER_INTENT_MS = 120;

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() { vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }`;

const FRAG = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uFrom, uTo;
uniform float uCoverFrom, uCoverTo;  // panelAspect / imageAspect, per texture
uniform float uMix;                  // 0 = from, 1 = to
uniform float uPool;                 // the radial reveal out of the dark
uniform vec2  uLight;                // where the light leans, -1..1

vec2 cover(vec2 uv, float c) {
  uv.y = 1.0 - uv.y;
  if (c > 1.0) uv.y = (uv.y - 0.5) / c + 0.5;
  else         uv.x = (uv.x - 0.5) * c + 0.5;
  return uv;
}

float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }

void main() {
  vec4 a = texture2D(uFrom, cover(vUv, uCoverFrom));
  vec4 b = texture2D(uTo, cover(vUv, uCoverTo));

  // Luminance-ordered dissolve: a pixel of the arriving photograph crosses over once the
  // transition passes its own brightness, so shadows land before highlights. Progress is widened
  // past both ends by the softness so that uMix 0 takes nothing and uMix 1 takes everything,
  // including pure white.
  const float W = 0.18;
  float p = uMix * (1.0 + 2.0 * W) - W;
  float take = smoothstep(luma(b.rgb) - W, luma(b.rgb) + W, p);
  vec3 col = mix(a.rgb, b.rgb, take);

  // The rake: a soft gradient of light leaning where the hand is. The print itself never moves.
  float lean = dot(vUv - 0.5, uLight);
  col *= 1.0 + lean * 0.5;

  // Settle the photograph into the page rather than letting it sit on top of it.
  col = mix(vec3(luma(col)), col, 0.84) * 0.94;

  // The pool: the image is lit out of the dark from its centre rather than faded up flat.
  float d = distance(vUv, vec2(0.5)) * 1.42;
  float pool = smoothstep(uPool * 1.6, uPool * 1.6 - 0.55, d);

  // Soft edges. A hard rectangle reads as a pasted asset.
  float edge = smoothstep(0.0, 0.055, vUv.x) * smoothstep(1.0, 0.945, vUv.x)
             * smoothstep(0.0, 0.085, vUv.y) * smoothstep(1.0, 0.915, vUv.y);

  // Alpha follows the dissolve too. Without this the transparent starting texture is painted at
  // full opacity and the panel is a black rectangle until the photograph wins the mix.
  float alpha = mix(a.a, b.a, take) * pool * edge;
  gl_FragColor = vec4(col, alpha);
}`;

type Plate = { tex: WebGLTexture; aspect: number; ready: boolean };

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'shader');
  return s;
}

export function initPanel() {
  const index = document.querySelector<HTMLElement>('[data-index]');
  if (!index) return;
  // A pointer that can hover, and a person who wants motion. Everything else keeps the plain list.
  if (reduce() || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  if (document.querySelector('.index-panel')) return;

  const canvas = document.createElement('canvas');
  canvas.className = 'index-panel';
  canvas.setAttribute('aria-hidden', 'true');
  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false, antialias: false, depth: false });
  if (!gl) return;
  const g: WebGLRenderingContext = gl;

  let prog: WebGLProgram;
  try {
    prog = g.createProgram()!;
    g.attachShader(prog, compile(g, g.VERTEX_SHADER, VERT));
    g.attachShader(prog, compile(g, g.FRAGMENT_SHADER, FRAG));
    g.linkProgram(prog);
    if (!g.getProgramParameter(prog, g.LINK_STATUS)) throw new Error('link');
  } catch {
    return;
  }
  g.useProgram(prog);
  g.enable(g.BLEND);
  g.blendFunc(g.SRC_ALPHA, g.ONE_MINUS_SRC_ALPHA);

  const buf = g.createBuffer();
  g.bindBuffer(g.ARRAY_BUFFER, buf);
  g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), g.STATIC_DRAW);
  const aPos = g.getAttribLocation(prog, 'aPos');
  g.enableVertexAttribArray(aPos);
  g.vertexAttribPointer(aPos, 2, g.FLOAT, false, 0, 0);

  const u = (n: string) => g.getUniformLocation(prog, n);
  const uFrom = u('uFrom'), uTo = u('uTo'), uCoverFrom = u('uCoverFrom'), uCoverTo = u('uCoverTo');
  const uMix = u('uMix'), uPool = u('uPool'), uLight = u('uLight');
  g.uniform1i(uFrom, 0);
  g.uniform1i(uTo, 1);

  // One blank texture so the shader always has something bound, even before the first plate loads.
  function blank(): Plate {
    const tex = g.createTexture()!;
    g.bindTexture(g.TEXTURE_2D, tex);
    g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, 1, 1, 0, g.RGBA, g.UNSIGNED_BYTE, new Uint8Array([20, 26, 20, 0]));
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.LINEAR);
    return { tex, aspect: 1.5, ready: true };
  }
  const empty = blank();

  const cache = new Map<string, Plate>();
  function plate(src: string): Plate {
    const hit = cache.get(src);
    if (hit) return hit;
    const rec: Plate = { tex: blank().tex, aspect: 1.5, ready: false };
    cache.set(src, rec);
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      g.bindTexture(g.TEXTURE_2D, rec.tex);
      g.pixelStorei(g.UNPACK_FLIP_Y_WEBGL, false);
      g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, g.RGBA, g.UNSIGNED_BYTE, img);
      rec.aspect = img.naturalWidth / Math.max(img.naturalHeight, 1);
      rec.ready = true;
      // If the pointer arrived before the file did, run the dissolve from now rather than letting
      // an already-elapsed clock snap the photograph into place.
      if (rec === to) { mixAt = performance.now(); wake(); }
    };
    img.src = src;
    return rec;
  }

  let from = empty, to = empty;
  let pool = 0, mix = 1;
  let lightX = 0, lightY = 0, wantX = 0, wantY = 0;
  let raf = 0, active = false;

  // Time-based tweens, not per-frame lerps. An exponential lerp never actually finishes, so its
  // real duration is nothing like the number in the constant: 600ms of "decay" took over a second
  // to read as dark. These run on the clock, so IN_MS and OUT_MS mean what they say on any
  // refresh rate.
  let poolFrom = 0, poolTo = 0, poolAt = 0, poolDur = IN_MS;
  let mixAt = -DISSOLVE_MS;
  const ease = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)); // the signature curve, near enough

  function setPool(target: number, now: number) {
    poolFrom = pool;
    poolTo = target;
    poolAt = now;
    poolDur = target > pool ? IN_MS : OUT_MS;
  }

  function size() {
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.height * dpr);
    g.viewport(0, 0, canvas.width, canvas.height);
  }

  function draw(now: number) {
    raf = 0;
    const r = canvas.getBoundingClientRect();
    const panelAspect = r.width / Math.max(r.height, 1);

    const pt = Math.min(1, (now - poolAt) / poolDur);
    pool = poolFrom + (poolTo - poolFrom) * ease(pt);
    mix = ease(Math.min(1, (now - mixAt) / DISSOLVE_MS));
    // The rake keeps the site's one inertia constant rather than a duration: it follows a hand,
    // and a hand has no end time.
    lightX += (wantX - lightX) * WEIGHT;
    lightY += (wantY - lightY) * WEIGHT;

    g.clear(g.COLOR_BUFFER_BIT);
    g.activeTexture(g.TEXTURE0);
    g.bindTexture(g.TEXTURE_2D, from.tex);
    g.activeTexture(g.TEXTURE1);
    g.bindTexture(g.TEXTURE_2D, to.tex);
    g.uniform1f(uCoverFrom, panelAspect / from.aspect);
    g.uniform1f(uCoverTo, panelAspect / to.aspect);
    g.uniform1f(uMix, to.ready ? mix : 0);
    g.uniform1f(uPool, pool);
    g.uniform2f(uLight, lightX * RAKE, lightY * RAKE);
    g.drawArrays(g.TRIANGLE_STRIP, 0, 4);

    // Idle completely once the panel is dark: no rAF left running behind the page.
    if (poolTo === 0 && pt >= 1) {
      canvas.classList.remove('is-on');
      active = false;
      return;
    }
    raf = requestAnimationFrame(draw);
  }

  function wake() {
    if (!raf) raf = requestAnimationFrame(draw);
  }

  function show(src: string) {
    const now = performance.now();
    const next = plate(src);
    canvas.classList.add('is-on');
    active = true;
    if (next !== to) {
      // Coming back from dark starts from nothing; moving between places dissolves from the
      // photograph already lit.
      from = pool > 0.01 ? to : empty;
      to = next;
      mixAt = now;
      size();
    }
    if (poolTo !== 1) setPool(1, now);
    wake();
  }

  function hide() {
    if (poolTo === 0) return;
    setPool(0, performance.now());
    wake();
  }

  // Hover intent: a cursor crossing the list on its way somewhere else should not start
  // downloading six photographs.
  let intent: number | undefined;
  const arm = (row: HTMLElement) => {
    const src = row.dataset.plate;
    if (!src) return;
    clearTimeout(intent);
    intent = window.setTimeout(() => show(src), HOVER_INTENT_MS);
  };
  const disarm = () => { clearTimeout(intent); hide(); };

  index.addEventListener('pointerover', (e) => {
    const row = (e.target as HTMLElement).closest<HTMLElement>('a[data-plate]');
    if (row) arm(row);
  });
  index.addEventListener('pointerleave', disarm);
  // Keyboard parity: focus is hover.
  index.addEventListener('focusin', (e) => {
    const row = (e.target as HTMLElement).closest<HTMLElement>('a[data-plate]');
    if (row) arm(row);
  });
  index.addEventListener('focusout', (e) => {
    if (!index.contains((e as FocusEvent).relatedTarget as Node)) disarm();
  });

  addEventListener('pointermove', (e) => {
    if (!active) return;
    wantX = (e.clientX / innerWidth) * 2 - 1;
    wantY = (e.clientY / innerHeight) * 2 - 1;
  }, { passive: true });

  addEventListener('resize', size, { passive: true });
  index.addEventListener('click', (e) => {
    const row = (e.target as HTMLElement).closest<HTMLElement>('a[data-project]');
    if (row?.dataset.project) ls.set('jjf-last-project', row.dataset.project);
  });

  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    if (raf) cancelAnimationFrame(raf);
    canvas.remove();
  });

  document.body.appendChild(canvas);
  size();
}
