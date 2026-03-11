import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { PermissionCalculator } from './PermissionCalculator';
import type { ComputedPermission } from '@coexist/wisp-core/types/PermissionCalculator.types';
import { Avatar } from '../../primitives/avatar';

const samplePermissions: ComputedPermission[] = [
  { key: 'view_channels', label: 'View Channels', category: 'General', granted: true, source: 'role', sourceName: 'Member' },
  { key: 'send_messages', label: 'Send Messages', category: 'General', granted: true, source: 'role', sourceName: 'Member' },
  { key: 'embed_links', label: 'Embed Links', category: 'General', granted: true, source: 'role', sourceName: 'Member' },
  { key: 'attach_files', label: 'Attach Files', category: 'General', granted: false, source: 'channel-override', sourceName: '#announcements override' },
  { key: 'kick_members', label: 'Kick Members', category: 'Moderation', granted: true, source: 'role', sourceName: 'Moderator' },
  { key: 'ban_members', label: 'Ban Members', category: 'Moderation', granted: false, source: 'role', sourceName: 'Moderator' },
  { key: 'manage_messages', label: 'Manage Messages', category: 'Moderation', granted: true, source: 'role', sourceName: 'Moderator' },
  { key: 'administrator', label: 'Administrator', category: 'Administration', granted: true, source: 'administrator' },
  { key: 'manage_roles', label: 'Manage Roles', category: 'Administration', granted: true, source: 'owner' },
  { key: 'manage_channels', label: 'Manage Channels', category: 'Administration', granted: true, source: 'owner' },
];

const meta: Meta<typeof PermissionCalculator> = {
  title: 'Components/Community/PermissionCalculator',
  component: PermissionCalculator,
  tags: ['autodocs'],
  argTypes: {
    loading: { control: 'boolean' },
    skeleton: { control: 'boolean' },
    title: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof PermissionCalculator>;

export const Default: Story = {
  render: () => (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <PermissionCalculator
        userName="Alice"
        userAvatar={<Avatar size="sm" name="Alice" />}
        channelName="#general"
        permissions={samplePermissions}
      />
    </div>
  ),
};

export const WithClose: Story = {
  name: 'With Close Button',
  render: () => (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <PermissionCalculator
        userName="Bob"
        userAvatar={<Avatar size="sm" name="Bob" />}
        channelName="#announcements"
        permissions={samplePermissions}
        onClose={() => console.log('Close clicked')}
      />
    </div>
  ),
};

export const Loading: Story = {
  name: 'Loading State',
  render: () => (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <PermissionCalculator
        userName="Alice"
        channelName="#general"
        permissions={[]}
        loading
      />
    </div>
  ),
};

export const MixedPermissions: Story = {
  name: 'Mixed Granted/Denied',
  render: () => {
    const mixed: ComputedPermission[] = [
      { key: 'view_channels', label: 'View Channels', category: 'General', granted: true, source: 'role', sourceName: 'Everyone' },
      { key: 'send_messages', label: 'Send Messages', category: 'General', granted: false, source: 'channel-override', sourceName: '#read-only override' },
      { key: 'embed_links', label: 'Embed Links', category: 'General', granted: false, source: 'role', sourceName: 'New Member' },
      { key: 'administrator', label: 'Administrator', category: 'Administration', granted: false, source: 'role', sourceName: 'New Member' },
    ];
    return (
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <PermissionCalculator
          userName="NewUser"
          channelName="#read-only"
          permissions={mixed}
        />
      </div>
    );
  },
};
