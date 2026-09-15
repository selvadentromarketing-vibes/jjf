// The sheet: the site's sections on a phone, opened from the header in the current ground.
// A dialog in the strict sense — focus stays inside it, Escape closes it, the page behind it is
// inert — and nothing more: no scrim, no slide, the ground simply fills and the lines rise.
import { onSwap } from './lifecycle';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([type=hidden]), select, textarea, [tabindex]:not([tabindex="-1"])';

export function initNav() {
  const header = document.querySelector<HTMLElement>('[data-nav]');
  const sheet = header?.querySelector<HTMLElement>('[data-sheet]');
  const opener = header?.querySelector<HTMLButtonElement>('[data-sheet-open]');
  if (!header || !sheet || !opener) return;
  const html = document.documentElement;
  const behind = () => Array.from(document.querySelectorAll<HTMLElement>('main, footer'));
  let open = false;
  let timer = 0;

  const show = () => {
    if (open) return;
    open = true;
    clearTimeout(timer);
    sheet.hidden = false;
    opener.setAttribute('aria-expanded', 'true');
    html.classList.add('sheet-open');
    behind().forEach((el) => el.setAttribute('inert', ''));
    // Two frames: the first paints the sheet at rest, the second lets the lines rise from it.
    requestAnimationFrame(() => requestAnimationFrame(() => sheet.classList.add('is-in')));
    sheet.querySelector<HTMLElement>('[data-sheet-close]')?.focus({ preventScroll: true });
  };

  const hide = (refocus = true) => {
    if (!open) return;
    open = false;
    sheet.classList.remove('is-in');
    opener.setAttribute('aria-expanded', 'false');
    html.classList.remove('sheet-open');
    behind().forEach((el) => el.removeAttribute('inert'));
    if (refocus) opener.focus({ preventScroll: true });
    const ms = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 260;
    timer = window.setTimeout(() => { sheet.hidden = true; }, ms);
  };

  opener.addEventListener('click', show);
  sheet.querySelector('[data-sheet-close]')?.addEventListener('click', () => hide());
  // A link inside the sheet is a navigation: the sheet goes as the page goes.
  sheet.querySelectorAll<HTMLElement>('[data-sheet-link]').forEach((a) => a.addEventListener('click', () => hide(false)));

  const onKey = (e: KeyboardEvent) => {
    if (!open) return;
    if (e.key === 'Escape') { e.preventDefault(); hide(); return; }
    if (e.key !== 'Tab') return;
    const items = Array.from(sheet.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };
  document.addEventListener('keydown', onKey);

  // Past the breakpoint the sections are in the header again and an open sheet would be a trap.
  const mq = matchMedia('(min-width: 900px)');
  const onMq = () => { if (mq.matches) hide(false); };
  mq.addEventListener('change', onMq);

  onSwap(() => {
    document.removeEventListener('keydown', onKey);
    mq.removeEventListener('change', onMq);
    clearTimeout(timer);
    html.classList.remove('sheet-open');
  });
}
