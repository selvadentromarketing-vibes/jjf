(() => {
"use strict";

// Copy, project data and list markup live in content.js (loaded first).
const { I18N, projects, projectsMarkup, faqsMarkup } = window.JJF_CONTENT;

// ================== Helpers ==================
const SUPPORTED = ["es", "en"];
const root = document.documentElement;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
const isDesktop = window.matchMedia("(min-width: 1024px)");
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
const pad = (n) => String(n).padStart(2, "0");
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

const header = $("#site-header");
const hero = $("#hero");
const heroMedia = $(".hero-media");
const heroContent = $(".hero-content");
const progressBar = $(".scroll-progress span");
const projectList = $("#project-list");
const stage = $("#project-stage");
const faqList = $("#faq-list");
const marquee = $(".marquee");
const marqueeTrack = $(".marquee-track");
const menu = $("#mobile-menu");
const menuToggle = $("#menu-toggle");
const modal = $("#modal");
const bookingFrame = $("#booking-frame");
const langHint = $(".lang-hint");
const darkSections = [hero, $("#projects"), $("#contact"), $("footer")];

let currentLang = "es";
let menuOpen = false;

// ================== Render ==================
// The projects + FAQ lists ship prerendered in index.html (scripts/prerender.mjs);
// only render them here if that markup is missing. The stage and marquee are decoration.
function renderDynamic() {
  if (!projectList.children.length) projectList.innerHTML = projectsMarkup(() => "");
  if (!faqList.children.length) faqList.innerHTML = faqsMarkup(() => "");

  stage.innerHTML = `
    <div class="stage-slides">
      ${projects
        .map(
          (p, i) => `
        <figure class="stage-slide${i === 0 ? " is-open" : ""}">
          <div class="stage-zoom"><img src="${p.img}" alt="" width="${p.w}" height="${p.h}" loading="lazy" decoding="async" /></div>
        </figure>`
        )
        .join("")}
    </div>
    <div class="stage-ui">
      <p class="stage-count"><span class="stage-count-current"><span>01</span></span><span class="stage-count-total">/ ${pad(projects.length)}</span></p>
      <div class="stage-bars">${projects.map((_, i) => `<span${i === 0 ? ' class="is-active"' : ""}></span>`).join("")}</div>
    </div>`;

  const group = projects.map((p) => `<span class="marquee-item">${p.name.en}</span><span class="marquee-sep"></span>`).join("");
  marqueeTrack.innerHTML = `<div class="marquee-group">${group}</div><div class="marquee-group">${group}</div>`;
}

// ================== Split text ==================
// "mask": every word becomes .w > .w-i so it can rise out of its own mask.
// "scrub": plain .sw spans whose opacity is driven by scroll position.
// A no-break space (&nbsp;) keeps two words in one span, so they never wrap apart.
function splitText(el, mode) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  const words = [];
  for (const node of nodes) {
    const frag = document.createDocumentFragment();
    for (const part of node.nodeValue.split(/([^\S ]+)/)) {
      if (!part) continue;
      if (/^[^\S ]+$/.test(part)) {
        frag.append(" ");
        continue;
      }
      const word = document.createElement("span");
      if (mode === "scrub") {
        word.className = "sw";
        word.textContent = part;
      } else {
        word.className = "w";
        const inner = document.createElement("span");
        inner.className = "w-i";
        inner.style.setProperty("--i", words.length);
        inner.textContent = part;
        word.append(inner);
      }
      words.push(word);
      frag.append(word);
    }
    node.replaceWith(frag);
  }
  return words;
}

// ================== Language ==================
let scrubEl = null;
let scrubWords = [];
let litCount = 0;

function applyLang(lang) {
  if (!SUPPORTED.includes(lang)) lang = "es";
  currentLang = lang;
  const dict = I18N[lang];

  $$("[data-i18n]").forEach((el) => {
    const val = dict[el.dataset.i18n];
    if (val === undefined) return;
    if (el.tagName === "META") {
      el.setAttribute("content", val);
      return;
    }
    el.innerHTML = val;
    if (el.hasAttribute("data-split")) splitText(el, "mask");
    else if (el.hasAttribute("data-scrub")) {
      // Keep the lit share across a language switch: new spans are born lit, so nothing re-fades
      const ratio = scrubWords.length ? litCount / scrubWords.length : 0;
      scrubWords = splitText(el, "scrub");
      litCount = Math.round(ratio * scrubWords.length);
      scrubWords.forEach((w, i) => i < litCount && w.classList.add("is-lit"));
    }
  });
  $$("[data-i18n-aria]").forEach((el) => {
    const val = dict[el.dataset.i18nAria];
    if (val) el.setAttribute("aria-label", val);
  });
  $$("[data-i18n-alt]").forEach((el) => {
    const val = dict[el.dataset.i18nAlt];
    if (val) el.alt = val;
  });

  if (dict["meta.title"]) document.title = dict["meta.title"];
  if (bookingFrame) bookingFrame.setAttribute("title", dict["cta.schedule"]);
  menuToggle.setAttribute("aria-label", dict[menuOpen ? "menu.close" : "menu.open"]);

  root.lang = lang;
  $$(".lang-toggle").forEach((t) => (t.dataset.active = lang));
  $$(".lang-btn").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
  requestFrame();
}

const saveLang = (lang) => {
  try { localStorage.setItem("jjf-lang", lang); } catch (e) {}
};

function switchLang(lang) {
  hideLangHint();
  if (lang === currentLang) return;
  saveLang(lang);
  // Shareable URL per language: "/" is Spanish, "?lang=en" is English
  const url = new URL(location.href);
  if (lang === "es") url.searchParams.delete("lang");
  else url.searchParams.set("lang", lang);
  history.replaceState(history.state, "", url);
  // Cross-fade the text swap where View Transitions are supported
  if (document.startViewTransition && !reduceMotion.matches) document.startViewTransition(() => applyLang(lang));
  else applyLang(lang);
}

// "/" always renders Spanish (what crawlers index); English comes from ?lang=en or a saved choice.
function initialLang() {
  const param = new URLSearchParams(location.search).get("lang");
  if (SUPPORTED.includes(param)) {
    saveLang(param);
    return { lang: param, explicit: true };
  }
  try {
    const saved = localStorage.getItem("jjf-lang");
    if (SUPPORTED.includes(saved)) return { lang: saved, explicit: true };
  } catch (e) {}
  return { lang: "es", explicit: false };
}

// First-time visitors whose browser prefers English get a one-tap hint instead of an auto-switch.
let hintTimer = 0;
function showLangHint() {
  if (!langHint) return;
  langHint.hidden = false;
  requestAnimationFrame(() => langHint.classList.add("is-visible"));
  hintTimer = setTimeout(hideLangHint, 9000);
}
function hideLangHint() {
  if (!langHint || langHint.hidden) return;
  clearTimeout(hintTimer);
  langHint.classList.remove("is-visible");
  setTimeout(() => (langHint.hidden = true), 400);
}

// ================== Scroll reveals ==================
const PENDING = "[data-reveal]:not(.is-in), [data-split]:not(.is-in)";

function initReveals() {
  const targets = $$("[data-reveal], [data-split]").filter((el) => !hero.contains(el));
  if (reduceMotion.matches || !("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("is-in"));
    return;
  }

  const reveal = (el, delay) => {
    el.style.setProperty("--d", `${delay}ms`);
    el.classList.add("is-in");
    // Counters start once their own staggered reveal begins (they read the final value until then)
    el.querySelectorAll("[data-count]").forEach((c) => {
      c.textContent = "0";
      setTimeout(() => countUp(c), delay + 120);
    });
    io.unobserve(el);
  };

  // Elements entering together cascade in DOM order; a lone element reveals at once.
  const io = new IntersectionObserver(
    (entries) => {
      entries
        .filter((e) => e.isIntersecting)
        .map((e) => e.target)
        .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
        .forEach((el, i) => reveal(el, Math.min(i, 6) * 90));
    },
    { rootMargin: "0px 0px -8% 0px" }
  );
  targets.forEach((el) => io.observe(el));

  // Keyboard focus reveals its (still hidden) container immediately
  document.addEventListener("focusin", (e) => {
    for (let el = e.target.closest(PENDING); el; el = el.parentElement && el.parentElement.closest(PENDING)) {
      reveal(el, 0);
    }
  });
}

function countUp(el) {
  const target = parseInt(el.dataset.count, 10);
  const start = performance.now();
  const duration = 1600;
  const tick = (now) => {
    const t = clamp((now - start) / duration, 0, 1);
    el.textContent = String(Math.round(target * (1 - Math.pow(1 - t, 3))));
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// ================== Scroll-linked effects (one rAF loop) ==================
const inView = new Set();
const viewIO = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => (e.isIntersecting ? inView.add(e.target) : inView.delete(e.target)));
    requestFrame();
  },
  { rootMargin: "20% 0px" }
);

let parallaxEls = [];
let vh = window.innerHeight;
let heroH = hero.offsetHeight;
let marqueeW = 0;
let lastY = window.scrollY;
let anchorY = lastY;
let lastDir = 0;
let ticking = false;
let headerPinned = false;
let pinTimer = 0;

const measure = () => {
  vh = window.innerHeight;
  heroH = hero.offsetHeight;
  marqueeW = marqueeTrack.firstElementChild ? marqueeTrack.firstElementChild.offsetWidth : 0;
};

function requestFrame() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(frame);
}

