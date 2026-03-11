/**
 * ChannelHeader — Stories showing all variants and usage patterns.
 *
 * @module stories/channel-header
 */

import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ChannelHeader } from '@wisp-ui/react';
import { Settings, Pin, Search, Users, Bell, Hash, Volume2, Megaphone } from 'lucide-react';

const meta: Meta<typeof ChannelHeader> = {
  title: 'React/Components/Community/ChannelHeader',
  component: ChannelHeader,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ChannelHeader>;

// ---------------------------------------------------------------------------
// Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    name: 'general',
    type: 'text',
    topic: 'General discussion for the team — anything goes!',
  },
};

// ---------------------------------------------------------------------------
// Voice Channel
// ---------------------------------------------------------------------------

export const VoiceChannel: Story = {
  name: 'Voice Channel',
  args: {
    name: 'Lounge',
    type: 'voice',
    topic: 'Hang out and chat',
  },
};

// ---------------------------------------------------------------------------
// Encrypted
// ---------------------------------------------------------------------------

export const Encrypted: Story = {
  name: 'Encrypted',
  args: {
    name: 'secret-plans',
    type: 'text',
    topic: 'End-to-end encrypted channel for private discussions',
    encrypted: true,
  },
};

// ---------------------------------------------------------------------------
// With Actions
// ---------------------------------------------------------------------------

export const WithActions: Story = {
  name: 'With Actions',
  render: () => (
    <ChannelHeader
      name="general"
      type="text"
      topic="General discussion — be kind and have fun"
      actions={[
        {
          key: 'notifications',
          label: 'Notification Settings',
          icon: <Bell size={18} />,
          onClick: () => console.log('notifications'),
        },
        {
          key: 'pin',
          label: 'Pinned Messages',
          icon: <Pin size={18} />,
          onClick: () => console.log('pinned'),
        },
        {
          key: 'search',
          label: 'Search',
          icon: <Search size={18} />,
          onClick: () => console.log('search'),
        },
        {
          key: 'members',
          label: 'Member List',
          icon: <Users size={18} />,
          onClick: () => console.log('members'),
          active: true,
        },
        {
          key: 'settings',
          label: 'Channel Settings',
          icon: <Settings size={18} />,
          onClick: () => console.log('settings'),
        },
      ]}
    />
  ),
};

// ---------------------------------------------------------------------------
// All Types
// ---------------------------------------------------------------------------

export const AllTypes: Story = {
  name: 'All Types',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <ChannelHeader name="general" type="text" topic="Text channel" />
      <ChannelHeader name="Lounge" type="voice" topic="Voice channel" />
      <ChannelHeader name="updates" type="announcement" topic="Announcement channel" />
      <ChannelHeader name="shared-files" type="files" topic="Files channel" />
      <ChannelHeader name="pinboard" type="bulletin" topic="Bulletin channel" />
      <ChannelHeader name="intro" type="welcome" topic="Welcome channel" />
      <ChannelHeader name="bug-reports" type="thread" topic="Thread channel" />
      <ChannelHeader name="ideas" type="forum" topic="Forum channel" />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// Slow Mode
// ---------------------------------------------------------------------------

export const SlowMode: Story = {
  name: 'Slow Mode',
  args: {
    name: 'rate-limited',
    type: 'text',
    topic: 'This channel has slow mode enabled',
    slowMode: true,
  },
};

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export const Skeleton: Story = {
  name: 'Skeleton',
  args: {
    name: 'loading',
    skeleton: true,
  },
};
