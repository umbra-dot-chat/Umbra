import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Rating, Text } from '@wisp-ui/react-native';

const meta: Meta<typeof Rating> = {
  title: 'React Native/Primitives/Rating',
  component: Rating,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    readOnly: { control: 'boolean' },
    disabled: { control: 'boolean' },
    showValue: { control: 'boolean' },
    max: { control: 'number' },
  },
};

export default meta;
type Story = StoryObj<typeof Rating>;

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    defaultValue: 3,
    size: 'md',
  },
};

// ---------------------------------------------------------------------------
// 2. Values
// ---------------------------------------------------------------------------

export const Values: Story = {
  name: 'Values',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Preset values</div>
      {[0, 1, 2, 3, 4, 5].map((v) => (
        <div key={v} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 20, fontSize: 12, color: '#94A0B8', textAlign: 'right' }}>{v}</div>
          <Rating value={v} readOnly />
        </div>
      ))}
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginTop: 8 }}>Half values</div>
      {[0.5, 1.5, 2.5, 3.5, 4.5].map((v) => (
        <div key={v} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 28, fontSize: 12, color: '#94A0B8', textAlign: 'right' }}>{v}</div>
          <Rating value={v} readOnly allowHalf showValue />
        </div>
      ))}
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. Read Only
// ---------------------------------------------------------------------------

export const ReadOnly: Story = {
  name: 'Read Only',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Read-only ratings</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Rating value={4} readOnly showValue />
        <Text size="sm" color="secondary">Product rating</Text>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Rating value={3.5} readOnly allowHalf showValue />
        <Text size="sm" color="secondary">Average review</Text>
      </div>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginTop: 8 }}>Disabled</div>
      <Rating value={2} disabled showValue />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 4. Sizes
// ---------------------------------------------------------------------------

export const Sizes: Story = {
  name: 'Sizes',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <div key={size} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 24, fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>{size}</div>
          <Rating defaultValue={3} size={size} showValue />
        </div>
      ))}
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 5. Interactive
// ---------------------------------------------------------------------------

export const Interactive: Story = {
  name: 'Interactive',
  render: () => {
    const ControlledRating = () => {
      const [value, setValue] = useState(0);
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Click to rate</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Rating value={value} onChange={setValue} size="lg" showValue />
            <Text size="sm" color="secondary">
              {value === 0 ? 'No rating' : `${value} / 5`}
            </Text>
          </div>
        </div>
      );
    };
    return <ControlledRating />;
  },
};
