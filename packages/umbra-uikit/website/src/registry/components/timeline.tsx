import React from 'react';
import { Timeline, VStack, Text } from '@wisp-ui/react';
import { Check, AlertCircle, Clock } from 'lucide-react';
import type { ComponentEntry } from '../types';

const timelineItems = [
  { id: '1', title: 'Order placed', timestamp: '10:00 AM', status: 'completed' as const, icon: Check as any },
  { id: '2', title: 'Processing', timestamp: '10:30 AM', status: 'active' as const, icon: Clock as any },
  { id: '3', title: 'Shipped', timestamp: 'Pending', status: 'pending' as const },
];

export const timelineEntry: ComponentEntry = {
  slug: 'timeline',
  name: 'Timeline',
  category: 'components',
  subcategory: 'Data Display',
  description:
    'Vertical or horizontal timeline with status-colored dots, icons, timestamps, and 3 size presets.',
  variantCount: 2,
  keywords: ['timeline', 'history', 'events', 'log', 'feed'],

  cardPreview: (
    <div style={{ width: '100%', maxWidth: 200, pointerEvents: 'none' }}>
      <Timeline items={timelineItems} size="sm" />
    </div>
  ),

  examples: [
    {
      title: 'Basic',
      render: (
        <div style={{ width: '100%', maxWidth: 400 }}>
          <Timeline items={timelineItems} />
        </div>
      ),
      code: `import { Timeline } from '@wisp-ui/react';\n\n<Timeline items={[
  { id: '1', title: 'Order placed', timestamp: '10:00 AM', status: 'completed' },
  { id: '2', title: 'Processing', timestamp: '10:30 AM', status: 'active' },
  { id: '3', title: 'Shipped', status: 'pending' },
]} />`,
      rnCode: `import { Timeline } from '@wisp-ui/react-native';

<Timeline items={[
  { id: '1', title: 'Order placed', timestamp: '10:00 AM', status: 'completed' },
  { id: '2', title: 'Processing', timestamp: '10:30 AM', status: 'active' },
  { id: '3', title: 'Shipped', status: 'pending' },
]} />`,
    },
    {
      title: 'Sizes',
      render: (
        <VStack gap="xl">
          {(['sm', 'md', 'lg'] as const).map((size) => (
            <VStack key={size} gap="xs">
              <Text size="xs" color="tertiary">{size}</Text>
              <Timeline items={timelineItems.slice(0, 2)} size={size} />
            </VStack>
          ))}
        </VStack>
      ),
      code: `<Timeline items={items} size="sm" />
<Timeline items={items} size="md" />
<Timeline items={items} size="lg" />`,
      rnCode: `import { Timeline } from '@wisp-ui/react-native';

<Timeline items={items} size="sm" />
<Timeline items={items} size="md" />
<Timeline items={items} size="lg" />`,
    },
  ],

  props: [
    { name: 'items', type: 'TimelineItem[]', required: true, description: 'Array of timeline entries.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Size preset.' },
    { name: 'orientation', type: "'vertical' | 'horizontal'", default: "'vertical'", description: 'Layout direction.' },
    { name: 'skeleton', type: 'boolean', default: 'false', description: 'Skeleton placeholder.' },
  ],
};
