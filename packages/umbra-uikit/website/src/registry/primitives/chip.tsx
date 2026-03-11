import React from 'react';
import { Chip, HStack, VStack, Text } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

export const chipEntry: ComponentEntry = {
  slug: 'chip',
  name: 'Chip',
  category: 'primitives',
  subcategory: 'Badges & Tags',
  description:
    'Interactive chip with filled, outlined, and subtle variants. Supports removable, clickable, and disabled states with 5 semantic colors.',
  variantCount: 15,
  keywords: ['chip', 'filter', 'tag', 'removable', 'clickable'],

  cardPreview: (
    <HStack gap="xs" align="center">
      <Chip size="sm" variant="filled">React</Chip>
      <Chip size="sm" variant="outlined">TypeScript</Chip>
      <Chip size="sm" variant="subtle">Vite</Chip>
    </HStack>
  ),

  examples: [
    {
      title: 'Variants',
      render: (
        <HStack gap="sm" align="center">
          {(['filled', 'outlined', 'subtle'] as const).map((v) => (
            <Chip key={v} variant={v}>{v}</Chip>
          ))}
        </HStack>
      ),
      code: `import { Chip } from '@wisp-ui/react';

<Chip variant="filled">Filled</Chip>
<Chip variant="outlined">Outlined</Chip>
<Chip variant="subtle">Subtle</Chip>`,
      rnCode: `import { Chip } from '@wisp-ui/react-native';

<Chip color="success">Active</Chip>
<Chip color="danger" removable onRemove={() => {}}>Error</Chip>`,
    },
    {
      title: 'Colors',
      render: (
        <HStack gap="sm" align="center" style={{ flexWrap: 'wrap' }}>
          {(['default', 'success', 'warning', 'danger', 'info'] as const).map((c) => (
            <Chip key={c} color={c}>{c}</Chip>
          ))}
        </HStack>
      ),
      code: `<Chip color="default">Default</Chip>
<Chip color="success">Success</Chip>
<Chip color="danger">Danger</Chip>`,
    },
    {
      title: 'Sizes',
      render: (
        <HStack gap="sm" align="center">
          {(['sm', 'md', 'lg'] as const).map((size) => (
            <Chip key={size} size={size}>{size}</Chip>
          ))}
        </HStack>
      ),
      code: `<Chip size="sm">Small</Chip>
<Chip size="md">Medium</Chip>
<Chip size="lg">Large</Chip>`,
    },
    {
      title: 'Removable & Disabled',
      render: (
        <HStack gap="sm" align="center">
          <Chip removable onRemove={() => {}}>Removable</Chip>
          <Chip clickable>Clickable</Chip>
          <Chip disabled>Disabled</Chip>
        </HStack>
      ),
      code: `<Chip removable onRemove={() => {}}>Removable</Chip>
<Chip clickable>Clickable</Chip>
<Chip disabled>Disabled</Chip>`,
    },
  ],

  props: [
    { name: 'children', type: 'React.ReactNode', required: true, description: 'Chip label content.' },
    { name: 'variant', type: "'filled' | 'outlined' | 'subtle'", default: "'filled'", description: 'Visual style variant.' },
    { name: 'color', type: "'default' | 'success' | 'warning' | 'danger' | 'info'", default: "'default'", description: 'Semantic color.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Chip size.' },
    { name: 'removable', type: 'boolean', default: 'false', description: 'Show remove button.' },
    { name: 'onRemove', type: '(e: MouseEvent) => void', description: 'Callback when remove button is clicked.' },
    { name: 'clickable', type: 'boolean', default: 'false', description: 'Makes the chip interactive on click.' },
    { name: 'icon', type: 'React.ReactNode', description: 'Leading icon element.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disabled state.' },
  ],
};
