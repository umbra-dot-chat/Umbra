import React from 'react';
import { Text, HStack, VStack } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

export const textEntry: ComponentEntry = {
  slug: 'text',
  name: 'Text',
  category: 'primitives',
  subcategory: 'Text & Typography',
  description:
    'Polymorphic text primitive with 11 size steps, semantic colors, font weights, truncation, and skeleton loading.',
  variantCount: 11,
  keywords: ['text', 'typography', 'heading', 'paragraph', 'label', 'display'],

  cardPreview: (
    <VStack gap="xs">
      <Text size="xs" color="tertiary">xs — Caption</Text>
      <Text size="sm">sm — Body small</Text>
      <Text size="md" weight="medium">md — Body</Text>
      <Text size="lg" weight="semibold">lg — Title</Text>
    </VStack>
  ),

  examples: [
    {
      title: 'Sizes',
      render: (
        <VStack gap="sm">
          {(['xs', 'sm', 'md', 'lg', 'xl', 'display-sm', 'display-md', 'display-lg', 'display-xl', 'display-2xl'] as const).map((size) => (
            <Text key={size} size={size}>
              {size} — The quick brown fox
            </Text>
          ))}
        </VStack>
      ),
      code: `import { Text } from '@wisp-ui/react';

<Text size="xs">xs — The quick brown fox</Text>
<Text size="md">md — The quick brown fox</Text>
<Text size="display-lg">display-lg — The quick brown fox</Text>`,
      rnCode: `import { Text } from '@wisp-ui/react-native';

<Text size="xs">Extra small text</Text>
<Text size="sm">Small text</Text>
<Text size="md">Medium text</Text>
<Text size="lg">Large text</Text>
<Text size="xl">Extra large text</Text>`,
    },
    {
      title: 'Weights',
      render: (
        <VStack gap="sm">
          {(['regular', 'medium', 'semibold', 'bold'] as const).map((w) => (
            <Text key={w} size="md" weight={w}>
              {w} — The quick brown fox
            </Text>
          ))}
        </VStack>
      ),
      code: `<Text weight="regular">regular</Text>
<Text weight="semibold">semibold</Text>
<Text weight="bold">bold</Text>`,
    },
    {
      title: 'Colors',
      render: (
        <VStack gap="sm">
          {(['primary', 'secondary', 'tertiary', 'success', 'warning', 'danger', 'info'] as const).map((c) => (
            <Text key={c} size="sm" color={c}>
              {c} — Semantic color
            </Text>
          ))}
        </VStack>
      ),
      code: `<Text color="primary">Primary text</Text>
<Text color="secondary">Secondary text</Text>
<Text color="danger">Danger text</Text>`,
    },
    {
      title: 'Truncation',
      render: (
        <VStack gap="sm" style={{ maxWidth: 300 }}>
          <Text size="sm" truncate>
            This is a very long line of text that should be truncated with an ellipsis when it overflows its container.
          </Text>
          <Text size="sm" maxLines={2}>
            This text is clamped to 2 lines maximum. It can wrap to multiple lines but will show an ellipsis after the second line if the content is too long.
          </Text>
        </VStack>
      ),
      code: `<Text truncate>Single line truncation…</Text>
<Text maxLines={2}>Multi-line clamp to 2 lines…</Text>`,
    },
    {
      title: 'Skeleton',
      render: (
        <VStack gap="sm" style={{ width: 200 }}>
          <Text size="md" skeleton>Loading text</Text>
          <Text size="sm" skeleton>Another skeleton</Text>
        </VStack>
      ),
      code: `<Text skeleton>Loading placeholder</Text>`,
    },
  ],

  props: [
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'display-sm' | ... | 'display-2xl'", default: "'md'", description: 'Font size step. 11 steps from xs to display-2xl.' },
    { name: 'weight', type: "'regular' | 'medium' | 'semibold' | 'bold'", default: "'regular'", description: 'Font weight.' },
    { name: 'color', type: "SemanticColor | string", default: "'primary'", description: 'Text color — semantic name or raw hex/CSS color.' },
    { name: 'align', type: "'left' | 'center' | 'right' | 'justify'", description: 'Text alignment.' },
    { name: 'family', type: "'sans' | 'serif' | 'mono'", default: "'sans'", description: 'Font family stack.' },
    { name: 'truncate', type: 'boolean', default: 'false', description: 'Truncate with ellipsis on single line.' },
    { name: 'maxLines', type: 'number', description: 'Clamp text to N lines with ellipsis.' },
    { name: 'skeleton', type: 'boolean', default: 'false', description: 'Show skeleton loading placeholder.' },
    { name: 'as', type: "'span' | 'p' | 'h1'–'h6' | 'label' | 'div'", default: "'span'", description: 'Polymorphic HTML element.' },
    { name: 'iconLeft', type: 'React.ReactNode', description: 'Icon rendered before text.' },
    { name: 'iconRight', type: 'React.ReactNode', description: 'Icon rendered after text.' },
  ],
};
