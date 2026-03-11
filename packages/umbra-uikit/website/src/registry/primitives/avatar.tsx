import React from 'react';
import { Avatar, HStack, VStack, Text } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

export const avatarEntry: ComponentEntry = {
  slug: 'avatar',
  name: 'Avatar',
  category: 'primitives',
  subcategory: 'Media & Display',
  description:
    'User avatar with image, initials fallback, or icon fallback. Supports 5 sizes, circle/square shape, status indicator, and skeleton loading.',
  variantCount: 5,
  keywords: ['avatar', 'user', 'profile', 'image', 'initials'],

  cardPreview: (
    <HStack gap="sm" align="center">
      <Avatar name="Alice" size="sm" />
      <Avatar name="Bob Chen" size="md" />
      <Avatar size="lg" />
    </HStack>
  ),

  examples: [
    {
      title: 'Sizes',
      render: (
        <HStack gap="md" align="end">
          {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
            <VStack key={size} gap="xs" align="center">
              <Avatar name="John Doe" size={size} />
              <Text size="xs" color="tertiary">{size}</Text>
            </VStack>
          ))}
        </HStack>
      ),
      code: `import { Avatar } from '@wisp-ui/react';

<Avatar name="John Doe" size="xs" />
<Avatar name="John Doe" size="sm" />
<Avatar name="John Doe" size="md" />
<Avatar name="John Doe" size="lg" />
<Avatar name="John Doe" size="xl" />`,
      rnCode: `import { Avatar } from '@wisp-ui/react-native';

<Avatar name="Ada Lovelace" size="lg" />
<Avatar name="Grace Hopper" status="online" />`,
    },
    {
      title: 'Shapes',
      render: (
        <HStack gap="lg" align="center">
          <VStack gap="xs" align="center">
            <Avatar name="Ana" size="lg" shape="circle" />
            <Text size="xs" color="tertiary">circle</Text>
          </VStack>
          <VStack gap="xs" align="center">
            <Avatar name="Ana" size="lg" shape="square" />
            <Text size="xs" color="tertiary">square</Text>
          </VStack>
        </HStack>
      ),
      code: `<Avatar name="Ana" shape="circle" />
<Avatar name="Ana" shape="square" />`,
    },
    {
      title: 'Fallbacks',
      render: (
        <HStack gap="md" align="center">
          <Avatar name="Alice Williams" size="lg" />
          <Avatar size="lg" />
        </HStack>
      ),
      code: `<Avatar name="Alice Williams" /> {/* Shows "AW" initials */}
<Avatar />                       {/* Shows default user icon */}`,
    },
    {
      title: 'Status Indicator',
      render: (
        <HStack gap="md" align="center">
          {(['online', 'offline', 'busy', 'away'] as const).map((s) => (
            <VStack key={s} gap="xs" align="center">
              <Avatar name="User" size="lg" status={s} />
              <Text size="xs" color="tertiary">{s}</Text>
            </VStack>
          ))}
        </HStack>
      ),
      code: `<Avatar name="User" status="online" />
<Avatar name="User" status="offline" />
<Avatar name="User" status="busy" />
<Avatar name="User" status="away" />`,
    },
    {
      title: 'Skeleton',
      render: (
        <HStack gap="md">
          <Avatar skeleton size="md" />
          <Avatar skeleton size="lg" />
        </HStack>
      ),
      code: `<Avatar skeleton size="md" />`,
    },
  ],

  props: [
    { name: 'src', type: 'string', description: 'Image URL for the avatar.' },
    { name: 'alt', type: 'string', description: 'Alt text for the avatar image.' },
    { name: 'name', type: 'string', description: 'Full name used to derive initials fallback.' },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'", default: "'md'", description: 'Avatar size.' },
    { name: 'shape', type: "'circle' | 'square'", default: "'circle'", description: 'Avatar shape.' },
    { name: 'status', type: "'online' | 'offline' | 'busy' | 'away'", description: 'Status indicator dot.' },
    { name: 'fallbackIcon', type: 'React.ComponentType', description: 'Custom icon for fallback (default: User icon).' },
    { name: 'skeleton', type: 'boolean', default: 'false', description: 'Show skeleton loading state.' },
  ],
};
