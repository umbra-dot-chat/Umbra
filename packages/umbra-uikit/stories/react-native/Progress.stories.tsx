import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Progress } from '@wisp-ui/react-native';

const meta: Meta<typeof Progress> = {
  title: 'React Native/Primitives/Progress',
  component: Progress,
  tags: ['autodocs'],
  argTypes: {
    value: { control: { type: 'range', min: 0, max: 100 } },
    max: { control: 'number' },
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
    color: { control: 'select', options: ['default', 'success', 'warning', 'danger', 'info'] },
    thickness: { control: 'select', options: ['thin', 'regular', 'medium', 'thick', 'heavy'] },
    label: { control: 'text' },
    showValue: { control: 'boolean' },
    indeterminate: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Progress>;

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    value: 60,
    size: 'md',
    color: 'default',
  },
  decorators: [
    (Story) => (
      <div style={{ width: 320 }}>
        <Story />
      </div>
    ),
  ],
};

// ---------------------------------------------------------------------------
// 2. Values
// ---------------------------------------------------------------------------

export const Values: Story = {
  name: 'Values',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: 360 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Determinate</div>
      <Progress value={0} label="Empty" showValue />
      <Progress value={25} label="Quarter" showValue />
      <Progress value={50} label="Half" showValue />
      <Progress value={75} label="Three-quarters" showValue />
      <Progress value={100} label="Complete" showValue color="success" />

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginTop: 8 }}>Indeterminate</div>
      <Progress indeterminate label="Loading..." />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. Sizes
// ---------------------------------------------------------------------------

export const Sizes: Story = {
  name: 'Sizes',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: 360 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Component Sizes</div>
      {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
        <div key={size} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 11, color: '#94A0B8' }}>{size}</span>
          <Progress value={65} size={size} />
        </div>
      ))}

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginTop: 8 }}>Thickness Override</div>
      {(['thin', 'regular', 'medium', 'thick', 'heavy'] as const).map((t) => (
        <div key={t} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 11, color: '#94A0B8' }}>{t}</span>
          <Progress value={65} thickness={t} />
        </div>
      ))}
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 4. Variants (color)
// ---------------------------------------------------------------------------

export const Variants: Story = {
  name: 'Variants',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: 360 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Color Variants</div>
      {(['default', 'success', 'warning', 'danger', 'info'] as const).map((color) => (
        <Progress key={color} value={70} color={color} label={color} showValue />
      ))}

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginTop: 8 }}>Custom Formatter</div>
      <Progress
        value={3}
        max={5}
        label="Steps"
        showValue
        formatValue={(v, m) => `${v} / ${m}`}
      />
      <Progress
        value={750}
        max={1000}
        label="Storage"
        showValue
        formatValue={(v, m) => `${v} MB / ${m} MB`}
      />
    </div>
  ),
};
