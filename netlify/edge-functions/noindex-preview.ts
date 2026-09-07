// Only the real domain may be indexed. Every other hostname — branch deploys, deploy previews and
// the site's own *.netlify.app address — carries X-Robots-Tag: noindex (plan §9).
//
// The decision comes from the request's hostname rather than the CONTEXT environment variable: an
// env read that returns nothing would silently leave previews indexable, and a noindex guard has to
// fail closed. Anything not on this list is treated as a preview.
const PRODUCTION_HOSTS = new Set(['jjfcreando.com', 'www.jjfcreando.com']);

export default async (request: Request, context: any) => {
  const response = await context.next();
  if (PRODUCTION_HOSTS.has(new URL(request.url).hostname.toLowerCase())) return response;

  const headers = new Headers(response.headers);
  headers.set('X-Robots-Tag', 'noindex, nofollow');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
};
