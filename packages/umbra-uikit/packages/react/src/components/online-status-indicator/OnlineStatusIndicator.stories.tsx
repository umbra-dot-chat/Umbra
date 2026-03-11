/**
 * OnlineStatusIndicator -- Stories for the online status indicator component.
 *
 * @module stories/online-status-indicator
 */

import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { OnlineStatusIndicator } from './OnlineStatusIndicator';

const meta: Meta<typeof OnlineStatusIndicator> = {
  title: 'Components/Community/OnlineStatusIndicator',
  component: OnlineStatusIndicator,
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: ['online', 'idle', 'dnd', 'offline', 'invisible'],
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg'],
    },
    showLabel: { control: 'boolean' },
    pulse: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof OnlineStatusIndicator>;

// ---------------------------------------------------------------------------
// Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    status: 'online',
    size: 'sm',
  },
};

// ---------------------------------------------------------------------------
// All Statuses
// ---------------------------------------------------------------------------

export const AllStatuses: Story = {
  name: 'All Statuses',
  render: () => (
    <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <OnlineStatusIndicator status="online" size="md" showLabel />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <OnlineStatusIndicator status="idle" size="md" showLabel />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <OnlineStatusIndicator status="dnd" size="md" showLabel />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <OnlineStatusIndicator status="offline" size="md" showLabel />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <OnlineStatusIndicator status="invisible" size="md" showLabel />
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// All Sizes
// ---------------------------------------------------------------------------

export const AllSizes: Story = {
  name: 'All Sizes',
  render: () => (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <OnlineStatusIndicator status="online" size="xs" />
        <span>xs</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <OnlineStatusIndicator status="online" size="sm" />
        <span>sm</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <OnlineStatusIndicator status="online" size="md" />
        <span>md</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <OnlineStatusIndicator status="online" size="lg" />
        <span>lg</span>
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// With Pulse
// ---------------------------------------------------------------------------

export const WithPulse: Story = {
  name: 'With Pulse Animation',
  render: () => (
    <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
      <OnlineStatusIndicator status="online" size="md" pulse showLabel />
      <OnlineStatusIndicator status="idle" size="md" pulse showLabel />
      <OnlineStatusIndicator status="dnd" size="md" pulse showLabel />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// With Labels
// ---------------------------------------------------------------------------

export const WithLabels: Story = {
  name: 'With Labels',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <OnlineStatusIndicator status="online" size="sm" showLabel />
      <OnlineStatusIndicator status="idle" size="sm" showLabel />
      <OnlineStatusIndicator status="dnd" size="sm" showLabel />
      <OnlineStatusIndicator status="offline" size="sm" showLabel />
      <OnlineStatusIndicator status="invisible" size="sm" showLabel />
    </div>
  ),
};