function frame() {
  ticking = false;
  const y = window.scrollY;
  const motion = !reduceMotion.matches;

  // Reads first…
  const maxScroll = Math.max(1, root.scrollHeight - vh);
  const parallax = motion
    ? parallaxEls
        .filter((el) => inView.has(el))
        .map((el) => {
          const r = el.getBoundingClientRect();
          return [el.firstElementChild, (r.top + r.height / 2 - vh / 2) * -parseFloat(el.dataset.parallax)];
        })
    : [];
  let scrub = null;
  if (scrubEl && inView.has(scrubEl)) {
    // Fully lit by the time the whole paragraph is on screen
    const r = scrubEl.getBoundingClientRect();
    const start = vh * 0.9;
    scrub = clamp((start - r.top) / Math.max(1, start - vh + r.height), 0, 1);
  }
  let stageShift = null;
  if (motion && activeProject >= 0 && inView.has(stage)) {
    const r = articles[activeProject].getBoundingClientRect();
    stageShift = (0.5 - clamp((vh / 2 - r.top) / r.height, 0, 1)) * 7;
  }
  const onDark = darkSections.some((s) => {
    const r = s.getBoundingClientRect();
    return r.top <= 40 && r.bottom > 40;
  });

  // …then writes
  header.classList.toggle("on-dark", onDark);
  updateHeader(y);
  progressBar.style.transform = `scaleX(${(y / maxScroll).toFixed(4)})`;
  if (motion && y <= heroH) {
    heroMedia.style.transform = `translate3d(0, ${(y * 0.35).toFixed(1)}px, 0)`;
    heroContent.style.transform = `translate3d(0, ${(y * 0.18).toFixed(1)}px, 0)`;
    heroContent.style.opacity = clamp(1 - y / (heroH * 0.7), 0, 1).toFixed(3);
  }
  parallax.forEach(([child, offset]) => {
    child.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
  });
  if (scrub !== null) {
    const lit = Math.round(scrub * scrubWords.length);
    if (lit !== litCount) {
      scrubWords.forEach((w, i) => w.classList.toggle("is-lit", i < lit));
      litCount = lit;
    }
  }
  if (stageShift !== null) {
    slides[activeProject].img.style.transform = `translate3d(0, ${stageShift.toFixed(2)}%, 0)`;
  }
  // The marquee moves with the scroll (never on its own), so it stops whenever the reader does
  if (motion && marqueeW && inView.has(marquee)) {
    marqueeTrack.style.transform = `translate3d(${(-((y * 0.35) % marqueeW)).toFixed(1)}px, 0, 0)`;
  }
  if (y > heroH * 0.5) hideLangHint();
  lastY = y;
}

