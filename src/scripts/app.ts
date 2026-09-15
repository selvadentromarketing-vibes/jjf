import { initLifecycle } from './lifecycle';
import { initTier } from './tier';
import { initSolar } from './solar';
import { initDoor } from './door';
import { initNav } from './nav';
import { initHero } from './hero';
import { initReveals } from './reveal';
import { initGround } from './ground';
import { initPlano } from './plano';
import { initReading } from './reading';
import { initContact } from './contact';
import { initAnalytics } from './analytics';
import { initVitals } from './vitals';
import { ls, reduce } from './motion';

// The two WebGL layers are the heaviest code on the site and most pages have no surface for them.
// They are fetched only on a page that carries a host, and only on a device the tier allows, so a
// guide or the privacy notice never downloads a shader.
async function lightAndPanel() {
  if (reduce()) return;
  const tier = document.documentElement.dataset.tier;
  const gl = tier !== 'in_app' && tier !== 'css' && tier !== 'rest';
  if (gl && document.querySelector('[data-light]')) (await import('./light')).initLight();
  if (document.querySelector('[data-index]')) (await import('./panel')).initPanel();
}

function perPage() { initNav(); initReveals(); initGround(); initHero(); initPlano(); initReading(); initContact(); lightAndPanel(); }

initLifecycle();
initTier();
initSolar();
initDoor();
initAnalytics();
initVitals();
document.addEventListener('astro:page-load', perPage);
// Astro replaces the whole <html> element on a swap, so every class and data attribute set at
// runtime is gone. Without restoring 'js' the contact accordion loses its collapsed state and
// renders with every pane open.
document.addEventListener('astro:after-swap', () => {
  const html = document.documentElement;
  html.classList.add('js');
  if (ls.get('jjf-seen')) html.classList.add('returning');
  initTier();
  initSolar();
});
ls.set('jjf-seen', '1');
