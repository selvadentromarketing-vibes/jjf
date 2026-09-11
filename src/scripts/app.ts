import { initTier } from './tier';
import { initSolar } from './solar';
import { initSmooth } from './smooth';
import { initDoor } from './door';
import { initHero } from './hero';
import { initReveals } from './reveal';
import { initGround } from './ground';
import { initPlano } from './plano';
import { initLight } from './light';
import { initPanel } from './panel';
import { initContact } from './contact';
import { initAnalytics } from './analytics';
import { initVitals } from './vitals';
import { ls } from './motion';

function perPage() { initReveals(); initGround(); initHero(); initPlano(); initLight(); initPanel(); initContact(); }

initTier();
initSolar();
initSmooth();
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
