import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { PingMeter } from '@wisp-ui/react-native';

const meta: Meta<typeof PingMeter> = {
  title: 'React Native/Components/Utilities/PingMeter',
  component: PingMeter,
  tags: ['autodocs'],
  argTypes: {
    latency: { control: { type: 'number', min: 0, max: 500 } },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    variant: { control: 'select', options: ['dot', 'bars', 'full'] },
    showLatency: { control: 'boolean' },
    showBars: { control: 'boolean' },
    showDot: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof PingMeter>;

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    latency: 42,
    size: 'md',
    variant: 'full',
  },
};

// ---------------------------------------------------------------------------
// 2. Values
// ---------------------------------------------------------------------------

export const Values: Story = {
  name: 'Values',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Excellent (under 50ms)</div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <PingMeter latency={12} />
        <PingMeter latency={35} />
        <PingMeter latency={48} />
      </div>

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Good (50-99ms)</div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <PingMeter latency={55} />
        <PingMeter latency={72} />
        <PingMeter latency={95} />
      </div>

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Fair (100-199ms)</div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <PingMeter latency={110} />
        <PingMeter latency={150} />
        <PingMeter latency={190} />
      </div>

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Poor (200ms+)</div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <PingMeter latency={220} />
        <PingMeter latency={350} />
        <PingMeter latency={500} />
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. Sizes
// ---------------------------------------------------------------------------

export const Sizes: Story = {
  name: 'Sizes',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Small</div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <PingMeter latency={25} size="sm" />
        <PingMeter latency={80} size="sm" />
        <PingMeter latency={250} size="sm" />
      </div>

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Medium</div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <PingMeter latency={25} size="md" />
        <PingMeter latency={80} size="md" />
        <PingMeter latency={250} size="md" />
      </div>

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Large</div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <PingMeter latency={25} size="lg" />
        <PingMeter latency={80} size="lg" />
        <PingMeter latency={250} size="lg" />
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 4. Variants
// ---------------------------------------------------------------------------

export const Variants: Story = {
  name: 'Variants',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Full (dot + bars + latency)</div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <PingMeter latency={30} variant="full" />
        <PingMeter latency={120} variant="full" />
        <PingMeter latency={300} variant="full" />
      </div>

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Bars Only</div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <PingMeter latency={30} variant="bars" />
        <PingMeter latency={120} variant="bars" />
        <PingMeter latency={300} variant="bars" />
      </div>

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Dot Only</div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <PingMeter latency={30} variant="dot" />
        <PingMeter latency={120} variant="dot" />
        <PingMeter latency={300} variant="dot" />
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 5. Display Options
// ---------------------------------------------------------------------------

export const DisplayOptions: Story = {
  name: 'Display Options',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Without Latency Text</div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <PingMeter latency={30} showLatency={false} />
        <PingMeter latency={150} showLatency={false} />
      </div>

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Without Dot</div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <PingMeter latency={30} showDot={false} />
        <PingMeter latency={150} showDot={false} />
      </div>

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Without Bars</div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <PingMeter latency={30} showBars={false} />
        <PingMeter latency={150} showBars={false} />
      </div>
    </div>
  ),
};
