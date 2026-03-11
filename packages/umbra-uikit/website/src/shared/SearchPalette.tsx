import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Command,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
  CommandEmpty,
} from '@wisp-ui/react';
import { Search, Palette, Layers, LayoutGrid, Component } from 'lucide-react';
import { allEntries } from '../registry';
import type { ComponentCategory } from '../registry';
import { detailPath } from '../utils/slug';

interface SearchPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CATEGORY_META: Record<ComponentCategory, { label: string; icon: any }> = {
  tokens: { label: 'Tokens', icon: Palette },
  primitives: { label: 'Primitives', icon: Layers },
  layouts: { label: 'Layouts', icon: LayoutGrid },
  components: { label: 'Components', icon: Component },
};

const CATEGORY_ORDER: ComponentCategory[] = ['tokens', 'primitives', 'layouts', 'components'];

export function SearchPalette({ open, onOpenChange }: SearchPaletteProps) {
  const navigate = useNavigate();

  // Group entries by category
  const grouped = useMemo(() => {
    const map = new Map<ComponentCategory, typeof allEntries>();
    for (const entry of allEntries) {
      const list = map.get(entry.category) ?? [];
      list.push(entry);
      map.set(entry.category, list);
    }
    return map;
  }, []);

  const handleSelect = (value: string) => {
    // value is "category/slug"
    const entry = allEntries.find((e) => `${e.category}/${e.slug}` === value);
    if (entry) {
      navigate(detailPath(entry.category, entry.slug));
      onOpenChange(false);
    }
  };

  return (
    <Command
      open={open}
      onOpenChange={onOpenChange}
      onSelect={handleSelect}
      size="md"
    >
      <CommandInput placeholder="Search components…" icon={Search as any} />
      <CommandList>
        <CommandEmpty>No components found.</CommandEmpty>
        {CATEGORY_ORDER.map((category) => {
          const entries = grouped.get(category);
          if (!entries || entries.length === 0) return null;
          const meta = CATEGORY_META[category];

          return (
            <CommandGroup key={category} heading={meta.label}>
              {entries.map((entry) => (
                <CommandItem
                  key={entry.slug}
                  value={`${entry.category}/${entry.slug}`}
                  keywords={[
                    ...(entry.keywords ?? []),
                    ...(entry.subcategory ? [entry.subcategory.toLowerCase()] : []),
                  ]}
                  icon={meta.icon as any}
                >
                  <span>{entry.name}</span>
                  {entry.subcategory && (
                    <span style={{ marginLeft: 8, fontSize: 11, opacity: 0.5 }}>
                      {entry.subcategory}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          );
        })}
      </CommandList>
    </Command>
  );
}
