import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { CircularProgress } from '@wisp-ui/react-native';

const meta: Meta<typeof CircularProgress> = {
  title: 'React Native/Primitives/CircularProgress',
  component: CircularProgress,
  tags: ['autodocs'],
  argTypes: {
    value: { control: { type: 'range', min: 0, max: 100, step: 1 } },
    max: { control: 'number' },
    size: { control: 'select', options: ['sm', 'md', 'lg', 'xl'] },
    color: { control: 'select', options: ['default', 'success', 'warning', 'danger', 'info'] },
    showValue: { control: 'boolean' },
    indeterminate: { control: 'boolean' },
    label: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof CircularProgress>;

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    value: 65,
    size: 'md',
    color: 'default',
    showValue: true,
  },
};

// ---------------------------------------------------------------------------
// 2. Values
// ---------------------------------------------------------------------------

export const Values: Story = {
  name: 'Values',
  render: () => (
    <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
      <CircularProgress value={0} showValue label="0%" />
      <CircularProgress value={25} showValue label="25%" />
      <CircularProgress value={50} showValue label="50%" />
      <CircularProgress value={75} showValue label="75%" />
      <CircularProgress value={100} showValue label="100%" />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. Sizes
// ---------------------------------------------------------------------------

export const Sizes: Story = {
  name: 'Sizes',
  render: () => (
    <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>SM</div>
        <CircularProgress value={65} size="sm" showValue />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>MD</div>
        <CircularProgress value={65} size="md" showValue />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>LG</div>
        <CircularProgress value={65} size="lg" showValue />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>XL</div>
        <CircularProgress value={65} size="xl" showValue />
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 4. Colors
// ---------------------------------------------------------------------------

export const Colors: Story = {
  name: 'Colors',
  render: () => (
    <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Default</div>
        <CircularProgress value={70} color="default" size="lg" showValue />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Success</div>
        <CircularProgress value={70} color="success" size="lg" showValue />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Warning</div>
        <CircularProgress value={70} color="warning" size="lg" showValue />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Danger</div>
        <CircularProgress value={70} color="danger" size="lg" showValue />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Info</div>
        <CircularProgress value={70} color="info" size="lg" showValue />
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 5. Indeterminate
// ---------------------------------------------------------------------------

export const Indeterminate: Story = {
  name: 'Indeterminate',
  render: () => (
    <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
      <CircularProgress indeterminate size="sm" />
      <CircularProgress indeterminate size="md" />
      <CircularProgress indeterminate size="lg" color="info" />
      <CircularProgress indeterminate size="xl" color="success" />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 6. With Label
// ---------------------------------------------------------------------------

export const WithLabel: Story = {
  name: 'With Label',
  render: () => (
    <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      <CircularProgress value={42} size="lg" showValue label="Storage" color="info" />
      <CircularProgress value={87} size="lg" showValue label="CPU Usage" color="warning" />
      <CircularProgress value={100} size="lg" showValue label="Complete" color="success" />
      <CircularProgress indeterminate size="lg" label="Loading..." />
    </div>
  ),
};
