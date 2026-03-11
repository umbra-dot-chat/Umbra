import React from 'react';
import { Progress, VStack, HStack, Text } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

export const progressEntry: ComponentEntry = {
  slug: 'progress',
  name: 'Progress',
  category: 'primitives',
  subcategory: 'Status & Feedback',
  description:
    'Linear progress bar with determinate/indeterminate modes, 5 sizes, semantic colors, labels, and skeleton loading.',
  variantCount: 5,
  keywords: ['progress', 'loading', 'bar', 'percentage', 'determinate', 'indeterminate'],

  cardPreview: (
    <VStack gap="sm" style={{ width: '100%', maxWidth: 200 }}>
      <Progress value={65} size="md" />
      <Progress value={40} size="sm" color="success" />
    </VStack>
  ),

  examples: [
    {
      title: 'Values',
      render: (
        <VStack gap="md" style={{ width: '100%', maxWidth: 400 }}>
          <Progress value={25} showValue />
          <Progress value={50} showValue />
          <Progress value={75} showValue />
          <Progress value={100} showValue />
        </VStack>
      ),
      code: `import { Progress } from '@wisp-ui/react';

<Progress value={25} showValue />
<Progress value={50} showValue />
<Progress value={75} showValue />
<Progress value={100} showValue />`,
      rnCode: `import { Progress } from '@wisp-ui/react-native';

<Progress value={60} />
<Progress value={75} label="Upload" showValue />`,
    },
    {
      title: 'Sizes',
      render: (
        <VStack gap="md" style={{ width: '100%', maxWidth: 400 }}>
          {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
            <HStack key={size} gap="md" align="center">
              <Text size="xs" color="tertiary" style={{ width: 20 }}>{size}</Text>
              <Progress value={60} size={size} style={{ flex: 1 }} />
            </HStack>
          ))}
        </VStack>
      ),
      code: `<Progress value={60} size="xs" />
<Progress value={60} size="md" />
<Progress value={60} size="xl" />`,
    },
    {
      title: 'Colors',
      render: (
        <VStack gap="md" style={{ width: '100%', maxWidth: 400 }}>
          {(['default', 'success', 'warning', 'danger', 'info'] as const).map((c) => (
            <Progress key={c} value={70} color={c} label={c} showValue />
          ))}
        </VStack>
      ),
      code: `<Progress value={70} color="default" />
<Progress value={70} color="success" />
<Progress value={70} color="danger" />`,
    },
    {
      title: 'Indeterminate',
      render: (
        <VStack gap="md" style={{ width: '100%', maxWidth: 400 }}>
          <Progress indeterminate label="Loading…" />
        </VStack>
      ),
      code: `<Progress indeterminate label="Loading…" />`,
    },
  ],

  props: [
    { name: 'value', type: 'number', default: '0', description: 'Current progress value.' },
    { name: 'max', type: 'number', default: '100', description: 'Maximum value for 100%.' },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'", default: "'md'", description: 'Bar thickness.' },
    { name: 'color', type: "'default' | 'success' | 'warning' | 'danger' | 'info'", default: "'default'", description: 'Fill color.' },
    { name: 'label', type: 'string', description: 'Label text above the bar.' },
    { name: 'showValue', type: 'boolean', default: 'false', description: 'Display percentage text.' },
    { name: 'indeterminate', type: 'boolean', default: 'false', description: 'Sliding animation for unknown duration.' },
    { name: 'thickness', type: 'Thickness', description: 'Override bar thickness via token.' },
    { name: 'formatValue', type: '(value: number, max: number) => string', description: 'Custom value formatter function.' },
    { name: 'skeleton', type: 'boolean', default: 'false', description: 'Show skeleton placeholder.' },
  ],
};
