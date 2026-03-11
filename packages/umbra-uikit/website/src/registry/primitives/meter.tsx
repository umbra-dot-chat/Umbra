import React from 'react';
import { Meter, VStack, Text } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

export const meterEntry: ComponentEntry = {
  slug: 'meter',
  name: 'Meter',
  category: 'primitives',
  subcategory: 'Status & Feedback',
  description:
    'Gauge meter with default, gradient, and segments variants. Semantic coloring based on low/high/optimum thresholds.',
  variantCount: 3,
  keywords: ['meter', 'gauge', 'level', 'threshold', 'segments', 'gradient'],

  cardPreview: (
    <VStack gap="sm" style={{ width: '100%', maxWidth: 200 }}>
      <Meter value={65} showValue />
      <Meter value={30} variant="gradient" />
    </VStack>
  ),

  examples: [
    {
      title: 'Variants',
      render: (
        <VStack gap="md" style={{ width: '100%', maxWidth: 400 }}>
          <Meter value={60} variant="default" label="Default" showValue />
          <Meter value={60} variant="gradient" label="Gradient" showValue />
          <Meter value={60} variant="segments" label="Segments" showValue />
        </VStack>
      ),
      code: `import { Meter } from '@wisp-ui/react';

<Meter value={60} variant="default" label="Default" showValue />
<Meter value={60} variant="gradient" label="Gradient" showValue />
<Meter value={60} variant="segments" label="Segments" showValue />`,
      rnCode: `import { Meter } from '@wisp-ui/react-native';

<Meter value={60} max={100} />
<Meter value={80} color="success" />`,
    },
    {
      title: 'Sizes',
      render: (
        <VStack gap="md" style={{ width: '100%', maxWidth: 400 }}>
          {(['sm', 'md', 'lg'] as const).map((size) => (
            <Meter key={size} value={50} size={size} label={size} showValue />
          ))}
        </VStack>
      ),
      code: `<Meter value={50} size="sm" />
<Meter value={50} size="md" />
<Meter value={50} size="lg" />`,
    },
    {
      title: 'Threshold Coloring',
      render: (
        <VStack gap="md" style={{ width: '100%', maxWidth: 400 }}>
          <Meter value={15} low={25} high={75} label="Low (danger)" showValue />
          <Meter value={50} low={25} high={75} label="Normal" showValue />
          <Meter value={90} low={25} high={75} label="High (danger)" showValue />
        </VStack>
      ),
      code: `<Meter value={15} low={25} high={75} label="Low" showValue />
<Meter value={50} low={25} high={75} label="Normal" showValue />
<Meter value={90} low={25} high={75} label="High" showValue />`,
    },
  ],

  props: [
    { name: 'value', type: 'number', required: true, description: 'Current meter value.' },
    { name: 'min', type: 'number', default: '0', description: 'Minimum range value.' },
    { name: 'max', type: 'number', default: '100', description: 'Maximum range value.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Meter size.' },
    { name: 'variant', type: "'default' | 'gradient' | 'segments'", default: "'default'", description: 'Visual style.' },
    { name: 'label', type: 'string', description: 'Label text.' },
    { name: 'showValue', type: 'boolean', default: 'false', description: 'Display percentage.' },
    { name: 'low', type: 'number', default: '25', description: 'Low threshold for semantic coloring.' },
    { name: 'high', type: 'number', default: '75', description: 'High threshold for semantic coloring.' },
    { name: 'optimum', type: 'number', default: '50', description: 'Optimal value within range.' },
    { name: 'segments', type: 'number', default: '3', description: 'Number of color segments (segments variant).' },
    { name: 'skeleton', type: 'boolean', default: 'false', description: 'Show skeleton placeholder.' },
  ],
};
