// Ser recibido (plan §7): the doors, the memory layer, WhatsApp pre-fill, the inline booking widget, the form that sends without leaving the page.
import { ls, ss } from './motion';
import { track } from './analytics';

const UTMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'];

export function initContact() {
  const pp = document.querySelector<HTMLElement>('[data-project-page]');
  if (pp?.dataset.projectPage) ls.set('jjf-last-project', pp.dataset.projectPage);
  const params = new URLSearchParams(location.search);
  UTMS.forEach((k) => { const v = params.get(k); if (v && !ss.get(k)) ss.set(k, v); });
  const project = params.get('project') || ls.get('jjf-last-project') || '';

  document.querySelectorAll<HTMLElement>('[data-doors]').forEach((doors) => {
    const select = doors.querySelector<HTMLSelectElement>('[data-field="place"]');
    const known = !!select && Array.from(select.options).some((o) => o.value === project);
    doors.querySelectorAll<HTMLInputElement>('[data-field="project"]').forEach((i) => (i.value = known ? project : ''));
    doors.querySelectorAll<HTMLInputElement>('[data-field="source"]').forEach((i) => { try { i.value = document.referrer ? new URL(document.referrer).hostname : 'direct'; } catch { i.value = 'direct'; } });
    doors.querySelectorAll<HTMLInputElement>('[data-utm]').forEach((i) => (i.value = ss.get(i.dataset.utm!) || ''));
    if (select && known) select.value = project;
    const wa = doors.querySelector<HTMLAnchorElement>('[data-wa]');
    if (wa && select && known) {
      const name = Array.from(select.options).find((o) => o.value === project)?.text;
      if (name && doors.dataset.waNumber) wa.href = `https://wa.me/${doors.dataset.waNumber}?text=${encodeURIComponent((doors.dataset.waTemplate || '').replace('{project}', name))}`;
    }
    doors.querySelectorAll<HTMLButtonElement>('[data-open]').forEach((btn) => btn.addEventListener('click', () => {
      const pane = doors.querySelector<HTMLElement>(`[data-pane="${btn.dataset.open}"]`);
      if (!pane) return;
      const opening = !pane.classList.contains('is-open');
      doors.querySelectorAll('.door-pane').forEach((p) => p.classList.remove('is-open'));
      doors.querySelectorAll('[data-open]').forEach((b) => b.setAttribute('aria-expanded', 'false'));
      if (opening) {
        pane.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
        if (btn.dataset.open === 'booking') mountBooking(pane);
        // The first real field, not the first input. The honeypot has no type attribute, so a
        // ':not([type=hidden])' selector matched it: the caret landed in an off-screen,
        // aria-hidden trap, the visitor typed their name into nothing, and the server then
        // discarded the enquiry as a bot while showing them a thank-you.
        pane.querySelector<HTMLElement>('.field input, .field select, .field textarea')?.focus({ preventScroll: true });
      }
    }));
    const form = doors.querySelector<HTMLFormElement>('[data-contact-form]');
    if (form) {
      form.addEventListener('input', (e) => (e.target as HTMLElement).removeAttribute('aria-invalid'));
      bindForm(form, doors);
    }
  });
}

function mountBooking(pane: HTMLElement) {
  const b = pane.querySelector<HTMLElement>('[data-booking]');
  if (!b || !b.dataset.src || b.querySelector('iframe')) return;
  const url = new URL(b.dataset.src);
  const project = ls.get('jjf-last-project');
  if (project) url.searchParams.set('project', project);
  url.searchParams.set('lang', document.documentElement.dataset.lang || 'es');
  UTMS.forEach((k) => { const v = ss.get(k); if (v) url.searchParams.set(k, v); });
  const f = document.createElement('iframe');
  f.src = url.toString(); f.title = b.dataset.title || 'Booking'; f.loading = 'lazy'; f.setAttribute('scrolling', 'no');
  b.appendChild(f);
}

function bindForm(form: HTMLFormElement, doors: HTMLElement) {
  // One enquiry per submit. Without this an impatient visitor who clicks twice sends the same
  // person to the CRM two or three times.
  let sending = false;

  form.addEventListener('submit', async (e) => {
    const val = (n: string) => (form.querySelector<HTMLInputElement>(`[name="${n}"]`)?.value || '').trim();
    const err = form.querySelector<HTMLElement>('[data-form-error]')!;
    const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    const consent = form.querySelector<HTMLInputElement>('[name="consentimiento"]');

    if (sending) { e.preventDefault(); return; }

    if (!val('nombre') || !consent?.checked || (!val('telefono') && !val('email'))) {
      e.preventDefault();
      // role="alert" on this element means the message is announced, not just shown.
      err.hidden = false; err.textContent = form.dataset.msgNeed || '';
      const bad = !val('nombre')
        ? form.querySelector<HTMLInputElement>('[name="nombre"]')
        : !consent?.checked
          ? consent
          : form.querySelector<HTMLInputElement>('[name="telefono"]');
      bad?.setAttribute('aria-invalid', 'true');
      bad?.focus();
      return;
    }
    e.preventDefault();
    err.hidden = true;
    sending = true;
    if (submit) submit.disabled = true;
    form.classList.add('is-sending');
    try {
      const pairs = Array.from(new FormData(form).entries()).map(([k, v]) => [k, String(v)] as [string, string]);
      // Accept: application/json asks /api/lead for a JSON verdict instead of the 303 a plain
      // form post gets, so we can keep the visitor on the page and show the sent state.
      const res = await fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
        body: new URLSearchParams(pairs).toString(),
      });
      if (!res.ok) throw new Error(String(res.status));
      track('form_submit', { section: 'doors', project: val('lugar') });
      const sent = doors.querySelector<HTMLElement>('[data-form-sent]');
      if (sent) {
        sent.querySelector('[data-sent-line]')!.textContent = sent.dataset.line || '';
        sent.querySelector('[data-sent-promise]')!.textContent = sent.dataset.promise || '';
        form.hidden = true;
        sent.hidden = false;
        // Hiding the form destroys whatever had focus. Move it to the confirmation so a keyboard
        // visitor is left somewhere real, and role="status" announces the change.
        sent.focus();
      }
    } catch {
      sending = false;
      if (submit) submit.disabled = false;
      form.classList.remove('is-sending');
      err.hidden = false; err.textContent = form.dataset.msgError || '';
    }
  });
}
