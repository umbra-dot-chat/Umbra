/**
 * PingMeter -- Stories showing all variants and usage patterns.
 *
 * @module stories/ping-meter
 */

import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { PingMeter } from './PingMeter';

const meta: Meta<typeof PingMeter> = {
  title: 'Components/PingMeter',
  component: PingMeter,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof PingMeter>;

// ---------------------------------------------------------------------------
// Excellent
// ---------------------------------------------------------------------------

export const Excellent: Story = {
  args: {
    latency: 12,
  },
};

// ---------------------------------------------------------------------------
// Good
// ---------------------------------------------------------------------------

export const Good: Story = {
  args: {
    latency: 75,
  },
};

// ---------------------------------------------------------------------------
// Fair
// ---------------------------------------------------------------------------

export const Fair: Story = {
  args: {
    latency: 150,
  },
};

// ---------------------------------------------------------------------------
// Poor
// ---------------------------------------------------------------------------

export const Poor: Story = {
  args: {
    latency: 350,
  },
};

// ---------------------------------------------------------------------------
// Dot Only
// ---------------------------------------------------------------------------

export const DotOnly: Story = {
  name: 'Dot Only',
  args: {
    latency: 42,
    variant: 'dot',
  },
};

// ---------------------------------------------------------------------------
// Bars Only
// ---------------------------------------------------------------------------

export const BarsOnly: Story = {
  name: 'Bars Only',
  args: {
    latency: 85,
    variant: 'bars',
  },
};

// ---------------------------------------------------------------------------
// All Sizes
// ---------------------------------------------------------------------------

export const AllSizes: Story = {
  name: 'All Sizes',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ width: 30, fontSize: 12, color: '#888' }}>sm</span>
        <PingMeter latency={25} size="sm" />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ width: 30, fontSize: 12, color: '#888' }}>md</span>
        <PingMeter latency={25} size="md" />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ width: 30, fontSize: 12, color: '#888' }}>lg</span>
        <PingMeter latency={25} size="lg" />
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export const Skeleton: Story = {
  args: {
    latency: 0,
    skeleton: true,
  },
};
