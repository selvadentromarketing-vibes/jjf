// Deploy previews and branch deploys carry X-Robots-Tag: noindex (plan §9). Production is untouched.
export default async (_request: Request, context: any) => {
  const response = await context.next();
  const ctx = (globalThis as any).Netlify?.env?.get?.('CONTEXT') ?? (globalThis as any).Deno?.env?.get?.('CONTEXT');
  if (ctx && ctx !== 'production') {
    const headers = new Headers(response.headers);
    headers.set('X-Robots-Tag', 'noindex, nofollow');
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  }
  return response;
};
