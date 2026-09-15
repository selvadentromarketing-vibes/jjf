// A guide's URL segment in its own language: the Spanish key unless the record names a slug.
import type { CollectionEntry } from 'astro:content';
export const guideSlug = (g: CollectionEntry<'guides'>) => g.data.slug ?? g.data.key;
