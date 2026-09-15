// The record of a place, parsed into chapters so the page can lay them out rather than pour them.
//
// Project bodies are authored in a deliberately small dialect — "## " chapter heads, "### "
// questions inside the closing chapter, paragraphs — and the page needs to put a photograph after
// one chapter and the master plan inside another. Astro renders a body as one block, so this
// parses the same dialect into chapters the view can interleave. Guides keep Astro's renderer.
export interface QA { q: string; a: string }
export interface Chapter { title: string; slug: string; paragraphs: string[]; qa: QA[]; faq: boolean }

// Same shape as Astro's heading ids (github-slugger): lowercase, punctuation dropped, spaces to
// hyphens, letters kept with their accents — so a rail link and a rendered id always agree.
export const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/\s+/g, '-');

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// The only inline marks the content uses: emphasis and a link.
export const inline = (s: string) =>
  esc(s)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>');

export function parseRecord(body: string, faqHead: string): Chapter[] {
  const chunks = body.split(/^## /m).slice(1);
  return chunks.map((chunk) => {
    const [head, ...rest] = chunk.split('\n');
    const title = head.trim();
    const faq = title === faqHead.replace(/^## /, '');
    const text = rest.join('\n');
    if (faq) {
      const qa = text.split(/^### /m).slice(1).map((s) => {
        const [q, ...a] = s.trim().split('\n');
        return { q: q.trim(), a: a.join('\n').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean).join(' ') };
      });
      return { title, slug: slugify(title), paragraphs: [], qa, faq };
    }
    const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim().replace(/\n/g, ' ')).filter(Boolean);
    return { title, slug: slugify(title), paragraphs, qa: [], faq };
  });
}
