import { Lang } from '../data/translations';
import { ItemStatus } from '../types';

export const ITEM_STATUSES: ItemStatus[] = ['new-original', 'used-original', 'new-replica', 'used-replica'];

const LABELS: Record<ItemStatus, Record<Lang, string>> = {
  'new-original':  { en: 'New Original',  ka: 'ახალი ორიგინალი',   ru: 'Новый оригинал' },
  'used-original': { en: 'Used Original', ka: 'მეორადი ორიგინალი', ru: 'Б/У оригинал' },
  'new-replica':   { en: 'New Replica',   ka: 'ახალი რეპლიკა',     ru: 'Новая реплика' },
  'used-replica':  { en: 'Used Replica',  ka: 'მეორადი რეპლიკა',   ru: 'Б/У реплика' },
};

export function itemStatusLabel(status: string | undefined, lang: string): string {
  if (!status) return '';
  const l: Lang = lang === 'ka' || lang === 'ru' ? lang : 'en';
  return LABELS[status as ItemStatus]?.[l] ?? status;
}
