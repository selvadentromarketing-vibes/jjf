import { test, expect } from '@playwright/test';

// The contact path once depended on Netlify's form detection being switched on in the dashboard.
// It was off, so every enquiry 404'd and was lost, and nothing in the build could tell. These
// guard the wiring that replaced it. The endpoint itself only runs on Netlify, so the end-to-end
// check has to be made against a deploy.
const FORMS: [string, string, string][] = [
  ['/es/contacto/', 'es', 'contacto-es'],
  ['/en/contact/', 'en', 'contacto-en'],
];

// Deliberately not gated to one project: the wiring has to be right on the phone too, which is
// where almost every enquiry actually comes from.
test.describe('the enquiry form is wired to an endpoint we own', () => {
  for (const [path, lang, name] of FORMS) {
    test(`${path} posts to /api/lead`, async ({ page }) => {
      await page.goto(path);
      const form = page.locator('form[data-contact-form]');

      // Posting anywhere else means leads go nowhere.
      await expect(form).toHaveAttribute('action', '/api/lead');
      await expect(form).toHaveAttribute('method', /post/i);
      await expect(form).toHaveAttribute('name', name);

      // Netlify Forms is no longer in the path; leftovers would imply a second, dead route.
      expect(await form.getAttribute('data-netlify')).toBeNull();
      expect(await form.locator('input[name="form-name"]').count()).toBe(0);

      // Everything the function needs to identify and route the lead.
      for (const field of ['nombre', 'telefono', 'email', 'lugar', 'idioma', 'consentimiento', 'jjf_lang', 'jjf_project', 'jjf_source']) {
        expect(await form.locator(`[name="${field}"]`).count(), `missing field ${field}`).toBeGreaterThan(0);
      }
      await expect(form.locator('input[name="jjf_lang"]')).toHaveValue(lang);

      // The honeypot must stay present and hidden from people.
      const pot = form.locator('input[name="empresa"]');
      await expect(pot).toHaveCount(1);
      await expect(pot).not.toBeInViewport();

      // Consent is required, and one of phone or email must be reachable.
      await expect(form.locator('input[name="consentimiento"]')).toHaveAttribute('required', '');
    });
  }

  test('the thank-you pages the endpoint redirects to exist', async ({ page }) => {
    for (const path of ['/es/gracias/', '/en/thank-you/']) {
      const res = await page.goto(path);
      expect(res?.status(), `${path} is the endpoint's 303 target`).toBe(200);
    }
  });
});
