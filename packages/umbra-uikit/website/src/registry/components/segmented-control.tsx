import React from 'react';
import { SegmentedControl, VStack, HStack, Text } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

const viewOptions = [
  { value: 'list', label: 'List' },
  { value: 'grid', label: 'Grid' },
  { value: 'board', label: 'Board' },
];

export const segmentedControlEntry: ComponentEntry = {
  slug: 'segmented-control',
  name: 'SegmentedControl',
  category: 'components',
  subcategory: 'Selection & Input',
  description:
    'Horizontal segmented button group for single selection with animated indicator, sizes, and fullWidth mode.',
  variantCount: 3,
  keywords: ['segmented', 'control', 'toggle', 'switch', 'group', 'button'],

  cardPreview: (
    <div style={{ pointerEvents: 'none' }}>
      <SegmentedControl options={viewOptions} defaultValue="list" size="sm" />
    </div>
  ),

  examples: [
    {
      title: 'Basic',
      render: (
        <SegmentedControl options={viewOptions} defaultValue="list" />
      ),
      code: `import { SegmentedControl } from '@wisp-ui/react';\n\n<SegmentedControl
  options={[
    { value: 'list', label: 'List' },
    { value: 'grid', label: 'Grid' },
    { value: 'board', label: 'Board' },
  ]}
  defaultValue="list"
/>`,
      rnCode: `import { SegmentedControl } from '@wisp-ui/react-native';

<SegmentedControl
  options={[
    { value: 'list', label: 'List' },
    { value: 'grid', label: 'Grid' },
    { value: 'board', label: 'Board' },
  ]}
  defaultValue="list"
/>`,
    },
    {
      title: 'Sizes',
      render: (
        <VStack gap="md" align="start">
          {(['sm', 'md', 'lg'] as const).map((size) => (
            <HStack key={size} gap="md" align="center">
              <Text size="xs" color="tertiary" style={{ width: 24 }}>{size}</Text>
              <SegmentedControl options={viewOptions} defaultValue="list" size={size} />
            </HStack>
          ))}
        </VStack>
      ),
      code: `<SegmentedControl size="sm" options={options} />
<SegmentedControl size="md" options={options} />
<SegmentedControl size="lg" options={options} />`,
      rnCode: `import { SegmentedControl } from '@wisp-ui/react-native';

<SegmentedControl size="sm" options={options} />
<SegmentedControl size="md" options={options} />
<SegmentedControl size="lg" options={options} />`,
    },
    {
      title: 'Full Width',
      render: (
        <div style={{ width: '100%', maxWidth: 400 }}>
          <SegmentedControl options={viewOptions} defaultValue="grid" fullWidth />
        </div>
      ),
      code: `<SegmentedControl options={options} fullWidth />`,
      rnCode: `import { SegmentedControl } from '@wisp-ui/react-native';

<SegmentedControl options={options} fullWidth />`,
    },
  ],

  props: [
    { name: 'options', type: 'SegmentedControlOption[]', required: true, description: 'Segment definitions.' },
    { name: 'value', type: 'string', description: 'Controlled selected value.' },
    { name: 'defaultValue', type: 'string', description: 'Initial value (uncontrolled).' },
    { name: 'onChange', type: '(value: string) => void', description: 'Selection callback.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Size preset.' },
    { name: 'fullWidth', type: 'boolean', default: 'false', description: 'Stretch to container.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disable all segments.' },
  ],
};
