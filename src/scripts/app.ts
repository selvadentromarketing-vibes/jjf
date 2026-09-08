import { initTier } from './tier';
import { initSolar } from './solar';
import { initSmooth } from './smooth';
import { initDoor } from './door';
import { initReveals } from './reveal';
import { initGround } from './ground';
import { initPlano } from './plano';
import { initLight } from './light';
import { initContact } from './contact';
import { initAnalytics } from './analytics';
import { initVitals } from './vitals';
import { ls } from './motion';

function perPage() { initReveals(); initGround(); initPlano(); initLight(); initContact(); }

initTier();
initSolar();
initSmooth();
initDoor();
initAnalytics();
initVitals();
document.addEventListener('astro:page-load', perPage);
// <html> attributes are replaced on every swap: tier and solar tokens are re-applied.
document.addEventListener('astro:after-swap', () => { initTier(); initSolar(); });
ls.set('jjf-seen', '1');
