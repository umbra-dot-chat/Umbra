import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Slider } from '@wisp-ui/react-native';
import { componentSizes } from '@wisp-ui/react';

const meta: Meta<typeof Slider> = {
  title: 'React Native/Primitives/Slider',
  component: Slider,
  tags: ['autodocs'],
  argTypes: {
    value: { control: 'number' },
    min: { control: 'number' },
    max: { control: 'number' },
    step: { control: 'number' },
    size: { control: 'select', options: [...componentSizes] },
    disabled: { control: 'boolean' },
    label: { control: 'text' },
    showValue: { control: 'boolean' },
    thickness: { control: 'select', options: ['thin', 'regular', 'medium', 'thick', 'heavy'] },
  },
};

export default meta;
type Story = StoryObj<typeof Slider>;

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    defaultValue: 50,
    min: 0,
    max: 100,
    step: 1,
    size: 'md',
    label: 'Volume',
    showValue: true,
  },
};

// ---------------------------------------------------------------------------
// 2. Custom Range
// ---------------------------------------------------------------------------

export const CustomRange: Story = {
  name: 'Custom Range',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 400 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>0 – 100 (default)</div>
      <Slider defaultValue={30} label="Brightness" showValue />

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Custom Range (0 – 1000, step 50)</div>
      <Slider
        defaultValue={500}
        min={0}
        max={1000}
        step={50}
        label="Price"
        showValue
        formatValue={(v) => `$${v}`}
      />

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Negative Range (-50 – 50)</div>
      <Slider
        defaultValue={0}
        min={-50}
        max={50}
        step={5}
        label="Temperature Offset"
        showValue
        formatValue={(v) => `${v > 0 ? '+' : ''}${v}°`}
      />

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Fractional Step (0 – 1, step 0.1)</div>
      <Slider
        defaultValue={0.5}
        min={0}
        max={1}
        step={0.1}
        label="Opacity"
        showValue
        formatValue={(v) => `${Math.round(v * 100)}%`}
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. Disabled
// ---------------------------------------------------------------------------

export const Disabled: Story = {
  name: 'Disabled',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 400 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Enabled</div>
      <Slider defaultValue={60} label="Enabled Slider" showValue />

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Disabled</div>
      <Slider defaultValue={60} label="Disabled Slider" showValue disabled />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 4. Sizes
// ---------------------------------------------------------------------------

export const Sizes: Story = {
  name: 'Sizes',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 400 }}>
      {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
        <div key={size}>
          <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            {size.toUpperCase()}
          </div>
          <Slider defaultValue={50} size={size} label={`Size ${size}`} showValue />
        </div>
      ))}
    </div>
  ),
};
