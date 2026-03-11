import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ActivityFeed } from '@wisp-ui/react-native';
import type { ActivityFeedItem } from '@wisp-ui/react-native';

const meta: Meta<typeof ActivityFeed> = {
  title: 'React Native/Components/Data Display/ActivityFeed',
  component: ActivityFeed,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md'] },
    showConnector: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof ActivityFeed>;

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  render: () => {
    const items: ActivityFeedItem[] = [
      { id: '1', content: 'Alice commented on your pull request.', timestamp: '2 minutes ago', avatarInitials: 'AC' },
      { id: '2', content: 'Bob merged branch feature/auth into main.', timestamp: '15 minutes ago', avatarInitials: 'BM' },
      { id: '3', content: 'Carol deployed v2.4.1 to production.', timestamp: '1 hour ago', avatarInitials: 'CD' },
    ];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 420 }}>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>
          Basic activity feed with initials
        </div>
        <ActivityFeed items={items} />
      </div>
    );
  },
};

// ---------------------------------------------------------------------------
// 2. Multiple Items
// ---------------------------------------------------------------------------

export const MultipleItems: Story = {
  name: 'Multiple Items',
  render: () => {
    const StarIcon = ({ size = 16, color = '#F59E0B', strokeWidth = 2 }: { size?: number; color?: string; strokeWidth?: number }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    );

    const GitIcon = ({ size = 16, color = '#94A0B8', strokeWidth = 2 }: { size?: number; color?: string; strokeWidth?: number }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <line x1="3" y1="12" x2="9" y2="12" />
        <line x1="15" y1="12" x2="21" y2="12" />
      </svg>
    );

    const items: ActivityFeedItem[] = [
      { id: '1', content: 'New release v3.0.0 published.', timestamp: 'Just now', icon: StarIcon, iconColor: '#F59E0B' },
      { id: '2', content: 'Alice pushed 3 commits to feature/dashboard.', timestamp: '5 minutes ago', avatarInitials: 'AC' },
      { id: '3', content: 'CI pipeline completed successfully.', timestamp: '12 minutes ago', icon: GitIcon, iconColor: '#22C55E' },
      { id: '4', content: 'Bob opened issue #142: Fix navigation bug.', timestamp: '30 minutes ago', avatarInitials: 'BM' },
      { id: '5', content: 'Carol requested review on PR #89.', timestamp: '1 hour ago', avatarInitials: 'CD' },
      { id: '6', content: 'Dave closed issue #138 as completed.', timestamp: '2 hours ago', avatarInitials: 'DK' },
    ];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 420 }}>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>
          Mixed avatars and icons (6 items)
        </div>
        <ActivityFeed items={items} />
      </div>
    );
  },
};

// ---------------------------------------------------------------------------
// 3. Empty
// ---------------------------------------------------------------------------

export const Empty: Story = {
  name: 'Empty',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 420 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>
        Empty feed (no items)
      </div>
      <ActivityFeed items={[]} />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 4. No Connector
// ---------------------------------------------------------------------------

export const NoConnector: Story = {
  name: 'No Connector',
  render: () => {
    const items: ActivityFeedItem[] = [
      { id: '1', content: 'Task completed: Update dependencies.', timestamp: '10 minutes ago', avatarInitials: 'TC' },
      { id: '2', content: 'Task completed: Write unit tests.', timestamp: '25 minutes ago', avatarInitials: 'UT' },
      { id: '3', content: 'Task started: Code review.', timestamp: '1 hour ago', avatarInitials: 'CR' },
    ];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 420 }}>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>
          showConnector = false
        </div>
        <ActivityFeed items={items} showConnector={false} />
      </div>
    );
  },
};

// ---------------------------------------------------------------------------
// 5. Sizes
// ---------------------------------------------------------------------------

export const Sizes: Story = {
  name: 'Sizes',
  render: () => {
    const items: ActivityFeedItem[] = [
      { id: '1', content: 'First activity entry.', timestamp: '5 minutes ago', avatarInitials: 'FA' },
      { id: '2', content: 'Second activity entry.', timestamp: '10 minutes ago', avatarInitials: 'SA' },
    ];

    return (
      <div style={{ display: 'flex', gap: 48 }}>
        {(['sm', 'md'] as const).map((size) => (
          <div key={size} style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 340 }}>
            <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>
              {size}
            </div>
            <ActivityFeed items={items} size={size} />
          </div>
        ))}
      </div>
    );
  },
};
