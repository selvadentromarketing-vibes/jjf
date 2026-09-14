// /llms-full.txt: every page's text, in reading order, so an assistant can answer from the site
// without rendering it. Markdown is emitted as written; nothing here is generated or summarised.
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { href } from '../routes';

export const GET: APIRoute = async ({ site }) => {
  const base = site ?? new URL('https://jjfcreando.com');
  const abs = (p: string) => new URL(p, base).href;
  const sites = await getCollection('site');
  const projects = (await getCollection('projects', (e) => !e.data.draft)).sort((a, b) => a.data.order - b.data.order);
  const how = await getCollection('how');
  const parts: string[] = ['# JJF Creando — full text', ''];
  for (const lang of ['es', 'en'] as const) {
    const s = sites.find((x) => x.data.lang === lang)!.data;
    parts.push(`# ${lang === 'es' ? 'Español' : 'English'}`, '', `## ${s.pages.home.title}`, abs(href('home', lang)), '', ...s.headline.map((l) => l.replace(/<[^>]+>/g, '')), s.lede.replace(/<[^>]+>/g, ''), '', ...s.claro.map((p) => p.replace(/<[^>]+>/g, '')), '', s.claroLine, '');
    parts.push(`## ${s.pages.vision.title}`, abs(href('vision', lang)), '', ...s.vision, '');
    for (const p of projects.filter((x) => x.data.lang === lang)) {
      parts.push(`## ${p.data.name}`, abs(href('project', lang, { slug: p.data.key })), '', `${p.data.place} · ${p.data.character}`, '');
      if (p.data.summary) parts.push(p.data.summary, '');
      parts.push((p.body ?? '').trim(), '');
      if (p.data.updated) parts.push(`${lang === 'es' ? 'Actualizado' : 'Updated'}: ${p.data.updated}`, '');
    }
    const h = how.find((x) => x.data.lang === lang);
    if (h) parts.push(`## ${h.data.title}`, abs(href('how', lang)), '', h.data.intro, '', (h.body ?? '').trim(), '');
  }
  return new Response(parts.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
