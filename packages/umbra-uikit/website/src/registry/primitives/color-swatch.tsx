import React from 'react';
import { ColorSwatch, HStack, VStack, Text } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

export const colorSwatchEntry: ComponentEntry = {
  slug: 'color-swatch',
  name: 'ColorSwatch',
  category: 'primitives',
  subcategory: 'Media & Display',
  description:
    'Color preview swatch with circle, square, and rounded shapes in 4 sizes. Supports border and checkerboard background for transparency.',
  variantCount: 12,
  keywords: ['color', 'swatch', 'preview', 'palette', 'picker'],

  cardPreview: (
    <HStack gap="sm" align="center">
      <ColorSwatch color="#22C55E" size="md" />
      <ColorSwatch color="#3B82F6" size="md" />
      <ColorSwatch color="#EF4444" size="md" />
      <ColorSwatch color="#F59E0B" size="md" />
    </HStack>
  ),

  examples: [
    {
      title: 'Sizes',
      render: (
        <HStack gap="lg" align="end">
          {(['sm', 'md', 'lg', 'xl'] as const).map((size) => (
            <VStack key={size} gap="xs" align="center">
              <ColorSwatch color="#3B82F6" size={size} />
              <Text size="xs" color="tertiary">{size}</Text>
            </VStack>
          ))}
        </HStack>
      ),
      code: `import { ColorSwatch } from '@wisp-ui/react';

<ColorSwatch color="#3B82F6" size="sm" />
<ColorSwatch color="#3B82F6" size="md" />
<ColorSwatch color="#3B82F6" size="lg" />
<ColorSwatch color="#3B82F6" size="xl" />`,
      rnCode: `import { ColorSwatch } from '@wisp-ui/react-native';

<ColorSwatch color="#3B82F6" />
<ColorSwatch color="#10B981" size="lg" />`,
    },
    {
      title: 'Shapes',
      render: (
        <HStack gap="lg" align="center">
          {(['circle', 'square', 'rounded'] as const).map((shape) => (
            <VStack key={shape} gap="xs" align="center">
              <ColorSwatch color="#22C55E" size="lg" shape={shape} />
              <Text size="xs" color="tertiary">{shape}</Text>
            </VStack>
          ))}
        </HStack>
      ),
      code: `<ColorSwatch color="#22C55E" shape="circle" />
<ColorSwatch color="#22C55E" shape="square" />
<ColorSwatch color="#22C55E" shape="rounded" />`,
    },
    {
      title: 'Color Palette',
      render: (
        <HStack gap="xs" align="center" style={{ flexWrap: 'wrap' }}>
          {['#FFFFFF', '#F0F1F5', '#BFC6D4', '#667085', '#37404F', '#202531', '#0F1219', '#0A0E15'].map((c) => (
            <ColorSwatch key={c} color={c} size="lg" shape="rounded" />
          ))}
        </HStack>
      ),
      code: `{colors.map(c => (
  <ColorSwatch key={c} color={c} size="lg" shape="rounded" />
))}`,
    },
    {
      title: 'Checkerboard (Transparency)',
      render: (
        <HStack gap="sm" align="center">
          <ColorSwatch color="rgba(59, 130, 246, 0.5)" size="xl" checkerboard />
          <ColorSwatch color="rgba(0, 0, 0, 0.2)" size="xl" checkerboard />
          <ColorSwatch color="transparent" size="xl" checkerboard />
        </HStack>
      ),
      code: `<ColorSwatch color="rgba(59, 130, 246, 0.5)" checkerboard />
<ColorSwatch color="transparent" checkerboard />`,
    },
  ],

  props: [
    { name: 'color', type: 'string', required: true, description: 'CSS color to display (hex, rgb, hsl, etc.).' },
    { name: 'size', type: "'sm' | 'md' | 'lg' | 'xl'", default: "'md'", description: 'Swatch size. sm=16, md=24, lg=32, xl=48.' },
    { name: 'shape', type: "'circle' | 'square' | 'rounded'", default: "'circle'", description: 'Swatch shape.' },
    { name: 'bordered', type: 'boolean', default: 'true', description: 'Show border around swatch.' },
    { name: 'checkerboard', type: 'boolean', default: 'false', description: 'Show checkerboard background for transparent colors.' },
  ],
};
