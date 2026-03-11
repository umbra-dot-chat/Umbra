import React from 'react';
import { Text, useThemeColors } from '@wisp-ui/react';
import type { ComponentEntry } from '../registry/types';
import { PreviewCard } from './PreviewCard';

interface CategoryGridProps {
  entries: ComponentEntry[];
}

/**
 * Responsive grid of PreviewCards.
 * Uses CSS grid with auto-fill for responsive columns.
 */
export function CategoryGrid({ entries }: CategoryGridProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 16,
      }}
    >
      {entries.map((entry) => (
        <PreviewCard key={entry.slug} entry={entry} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SubcategoryGrid — grouped sections with headers
// ---------------------------------------------------------------------------

function toAnchorId(subcategory: string): string {
  return subcategory
    .toLowerCase()
    .replace(/[&]/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

interface SubcategoryGridProps {
  groups: { subcategory: string; entries: ComponentEntry[] }[];
}

/**
 * Renders entries grouped by subcategory, each with a section header.
 * Section headers have `id` anchors for hash-linking from the sidebar.
 */
export function SubcategoryGrid({ groups }: SubcategoryGridProps) {
  const colors = useThemeColors();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
      {groups.map((group) => (
        <div
          key={group.subcategory || '__ungrouped'}
          id={group.subcategory ? toAnchorId(group.subcategory) : undefined}
        >
          {group.subcategory && (
            <div style={{ marginBottom: 16 }}>
              <Text size="md" weight="semibold" color="secondary">
                {group.subcategory}
              </Text>
              <div
                style={{
                  marginTop: 8,
                  height: 1,
                  backgroundColor: colors.border.subtle,
                }}
              />
            </div>
          )}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 16,
            }}
          >
            {group.entries.map((entry) => (
              <PreviewCard key={entry.slug} entry={entry} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export { toAnchorId };