const headerHasFocus = () => {
  const el = document.activeElement;
  try {
    return !!el && header.contains(el) && el.matches(":focus-visible");
  } catch (e) {
    return false;
  }
};

// Solid once scrolled; hides while scrolling down, returns on the way up.
function updateHeader(y) {
  header.classList.toggle("is-top", y < 40);
  const dir = y > lastY ? 1 : y < lastY ? -1 : lastDir;
  if (dir !== lastDir) {
    anchorY = lastY;
    lastDir = dir;
  }
  // A jump (scroll restoration, find-in-page, scrollbar drag) is not "scrolling down"
  if (Math.abs(y - lastY) > vh) anchorY = y;
  if (menuOpen || headerPinned || y < heroH * 0.6 || headerHasFocus()) {
    header.classList.remove("is-hidden");
    anchorY = y;
  } else if (dir > 0 && y - anchorY > 80) header.classList.add("is-hidden");
  else if (dir < 0 && anchorY - y > 40) header.classList.remove("is-hidden");
}

// Keep the header in place while we scroll the page for the visitor (anchor links, arrival)
function pinHeader(ms) {
  headerPinned = true;
  header.classList.remove("is-hidden");
  clearTimeout(pinTimer);
  pinTimer = setTimeout(() => (headerPinned = false), ms);
}

