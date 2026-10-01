// ================== Motion: cursor, hover and scroll details ==================
// Layered on top of main.js (uses $, $$, I18N, currentLang, reducedMotion):
// - headings that rise word by word (one-word titles, letter by letter);
// - a ripple, like a stone dropped in a cenote, wherever you click or tap;
// - with a mouse or trackpad: a cursor of our own (a dot and a trailing ring that grows over
//   anything clickable and carries a word where it helps), buttons that lean toward the
//   pointer and fill from the side it came in, fireflies that follow the pointer through the
//   dark jungle sections, palm shadows that drift with the pointer like wind, project photos
//   that tilt toward it and catch the light, and a footer wordmark lit by it.
// The scroll-linked parts (sections opening out, the plan unrolling, photos drifting) are pure
// CSS (animation-timeline) in src/input.css. "Reduce motion" turns all of it off.
(() => {
  if (reducedMotion) return;
  const html = document.documentElement;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const DARK = ".on-dark, .hero, .bk-side";

  Object.assign(I18N.es, { "cur.view": "Ver", "cur.visit": "Visitar ↗", "cur.scroll": "Desliza ↓", "fx.away": "La selva te espera · JJF Creando" });
  Object.assign(I18N.en, { "cur.view": "View", "cur.visit": "Visit ↗", "cur.scroll": "Scroll ↓", "fx.away": "The jungle is waiting · JJF Creando" });
  const t = (k) => (I18N[currentLang] || I18N.es)[k] || "";

  // ---------- headings: word by word ----------
  // Each word sits in a clipping box and rises into place when main.js marks the heading .is-in.
  function split(el) {
    if (el.querySelector(".w")) return;
    const text = el.textContent.trim();
    const letters = !/\s/.test(text) && text.length <= 14;
    let i = 0;
    const box = (s) => {
      const w = document.createElement("span");
      const inner = document.createElement("span");
      w.className = "w";
      inner.textContent = s;
      inner.style.setProperty("--i", i++);
      w.appendChild(inner);
      return w;
    };
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 1) { if (n.tagName !== "BR") walk(n); return; }
        if (n.nodeType !== 3 || !n.textContent) return;
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) frag.appendChild(document.createTextNode(part));
          else if (letters) [...part].forEach((c) => frag.appendChild(box(c)));
          else frag.appendChild(box(part));
        });
        n.replaceWith(frag);
      });
    };
    walk(el);
    el.classList.add("split");
  }
  const splitAll = () => $$(".display.reveal").forEach((el) => { if (!el.closest(".hero")) split(el); });
  splitAll();

  // ---------- cenote ripple on click / tap ----------
  document.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (e.target.closest("input, textarea, select, [contenteditable]")) return;
    const r = document.createElement("span");
    r.className = `fx-ripple${e.target.closest(DARK) ? " is-dark" : ""}`;
    r.style.left = `${e.clientX}px`;
    r.style.top = `${e.clientY}px`;
    r.innerHTML = "<i></i><i></i><i></i>";
    document.body.appendChild(r);
    setTimeout(() => r.remove(), 1700);
  }, { passive: true });

  // ---------- the tab calls you back ----------
  let awayTitle = "";
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { awayTitle = document.title; document.title = t("fx.away"); }
    else if (awayTitle) { document.title = awayTitle; awayTitle = ""; }
  });

  if (!fine) {
    document.addEventListener("jjf:lang", splitAll);
    return;
  }

  // ======== mouse / trackpad only ========
  html.classList.add("fx-fine");
  let mx = -100, my = -100, seen = false, dark = false;

  // ---------- cursor ----------
  const cur = document.createElement("div");
  cur.className = "cur";
  cur.setAttribute("aria-hidden", "true");
  cur.innerHTML = '<span class="cur-ring"></span><span class="cur-dot"></span><span class="cur-label"></span>';
  document.body.appendChild(cur);
  const [ring, dot, label] = cur.children;
  let rx = mx, ry = my;
  const CLICKABLE = "a, button, summary, label, select, [role='button'], .bk-day, .bk-time";
  const TEXT = "input:not([type='checkbox']):not([type='radio']), textarea, [contenteditable]";
  // [selector, label key]; an empty key keeps the cursor quiet (the partner index has its own preview)
  const LABELS = [["#project-index [data-preview]", ""], ["a.frame[target='_blank']", "cur.visit"], ["a.zoom", "cur.view"]];

  function setState(target) {
    if (!target || !target.closest) return;
    dark = !!target.closest(DARK);
    const text = target.closest(TEXT);
    const hit = !text && target.closest(CLICKABLE);
    let key = null;
    for (const [sel, k] of LABELS) if (target.closest(sel)) { key = k; break; }
    const hint = key === null && !hit && !!target.closest("[data-hero]") && window.scrollY < window.innerHeight * 0.4;
    cur.classList.toggle("is-dark", dark);
    cur.classList.toggle("is-text", !!text);
    cur.classList.toggle("is-hover", !!hit && key === null);
    cur.classList.toggle("is-label", !!key);
    cur.classList.toggle("is-quiet", key === "");
    cur.classList.toggle("is-hint", hint);
    if (key) label.textContent = t(key);
    else if (hint) label.textContent = t("cur.scroll");
  }

  window.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") { cur.classList.remove("is-on"); seen = false; return; }
    mx = e.clientX; my = e.clientY;
    if (!seen) { seen = true; rx = mx; ry = my; cur.classList.add("is-on"); }
    if (dark) flies.move(mx, my);
    magnet(e);
    tilt(e);
    kick();
  }, { passive: true });
  document.addEventListener("pointerover", (e) => { if (e.pointerType !== "touch") setState(e.target); }, { passive: true });
  document.addEventListener("pointerout", (e) => {
    if (e.relatedTarget) return;
    cur.classList.remove("is-on"); seen = false; flies.leave();
    magnet(null); tilt(null);
  });
  window.addEventListener("pointerdown", () => cur.classList.add("is-down"), { passive: true });
  window.addEventListener("pointerup", () => cur.classList.remove("is-down"), { passive: true });
  window.addEventListener("blur", () => { cur.classList.remove("is-on"); seen = false; });
  // Scrolling moves the page under a still pointer: re-read what it is over
  let rescan = false;
  window.addEventListener("scroll", () => { rescan = true; kick(); }, { passive: true });

  // ---------- magnetic buttons, filled from the side the pointer came in ----------
  let magBtn = null;
  const local = (el, e) => { const r = el.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top, r]; };
  function magnet(e) {
    const b = e && e.target.closest ? e.target.closest(".btn") : null;
    const next = b && !b.closest("#booking") ? b : null;
    if (next !== magBtn) {
      if (magBtn) {
        if (e) { const [x, y] = local(magBtn, e); magBtn.style.setProperty("--fx", `${x}px`); magBtn.style.setProperty("--fy", `${y}px`); }
        magBtn.classList.remove("is-mag", "is-fill");
        magBtn.style.setProperty("--mgx", "0px");
        magBtn.style.setProperty("--mgy", "0px");
      }
      magBtn = next;
      if (magBtn) {
        const [x, y] = local(magBtn, e);
        magBtn.style.setProperty("--fx", `${x}px`);
        magBtn.style.setProperty("--fy", `${y}px`);
        magBtn.classList.add("is-mag");
        requestAnimationFrame(() => magBtn && magBtn.classList.add("is-fill"));
      }
    }
    if (!magBtn) return;
    const [x, y, r] = local(magBtn, e);
    const clamp = (v, m) => Math.max(-m, Math.min(m, v));
    magBtn.style.setProperty("--mgx", `${clamp((x - r.width / 2) * 0.22, 12).toFixed(1)}px`);
    magBtn.style.setProperty("--mgy", `${clamp((y - r.height / 2) * 0.32, 8).toFixed(1)}px`);
  }

  // ---------- project photos tilt toward the pointer and catch the light ----------
  const TILT = "#partner-teaser .frame, [id^='group-'] .frame";
  let tiltEl = null;
  function tilt(e) {
    const f = e && e.target.closest ? e.target.closest(TILT) : null;
    if (f !== tiltEl) {
      if (tiltEl) { tiltEl.classList.remove("fx-tilting"); tiltEl.style.setProperty("--rx", "0deg"); tiltEl.style.setProperty("--ry", "0deg"); }
      tiltEl = f;
      if (f) f.classList.add("fx-tilting");
    }
    if (!f) return;
    const [x, y, r] = local(f, e);
    const px = x / r.width, py = y / r.height;
    f.style.setProperty("--rx", `${((0.5 - py) * 6).toFixed(2)}deg`);
    f.style.setProperty("--ry", `${((px - 0.5) * 8).toFixed(2)}deg`);
    f.style.setProperty("--sx", `${(px * 100).toFixed(1)}%`);
    f.style.setProperty("--sy", `${(py * 100).toFixed(1)}%`);
  }

  // ---------- fireflies in the dark sections ----------
  const flies = (() => {
    const cv = document.createElement("canvas");
    cv.className = "fx-flies";
    cv.setAttribute("aria-hidden", "true");
    document.body.appendChild(cv);
    const ctx = cv.getContext("2d");
    let W = 0, H = 0;
    const size = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      W = window.innerWidth; H = window.innerHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();
    window.addEventListener("resize", size);
    // One soft glow, drawn once and stamped for every firefly
    const glow = document.createElement("canvas");
    glow.width = glow.height = 64;
    const g = glow.getContext("2d");
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, "rgba(252,253,226,1)");
    grad.addColorStop(0.16, "rgba(236,242,168,0.9)");
    grad.addColorStop(0.42, "rgba(205,218,120,0.28)");
    grad.addColorStop(1, "rgba(205,218,120,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    const ps = [];
    let lx = null, ly = null, sy = window.scrollY, rest = 0;
    const spawn = (x, y, near) => {
      if (ps.length > 80) return;
      const a = Math.random() * Math.PI * 2, d = near ? 22 + Math.random() * 50 : Math.random() * 10;
      ps.push({ x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, vx: (Math.random() - 0.5) * 16, vy: -5 - Math.random() * 20,
        age: 0, life: 1.6 + Math.random() * 1.8, s: 5 + Math.random() * 7, ph: Math.random() * 6.28, f: 4 + Math.random() * 5 });
    };
    return {
      move(x, y) {
        rest = 0;
        if (lx === null) { lx = x; ly = y; return; }
        if (Math.hypot(x - lx, y - ly) > 16) { spawn(x, y, false); lx = x; ly = y; }
      },
      leave() { lx = null; },
      // → true while there is something to draw
      step(dt) {
        if (dark && seen) { rest += dt; if (rest > 0.35) { rest = 0; if (ps.length < 14) spawn(mx, my, true); } } // they gather while you rest
        const dy = window.scrollY - sy;
        sy = window.scrollY;
        ctx.clearRect(0, 0, W, H);
        if (!ps.length) return dark && seen;
        ctx.globalCompositeOperation = "lighter";
        for (let i = ps.length - 1; i >= 0; i--) {
          const p = ps[i];
          p.age += dt;
          if (p.age >= p.life) { ps.splice(i, 1); continue; }
          p.vx += Math.sin(p.ph + p.age * 2.2) * 9 * dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt - dy;
          const k = p.age / p.life;
          ctx.globalAlpha = Math.max(0, Math.min(1, k * 5) * (1 - k) * (0.55 + 0.45 * Math.sin(p.ph + p.age * p.f)));
          ctx.drawImage(glow, p.x - p.s, p.y - p.s, p.s * 2, p.s * 2);
        }
        ctx.globalAlpha = 1;
        return true;
      },
    };
  })();

  // ---------- palm shadows drift with the pointer, like wind ----------
  const sunlit = new Set();
  const sio = new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? sunlit.add(e.target) : sunlit.delete(e.target))));
  $$(".sunlit").forEach((el) => sio.observe(el));
  let wx = 0, wy = 0;

  // ---------- footer wordmark lit by the pointer ----------
  $$("[data-fm]").forEach((fm) => {
    fm.addEventListener("pointermove", (e) => {
      const [x, y] = local(fm, e);
      fm.style.setProperty("--fx", `${x}px`);
      fm.style.setProperty("--fy", `${y}px`);
      fm.classList.add("is-lit");
    });
    fm.addEventListener("pointerleave", () => fm.classList.remove("is-lit"));
  });

  // ---------- one loop for the cursor, the wind and the fireflies ----------
  let raf = 0, last = 0;
  function kick() { if (!raf) raf = requestAnimationFrame(frame); }
  function frame(now) {
    raf = 0;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    if (rescan) { rescan = false; if (seen) setState(document.elementFromPoint(mx, my)); }
    // ring trails the dot and stretches along its path
    const k = 1 - Math.pow(1.5e-6, dt);
    const vx = mx - rx, vy = my - ry;
    rx += vx * k; ry += vy * k;
    const speed = Math.hypot(vx, vy);
    const calm = cur.classList.contains("is-label") || cur.classList.contains("is-hint");
    const st = calm ? 0 : Math.min(0.32, speed / 420);
    dot.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
    ring.style.transform = `translate3d(${rx.toFixed(1)}px, ${ry.toFixed(1)}px, 0) rotate(${Math.atan2(vy, vx).toFixed(3)}rad) scale(${(1 + st).toFixed(3)}, ${(1 - st * 0.5).toFixed(3)})`;
    label.style.transform = `translate3d(${rx.toFixed(1)}px, ${ry.toFixed(1)}px, 0)`;
    // wind
    let windy = false;
    if (sunlit.size && seen) {
      const tx = mx / window.innerWidth * 2 - 1, ty = my / window.innerHeight * 2 - 1;
      const kw = 1 - Math.pow(0.02, dt);
      if (Math.abs(tx - wx) > 0.002 || Math.abs(ty - wy) > 0.002) {
        wx += (tx - wx) * kw; wy += (ty - wy) * kw;
        sunlit.forEach((el) => { el.style.setProperty("--wind-x", wx.toFixed(3)); el.style.setProperty("--wind-y", wy.toFixed(3)); });
        windy = true;
      }
    }
    const lit = flies.step(dt);
    if (speed > 0.3 || windy || lit) kick();
  }

  document.addEventListener("jjf:lang", () => { splitAll(); setState(document.elementFromPoint(mx, my)); });
})();
