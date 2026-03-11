/**
 * UserSearchResult — Stories showing all variants and usage patterns.
 *
 * @module stories/user-search-result
 */

import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { UserSearchResult, Avatar } from '@wisp-ui/react';

const meta: Meta<typeof UserSearchResult> = {
  title: 'React/Components/Social/UserSearchResult',
  component: UserSearchResult,
  tags: ['autodocs'],
  argTypes: {
    requestState: { control: 'select', options: ['none', 'pending', 'friends'] },
    disabled: { control: 'boolean' },
    skeleton: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof UserSearchResult>;

// ---------------------------------------------------------------------------
// Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    name: 'Alice Chen',
    username: '@alice',
    avatar: <Avatar name="Alice Chen" size="md" />,
    requestState: 'none',
    mutualFriends: 3,
    onSendRequest: () => {},
  },
};

// ---------------------------------------------------------------------------
// All States
// ---------------------------------------------------------------------------

export const AllStates: Story = {
  name: 'All States',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, maxWidth: 480 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, padding: '8px 0 4px' }}>
        None (send request)
      </div>
      <UserSearchResult
        name="Alice Chen"
        username="@alice"
        avatar={<Avatar name="Alice Chen" size="md" />}
        requestState="none"
        mutualFriends={3}
        onSendRequest={() => {}}
      />

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, padding: '8px 0 4px' }}>
        Pending
      </div>
      <UserSearchResult
        name="Bob Martinez"
        username="@bobm"
        avatar={<Avatar name="Bob Martinez" size="md" />}
        requestState="pending"
        mutualFriends={1}
      />

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, padding: '8px 0 4px' }}>
        Friends
      </div>
      <UserSearchResult
        name="Carol Wu"
        username="@carolw"
        avatar={<Avatar name="Carol Wu" size="md" />}
        requestState="friends"
        mutualFriends={7}
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
      <UserSearchResult skeleton name="" />
      <UserSearchResult skeleton name="" />
      <UserSearchResult skeleton name="" />
    </div>
  ),
};
