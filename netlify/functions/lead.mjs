import { createHash } from 'node:crypto';
import { getStore } from '@netlify/blobs';

// The contact endpoint. The form posts straight here, so the funnel does not depend on Netlify's
// form detection being switched on in the dashboard — a setting that was off, which silently 404'd
// every enquiry.
//
// Order of operations matters: the lead is written to durable storage BEFORE the CRM is contacted.
// A CRM that is down, rate limited or not yet configured must never cost us an enquiry.
export const config = { path: '/api/lead' };

const THANKS = { es: '/es/gracias/', en: '/en/thank-you/' };
const PROJECTS = new Set(['selvadentro', 'aldea-zama', 'selvazama', 'yucatan-country-club', 'amelia-tulum', 'hacienda-sacala', 'aun-no-se']);

const clean = (v, max = 200) => String(v ?? '').replace(/[\u0000-\u001F\u007F]/g, ' ').trim().slice(0, max);

async function readFields(request) {
  const type = request.headers.get('content-type') || '';
  if (type.includes('application/json')) return await request.json();
  const form = await request.formData();
  return Object.fromEntries([...form.entries()].map(([k, v]) => [k, typeof v === 'string' ? v : '']));
}

export default async (request) => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  let raw;
  try {
    raw = await readFields(request);
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'bad_request' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const lang = raw.jjf_lang === 'en' ? 'en' : 'es';
  const wantsJson = (request.headers.get('accept') || '').includes('application/json');
  const done = (status, body) =>
    wantsJson
      ? new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })
      : new Response(null, { status: 303, headers: { Location: THANKS[lang], 'Cache-Control': 'no-store' } });

  // The hidden field a person never sees and a bot always fills. Answer as if accepted, but log
  // it: a honeypot that discards silently is indistinguishable from a lost lead, and this one did
  // once catch real people because the form focused the trap by mistake.
  if (clean(raw.empresa)) {
    console.log('LEAD_HONEYPOT', JSON.stringify({ nombre: clean(raw.nombre, 120), email: clean(raw.email, 160), telefono: clean(raw.telefono, 40) }));
    return done(200, { ok: true });
  }

  const lead = {
    nombre: clean(raw.nombre || raw.name, 120),
    telefono: clean(raw.telefono || raw.phone, 40),
    email: clean(raw.email, 160),
    lugar: PROJECTS.has(clean(raw.lugar)) ? clean(raw.lugar) : 'aun-no-se',
    idioma: raw.idioma === 'en' ? 'en' : 'es',
    consentimiento: clean(raw.consentimiento) === 'si',
    jjf_lang: lang,
    jjf_source: clean(raw.jjf_source, 120) || 'web',
    utm: {
      source: clean(raw.utm_source, 120),
      medium: clean(raw.utm_medium, 120),
      campaign: clean(raw.utm_campaign, 160),
      content: clean(raw.utm_content, 160),
    },
    receivedAt: new Date().toISOString(),
    userAgent: clean(request.headers.get('user-agent'), 250),
  };

  if (!lead.nombre || (!lead.telefono && !lead.email) || !lead.consentimiento) {
    return done(422, { ok: false, error: 'incomplete' });
  }

  // 1. Durability first. If this fails we still keep the lead in the function log, which is
  //    recoverable, and we tell the visitor the truth only if we have nowhere at all to put it.
  const id = `${lead.receivedAt.replace(/[:.]/g, '-')}-${Math.random().toString(36).slice(2, 8)}`;
  let stored = false;
  try {
    await getStore('leads').setJSON(id, lead);
    stored = true;
  } catch (err) {
    console.error('LEAD_STORE_FAILED', err?.message);
  }
  // Always log the whole lead: the Netlify function log is the last line of defence.
  console.log('LEAD', JSON.stringify({ id, stored, ...lead }));

  // 2. Then the CRM. A failure here is logged and retried by hand, never surfaced to the visitor,
  //    because the enquiry is already safe.
  const token = process.env.GHL_PIT;
  const locationId = process.env.GHL_LOCATION_ID;
  let crm = 'not_configured';
  if (token && locationId) {
    try {
      const [firstName, ...rest] = lead.nombre.split(/\s+/);
      const res = await fetch('https://services.leadconnectorhq.com/contacts/', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, Version: '2021-07-28', 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          locationId,
          firstName: firstName || undefined,
          lastName: rest.join(' ') || undefined,
          phone: lead.telefono || undefined,
          email: lead.email || undefined,
          source: `jjfcreando.com · ${lead.jjf_source}`,
          tags: ['jjfcreando.com', `proyecto:${lead.lugar}`, `idioma:${lead.idioma}`],
          customFields: [
            { key: 'jjf_project', field_value: lead.lugar },
            { key: 'jjf_lang', field_value: lead.idioma },
            { key: 'jjf_source', field_value: lead.jjf_source },
            { key: 'utm_source', field_value: lead.utm.source },
            { key: 'utm_medium', field_value: lead.utm.medium },
            { key: 'utm_campaign', field_value: lead.utm.campaign },
            { key: 'utm_content', field_value: lead.utm.content },
          ],
        }),
      });
      crm = res.ok ? 'ok' : `error_${res.status}`;
      if (!res.ok) console.error('CRM_FAILED', res.status, (await res.text()).slice(0, 300));
    } catch (err) {
      crm = 'error_network';
      console.error('CRM_FAILED', err?.message);
    }
  }

  if (!stored && crm !== 'ok') return done(503, { ok: false, error: 'unavailable' });

  // 3. ChatGPT Ads (OpenAI Conversions API), only for a lead we kept: a visitor told "unavailable"
  //    did not convert. Same rule as the CRM: a failure is logged and never reaches the visitor.
  //    The event id matches the one the browser pixel sends, and OpenAI keeps only one of the two.
  const ads = await sendAdsLead(request, raw, lead, id);
  return done(200, { ok: true, id, crm, ads });
};

