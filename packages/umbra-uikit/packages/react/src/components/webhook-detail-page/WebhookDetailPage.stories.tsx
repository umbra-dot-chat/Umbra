import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { WebhookDetailPage } from './WebhookDetailPage';

const meta: Meta<typeof WebhookDetailPage> = {
  title: 'Components/Community/WebhookDetailPage',
  component: WebhookDetailPage,
  tags: ['autodocs'],
  argTypes: {
    saving: { control: 'boolean' },
    skeleton: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof WebhookDetailPage>;

// ---------------------------------------------------------------------------
// Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    name: 'GitHub Bot',
    channelName: 'dev',
    token: 'wh_abc123xyz456def789ghi012jkl345',
    createdBy: 'Admin',
    createdAt: '2024-01-15',
    onNameChange: (name) => console.log('Name changed:', name),
    onCopyToken: (token) => console.log('Token copied:', token),
    onRegenerateToken: () => console.log('Regenerate token'),
    onSave: () => console.log('Save'),
    onDelete: () => console.log('Delete'),
  },
};

// ---------------------------------------------------------------------------
// With avatar
// ---------------------------------------------------------------------------

export const WithAvatar: Story = {
  name: 'With Avatar',
  args: {
    name: 'Sentry Alerts',
    avatarUrl: 'https://i.pravatar.cc/64?img=5',
    channelName: 'bugs',
    token: 'wh_sentry123abc456def789',
    createdBy: 'Admin',
    createdAt: '2024-02-20',
    onNameChange: (name) => console.log('Name changed:', name),
    onAvatarChange: (file) => console.log('Avatar changed:', file.name),
    onCopyToken: (token) => console.log('Token copied:', token),
    onRegenerateToken: () => console.log('Regenerate token'),
    onSave: () => console.log('Save'),
    onDelete: () => console.log('Delete'),
  },
};

// ---------------------------------------------------------------------------
// Saving
// ---------------------------------------------------------------------------

export const Saving: Story = {
  args: {
    name: 'GitHub Bot',
    channelName: 'dev',
    token: 'wh_abc123xyz456def789ghi012jkl345',
    createdBy: 'Admin',
    createdAt: '2024-01-15',
    onSave: () => {},
    saving: true,
  },
};

// ---------------------------------------------------------------------------
// Read only (no handlers)
// ---------------------------------------------------------------------------

export const ReadOnly: Story = {
  name: 'Read Only',
  args: {
    name: 'GitHub Bot',
    channelName: 'dev',
    token: 'wh_abc123xyz456def789ghi012jkl345',
    createdBy: 'Admin',
    createdAt: '2024-01-15',
  },
};

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export const Skeleton: Story = {
  args: {
    name: '',
    channelName: '',
    token: '',
    createdBy: '',
    createdAt: '',
    skeleton: true,
  },
};
