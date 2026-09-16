// The hero's film (plan §S1). An enhancement over the plate, never a condition of it.
//
// Nothing is fetched until the page has loaded, so the film can never compete with the plate for
// the largest paint. Its first frame is the plate, so the cross is a cut nobody sees; it waits for
// the plate's arrival and, when the hero carries the drawn plan, for the drawing to finish, then
// it starts: a hand pulls the tracing paper off the printed plan and the film goes on into the
// land. It never comes back to the table: the loop is the land alone, from `data-loop-in` to the
// end (the last second is cut to dissolve into that point). If it will not play — Low Power Mode,
// an in-app browser that blocks autoplay, Save-Data, reduced motion — the plate stays, and the
// plate is the designed hero.
import { reduce } from './motion';
import { onSwap } from './lifecycle';

const ARRIVAL_MS = 2600;
const OVERTURE_MS = 4300;   // first visit: the door and the drawing come first
const PLANO_WAIT_MS = 5200; // a drawing that never reports done does not hold the film forever

export function initHero() {
  const video = document.querySelector<HTMLVideoElement>('[data-hero-video]');
  if (!video || video.dataset.started) return;
  const saveData = (navigator as any).connection?.saveData === true;
  // A device that cannot carry a shader is not asked to decode a film either.
  const html = document.documentElement;
  const tier = html.dataset.tier;
  if (reduce() || saveData || tier === 'css' || tier === 'rest') return;
  video.dataset.started = '1';

  const wait = html.classList.contains('door-pending') ? OVERTURE_MS : ARRIVAL_MS;
  const arrived = new Promise<void>((r) => setTimeout(r, Math.max(0, wait - performance.now())));
  const plano = video.parentElement?.querySelector<HTMLElement>('.plano');
  const drawn = new Promise<void>((r) => {
    if (!plano || plano.classList.contains('is-done')) return r();
    addEventListener('jjf:plano-done', () => r(), { once: true });
    setTimeout(r, PLANO_WAIT_MS);
  });

  const loopIn = Number(video.dataset.loopIn) || 0;
  let live = false;
  const start = () => {
    video.querySelectorAll<HTMLSourceElement>('source[data-src]').forEach((s) => {
      s.src = s.dataset.src!;
      s.removeAttribute('data-src');
    });
    video.load();
    // Arm, then start. The film must begin on its first frame the moment it is shown — that frame
    // is the plate, and the hand that follows is what the drawing is erased against — so it is
    // played until it has frames ('playing', not 'canplay'), held on frame zero, and released only
    // once the plate has arrived and the plan is drawn.
    const armed = new Promise<void>((r) => video.addEventListener('playing', () => { video.pause(); video.currentTime = 0; r(); }, { once: true }));
    Promise.all([armed, arrived, drawn]).then(() => {
      video.addEventListener('playing', () => {
        video.classList.add('is-ready');
        dispatchEvent(new Event('jjf:hero-film'));
      }, { once: true });
      live = true;
      video.play().catch(() => {});
    });
    // The land loop: back to the forest floor, never to the table.
    if (loopIn) video.addEventListener('ended', () => { video.currentTime = loopIn; video.play().catch(() => {}); });
    video.play().catch(() => {});
  };

  const idle = (window as any).requestIdleCallback ?? ((fn: () => void) => setTimeout(fn, 300));
  if (document.readyState === 'complete') idle(start);
  else addEventListener('load', () => idle(start), { once: true });

  // Off screen it is only heat.
  const io = new IntersectionObserver((entries) => {
    if (!live) return;
    if (entries[0].isIntersecting) video.play().catch(() => {});
    else video.pause();
  }, { rootMargin: '10% 0px' });
  io.observe(video);
  onSwap(() => io.disconnect());
}
