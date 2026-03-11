import React from 'react';
import { CircularProgress, HStack, VStack, Text } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

export const circularProgressEntry: ComponentEntry = {
  slug: 'circular-progress',
  name: 'CircularProgress',
  category: 'primitives',
  subcategory: 'Status & Feedback',
  description:
    'Circular progress ring with full/half arc variants, 4 sizes, semantic colors, indeterminate mode, and center content.',
  variantCount: 4,
  keywords: ['circular', 'progress', 'ring', 'donut', 'loading', 'percentage'],

  cardPreview: (
    <HStack gap="md" align="center">
      <CircularProgress value={75} size="sm" showValue />
      <CircularProgress value={45} size="md" color="success" />
    </HStack>
  ),

  examples: [
    {
      title: 'Sizes',
      render: (
        <HStack gap="lg" align="end">
          {(['sm', 'md', 'lg', 'xl'] as const).map((size) => (
            <VStack key={size} gap="xs" align="center">
              <CircularProgress value={65} size={size} showValue />
              <Text size="xs" color="tertiary">{size}</Text>
            </VStack>
          ))}
        </HStack>
      ),
      code: `import { CircularProgress } from '@wisp-ui/react';

<CircularProgress value={65} size="sm" showValue />
<CircularProgress value={65} size="md" showValue />
<CircularProgress value={65} size="lg" showValue />
<CircularProgress value={65} size="xl" showValue />`,
      rnCode: `import { CircularProgress } from '@wisp-ui/react-native';

<CircularProgress value={75} showValue />
<CircularProgress value={50} color="success" />
<CircularProgress indeterminate />`,
    },
    {
      title: 'Colors',
      render: (
        <HStack gap="md" align="center">
          {(['default', 'success', 'warning', 'danger', 'info'] as const).map((c) => (
            <CircularProgress key={c} value={70} size="md" color={c} showValue />
          ))}
        </HStack>
      ),
      code: `<CircularProgress value={70} color="success" showValue />
<CircularProgress value={70} color="danger" showValue />`,
    },
    {
      title: 'Half Variant',
      render: (
        <HStack gap="lg" align="center">
          <CircularProgress value={75} size="lg" variant="half" showValue />
          <CircularProgress value={50} size="lg" variant="half" color="warning" showValue />
        </HStack>
      ),
      code: `<CircularProgress value={75} variant="half" showValue />`,
    },
    {
      title: 'Thickness',
      render: (
        <HStack gap="lg" align="end">
          {(['thin', 'regular', 'medium', 'thick', 'heavy'] as const).map((t) => (
            <VStack key={t} gap="xs" align="center">
              <CircularProgress value={65} size="lg" thickness={t} showValue />
              <Text size="xs" color="tertiary">{t}</Text>
            </VStack>
          ))}
        </HStack>
      ),
      code: `import { CircularProgress } from '@wisp-ui/react';

<CircularProgress value={65} thickness="thin" showValue />
<CircularProgress value={65} thickness="regular" showValue />
<CircularProgress value={65} thickness="medium" showValue />
<CircularProgress value={65} thickness="thick" showValue />
<CircularProgress value={65} thickness="heavy" showValue />`,
    },
    {
      title: 'Indeterminate',
      render: (
        <HStack gap="md" align="center">
          <CircularProgress indeterminate size="md" />
          <CircularProgress indeterminate size="lg" label="Loading" />
        </HStack>
      ),
      code: `<CircularProgress indeterminate />
<CircularProgress indeterminate label="Loading" />`,
    },
  ],

  props: [
    { name: 'value', type: 'number', default: '0', description: 'Current progress value.' },
    { name: 'max', type: 'number', default: '100', description: 'Maximum value.' },
    { name: 'size', type: "'sm' | 'md' | 'lg' | 'xl'", default: "'md'", description: 'Ring diameter.' },
    { name: 'variant', type: "'full' | 'half'", default: "'full'", description: 'Full circle (360°) or half arc (180°).' },
    { name: 'color', type: "'default' | 'success' | 'warning' | 'danger' | 'info'", default: "'default'", description: 'Arc color.' },
    { name: 'showValue', type: 'boolean', default: 'false', description: 'Display percentage in center.' },
    { name: 'indeterminate', type: 'boolean', default: 'false', description: 'Spinning animation.' },
    { name: 'label', type: 'string', description: 'Label text below the ring.' },
    { name: 'thickness', type: 'Thickness', description: 'Override stroke thickness via token.' },
    { name: 'formatValue', type: '(value: number, max: number) => string', description: 'Custom value formatter function.' },
    { name: 'children', type: 'React.ReactNode', description: 'Custom content in center of ring.' },
  ],
};
