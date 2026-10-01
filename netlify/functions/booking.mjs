// Agenda ↔ GoHighLevel (LeadConnector API v2), used by booking.js.
//
//   GET  /api/booking?action=slots&format=video|phone|visit&start=<ms>&end=<ms>
//        → { slots: [epochMs…], minutes, connected }
//   POST /api/booking  { action: "book", format, interest, startTime, timezone, firstName,
//                        lastName, email, phone, language, message, page }
//        → { ok, appointmentId }  ·  409 { error: "slot_taken" }  ·  503 { connected: false }
//
// Environment variables (Netlify → Site configuration → Environment variables):
//   GHL_TOKEN                  Private Integration token of the sub-account. Scopes: View Calendars,
//                              Edit Calendar Events, Edit Contacts. Required to book; without it the
//                              calendar's public availability is still shown.
//   GHL_CALENDAR_ID            optional: calendar for every format (default: the site's calendar)
//   GHL_CALENDAR_ID_VIDEO / GHL_CALENDAR_ID_PHONE / GHL_CALENDAR_ID_VISIT
//                              optional: a separate calendar for one format
//   GHL_LOCATION_ID            optional: read from the calendar when missing
//   GHL_VISIT_MINUTES          optional: length of a visit that shares the calendar (default 90)

export const config = { path: "/api/booking" };

const API = "https://services.leadconnectorhq.com";
const OFFICE_TZ = "America/Cancun";
const DEFAULT_CALENDAR = "DD1xkh0ObvHQFhcyxgJR";
const MAX_DAYS = 62;
const SOURCE = "Sitio web · Agenda";

const FORMATS = {
  video: { label: "Videollamada", tag: "videollamada" },
  phone: { label: "Llamada", tag: "llamada" },
  visit: { label: "Visita en Tulum", tag: "visita-tulum" },
};
const INTERESTS = {
  lots: { label: "Lotes en Selvadentro", tag: "lotes" },
  invest: { label: "Inversión", tag: "inversion" },
  visit: { label: "Visita privada", tag: "visita" },
  other: { label: "Otra consulta", tag: "otra-consulta" },
};
const LANGS = { es: "Español", en: "Inglés" };

const env = (k) => String((globalThis.Netlify?.env?.get(k) ?? process.env[k]) || "").trim();
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });

export default async (req) => {
  try {
    if (req.method === "GET") return await slots(new URL(req.url).searchParams);
    if (req.method === "POST") return await book(await req.json().catch(() => null));
    return json({ error: "method_not_allowed" }, 405);
  } catch (e) {
    console.error("[booking]", e.message, e.data ? JSON.stringify(e.data).slice(0, 800) : "");
    return json({ error: "upstream" }, 502);
  }
};

// ---------- GoHighLevel ----------
async function ghl(path, { method = "GET", body, version = "2021-04-15", auth = true } = {}) {
  const token = env("GHL_TOKEN");
  const headers = { Accept: "application/json", Version: version };
  if (auth && token) headers.Authorization = `Bearer ${token}`;
  if (body) headers["Content-Type"] = "application/json";
  const r = await fetch(API + path, { method, headers, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(8000) });
  const text = await r.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!r.ok) {
    const e = new Error(`GHL ${method} ${path.split("?")[0]} → ${r.status}`);
    e.status = r.status;
    e.data = data;
    throw e;
  }
  return data;
}

const calendarFor = (format) => env(`GHL_CALENDAR_ID_${format.toUpperCase()}`) || env("GHL_CALENDAR_ID") || DEFAULT_CALENDAR;
const ownCalendar = (format) => !!env(`GHL_CALENDAR_ID_${format.toUpperCase()}`);

// Calendar settings (location, meeting length, slot spacing), cached while the function stays warm
const calCache = new Map();
async function calendar(id) {
  // Without a token the settings can't be read: assume 30-minute slots
  if (!env("GHL_TOKEN")) return { id, locationId: env("GHL_LOCATION_ID"), duration: 30, interval: 30 };
  const hit = calCache.get(id);
  if (hit && Date.now() - hit.at < 10 * 60e3) return hit.cal;
  const c = (await ghl(`/calendars/${id}`)).calendar || {};
  const mins = (n, unit) => (Number(n) || 0) * (unit === "hours" ? 60 : 1);
  const cal = {
    id,
    locationId: env("GHL_LOCATION_ID") || c.locationId || "",
    duration: mins(c.slotDuration, c.slotDurationUnit) || 30,
    interval: mins(c.slotInterval, c.slotIntervalUnit) || mins(c.slotDuration, c.slotDurationUnit) || 30,
  };
  calCache.set(id, { at: Date.now(), cal });
  return cal;
}

