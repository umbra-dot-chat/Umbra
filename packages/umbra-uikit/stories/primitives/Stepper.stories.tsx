import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Stepper } from '@wisp-ui/react';
import { Text } from '@wisp-ui/react';

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof Stepper> = {
  title: 'React/Primitives/Stepper',
  component: Stepper,
  tags: ['autodocs'],
  args: {
    size: 'md',
    disabled: false,
    readOnly: false,
    skeleton: false,
    step: 1,
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    disabled: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    skeleton: { control: 'boolean' },
    step: { control: 'number' },
    min: { control: 'number' },
    max: { control: 'number' },
  },
};

export default meta;
type Story = StoryObj<typeof Stepper>;

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
    <Text
      size="xs"
      color="tertiary"
      weight="medium"
      style={{ width: 100, flexShrink: 0, textAlign: 'right' }}
    >
      {label}
    </Text>
    {children}
  </div>
);

// ---------------------------------------------------------------------------
// 1. Default / Playground
// ---------------------------------------------------------------------------

export const Default: Story = {
  name: 'Default',
  render: (args) => <Stepper {...args} defaultValue={5} />,
};

// ---------------------------------------------------------------------------
// 2. With Min/Max
// ---------------------------------------------------------------------------

export const WithMinMax: Story = {
  name: 'With Min/Max',
  render: () => {
    const Demo = () => {
      const [val, setVal] = useState(5);
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 320 }}>
          <Stepper
            value={val}
            onChange={setVal}
            min={0}
            max={10}
          />
          <Text size="sm" color="secondary">
            Clamped (0-10) -- Current value: {val}
          </Text>
        </div>
      );
    };
    return <Demo />;
  },
};

// ---------------------------------------------------------------------------
// 3. Custom Step
// ---------------------------------------------------------------------------

export const CustomStep: Story = {
  name: 'Custom Step',
  render: () => {
    const Demo = () => {
      const [val, setVal] = useState(0);
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 320 }}>
          <Stepper
            value={val}
            onChange={setVal}
            step={5}
            min={0}
            max={100}
          />
          <Text size="sm" color="secondary">
            Step 5 (0-100) -- Current value: {val}
          </Text>
        </div>
      );
    };
    return <Demo />;
  },
};

// ---------------------------------------------------------------------------
// 4. All Sizes
// ---------------------------------------------------------------------------

export const AllSizes: Story = {
  name: 'All Sizes',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <Row key={size} label={size}>
          <Stepper size={size} defaultValue={10} />
        </Row>
      ))}
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 5. Disabled
// ---------------------------------------------------------------------------

export const Disabled: Story = {
  name: 'Disabled',
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <Stepper disabled defaultValue={42} />
      <Stepper disabled defaultValue={0} size="lg" />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 6. Controlled
// ---------------------------------------------------------------------------

export const Controlled: Story = {
  name: 'Controlled',
  render: () => {
    const ControlledDemo = () => {
      const [count, setCount] = useState(0);
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Stepper
            value={count}
            onChange={setCount}
            min={-10}
            max={10}
            size="lg"
          />
          <Text size="sm" color="secondary">
            Value: {count}
          </Text>
        </div>
      );
    };
    return <ControlledDemo />;
  },
};

// ---------------------------------------------------------------------------
// 7. ReadOnly
// ---------------------------------------------------------------------------

export const ReadOnly: Story = {
  name: 'ReadOnly',
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <Stepper readOnly defaultValue={7} />
      <Stepper readOnly defaultValue={25} size="lg" />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 8. Skeleton
// ---------------------------------------------------------------------------

export const Skeleton: Story = {
  name: 'Skeleton',
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <Stepper key={size} skeleton size={size} />
      ))}
    </div>
  ),
};
