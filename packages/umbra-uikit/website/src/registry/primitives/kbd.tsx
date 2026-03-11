import React from 'react';
import { Kbd, HStack, VStack, Text } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

export const kbdEntry: ComponentEntry = {
  slug: 'kbd',
  name: 'Kbd',
  category: 'primitives',
  subcategory: 'Text & Typography',
  description:
    'Keyboard key indicator for displaying shortcuts and key combinations. Three sizes with monospace styling.',
  variantCount: 3,
  keywords: ['kbd', 'keyboard', 'shortcut', 'key', 'hotkey', 'keybinding'],

  cardPreview: (
    <HStack gap="xs" align="center">
      <Kbd size="sm">⌘</Kbd>
      <Kbd size="sm">K</Kbd>
    </HStack>
  ),

  examples: [
    {
      title: 'Sizes',
      render: (
        <HStack gap="lg" align="center">
          {(['sm', 'md', 'lg'] as const).map((size) => (
            <VStack key={size} gap="xs" align="center">
              <Kbd size={size}>⌘</Kbd>
              <Text size="xs" color="tertiary">{size}</Text>
            </VStack>
          ))}
        </HStack>
      ),
      code: `import { Kbd } from '@wisp-ui/react';

<Kbd size="sm">⌘</Kbd>
<Kbd size="md">⌘</Kbd>
<Kbd size="lg">⌘</Kbd>`,
      rnCode: `import { Kbd } from '@wisp-ui/react-native';

<Kbd>Ctrl</Kbd>
<Kbd>Shift</Kbd>
<Kbd>Enter</Kbd>`,
    },
    {
      title: 'Key Combinations',
      render: (
        <VStack gap="md">
          <HStack gap="xs" align="center">
            <Kbd>⌘</Kbd><Kbd>C</Kbd>
            <Text color="secondary" style={{ marginLeft: 8 }}>Copy</Text>
          </HStack>
          <HStack gap="xs" align="center">
            <Kbd>⌘</Kbd><Kbd>V</Kbd>
            <Text color="secondary" style={{ marginLeft: 8 }}>Paste</Text>
          </HStack>
          <HStack gap="xs" align="center">
            <Kbd>⌘</Kbd><Kbd>⇧</Kbd><Kbd>P</Kbd>
            <Text color="secondary" style={{ marginLeft: 8 }}>Command Palette</Text>
          </HStack>
          <HStack gap="xs" align="center">
            <Kbd>Ctrl</Kbd><Kbd>Alt</Kbd><Kbd>Del</Kbd>
            <Text color="secondary" style={{ marginLeft: 8 }}>Task Manager</Text>
          </HStack>
        </VStack>
      ),
      code: `<HStack gap="xs">
  <Kbd>⌘</Kbd><Kbd>C</Kbd>
</HStack>
<HStack gap="xs">
  <Kbd>⌘</Kbd><Kbd>⇧</Kbd><Kbd>P</Kbd>
</HStack>`,
    },
  ],

  props: [
    { name: 'children', type: 'React.ReactNode', required: true, description: 'Key label text (e.g., "⌘", "Shift", "A").' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Key indicator size.' },
  ],
};
