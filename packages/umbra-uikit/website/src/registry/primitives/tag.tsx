import React from 'react';
import { Tag, HStack, VStack, Text } from '@wisp-ui/react';
import { Hash } from 'lucide-react';
import type { ComponentEntry } from '../types';

export const tagEntry: ComponentEntry = {
  slug: 'tag',
  name: 'Tag',
  category: 'primitives',
  subcategory: 'Badges & Tags',
  description:
    'Selectable tag with optional remove button, icon support, and skeleton loading. Commonly used for filtering and categorization.',
  variantCount: 3,
  keywords: ['tag', 'label', 'filter', 'selectable', 'removable'],

  cardPreview: (
    <HStack gap="xs" align="center">
      <Tag size="sm">React</Tag>
      <Tag size="sm" selected>Active</Tag>
      <Tag size="sm" onRemove={() => {}}>Remove</Tag>
    </HStack>
  ),

  examples: [
    {
      title: 'Sizes',
      render: (
        <HStack gap="sm" align="center">
          {(['sm', 'md', 'lg'] as const).map((size) => (
            <Tag key={size} size={size}>{size}</Tag>
          ))}
        </HStack>
      ),
      code: `import { Tag } from '@wisp-ui/react';

<Tag size="sm">Small</Tag>
<Tag size="md">Medium</Tag>
<Tag size="lg">Large</Tag>`,
      rnCode: `import { Tag } from '@wisp-ui/react-native';

<Tag>Label</Tag>
<Tag selected>Active</Tag>
<Tag onRemove={() => {}}>Removable</Tag>`,
    },
    {
      title: 'States',
      render: (
        <HStack gap="sm" align="center">
          <Tag>Default</Tag>
          <Tag selected>Selected</Tag>
          <Tag disabled>Disabled</Tag>
          <Tag onRemove={() => {}}>Removable</Tag>
        </HStack>
      ),
      code: `<Tag>Default</Tag>
<Tag selected>Selected</Tag>
<Tag disabled>Disabled</Tag>
<Tag onRemove={() => {}}>Removable</Tag>`,
    },
    {
      title: 'With Icon',
      render: (
        <HStack gap="sm" align="center">
          <Tag icon={Hash as any}>Topic</Tag>
          <Tag icon={Hash as any} selected>Active Topic</Tag>
        </HStack>
      ),
      code: `<Tag icon={Hash}>Topic</Tag>
<Tag icon={Hash} selected>Active Topic</Tag>`,
    },
    {
      title: 'Skeleton',
      render: (
        <HStack gap="sm">
          <Tag skeleton>Loading</Tag>
          <Tag skeleton>Tag</Tag>
        </HStack>
      ),
      code: `<Tag skeleton>Loading</Tag>`,
    },
  ],

  props: [
    { name: 'children', type: 'React.ReactNode', required: true, description: 'Tag label content.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Tag size.' },
    { name: 'selected', type: 'boolean', default: 'false', description: 'Whether the tag is selected.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disabled state.' },
    { name: 'icon', type: 'React.ComponentType', description: 'Leading icon component.' },
    { name: 'onRemove', type: '() => void', description: 'Callback for remove button. Shows close icon when provided.' },
    { name: 'skeleton', type: 'boolean', default: 'false', description: 'Show skeleton loading state.' },
  ],
};
