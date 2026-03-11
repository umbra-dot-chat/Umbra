import React from 'react';
import { AvatarGroup, Avatar, VStack, HStack, Text } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

export const avatarGroupEntry: ComponentEntry = {
  slug: 'avatar-group',
  name: 'AvatarGroup',
  category: 'components',
  subcategory: 'Social',
  description:
    'Displays a stack of overlapping avatars with an optional "+N" overflow indicator for truncated lists.',
  variantCount: 3,
  keywords: ['avatar', 'group', 'stack', 'overlap', 'users', 'faces'],

  cardPreview: (
    <div style={{ pointerEvents: 'none' }}>
      <AvatarGroup max={3} size="sm">
        <Avatar name="Alice" />
        <Avatar name="Bob" />
        <Avatar name="Carol" />
        <Avatar name="Dave" />
        <Avatar name="Eve" />
      </AvatarGroup>
    </div>
  ),

  examples: [
    {
      title: 'Default',
      render: (
        <AvatarGroup max={3}>
          <Avatar name="Alice" />
          <Avatar name="Bob" />
          <Avatar name="Carol" />
          <Avatar name="Dave" />
          <Avatar name="Eve" />
        </AvatarGroup>
      ),
      code: `import { AvatarGroup, Avatar } from '@wisp-ui/react';

<AvatarGroup max={3}>
  <Avatar name="Alice" />
  <Avatar name="Bob" />
  <Avatar name="Carol" />
  <Avatar name="Dave" />
  <Avatar name="Eve" />
</AvatarGroup>`,
      rnCode: `import { AvatarGroup, Avatar } from '@wisp-ui/react-native';

<AvatarGroup max={3}>
  <Avatar name="Alice" />
  <Avatar name="Bob" />
  <Avatar name="Carol" />
  <Avatar name="Dave" />
  <Avatar name="Eve" />
</AvatarGroup>`,
    },
    {
      title: 'Sizes',
      render: (
        <VStack gap="md" align="start">
          {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
            <HStack key={size} gap="md" align="center">
              <Text size="xs" color="tertiary" style={{ width: 24 }}>{size}</Text>
              <AvatarGroup max={4} size={size}>
                <Avatar name="Alice" />
                <Avatar name="Bob" />
                <Avatar name="Carol" />
                <Avatar name="Dave" />
                <Avatar name="Eve" />
              </AvatarGroup>
            </HStack>
          ))}
        </VStack>
      ),
      code: `<AvatarGroup max={4} size="xs">...</AvatarGroup>
<AvatarGroup max={4} size="sm">...</AvatarGroup>
<AvatarGroup max={4} size="md">...</AvatarGroup>
<AvatarGroup max={4} size="lg">...</AvatarGroup>
<AvatarGroup max={4} size="xl">...</AvatarGroup>`,
      rnCode: `import { AvatarGroup, Avatar } from '@wisp-ui/react-native';

<AvatarGroup max={4} size="xs">...</AvatarGroup>
<AvatarGroup max={4} size="sm">...</AvatarGroup>
<AvatarGroup max={4} size="md">...</AvatarGroup>
<AvatarGroup max={4} size="lg">...</AvatarGroup>
<AvatarGroup max={4} size="xl">...</AvatarGroup>`,
    },
    {
      title: 'Custom Spacing',
      render: (
        <VStack gap="md" align="start">
          <HStack gap="md" align="center">
            <Text size="xs" color="tertiary" style={{ width: 80 }}>spacing=4</Text>
            <AvatarGroup max={4} spacing={4}>
              <Avatar name="Alice" />
              <Avatar name="Bob" />
              <Avatar name="Carol" />
              <Avatar name="Dave" />
              <Avatar name="Eve" />
            </AvatarGroup>
          </HStack>
          <HStack gap="md" align="center">
            <Text size="xs" color="tertiary" style={{ width: 80 }}>spacing=12</Text>
            <AvatarGroup max={4} spacing={12}>
              <Avatar name="Alice" />
              <Avatar name="Bob" />
              <Avatar name="Carol" />
              <Avatar name="Dave" />
              <Avatar name="Eve" />
            </AvatarGroup>
          </HStack>
          <HStack gap="md" align="center">
            <Text size="xs" color="tertiary" style={{ width: 80 }}>spacing=16</Text>
            <AvatarGroup max={4} spacing={16}>
              <Avatar name="Alice" />
              <Avatar name="Bob" />
              <Avatar name="Carol" />
              <Avatar name="Dave" />
              <Avatar name="Eve" />
            </AvatarGroup>
          </HStack>
        </VStack>
      ),
      code: `<AvatarGroup max={4} spacing={4}>...</AvatarGroup>
<AvatarGroup max={4} spacing={12}>...</AvatarGroup>
<AvatarGroup max={4} spacing={16}>...</AvatarGroup>`,
      rnCode: `import { AvatarGroup, Avatar } from '@wisp-ui/react-native';

<AvatarGroup max={4} spacing={4}>...</AvatarGroup>
<AvatarGroup max={4} spacing={12}>...</AvatarGroup>
<AvatarGroup max={4} spacing={16}>...</AvatarGroup>`,
    },
  ],

  props: [
    { name: 'children', type: 'React.ReactNode', required: true, description: 'Avatar elements to render in the group.' },
    { name: 'max', type: 'number', description: 'Maximum avatars to display before showing "+N" overflow.' },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'", default: "'md'", description: 'Size preset applied to all avatars.' },
    { name: 'spacing', type: 'number', default: '8', description: 'Overlap spacing in pixels between avatars.' },
  ],
};
