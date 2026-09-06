// One analytics list (plan §9): GA4 + Meta Pixel, loaded after LCP via requestIdleCallback, only when configured. Consent Mode v2 defaults granted (MX-first, plan §14).
export function track(name: string, params: Record<string, unknown> = {}) {
  const w = window as any;
  const base = { tier: document.documentElement.dataset.tier, lang: document.documentElement.dataset.lang, ...params };
  w.gtag?.('event', name, base);
  if (name === 'form_submit') w.fbq?.('track', 'Lead', base);
  else if (name === 'whatsapp_click' || name === 'booking_view') w.fbq?.('track', 'Contact', base);
  if (import.meta.env.DEV) console.debug('[track]', name, base);
}

let loaded = false;
function load() {
  if (loaded) return; loaded = true;
  const w = window as any;
  const ga = import.meta.env.PUBLIC_GA4_ID as string | undefined;
  const px = import.meta.env.PUBLIC_META_PIXEL_ID as string | undefined;
  if (ga) {
    w.dataLayer = w.dataLayer || [];
    w.gtag = function () { w.dataLayer.push(arguments); };
    w.gtag('consent', 'default', { ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted', analytics_storage: 'granted' });
    w.gtag('js', new Date());
    w.gtag('config', ga, { send_page_view: false });
    const s = document.createElement('script'); s.async = true; s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga)}`; document.head.appendChild(s);
  }
  if (px) {
    const f: any = (w.fbq = function () { f.callMethod ? f.callMethod.apply(f, arguments) : f.queue.push(arguments); });
    if (!w._fbq) w._fbq = f; f.push = f; f.loaded = true; f.version = '2.0'; f.queue = [];
    const s = document.createElement('script'); s.async = true; s.src = 'https://connect.facebook.net/en_US/fbevents.js'; document.head.appendChild(s);
    w.fbq('init', px);
  }
  pageView();
}

function pageView() {
  const w = window as any;
  w.gtag?.('event', 'page_view', { page_location: location.href, page_title: document.title, tier: document.documentElement.dataset.tier, lang: document.documentElement.dataset.lang });
  w.fbq?.('track', 'PageView');
}

export function initAnalytics() {
  document.addEventListener('click', (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-event]');
    if (el) track(el.dataset.event!, { section: el.dataset.section, project: el.dataset.project });
  });
  const ga = import.meta.env.PUBLIC_GA4_ID, px = import.meta.env.PUBLIC_META_PIXEL_ID;
  if (!ga && !px) return;
  if ('requestIdleCallback' in window) (window as any).requestIdleCallback(load, { timeout: 4000 }); else setTimeout(load, 2500);
  document.addEventListener('astro:page-load', () => { if (loaded) pageView(); });
}
