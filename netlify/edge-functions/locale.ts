// Sends every unprefixed path to /es/ or /en/. Browser language first, then country. Query string (UTMs, fbclid) preserved.
const ES_COUNTRIES = new Set(['MX', 'ES', 'AR', 'CO', 'CL', 'PE', 'VE', 'EC', 'GT', 'CU', 'BO', 'DO', 'HN', 'PY', 'SV', 'NI', 'CR', 'PA', 'UY', 'PR', 'GQ']);
const ES_SEGMENTS = new Set(['proyectos', 'vision', 'trayectoria', 'como-se-compra', 'contacto', 'gracias', 'aviso-de-privacidad']);
const EN_SEGMENTS = new Set(['projects', 'track-record', 'how-it-works', 'contact', 'thank-you', 'privacy']);

function pick(acceptLanguage: string | null, country: string | undefined): 'es' | 'en' {
  const langs = (acceptLanguage ?? '').split(',').map((s) => s.trim().split(';')[0].toLowerCase()).filter(Boolean);
  for (const l of langs) {
    if (l.startsWith('es')) return 'es';
    if (l.startsWith('en')) return 'en';
  }
  if (country && ES_COUNTRIES.has(country)) return 'es';
  return country ? 'en' : 'es';
}

export default async (request: Request, context: any) => {
  const url = new URL(request.url);
  const first = url.pathname.split('/').filter(Boolean)[0];
  let lang: 'es' | 'en';
  if (first && ES_SEGMENTS.has(first)) lang = 'es';
  else if (first && EN_SEGMENTS.has(first)) lang = 'en';
  else lang = pick(request.headers.get('accept-language'), context?.geo?.country?.code);
  let path = url.pathname;
  if (!path.endsWith('/')) path += '/';
  const target = new URL(`/${lang}${path === '/' ? '/' : path}`, url.origin);
  target.search = url.search;
  return new Response(null, { status: 302, headers: { Location: target.toString(), Vary: 'Accept-Language', 'Cache-Control': 'no-store' } });
};
