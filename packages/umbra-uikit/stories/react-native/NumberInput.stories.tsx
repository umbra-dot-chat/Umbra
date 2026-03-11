import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { NumberInput } from '@wisp-ui/react-native';

const meta: Meta<typeof NumberInput> = {
  title: 'React Native/Primitives/NumberInput',
  component: NumberInput,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
    disabled: { control: 'boolean' },
    fullWidth: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof NumberInput>;

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    defaultValue: 0,
    size: 'md',
    label: 'Quantity',
  },
};

// ---------------------------------------------------------------------------
// 2. With Min/Max
// ---------------------------------------------------------------------------

export const WithMinMax: Story = {
  name: 'With Min/Max',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 280 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Range 0 - 10</div>
      <NumberInput defaultValue={5} min={0} max={10} label="Rating" hint="Choose between 0 and 10" />
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Step 0.5, range 0 - 5</div>
      <NumberInput defaultValue={2.5} min={0} max={5} step={0.5} label="Score" hint="Increments of 0.5" />
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>At minimum bound</div>
      <NumberInput defaultValue={0} min={0} max={100} label="Floor reached" />
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>At maximum bound</div>
      <NumberInput defaultValue={100} min={0} max={100} label="Ceiling reached" />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. Disabled
// ---------------------------------------------------------------------------

export const Disabled: Story = {
  name: 'Disabled',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 280 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Disabled at default</div>
      <NumberInput defaultValue={3} disabled label="Locked Value" />
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Disabled with error</div>
      <NumberInput defaultValue={0} disabled error="Value is required" label="Quantity" />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 4. Sizes
// ---------------------------------------------------------------------------

export const Sizes: Story = {
  name: 'Sizes',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 280 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Extra small</div>
      <NumberInput size="xs" defaultValue={1} />
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Small</div>
      <NumberInput size="sm" defaultValue={2} />
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Medium</div>
      <NumberInput size="md" defaultValue={3} />
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Large</div>
      <NumberInput size="lg" defaultValue={4} />
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Extra large</div>
      <NumberInput size="xl" defaultValue={5} />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 5. Error State
// ---------------------------------------------------------------------------

export const ErrorState: Story = {
  name: 'Error',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 280 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Error with message</div>
      <NumberInput defaultValue={0} label="Quantity" error="Quantity must be at least 1" />
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Error boolean</div>
      <NumberInput defaultValue={0} label="Amount" error={true} />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 6. Full Width
// ---------------------------------------------------------------------------

export const FullWidth: Story = {
  name: 'Full Width',
  render: () => (
    <div style={{ width: 400 }}>
      <NumberInput
        fullWidth
        defaultValue={1}
        min={1}
        max={99}
        label="Items"
        hint="Select the number of items."
      />
    </div>
  ),
};
