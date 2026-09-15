// Per-page teardown. Astro's ClientRouter swaps the document but keeps the window, so anything a
// page script hangs on `window` or `document` — scroll listeners, observers, a WebGL context —
// outlives the page it was written for unless something releases it. Every per-page module
// registers what it owns here; the registry runs once, on the swap, and forgets.
type Teardown = () => void;
let pending: Teardown[] = [];

export function onSwap(fn: Teardown) { pending.push(fn); }

let bound = false;
export function initLifecycle() {
  if (bound) return;
  bound = true;
  document.addEventListener('astro:before-swap', () => {
    const run = pending;
    pending = [];
    for (const fn of run) { try { fn(); } catch { /* a teardown must never stop the swap */ } }
  });
}

// A listener that is released on the swap, in one line.
export function listen<K extends keyof WindowEventMap>(target: Window, type: K, fn: (ev: WindowEventMap[K]) => void, opts?: AddEventListenerOptions): void;
export function listen<K extends keyof DocumentEventMap>(target: Document, type: K, fn: (ev: DocumentEventMap[K]) => void, opts?: AddEventListenerOptions): void;
export function listen(target: EventTarget, type: string, fn: EventListener, opts?: AddEventListenerOptions): void;
export function listen(target: EventTarget, type: string, fn: any, opts?: AddEventListenerOptions) {
  target.addEventListener(type, fn, opts);
  onSwap(() => target.removeEventListener(type, fn, opts));
}
