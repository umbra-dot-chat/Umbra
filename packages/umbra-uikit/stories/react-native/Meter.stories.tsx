import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Meter } from '@wisp-ui/react-native';

const meta: Meta<typeof Meter> = {
  title: 'React Native/Primitives/Meter',
  component: Meter,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    variant: { control: 'select', options: ['default', 'gradient', 'segments'] },
    disabled: { control: 'boolean' },
    showValue: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Meter>;

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    value: 60,
    size: 'md',
  },
};

// ---------------------------------------------------------------------------
// 2. Values
// ---------------------------------------------------------------------------

export const Values: Story = {
  name: 'Values',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 360 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Default variant</div>
      {[0, 25, 50, 75, 100].map((v) => (
        <div key={v} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, fontSize: 12, color: '#94A0B8', textAlign: 'right' }}>{v}%</div>
          <div style={{ flex: 1 }}>
            <Meter value={v} />
          </div>
        </div>
      ))}
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginTop: 8 }}>Segments variant</div>
      {[10, 40, 60, 90].map((v) => (
        <div key={v} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, fontSize: 12, color: '#94A0B8', textAlign: 'right' }}>{v}%</div>
          <div style={{ flex: 1 }}>
            <Meter value={v} variant="segments" low={25} high={75} optimum={50} />
          </div>
        </div>
      ))}
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. Sizes
// ---------------------------------------------------------------------------

export const Sizes: Story = {
  name: 'Sizes',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 360 }}>
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <div key={size}>
          <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{size}</div>
          <Meter value={65} size={size} />
        </div>
      ))}
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 4. With Label
// ---------------------------------------------------------------------------

export const WithLabel: Story = {
  name: 'With Label',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 360 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Label and value</div>
      <Meter value={72} label="Disk usage" showValue />
      <Meter value={45} label="Memory" showValue size="lg" />
      <Meter value={90} label="Battery" showValue variant="segments" low={20} high={80} optimum={100} />
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }}>Disabled</div>
      <Meter value={50} label="CPU" showValue disabled />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 5. Variants
// ---------------------------------------------------------------------------

export const Variants: Story = {
  name: 'Variants',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 360 }}>
      <div>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Default</div>
        <Meter value={60} variant="default" showValue />
      </div>
      <div>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Gradient</div>
        <Meter value={60} variant="gradient" showValue />
      </div>
      <div>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Segments</div>
        <Meter value={60} variant="segments" low={25} high={75} optimum={50} showValue />
      </div>
    </div>
  ),
};
