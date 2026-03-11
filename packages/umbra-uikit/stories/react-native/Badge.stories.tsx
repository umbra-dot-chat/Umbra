import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from '@wisp-ui/react-native';

const meta: Meta<typeof Badge> = {
  title: 'React Native/Primitives/Badge',
  component: Badge,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    variant: { control: 'select', options: ['default', 'success', 'warning', 'danger', 'info'] },
    shape: { control: 'select', options: ['pill', 'badge'] },
    dot: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    children: 'Badge',
    size: 'md',
    variant: 'default',
    shape: 'pill',
  },
};

// ---------------------------------------------------------------------------
// 2. Variants
// ---------------------------------------------------------------------------

export const Variants: Story = {
  name: 'Variants',
  render: () => (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      <Badge variant="default">Default</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="danger">Danger</Badge>
      <Badge variant="info">Info</Badge>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. Sizes
// ---------------------------------------------------------------------------

export const Sizes: Story = {
  name: 'Sizes',
  render: () => (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <Badge size="sm" variant="success">Small</Badge>
      <Badge size="md" variant="success">Medium</Badge>
      <Badge size="lg" variant="success">Large</Badge>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 4. Shapes
// ---------------------------------------------------------------------------

export const Shapes: Story = {
  name: 'Shapes',
  render: () => (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <Badge shape="pill" variant="info">Pill</Badge>
      <Badge shape="badge" variant="info">Badge</Badge>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 5. With Dot
// ---------------------------------------------------------------------------

export const WithDot: Story = {
  name: 'With Dot',
  render: () => (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      <Badge dot variant="default">Active</Badge>
      <Badge dot variant="success">Online</Badge>
      <Badge dot variant="warning">Away</Badge>
      <Badge dot variant="danger">Offline</Badge>
      <Badge dot variant="info">Syncing</Badge>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 6. All Combinations
// ---------------------------------------------------------------------------

export const AllCombinations: Story = {
  name: 'All Combinations',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {(['default', 'success', 'warning', 'danger', 'info'] as const).map((variant) => (
        <div key={variant} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ width: 60, fontSize: 11, color: '#94A0B8' }}>{variant}</div>
          <Badge size="sm" variant={variant}>{variant}</Badge>
          <Badge size="md" variant={variant}>{variant}</Badge>
          <Badge size="lg" variant={variant}>{variant}</Badge>
          <Badge size="md" variant={variant} dot>{variant}</Badge>
          <Badge size="md" variant={variant} shape="badge">{variant}</Badge>
        </div>
      ))}
    </div>
  ),
};
