// Capability tiers (plan §9): in_app · webview_link · mobile_gl · desktop_gl · css · rest. The 1 s frame-time probe joins with the light layer in Phase 2.
function hasGL() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl') || c.getContext('experimental-webgl')); } catch { return false; }
}
export type Tier = 'in_app' | 'webview_link' | 'mobile_gl' | 'desktop_gl' | 'css' | 'rest';

export function detectTier(): Tier {
  const ua = navigator.userAgent;
  const inApp = /Instagram|FBAN|FBAV|FB_IAB|FBIOS|Line\/|MicroMessenger/i.test(ua);
  const webview = !inApp && (/\bwv\b/.test(ua) || (/(iPhone|iPad|iPod)/.test(ua) && /AppleWebKit/.test(ua) && !/Safari/.test(ua)));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = matchMedia('(pointer: coarse)').matches;
  const cores = navigator.hardwareConcurrency ?? 0;
  const lowEnd = cores > 0 && cores <= 4 && /Android/.test(ua);
  if (reduce) return 'rest';
  if (inApp) return 'in_app';
  if (webview) return 'webview_link';
  if (!hasGL() || lowEnd) return 'css';
  return coarse ? 'mobile_gl' : 'desktop_gl';
}

export function initTier() {
  const tier = detectTier();
  document.documentElement.dataset.tier = tier;
  (window as any).__jjfTier = tier;
}
