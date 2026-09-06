// Netlify Forms → LeadConnector (GoHighLevel) v2. Fires on every form submission (plan §7).
// Env: GHL_PIT (Private Integration token), GHL_LOCATION_ID. Without them the function logs and exits 200 so the form still saves in Netlify.
export const handler = async (event) => {
  let payload;
  try { payload = JSON.parse(event.body).payload; } catch { return { statusCode: 400, body: 'bad payload' }; }
  const d = payload?.data ?? {};
  if (d.empresa) return { statusCode: 200, body: 'honeypot' }; // the hidden field a person never fills
  const token = process.env.GHL_PIT, locationId = process.env.GHL_LOCATION_ID;
  if (!token || !locationId) { console.log('GHL not configured; submission kept in Netlify only', { project: d.jjf_project, lang: d.jjf_lang }); return { statusCode: 200, body: 'stored' }; }

  const [firstName, ...rest] = String(d.nombre ?? d.name ?? '').trim().split(/\s+/);
  const body = {
    locationId,
    firstName: firstName || undefined,
    lastName: rest.join(' ') || undefined,
    phone: d.telefono || d.phone || undefined,
    email: d.email || undefined,
    source: `jjfcreando.com · ${d.jjf_source || 'web'}`,
    tags: ['jjfcreando.com', d.jjf_project ? `proyecto:${d.jjf_project}` : 'proyecto:aun-no-se', `idioma:${d.jjf_lang || d.idioma || 'es'}`].filter(Boolean),
    customFields: [
      { key: 'jjf_project', field_value: d.jjf_project || '' },
      { key: 'jjf_lang', field_value: d.jjf_lang || d.idioma || '' },
      { key: 'jjf_source', field_value: d.jjf_source || '' },
      { key: 'utm_source', field_value: d.utm_source || '' },
      { key: 'utm_medium', field_value: d.utm_medium || '' },
      { key: 'utm_campaign', field_value: d.utm_campaign || '' },
      { key: 'utm_content', field_value: d.utm_content || '' },
    ],
  };
  const res = await fetch('https://services.leadconnectorhq.com/contacts/', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, Version: '2021-07-28', 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) { console.error('LeadConnector error', res.status, text); return { statusCode: 502, body: 'crm error' }; }
  return { statusCode: 200, body: 'ok' };
};
