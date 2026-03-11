import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ThreadListView, Avatar, Text } from '@wisp-ui/react';
import type { ThreadListItem } from '@wisp-ui/react';

const meta: Meta<typeof ThreadListView> = {
  title: 'React/Components/Community/ThreadListView',
  component: ThreadListView,
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text' },
    emptyText: { control: 'text' },
    loading: { control: 'boolean' },
    skeleton: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof ThreadListView>;

const SectionLabel = ({ children }: { children: string }) => (
  <Text size="xs" color="tertiary" weight="semibold" as="div" style={{ textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 4 }}>
    {children}
  </Text>
);

const sampleThreads: ThreadListItem[] = [
  {
    id: 't1',
    parentSender: 'Alice',
    parentPreview: 'Hey, has anyone seen the latest design updates for the dashboard?',
    parentAvatar: <Avatar name="Alice" size="sm" />,
    replyCount: 5,
    lastActivityAt: '2 min ago',
    hasUnread: true,
    isFollowing: true,
  },
  {
    id: 't2',
    parentSender: 'Bob',
    parentPreview: 'We need to refactor the auth module before the release',
    parentAvatar: <Avatar name="Bob" size="sm" />,
    replyCount: 12,
    lastActivityAt: '1 hour ago',
    hasUnread: false,
    isFollowing: false,
  },
  {
    id: 't3',
    parentSender: 'Charlie',
    parentPreview: 'Check out this new component library I found',
    parentAvatar: <Avatar name="Charlie" size="sm" />,
    replyCount: 3,
    lastActivityAt: '3 hours ago',
    hasUnread: true,
    isFollowing: true,
  },
];

// ---------------------------------------------------------------------------
// Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    threads: sampleThreads,
    title: 'Threads',
  },
  render: (args) => (
    <div style={{ maxWidth: 400 }}>
      <ThreadListView {...args} />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// WithFollowToggle
// ---------------------------------------------------------------------------

export const WithFollowToggle: Story = {
  name: 'With Follow Toggle',
  render: () => (
    <div style={{ maxWidth: 400 }}>
      <ThreadListView
        threads={sampleThreads}
        onThreadClick={(id) => console.log('Open thread:', id)}
        onFollowToggle={(id) => console.log('Toggle follow:', id)}
        onClose={() => console.log('Close')}
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// Empty
// ---------------------------------------------------------------------------

export const Empty: Story = {
  name: 'Empty State',
  render: () => (
    <div style={{ maxWidth: 400 }}>
      <ThreadListView
        threads={[]}
        onClose={() => console.log('Close')}
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export const Skeleton: Story = {
  name: 'Skeleton Loading',
  render: () => (
    <div style={{ maxWidth: 400 }}>
      <ThreadListView threads={[]} skeleton />
    </div>
  ),
};
