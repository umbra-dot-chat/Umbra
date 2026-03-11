import React, { useState } from 'react';
import {
  Command,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandEmpty,
  Button,
  Text,
  HStack,
  useThemeColors,
} from '@wisp-ui/react';
import { Search, Settings, User, FileText, Home, Plus } from 'lucide-react';
import type { ComponentEntry } from '../types';

/** Wrapper so we can manage open state in a preview. */
function CommandDemo() {
  const [open, setOpen] = useState(true);

  return (
    <div style={{ width: '100%', maxWidth: 480 }}>
      <Command open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search…" icon={Search} />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Pages">
            <CommandItem value="home" icon={Home}>Home</CommandItem>
            <CommandItem value="settings" icon={Settings} shortcut="⌘,">Settings</CommandItem>
            <CommandItem value="profile" icon={User}>Profile</CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Actions">
            <CommandItem value="new-file" icon={Plus}>New File</CommandItem>
            <CommandItem value="docs" icon={FileText}>Documentation</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  );
}

function CommandSizesDemo() {
  const [open, setOpen] = useState(true);

  return (
    <div style={{ width: '100%', maxWidth: 400 }}>
      <Command open={open} onOpenChange={setOpen} size="sm">
        <CommandInput placeholder="Small command palette…" />
        <CommandList>
          <CommandItem value="option-1">Option One</CommandItem>
          <CommandItem value="option-2">Option Two</CommandItem>
          <CommandItem value="option-3">Option Three</CommandItem>
        </CommandList>
      </Command>
    </div>
  );
}

function CommandCardPreview() {
  const colors = useThemeColors();
  return (
    <div
      style={{
        width: '100%',
        maxWidth: 240,
        borderRadius: 8,
        border: `1px solid ${colors.border.subtle}`,
        backgroundColor: colors.background.canvas,
        overflow: 'hidden',
        fontSize: 12,
      }}
    >
      {/* Fake search input */}
      <div
        style={{
          padding: '6px 10px',
          borderBottom: `1px solid ${colors.border.subtle}`,
          color: colors.text.muted,
          fontFamily: 'var(--font-sans, system-ui, sans-serif)',
        }}
      >
        ⌘K Search…
      </div>
      {/* Fake items */}
      <div style={{ padding: '4px 0' }}>
        {['Home', 'Settings', 'Profile'].map((item) => (
          <div
            key={item}
            style={{
              padding: '4px 10px',
              color: colors.text.secondary,
              fontFamily: 'var(--font-sans, system-ui, sans-serif)',
            }}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

export const commandEntry: ComponentEntry = {
  slug: 'command',
  name: 'Command',
  category: 'components',
  subcategory: 'Selection & Input',
  description:
    'A command palette / quick-search component with fuzzy filtering, keyboard navigation, groups, separators, icons, shortcuts, and loading state.',
  variantCount: 3,
  keywords: ['command', 'palette', 'search', 'quick', 'spotlight', 'cmd-k'],

  cardPreview: <CommandCardPreview />,

  examples: [
    {
      title: 'Default',
      render: <CommandDemo />,
      code: `import { Command, CommandInput, CommandList, CommandGroup, CommandItem } from '@wisp-ui/react';

<Command open={open} onOpenChange={setOpen}>
  <CommandInput placeholder="Type a command or search…" icon={Search} />
  <CommandList>
    <CommandEmpty>No results found.</CommandEmpty>
    <CommandGroup heading="Pages">
      <CommandItem value="home" icon={Home}>Home</CommandItem>
      <CommandItem value="settings" icon={Settings} shortcut="⌘,">Settings</CommandItem>
      <CommandItem value="profile" icon={User}>Profile</CommandItem>
    </CommandGroup>
    <CommandSeparator />
    <CommandGroup heading="Actions">
      <CommandItem value="new-file" icon={Plus}>New File</CommandItem>
      <CommandItem value="docs" icon={FileText}>Documentation</CommandItem>
    </CommandGroup>
  </CommandList>
</Command>`,
      rnCode: `import { Command, CommandInput, CommandList, CommandGroup, CommandItem } from '@wisp-ui/react-native';

<Command open={open} onOpenChange={setOpen}>
  <CommandInput placeholder="Type a command or search…" icon={Search} />
  <CommandList>
    <CommandEmpty>No results found.</CommandEmpty>
    <CommandGroup heading="Pages">
      <CommandItem value="home" icon={Home}>Home</CommandItem>
      <CommandItem value="settings" icon={Settings}>Settings</CommandItem>
      <CommandItem value="profile" icon={User}>Profile</CommandItem>
    </CommandGroup>
    <CommandSeparator />
    <CommandGroup heading="Actions">
      <CommandItem value="new-file" icon={Plus}>New File</CommandItem>
      <CommandItem value="docs" icon={FileText}>Documentation</CommandItem>
    </CommandGroup>
  </CommandList>
</Command>`,
    },
    {
      title: 'Small Size',
      render: <CommandSizesDemo />,
      code: `<Command open={open} onOpenChange={setOpen} size="sm">
  <CommandInput placeholder="Small command palette…" />
  <CommandList>
    <CommandItem value="option-1">Option One</CommandItem>
    <CommandItem value="option-2">Option Two</CommandItem>
    <CommandItem value="option-3">Option Three</CommandItem>
  </CommandList>
</Command>`,
      rnCode: `import { Command, CommandInput, CommandList, CommandItem } from '@wisp-ui/react-native';

<Command open={open} onOpenChange={setOpen} size="sm">
  <CommandInput placeholder="Small command palette…" />
  <CommandList>
    <CommandItem value="option-1">Option One</CommandItem>
    <CommandItem value="option-2">Option Two</CommandItem>
    <CommandItem value="option-3">Option Three</CommandItem>
  </CommandList>
</Command>`,
    },
  ],

  props: [
    { name: 'open', type: 'boolean', required: true, description: 'Whether the command palette is visible.' },
    { name: 'onOpenChange', type: '(open: boolean) => void', required: true, description: 'Callback when open state changes.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Size preset controlling max-width.' },
    { name: 'onSelect', type: '(value: string) => void', description: 'Called when any item is selected.' },
    { name: 'filter', type: '(value, search, keywords?) => boolean', description: 'Custom filter function. Default performs substring matching.' },
    { name: 'loop', type: 'boolean', default: 'true', description: 'Keyboard navigation wraps around the list.' },
    { name: 'loading', type: 'boolean', default: 'false', description: 'Shows a loading spinner in the list.' },
    { name: 'closeOnSelect', type: 'boolean', default: 'true', description: 'Automatically closes on item selection.' },
    { name: 'closeOnEscape', type: 'boolean', default: 'true', description: 'Closes the palette when Escape is pressed.' },
    { name: 'children', type: 'React.ReactNode', required: true, description: 'CommandInput, CommandList, and other compound children.' },
  ],
};
