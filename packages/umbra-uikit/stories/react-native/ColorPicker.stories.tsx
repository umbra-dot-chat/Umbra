import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ColorPicker, Text } from '@wisp-ui/react-native';

const meta: Meta<typeof ColorPicker> = {
  title: 'React Native/Primitives/ColorPicker',
  component: ColorPicker,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    disabled: { control: 'boolean' },
    showInput: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof ColorPicker>;

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    label: 'Pick a colour',
    size: 'md',
  },
};

// ---------------------------------------------------------------------------
// 2. With Presets
// ---------------------------------------------------------------------------

export const WithPresets: Story = {
  name: 'With Presets',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Default presets</div>
        <ColorPicker label="Theme colour" />
      </div>
      <div>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Custom presets</div>
        <ColorPicker
          label="Brand palette"
          presets={['#1E40AF', '#1D4ED8', '#2563EB', '#3B82F6', '#60A5FA', '#93C5FD']}
          defaultValue="#2563EB"
        />
      </div>
      <div>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>No presets, input only</div>
        <ColorPicker label="Custom hex" presets={[]} />
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. Controlled
// ---------------------------------------------------------------------------

export const Controlled: Story = {
  name: 'Controlled',
  render: () => {
    const ControlledExample = () => {
      const [color, setColor] = useState('#3B82F6');
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <ColorPicker label="Controlled colour" value={color} onChange={setColor} />
          <Text size="sm" color="secondary">Selected: {color}</Text>
        </div>
      );
    };
    return <ControlledExample />;
  },
};

// ---------------------------------------------------------------------------
// 4. Disabled
// ---------------------------------------------------------------------------

export const Disabled: Story = {
  name: 'Disabled',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Disabled</div>
        <ColorPicker label="Locked colour" defaultValue="#EF4444" disabled />
      </div>
      <div>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Without input</div>
        <ColorPicker label="Swatches only" defaultValue="#22C55E" showInput={false} />
      </div>
    </div>
  ),
};
