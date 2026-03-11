import React from 'react';
import { ScrollArea, Text, VStack, Box } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';
import { DemoBox } from '../../shared/DemoBox';

export const scrollAreaEntry: ComponentEntry = {
  slug: 'scroll-area',
  name: 'ScrollArea',
  category: 'layouts',
  subcategory: 'Scrolling & Positioning',
  description:
    'Scrollable container with thin scrollbar, directional control, and optional scrollbar hiding.',
  variantCount: 3,
  keywords: ['scroll', 'overflow', 'scrollbar', 'scrollable', 'area'],

  cardPreview: (
    <ScrollArea maxHeight={80} style={{ width: '100%', maxWidth: 200 }}>
      <VStack gap="xs">
        {Array.from({ length: 8 }, (_, i) => (
          <Text key={i} size="xs" color="secondary">Row {i + 1}</Text>
        ))}
      </VStack>
    </ScrollArea>
  ),

  examples: [
    {
      title: 'Vertical Scroll',
      render: (
        <ScrollArea maxHeight={180} style={{ width: '100%', maxWidth: 300 }}>
          <VStack gap="sm">
            {Array.from({ length: 15 }, (_, i) => (
              <DemoBox key={i} p="sm" radius="sm" intensity="subtle">
                <Text>Item {i + 1}</Text>
              </DemoBox>
            ))}
          </VStack>
        </ScrollArea>
      ),
      code: `import { ScrollArea } from '@wisp-ui/react';

<ScrollArea maxHeight={180}>
  {items.map((item) => (
    <Box key={item}>Item</Box>
  ))}
</ScrollArea>`,
      rnCode: `import { ScrollArea } from '@wisp-ui/react-native';

<ScrollArea maxHeight={180}>
  {items.map((item) => (
    <Box key={item}>Item</Box>
  ))}
</ScrollArea>`,
    },
    {
      title: 'Horizontal Scroll',
      render: (
        <ScrollArea direction="horizontal" maxWidth={300}>
          <div style={{ display: 'flex', gap: 8, width: 'max-content' }}>
            {Array.from({ length: 10 }, (_, i) => (
              <DemoBox key={i} p="md" radius="sm" style={{ minWidth: 100, textAlign: 'center' }}>
                <Text size="xs">{i + 1}</Text>
              </DemoBox>
            ))}
          </div>
        </ScrollArea>
      ),
      code: `<ScrollArea direction="horizontal" maxWidth={300}>
  <HStack gap="sm">{/* wide content */}</HStack>
</ScrollArea>`,
      rnCode: `<ScrollArea direction="horizontal" maxWidth={300}>
  <HStack gap="sm">{/* wide content */}</HStack>
</ScrollArea>`,
    },
  ],

  props: [
    { name: 'direction', type: "'vertical' | 'horizontal' | 'both'", default: "'vertical'", description: 'Scroll direction.' },
    { name: 'hideScrollbar', type: 'boolean', default: 'false', description: 'Hide scrollbar visually.' },
    { name: 'scrollbarWidth', type: "'thin' | 'auto' | 'none'", default: "'thin'", description: 'Scrollbar width.' },
    { name: 'maxHeight', type: 'string | number', description: 'Maximum height before scrolling.' },
    { name: 'maxWidth', type: 'string | number', description: 'Maximum width before scrolling.' },
  ],
};