// ================== In-page links ==================
// Smooth-scroll to #sections, move focus there (keyboard/screen readers), keep the URL in sync.
function initAnchors() {
  document.addEventListener("click", (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const link = e.target.closest('a[href^="#"]');
    if (!link || link.hasAttribute("data-cta")) return;
    const id = decodeURIComponent(link.getAttribute("href").slice(1));
    const target = id && document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    if (menuOpen) setMenu(false);
    if (location.hash !== `#${id}`) history.pushState(null, "", `#${id}`);
    pinHeader(1600);
    target.scrollIntoView({ behavior: reduceMotion.matches ? "auto" : "smooth", block: "start" });
    if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
  });
}

// Web fonts land after the browser has already jumped to a #section (or restored the scroll
// position), shifting the target. Re-align once, unless the visitor has started scrolling.
let userScrolled = false;
["wheel", "touchstart", "keydown", "pointerdown"].forEach((type) =>
  window.addEventListener(type, () => (userScrolled = true), { once: true, passive: true })
);
function settleArrival() {
  if (userScrolled) return;
  const id = decodeURIComponent(location.hash.slice(1));
  const target = id && document.getElementById(id);
  if (target) target.scrollIntoView({ behavior: "instant", block: "start" });
  lastY = anchorY = window.scrollY;
  lastDir = 0;
  header.classList.remove("is-hidden");
}

// ================== Projects: sticky stage follows the active row ==================
let articles = [];
let slides = [];
let activeProject = -1;
let zTop = 1;

// Index of the element crossing the reading line (45.5% down the viewport), from live geometry
const bandIndex = (els) => {
  const mid = window.innerHeight * 0.455;
  return els.findIndex((el) => {
    const r = el.getBoundingClientRect();
    return r.height > 0 && r.top <= mid && r.bottom > mid;
  });
};

function initProjects() {
  articles = $$(".project", projectList);
  slides = $$(".stage-slide", stage).map((el) => ({ el, img: $("img", el) }));
  const counter = $(".stage-count-current", stage);
  const bars = $$(".stage-bars span", stage);

  // Re-arm a slide at its closed state (no transition), stack it on top, then open it.
  const show = (slide, from, animate) => {
    slide.classList.add("is-resetting");
    slide.classList.remove("is-open");
    slide.dataset.from = from;
    slide.style.zIndex = ++zTop;
    void slide.offsetWidth;
    if (animate) slide.classList.remove("is-resetting");
    slide.classList.add("is-open");
    if (!animate) requestAnimationFrame(() => slide.classList.remove("is-resetting"));
  };

  const setActive = (i) => {
    if (i === activeProject) return;
    const prev = activeProject;
    activeProject = i;
    counter.innerHTML = `<span>${pad(i + 1)}</span>`;
    bars.forEach((b, j) => b.classList.toggle("is-active", j <= i));
    if (prev === -1) {
      if (i !== 0) show(slides[i].el, "bottom", false);
    } else {
      show(slides[i].el, i > prev ? "bottom" : "top", !reduceMotion.matches);
    }
    requestFrame();
  };

  // Enter/leave events are only a trigger; the active row is re-resolved from geometry each time,
  // so a jump that lands between two rows can't leave a stale selection behind.
  const io = new IntersectionObserver(
    () => {
      const i = bandIndex(articles);
      if (i >= 0) setActive(i);
    },
    { rootMargin: "-45% 0px -54% 0px" }
  );
  articles.forEach((a) => io.observe(a));
}

