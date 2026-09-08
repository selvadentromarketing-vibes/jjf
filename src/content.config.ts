import { defineCollection } from 'astro:content';
import { z } from 'astro:schema';
import { glob } from 'astro/loaders';

// "El verdadero lujo no se mide en metros cuadrados" as a build rule (plan §8/§9):
// index rows carry no quantity; every figure is an object verified against a JJF-owned source.
const QUANTITY = /[0-9$€£%]|\b(hect[aá]reas?|hectares?|mill[oó]n(?:es)?|millions?|billions?|usd|mxn|d[oó]lares|dollars|acres?|m2|m²|metros?\s+cuadrados|square\s+met(?:re|er)s?)\b/i;
const quantityFree = (label: string) =>
  z.string().min(1).refine((s) => !QUANTITY.test(s), { message: `${label}: no quantities — el verdadero lujo no se mide en metros cuadrados` });

const date = z.union([z.date(), z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'asOf must be YYYY-MM-DD')]).transform((d) => (d instanceof Date ? d.toISOString().slice(0, 10) : d));
const figure = z.object({
  value: z.number(),
  unit: z.string().optional(),
  verified: z.literal(true),
  source: z.string().min(3),
  asOf: date,
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      key: z.string().regex(/^[a-z0-9-]+$/),
      lang: z.enum(['es', 'en']),
      order: z.number().int().min(1).max(6),
      name: z.string().min(1),
      place: quantityFree('place'),
      character: quantityFree('character'),
      locality: z.string().min(1),
      region: z.string().min(1),
      status: z.enum(['en-venta', 'en-desarrollo', 'terminado', 'entregado']).optional(),
      statusLabel: z.string().optional(),
      statusVerified: z.boolean().default(false),
      lightMode: z.enum(['A', 'B', 'C', 'D', 'E', 'F', 'G']),
      hero: image().optional(),
      heroStaging: z.boolean().default(false),
      heroAlt: z.string().default(''),
      gallery: z.array(z.object({ src: image(), caption: z.string(), staging: z.boolean().default(false) })).default([]),
      masterplan: image().optional(),
      sells: z.enum(['lotes', 'villas', 'ambos']).optional(),
      sellsVerified: z.boolean().default(false),
      availability: z.string().optional(),
      closingSentence: z.array(z.string().min(1)).min(1),
      coordinates: z.object({ lat: z.number(), lng: z.number() }).optional(),
      draft: z.boolean().default(false),
      copyStatus: z.enum(['propuesta', 'aprobada']).default('propuesta'),
      plan: z
        .object({
          svg: z.string().regex(/\.svg$/),
          source: z.enum(['architect', 'ai-derived', 'traced']),
          // A traced drawing names the plate it came from: the claim is checkable against the
          // photograph on the same page, which is what keeps it from inventing anything.
          from: z.string().optional(),
          approvedBy: z.string().optional(),
          asOf: date,
        })
        .refine((p) => p.source !== 'ai-derived' || !!p.approvedBy, { message: 'ai-derived plans require approvedBy' })
        .refine((p) => p.source !== 'traced' || !!p.from, { message: 'traced plans must name the plate they were traced from' })
        .optional(),
      years: z.object({ start: z.number().int(), end: z.number().int().optional(), verified: z.literal(true), source: z.string().min(3), asOf: date }).optional(),
      hectares: figure.optional(),
      valuationUSD: figure.optional(),
      priceFrom: figure.optional(),
      soldPct: figure.optional(),
      cenotes: figure.optional(),
    }),
});

const pageMeta = z.object({ title: z.string(), description: z.string() });

const site = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/site' }),
  schema: z.object({
    lang: z.enum(['es', 'en']),
    headline: z.array(z.string()).length(3),
    lede: z.string(),
    claro: z.array(z.string()).min(1),
    claroCaption: z.string(),
    claroLine: z.string(),
    indexTitle: z.array(z.string()).min(1).max(2),
    aguaTitle: z.string(),
    invitation: z.string(),
    vision: z.array(z.string()).min(1),
    visionStatus: z.enum(['verbatim', 'authored-draft', 'authored']),
    closingSentences: z.array(z.string()).min(1),
    signature: z.string(),
    responsePromise: z.string(),
    namedPerson: z.string().default(''),
    whatsapp: z.object({ number: z.string(), verified: z.boolean() }),
    // The identity the privacy notice is legally required to state. Empty until confirmed; the
    // page refuses to publish bracketed placeholder text in its place.
    entity: z.object({ legalName: z.string(), domicilio: z.string(), arco: z.string() }).default({ legalName: '', domicilio: '', arco: '' }),
    notFoundLine: z.string(),
    thanks: z.array(z.string()).min(1),
    pages: z.object({ home: pageMeta, projects: pageMeta, vision: pageMeta, track: pageMeta, how: pageMeta, contact: pageMeta, privacy: pageMeta, thanks: pageMeta }),
  }),
});

const how = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/how' }),
  schema: z.object({ lang: z.enum(['es', 'en']), title: z.string(), intro: z.string(), reviewed: z.boolean().default(false), asOf: date }),
});

const legal = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/legal' }),
  schema: z.object({ lang: z.enum(['es', 'en']), title: z.string(), reviewed: z.boolean().default(false), asOf: date }),
});

export const collections = { projects, site, how, legal };
