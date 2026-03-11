import React from 'react';
import { ActivityCircles, Text, VStack } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

export const activityCirclesEntry: ComponentEntry = {
  slug: 'activity-circles',
  name: 'ActivityCircles',
  category: 'components',
  subcategory: 'Gamification',
  description:
    'Apple-Watch-style concentric progress rings for tracking multiple metrics simultaneously. Each ring represents a separate metric with customisable colours, labels, and centre content.',
  variantCount: 4,
  keywords: ['chart', 'activity', 'circles', 'rings', 'progress', 'gauge', 'data', 'visualization', 'fitness'],
  props: [
    { name: 'rings', type: 'ActivityCirclesRing[]', required: true, description: 'Array of ring definitions (outer → inner). Max 5 rings.' },
    { name: 'size', type: "'sm' | 'md' | 'lg' | 'xl'", default: "'md'", description: 'Size variant controlling diameter and stroke width.' },
    { name: 'thickness', type: 'Thickness', description: 'Override stroke thickness using the shared Thickness token.' },
    { name: 'showLabels', type: 'boolean', default: 'false', description: 'Show colour-coded legend below the rings.' },
    { name: 'animated', type: 'boolean', default: 'false', description: 'Animate rings on mount.' },
    { name: 'children', type: 'ReactNode', description: 'Custom content rendered in the centre of the rings.' },
  ],

  cardPreview: (
    <div style={{ pointerEvents: 'none' }}>
      <ActivityCircles
        size="sm"
        rings={[
          { value: 80, max: 100 },
          { value: 50, max: 60 },
          { value: 10, max: 12 },
        ]}
      />
    </div>
  ),

  examples: [
    {
      title: 'Activity Tracker',
      render: (
        <ActivityCircles
          size="lg"
          showLabels
          rings={[
            { value: 520, max: 600, label: 'Move' },
            { value: 28, max: 30, label: 'Exercise' },
            { value: 11, max: 12, label: 'Stand' },
          ]}
        />
      ),
      code: `import { ActivityCircles } from '@wisp-ui/react';

<ActivityCircles
  size="lg"
  showLabels
  rings={[
    { value: 520, max: 600, label: 'Move' },
    { value: 28, max: 30, label: 'Exercise' },
    { value: 11, max: 12, label: 'Stand' },
  ]}
/>`,
      rnCode: `import { ActivityCircles } from '@wisp-ui/react-native';

<ActivityCircles
  size="lg"
  showLabels
  rings={[
    { value: 520, max: 600, label: 'Move' },
    { value: 28, max: 30, label: 'Exercise' },
    { value: 11, max: 12, label: 'Stand' },
  ]}
/>`,
    },
    {
      title: 'With Centre Content',
      render: (
        <ActivityCircles
          size="xl"
          rings={[
            { value: 75, max: 100 },
            { value: 50, max: 100 },
            { value: 30, max: 100 },
          ]}
        >
          <VStack gap="none" style={{ alignItems: 'center' }}>
            <Text weight="bold" size="lg">1,000</Text>
            <Text size="sm" color="muted">Active users</Text>
          </VStack>
        </ActivityCircles>
      ),
      code: `import { ActivityCircles, Text, VStack } from '@wisp-ui/react';

<ActivityCircles
  size="xl"
  rings={[
    { value: 75, max: 100 },
    { value: 50, max: 100 },
    { value: 30, max: 100 },
  ]}
>
  <VStack gap="none" style={{ alignItems: 'center' }}>
    <Text weight="bold" size="lg">1,000</Text>
    <Text size="sm" color="muted">Active users</Text>
  </VStack>
</ActivityCircles>`,
      rnCode: `import { ActivityCircles, Text, VStack } from '@wisp-ui/react-native';

<ActivityCircles
  size="xl"
  rings={[
    { value: 75, max: 100 },
    { value: 50, max: 100 },
    { value: 30, max: 100 },
  ]}
>
  <VStack gap="none" style={{ alignItems: 'center' }}>
    <Text weight="bold" size="lg">1,000</Text>
    <Text size="sm" color="muted">Active users</Text>
  </VStack>
</ActivityCircles>`,
    },
    {
      title: 'Custom Colours',
      render: (
        <ActivityCircles
          size="lg"
          showLabels
          rings={[
            { value: 90, max: 100, color: '#FF3B30', label: 'Calories' },
            { value: 65, max: 100, color: '#30D158', label: 'Steps' },
            { value: 40, max: 100, color: '#007AFF', label: 'Distance' },
          ]}
        />
      ),
      code: `import { ActivityCircles } from '@wisp-ui/react';

<ActivityCircles
  size="lg"
  showLabels
  rings={[
    { value: 90, max: 100, color: '#FF3B30', label: 'Calories' },
    { value: 65, max: 100, color: '#30D158', label: 'Steps' },
    { value: 40, max: 100, color: '#007AFF', label: 'Distance' },
  ]}
/>`,
      rnCode: `import { ActivityCircles } from '@wisp-ui/react-native';

<ActivityCircles
  size="lg"
  showLabels
  rings={[
    { value: 90, max: 100, color: '#FF3B30', label: 'Calories' },
    { value: 65, max: 100, color: '#30D158', label: 'Steps' },
    { value: 40, max: 100, color: '#007AFF', label: 'Distance' },
  ]}
/>`,
    },
    {
      title: 'Five Rings',
      render: (
        <ActivityCircles
          size="xl"
          showLabels
          rings={[
            { value: 95, max: 100, label: 'Speed' },
            { value: 70, max: 100, label: 'Power' },
            { value: 85, max: 100, label: 'Range' },
            { value: 60, max: 100, label: 'Durability' },
            { value: 45, max: 100, label: 'Precision' },
          ]}
        />
      ),
      code: `import { ActivityCircles } from '@wisp-ui/react';

<ActivityCircles
  size="xl"
  showLabels
  rings={[
    { value: 95, max: 100, label: 'Speed' },
    { value: 70, max: 100, label: 'Power' },
    { value: 85, max: 100, label: 'Range' },
    { value: 60, max: 100, label: 'Durability' },
    { value: 45, max: 100, label: 'Precision' },
  ]}
/>`,
      rnCode: `import { ActivityCircles } from '@wisp-ui/react-native';

<ActivityCircles
  size="xl"
  showLabels
  rings={[
    { value: 95, max: 100, label: 'Speed' },
    { value: 70, max: 100, label: 'Power' },
    { value: 85, max: 100, label: 'Range' },
    { value: 60, max: 100, label: 'Durability' },
    { value: 45, max: 100, label: 'Precision' },
  ]}
/>`,
    },
  ],
};
