import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Toggle } from '@wisp-ui/react-native';
import { Text } from '@wisp-ui/react-native';

const meta: Meta<typeof Toggle> = {
  title: 'React Native/Primitives/Toggle',
  component: Toggle,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
    slim: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Toggle>;

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    size: 'md',
    label: 'Toggle',
  },
};

// ---------------------------------------------------------------------------
// 2. Sizes
// ---------------------------------------------------------------------------

export const Sizes: Story = {
  name: 'Sizes',
  render: () => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
        <div key={size} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <Toggle size={size} defaultChecked label={size} />
          <span style={{ fontSize: 10, color: '#94A0B8' }}>{size}</span>
        </div>
      ))}
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. Slim Variant
// ---------------------------------------------------------------------------

export const Slim: Story = {
  name: 'Slim',
  render: () => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
        <div key={size} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <Toggle size={size} slim defaultChecked label={`${size} slim`} />
          <span style={{ fontSize: 10, color: '#94A0B8' }}>{size}</span>
        </div>
      ))}
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 4. Disabled
// ---------------------------------------------------------------------------

export const Disabled: Story = {
  name: 'Disabled',
  render: () => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <Toggle disabled label="Disabled off" />
      <Toggle disabled defaultChecked label="Disabled on" />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 5. Custom Colors
// ---------------------------------------------------------------------------

export const CustomColors: Story = {
  name: 'Custom Colors',
  render: () => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <Toggle checkedColor="#22c55e" defaultChecked label="Green" />
      <Toggle checkedColor="#3b82f6" defaultChecked label="Blue" />
      <Toggle checkedColor="#f59e0b" defaultChecked label="Amber" />
      <Toggle checkedColor="#ef4444" defaultChecked label="Red" />
      <Toggle checkedColor="#8b5cf6" defaultChecked label="Purple" />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 6. Controlled
// ---------------------------------------------------------------------------

export const Controlled: Story = {
  name: 'Controlled',
  render: () => {
    const ControlledToggle = () => {
      const [checked, setChecked] = useState(false);
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Toggle checked={checked} onChange={setChecked} label="Controlled toggle" />
          <Text size="sm" color="secondary">{checked ? 'ON' : 'OFF'}</Text>
        </div>
      );
    };
    return <ControlledToggle />;
  },
};

// ---------------------------------------------------------------------------
// 7. Standard vs Slim Comparison
// ---------------------------------------------------------------------------

export const Comparison: Story = {
  name: 'Standard vs Slim',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Standard</div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Toggle size="sm" defaultChecked />
          <Toggle size="md" defaultChecked />
          <Toggle size="lg" defaultChecked />
        </div>
      </div>
      <div>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Slim</div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Toggle size="sm" slim defaultChecked />
          <Toggle size="md" slim defaultChecked />
          <Toggle size="lg" slim defaultChecked />
        </div>
      </div>
    </div>
  ),
};
