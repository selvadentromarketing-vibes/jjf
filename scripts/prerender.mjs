// Bakes the Spanish projects + FAQ markup from content.js into index.html (between the
// <!-- prerender:NAME --> markers) so search engines and no-JS visitors get the full page.
// main.js reuses this markup at runtime and swaps the language in place.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = fileURLToPath(new URL("..", import.meta.url));
const sandbox = { window: {} };
vm.runInNewContext(readFileSync(root + "content.js", "utf8"), sandbox);
const { I18N, projectsMarkup, faqsMarkup } = sandbox.window.JJF_CONTENT;
const t = (key) => I18N.es[key] ?? "";

let html = readFileSync(root + "index.html", "utf8");
const inject = (name, markup) => {
  const re = new RegExp(`(<!-- prerender:${name} -->)[\\s\\S]*?(\\n\\s*<!-- /prerender:${name} -->)`);
  if (!re.test(html)) throw new Error(`index.html is missing the prerender:${name} markers`);
  html = html.replace(re, (_, open, close) => open + markup + close);
};
inject("projects", projectsMarkup(t));
inject("faqs", faqsMarkup(t));
writeFileSync(root + "index.html", html);
console.log("prerender: projects + FAQ written to index.html");
