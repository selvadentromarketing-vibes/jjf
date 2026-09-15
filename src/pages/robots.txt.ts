// robots.txt, generated so the sitemap line follows the site URL of the build rather than
// advertising production's sitemap from a preview.
import type { APIRoute } from 'astro';

const BODY = `# jjfcreando.com — everything is open to be read and cited.
User-agent: *
Allow: /

# The assistants people ask about buying land in Tulum, by name, so a default policy change
# upstream can never silently turn one of them away.
User-agent: GPTBot
Allow: /
User-agent: ChatGPT-User
Allow: /
User-agent: OAI-SearchBot
Allow: /
User-agent: PerplexityBot
Allow: /
User-agent: ClaudeBot
Allow: /
User-agent: anthropic-ai
Allow: /
User-agent: Google-Extended
Allow: /
User-agent: Bingbot
Allow: /
User-agent: Applebot-Extended
Allow: /

# Bulk archival for training corpora is a different question from being cited in an answer.
# Left open for now, deliberately, as a decision rather than a default.
User-agent: CCBot
Allow: /
`;

export const GET: APIRoute = ({ site }) => {
  const base = site ?? new URL('https://jjfcreando.com');
  return new Response(`${BODY}\nSitemap: ${new URL('/sitemap-index.xml', base).href}\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
