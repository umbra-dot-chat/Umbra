import React from 'react';
import { ActivityFeed, VStack, Text } from '@wisp-ui/react';
import { MessageSquare, GitCommit, Star } from 'lucide-react';
import type { ComponentEntry } from '../types';

const feedItems = [
  { id: '1', content: 'Alice pushed 3 commits', timestamp: '2 hours ago', avatarInitials: 'AL', icon: GitCommit as any },
  { id: '2', content: 'Bob left a comment on PR #42', timestamp: '4 hours ago', avatarInitials: 'BS', icon: MessageSquare as any },
  { id: '3', content: 'Carol starred the repository', timestamp: '1 day ago', avatarInitials: 'CW', icon: Star as any },
];

export const activityFeedEntry: ComponentEntry = {
  slug: 'activity-feed',
  name: 'ActivityFeed',
  category: 'components',
  subcategory: 'Data Display',
  description:
    'Vertical activity log with avatars, icons, timestamps, connector lines, and 2 size presets.',
  variantCount: 2,
  keywords: ['activity', 'feed', 'log', 'timeline', 'history', 'events'],

  cardPreview: (
    <div style={{ width: '100%', maxWidth: 200, pointerEvents: 'none' }}>
      <ActivityFeed items={feedItems.slice(0, 2)} size="sm" />
    </div>
  ),

  examples: [
    {
      title: 'Basic',
      render: (
        <div style={{ width: '100%', maxWidth: 400 }}>
          <ActivityFeed items={feedItems} />
        </div>
      ),
      code: `import { ActivityFeed, ActivityItem } from '@wisp-ui/react';\n\n<ActivityFeed items={[
  { id: '1', content: 'Alice pushed commits', timestamp: '2h ago', avatarInitials: 'AL' },
  { id: '2', content: 'Bob commented', timestamp: '4h ago', avatarInitials: 'BS' },
]} />`,
      rnCode: `import { ActivityFeed } from '@wisp-ui/react-native';

<ActivityFeed items={[
  { id: '1', content: 'Alice pushed commits', timestamp: '2h ago', avatarInitials: 'AL' },
  { id: '2', content: 'Bob commented', timestamp: '4h ago', avatarInitials: 'BS' },
]} />`,
    },
    {
      title: 'Without Connector',
      render: (
        <div style={{ width: '100%', maxWidth: 400 }}>
          <ActivityFeed items={feedItems} showConnector={false} />
        </div>
      ),
      code: `<ActivityFeed items={items} showConnector={false} />`,
      rnCode: `import { ActivityFeed } from '@wisp-ui/react-native';

<ActivityFeed items={items} showConnector={false} />`,
    },
  ],

  props: [
    { name: 'items', type: 'ActivityFeedItem[]', required: true, description: 'Array of feed items.' },
    { name: 'size', type: "'sm' | 'md'", default: "'md'", description: 'Size preset.' },
    { name: 'showConnector', type: 'boolean', default: 'true', description: 'Show vertical connector line.' },
  ],
};
