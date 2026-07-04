import { Product } from '../types';

// Tesla part numbers don't officially encode a category, but part families
// share number prefixes (1044059/1044060/1044061 are all brake pads).
// We suggest a category by finding the longest shared prefix with parts
// already in the catalogue — so it gets smarter as the catalogue grows.

export interface CategorySuggestion {
  sectionId: string;
  subsectionId: string;
  matchedPartNumber: string;
  matchedName: string;
  prefixLength: number;
  confidence: 'high' | 'medium';
}

const norm = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, '');

export function suggestCategory(partNumber: string, products: Product[]): CategorySuggestion | null {
  const pn = norm(partNumber);
  if (pn.length < 4) return null;

  // longest common prefix with any existing part
  let bestLen = 0;
  for (const p of products) {
    const other = norm(p.partNumber);
    const max = Math.min(pn.length, other.length);
    let l = 0;
    while (l < max && pn[l] === other[l]) l++;
    if (l > bestLen) bestLen = l;
  }
  if (bestLen < 4) return null;

  // among the whole family sharing that prefix, take the most common category
  const prefix = pn.slice(0, bestLen);
  const family = products.filter(p => norm(p.partNumber).startsWith(prefix));
  const counts = new Map<string, number>();
  for (const p of family) {
    const k = `${p.sectionId}|${p.subsectionId}`;
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (!top) return null;
  const [sectionId, subsectionId] = top[0].split('|');
  const example = family.find(p => p.sectionId === sectionId && p.subsectionId === subsectionId);
  if (!example) return null;

  return {
    sectionId,
    subsectionId,
    matchedPartNumber: example.partNumber,
    matchedName: example.name,
    prefixLength: bestLen,
    confidence: bestLen >= 6 ? 'high' : 'medium',
  };
}
