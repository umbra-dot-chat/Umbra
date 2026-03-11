import React from 'react';
import { ButtonGroup, VStack, HStack, Text } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

const viewItems = [
  { value: 'list', label: 'List' },
  { value: 'grid', label: 'Grid' },
  { value: 'kanban', label: 'Kanban' },
];

export const buttonGroupEntry: ComponentEntry = {
  slug: 'button-group',
  name: 'ButtonGroup',
  category: 'components',
  subcategory: 'Navigation',
  description:
    'Connected button group for single selection with outline/ghost variants, sizes, and fullWidth mode.',
  variantCount: 2,
  keywords: ['button', 'group', 'toggle', 'segmented', 'connected'],

  cardPreview: (
    <div style={{ pointerEvents: 'none' }}>
      <ButtonGroup items={viewItems} defaultValue="list" size="sm" />
    </div>
  ),

  examples: [
    {
      title: 'Basic',
      render: (
        <ButtonGroup items={viewItems} defaultValue="list" />
      ),
      code: `import { ButtonGroup } from '@wisp-ui/react';\n\n<ButtonGroup
  items={[
    { value: 'list', label: 'List' },
    { value: 'grid', label: 'Grid' },
    { value: 'kanban', label: 'Kanban' },
  ]}
  defaultValue="list"
/>`,
      rnCode: `import { ButtonGroup } from '@wisp-ui/react-native';

<ButtonGroup
  items={[
    { value: 'list', label: 'List' },
    { value: 'grid', label: 'Grid' },
    { value: 'kanban', label: 'Kanban' },
  ]}
  defaultValue="list"
/>`,
    },
    {
      title: 'Sizes & Variants',
      render: (
        <VStack gap="md" align="start">
          {(['sm', 'md', 'lg'] as const).map((size) => (
            <HStack key={size} gap="md" align="center">
              <Text size="xs" color="tertiary" style={{ width: 24 }}>{size}</Text>
              <ButtonGroup items={viewItems} defaultValue="grid" size={size} />
            </HStack>
          ))}
          <ButtonGroup items={viewItems} defaultValue="grid" variant="ghost" />
        </VStack>
      ),
      code: `<ButtonGroup size="sm" items={items} />
<ButtonGroup size="md" items={items} />
<ButtonGroup variant="ghost" items={items} />`,
      rnCode: `import { ButtonGroup } from '@wisp-ui/react-native';

<ButtonGroup size="sm" items={items} />
<ButtonGroup size="md" items={items} />
<ButtonGroup variant="ghost" items={items} />`,
    },
  ],

  props: [
    { name: 'items', type: 'ButtonGroupItem[]', required: true, description: 'Array of button items.' },
    { name: 'value', type: 'string', description: 'Controlled selected value.' },
    { name: 'defaultValue', type: 'string', description: 'Initial value (uncontrolled).' },
    { name: 'onChange', type: '(value: string) => void', description: 'Selection callback.' },
    { name: 'variant', type: "'outline' | 'ghost'", default: "'outline'", description: 'Visual variant.' },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg'", default: "'md'", description: 'Size preset.' },
    { name: 'fullWidth', type: 'boolean', default: 'false', description: 'Stretch to container.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disable all items.' },
  ],
};
