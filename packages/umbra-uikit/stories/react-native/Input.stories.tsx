import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Input } from '@wisp-ui/react-native';

const meta: Meta<typeof Input> = {
  title: 'React Native/Primitives/Input',
  component: Input,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
    disabled: { control: 'boolean' },
    fullWidth: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
    size: 'md',
  },
};

// ---------------------------------------------------------------------------
// 2. Sizes
// ---------------------------------------------------------------------------

export const Sizes: Story = {
  name: 'Sizes',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 320 }}>
      <Input size="xs" placeholder="Extra small" />
      <Input size="sm" placeholder="Small" />
      <Input size="md" placeholder="Medium" />
      <Input size="lg" placeholder="Large" />
      <Input size="xl" placeholder="Extra large" />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. With Label and Hint
// ---------------------------------------------------------------------------

export const WithLabelAndHint: Story = {
  name: 'Label & Hint',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 320 }}>
      <Input label="Email" hint="We'll never share your email." placeholder="you@example.com" />
      <Input label="Username" hint="3-20 characters, letters and numbers only." placeholder="johndoe" />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 4. Error State
// ---------------------------------------------------------------------------

export const ErrorState: Story = {
  name: 'Error',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 320 }}>
      <Input label="Password" error="Password must be at least 8 characters" placeholder="Enter password" />
      <Input label="Email" error={true} placeholder="Invalid email" />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 5. Warning State
// ---------------------------------------------------------------------------

export const WarningState: Story = {
  name: 'Warning',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 320 }}>
      <Input label="Username" warning="This username is already taken" placeholder="johndoe" />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 6. Disabled
// ---------------------------------------------------------------------------

export const Disabled: Story = {
  name: 'Disabled',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 320 }}>
      <Input label="Disabled" disabled placeholder="Can't edit this" />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 7. Full Width
// ---------------------------------------------------------------------------

export const FullWidth: Story = {
  name: 'Full Width',
  render: () => (
    <div style={{ width: 400 }}>
      <Input fullWidth label="Full Width" placeholder="Takes the full container width" />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 8. Controlled
// ---------------------------------------------------------------------------

export const Controlled: Story = {
  name: 'Controlled',
  render: () => {
    const ControlledInput = () => {
      const [value, setValue] = useState('');
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 320 }}>
          <Input
            label="Controlled Input"
            value={value}
            onChangeText={setValue}
            placeholder="Type something..."
            hint={`Character count: ${value.length}`}
          />
        </div>
      );
    };
    return <ControlledInput />;
  },
};
