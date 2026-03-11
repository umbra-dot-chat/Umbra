import React from 'react';
import { Skeleton, HStack, VStack, Text } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

export const skeletonEntry: ComponentEntry = {
  slug: 'skeleton',
  name: 'Skeleton',
  category: 'primitives',
  subcategory: 'Status & Feedback',
  description:
    'Loading placeholder with text, circular, and rectangular variants. Supports pulse, wave, and static animations.',
  variantCount: 9,
  keywords: ['skeleton', 'loading', 'placeholder', 'shimmer', 'pulse'],

  cardPreview: (
    <VStack gap="sm" style={{ width: '100%', maxWidth: 200 }}>
      <Skeleton variant="rectangular" width="100%" height={20} />
      <Skeleton variant="rectangular" width="70%" height={14} />
      <Skeleton variant="rectangular" width="85%" height={14} />
    </VStack>
  ),

  examples: [
    {
      title: 'Variants',
      render: (
        <HStack gap="lg" align="start">
          <VStack gap="xs" align="center">
            <Skeleton variant="text" width={200} />
            <Text size="xs" color="tertiary">text (3 lines)</Text>
          </VStack>
          <VStack gap="xs" align="center">
            <Skeleton variant="circular" width={48} height={48} />
            <Text size="xs" color="tertiary">circular</Text>
          </VStack>
          <VStack gap="xs" align="center">
            <Skeleton variant="rectangular" width={120} height={80} />
            <Text size="xs" color="tertiary">rectangular</Text>
          </VStack>
        </HStack>
      ),
      code: `import { Skeleton } from '@wisp-ui/react';

<Skeleton variant="text" width={200} />
<Skeleton variant="circular" width={48} height={48} />
<Skeleton variant="rectangular" width={120} height={80} />`,
      rnCode: `import { Skeleton } from '@wisp-ui/react-native';

<Skeleton variant="rectangular" width={200} height={20} />
<Skeleton variant="circular" width={48} />
<Skeleton variant="text" lines={3} />`,
    },
    {
      title: 'Animations',
      render: (
        <VStack gap="md">
          {(['pulse', 'wave', 'none'] as const).map((anim) => (
            <HStack key={anim} gap="md" align="center">
              <Text size="xs" color="tertiary" style={{ width: 40 }}>{anim}</Text>
              <Skeleton variant="rectangular" width={200} height={24} animation={anim} />
            </HStack>
          ))}
        </VStack>
      ),
      code: `<Skeleton animation="pulse" width={200} height={24} />
<Skeleton animation="wave" width={200} height={24} />
<Skeleton animation="none" width={200} height={24} />`,
    },
    {
      title: 'Content Placeholder',
      render: (
        <HStack gap="md" align="start" style={{ width: 300 }}>
          <Skeleton variant="circular" width={40} height={40} />
          <VStack gap="xs" style={{ flex: 1 }}>
            <Skeleton variant="rectangular" width="60%" height={16} />
            <Skeleton variant="rectangular" width="100%" height={12} />
            <Skeleton variant="rectangular" width="80%" height={12} />
          </VStack>
        </HStack>
      ),
      code: `<HStack gap="md" align="start">
  <Skeleton variant="circular" width={40} height={40} />
  <VStack gap="xs" style={{ flex: 1 }}>
    <Skeleton variant="rectangular" width="60%" height={16} />
    <Skeleton variant="rectangular" width="100%" height={12} />
    <Skeleton variant="rectangular" width="80%" height={12} />
  </VStack>
</HStack>`,
    },
  ],

  props: [
    { name: 'variant', type: "'text' | 'circular' | 'rectangular'", default: "'rectangular'", description: 'Shape variant.' },
    { name: 'width', type: 'number | string', description: 'Width of the skeleton.' },
    { name: 'height', type: 'number | string', description: 'Height of the skeleton.' },
    { name: 'lines', type: 'number', default: '3', description: 'Number of text lines (text variant only).' },
    { name: 'lineHeight', type: 'number', default: '16', description: 'Height of each text line.' },
    { name: 'lineSpacing', type: 'number', default: '8', description: 'Gap between text lines.' },
    { name: 'radius', type: 'number | string', description: 'Custom border radius override.' },
    { name: 'animation', type: "'pulse' | 'wave' | 'none'", default: "'pulse'", description: 'Animation style.' },
  ],
};
