import React from 'react';
import { Icon, HStack, VStack, Text } from '@wisp-ui/react';
import { Star, Heart, Bell, Settings, Search, Home, Mail, Zap } from 'lucide-react';
import type { ComponentEntry } from '../types';

export const iconEntry: ComponentEntry = {
  slug: 'icon',
  name: 'Icon',
  category: 'primitives',
  subcategory: 'Text & Typography',
  description:
    'Wrapper for Lucide icons with consistent sizing, semantic colors, stroke width control, and skeleton loading.',
  variantCount: 5,
  keywords: ['icon', 'lucide', 'glyph', 'symbol', 'svg'],

  cardPreview: (
    <HStack gap="sm" align="center">
      <Icon icon={Star as any} size="sm" />
      <Icon icon={Heart as any} size="md" />
      <Icon icon={Bell as any} size="lg" />
      <Icon icon={Settings as any} size="xl" />
    </HStack>
  ),

  examples: [
    {
      title: 'Sizes',
      render: (
        <HStack gap="lg" align="end">
          {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
            <VStack key={size} gap="xs" align="center">
              <Icon icon={Star as any} size={size} />
              <Text size="xs" color="tertiary">{size}</Text>
            </VStack>
          ))}
        </HStack>
      ),
      code: `import { Icon } from '@wisp-ui/react';

<Icon icon={Star} size="xs" />
<Icon icon={Star} size="sm" />
<Icon icon={Star} size="md" />
<Icon icon={Star} size="lg" />
<Icon icon={Star} size="xl" />`,
      rnCode: `import { Icon } from '@wisp-ui/react-native';

<Icon size="sm" color="primary" />
<Icon size="md" color="secondary" />
<Icon size="lg" color="danger" />`,
    },
    {
      title: 'Colors',
      render: (
        <HStack gap="md" align="center">
          {(['primary', 'secondary', 'tertiary', 'success', 'warning', 'danger', 'info'] as const).map((c) => (
            <Icon key={c} icon={Heart as any} size="lg" color={c} />
          ))}
        </HStack>
      ),
      code: `<Icon icon={Heart} color="primary" />
<Icon icon={Heart} color="success" />
<Icon icon={Heart} color="danger" />`,
    },
    {
      title: 'Various Icons',
      render: (
        <HStack gap="md" align="center">
          <Icon icon={Home as any} size="lg" />
          <Icon icon={Search as any} size="lg" />
          <Icon icon={Mail as any} size="lg" />
          <Icon icon={Bell as any} size="lg" />
          <Icon icon={Settings as any} size="lg" />
          <Icon icon={Zap as any} size="lg" />
        </HStack>
      ),
      code: `import { Home, Search, Mail, Bell, Settings, Zap } from 'lucide-react';

<Icon icon={Home} size="lg" />
<Icon icon={Search} size="lg" />
<Icon icon={Mail} size="lg" />`,
    },
  ],

  props: [
    { name: 'icon', type: 'React.ComponentType', required: true, description: 'The Lucide icon component to render.' },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'", default: "'md'", description: 'Icon size. xs=14, sm=16, md=20, lg=24, xl=32.' },
    { name: 'color', type: "SemanticColor | 'currentColor' | string", default: "'currentColor'", description: 'Icon color.' },
    { name: 'strokeWidth', type: 'number', default: '2', description: 'SVG stroke width.' },
    { name: 'skeleton', type: 'boolean', default: 'false', description: 'Show skeleton loading placeholder.' },
    { name: 'label', type: 'string', description: 'Accessibility label (aria-label).' },
  ],
};
