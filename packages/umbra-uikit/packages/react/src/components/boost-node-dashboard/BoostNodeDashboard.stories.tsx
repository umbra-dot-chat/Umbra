import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { BoostNodeDashboard } from './BoostNodeDashboard';
import type { BoostNode } from '@coexist/wisp-core/types/BoostNodeDashboard.types';

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof BoostNodeDashboard> = {
  title: 'Components/Community/BoostNodeDashboard',
  component: BoostNodeDashboard,
  tags: ['autodocs'],
  argTypes: {
    loading: { control: 'boolean' },
    skeleton: { control: 'boolean' },
    title: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof BoostNodeDashboard>;

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const sampleNodes: BoostNode[] = [
  {
    id: 'node-1',
    name: 'Home Server',
    nodeType: 'local',
    enabled: true,
    lastSeenAt: '2025-06-15T10:30:00Z',
    maxStorageBytes: 107374182400,
    usedStorageBytes: 53687091200,
    maxBandwidthMbps: 100,
    status: 'online',
  },
  {
    id: 'node-2',
    name: 'Cloud VPS',
    nodeType: 'remote',
    enabled: true,
    lastSeenAt: '2025-06-15T10:29:00Z',
    maxStorageBytes: 536870912000,
    usedStorageBytes: 107374182400,
    maxBandwidthMbps: 1000,
    status: 'syncing',
  },
  {
    id: 'node-3',
    name: 'Raspberry Pi',
    nodeType: 'local',
    enabled: false,
    maxStorageBytes: 32212254720,
    usedStorageBytes: 30064771072,
    maxBandwidthMbps: 50,
    status: 'offline',
  },
];

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    nodes: sampleNodes,
    title: 'Boost Nodes',
    onNodeClick: (id) => console.log('Node clicked:', id),
    onRegisterClick: () => console.log('Register clicked'),
  },
};

export const Empty: Story = {
  name: 'Empty State',
  args: {
    nodes: [],
    onRegisterClick: () => console.log('Register clicked'),
  },
};

export const Loading: Story = {
  args: {
    nodes: [],
    loading: true,
  },
};

export const Skeleton: Story = {
  args: {
    nodes: [],
    skeleton: true,
  },
};

export const SingleNode: Story = {
  name: 'Single Node',
  args: {
    nodes: [sampleNodes[0]],
    onNodeClick: (id) => console.log('Node clicked:', id),
  },
};

export const ManyNodes: Story = {
  name: 'Many Nodes',
  args: {
    nodes: [
      ...sampleNodes,
      { ...sampleNodes[0], id: 'node-4', name: 'NAS Drive', status: 'online' as const },
      { ...sampleNodes[1], id: 'node-5', name: 'AWS Instance', status: 'syncing' as const },
      { ...sampleNodes[2], id: 'node-6', name: 'Old Laptop', status: 'offline' as const },
    ],
    onNodeClick: (id) => console.log('Node clicked:', id),
    onRegisterClick: () => console.log('Register clicked'),
  },
};
