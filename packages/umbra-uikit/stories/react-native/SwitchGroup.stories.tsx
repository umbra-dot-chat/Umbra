import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { SwitchGroup } from '@wisp-ui/react-native';

const meta: Meta<typeof SwitchGroup> = {
  title: 'React Native/Components/Data Entry/SwitchGroup',
  component: SwitchGroup,
  tags: ['autodocs'],
  argTypes: {
    orientation: { control: 'select', options: ['vertical', 'horizontal'] },
    disabled: { control: 'boolean' },
    label: { control: 'text' },
    description: { control: 'text' },
    error: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof SwitchGroup>;

const defaultOptions = [
  { value: 'email', label: 'Email notifications' },
  { value: 'sms', label: 'SMS notifications' },
  { value: 'push', label: 'Push notifications' },
];

const detailedOptions = [
  { value: 'analytics', label: 'Analytics', description: 'Track page views and user interactions.' },
  { value: 'marketing', label: 'Marketing emails', description: 'Receive product updates and offers.' },
  { value: 'security', label: 'Security alerts', description: 'Get notified about suspicious activity.' },
];

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    options: defaultOptions,
    defaultValue: ['email'],
  },
};

// ---------------------------------------------------------------------------
// 2. With Labels
// ---------------------------------------------------------------------------

export const WithLabels: Story = {
  name: 'With Labels',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 400 }}>
      <div>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Label Only</div>
        <SwitchGroup
          label="Notifications"
          options={defaultOptions}
          defaultValue={['email', 'push']}
        />
      </div>

      <div>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Label + Description</div>
        <SwitchGroup
          label="Privacy Settings"
          description="Choose which data collection features to enable."
          options={detailedOptions}
          defaultValue={['security']}
        />
      </div>

      <div>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>With Error</div>
        <SwitchGroup
          label="Required Preferences"
          options={defaultOptions}
          defaultValue={[]}
          error="Please select at least one notification method."
        />
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. Disabled
// ---------------------------------------------------------------------------

export const Disabled: Story = {
  name: 'Disabled',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 400 }}>
      <div>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>All Disabled</div>
        <SwitchGroup
          label="Notifications"
          options={defaultOptions}
          defaultValue={['email']}
          disabled
        />
      </div>

      <div>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Single Option Disabled</div>
        <SwitchGroup
          label="Features"
          options={[
            { value: 'analytics', label: 'Analytics' },
            { value: 'marketing', label: 'Marketing emails', disabled: true },
            { value: 'security', label: 'Security alerts' },
          ]}
          defaultValue={['analytics', 'security']}
        />
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 4. Horizontal
// ---------------------------------------------------------------------------

export const Horizontal: Story = {
  name: 'Horizontal',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 560 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Horizontal Layout</div>
      <SwitchGroup
        label="Quick Toggles"
        orientation="horizontal"
        options={defaultOptions}
        defaultValue={['push']}
      />
    </div>
  ),
};
