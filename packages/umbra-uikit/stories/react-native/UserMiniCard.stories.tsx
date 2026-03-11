import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { UserMiniCard, Avatar } from '@wisp-ui/react-native';

const meta: Meta<typeof UserMiniCard> = {
  title: 'React Native/Components/Social/UserMiniCard',
  component: UserMiniCard,
  tags: ['autodocs'],
  argTypes: {
    status: { control: 'select', options: ['online', 'idle', 'dnd', 'offline'] },
    skeleton: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof UserMiniCard>;

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const MessageIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const ProfileIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx={12} cy={7} r={4} />
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
// All Statuses
// ---------------------------------------------------------------------------

export const AllStatuses: Story = {
  name: 'All Statuses',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 320 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Online</div>
      <UserMiniCard
        name="Alice Chen"
        username="@alice"
        avatar={<Avatar name="Alice Chen" size="md" />}
        status="online"
      />

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }}>Idle</div>
      <UserMiniCard
        name="Bob Martinez"
        username="@bobm"
        avatar={<Avatar name="Bob Martinez" size="md" />}
        status="idle"
        statusText="Away for 15m"
      />

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }}>Do Not Disturb</div>
      <UserMiniCard
        name="Carol Wu"
        username="@carolw"
        avatar={<Avatar name="Carol Wu" size="md" />}
        status="dnd"
        statusText="In a meeting"
      />

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }}>Offline</div>
      <UserMiniCard
        name="Dan Lee"
        username="@danl"
        avatar={<Avatar name="Dan Lee" size="md" />}
        status="offline"
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// With Actions
// ---------------------------------------------------------------------------

export const WithActions: Story = {
  name: 'With Actions',
  render: () => (
    <div style={{ maxWidth: 320 }}>
      <UserMiniCard
        name="Alice Chen"
        username="@alice"
        avatar={<Avatar name="Alice Chen" size="md" />}
        status="online"
        statusText="Available"
        actions={[
          { id: 'message', label: 'Message', icon: <MessageIcon />, onPress: () => {} },
          { id: 'profile', label: 'Profile', icon: <ProfileIcon />, onPress: () => {} },
        ]}
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 320 }}>
      <UserMiniCard skeleton name="" />
      <UserMiniCard skeleton name="" />
    </div>
  ),
};