function minutesFor(format, cal) {
  if (format === "visit" && !ownCalendar("visit")) return Number(env("GHL_VISIT_MINUTES")) || 90;
  return cal.duration;
}

// Free slot start times in [start, end). The API allows at most 31 days per request.
async function freeSlots(cal, start, end) {
  const CHUNK = 30 * 864e5;
  const windows = [];
  for (let s = start; s < end; s += CHUNK) windows.push([s, Math.min(end, s + CHUNK)]);
  // Without a token, fall back to the calendar's public availability (no auth header)
  const pages = await Promise.all(windows.map(([s, e]) =>
    ghl(`/calendars/${cal.id}/free-slots?startDate=${s}&endDate=${e}&timezone=${encodeURIComponent(OFFICE_TZ)}`)));
  const out = new Set();
  for (const page of pages) {
    for (const v of Object.values(page || {})) {
      if (!v || !Array.isArray(v.slots)) continue;
      for (const s of v.slots) { const ms = Date.parse(s); if (Number.isFinite(ms) && ms >= start && ms < end) out.add(ms); }
    }
  }
  return [...out].sort((a, b) => a - b);
}

// Starts where a meeting of `minutes` fits: for longer meetings (a visit on a 30-minute calendar),
// every slot it overlaps has to be free too.
function fitting(slots, minutes, cal) {
  if (minutes <= cal.duration) return slots;
  const free = new Set(slots);
  const step = cal.interval * 6e4;
  const lastStart = (minutes - cal.duration) * 6e4;
  return slots.filter((t) => {
    for (let o = step; o <= lastStart; o += step) if (!free.has(t + o)) return false;
    return true;
  });
}

// ---------- GET: availability ----------
async function slots(q) {
  const format = FORMATS[q.get("format")] ? q.get("format") : "video";
  const now = Date.now();
  const limit = now + MAX_DAYS * 864e5;
  const start = Math.min(Math.max(Number(q.get("start")) || now, now), limit);
  const end = Math.min(Math.max(Number(q.get("end")) || start + 45 * 864e5, start), limit);
  const cal = await calendar(calendarFor(format));
  const minutes = minutesFor(format, cal);
  const list = fitting(await freeSlots(cal, start, end), minutes, cal);
  return json({ slots: list, minutes, connected: !!env("GHL_TOKEN") });
}

