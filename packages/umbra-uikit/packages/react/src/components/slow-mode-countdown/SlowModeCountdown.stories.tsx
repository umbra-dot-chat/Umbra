/**
 * SlowModeCountdown — Stories showing all variants and sizes.
 *
 * @module stories/slow-mode-countdown
 */

import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { SlowModeCountdown } from './SlowModeCountdown';

const meta: Meta<typeof SlowModeCountdown> = {
  title: 'Components/Community/SlowModeCountdown',
  component: SlowModeCountdown,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SlowModeCountdown>;

// ---------------------------------------------------------------------------
// Default (Inline)
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    remaining: 30,
  },
};

// ---------------------------------------------------------------------------
// All Sizes — Inline
// ---------------------------------------------------------------------------

export const AllSizesInline: Story = {
  name: 'All Sizes — Inline',
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
      <SlowModeCountdown remaining={45} size="sm" />
      <SlowModeCountdown remaining={45} size="md" />
      <SlowModeCountdown remaining={45} size="lg" />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// Circular Variant
// ---------------------------------------------------------------------------

export const Circular: Story = {
  name: 'Circular',
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
      <SlowModeCountdown remaining={30} variant="circular" size="sm" />
      <SlowModeCountdown remaining={30} variant="circular" size="md" />
      <SlowModeCountdown remaining={30} variant="circular" size="lg" />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// Long Duration
// ---------------------------------------------------------------------------

export const LongDuration: Story = {
  name: 'Long Duration (2 min)',
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
      <SlowModeCountdown remaining={120} />
      <SlowModeCountdown remaining={120} variant="circular" size="lg" />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// Interactive (with reset)
// ---------------------------------------------------------------------------

export const Interactive: Story = {
  name: 'Interactive',
  render: () => {
    const Demo = () => {
      const [key, setKey] = useState(0);
      const [done, setDone] = useState(false);

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {!done ? (
            <SlowModeCountdown
              key={key}
              remaining={10}
              onComplete={() => setDone(true)}
            />
          ) : (
            <span style={{ color: '#a1a1aa', fontSize: 14 }}>Slow mode expired! You can send now.</span>
          )}
          <button
            onClick={() => {
              setDone(false);
              setKey((k) => k + 1);
            }}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              border: '1px solid #3f3f46',
              background: 'transparent',
              color: '#fafafa',
              cursor: 'pointer',
              fontSize: 13,
              width: 'fit-content',
            }}
          >
            Reset Timer
          </button>
        </div>
      );
    };
    return <Demo />;
  },
};
