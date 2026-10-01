// ================== Booking wizard ==================
// The site's own calendar and booking form (no third-party embed):
// 01 interest → 02 date & time → 03 details → 04 review → done.
//
// Connected to GoHighLevel through a Netlify function (netlify/functions/booking.mjs, served at
// BOOKING.endpoint) that keeps the API token on the server. Everything that talks to the outside
// world lives in getSlots() and submitBooking():
// - availability comes from the GoHighLevel calendar (its public free slots until a token is set);
// - with a token, the function books the appointment and creates/updates the contact;
// - without one, or if GoHighLevel fails, the request is kept as a Netlify form ("agenda");
// - where the function isn't served at all (a plain local server), office hours stand in.
//
// Uses globals from main.js: I18N, currentLang, $, $$, pad, reducedMotion, setMenu, WHATSAPP.
(() => {
  const BOOKING = {
    endpoint: "/api/booking",           // Netlify function; null = office-hours demo
    connected: false,                   // true once the function reports a GoHighLevel token
    officeTz: "America/Cancun",         // Tulum: UTC−5 all year, no daylight saving
    officeOffsetHours: -5,
    daysAhead: 45,
    minNoticeHours: 18,
  };

  // Demo only (no function available): office hours in Tulum time, per meeting format: [weekday 0=Sun..6=Sat] → start times
  const HOURS = {
    video: { 1: range(9, 17.5), 2: range(9, 17.5), 3: range(9, 17.5), 4: range(9, 17.5), 5: range(9, 17.5), 6: range(9, 12.5) },
    phone: { 1: range(9, 17.5), 2: range(9, 17.5), 3: range(9, 17.5), 4: range(9, 17.5), 5: range(9, 17.5), 6: range(9, 12.5) },
    visit: { 1: [9, 11, 13], 2: [9, 11, 13], 3: [9, 11, 13], 4: [9, 11, 13], 5: [9, 11, 13], 6: [9, 11] },
  };
  function range(from, to) { const r = []; for (let h = from; h <= to; h += 0.5) r.push(h); return r; }

  const INTERESTS = [
    { id: "lots", img: "assets/img/selvadentro-aerial-960.webp" },
    { id: "invest", img: "assets/img/selvadentro-masterplan-1400.webp" },
    { id: "visit", img: "assets/img/selvadentro-cenote-800.webp" },
    { id: "other", img: "assets/img/hacienda-sacala-900.webp" },
  ];
  const FORMATS = [
    { id: "video", minutes: 30 },
    { id: "phone", minutes: 30 },
    { id: "visit", minutes: 90 },
  ];
  const MINUTES = {}; // meeting length per format as the calendar reports it
  const minutesOf = (f) => MINUTES[f.id] || f.minutes;
  const COUNTRY_CODES = ["+52", "+1", "+34", "+57", "+54", "+56", "+51", "+55", "+44", "+49", "+33", "+39", "+41", "+31"];
  const COUNTRY_LABEL = { "+52": "MX", "+1": "US/CA", "+34": "ES", "+57": "CO", "+54": "AR", "+56": "CL", "+51": "PE", "+55": "BR", "+44": "UK", "+49": "DE", "+33": "FR", "+39": "IT", "+41": "CH", "+31": "NL" };
  const ZONES = ["America/Cancun", "America/Mexico_City", "America/Monterrey", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "America/Toronto", "America/Vancouver", "America/Bogota", "America/Lima", "America/Santiago", "America/Argentina/Buenos_Aires", "America/Sao_Paulo", "Europe/London", "Europe/Madrid", "Europe/Paris", "Europe/Berlin", "Europe/Zurich"];

  // ---------- copy ----------
  const COPY = {
    es: {
      "bk.eyebrow": "Agenda",
      "bk.sideTitle": "Una conversación, <em>sin prisa.</em>",
      "bk.sideBody": "Elige el momento y te contamos todo sobre Selvadentro, con el plano en la mano.",
      "bk.trust1": "Respuesta en menos de 24 horas",
      "bk.trust2": "En español o en inglés",
      "bk.trust3": "Sin compromiso",
      "bk.step1": "Tu interés", "bk.step2": "Día y hora", "bk.step3": "Tus datos", "bk.step4": "Confirmación",
      "bk.stepOf": "Paso {n} de 4",
      "bk.close": "Cerrar", "bk.back": "Atrás", "bk.next": "Continuar", "bk.confirm": "Confirmar cita", "bk.sending": "Enviando…",
      "bk.s1.title": "¿Qué te gustaría <em>explorar?</em>",
      "bk.s1.body": "Así preparamos la conversación para ti.",
      "bk.i.lots": "Lotes en Selvadentro", "bk.i.lots.d": "Elegir lote y ver disponibilidad",
      "bk.i.invest": "Inversión", "bk.i.invest.d": "Plusvalía y plan de pagos a 48 meses",
      "bk.i.visit": "Visita privada", "bk.i.visit.d": "Recorrer la selva y los cenotes en Tulum",
      "bk.i.other": "Otra consulta", "bk.i.other.d": "Proyectos aliados, construcción u otro tema",
      "bk.s1.format": "¿Cómo prefieres reunirte?",
      "bk.f.video": "Videollamada", "bk.f.phone": "Llamada", "bk.f.visit": "En persona, en Tulum",
      "bk.minutes": "{n} min",
      "bk.s1.visitNote": "Te recibimos en Selvadentro. Al confirmar te enviamos la ubicación exacta.",
      "bk.s2.title": "Elige <em>día y hora</em>",
      "bk.s2.body": "{format} · {n} minutos",
      "bk.tz": "Zona horaria",
      "bk.tulumZone": "Tulum (hora local)",
      "bk.pickDay": "Elige un día para ver los horarios disponibles.",
      "bk.noSlots": "Ya no quedan horarios ese día. Prueba con otro.",
      "bk.loading": "Cargando horarios…",
      "bk.morning": "Mañana", "bk.afternoon": "Tarde", "bk.evening": "Noche",
      "bk.tulumTime": "Son las {time} en Tulum.",
      "bk.prevMonth": "Mes anterior", "bk.nextMonth": "Mes siguiente",
      "bk.s3.title": "¿Cómo te <em>contactamos?</em>",
      "bk.s3.body": "Te enviaremos la confirmación y los detalles de la reunión.",
      "bk.fl.first": "Nombre", "bk.fl.last": "Apellido", "bk.fl.email": "Correo electrónico",
      "bk.fl.phone": "WhatsApp o teléfono", "bk.fl.cc": "Código de país", "bk.fl.lang": "Idioma de la reunión",
      "bk.fl.msg": "¿Algo que debamos saber? (opcional)",
      "bk.fl.msgPh": "Presupuesto, tamaño de lote, fechas de tu viaje…",
      "bk.fl.consent": "Acepto que JJF Creando me contacte sobre esta solicitud.",
      "bk.e.required": "Este dato es necesario.",
      "bk.e.email": "Revisa el correo.",
      "bk.e.phone": "Revisa el número.",
      "bk.e.consent": "Necesitamos tu autorización para contactarte.",
      "bk.s4.title": "Revisa y <em>confirma</em>",
      "bk.s4.body": "Un último vistazo antes de agendar.",
      "bk.r.when": "Cuándo", "bk.r.format": "Formato", "bk.r.interest": "Interés", "bk.r.contact": "Contacto",
      "bk.edit": "Cambiar",
      "bk.error": "No pudimos enviar tu solicitud. Inténtalo de nuevo o escríbenos por WhatsApp.",
      "bk.done.title": "Te esperamos, <em>{name}.</em>",
      "bk.done.body": "Recibimos tu solicitud para el {when} y te escribiremos a {email} para confirmar los detalles.",
      "bk.done.booked": "Tu cita quedó agendada para el {when} y te enviaremos la confirmación a {email}.",
      "bk.taken": "Alguien acaba de reservar ese horario. Elige otro, por favor.",
      "bk.slotsError": "No pudimos cargar los horarios en este momento.",
      "bk.retry": "Intentar de nuevo",
      "bk.done.gcal": "Añadir a Google Calendar",
      "bk.done.ics": "Apple u Outlook (.ics)",
      "bk.done.wa": "Escribir por WhatsApp",
      "bk.done.close": "Volver al sitio",
      "bk.ev.title": "{format} con JJF Creando",
      "bk.ev.loc.video": "Videollamada (te enviaremos el enlace)",
      "bk.ev.loc.phone": "Llamada telefónica",
      "bk.ev.loc.visit": "Selvadentro, Tulum, Quintana Roo",
      "bk.wa.text": "Hola, acabo de agendar en jjfcreando.com: {format}, {when}. Interés: {interest}. — {name}",
    },
    en: {
      "bk.eyebrow": "Book a call",
      "bk.sideTitle": "A conversation, <em>unhurried.</em>",
      "bk.sideBody": "Pick a time and we’ll walk you through Selvadentro, plan in hand.",
      "bk.trust1": "Reply within 24 hours",
      "bk.trust2": "In Spanish or English",
      "bk.trust3": "No commitment",
      "bk.step1": "Your interest", "bk.step2": "Date & time", "bk.step3": "Your details", "bk.step4": "Confirmation",
      "bk.stepOf": "Step {n} of 4",
      "bk.close": "Close", "bk.back": "Back", "bk.next": "Continue", "bk.confirm": "Confirm booking", "bk.sending": "Sending…",
      "bk.s1.title": "What would you like to <em>explore?</em>",
      "bk.s1.body": "So we can prepare the conversation for you.",
      "bk.i.lots": "Lots at Selvadentro", "bk.i.lots.d": "Choose a lot and see availability",
      "bk.i.invest": "Investment", "bk.i.invest.d": "Appreciation and a 48-month payment plan",
      "bk.i.visit": "Private visit", "bk.i.visit.d": "Walk the jungle and cenotes in Tulum",
      "bk.i.other": "Something else", "bk.i.other.d": "Partner projects, construction or another topic",
      "bk.s1.format": "How would you like to meet?",
      "bk.f.video": "Video call", "bk.f.phone": "Phone call", "bk.f.visit": "In person, in Tulum",
      "bk.minutes": "{n} min",
      "bk.s1.visitNote": "We’ll meet you at Selvadentro and send the exact location when we confirm.",
      "bk.s2.title": "Pick a <em>date and time</em>",
      "bk.s2.body": "{format} · {n} minutes",
      "bk.tz": "Time zone",
      "bk.tulumZone": "Tulum (local time)",
      "bk.pickDay": "Pick a day to see available times.",
      "bk.noSlots": "No times left that day. Try another one.",
      "bk.loading": "Loading times…",
      "bk.morning": "Morning", "bk.afternoon": "Afternoon", "bk.evening": "Evening",
      "bk.tulumTime": "That’s {time} in Tulum.",
      "bk.prevMonth": "Previous month", "bk.nextMonth": "Next month",
      "bk.s3.title": "How should we <em>reach you?</em>",
      "bk.s3.body": "We’ll send your confirmation and the meeting details.",
      "bk.fl.first": "First name", "bk.fl.last": "Last name", "bk.fl.email": "Email",
      "bk.fl.phone": "WhatsApp or phone", "bk.fl.cc": "Country code", "bk.fl.lang": "Meeting language",
      "bk.fl.msg": "Anything we should know? (optional)",
      "bk.fl.msgPh": "Budget, lot size, travel dates…",
      "bk.fl.consent": "I agree to be contacted by JJF Creando about this request.",
      "bk.e.required": "This field is required.",
      "bk.e.email": "Please check the email.",
      "bk.e.phone": "Please check the number.",
      "bk.e.consent": "We need your permission to contact you.",
      "bk.s4.title": "Review and <em>confirm</em>",
      "bk.s4.body": "One last look before we book it.",
      "bk.r.when": "When", "bk.r.format": "Format", "bk.r.interest": "Interest", "bk.r.contact": "Contact",
      "bk.edit": "Change",
      "bk.error": "We couldn’t send your request. Please try again or message us on WhatsApp.",
      "bk.done.title": "See you soon, <em>{name}.</em>",
      "bk.done.body": "We’ve received your request for {when}, and we’ll write to {email} to confirm the details.",
      "bk.done.booked": "You’re booked for {when}, and we’ll send the confirmation to {email}.",
      "bk.taken": "Someone just booked that time. Please choose another.",
      "bk.slotsError": "We couldn’t load the available times right now.",
      "bk.retry": "Try again",
      "bk.done.gcal": "Add to Google Calendar",
      "bk.done.ics": "Apple or Outlook (.ics)",
      "bk.done.wa": "Message us on WhatsApp",
      "bk.done.close": "Back to the site",
      "bk.ev.title": "{format} with JJF Creando",
      "bk.ev.loc.video": "Video call (we’ll send the link)",
      "bk.ev.loc.phone": "Phone call",
      "bk.ev.loc.visit": "Selvadentro, Tulum, Quintana Roo",
      "bk.wa.text": "Hi, I just booked on jjfcreando.com: {format}, {when}. Interest: {interest}. — {name}",
    },
  };
  Object.assign(I18N.es, COPY.es);
  Object.assign(I18N.en, COPY.en);

  const t = (key, vars) => {
    let s = (I18N[currentLang] && I18N[currentLang][key]) || key;
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(v);
    return s;
  };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const locale = () => (currentLang === "es" ? "es-MX" : "en-US");
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  // ---------- time helpers ----------
  const detectTz = () => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || BOOKING.officeTz; } catch (e) { return BOOKING.officeTz; } };
  const dayKey = (ms, tz) => new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(ms);
  const hourIn = (ms, tz) => Number(new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", hourCycle: "h23" }).format(ms));
  const timeLabel = (ms, tz) => new Intl.DateTimeFormat(locale(), { timeZone: tz, hour: "numeric", minute: "2-digit" }).format(ms);
  const dateLabel = (ms, tz, opts = { weekday: "long", day: "numeric", month: "long" }) => cap(new Intl.DateTimeFormat(locale(), { timeZone: tz, ...opts }).format(ms));
  const keyToUTC = (key) => { const [y, m, d] = key.split("-").map(Number); return Date.UTC(y, m - 1, d, 12); };
  function offsetLabel(tz) {
    try {
      const p = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "shortOffset" }).formatToParts(Date.now());
      return (p.find((x) => x.type === "timeZoneName") || {}).value || "";
    } catch (e) { return ""; }
  }
  const zoneName = (tz) => (tz === BOOKING.officeTz ? t("bk.tulumZone") : tz.split("/").pop().replace(/_/g, " "));
  const whenLabel = (ms, tz) => `${dateLabel(ms, tz)}, ${timeLabel(ms, tz)}`;

  // Deterministic "busy" pattern so the demo calendar looks real and stays stable between visits
  function busy(ms) {
    let h = Math.floor(ms / 60000) ^ 0x5bd1e995;
    h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d);
    h = Math.imul(h ^ (h >>> 12), 0x297a2d39);
    return ((h ^ (h >>> 15)) >>> 0) % 100 < 32;
  }

  // ---------- integration points ----------
  async function getSlots(formatId) {
    const now = Date.now();
    const end = now + BOOKING.daysAhead * 864e5;
    if (BOOKING.endpoint) {
      const url = `${BOOKING.endpoint}?action=slots&format=${formatId}&start=${now}&end=${end}`;
      const r = await fetch(url, { headers: { Accept: "application/json" } });
      if (r.ok) {
        const data = await r.json(); // { slots: [epochMs, …], minutes, connected }
        if (data.minutes) MINUTES[formatId] = data.minutes;
        BOOKING.connected = !!data.connected;
        return data.slots || [];
      }
      if (r.status !== 404) throw new Error(`slots ${r.status}`);
      BOOKING.endpoint = null; // no function here (plain static server): office-hours demo
    }
    // Demo: office hours in Tulum, minus a stable pseudo-random set of busy slots
    const slots = [];
    const first = new Date(now + BOOKING.minNoticeHours * 36e5);
    const off = -BOOKING.officeOffsetHours;
    for (let d = 0; d <= BOOKING.daysAhead; d++) {
      const day = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), first.getUTCDate() + d));
      const hours = HOURS[formatId][day.getUTCDay()] || [];
      for (const h of hours) {
        const ms = Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), Math.floor(h) + off, (h % 1) * 60);
        if (ms < now + BOOKING.minNoticeHours * 36e5 || ms > end) continue;
        if (!busy(ms + formatId.length)) slots.push(ms);
      }
    }
    return slots;
  }

  // → { confirmed: true } when the appointment is in the calendar, { confirmed: false } when the
  // request was kept for the team to confirm. Throws "slot_taken" if someone just booked that time.
  async function submitBooking(payload) {
    if (BOOKING.endpoint && BOOKING.connected) {
      let r = null;
      try {
        r = await fetch(BOOKING.endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "book", ...payload }) });
      } catch (e) { /* network: fall through to the form */ }
      if (r && r.ok) return { confirmed: true, ...(await r.json()) };
      if (r && r.status === 409) { const e = new Error("slot_taken"); e.code = "slot_taken"; throw e; }
      // GoHighLevel down or misconfigured: keep the request so it isn't lost
      if (await saveAsForm(payload)) return { confirmed: false };
      throw new Error(`book ${r ? r.status : "network"}`);
    }
    // No token yet: keep the request as a Netlify form submission ("agenda")
    await saveAsForm(payload); // offline or Forms not enabled: the WhatsApp button on the last screen still reaches the team
    return { confirmed: false };
  }

  async function saveAsForm(payload) {
    const fields = { "form-name": "agenda", ...Object.fromEntries(Object.entries(payload).map(([k, v]) => [k, String(v ?? "")])) };
    try {
      const r = await fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(fields).toString() });
      return r.ok;
    } catch (e) { return false; }
  }

  // ---------- state ----------
  const blank = () => ({
    step: 0, dir: 1, interest: null, format: null, tz: detectTz(),
    month: null, day: null, slot: null, slots: null, slotsFor: null, loading: false,
    first: "", last: "", email: "", cc: currentLang === "en" ? "+1" : "+52", phone: "", lang: currentLang, msg: "", consent: false,
    errors: {}, sending: false, failed: false, done: false, confirmed: false, formatChosen: false,
    slotsError: false, notice: null,
  });
  let S = blank();
  let root = null, lastFocus = null;

  const fmt = () => { const f = FORMATS.find((x) => x.id === S.format); return f && { ...f, minutes: minutesOf(f) }; };
  const interestImg = () => (INTERESTS.find((i) => i.id === S.interest) || INTERESTS[0]).img;

  // ---------- shell ----------
  function build() {
    root = document.getElementById("booking");
    if (!root) return;
    root.innerHTML = `
      <div class="bk-backdrop" data-bk="close"></div>
      <div class="bk-panel" role="dialog" aria-modal="true" aria-labelledby="bk-title">
        <aside class="bk-side on-dark" aria-hidden="true">
          <div class="bk-side-media"><img data-bk-img alt="" /></div>
          <div class="bk-side-top">
            <span class="bk-logo"><span class="logo-img"></span></span>
          </div>
          <div class="bk-side-mid">
            <p class="eyebrow eyebrow-rule text-accent" data-bk-t="bk.eyebrow"></p>
            <p class="display mt-5 text-[2.5rem] xl:text-[2.9rem]" data-bk-t="bk.sideTitle"></p>
            <ol class="bk-steps mt-9" data-bk-steps></ol>
          </div>
          <ul class="bk-trust" data-bk-trust></ul>
        </aside>
        <section class="bk-main">
          <header class="bk-head">
            <p class="caption" data-bk-stepof></p>
            <div class="bk-bar"><span data-bk-bar></span></div>
          </header>
          <button type="button" class="bk-close" data-bk="close"><svg width="12" height="12" viewBox="0 0 12 12" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="M1 1l10 10M11 1L1 11" /></svg></button>
          <div class="bk-body" data-bk-body></div>
          <footer class="bk-foot" data-bk-foot></footer>
        </section>
      </div>`;
    root.addEventListener("click", onClick);
    root.addEventListener("input", onInput);
    root.addEventListener("change", onInput);
    root.addEventListener("keydown", onKey);
  }

  // ---------- render ----------
  function render(animate = true) {
    if (!root) return;
    $$("[data-bk-t]", root).forEach((el) => { el.innerHTML = t(el.dataset.bkT); });
    $(".bk-close", root).setAttribute("aria-label", t("bk.close"));
    const img = $("[data-bk-img]", root);
    const src = interestImg();
    if (img.getAttribute("src") !== src) { img.classList.remove("is-in"); img.onload = () => img.classList.add("is-in"); img.src = src; if (img.complete) img.classList.add("is-in"); }
    const labels = ["bk.step1", "bk.step2", "bk.step3", "bk.step4"];
    $("[data-bk-steps]", root).innerHTML = labels.map((k, i) => {
      const state = S.done || i < S.step ? "is-done" : i === S.step ? "is-current" : "";
      return `<li class="${state}"><span class="bk-step-n">${state === "is-done" ? "✓" : pad(i + 1)}</span><span>${t(k)}</span></li>`;
    }).join("");
    $("[data-bk-trust]", root).innerHTML = ["bk.trust1", "bk.trust2", "bk.trust3"].map((k) => `<li>${t(k)}</li>`).join("");
    const n = S.done ? 4 : S.step + 1;
    $("[data-bk-stepof]", root).textContent = S.done ? t("bk.step4") : `${t("bk.stepOf", { n })} · ${t(labels[S.step])}`;
    $("[data-bk-bar]", root).style.transform = `scaleX(${S.done ? 1 : (S.step + 1) / 4})`;

    const body = $("[data-bk-body]", root);
    body.innerHTML = S.done ? viewDone() : [view1, view2, view3, view4][S.step]();
    $("[data-bk-foot]", root).innerHTML = S.done ? "" : footer();
    root.classList.toggle("is-done", S.done);
    if (animate && !reducedMotion) {
      body.classList.remove("bk-enter", "bk-enter-back");
      void body.offsetWidth;
      body.classList.add(S.dir < 0 ? "bk-enter-back" : "bk-enter");
    }
    if (S.step === 1 && !S.done) ensureSlots();
  }

  function heading(titleKey, bodyHtml) {
    return `<h2 id="bk-title" class="display text-[2.3rem] md:text-[2.9rem] u-brush is-in" tabindex="-1">${t(titleKey)}</h2>
      <p class="prose-body mt-3">${bodyHtml}</p>`;
  }

  function view1() {
    const cards = INTERESTS.map((i) => `
      <button type="button" class="bk-option" data-bk="interest" data-id="${i.id}" aria-pressed="${S.interest === i.id}">
        <span class="bk-option-img"><img src="${i.img}" alt="" loading="lazy" /></span>
        <span class="bk-option-text">
          <span class="bk-option-title">${t(`bk.i.${i.id}`)}</span>
          <span class="bk-option-desc">${t(`bk.i.${i.id}.d`)}</span>
        </span>
        <span class="bk-tick" aria-hidden="true"></span>
      </button>`).join("");
    const chips = FORMATS.map((f) => `
      <button type="button" class="bk-chip" data-bk="format" data-id="${f.id}" aria-pressed="${S.format === f.id}">
        ${icon(f.id)}<span>${t(`bk.f.${f.id}`)}</span><span class="bk-chip-min">${t("bk.minutes", { n: minutesOf(f) })}</span>
      </button>`).join("");
    return `${heading("bk.s1.title", t("bk.s1.body"))}
      <div class="bk-options mt-8">${cards}</div>
      <p class="eyebrow text-accent mt-10">${t("bk.s1.format")}</p>
      <div class="bk-chips mt-4">${chips}</div>
      ${S.format === "visit" ? `<p class="bk-note mt-5">${t("bk.s1.visitNote")}</p>` : ""}`;
  }

  function icon(id) {
    const p = {
      video: '<rect x="2" y="6" width="13" height="12" rx="2"/><path d="M15 10l6-3v10l-6-3z"/>',
      phone: '<path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2z"/>',
      visit: '<path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
    }[id];
    return `<svg class="bk-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  }

  function view2() {
    const f = fmt();
    const zoneOpts = Array.from(new Set([S.tz, ...ZONES])).map((z) => `<option value="${z}" ${z === S.tz ? "selected" : ""}>${esc(zoneName(z))} · ${offsetLabel(z)}</option>`).join("");
    return `${heading("bk.s2.title", t("bk.s2.body", { format: t(`bk.f.${f.id}`), n: f.minutes }))}
      ${S.notice ? `<p class="bk-err mt-5" role="alert">${t(S.notice)}</p>` : ""}
      <div class="bk-when mt-8">
        <div class="bk-cal-wrap">
          ${S.loading || !S.slots ? `<div class="bk-cal is-loading" aria-busy="true"><p class="caption">${t("bk.loading")}</p></div>` : calendar()}
          <label class="bk-tz mt-6">
            <span class="eyebrow text-accent">${t("bk.tz")}</span>
            <span class="bk-select"><select data-bk="tz" aria-label="${t("bk.tz")}">${zoneOpts}</select></span>
          </label>
        </div>
        <div class="bk-slots" aria-live="polite">${slotsView()}</div>
      </div>`;
  }

  function slotDays() {
    const map = new Map();
    for (const ms of S.slots || []) {
      const k = dayKey(ms, S.tz);
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(ms);
    }
    return map;
  }

  function calendar() {
    const days = slotDays();
    const keys = [...days.keys()].sort();
    if (!S.month) {
      const k = S.day || keys[0] || dayKey(Date.now(), S.tz);
      S.month = k.slice(0, 7);
    }
    const [y, m] = S.month.split("-").map(Number);
    const firstKey = keys[0] || dayKey(Date.now(), S.tz);
    const lastKey = keys[keys.length - 1] || firstKey;
    const canPrev = S.month > firstKey.slice(0, 7);
    const canNext = S.month < lastKey.slice(0, 7);
    const weekStart = currentLang === "en" ? 0 : 1;
    const firstDow = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
    const lead = (firstDow - weekStart + 7) % 7;
    const count = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const today = dayKey(Date.now(), S.tz);
    const wd = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(Date.UTC(2024, 0, 7 + weekStart + i)); // 2024-01-07 is a Sunday
      wd.push(`<span>${new Intl.DateTimeFormat(locale(), { weekday: "short", timeZone: "UTC" }).format(d).replace(".", "")}</span>`);
    }
    let cells = "";
    for (let i = 0; i < lead; i++) cells += `<span></span>`;
    for (let d = 1; d <= count; d++) {
      const key = `${y}-${pad(m)}-${pad(d)}`;
      const open = days.has(key);
      const label = dateLabel(keyToUTC(key), "UTC");
      cells += `<button type="button" class="bk-day${key === today ? " is-today" : ""}" data-bk="day" data-key="${key}" ${open ? "" : "disabled"} aria-pressed="${S.day === key}" aria-label="${esc(label)}" tabindex="${S.day === key || (!S.day && key === keys[0]) ? 0 : -1}">${d}</button>`;
    }
    const monthName = cap(new Intl.DateTimeFormat(locale(), { month: "long", year: "numeric", timeZone: "UTC" }).format(Date.UTC(y, m - 1, 15)));
    return `<div class="bk-cal">
        <div class="bk-cal-head">
          <p class="bk-month">${monthName}</p>
          <div class="bk-cal-nav">
            <button type="button" data-bk="month" data-dir="-1" ${canPrev ? "" : "disabled"} aria-label="${t("bk.prevMonth")}">←</button>
            <button type="button" data-bk="month" data-dir="1" ${canNext ? "" : "disabled"} aria-label="${t("bk.nextMonth")}">→</button>
          </div>
        </div>
        <div class="bk-wd" aria-hidden="true">${wd.join("")}</div>
        <div class="bk-grid" role="group" aria-label="${esc(monthName)}">${cells}</div>
      </div>`;
  }

  function slotsView() {
    if (S.loading || !S.slots) return `<p class="caption">${t("bk.loading")}</p>`;
    if (S.slotsError) return `<div class="bk-slots-empty"><p class="prose-body">${t("bk.slotsError")}</p>
        <div class="bk-done-links mt-6"><button type="button" class="link-line" data-bk="retry">${t("bk.retry")}</button>
        <a class="link-line" href="${waUrl()}" target="_blank" rel="noopener"><span>${t("bk.done.wa")}</span><span class="arrow-ne" aria-hidden="true">↗</span></a></div></div>`;
    if (!S.day) return `<div class="bk-slots-empty"><p class="prose-body">${t("bk.pickDay")}</p></div>`;
    const list = slotDays().get(S.day) || [];
    const head = `<p class="bk-slots-day">${dateLabel(keyToUTC(S.day), "UTC")}</p>`;
    if (!list.length) return `${head}<p class="prose-body mt-4">${t("bk.noSlots")}</p>`;
    const groups = { morning: [], afternoon: [], evening: [] };
    for (const ms of list) {
      const h = hourIn(ms, S.tz);
      groups[h < 12 ? "morning" : h < 18 ? "afternoon" : "evening"].push(ms);
    }
    let html = head;
    for (const [g, arr] of Object.entries(groups)) {
      if (!arr.length) continue;
      html += `<p class="caption mt-6">${t(`bk.${g}`)}</p><div class="bk-times mt-3">${arr.map((ms) =>
        `<button type="button" class="bk-time" data-bk="slot" data-ms="${ms}" aria-pressed="${S.slot === ms}">${timeLabel(ms, S.tz)}</button>`).join("")}</div>`;
    }
    if (S.slot && S.tz !== BOOKING.officeTz && dayKey(S.slot, S.tz) === S.day) {
      html += `<p class="bk-note mt-6">${t("bk.tulumTime", { time: timeLabel(S.slot, BOOKING.officeTz) })}</p>`;
    }
    return html;
  }

  async function ensureSlots() {
    if (S.slotsFor === S.format && S.slots) return;
    S.loading = true; S.slots = null; S.slotsFor = S.format; S.slotsError = false;
    try {
      const slots = await getSlots(S.format);
      if (S.slotsFor !== S.format) return;
      S.slots = slots.sort((a, b) => a - b);
    } catch (e) {
      if (S.slotsFor !== S.format) return;
      S.slots = []; S.slotsError = true;
    }
    S.loading = false;
    if (S.step === 1 && !S.done) render(false);
  }

  function field(id, type, labelKey, opts = {}) {
    const err = S.errors[id];
    return `<label class="bk-field${err ? " has-error" : ""}${opts.cls ? " " + opts.cls : ""}">
      <span class="bk-label">${t(labelKey)}</span>
      <input type="${type}" data-bk-field="${id}" value="${esc(S[id])}" ${opts.attrs || ""} aria-invalid="${!!err}" />
      ${err ? `<span class="bk-err">${t(err)}</span>` : ""}
    </label>`;
  }

  function view3() {
    const ccOpts = COUNTRY_CODES.map((c) => `<option value="${c}" ${c === S.cc ? "selected" : ""}>${COUNTRY_LABEL[c]} ${c}</option>`).join("");
    const perr = S.errors.phone;
    return `${heading("bk.s3.title", t("bk.s3.body"))}
      <div class="bk-form mt-8">
        <div class="bk-row">
          ${field("first", "text", "bk.fl.first", { attrs: 'autocomplete="given-name" required' })}
          ${field("last", "text", "bk.fl.last", { attrs: 'autocomplete="family-name" required' })}
        </div>
        ${field("email", "email", "bk.fl.email", { attrs: 'autocomplete="email" inputmode="email" required' })}
        <div class="bk-field${perr ? " has-error" : ""}">
          <span class="bk-label" id="bk-phone-l">${t("bk.fl.phone")}</span>
          <div class="bk-phone">
            <span class="bk-select"><select data-bk-field="cc" aria-label="${t("bk.fl.cc")}">${ccOpts}</select></span>
            <input type="tel" data-bk-field="phone" value="${esc(S.phone)}" autocomplete="tel-national" inputmode="tel" aria-labelledby="bk-phone-l" aria-invalid="${!!perr}" />
          </div>
          ${perr ? `<span class="bk-err">${t(perr)}</span>` : ""}
        </div>
        <div class="bk-field">
          <span class="bk-label">${t("bk.fl.lang")}</span>
          <div class="bk-chips bk-chips-sm mt-2">
            ${["es", "en"].map((l) => `<button type="button" class="bk-chip" data-bk="lang" data-id="${l}" aria-pressed="${S.lang === l}">${l === "es" ? "Español" : "English"}</button>`).join("")}
          </div>
        </div>
        <label class="bk-field">
          <span class="bk-label">${t("bk.fl.msg")}</span>
          <textarea data-bk-field="msg" rows="3" placeholder="${esc(t("bk.fl.msgPh"))}">${esc(S.msg)}</textarea>
        </label>
        <label class="bk-consent${S.errors.consent ? " has-error" : ""}">
          <input type="checkbox" data-bk-field="consent" ${S.consent ? "checked" : ""} />
          <span class="bk-box" aria-hidden="true"></span>
          <span>${t("bk.fl.consent")}</span>
        </label>
        ${S.errors.consent ? `<span class="bk-err">${t(S.errors.consent)}</span>` : ""}
      </div>`;
  }

  function view4() {
    const f = fmt();
    const tulum = S.tz !== BOOKING.officeTz ? `<span class="bk-sub">${t("bk.tulumTime", { time: timeLabel(S.slot, BOOKING.officeTz) })}</span>` : "";
    const rows = [
      ["bk.r.when", `${whenLabel(S.slot, S.tz)}<span class="bk-sub">${esc(zoneName(S.tz))} · ${offsetLabel(S.tz)}</span>${tulum}`, 1],
      ["bk.r.format", `${t(`bk.f.${f.id}`)} · ${t("bk.minutes", { n: f.minutes })}`, 0],
      ["bk.r.interest", t(`bk.i.${S.interest}`), 0],
      ["bk.r.contact", `${esc(S.first)} ${esc(S.last)}<span class="bk-sub">${esc(S.email)} · ${esc(S.cc)} ${esc(S.phone)}</span>`, 2],
    ];
    return `${heading("bk.s4.title", t("bk.s4.body"))}
      <dl class="bk-summary mt-8">${rows.map(([k, v, step]) => `
        <div><dt class="caption">${t(k)}</dt><dd>${v}</dd><button type="button" class="bk-edit" data-bk="goto" data-step="${step}">${t("bk.edit")}</button></div>`).join("")}
      </dl>
      ${S.failed ? `<p class="bk-err mt-6" role="alert">${t("bk.error")}</p>` : ""}`;
  }

  function viewDone() {
    let when = whenLabel(S.slot, S.tz);
    if (currentLang === "es") when = when.charAt(0).toLowerCase() + when.slice(1); // mid-sentence: "el jueves…"
    return `<div class="bk-done">
        <svg class="bk-check" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="24" fill="none"/><path d="M15 27l7 7 15-16" fill="none"/></svg>
        <h2 id="bk-title" class="display text-[2.6rem] md:text-[3.3rem] mt-8 u-brush is-in" tabindex="-1">${t("bk.done.title", { name: esc(S.first) })}</h2>
        <p class="prose-body mt-4 max-w-md">${t(S.confirmed ? "bk.done.booked" : "bk.done.body", { when: `<strong>${esc(when)}</strong>`, email: `<strong>${esc(S.email)}</strong>` })}</p>
        <div class="bk-done-actions mt-9">
          <a class="btn btn-accent" href="${gcalUrl()}" target="_blank" rel="noopener"><span>${t("bk.done.gcal")}</span><span class="arrow-ne" aria-hidden="true">↗</span></a>
          <button type="button" class="btn btn-ghost" data-bk="ics"><span>${t("bk.done.ics")}</span></button>
        </div>
        <div class="bk-done-links mt-8">
          <a class="link-line" href="${waUrl()}" target="_blank" rel="noopener"><span>${t("bk.done.wa")}</span><span class="arrow-ne" aria-hidden="true">↗</span></a>
          <button type="button" class="link-line" data-bk="close">${t("bk.done.close")}</button>
        </div>
      </div>`;
  }

  function footer() {
    const back = S.step > 0 ? `<button type="button" class="link-line" data-bk="back"><span class="arrow" aria-hidden="true">←</span><span>${t("bk.back")}</span></button>` : `<span></span>`;
    let pick = "";
    if (S.step === 1 && S.slot) pick = `<span class="bk-pick">${esc(whenLabel(S.slot, S.tz))}</span>`;
    const last = S.step === 3;
    const label = last ? (S.sending ? t("bk.sending") : t("bk.confirm")) : t("bk.next");
    return `${back}${pick}<button type="button" class="btn btn-accent bk-next" data-bk="${last ? "submit" : "next"}" ${canNext() && !S.sending ? "" : "disabled"}>
        <span>${label}</span>${S.sending ? '<span class="bk-spin" aria-hidden="true"></span>' : '<span class="arrow" aria-hidden="true">→</span>'}</button>`;
  }

  // ---------- logic ----------
  function canNext() {
    if (S.step === 0) return !!(S.interest && S.format);
    if (S.step === 1) return !!S.slot;
    return true; // steps 3–4 validate on click and show messages
  }

  function validate() {
    const e = {};
    if (!S.first.trim()) e.first = "bk.e.required";
    if (!S.last.trim()) e.last = "bk.e.required";
    if (!S.email.trim()) e.email = "bk.e.required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(S.email.trim())) e.email = "bk.e.email";
    const digits = S.phone.replace(/\D/g, "");
    if (!digits) e.phone = "bk.e.required";
    else if (digits.length < 7 || digits.length > 15) e.phone = "bk.e.phone";
    if (!S.consent) e.consent = "bk.e.consent";
    S.errors = e;
    return !Object.keys(e).length;
  }

  function go(step) {
    S.dir = step >= S.step ? 1 : -1;
    S.step = step;
    render();
    focusTitle();
  }

  function focusTitle() {
    requestAnimationFrame(() => {
      const h = $("#bk-title", root);
      if (h) h.focus({ preventScroll: true });
      const body = $("[data-bk-body]", root);
      if (body) body.scrollTop = 0;
    });
  }

  function payload() {
    const f = fmt();
    return {
      startTime: new Date(S.slot).toISOString(),
      endTime: new Date(S.slot + f.minutes * 6e4).toISOString(),
      timezone: S.tz,
      format: f.id,
      interest: S.interest,
      firstName: S.first.trim(),
      lastName: S.last.trim(),
      email: S.email.trim(),
      phone: `${S.cc}${S.phone.replace(/\D/g, "")}`,
      language: S.lang,
      message: S.msg.trim(),
      source: location.hostname || "jjfcreando.com",
      page: location.pathname,
    };
  }

  async function submit() {
    if (S.sending) return;
    S.sending = true; S.failed = false;
    render(false);
    try {
      const res = await submitBooking(payload());
      S.confirmed = !!res.confirmed;
      S.done = true; S.sending = false; S.dir = 1;
      render();
      focusTitle();
    } catch (e) {
      S.sending = false;
      if (e.code === "slot_taken") {
        // Someone took that time a moment ago: back to the calendar with fresh availability
        S.slot = null; S.slots = null; S.slotsFor = null; S.notice = "bk.taken";
        return go(1);
      }
      S.failed = true;
      render(false);
    }
  }

  // ---------- calendar exports ----------
  const icsDate = (ms) => new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const evTitle = () => t("bk.ev.title", { format: t(`bk.f.${S.format}`) });
  const evLoc = () => t(`bk.ev.loc.${S.format}`);
  const evDesc = () => `${t(`bk.i.${S.interest}`)} · jjfcreando.com · WhatsApp +52 999 489 0828`;
  function gcalUrl() {
    const end = S.slot + fmt().minutes * 6e4;
    const q = new URLSearchParams({ action: "TEMPLATE", text: evTitle(), dates: `${icsDate(S.slot)}/${icsDate(end)}`, details: evDesc(), location: evLoc() });
    return `https://calendar.google.com/calendar/render?${q.toString()}`;
  }
  function downloadIcs() {
    const end = S.slot + fmt().minutes * 6e4;
    const x = (s) => s.replace(/[\\;,]/g, (c) => `\\${c}`);
    const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//JJF Creando//Agenda//ES", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "BEGIN:VEVENT",
      `UID:${S.slot}-${Math.random().toString(36).slice(2)}@jjfcreando.com`, `DTSTAMP:${icsDate(Date.now())}`, `DTSTART:${icsDate(S.slot)}`, `DTEND:${icsDate(end)}`,
      `SUMMARY:${x(evTitle())}`, `DESCRIPTION:${x(evDesc())}`, `LOCATION:${x(evLoc())}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    const a = document.createElement("a");
    a.href = url; a.download = "jjf-creando.ics";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function waUrl() {
    const text = t("bk.wa.text", { format: t(`bk.f.${S.format}`), when: whenLabel(S.slot, S.tz), interest: t(`bk.i.${S.interest}`), name: `${S.first} ${S.last}`.trim() });
    return `https://wa.me/${typeof WHATSAPP !== "undefined" ? WHATSAPP : "529994890828"}?text=${encodeURIComponent(text)}`;
  }

  // ---------- events ----------
  function onClick(e) {
    const el = e.target.closest("[data-bk]");
    if (!el || !root.contains(el)) return;
    const a = el.dataset.bk;
    if (a === "close") return close();
    if (a === "interest") {
      const before = S.format;
      S.interest = el.dataset.id;
      if (S.interest === "visit") S.format = "visit";
      else if (S.format === "visit" && !S.formatChosen) S.format = null;
      if (S.format !== before) { S.slot = null; S.day = null; S.month = null; }
      return render(false);
    }
    if (a === "format") {
      if (S.format !== el.dataset.id) { S.slot = null; S.day = null; S.month = null; }
      S.format = el.dataset.id; S.formatChosen = true; S.notice = null;
      return render(false);
    }
    if (a === "month") {
      const [y, m] = S.month.split("-").map(Number);
      const d = new Date(Date.UTC(y, m - 1 + Number(el.dataset.dir), 1));
      S.month = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`;
      return render(false);
    }
    if (a === "day") {
      S.day = el.dataset.key;
      if (S.slot && dayKey(S.slot, S.tz) !== S.day) S.slot = null;
      render(false);
      const btn = $(`.bk-day[data-key="${S.day}"]`, root);
      if (btn) btn.focus({ preventScroll: true });
      // On phones the times sit under the calendar: bring them into view
      if (window.matchMedia("(max-width: 899px)").matches) {
        const list = $(".bk-slots", root);
        if (list) list.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
      }
      return;
    }
    if (a === "retry") { S.slotsFor = null; ensureSlots(); return render(false); }
    if (a === "slot") { S.slot = Number(el.dataset.ms); S.notice = null; render(false); const b = $(`.bk-time[data-ms="${S.slot}"]`, root); if (b) b.focus({ preventScroll: true }); return; }
    if (a === "lang") { S.lang = el.dataset.id; return render(false); }
    if (a === "next") {
      if (!canNext()) return;
      if (S.step === 2 && !validate()) { render(false); const bad = $('[aria-invalid="true"]', root) || $(".bk-consent.has-error input", root); if (bad) bad.focus(); return; }
      return go(S.step + 1);
    }
    if (a === "back") return go(Math.max(0, S.step - 1));
    if (a === "goto") return go(Number(el.dataset.step));
    if (a === "submit") return submit();
    if (a === "ics") return downloadIcs();
  }

  function onInput(e) {
    const el = e.target;
    if (el.dataset.bk === "tz") {
      S.tz = el.value;
      S.day = S.slot ? dayKey(S.slot, S.tz) : null;
      S.month = null;
      return render(false);
    }
    const k = el.dataset.bkField;
    if (!k) return;
    S[k] = el.type === "checkbox" ? el.checked : el.value;
    if (S.errors[k]) {
      // Clear this field's message in place, without re-rendering (keeps focus and caret)
      delete S.errors[k];
      const wrap = el.closest(".bk-field, .bk-consent");
      if (wrap) {
        wrap.classList.remove("has-error");
        const msg = k === "consent" ? wrap.nextElementSibling : $(".bk-err", wrap);
        if (msg && msg.classList.contains("bk-err")) msg.remove();
      }
      el.setAttribute("aria-invalid", "false");
    }
  }

  function onKey(e) {
    if (e.key === "Escape") { e.stopPropagation(); return close(); }
    // Arrow keys move between open days in the calendar
    const day = e.target.closest && e.target.closest(".bk-day");
    if (day && ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
      e.preventDefault();
      const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
      const all = $$(".bk-day", root);
      let i = all.indexOf(day);
      do { i += step; } while (i >= 0 && i < all.length && all[i].disabled);
      if (all[i]) { all.forEach((b) => b.setAttribute("tabindex", "-1")); all[i].setAttribute("tabindex", "0"); all[i].focus(); }
      return;
    }
    // Keep Tab inside the dialog
    if (e.key === "Tab") {
      const f = $$('button:not([disabled]), a[href], input, select, textarea, [tabindex="0"]', root).filter((x) => x.offsetParent !== null && !x.closest('[aria-hidden="true"]'));
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }

  // ---------- open / close ----------
  function open(intent) {
    if (!root) build();
    if (!root) return;
    if (S.done) S = blank();
    if (intent === "visit" && !S.interest) { S.interest = "visit"; S.format = "visit"; }
    lastFocus = document.activeElement;
    if (typeof setMenu === "function") setMenu(false);
    root.hidden = false;
    render(false);
    requestAnimationFrame(() => { root.classList.add("is-open"); focusTitle(); });
    document.documentElement.classList.add("bk-lock");
  }
  function close() {
    if (!root || !root.classList.contains("is-open")) return;
    root.classList.remove("is-open");
    document.documentElement.classList.remove("bk-lock");
    setTimeout(() => { if (!root.classList.contains("is-open")) root.hidden = true; }, 500);
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  window.JJFBooking = {
    open,
    close,
    refresh() { if (root && root.classList.contains("is-open")) render(false); },
    config: BOOKING,
  };
})();
