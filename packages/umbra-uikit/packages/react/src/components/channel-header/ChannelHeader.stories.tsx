import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ChannelHeader } from './ChannelHeader';
import type { ChannelHeaderAction, ChannelHeaderType } from '@coexist/wisp-core/types/ChannelHeader.types';

// ---------------------------------------------------------------------------
// Inline icons for stories (minimal SVG, no lucide)
// ---------------------------------------------------------------------------

function SearchIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function PinIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="17" x2="12" y2="22" />
      <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
    </svg>
  );
}

function UsersIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function PhoneIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function SettingsIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}

function StarIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const defaultActions: ChannelHeaderAction[] = [
  { key: 'search', label: 'Search', icon: <SearchIcon />, onClick: () => {} },
  { key: 'pins', label: 'Pinned Messages', icon: <PinIcon />, onClick: () => {} },
  { key: 'members', label: 'Member List', icon: <UsersIcon />, onClick: () => {} },
];

const voiceActions: ChannelHeaderAction[] = [
  { key: 'call', label: 'Start Call', icon: <PhoneIcon />, onClick: () => {} },
  { key: 'members', label: 'Member List', icon: <UsersIcon />, onClick: () => {} },
  { key: 'settings', label: 'Channel Settings', icon: <SettingsIcon />, onClick: () => {} },
];

const allTypes: ChannelHeaderType[] = [
  'text', 'voice', 'announcement', 'files', 'bulletin', 'welcome', 'thread', 'forum',
];

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof ChannelHeader> = {
  title: 'Components/Community/ChannelHeader',
  component: ChannelHeader,
  tags: ['autodocs'],
  argTypes: {
    name: { control: 'text' },
    type: { control: 'select', options: allTypes },
    topic: { control: 'text' },
    encrypted: { control: 'boolean' },
    slowMode: { control: 'boolean' },
    skeleton: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof ChannelHeader>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    name: 'general',
    type: 'text',
    topic: 'General discussion for the team',
    actions: defaultActions,
  },
};

export const VoiceChannel: Story = {
  name: 'Voice Channel',
  args: {
    name: 'Lounge',
    type: 'voice',
    topic: 'Hang out and chat',
    actions: voiceActions,
  },
};

export const AllChannelTypes: Story = {
  name: 'All Channel Types',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {allTypes.map((channelType) => (
        <ChannelHeader
          key={channelType}
          name={channelType}
          type={channelType}
          topic={`This is a ${channelType} channel`}
        />
      ))}
    </div>
  ),
};

export const Encrypted: Story = {
  name: 'Encrypted',
  args: {
    name: 'secret-plans',
    type: 'text',
    topic: 'End-to-end encrypted channel',
    encrypted: true,
    actions: defaultActions,
  },
};

export const SlowMode: Story = {
  name: 'Slow Mode',
  args: {
    name: 'announcements',
    type: 'announcement',
    topic: 'Important updates only — slow mode enabled',
    slowMode: true,
    actions: defaultActions,
  },
};

export const WithActiveAction: Story = {
  name: 'Active Action',
  args: {
    name: 'general',
    type: 'text',
    topic: 'Members panel is open',
    actions: [
      { key: 'search', label: 'Search', icon: <SearchIcon />, onClick: () => {} },
      { key: 'pins', label: 'Pinned Messages', icon: <PinIcon />, onClick: () => {} },
      { key: 'members', label: 'Member List', icon: <UsersIcon />, onClick: () => {}, active: true },
    ],
  },
};

export const WithDisabledAction: Story = {
  name: 'Disabled Action',
  args: {
    name: 'read-only',
    type: 'text',
    topic: 'Some actions are disabled',
    actions: [
      { key: 'search', label: 'Search', icon: <SearchIcon />, onClick: () => {}, disabled: true },
      { key: 'pins', label: 'Pinned Messages', icon: <PinIcon />, onClick: () => {} },
      { key: 'members', label: 'Member List', icon: <UsersIcon />, onClick: () => {} },
    ],
  },
};

export const NoTopic: Story = {
  name: 'No Topic',
  args: {
    name: 'general',
    type: 'text',
    actions: defaultActions,
  },
};

export const CustomIcon: Story = {
  name: 'Custom Icon',
  args: {
    name: 'favorites',
    icon: <StarIcon />,
    topic: 'Channel with a custom icon',
    actions: defaultActions,
  },
};

export const Skeleton: Story = {
  args: {
    name: 'general',
    skeleton: true,
  },
};

export const EncryptedSlowMode: Story = {
  name: 'Encrypted + Slow Mode',
  args: {
    name: 'classified',
    type: 'text',
    topic: 'Highly restricted channel',
    encrypted: true,
    slowMode: true,
    actions: defaultActions,
  },
};
