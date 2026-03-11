import React from 'react';
import { Separator, Text, HStack, VStack, Box } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

export const separatorEntry: ComponentEntry = {
  slug: 'separator',
  name: 'Separator',
  category: 'layouts',
  subcategory: 'Content Containers',
  description:
    'Horizontal or vertical divider line with optional center label, spacing presets, and subtle/strong variants.',
  variantCount: 2,
  keywords: ['separator', 'divider', 'line', 'hr', 'rule'],

  cardPreview: (
    <VStack gap="sm" style={{ width: '100%', maxWidth: 200 }}>
      <Text color="secondary">Above</Text>
      <Separator />
      <Text color="secondary">Below</Text>
    </VStack>
  ),

  examples: [
    {
      title: 'Horizontal',
      render: (
        <VStack gap="md" style={{ width: '100%', maxWidth: 400 }}>
          <Text>Section A</Text>
          <Separator />
          <Text>Section B</Text>
          <Separator variant="strong" />
          <Text>Section C</Text>
        </VStack>
      ),
      code: `import { Separator } from '@wisp-ui/react';

<Separator />
<Separator variant="strong" />`,
      rnCode: `import { Separator } from '@wisp-ui/react-native';

<Separator />
<Separator variant="strong" />`,
    },
    {
      title: 'With Label',
      render: (
        <VStack gap="md" style={{ width: '100%', maxWidth: 400 }}>
          <Separator label="OR" />
          <Separator label="Section Title" />
        </VStack>
      ),
      code: `<Separator label="OR" />
<Separator label="Section Title" />`,
      rnCode: `<Separator label="OR" />
<Separator label="Section Title" />`,
    },
    {
      title: 'Vertical',
      render: (
        <HStack gap="md" align="center" style={{ height: 40 }}>
          <Text>Left</Text>
          <Separator orientation="vertical" />
          <Text>Right</Text>
        </HStack>
      ),
      code: `<HStack align="center" style={{ height: 40 }}>
  <Text>Left</Text>
  <Separator orientation="vertical" />
  <Text>Right</Text>
</HStack>`,
      rnCode: `<HStack align="center" style={{ height: 40 }}>
  <Text>Left</Text>
  <Separator orientation="vertical" />
  <Text>Right</Text>
</HStack>`,
    },
  ],

  props: [
    { name: 'orientation', type: "'horizontal' | 'vertical'", default: "'horizontal'", description: 'Direction of the line.' },
    { name: 'variant', type: "'subtle' | 'strong'", default: "'subtle'", description: 'Visual weight.' },
    { name: 'label', type: 'React.ReactNode', description: 'Center label text.' },
    { name: 'spacing', type: "'none' | 'sm' | 'md' | 'lg'", default: "'md'", description: 'Margin around separator.' },
    { name: 'thickness', type: 'Thickness', default: '1', description: 'Line thickness in px.' },
  ],
};
