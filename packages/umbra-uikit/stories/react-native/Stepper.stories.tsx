import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Stepper, Text } from '@wisp-ui/react-native';

const meta: Meta<typeof Stepper> = {
  title: 'React Native/Primitives/Stepper',
  component: Stepper,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    disabled: { control: 'boolean' },
    readOnly: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Stepper>;

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    defaultValue: 0,
    step: 1,
    size: 'md',
  },
};

// ---------------------------------------------------------------------------
// 2. With Min / Max
// ---------------------------------------------------------------------------

export const WithMinMax: Story = {
  name: 'With Min / Max',
  render: () => {
    const MinMaxExample = () => {
      const [value, setValue] = useState(5);
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Clamped 0 to 10</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Stepper value={value} onChange={setValue} min={0} max={10} />
              <Text size="sm" color="secondary">Value: {value}</Text>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Step 0.5, range -2 to 2</div>
            <Stepper defaultValue={0} min={-2} max={2} step={0.5} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Step 10, range 0 to 100</div>
            <Stepper defaultValue={50} min={0} max={100} step={10} />
          </div>
        </div>
      );
    };
    return <MinMaxExample />;
  },
};

// ---------------------------------------------------------------------------
// 3. Disabled
// ---------------------------------------------------------------------------

export const Disabled: Story = {
  name: 'Disabled',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Disabled</div>
        <Stepper defaultValue={3} disabled />
      </div>
      <div>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Read-only</div>
        <Stepper defaultValue={7} readOnly />
      </div>
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
        <div key={size}>
          <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{size}</div>
          <Stepper size={size} defaultValue={0} min={0} max={99} />
        </div>
      ))}
    </div>
  ),
};
