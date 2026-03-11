import type { ComponentEntry, ComponentCategory } from './types';
import { tokenEntries } from './tokens';
import { primitiveEntries } from './primitives';
import { layoutEntries } from './layouts';
import { componentEntries } from './components';

/** All registry entries across every category. */
export const allEntries: ComponentEntry[] = [
  ...tokenEntries,
  ...primitiveEntries,
  ...layoutEntries,
  ...componentEntries,
];

/** Lookup a single entry by category + slug. */
export function findEntry(
  category: ComponentCategory,
  slug: string,
): ComponentEntry | undefined {
  return allEntries.find((e) => e.category === category && e.slug === slug);
}

/** Get all entries for a given category. */
export function entriesByCategory(category: ComponentCategory): ComponentEntry[] {
  return allEntries.filter((e) => e.category === category);
}

// ---------------------------------------------------------------------------
// Subcategory ordering & grouping
// ---------------------------------------------------------------------------

/** Ordered subcategory labels per top-level category. */
export const SUBCATEGORY_ORDER: Partial<Record<ComponentCategory, string[]>> = {
  primitives: [
    'Text & Typography',
    'Buttons & Actions',
    'Inputs',
    'Selection',
    'Status & Feedback',
    'Badges & Tags',
    'Media & Display',
  ],
  components: [
    'Chat & Messaging',
    'Selection & Input',
    'Overlays & Modals',
    'Navigation',
    'Data Display',
    'Date & Time',
    'Media',
    'Gamification',
    'Data Viz',
    'Feedback & Guidance',
    'Audio & Video',
    'Roles & Permissions',
    'Social',
    'Community',
    'Notifications',
    'Utilities',
  ],
  layouts: [
    'Spacing & Alignment',
    'Scrolling & Positioning',
    'Content Containers',
    'Navigation & Wayfinding',
    'Forms & States',
  ],
};

/** Group entries by subcategory for a given category, respecting display order. */
export function entriesBySubcategory(
  category: ComponentCategory,
): { subcategory: string; entries: ComponentEntry[] }[] {
  const all = entriesByCategory(category);
  const order = SUBCATEGORY_ORDER[category];

  if (!order) return [{ subcategory: '', entries: all }];

  const grouped = new Map<string, ComponentEntry[]>();
  for (const entry of all) {
    const key = entry.subcategory ?? 'Other';
    const list = grouped.get(key) ?? [];
    list.push(entry);
    grouped.set(key, list);
  }

  const result: { subcategory: string; entries: ComponentEntry[] }[] = [];
  for (const sub of order) {
    const items = grouped.get(sub);
    if (items && items.length > 0) {
      result.push({ subcategory: sub, entries: items });
      grouped.delete(sub);
    }
  }
  for (const [sub, items] of grouped) {
    result.push({ subcategory: sub, entries: items });
  }

  return result;
}

export type { ComponentEntry, ComponentCategory, PropDef, ExampleDef } from './types';