// ================== Header nav: highlight the section in view ==================
function initScrollSpy() {
  const links = $$("[data-nav-link]");
  const sections = $$("[data-nav]");
  const io = new IntersectionObserver(
    () => {
      const section = sections[bandIndex(sections)];
      if (!section) return;
      links.forEach((a) => {
        const current = a.dataset.navLink === section.dataset.nav;
        a.classList.toggle("is-current", current);
        if (current) a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
      });
    },
    { rootMargin: "-45% 0px -54% 0px" }
  );
  sections.forEach((s) => io.observe(s));
}

// ================== Scroll lock (menu + modal) ==================
const lockScroll = (lock) => root.classList.toggle("is-locked", lock);

// ================== Mobile menu ==================
let menuCloseTimer = 0;

function setMenu(open) {
  if (open === menuOpen) return;
  menuOpen = open;
  clearTimeout(menuCloseTimer);
  root.classList.toggle("menu-open", open);
  // Hold the header's menu styling until the panel has wiped off the header strip
  if (!open && !reduceMotion.matches) {
    root.classList.add("menu-closing");
    menuCloseTimer = setTimeout(() => root.classList.remove("menu-closing"), 600);
  } else {
    root.classList.remove("menu-closing");
  }
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", I18N[currentLang][open ? "menu.close" : "menu.open"]);
  menu.inert = !open;
  $("main").inert = open;
  $("footer").inert = open;
  lockScroll(open || modal.open);
  if (open) {
    hideLangHint();
    header.classList.remove("is-hidden");
    setTimeout(() => menuOpen && $("a", menu).focus({ preventScroll: true }), 400);
  }
}

function initMenu() {
  menuToggle.addEventListener("click", () => setMenu(!menuOpen));
  // In-menu #links are handled by initAnchors (which closes the menu); CTAs open the modal,
  // which closes the menu too.
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menuOpen) {
      setMenu(false);
      menuToggle.focus();
    }
  });
  isDesktop.addEventListener("change", (e) => e.matches && setMenu(false));
}

// ================== Contact modal (GHL calendar in a native <dialog>) ==================
let lastFocus = null;
let closeCleanup = null;

function openModal() {
  if (menuOpen) setMenu(false);
  if (modal.open) {
    // Clicked again while it animates out: cancel the close and play the entrance again
    if (modal.classList.contains("is-closing")) {
      if (closeCleanup) closeCleanup();
      modal.classList.remove("is-closing");
    }
    return;
  }
  if (bookingFrame && !bookingFrame.src) bookingFrame.src = bookingFrame.dataset.src;
  lastFocus = document.activeElement;
  modal.showModal();
  lockScroll(true);
}

function closeModal() {
  if (!modal.open || modal.classList.contains("is-closing")) return;
  if (reduceMotion.matches) {
    modal.close();
    return;
  }
  const panel = $(".modal-panel", modal);
  let timer = 0;
  const onEnd = (e) => e.target === panel && done();
  const cleanup = () => {
    clearTimeout(timer);
    panel.removeEventListener("animationend", onEnd);
    closeCleanup = null;
  };
  const done = () => {
    const stillClosing = modal.classList.contains("is-closing");
    cleanup();
    if (modal.open && stillClosing) modal.close();
  };
  timer = setTimeout(done, 500);
  panel.addEventListener("animationend", onEnd);
  closeCleanup = cleanup;
  modal.classList.add("is-closing");
}

