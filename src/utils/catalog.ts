import T, { Lang } from '../data/translations';
import { CatalogSection, CatalogSubsection } from '../types';

type Named = { id: string; name: string; nameGe?: string };

export function getCatName(item: Named, lang: Lang, prefix: 'section' | 'sub'): string {
  const key = prefix === 'section'
    ? 'section_' + item.id
    : 'sub_' + item.id.replace(/-/g, '_');
  const translated = (T[lang] as Record<string, string>)[key];
  if (translated) return translated;
  if (lang === 'ka' && item.nameGe) return item.nameGe;
  return item.name;
}

export function slugify(text: string): string {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-');
}
