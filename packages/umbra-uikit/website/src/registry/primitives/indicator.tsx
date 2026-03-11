import React from 'react';
import { Indicator, HStack, VStack, Text } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

export const indicatorEntry: ComponentEntry = {
  slug: 'indicator',
  name: 'Indicator',
  category: 'primitives',
  subcategory: 'Status & Feedback',
  description:
    'Status dot indicator with 5 semantic color variants and 3 animation states: idle (static), active (pulsing), and inactive (hollow).',
  variantCount: 5,
  keywords: ['indicator', 'status', 'dot', 'online', 'active', 'pulse'],

  cardPreview: (
    <HStack gap="md" align="center">
      <Indicator variant="success" state="active" />
      <Indicator variant="warning" state="idle" />
      <Indicator variant="danger" state="idle" />
    </HStack>
  ),

  examples: [
    {
      title: 'Variants',
      render: (
        <HStack gap="lg" align="center">
          {(['neutral', 'success', 'warning', 'danger', 'info'] as const).map((v) => (
            <VStack key={v} gap="xs" align="center">
              <Indicator variant={v} size="md" />
              <Text size="xs" color="tertiary">{v}</Text>
            </VStack>
          ))}
        </HStack>
      ),
      code: `import { Indicator } from '@wisp-ui/react';

<Indicator variant="neutral" />
<Indicator variant="success" />
<Indicator variant="warning" />
<Indicator variant="danger" />
<Indicator variant="info" />`,
      rnCode: `import { Indicator } from '@wisp-ui/react-native';

<Indicator variant="success" />
<Indicator variant="danger" state="active" />
<Indicator variant="info" state="inactive" />`,
    },
    {
      title: 'States',
      render: (
        <HStack gap="lg" align="center">
          {(['idle', 'active', 'inactive'] as const).map((s) => (
            <VStack key={s} gap="xs" align="center">
              <Indicator variant="success" state={s} size="md" />
              <Text size="xs" color="tertiary">{s}</Text>
            </VStack>
          ))}
        </HStack>
      ),
      code: `<Indicator state="idle" />    {/* Static dot */}
<Indicator state="active" />  {/* Pulsing animation */}
<Indicator state="inactive" /> {/* Hollow ring */}`,
    },
    {
      title: 'Sizes',
      render: (
        <HStack gap="lg" align="center">
          {(['sm', 'md', 'lg'] as const).map((size) => (
            <VStack key={size} gap="xs" align="center">
              <Indicator variant="info" size={size} />
              <Text size="xs" color="tertiary">{size}</Text>
            </VStack>
          ))}
        </HStack>
      ),
      code: `<Indicator size="sm" />
<Indicator size="md" />
<Indicator size="lg" />`,
    },
  ],

  props: [
    { name: 'variant', type: "'neutral' | 'success' | 'warning' | 'danger' | 'info'", default: "'success'", description: 'Semantic color variant.' },
    { name: 'state', type: "'idle' | 'active' | 'inactive'", default: "'idle'", description: 'Animation state: idle (static), active (pulsing), inactive (hollow).' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'sm'", description: 'Dot size.' },
    { name: 'label', type: 'string', description: 'Accessible label for screen readers.' },
  ],
};
