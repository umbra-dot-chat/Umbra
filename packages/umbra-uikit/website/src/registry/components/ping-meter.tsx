import React from 'react';
import { PingMeter, HStack, VStack, Text } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

export const pingMeterEntry: ComponentEntry = {
  slug: 'ping-meter',
  name: 'PingMeter',
  category: 'components',
  subcategory: 'Data Viz',
  description:
    'Network latency indicator with animated dot, signal bars, latency value display, and dot/bars/full variants.',
  variantCount: 3,
  keywords: ['ping', 'meter', 'latency', 'network', 'signal', 'connection'],

  cardPreview: (
    <HStack gap="md" align="center">
      <PingMeter latency={24} size="sm" />
      <PingMeter latency={120} size="sm" />
      <PingMeter latency={350} size="sm" />
    </HStack>
  ),

  examples: [
    {
      title: 'Latency Values',
      render: (
        <HStack gap="lg" align="center">
          <VStack gap="xs" align="center">
            <PingMeter latency={15} />
            <Text size="xs" color="tertiary">Excellent</Text>
          </VStack>
          <VStack gap="xs" align="center">
            <PingMeter latency={80} />
            <Text size="xs" color="tertiary">Good</Text>
          </VStack>
          <VStack gap="xs" align="center">
            <PingMeter latency={200} />
            <Text size="xs" color="tertiary">Fair</Text>
          </VStack>
          <VStack gap="xs" align="center">
            <PingMeter latency={400} />
            <Text size="xs" color="tertiary">Poor</Text>
          </VStack>
        </HStack>
      ),
      code: `import { PingMeter } from '@wisp-ui/react';\n\n<PingMeter latency={15} />   {/* Excellent */}
<PingMeter latency={80} />   {/* Good */}
<PingMeter latency={200} />  {/* Fair */}
<PingMeter latency={400} />  {/* Poor */}`,
      rnCode: `import { PingMeter } from '@wisp-ui/react-native';

<PingMeter latency={15} />   {/* Excellent */}
<PingMeter latency={80} />   {/* Good */}
<PingMeter latency={200} />  {/* Fair */}
<PingMeter latency={400} />  {/* Poor */}`,
    },
    {
      title: 'Variants',
      render: (
        <HStack gap="lg" align="center">
          {(['dot', 'bars', 'full'] as const).map((v) => (
            <VStack key={v} gap="xs" align="center">
              <PingMeter latency={50} variant={v} />
              <Text size="xs" color="tertiary">{v}</Text>
            </VStack>
          ))}
        </HStack>
      ),
      code: `<PingMeter latency={50} variant="dot" />
<PingMeter latency={50} variant="bars" />
<PingMeter latency={50} variant="full" />`,
      rnCode: `import { PingMeter } from '@wisp-ui/react-native';

<PingMeter latency={50} variant="dot" />
<PingMeter latency={50} variant="bars" />
<PingMeter latency={50} variant="full" />`,
    },
    {
      title: 'Sizes',
      render: (
        <HStack gap="lg" align="center">
          {(['sm', 'md', 'lg'] as const).map((size) => (
            <VStack key={size} gap="xs" align="center">
              <PingMeter latency={45} size={size} />
              <Text size="xs" color="tertiary">{size}</Text>
            </VStack>
          ))}
        </HStack>
      ),
      code: `<PingMeter latency={45} size="sm" />
<PingMeter latency={45} size="md" />
<PingMeter latency={45} size="lg" />`,
      rnCode: `import { PingMeter } from '@wisp-ui/react-native';

<PingMeter latency={45} size="sm" />
<PingMeter latency={45} size="md" />
<PingMeter latency={45} size="lg" />`,
    },
  ],

  props: [
    { name: 'latency', type: 'number', required: true, description: 'Latency in milliseconds.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Overall size.' },
    { name: 'showLatency', type: 'boolean', default: 'true', description: 'Show latency value.' },
    { name: 'showBars', type: 'boolean', default: 'true', description: 'Show signal bars.' },
    { name: 'showDot', type: 'boolean', default: 'true', description: 'Show animated dot.' },
    { name: 'variant', type: "'dot' | 'bars' | 'full'", default: "'full'", description: 'Display variant.' },
    { name: 'maxLatency', type: 'number', default: '500', description: 'Max latency for scaling.' },
    { name: 'skeleton', type: 'boolean', default: 'false', description: 'Skeleton placeholder.' },
  ],
};
