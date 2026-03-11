import React from 'react';
import { Badge, HStack, VStack, Text } from '@wisp-ui/react';
import { Star, Zap } from 'lucide-react';
import type { ComponentEntry } from '../types';

export const badgeEntry: ComponentEntry = {
  slug: 'badge',
  name: 'Badge',
  category: 'primitives',
  subcategory: 'Badges & Tags',
  description:
    'Status badge with 5 semantic variants, pill/square shapes, dot indicator, icons, and skeleton loading.',
  variantCount: 5,
  keywords: ['badge', 'status', 'label', 'tag', 'indicator'],

  cardPreview: (
    <HStack gap="xs" align="center">
      <Badge variant="default" size="sm">Default</Badge>
      <Badge variant="success" size="sm">Success</Badge>
      <Badge variant="danger" size="sm">Error</Badge>
    </HStack>
  ),

  examples: [
    {
      title: 'Variants',
      render: (
        <HStack gap="sm" align="center" style={{ flexWrap: 'wrap' }}>
          {(['default', 'success', 'warning', 'danger', 'info'] as const).map((v) => (
            <Badge key={v} variant={v}>{v}</Badge>
          ))}
        </HStack>
      ),
      code: `import { Badge } from '@wisp-ui/react';

<Badge variant="default">Default</Badge>
<Badge variant="success">Success</Badge>
<Badge variant="warning">Warning</Badge>
<Badge variant="danger">Danger</Badge>
<Badge variant="info">Info</Badge>`,
      rnCode: `import { Badge } from '@wisp-ui/react-native';

<Badge variant="default">Default</Badge>
<Badge variant="success">Success</Badge>
<Badge variant="warning">Warning</Badge>
<Badge variant="danger">Danger</Badge>
<Badge variant="info">Info</Badge>`,
    },
    {
      title: 'Sizes',
      render: (
        <HStack gap="sm" align="center">
          {(['sm', 'md', 'lg'] as const).map((size) => (
            <Badge key={size} size={size} variant="info">{size}</Badge>
          ))}
        </HStack>
      ),
      code: `<Badge size="sm">Small</Badge>
<Badge size="md">Medium</Badge>
<Badge size="lg">Large</Badge>`,
    },
    {
      title: 'Shapes',
      render: (
        <HStack gap="sm" align="center">
          <Badge shape="pill">Pill shape</Badge>
          <Badge shape="badge">Badge shape</Badge>
        </HStack>
      ),
      code: `<Badge shape="pill">Pill shape</Badge>
<Badge shape="badge">Badge shape</Badge>`,
    },
    {
      title: 'With Dot & Icons',
      render: (
        <HStack gap="sm" align="center" style={{ flexWrap: 'wrap' }}>
          <Badge dot variant="success">Online</Badge>
          <Badge dot variant="danger">Offline</Badge>
          <Badge icon={Star as any} variant="info">Featured</Badge>
          <Badge trailingIcon={Zap as any} variant="warning">Fast</Badge>
        </HStack>
      ),
      code: `<Badge dot variant="success">Online</Badge>
<Badge icon={Star} variant="info">Featured</Badge>
<Badge trailingIcon={Zap} variant="warning">Fast</Badge>`,
      rnCode: `import { Badge } from '@wisp-ui/react-native';

<Badge dot variant="success">Online</Badge>
<Badge dot variant="danger">Offline</Badge>`,
    },
    {
      title: 'Skeleton',
      render: (
        <HStack gap="sm">
          <Badge skeleton>Loading</Badge>
          <Badge skeleton>Placeholder</Badge>
        </HStack>
      ),
      code: `<Badge skeleton>Loading</Badge>`,
    },
  ],

  props: [
    { name: 'children', type: 'React.ReactNode', required: true, description: 'Badge label text.' },
    { name: 'variant', type: "'default' | 'success' | 'warning' | 'danger' | 'info'", default: "'default'", description: 'Semantic color variant.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Badge size.' },
    { name: 'shape', type: "'pill' | 'badge'", default: "'pill'", description: 'Pill (rounded) or badge (squared) corners.' },
    { name: 'dot', type: 'boolean', default: 'false', description: 'Show a colored dot indicator.' },
    { name: 'icon', type: 'React.ComponentType', description: 'Leading icon component.' },
    { name: 'trailingIcon', type: 'React.ComponentType', description: 'Trailing icon component.' },
    { name: 'skeleton', type: 'boolean', default: 'false', description: 'Show skeleton loading state.' },
  ],
};
