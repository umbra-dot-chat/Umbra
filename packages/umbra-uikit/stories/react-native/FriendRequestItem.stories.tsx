import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { FriendRequestItem, Avatar } from '@wisp-ui/react-native';

const meta: Meta<typeof FriendRequestItem> = {
  title: 'React Native/Components/Social/FriendRequestItem',
  component: FriendRequestItem,
  tags: ['autodocs'],
  argTypes: {
    type: { control: 'select', options: ['incoming', 'outgoing'] },
    disabled: { control: 'boolean' },
    skeleton: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof FriendRequestItem>;

// ---------------------------------------------------------------------------
// Incoming Request
// ---------------------------------------------------------------------------

export const IncomingRequest: Story = {
  name: 'Incoming Request',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, maxWidth: 480 }}>
      <FriendRequestItem
        type="incoming"
        name="Alice Chen"
        username="@alice"
        avatar={<Avatar name="Alice Chen" size="md" />}
        timestamp="2 hours ago"
        mutualFriends={4}
        onAccept={() => {}}
        onDecline={() => {}}
      />
      <FriendRequestItem
        type="incoming"
        name="Bob Martinez"
        username="@bobm"
        avatar={<Avatar name="Bob Martinez" size="md" />}
        timestamp="1 day ago"
        onAccept={() => {}}
        onDecline={() => {}}
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// Outgoing Request
// ---------------------------------------------------------------------------

export const OutgoingRequest: Story = {
  name: 'Outgoing Request',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, maxWidth: 480 }}>
      <FriendRequestItem
        type="outgoing"
        name="Carol Wu"
        username="@carolw"
        avatar={<Avatar name="Carol Wu" size="md" />}
        timestamp="5 minutes ago"
        onCancel={() => {}}
      />
      <FriendRequestItem
        type="outgoing"
        name="Dan Lee"
        username="@danl"
        avatar={<Avatar name="Dan Lee" size="md" />}
        timestamp="3 days ago"
        mutualFriends={2}
        onCancel={() => {}}
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
      <FriendRequestItem skeleton type="incoming" name="" />
      <FriendRequestItem skeleton type="incoming" name="" />
      <FriendRequestItem skeleton type="outgoing" name="" />
    </div>
  ),
};
