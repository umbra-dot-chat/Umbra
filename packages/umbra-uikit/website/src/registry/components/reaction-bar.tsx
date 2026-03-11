import React from 'react';
import { ReactionBar, VStack, Text } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

const sampleReactions = [
  { emoji: '👍', count: 5, active: true },
  { emoji: '❤️', count: 3 },
  { emoji: '😂', count: 2 },
  { emoji: '🎉', count: 1 },
];

export const reactionBarEntry: ComponentEntry = {
  slug: 'reaction-bar',
  name: 'ReactionBar',
  category: 'components',
  subcategory: 'Chat & Messaging',
  description:
    'Floating emoji reaction bar for chat messages with toggle support, counts, and add button. Essential for messaging interfaces.',
  variantCount: 1,
  keywords: ['reaction', 'emoji', 'like', 'chat', 'message', 'bar', 'toggle', 'social'],

  cardPreview: (
    <div style={{ pointerEvents: 'none' }}>
      <ReactionBar reactions={sampleReactions} size="sm" showAddButton={false} />
    </div>
  ),

  examples: [
    {
      title: 'Default',
      render: (
        <ReactionBar reactions={sampleReactions} />
      ),
      code: `import { ReactionBar } from '@wisp-ui/react';

const reactions = [
  { emoji: '👍', count: 5, active: true },
  { emoji: '❤️', count: 3 },
  { emoji: '😂', count: 2 },
];

<ReactionBar reactions={reactions} onReactionClick={(emoji, active) => {}} />`,
    },
    {
      title: 'Sizes',
      render: (
        <VStack gap="lg">
          <VStack gap="xs">
            <Text size="xs" color="secondary">sm</Text>
            <ReactionBar reactions={sampleReactions} size="sm" />
          </VStack>
          <VStack gap="xs">
            <Text size="xs" color="secondary">md</Text>
            <ReactionBar reactions={sampleReactions} size="md" />
          </VStack>
          <VStack gap="xs">
            <Text size="xs" color="secondary">lg</Text>
            <ReactionBar reactions={sampleReactions} size="lg" />
          </VStack>
        </VStack>
      ),
      code: `<ReactionBar reactions={reactions} size="sm" />
<ReactionBar reactions={reactions} size="md" />
<ReactionBar reactions={reactions} size="lg" />`,
    },
    {
      title: 'Without Add Button',
      render: (
        <ReactionBar reactions={sampleReactions} showAddButton={false} />
      ),
      code: `<ReactionBar reactions={reactions} showAddButton={false} />`,
    },
    {
      title: 'Skeleton',
      render: (
        <VStack gap="md">
          <ReactionBar reactions={[]} size="sm" skeleton />
          <ReactionBar reactions={[]} size="md" skeleton />
        </VStack>
      ),
      code: `<ReactionBar reactions={[]} skeleton />`,
    },
  ],

  props: [
    { name: 'reactions', type: 'Reaction[]', required: true, description: 'Array of reactions to display.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Size preset.' },
    { name: 'onReactionClick', type: '(emoji: string, active: boolean) => void', description: 'Called when a reaction is toggled.' },
    { name: 'showAddButton', type: 'boolean', default: 'true', description: 'Show the add reaction button.' },
    { name: 'onAddClick', type: '() => void', description: 'Called when add button is clicked.' },
    { name: 'maxVisible', type: 'number', description: 'Max reactions to show before +N.' },
    { name: 'skeleton', type: 'boolean', default: 'false', description: 'Show loading skeleton.' },
  ],
};
