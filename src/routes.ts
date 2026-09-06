export const LOCALES = ['es', 'en'] as const;
export type Lang = (typeof LOCALES)[number];

const R = {
  home: { es: '/es/', en: '/en/' },
  project: { es: '/es/proyectos/[slug]/', en: '/en/projects/[slug]/' },
  vision: { es: '/es/vision/', en: '/en/vision/' },
  track: { es: '/es/trayectoria/', en: '/en/track-record/' },
  how: { es: '/es/como-se-compra/', en: '/en/how-it-works/' },
  contact: { es: '/es/contacto/', en: '/en/contact/' },
  thanks: { es: '/es/gracias/', en: '/en/thank-you/' },
  privacy: { es: '/es/aviso-de-privacidad/', en: '/en/privacy/' },
} as const;

export type RouteKey = keyof typeof R;

export function href(key: RouteKey, lang: Lang, params: Record<string, string> = {}): string {
  return R[key][lang].replace(/\[(\w+)\]/g, (_, k: string) => params[k] ?? '');
}

export function alternates(key: RouteKey, params: Record<string, string> = {}): Record<Lang, string> {
  return { es: href(key, 'es', params), en: href(key, 'en', params) };
}

export const other = (lang: Lang): Lang => (lang === 'es' ? 'en' : 'es');
