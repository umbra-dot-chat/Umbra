import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ColorPicker } from './ColorPicker';
import { Text } from '../text';

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof ColorPicker> = {
  title: 'Primitives/ColorPicker',
  component: ColorPicker,
  tags: ['autodocs'],
  args: {
    size: 'md',
    disabled: false,
    skeleton: false,
    showInput: true,
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    disabled: { control: 'boolean' },
    skeleton: { control: 'boolean' },
    showInput: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof ColorPicker>;

// ---------------------------------------------------------------------------
// 1. Default / Playground
// ---------------------------------------------------------------------------

export const Default: Story = {
  name: 'Default',
  render: (args) => <ColorPicker {...args} />,
};

// ---------------------------------------------------------------------------
// 2. WithPresets (controlled, showing default presets)
// ---------------------------------------------------------------------------

export const WithPresets: Story = {
  name: 'WithPresets',
  render: () => {
    const Controlled = () => {
      const [color, setColor] = useState('#3B82F6');
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <ColorPicker value={color} onChange={setColor} />
          <Text size="xs" color="tertiary">
            Selected: {color}
          </Text>
        </div>
      );
    };
    return <Controlled />;
  },
};

// ---------------------------------------------------------------------------
// 3. CustomPresets
// ---------------------------------------------------------------------------

export const CustomPresets: Story = {
  name: 'CustomPresets',
  render: () => {
    const brandPresets = [
      '#1E40AF',
      '#1D4ED8',
      '#2563EB',
      '#3B82F6',
      '#60A5FA',
      '#93C5FD',
      '#DBEAFE',
    ];

    const Controlled = () => {
      const [color, setColor] = useState('#2563EB');
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <ColorPicker
            label="Brand colour"
            value={color}
            onChange={setColor}
            presets={brandPresets}
          />
          <Text size="xs" color="tertiary">
            Selected: {color}
          </Text>
        </div>
      );
    };
    return <Controlled />;
  },
};

// ---------------------------------------------------------------------------
// 4. WithLabel
// ---------------------------------------------------------------------------

export const WithLabel: Story = {
  name: 'WithLabel',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <ColorPicker label="Background" defaultValue="#3B82F6" />
      <ColorPicker label="Text colour" defaultValue="#000000" />
      <ColorPicker label="Border" defaultValue="#6B7280" size="sm" />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 5. AllSizes
// ---------------------------------------------------------------------------

export const AllSizes: Story = {
  name: 'AllSizes',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <div key={size} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <Text
            size="xs"
            color="tertiary"
            weight="medium"
            style={{ width: 32, flexShrink: 0, textAlign: 'right', paddingTop: 4 }}
          >
            {size}
          </Text>
          <ColorPicker size={size} defaultValue="#8B5CF6" />
        </div>
      ))}
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 6. Disabled
// ---------------------------------------------------------------------------

export const Disabled: Story = {
  name: 'Disabled',
  render: () => (
    <ColorPicker
      label="Disabled picker"
      defaultValue="#EF4444"
      disabled
    />
  ),
};

// ---------------------------------------------------------------------------
// 7. WithoutInput
// ---------------------------------------------------------------------------

export const WithoutInput: Story = {
  name: 'WithoutInput',
  render: () => {
    const Controlled = () => {
      const [color, setColor] = useState('#22C55E');
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <ColorPicker
            label="No hex input"
            value={color}
            onChange={setColor}
            showInput={false}
          />
          <Text size="xs" color="tertiary">
            Selected: {color}
          </Text>
        </div>
      );
    };
    return <Controlled />;
  },
};

// ---------------------------------------------------------------------------
// 8. Skeleton
// ---------------------------------------------------------------------------

export const Skeleton: Story = {
  name: 'Skeleton',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <ColorPicker key={size} skeleton size={size} />
      ))}
    </div>
  ),
};
