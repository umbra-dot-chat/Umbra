import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { NumberInput } from './NumberInput';
import { Text } from '../text';
import { Button } from '../button';

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof NumberInput> = {
  title: 'Primitives/NumberInput',
  component: NumberInput,
  tags: ['autodocs'],
  args: {
    size: 'md',
    disabled: false,
    error: false,
    fullWidth: false,
    step: 1,
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    disabled: { control: 'boolean' },
    error: { control: 'boolean' },
    fullWidth: { control: 'boolean' },
    step: { control: 'number' },
    min: { control: 'number' },
    max: { control: 'number' },
  },
};

export default meta;
type Story = StoryObj<typeof NumberInput>;

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
    <Text
      size="xs"
      color="tertiary"
      weight="medium"
      style={{ width: 100, flexShrink: 0, textAlign: 'right', paddingTop: 8 }}
    >
      {label}
    </Text>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {children}
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// 1. Default / Playground
// ---------------------------------------------------------------------------

export const Default: Story = {
  name: 'Default',
  render: (args) => <NumberInput {...args} defaultValue={5} />,
};

// ---------------------------------------------------------------------------
// 2. Sizes
// ---------------------------------------------------------------------------

export const Sizes: Story = {
  name: 'Sizes',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <Row key={size} label={size}>
          <NumberInput size={size} defaultValue={10} />
        </Row>
      ))}
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. With Min/Max
// ---------------------------------------------------------------------------

export const WithMinMax: Story = {
  name: 'With Min/Max',
  render: () => {
    const Demo = () => {
      const [val, setVal] = useState(5);
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 320 }}>
          <NumberInput
            value={val}
            onChange={setVal}
            min={0}
            max={10}
            label="Clamped (0-10)"
            hint="Value is clamped between 0 and 10."
          />
          <Text size="sm" color="secondary">
            Current value: {val}
          </Text>
        </div>
      );
    };
    return <Demo />;
  },
};

// ---------------------------------------------------------------------------
// 4. With Step
// ---------------------------------------------------------------------------

export const WithStep: Story = {
  name: 'With Step',
  render: () => {
    const Demo = () => {
      const [val, setVal] = useState(1.0);
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 320 }}>
          <NumberInput
            value={val}
            onChange={setVal}
            step={0.5}
            min={0}
            max={5}
            label="Step 0.5"
            hint="Increments by 0.5 each click."
          />
          <Text size="sm" color="secondary">
            Current value: {val}
          </Text>
        </div>
      );
    };
    return <Demo />;
  },
};

// ---------------------------------------------------------------------------
// 5. Disabled
// ---------------------------------------------------------------------------

export const Disabled: Story = {
  name: 'Disabled',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 320 }}>
      <NumberInput
        label="Disabled"
        defaultValue={42}
        disabled
      />
      <NumberInput
        defaultValue={0}
        disabled
        placeholder="No value"
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 6. Error
// ---------------------------------------------------------------------------

export const Error: Story = {
  name: 'Error',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 320 }}>
      <NumberInput
        label="Quantity"
        defaultValue={-1}
        error
        hint="Value must be 0 or greater."
      />
      <NumberInput
        defaultValue={999}
        error
        size="lg"
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 7. With Label
// ---------------------------------------------------------------------------

export const WithLabel: Story = {
  name: 'With Label',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 320 }}>
      <NumberInput label="Quantity" defaultValue={1} min={1} />
      <NumberInput label="Priority" defaultValue={3} min={1} max={5} hint="From 1 (low) to 5 (high)." />
      <NumberInput label="Seats" defaultValue={2} size="sm" />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 8. Full Width
// ---------------------------------------------------------------------------

export const FullWidth: Story = {
  name: 'Full Width',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 500 }}>
      <NumberInput fullWidth defaultValue={10} />
      <NumberInput fullWidth label="Amount" defaultValue={100} step={10} hint="Full width with label and hint." />
      <NumberInput fullWidth defaultValue={0} size="lg" placeholder="Large full width" />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 9. Composition — Quantity Selector
// ---------------------------------------------------------------------------

export const Composition: Story = {
  name: 'Composition',
  render: () => {
    const QuantitySelector = () => {
      const [qty, setQty] = useState(1);
      const unitPrice = 24.99;
      const total = (qty * unitPrice).toFixed(2);

      return (
        <div style={{ maxWidth: 360 }}>
          <Text size="lg" weight="semibold" style={{ marginBottom: 4 }}>
            Add to cart
          </Text>
          <Text size="sm" color="secondary" style={{ marginBottom: 16 }}>
            Premium Widget — ${unitPrice} each
          </Text>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <NumberInput
              fullWidth
              value={qty}
              onChange={setQty}
              min={1}
              max={99}
              label="Quantity"
              hint={`Total: $${total}`}
            />

            <Button
              fullWidth
              variant="primary"
              size="lg"
            >
              Add {qty} to Cart — ${total}
            </Button>
          </div>
        </div>
      );
    };

    return <QuantitySelector />;
  },
};
