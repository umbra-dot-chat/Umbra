/**
 * Indicator — Status dot stories showing all variants, states, and sizes.
 *
 * @module stories/indicator
 */

import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Indicator } from './Indicator';

const meta: Meta<typeof Indicator> = {
  title: 'Primitives/Indicator',
  component: Indicator,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['neutral', 'success', 'warning', 'danger', 'info'],
    },
    state: {
      control: 'select',
      options: ['idle', 'active', 'inactive'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Indicator>;

// ---------------------------------------------------------------------------
// Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    variant: 'success',
    state: 'idle',
    size: 'sm',
  },
};

// ---------------------------------------------------------------------------
// All Variants
// ---------------------------------------------------------------------------

export const AllVariants: Story = {
  name: 'All Variants',
  render: () => (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Indicator variant="neutral" size="md" />
        <span>Neutral</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Indicator variant="success" size="md" />
        <span>Success</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Indicator variant="warning" size="md" />
        <span>Warning</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Indicator variant="danger" size="md" />
        <span>Danger</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Indicator variant="info" size="md" />
        <span>Info</span>
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// All States
// ---------------------------------------------------------------------------

export const AllStates: Story = {
  name: 'All States',
  render: () => (
    <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Indicator variant="success" state="idle" size="md" />
        <span>Idle</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Indicator variant="success" state="active" size="md" />
        <span>Active (pulsing)</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Indicator variant="success" state="inactive" size="md" />
        <span>Inactive (hollow)</span>
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
        <Indicator variant="info" size="sm" />
        <span>sm (8px)</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Indicator variant="info" size="md" />
        <span>md (12px)</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Indicator variant="info" size="lg" />
        <span>lg (16px)</span>
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// Full Matrix
// ---------------------------------------------------------------------------

export const FullMatrix: Story = {
  name: 'Full Matrix',
  render: () => {
    const variants = ['neutral', 'success', 'warning', 'danger', 'info'] as const;
    const states = ['idle', 'active', 'inactive'] as const;
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'auto repeat(3, 1fr)', gap: '12px 24px', alignItems: 'center' }}>
        <div />
        <span style={{ fontWeight: 600 }}>Idle</span>
        <span style={{ fontWeight: 600 }}>Active</span>
        <span style={{ fontWeight: 600 }}>Inactive</span>
        {variants.map((v) => (
          <React.Fragment key={v}>
            <span style={{ textTransform: 'capitalize', fontWeight: 500 }}>{v}</span>
            {states.map((s) => (
              <Indicator key={`${v}-${s}`} variant={v} state={s} size="md" />
            ))}
          </React.Fragment>
        ))}
      </div>
    );
  },
};

// ---------------------------------------------------------------------------
// With Label
// ---------------------------------------------------------------------------

export const WithLabel: Story = {
  name: 'With Label',
  render: () => (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <Indicator variant="success" state="active" size="md" label="Online" />
      <Indicator variant="danger" state="idle" size="md" label="Error" />
      <Indicator variant="neutral" state="inactive" size="md" label="Offline" />
    </div>
  ),
};
