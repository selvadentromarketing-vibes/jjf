// El Descenso, the light layer (plan §S1).
//
// A canvas of pure light laid over a photograph and composited with soft-light. It never carries
// the picture itself, which matters three ways: no second download, no resampling of the plate,
// and the field can be rendered at a fraction of the screen resolution because a cloud shadow has
// no fine detail. That last point is what makes it affordable on a phone.
//
// The photograph is always present and correct without any of this. The canvas fades in only once
// it has compiled and proved it can hold frame rate, and removes itself the moment it cannot.
import { reduce } from './motion';

type Mode = 'A' | 'B' | 'C' | 'D' | 'F' | 'G';

// Light budget: the plan allows this layer up to 6% luminance, well below anything that reads as
// an effect. Past that it stops being weather and starts being a filter.
const AMPLITUDE: Record<Mode, number> = { A: 0.06, B: 0.05, C: 0.0, D: 0.06, F: 0.06, G: 0.035 };

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() { vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }`;

const FRAG = `
precision mediump float;
varying vec2 vUv;
uniform float uTime, uAmp, uAspect, uWarm;
uniform int uMode;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }

float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 3; i++) { v += a * noise(p); p *= 2.02; a *= 0.5; }
  return v;
}

void main() {
  vec2 uv = vec2(vUv.x * uAspect, vUv.y);
  float light = 0.5;

  if (uMode == 0) {
    // A — cloud shadow. One viewport of travel every fifty seconds: slow enough that you are
    // never sure it moved, which is the whole point.
    float c = fbm(uv * 1.6 + vec2(uTime * 0.02, uTime * 0.006));
    light = 0.5 - (1.0 - smoothstep(0.35, 0.75, c)) * uAmp;
  } else if (uMode == 1) {
    // B — shafts through the canopy. The same noise stretched 12:1 so it falls as light does.
    float s = fbm(vec2(uv.x * 3.4 + uTime * 0.014, uv.y * 0.28));
    light = 0.5 + smoothstep(0.55, 0.95, s) * uAmp;
  } else if (uMode == 3) {
    // D — caustics on water. Six sines crossing, the cheapest convincing water light there is.
    float t = uTime * 0.55;
    float w = sin(uv.x * 9.0 + t) + sin(uv.y * 11.0 - t * 0.9) + sin((uv.x + uv.y) * 7.0 + t * 1.3)
            + sin((uv.x - uv.y) * 13.0 - t * 0.7) + sin(uv.y * 6.0 + t * 1.1) + sin(uv.x * 15.0 - t * 0.5);
    light = 0.5 + smoothstep(2.2, 5.2, w) * uAmp;
  } else if (uMode == 4) {
    // F — dapple. Cloud shadow with a leaf-scale second layer on top of it.
    float c = fbm(uv * 1.6 + vec2(uTime * 0.02, 0.0));
    float leaf = fbm(uv * 9.0 - vec2(uTime * 0.05, uTime * 0.02));
    light = 0.5 - (1.0 - smoothstep(0.35, 0.75, c)) * uAmp * 0.65
                - (1.0 - smoothstep(0.42, 0.72, leaf)) * uAmp * 0.5;
  } else if (uMode == 5) {
    // G — limestone. A warm lift that barely moves, for stone in late afternoon.
    float c = fbm(uv * 1.1 + vec2(uTime * 0.008, 0.0));
    light = 0.5 + smoothstep(0.4, 0.8, c) * uAmp;
  }

  // uWarm tilts the field toward the hour's colour without ever leaving neutral by much.
  vec3 tint = mix(vec3(1.0), vec3(1.06, 1.0, 0.93), uWarm);
  gl_FragColor = vec4(vec3(light) * tint, 1.0);
}`;

const MODE_INDEX: Record<Mode, number> = { A: 0, B: 1, C: 2, D: 3, F: 4, G: 5 };

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'shader');
  return s;
}

function startField(host: HTMLElement, mode: Mode) {
  if (AMPLITUDE[mode] === 0) return;

  const canvas = document.createElement('canvas');
  canvas.className = 'light-field';
  canvas.setAttribute('aria-hidden', 'true');

  const gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' });
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
    return; // the photograph is already correct on its own
  }
  g.useProgram(prog);

  const buf = g.createBuffer();
  g.bindBuffer(g.ARRAY_BUFFER, buf);
  g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), g.STATIC_DRAW);
  const aPos = g.getAttribLocation(prog, 'aPos');
  g.enableVertexAttribArray(aPos);
  g.vertexAttribPointer(aPos, 2, g.FLOAT, false, 0, 0);

  const u = (n: string) => g.getUniformLocation(prog, n);
  const uTime = u('uTime'), uAmp = u('uAmp'), uAspect = u('uAspect'), uMode = u('uMode'), uWarm = u('uWarm');
  g.uniform1f(uAmp, AMPLITUDE[mode]);
  g.uniform1i(uMode, MODE_INDEX[mode]);

  // The field is smooth by nature, so it is rendered small and stretched by CSS. This is the
  // single biggest reason it stays cheap on a phone.
  const LONG_EDGE = 460;
  function size() {
    const r = host.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const scale = Math.min(1, LONG_EDGE / Math.max(r.width, r.height));
    canvas.width = Math.max(2, Math.round(r.width * scale));
    canvas.height = Math.max(2, Math.round(r.height * scale));
    g.viewport(0, 0, canvas.width, canvas.height);
    g.uniform1f(uAspect, r.width / Math.max(r.height, 1));
  }
  size();
  const onResize = () => size();
  addEventListener('resize', onResize, { passive: true });

  const warm = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--light-warmth')) || 0.5;
  g.uniform1f(uWarm, Math.min(Math.max(warm, 0), 1));

  host.appendChild(canvas);

  let raf = 0;
  let visible = true;
  const started = performance.now();

  // The probe. Judged on the median frame, not on a count of slow ones: the first second of a
  // page is genuinely busy — fonts swapping, the hero image decoding, the door finishing — and a
  // few long frames there say nothing about whether this device can carry the layer. A median
  // under the threshold means it sustained the rate, which is the thing we actually care about.
  const WARMUP_MS = 400;      // ignore the noisy opening entirely
  const PROBE_END_MS = 1400;  // then watch a full second
  const MAX_MEDIAN_MS = 24;   // roughly 40fps sustained
  let probing = true;
  let last = started;
  const deltas: number[] = [];

  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    removeEventListener('resize', onResize);
    io.disconnect();
    canvas.remove();
    g.getExtension('WEBGL_lose_context')?.loseContext();
  }

  function frame(now: number) {
    raf = 0;
    if (!visible) return;

    if (probing) {
      const elapsed = now - started;
      if (elapsed > WARMUP_MS) deltas.push(now - last);
      if (elapsed > PROBE_END_MS) {
        const sorted = deltas.slice().sort((a, b) => a - b);
        const median = sorted.length ? sorted[Math.floor(sorted.length / 2)] : Infinity;
        // Too few samples means the device never got near a normal frame rate at all.
        if (sorted.length < 8 || median > MAX_MEDIAN_MS) { stop(); return; }
        probing = false;
        canvas.classList.add('is-lit');
      }
    }
    last = now;

    g.uniform1f(uTime, (now - started) / 1000);
    g.drawArrays(g.TRIANGLE_STRIP, 0, 4);
    raf = requestAnimationFrame(frame);
  }

  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); stop(); });

  // Nothing runs while the surface is off screen.
  const io = new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    if (visible && !raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
    else if (!visible && raf) { cancelAnimationFrame(raf); raf = 0; }
  }, { rootMargin: '10% 0px' });
  io.observe(host);
}

export function initLight() {
  if (reduce()) return;
  const tier = document.documentElement.dataset.tier;
  // The in-app browser and anything without a working GPU keep the photograph, which is the
  // designed experience there, not a downgrade.
  if (tier === 'in_app' || tier === 'css' || tier === 'rest') return;

  document.querySelectorAll<HTMLElement>('[data-light]').forEach((host) => {
    if (host.querySelector('.light-field')) return;
    const mode = (host.dataset.light || 'C') as Mode;
    if (!(mode in AMPLITUDE)) return;
    startField(host, mode);
  });
}
