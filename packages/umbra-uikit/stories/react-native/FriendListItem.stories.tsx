import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { FriendListItem, Avatar } from '@wisp-ui/react-native';

const meta: Meta<typeof FriendListItem> = {
  title: 'React Native/Components/Social/FriendListItem',
  component: FriendListItem,
  tags: ['autodocs'],
  argTypes: {
    status: { control: 'select', options: ['online', 'idle', 'dnd', 'offline'] },
    disabled: { control: 'boolean' },
    skeleton: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof FriendListItem>;

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const MessageIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const MoreIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <circle cx={12} cy={12} r={1} />
    <circle cx={19} cy={12} r={1} />
    <circle cx={5} cy={12} r={1} />
  </svg>
);

// ---------------------------------------------------------------------------
// Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    name: 'Alice Chen',
    username: '@alice',
    avatar: <Avatar name="Alice Chen" size="md" />,
    status: 'online',
    statusText: 'Playing Valorant',
  },
};

// ---------------------------------------------------------------------------
// With Actions
// ---------------------------------------------------------------------------

export const WithActions: Story = {
  name: 'With Actions',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, maxWidth: 480 }}>
      <FriendListItem
        name="Alice Chen"
        username="@alice"
        avatar={<Avatar name="Alice Chen" size="md" />}
        status="online"
        statusText="Playing Valorant"
        actions={[
          { id: 'message', label: 'Message', icon: <MessageIcon />, onPress: () => {} },
          { id: 'more', label: 'More', icon: <MoreIcon />, onPress: () => {} },
        ]}
      />
      <FriendListItem
        name="Bob Martinez"
        username="@bobm"
        avatar={<Avatar name="Bob Martinez" size="md" />}
        status="idle"
        mutualFriends={3}
        actions={[
          { id: 'message', label: 'Message', icon: <MessageIcon />, onPress: () => {} },
          { id: 'more', label: 'More', icon: <MoreIcon />, onPress: () => {} },
        ]}
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// All Statuses
// ---------------------------------------------------------------------------

export const AllStatuses: Story = {
  name: 'All Statuses',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, maxWidth: 480 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, padding: '8px 0 4px' }}>Online</div>
      <FriendListItem
        name="Alice Chen"
        username="@alice"
        avatar={<Avatar name="Alice Chen" size="md" />}
        status="online"
        statusText="Available"
      />

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, padding: '8px 0 4px' }}>Idle</div>
      <FriendListItem
        name="Bob Martinez"
        username="@bobm"
        avatar={<Avatar name="Bob Martinez" size="md" />}
        status="idle"
        statusText="Away for 15m"
      />

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, padding: '8px 0 4px' }}>Do Not Disturb</div>
      <FriendListItem
        name="Carol Wu"
        username="@carolw"
        avatar={<Avatar name="Carol Wu" size="md" />}
        status="dnd"
        statusText="In a meeting"
      />

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, padding: '8px 0 4px' }}>Offline</div>
      <FriendListItem
        name="Dan Lee"
        username="@danl"
        avatar={<Avatar name="Dan Lee" size="md" />}
        status="offline"
        mutualFriends={5}
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export const Skeleton: Story = {
  name: 'Skeleton',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, maxWidth: 480 }}>
      <FriendListItem skeleton name="" />
      <FriendListItem skeleton name="" />
      <FriendListItem skeleton name="" />
    </div>
  ),
};
