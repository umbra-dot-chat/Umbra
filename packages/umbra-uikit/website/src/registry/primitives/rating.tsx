import React, { useState } from 'react';
import { Rating, HStack, VStack, Text } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

function RatingDemo() {
  const [value, setValue] = useState(3);
  return <Rating value={value} onChange={setValue} size="lg" showValue />;
}

export const ratingEntry: ComponentEntry = {
  slug: 'rating',
  name: 'Rating',
  category: 'primitives',
  subcategory: 'Media & Display',
  description:
    'Star rating with 3 sizes, half-star precision, read-only/disabled modes, and skeleton loading.',
  variantCount: 3,
  keywords: ['rating', 'star', 'review', 'score', 'feedback'],

  cardPreview: (
    <Rating value={4} readOnly size="md" />
  ),

  examples: [
    {
      title: 'Interactive',
      render: <RatingDemo />,
      code: `import { Rating } from '@wisp-ui/react';

const [value, setValue] = useState(3);
<Rating value={value} onChange={setValue} size="lg" showValue />`,
      rnCode: `import { Rating } from '@wisp-ui/react-native';

<Rating defaultValue={3} />
<Rating value={rating} onChange={setRating} />`,
    },
    {
      title: 'Sizes',
      render: (
        <VStack gap="md">
          {(['sm', 'md', 'lg'] as const).map((size) => (
            <HStack key={size} gap="md" align="center">
              <Text size="xs" color="tertiary" style={{ width: 20 }}>{size}</Text>
              <Rating value={3.5} readOnly size={size} allowHalf />
            </HStack>
          ))}
        </VStack>
      ),
      code: `<Rating value={3.5} readOnly size="sm" allowHalf />
<Rating value={3.5} readOnly size="md" allowHalf />
<Rating value={3.5} readOnly size="lg" allowHalf />`,
    },
    {
      title: 'Half Stars & Custom Max',
      render: (
        <VStack gap="md">
          <Rating value={2.5} readOnly allowHalf showValue />
          <Rating value={7} readOnly max={10} showValue />
        </VStack>
      ),
      code: `<Rating value={2.5} readOnly allowHalf showValue />
<Rating value={7} readOnly max={10} showValue />`,
    },
    {
      title: 'States',
      render: (
        <VStack gap="md">
          <HStack gap="md" align="center">
            <Rating value={3} readOnly />
            <Text size="xs" color="tertiary">Read-only</Text>
          </HStack>
          <HStack gap="md" align="center">
            <Rating value={2} disabled />
            <Text size="xs" color="tertiary">Disabled</Text>
          </HStack>
        </VStack>
      ),
      code: `<Rating value={3} readOnly />
<Rating value={2} disabled />`,
    },
    {
      title: 'Skeleton',
      render: <Rating skeleton size="md" />,
      code: `<Rating skeleton />`,
    },
  ],

  props: [
    { name: 'value', type: 'number', description: 'Current rating value (controlled).' },
    { name: 'defaultValue', type: 'number', default: '0', description: 'Initial value (uncontrolled).' },
    { name: 'max', type: 'number', default: '5', description: 'Maximum number of stars.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Star size.' },
    { name: 'allowHalf', type: 'boolean', default: 'false', description: 'Enable half-star precision.' },
    { name: 'onChange', type: '(value: number) => void', description: 'Callback when rating changes.' },
    { name: 'readOnly', type: 'boolean', default: 'false', description: 'Read-only display mode.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disabled state.' },
    { name: 'showValue', type: 'boolean', default: 'false', description: 'Display numeric value label.' },
    { name: 'skeleton', type: 'boolean', default: 'false', description: 'Show skeleton placeholder.' },
  ],
};
