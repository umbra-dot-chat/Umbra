import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Select, Text } from '@wisp-ui/react-native';

const fruitOptions = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
  { value: 'dragonfruit', label: 'Dragonfruit' },
  { value: 'elderberry', label: 'Elderberry' },
];

const meta: Meta<typeof Select> = {
  title: 'React Native/Components/Data Entry/Select',
  component: Select,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    disabled: { control: 'boolean' },
    fullWidth: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Select>;

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    options: fruitOptions,
    label: 'Fruit',
    defaultValue: 'apple',
  },
};

// ---------------------------------------------------------------------------
// 2. With Placeholder
// ---------------------------------------------------------------------------

export const WithPlaceholder: Story = {
  name: 'With Placeholder',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 320 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Custom placeholder text</div>
      <Select
        options={fruitOptions}
        placeholder="Choose a fruit..."
        label="Favorite fruit"
      />
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginTop: 8 }}>With descriptions</div>
      <Select
        options={[
          { value: 'starter', label: 'Starter', description: 'For personal projects' },
          { value: 'pro', label: 'Pro', description: 'For teams and businesses' },
          { value: 'enterprise', label: 'Enterprise', description: 'Custom solutions at scale' },
        ]}
        placeholder="Select a plan..."
        label="Plan"
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 320 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Disabled select</div>
      <Select
        options={fruitOptions}
        defaultValue="cherry"
        label="Fruit"
        disabled
      />
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginTop: 8 }}>With error</div>
      <Select
        options={fruitOptions}
        placeholder="Pick one..."
        label="Required field"
        error="This field is required"
      />
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginTop: 8 }}>Disabled options</div>
      <Select
        options={[
          { value: 'free', label: 'Free' },
          { value: 'basic', label: 'Basic' },
          { value: 'premium', label: 'Premium', disabled: true },
          { value: 'enterprise', label: 'Enterprise', disabled: true },
        ]}
        placeholder="Select a tier..."
        label="Pricing tier"
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 4. Controlled
// ---------------------------------------------------------------------------

export const Controlled: Story = {
  name: 'Controlled',
  render: () => {
    const ControlledSelect = () => {
      const [value, setValue] = useState('');
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 320 }}>
          <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Controlled value</div>
          <Select
            options={fruitOptions}
            value={value}
            onChange={setValue}
            placeholder="Pick a fruit..."
            label="Fruit"
          />
          <Text size="sm" color="secondary">
            {value ? `Selected: ${value}` : 'Nothing selected'}
          </Text>
        </div>
      );
    };
    return <ControlledSelect />;
  },
};