function initModal() {
  document.addEventListener("click", (e) => {
    if (!e.target.closest("[data-cta]")) return;
    e.preventDefault();
    openModal();
  });
  $("#modal-close").addEventListener("click", closeModal);
  // Close on a real backdrop click only (not a drag that started inside the panel)
  let downOnBackdrop = false;
  modal.addEventListener("pointerdown", (e) => (downOnBackdrop = e.target === modal));
  modal.addEventListener("click", (e) => {
    if (e.target === modal && downOnBackdrop) closeModal();
    downOnBackdrop = false;
  });
  modal.addEventListener("cancel", (e) => {
    e.preventDefault();
    closeModal();
  });
  modal.addEventListener("close", () => {
    if (closeCleanup) closeCleanup();
    modal.classList.remove("is-closing");
    lockScroll(menuOpen);
    // Focus goes back to the trigger — or the menu button if the trigger now sits in an inert menu
    const target = lastFocus && !lastFocus.closest("[inert]") ? lastFocus : menuToggle;
    target.focus({ preventScroll: true });
  });
  bookingFrame?.addEventListener("load", () => {
    if (bookingFrame.src) bookingFrame.parentElement.classList.add("is-ready");
  });
}

// ================== FAQ accordion (animates both open and close) ==================
function initFaq() {
  faqList.addEventListener("click", (e) => {
    const summary = e.target.closest("summary");
    if (!summary) return;
    e.preventDefault();
    const item = summary.parentElement;
    const answer = $(".faq-a", item);
    if (item.classList.contains("is-open")) {
      item.classList.remove("is-open");
      const done = () => {
        clearTimeout(timer);
        answer.removeEventListener("transitionend", onEnd);
        if (!item.classList.contains("is-open")) item.open = false;
      };
      const onEnd = (ev) => ev.target === answer && ev.propertyName === "grid-template-rows" && done();
      const timer = setTimeout(done, 700);
      answer.addEventListener("transitionend", onEnd);
    } else {
      item.open = true;
      void answer.offsetHeight; // commit the collapsed state so the height transition runs
      item.classList.add("is-open");
    }
  });
  // Keep the class in sync when the browser opens an item itself (e.g. find-in-page)
  faqList.addEventListener(
    "toggle",
    (e) => e.target.open && e.target.classList.add("is-open"),
    true
  );
}

// ================== Magnetic buttons (fine pointers only) ==================
function initMagnetic() {
  if (!finePointer.matches || reduceMotion.matches) return;
  $$("[data-magnetic]").forEach((el) => {
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) * 0.15;
      const y = (e.clientY - r.top - r.height / 2) * 0.3;
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    });
    el.addEventListener("pointerleave", () => (el.style.transform = ""));
  });
}

// ================== Hero intro ==================
function startIntro() {
  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
  Promise.race([fontsReady, new Promise((r) => setTimeout(r, 1200))]).then(() =>
    requestAnimationFrame(() => root.classList.add("is-loaded"))
  );
  fontsReady.then(() => {
    measure();
    requestAnimationFrame(settleArrival);
  });
  window.addEventListener("load", () => requestAnimationFrame(settleArrival), { once: true });
}

// ================== Init ==================
renderDynamic();
scrubEl = $("[data-scrub]");

const start = initialLang();
applyLang(start.lang);

initReveals();
parallaxEls = $$("[data-parallax]");
[...parallaxEls, scrubEl, stage, marquee].forEach((el) => el && viewIO.observe(el));
initProjects();
initScrollSpy();
initAnchors();
initMenu();
initModal();
initFaq();
initMagnetic();

$$(".lang-btn").forEach((btn) => btn.addEventListener("click", () => switchLang(btn.dataset.lang)));
if (langHint) langHint.addEventListener("click", () => switchLang("en"));
if (!start.explicit && start.lang === "es" && /^en\b/i.test(navigator.language || "")) {
  setTimeout(() => window.scrollY < heroH * 0.5 && !menuOpen && showLangHint(), 1800);
}
$$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

window.addEventListener("scroll", requestFrame, { passive: true });
window.addEventListener("resize", () => {
  measure();
  requestFrame();
});

measure();
requestFrame();
startIntro();
window.__jjfReady = true;
})();
