import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { FriendSection, FriendListItem, Avatar } from '@wisp-ui/react-native';

const meta: Meta<typeof FriendSection> = {
  title: 'React Native/Components/Social/FriendSection',
  component: FriendSection,
  tags: ['autodocs'],
  argTypes: {
    defaultCollapsed: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof FriendSection>;

// ---------------------------------------------------------------------------
// Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  name: 'Default',
  render: () => (
    <div style={{ maxWidth: 480 }}>
      <FriendSection title="Online" count={3}>
        <FriendListItem
          name="Alice Chen"
          username="@alice"
          avatar={<Avatar name="Alice Chen" size="md" />}
          status="online"
          statusText="Playing Valorant"
        />
        <FriendListItem
          name="Bob Martinez"
          username="@bobm"
          avatar={<Avatar name="Bob Martinez" size="md" />}
          status="online"
        />
        <FriendListItem
          name="Carol Wu"
          username="@carolw"
          avatar={<Avatar name="Carol Wu" size="md" />}
          status="online"
          statusText="Coding"
        />
      </FriendSection>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// Collapsed
// ---------------------------------------------------------------------------

export const Collapsed: Story = {
  name: 'Collapsed',
  render: () => (
    <div style={{ maxWidth: 480 }}>
      <FriendSection title="Offline" count={12} defaultCollapsed>
        <FriendListItem
          name="Dan Lee"
          username="@danl"
          avatar={<Avatar name="Dan Lee" size="md" />}
          status="offline"
        />
      </FriendSection>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

export const EmptyState: Story = {
  name: 'Empty State',
  render: () => (
    <div style={{ maxWidth: 480 }}>
      <FriendSection
        title="Pending Requests"
        count={0}
        emptyMessage="No pending friend requests."
      />
    </div>
  ),
};
