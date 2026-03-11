import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { NodeDetailPanel } from './NodeDetailPanel';

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof NodeDetailPanel> = {
  title: 'Components/Community/NodeDetailPanel',
  component: NodeDetailPanel,
  tags: ['autodocs'],
  argTypes: {
    nodeType: { control: 'select', options: ['local', 'remote'] },
    status: { control: 'select', options: ['online', 'offline', 'syncing'] },
    enabled: { control: 'boolean' },
    saving: { control: 'boolean' },
    skeleton: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof NodeDetailPanel>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    name: 'Home Server',
    nodeType: 'local',
    enabled: true,
    lastSeenAt: '2025-06-15T10:30:00Z',
    maxStorageBytes: 107374182400,
    usedStorageBytes: 53687091200,
    maxBandwidthMbps: 100,
    publicKey: 'pk_ed25519_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
    status: 'online',
    onToggleEnabled: (enabled) => console.log('Toggle:', enabled),
    onUpdateConfig: (updates) => console.log('Update:', updates),
    onDelete: () => console.log('Delete'),
    onClose: () => console.log('Close'),
  },
};

export const RemoteNode: Story = {
  name: 'Remote Node',
  args: {
    name: 'Cloud VPS',
    nodeType: 'remote',
    enabled: true,
    lastSeenAt: '2025-06-15T10:29:00Z',
    maxStorageBytes: 536870912000,
    usedStorageBytes: 107374182400,
    maxBandwidthMbps: 1000,
    publicKey: 'pk_ed25519_z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4',
    status: 'syncing',
    onToggleEnabled: (enabled) => console.log('Toggle:', enabled),
    onUpdateConfig: (updates) => console.log('Update:', updates),
    onDelete: () => console.log('Delete'),
    onClose: () => console.log('Close'),
  },
};

export const OfflineDisabled: Story = {
  name: 'Offline & Disabled',
  args: {
    name: 'Raspberry Pi',
    nodeType: 'local',
    enabled: false,
    maxStorageBytes: 32212254720,
    usedStorageBytes: 30064771072,
    maxBandwidthMbps: 50,
    publicKey: 'pk_ed25519_j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6',
    status: 'offline',
    onToggleEnabled: (enabled) => console.log('Toggle:', enabled),
    onDelete: () => console.log('Delete'),
  },
};

export const Saving: Story = {
  args: {
    ...Default.args,
    saving: true,
  },
};

export const SkeletonState: Story = {
  name: 'Skeleton',
  args: {
    ...Default.args,
    skeleton: true,
  },
};
