import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { CheckboxGroup } from '@wisp-ui/react-native';

const meta: Meta<typeof CheckboxGroup> = {
  title: 'React Native/Components/Data Entry/CheckboxGroup',
  component: CheckboxGroup,
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    description: { control: 'text' },
    orientation: { control: 'select', options: ['vertical', 'horizontal'] },
    disabled: { control: 'boolean' },
    error: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof CheckboxGroup>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const sectionLabel = { fontSize: 11, color: '#94A0B8', textTransform: 'uppercase' as const, letterSpacing: 1 };

const fruitOptions = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
];

const notificationOptions = [
  { value: 'email', label: 'Email', description: 'Receive updates via email.' },
  { value: 'sms', label: 'SMS', description: 'Receive updates via text message.' },
  { value: 'push', label: 'Push', description: 'Receive push notifications on your device.' },
];

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    options: fruitOptions,
    defaultValue: ['apple'],
  },
};

// ---------------------------------------------------------------------------
// 2. WithLabels
// ---------------------------------------------------------------------------

export const WithLabels: Story = {
  name: 'With Labels',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 360 }}>
      <div style={sectionLabel}>Label + Description</div>
      <CheckboxGroup
        label="Notifications"
        description="Choose how you would like to be notified."
        options={notificationOptions}
        defaultValue={['email']}
      />

      <div style={sectionLabel}>Horizontal Orientation</div>
      <CheckboxGroup
        label="Select fruits"
        options={fruitOptions}
        orientation="horizontal"
        defaultValue={['banana']}
      />

      <div style={sectionLabel}>With Error</div>
      <CheckboxGroup
        label="Required selection"
        options={fruitOptions}
        error="Please select at least one option."
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 360 }}>
      <div style={sectionLabel}>Entire Group Disabled</div>
      <CheckboxGroup
        label="Preferences"
        options={fruitOptions}
        defaultValue={['apple', 'cherry']}
        disabled
      />

      <div style={sectionLabel}>Individual Option Disabled</div>
      <CheckboxGroup
        label="Available options"
        options={[
          { value: 'available', label: 'Available' },
          { value: 'unavailable', label: 'Unavailable (disabled)', disabled: true },
          { value: 'other', label: 'Other' },
        ]}
        defaultValue={['available']}
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
    const [value, setValue] = useState<string[]>(['email']);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 360 }}>
        <div style={sectionLabel}>Controlled State</div>
        <CheckboxGroup
          label="Notifications"
          description="Manage your notification preferences."
          options={notificationOptions}
          value={value}
          onChange={setValue}
        />
        <div style={{ fontSize: 12, color: '#6B7280', fontFamily: 'monospace' }}>
          Selected: [{value.map((v) => `"${v}"`).join(', ')}]
        </div>
      </div>
    );
  },
};