// ---------- POST: book ----------
async function book(b) {
  if (!b || b.action !== "book") return json({ error: "invalid", fields: ["action"] }, 400);
  if (!env("GHL_TOKEN")) return json({ error: "not_connected", connected: false }, 503);

  const clean = (v, max) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);
  const d = {
    format: FORMATS[b.format] ? b.format : "",
    interest: INTERESTS[b.interest] ? b.interest : "other",
    first: clean(b.firstName, 80),
    last: clean(b.lastName, 80),
    email: clean(b.email, 200).toLowerCase(),
    phone: "+" + String(b.phone ?? "").replace(/\D/g, ""),
    lang: LANGS[b.language] ? b.language : "es",
    message: String(b.message ?? "").trim().slice(0, 2000),
    tz: validTz(b.timezone) ? b.timezone : OFFICE_TZ,
    page: clean(b.page, 200),
    start: Date.parse(b.startTime),
  };
  const bad = [];
  if (!d.format) bad.push("format");
  if (!d.first) bad.push("firstName");
  if (!d.last) bad.push("lastName");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email)) bad.push("email");
  if (!/^\+\d{8,16}$/.test(d.phone)) bad.push("phone");
  if (!Number.isFinite(d.start) || d.start < Date.now() || d.start > Date.now() + MAX_DAYS * 864e5) bad.push("startTime");
  if (bad.length) return json({ error: "invalid", fields: bad }, 400);

  const cal = await calendar(calendarFor(d.format));
  if (!cal.locationId) throw new Error("No location id: set GHL_LOCATION_ID or check the token's calendar access");
  const minutes = minutesFor(d.format, cal);

  // Check the time is still free right before booking
  const around = await freeSlots(cal, Math.max(Date.now(), d.start - 864e5), d.start + 864e5);
  if (!fitting(around, minutes, cal).includes(d.start)) return json({ error: "slot_taken" }, 409);

  const up = await ghl("/contacts/upsert", {
    method: "POST", version: "2021-07-28",
    body: { locationId: cal.locationId, firstName: d.first, lastName: d.last, name: `${d.first} ${d.last}`, email: d.email, phone: d.phone, timezone: d.tz },
  });
  const contactId = up?.contact?.id;
  if (!contactId) throw new Error("Contact upsert returned no id");

  const details = describe(d, minutes);
  let appt;
  try {
    appt = await ghl("/calendars/events/appointments", {
      method: "POST",
      body: {
        calendarId: cal.id,
        locationId: cal.locationId,
        contactId,
        startTime: isoIn(d.start, OFFICE_TZ),
        endTime: isoIn(d.start + minutes * 6e4, OFFICE_TZ),
        title: `${FORMATS[d.format].label} · ${d.first} ${d.last}`,
        description: details,
        appointmentStatus: "confirmed",
        toNotify: true,
        // A meeting longer than the calendar's slots was checked above, slot by slot
        ...(minutes > cal.duration ? { ignoreFreeSlotValidation: true } : {}),
      },
    });
  } catch (e) {
    if (e.status >= 400 && e.status < 500 && /slot|availab|booked|taken/i.test(JSON.stringify(e.data || ""))) return json({ error: "slot_taken" }, 409);
    throw e;
  }

  // Extras: tags (added, never replacing existing ones), a note with the details, and the
  // lead source for new contacts. A failure here doesn't undo the booking.
  const extras = await Promise.allSettled([
    ghl(`/contacts/${contactId}/tags`, {
      method: "POST", version: "2021-07-28",
      body: { tags: ["agenda-web", `interes-${INTERESTS[d.interest].tag}`, `formato-${FORMATS[d.format].tag}`, `idioma-${d.lang}`] },
    }),
    ghl(`/contacts/${contactId}/notes`, { method: "POST", version: "2021-07-28", body: { body: `Cita agendada desde el sitio web\n\n${details}` } }),
    up.new ? ghl(`/contacts/${contactId}`, { method: "PUT", version: "2021-07-28", body: { source: SOURCE } }) : null,
  ]);
  for (const x of extras) if (x.status === "rejected") console.error("[booking] extra step failed:", x.reason?.message, JSON.stringify(x.reason?.data || "").slice(0, 400));

  return json({ ok: true, appointmentId: appt?.id || null, start: d.start, minutes });
}

function describe(d, minutes) {
  const local = (tz) => new Intl.DateTimeFormat("es-MX", { timeZone: tz, dateStyle: "full", timeStyle: "short" }).format(d.start);
  const lines = [
    `Interés: ${INTERESTS[d.interest].label}`,
    `Formato: ${FORMATS[d.format].label} (${minutes} min)`,
    `Idioma de la reunión: ${LANGS[d.lang]}`,
    `WhatsApp / teléfono: ${d.phone}`,
    `Hora en Tulum: ${local(OFFICE_TZ)}`,
  ];
  if (d.tz !== OFFICE_TZ) lines.push(`Hora del cliente: ${local(d.tz)} (${d.tz})`);
  if (d.message) lines.push("", `Mensaje: ${d.message}`);
  lines.push("", `Agendado en jjfcreando.com${d.page && d.page !== "/" ? d.page : ""}`);
  return lines.join("\n");
}

function validTz(tz) {
  if (!tz || typeof tz !== "string") return false;
  try { new Intl.DateTimeFormat("en-US", { timeZone: tz }); return true; } catch { return false; }
}

// "2026-10-05T09:00:00-05:00": the time as GoHighLevel's examples write it, with the zone's offset
function isoIn(ms, tz) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", {
    timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(ms).map((x) => [x.type, x.value]));
  const off = Math.round((Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - Math.floor(ms / 1000) * 1000) / 6e4);
  const two = (n) => String(n).padStart(2, "0");
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}${off < 0 ? "-" : "+"}${two(Math.floor(Math.abs(off) / 60))}:${two(Math.abs(off) % 60)}`;
}
