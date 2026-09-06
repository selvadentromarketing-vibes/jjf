import es from './es.json';
import en from './en.json';
import type { Lang } from '../routes';

export type Key = keyof typeof es;
const dict: Record<Lang, Record<string, string>> = { es, en };

export function t(lang: Lang, key: Key, vars: Record<string, string> = {}): string {
  const raw = dict[lang][key] ?? dict.es[key] ?? key;
  return raw.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? '');
}
