import React from 'react';
import { Spinner, HStack, VStack, Text } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

export const spinnerEntry: ComponentEntry = {
  slug: 'spinner',
  name: 'Spinner',
  category: 'primitives',
  subcategory: 'Status & Feedback',
  description:
    'Animated loading indicator with 5 sizes. Supports optional label text, custom colors, and track color.',
  variantCount: 5,
  keywords: ['spinner', 'loading', 'progress', 'indicator', 'busy'],

  cardPreview: (
    <HStack gap="md" align="center">
      <Spinner size="sm" />
      <Spinner size="md" />
      <Spinner size="lg" />
    </HStack>
  ),

  examples: [
    {
      title: 'Sizes',
      render: (
        <HStack gap="lg" align="end">
          {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
            <VStack key={size} gap="xs" align="center">
              <Spinner size={size} />
              <Text size="xs" color="tertiary">{size}</Text>
            </VStack>
          ))}
        </HStack>
      ),
      code: `import { Spinner } from '@wisp-ui/react';

<Spinner size="xs" />
<Spinner size="sm" />
<Spinner size="md" />
<Spinner size="lg" />
<Spinner size="xl" />`,
      rnCode: `import { Spinner } from '@wisp-ui/react-native';

<Spinner />
<Spinner size="lg" label="Loading..." />`,
    },
    {
      title: 'With Label',
      render: (
        <VStack gap="md" align="center">
          <Spinner size="md" label="Loading…" />
          <Spinner size="lg" label="Please wait" />
        </VStack>
      ),
      code: `<Spinner size="md" label="Loading…" />
<Spinner size="lg" label="Please wait" />`,
    },
  ],

  props: [
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'", default: "'md'", description: 'Spinner size. xs=16px, sm=20px, md=28px, lg=36px, xl=48px.' },
    { name: 'label', type: 'string', description: 'Optional label displayed alongside the spinner.' },
    { name: 'color', type: 'string', description: 'Override the indicator color.' },
    { name: 'trackColor', type: 'string', description: 'Override the track (background ring) color.' },
  ],
};
