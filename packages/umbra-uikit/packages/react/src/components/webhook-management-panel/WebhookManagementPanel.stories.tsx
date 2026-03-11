import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { WebhookManagementPanel } from './WebhookManagementPanel';
import type { WebhookEntry } from '@coexist/wisp-core/types/WebhookManagementPanel.types';

const meta: Meta<typeof WebhookManagementPanel> = {
  title: 'Components/Community/WebhookManagementPanel',
  component: WebhookManagementPanel,
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text' },
    maxWebhooks: { control: 'number' },
    loading: { control: 'boolean' },
    skeleton: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof WebhookManagementPanel>;

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

const sampleWebhooks: WebhookEntry[] = [
  {
    id: 'wh-1',
    name: 'GitHub Bot',
    channelName: 'dev',
    channelId: 'c1',
    createdBy: 'Admin',
    createdAt: '2024-01-15',
    lastUsedAt: '2024-03-01',
  },
  {
    id: 'wh-2',
    name: 'CI/CD Alerts',
    channelName: 'deployments',
    channelId: 'c2',
    createdBy: 'DevOps',
    createdAt: '2024-02-10',
  },
  {
    id: 'wh-3',
    name: 'Sentry Errors',
    channelName: 'bugs',
    channelId: 'c3',
    createdBy: 'Admin',
    createdAt: '2024-03-05',
    avatarUrl: 'https://i.pravatar.cc/40?img=3',
  },
];

// ---------------------------------------------------------------------------
// Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    webhooks: sampleWebhooks,
    title: 'Webhooks',
    maxWebhooks: 10,
    onCreateClick: () => console.log('Create clicked'),
    onWebhookClick: (id) => console.log('Webhook clicked:', id),
    onDeleteWebhook: (id) => console.log('Delete webhook:', id),
  },
};

// ---------------------------------------------------------------------------
// Empty
// ---------------------------------------------------------------------------

export const Empty: Story = {
  args: {
    webhooks: [],
    onCreateClick: () => console.log('Create clicked'),
  },
};

// ---------------------------------------------------------------------------
// At max
// ---------------------------------------------------------------------------

export const AtMax: Story = {
  name: 'At Maximum',
  args: {
    webhooks: sampleWebhooks,
    maxWebhooks: 3,
    onCreateClick: () => console.log('Create clicked'),
    onDeleteWebhook: (id) => console.log('Delete webhook:', id),
  },
};

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------

export const Loading: Story = {
  args: {
    webhooks: [],
    loading: true,
  },
};

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export const Skeleton: Story = {
  args: {
    webhooks: [],
    skeleton: true,
  },
};
