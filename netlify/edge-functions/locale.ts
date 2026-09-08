// Sends every unprefixed path to /es/ or /en/. Browser language first, then country. Query string
// (UTMs, fbclid) always preserved.
const ES_COUNTRIES = new Set(['MX', 'ES', 'AR', 'CO', 'CL', 'PE', 'VE', 'EC', 'GT', 'CU', 'BO', 'DO', 'HN', 'PY', 'SV', 'NI', 'CR', 'PA', 'UY', 'PR', 'GQ']);

// Segments unique to one tree decide the language on their own. 'vision' and 'contacto'/'contact'
// style collisions are handled by only trusting a segment when exactly one tree claims it.
const ES_SEGMENTS = new Set(['proyectos', 'vision', 'trayectoria', 'como-se-compra', 'contacto', 'gracias', 'aviso-de-privacidad']);
const EN_SEGMENTS = new Set(['projects', 'vision', 'track-record', 'how-it-works', 'contact', 'thank-you', 'privacy']);
const LOCALES = new Set(['es', 'en']);

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
  const segments = url.pathname.split('/').filter(Boolean);
  const first = (segments[0] ?? '').toLowerCase();

  // A path that already names a locale is only ever normalised, never re-prefixed. netlify.toml
  // excludes "/es/*", but that glob does not match the bare "/es", and it is case-sensitive, so
  // "/es", "/ES" and "/Es" all reached this function and were prefixed a second time into
  // /en/es/ — a 404 on the shortest, most linkable and most likely-to-be-typed URL on the site.
  if (LOCALES.has(first)) {
    const rest = segments.slice(1).join('/');
    const target = new URL(`/${first}/${rest ? rest + '/' : ''}`, url.origin);
    target.search = url.search;
    return Response.redirect(target.toString(), 301);
  }

  // Trust a segment only when exactly one tree claims it. 'vision' spells the same in both, and
  // treating it as Spanish sent every English speaker landing on /vision/ to the Spanish page.
  const inEs = ES_SEGMENTS.has(first);
  const inEn = EN_SEGMENTS.has(first);
  let lang: 'es' | 'en';
  if (inEs && !inEn) lang = 'es';
  else if (inEn && !inEs) lang = 'en';
  else lang = pick(request.headers.get('accept-language'), context?.geo?.country?.code);

  let path = url.pathname;
  if (!path.endsWith('/')) path += '/';
  const target = new URL(`/${lang}${path === '/' ? '/' : path}`, url.origin);
  target.search = url.search;
  return new Response(null, { status: 302, headers: { Location: target.toString(), Vary: 'Accept-Language', 'Cache-Control': 'no-store' } });
};