const OPENAI_PIXEL_ID = '97xWEtcR8ecHrJVd2oeALY';
const CONTACT = { es: 'https://jjfcreando.com/es/contacto/', en: 'https://jjfcreando.com/en/contact/' };
const sha256 = (v) => createHash('sha256').update(v).digest('hex');

function cookie(request, name) {
  const all = request.headers.get('cookie') || '';
  for (const part of all.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) {
      try { return decodeURIComponent(v.join('=')); } catch { return v.join('='); }
    }
  }
  return '';
}

// Sends the lead to OpenAI as `lead_created`. Needs OPENAI_CONVERSIONS_API_KEY in Netlify's
// environment variables; without it nothing is sent. Only what OpenAI uses to match the ad click
// leaves the site: the email lowercased, trimmed and SHA-256 hashed, the IP and the browser.
// The name and the phone never go.
async function sendAdsLead(request, raw, lead, id) {
  const key = process.env.OPENAI_CONVERSIONS_API_KEY;
  if (!key) return 'not_configured';
  const eid = clean(raw.jjf_eid, 80);
  const user = {};
  if (lead.email) user.email_sha256 = sha256(lead.email.toLowerCase().trim());
  const ip = request.headers.get('x-nf-client-connection-ip') || (request.headers.get('x-forwarded-for') || '').split(',')[0].trim();
  if (ip) user.ip_address = ip;
  if (lead.userAgent) user.user_agent = lead.userAgent;
  const referer = request.headers.get('referer') || '';
  const event = {
    id: /^[\w.-]{6,80}$/.test(eid) ? eid : id,
    type: 'lead_created',
    timestamp_ms: Date.parse(lead.receivedAt),
    action_source: 'web',
    source_url: /^https?:\/\//.test(referer) ? referer.slice(0, 500) : CONTACT[lead.jjf_lang],
    user,
    data: { type: 'customer_action' },
  };
  const oppref = cookie(request, '__oppref');
  if (oppref) event.oppref = oppref.slice(0, 500);
  try {
    const res = await fetch(`https://bzr.openai.com/v1/events?pid=${OPENAI_PIXEL_ID}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ validate_only: process.env.OPENAI_CONVERSIONS_VALIDATE_ONLY === '1', events: [event] }),
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) console.error('ADS_FAILED', res.status, (await res.text()).slice(0, 300));
    return res.ok ? 'ok' : `error_${res.status}`;
  } catch (err) {
    console.error('ADS_FAILED', err?.message);
    return 'error_network';
  }
}
