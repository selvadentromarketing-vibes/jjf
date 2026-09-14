// /llms.txt (llmstxt.org): the site in one page for an assistant, generated from the content so
// it can never drift from what the pages say. Spanish is the source language and comes first.
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { href } from '../routes';

export const GET: APIRoute = async ({ site }) => {
  const base = site ?? new URL('https://jjfcreando.com');
  const abs = (p: string) => new URL(p, base).href;
  const es = (await getCollection('site')).find((s) => s.data.lang === 'es')!.data;
  const en = (await getCollection('site')).find((s) => s.data.lang === 'en')!.data;
  const projects = (await getCollection('projects', (e) => !e.data.draft)).sort((a, b) => a.data.order - b.data.order);
  const line = (p: (typeof projects)[number]) => `- [${p.data.name}](${abs(href('project', p.data.lang, { slug: p.data.key }))}): ${p.data.summary ?? `${p.data.place} · ${p.data.character}`}`;

  const out = [
    '# JJF Creando',
    '',
    `> ${es.pages.home.description}`,
    `> ${en.pages.home.description}`,
    '',
    'Desarrolladora boutique con seis lugares en Tulum y la península de Yucatán. Sitio bilingüe: las rutas bajo /es/ están en español y las rutas bajo /en/ en inglés; cada página enlaza a su equivalente. Ninguna cifra se publica sin verificar contra un documento de JJF Creando.',
    '',
    '## Los seis lugares / The six places',
    '',
    ...projects.filter((p) => p.data.lang === 'es').map(line),
    '',
    ...projects.filter((p) => p.data.lang === 'en').map(line),
    '',
    '## Cómo se compra / How it works',
    '',
    `- [Cómo se compra](${abs(href('how', 'es'))}): ${es.pages.how.description}`,
    `- [How it works](${abs(href('how', 'en'))}): ${en.pages.how.description}`,
    '',
    '## Quiénes somos / Who we are',
    '',
    `- [Nuestra visión](${abs(href('vision', 'es'))}): ${es.pages.vision.description}`,
    `- [Our vision](${abs(href('vision', 'en'))}): ${en.pages.vision.description}`,
    `- [Trayectoria](${abs(href('track', 'es'))}): ${es.pages.track.description}`,
    `- [Track record](${abs(href('track', 'en'))}): ${en.pages.track.description}`,
    '',
    '## Contacto / Contact',
    '',
    `- [Contacto](${abs(href('contact', 'es'))})`,
    `- [Contact](${abs(href('contact', 'en'))})`,
    '',
    '## Optional',
    '',
    `- [llms-full.txt](${abs('/llms-full.txt')}): the full text of every page, for reading rather than for navigation`,
    '',
  ].join('\n');
  return new Response(out, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
