import { allEntries } from '../registry';
import type { ComponentEntry } from '../registry';
import { detailPath } from './slug';

export interface SearchItem {
  label: string;
  category: string;
  path: string;
  keywords: string[];
}

/** Flatten all registry entries into a searchable list. */
export function buildSearchIndex(): SearchItem[] {
  return allEntries.map((entry) => ({
    label: entry.name,
    category: entry.category,
    path: detailPath(entry.category, entry.slug),
    keywords: [
      entry.name.toLowerCase(),
      entry.slug,
      ...(entry.keywords ?? []),
    ],
  }));
}
