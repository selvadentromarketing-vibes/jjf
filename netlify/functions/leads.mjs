import { getStore } from '@netlify/blobs';
import { timingSafeEqual } from 'node:crypto';

// Reading back what /api/lead stored.
//
// The enquiry endpoint writes every lead to durable storage before it calls the CRM, so that a CRM
// that is down or — as today — not yet configured can never cost an enquiry. That guarantee is
// only half a guarantee while nothing can read the store back: the leads are safe and invisible.
// This is the other half. It stays useful after the CRM is wired, as the record that does not
// depend on it.
//
// Guarded by LEADS_TOKEN in the Netlify environment. Without one the endpoint does not exist —
// this returns personal data and must fail closed, never open.
export const config = { path: '/api/leads' };

const MIN_TOKEN = 24;

const deny = (status, error) =>
  new Response(JSON.stringify({ ok: false, error }), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' },
  });

function authorised(request, url, expected) {
  const header = request.headers.get('authorization') || '';
  // The query string is accepted so a person can open this in a browser. It is the weaker route —
  // URLs end up in history and proxy logs — so rotate the token if one has been shared that way.
  const given = header.startsWith('Bearer ') ? header.slice(7) : url.searchParams.get('token') || '';
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

const CSV_COLUMNS = ['id', 'receivedAt', 'nombre', 'telefono', 'email', 'lugar', 'idioma', 'jjf_lang', 'jjf_source', 'utm.source', 'utm.medium', 'utm.campaign', 'utm.content'];
const at = (o, path) => path.split('.').reduce((v, k) => (v == null ? v : v[k]), o);
// Excel and Sheets read a leading =, +, - or @ as a formula, and a phone number written +52... is
// exactly that. Prefixing an apostrophe keeps the cell text.
const csvCell = (v) => {
  const s = v === undefined || v === null ? '' : String(v);
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

export default async (request) => {
  if (request.method !== 'GET') return deny(405, 'method_not_allowed');

  const expected = process.env.LEADS_TOKEN || '';
  if (expected.length < MIN_TOKEN) {
    console.warn('LEADS_TOKEN missing or shorter than', MIN_TOKEN, 'characters — /api/leads is closed');
    return deny(404, 'not_found');
  }

  const url = new URL(request.url);
  if (!authorised(request, url, expected)) return deny(401, 'unauthorised');

  const since = url.searchParams.get('since');           // ISO date or datetime
  const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '500', 10) || 500, 1), 2000);
  const csv = url.searchParams.get('format') === 'csv';

  let keys = [];
  try {
    const store = getStore('leads');
    ({ blobs: keys = [] } = await store.list());
    // Keys begin with the ISO timestamp, so sorting them descending is newest first without
    // reading a single blob.
    keys.sort((a, b) => (a.key < b.key ? 1 : -1));
    if (since) keys = keys.filter((k) => k.key >= since.replace(/[:.]/g, '-'));
    keys = keys.slice(0, limit);
    const leads = await Promise.all(keys.map(async (k) => ({ id: k.key, ...(await store.get(k.key, { type: 'json' })) })));
    const body = csv
      ? [CSV_COLUMNS.join(','), ...leads.map((l) => CSV_COLUMNS.map((c) => csvCell(at(l, c))).join(','))].join('\n')
      : JSON.stringify({ ok: true, count: leads.length, leads }, null, 2);
    return new Response(body, {
      headers: {
        'Content-Type': csv ? 'text/csv; charset=utf-8' : 'application/json',
        'Cache-Control': 'no-store',
        'X-Robots-Tag': 'noindex, nofollow',
        ...(csv ? { 'Content-Disposition': `attachment; filename="jjf-leads-${new Date().toISOString().slice(0, 10)}.csv"` } : {}),
      },
    });
  } catch (err) {
    console.error('LEADS_READ_FAILED', err?.message);
    return deny(503, 'unavailable');
  }
};
