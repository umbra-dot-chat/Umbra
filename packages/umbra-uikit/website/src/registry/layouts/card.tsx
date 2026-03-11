import React from 'react';
import { Card, Text, VStack, HStack, Button } from '@wisp-ui/react';
import { ExternalLink } from 'lucide-react';
import type { ComponentEntry } from '../types';

export const cardEntry: ComponentEntry = {
  slug: 'card',
  name: 'Card',
  category: 'layouts',
  subcategory: 'Content Containers',
  description:
    'Surface container with variants for elevation, outlined borders, filled backgrounds, and glass effects. Supports padding, radius, interactive states, and skeleton loading.',
  variantCount: 4,
  keywords: ['card', 'surface', 'container', 'panel', 'box'],

  cardPreview: (
    <HStack gap="sm">
      <Card variant="elevated" padding="md" radius="md" style={{ width: 140 }}>
        <VStack gap="xs">
          <Text weight="bold" color="inherit">Elevated</Text>
          <Text size="xs" color="inherit" style={{ opacity: 0.7 }}>With shadow</Text>
        </VStack>
      </Card>
      <Card variant="outlined" padding="md" radius="md" style={{ width: 140 }}>
        <VStack gap="xs">
          <Text weight="bold">Outlined</Text>
          <Text size="xs" color="secondary">With border</Text>
        </VStack>
      </Card>
    </HStack>
  ),

  examples: [
    {
      title: 'Variants',
      render: (
        <HStack gap="md" style={{ flexWrap: 'wrap' }}>
          <Card variant="elevated" padding="lg" radius="lg" style={{ width: 200 }}>
            <VStack gap="xs">
              <Text size="md" weight="bold" color="inherit">Elevated</Text>
              <Text color="inherit" style={{ opacity: 0.7 }}>Box shadow for depth.</Text>
            </VStack>
          </Card>
          <Card variant="outlined" padding="lg" radius="lg" style={{ width: 200 }}>
            <VStack gap="xs">
              <Text size="md" weight="bold">Outlined</Text>
              <Text color="secondary">Subtle border.</Text>
            </VStack>
          </Card>
          <Card variant="filled" padding="lg" radius="lg" style={{ width: 200 }}>
            <VStack gap="xs">
              <Text size="md" weight="bold" color="inherit">Filled</Text>
              <Text color="inherit" style={{ opacity: 0.7 }}>Raised background.</Text>
            </VStack>
          </Card>
          <Card variant="glass" padding="lg" radius="lg" style={{ width: 200 }}>
            <VStack gap="xs">
              <Text size="md" weight="bold" color="inherit">Glass</Text>
              <Text color="inherit" style={{ opacity: 0.7 }}>Frosted glass effect.</Text>
            </VStack>
          </Card>
        </HStack>
      ),
      code: `import { Card } from '@wisp-ui/react';

<Card variant="elevated" padding="lg" radius="lg">…</Card>
<Card variant="outlined" padding="lg" radius="lg">…</Card>
<Card variant="filled" padding="lg" radius="lg">…</Card>
<Card variant="glass" padding="lg" radius="lg">…</Card>`,
      rnCode: `import { Card } from '@wisp-ui/react-native';

<Card variant="elevated" padding="lg" radius="lg">…</Card>
<Card variant="outlined" padding="lg" radius="lg">…</Card>
<Card variant="filled" padding="lg" radius="lg">…</Card>
<Card variant="glass" padding="lg" radius="lg">…</Card>`,
    },
    {
      title: 'Padding & Radius',
      render: (
        <HStack gap="md" style={{ flexWrap: 'wrap' }}>
          <Card variant="outlined" padding="none" radius="none" style={{ width: 120 }}>
            <div style={{ padding: 12 }}><Text size="xs">none / none</Text></div>
          </Card>
          <Card variant="outlined" padding="sm" radius="sm" style={{ width: 120 }}>
            <Text size="xs">sm / sm</Text>
          </Card>
          <Card variant="outlined" padding="md" radius="md" style={{ width: 120 }}>
            <Text size="xs">md / md</Text>
          </Card>
          <Card variant="outlined" padding="lg" radius="lg" style={{ width: 120 }}>
            <Text size="xs">lg / lg</Text>
          </Card>
        </HStack>
      ),
      code: `<Card padding="none" radius="none">…</Card>
<Card padding="sm" radius="sm">…</Card>
<Card padding="md" radius="md">…</Card>
<Card padding="lg" radius="lg">…</Card>`,
      rnCode: `<Card padding="none" radius="none">…</Card>
<Card padding="sm" radius="sm">…</Card>
<Card padding="md" radius="md">…</Card>
<Card padding="lg" radius="lg">…</Card>`,
    },
    {
      title: 'Interactive',
      render: (
        <Card variant="outlined" padding="lg" radius="lg" interactive style={{ maxWidth: 300 }}>
          <VStack gap="sm">
            <Text size="md" weight="bold">Interactive Card</Text>
            <Text color="secondary">
              Hover and press this card to see the interaction feedback.
            </Text>
          </VStack>
        </Card>
      ),
      code: `<Card variant="outlined" padding="lg" radius="lg" interactive>
  <Text size="md" weight="bold">Interactive Card</Text>
  <Text color="secondary">Hover and press to see feedback.</Text>
</Card>`,
      rnCode: `<Card variant="outlined" padding="lg" radius="lg" interactive>
  <Text size="md" weight="bold">Interactive Card</Text>
  <Text color="secondary">Press to see feedback.</Text>
</Card>`,
    },
  ],

  props: [
    { name: 'variant', type: "'elevated' | 'outlined' | 'filled' | 'glass'", default: "'elevated'", description: 'Visual style variant.' },
    { name: 'padding', type: "'none' | 'sm' | 'md' | 'lg'", default: "'md'", description: 'Inner padding preset.' },
    { name: 'radius', type: "'none' | 'sm' | 'md' | 'lg'", default: "'md'", description: 'Border-radius preset.' },
    { name: 'interactive', type: 'boolean', default: 'false', description: 'Enables hover and press feedback styles.' },
    { name: 'selected', type: 'boolean', default: 'false', description: 'Highlights the card with a focused border.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Reduces opacity and prevents clicks.' },
    { name: 'skeleton', type: 'boolean', default: 'false', description: 'Renders a pulsing skeleton placeholder.' },
    { name: 'as', type: 'React.ElementType', default: "'div'", description: 'Polymorphic element type for the root.' },
    { name: 'onClick', type: '(e: MouseEvent) => void', description: 'Click handler.' },
    { name: 'children', type: 'React.ReactNode', description: 'Card content.' },
  ],
};
