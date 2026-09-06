// Reveals happen once, by subtraction, at 22 % visibility. Under reduced motion everything is simply present.
import { reduce, ls } from './motion';

export function initReveals() {
  const els = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]:not(.is-in)'));
  if (reduce() || !('IntersectionObserver' in window)) {
    els.forEach((e) => e.classList.add('is-in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      for (const en of entries) if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
    }, { threshold: 0.22 });
    els.forEach((e) => io.observe(e));
  }
  document.querySelectorAll('.hero').forEach((h) => h.classList.add('is-dawn'));

  // The Silence rotates for returning visitors.
  document.querySelectorAll<HTMLElement>('[data-silence]').forEach((el) => {
    try {
      const list: string[] = JSON.parse(el.dataset.sentences || '[]');
      if (list.length < 2) return;
      const key = 'jjf-silence:' + location.pathname;
      const n = parseInt(ls.get(key) || '0', 10);
      const text = el.querySelector<HTMLElement>('[data-silence-text]');
      if (text && n > 0) text.innerHTML = list[n % list.length];
      ls.set(key, String(n + 1));
    } catch { /* ignore */ }
  });
}
