import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Checkbox } from '@wisp-ui/react-native';
import { componentSizes } from '@wisp-ui/react';

const meta: Meta<typeof Checkbox> = {
  title: 'React Native/Primitives/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  argTypes: {
    checked: { control: 'boolean' },
    indeterminate: { control: 'boolean' },
    size: { control: 'select', options: [...componentSizes] },
    disabled: { control: 'boolean' },
    label: { control: 'text' },
    description: { control: 'text' },
    error: { control: 'boolean' },
    warning: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    label: 'Accept terms and conditions',
    size: 'md',
  },
};

// ---------------------------------------------------------------------------
// 2. Checked
// ---------------------------------------------------------------------------

export const Checked: Story = {
  name: 'Checked',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Checked</div>
      <Checkbox checked label="Checked checkbox" />

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Unchecked</div>
      <Checkbox checked={false} label="Unchecked checkbox" />

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Indeterminate</div>
      <Checkbox indeterminate label="Indeterminate checkbox" />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. Disabled
// ---------------------------------------------------------------------------

export const Disabled: Story = {
  name: 'Disabled',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Disabled Unchecked</div>
      <Checkbox disabled label="Disabled unchecked" />

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Disabled Checked</div>
      <Checkbox disabled checked label="Disabled checked" />

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Disabled Indeterminate</div>
      <Checkbox disabled indeterminate label="Disabled indeterminate" />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 4. Sizes
// ---------------------------------------------------------------------------

export const Sizes: Story = {
  name: 'Sizes',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <Checkbox size="xs" checked label="Extra Small" />
        <Checkbox size="sm" checked label="Small" />
        <Checkbox size="md" checked label="Medium" />
        <Checkbox size="lg" checked label="Large" />
        <Checkbox size="xl" checked label="Extra Large" />
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 5. With Label
// ---------------------------------------------------------------------------

export const WithLabel: Story = {
  name: 'With Label',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Label Only</div>
      <Checkbox label="Subscribe to newsletter" />

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Label + Description</div>
      <Checkbox
        label="Marketing emails"
        description="Receive updates about new features and promotions."
      />

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Error State</div>
      <Checkbox
        error
        label="Required field"
        description="You must accept the terms to continue."
      />

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Warning State</div>
      <Checkbox
        warning
        label="Optional but recommended"
        description="Enabling this improves your experience."
      />
    </div>
  ),
};
