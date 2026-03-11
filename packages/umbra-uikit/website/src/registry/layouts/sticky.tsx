import React from 'react';
import { Sticky, Text, Box, VStack, useThemeColors } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';
import { DemoBox } from '../../shared/DemoBox';

function StickyExample() {
  const colors = useThemeColors();
  return (
    <Box style={{ position: 'relative', height: 120, overflow: 'auto', backgroundColor: colors.accent.highlight, borderRadius: 8 }}>
      <Sticky edge="top">
        <DemoBox p="sm">
          <Text weight="medium">Sticky at top</Text>
        </DemoBox>
      </Sticky>
      <VStack gap="sm" style={{ padding: 12 }}>
        {Array.from({ length: 8 }, (_, i) => (
          <Text key={i} size="sm" color="secondary">Scroll content {i + 1}</Text>
        ))}
      </VStack>
    </Box>
  );
}

export const stickyEntry: ComponentEntry = {
  slug: 'sticky',
  name: 'Sticky',
  category: 'layouts',
  subcategory: 'Scrolling & Positioning',
  description:
    'Position-sticky wrapper with configurable edge (top/bottom), offset, and z-index from theme.',
  variantCount: 2,
  keywords: ['sticky', 'fixed', 'header', 'affix', 'position'],

  cardPreview: (
    <VStack gap="xs" style={{ width: '100%', maxWidth: 200 }}>
      <DemoBox p="sm" radius="sm" style={{ textAlign: 'center' }}>
        <Text weight="medium">Sticky Header</Text>
      </DemoBox>
      <Text color="tertiary">Content below…</Text>
    </VStack>
  ),

  examples: [
    {
      title: 'Top Sticky',
      render: <StickyExample />,
      code: `import { Sticky } from '@wisp-ui/react';

<Sticky edge="top">
  <Box>Sticky Header</Box>
</Sticky>`,
      rnCode: `import { Sticky } from '@wisp-ui/react-native';

<Sticky edge="top">
  <Box>Sticky Header</Box>
</Sticky>`,
    },
  ],

  props: [
    { name: 'edge', type: "'top' | 'bottom'", default: "'top'", description: 'Sticky edge.' },
    { name: 'offset', type: 'number', default: '0', description: 'Offset from edge in pixels.' },
    { name: 'zIndex', type: 'ZIndexKey', default: "'sticky'", description: 'Z-index layer from theme.' },
    { name: 'zIndexValue', type: 'number', description: 'Custom z-index override.' },
    { name: 'as', type: 'React.ElementType', default: "'div'", description: 'Polymorphic root element.' },
  ],
};
