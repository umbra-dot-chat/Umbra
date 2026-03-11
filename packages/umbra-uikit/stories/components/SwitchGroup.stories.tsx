import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { SwitchGroup } from '@wisp-ui/react';
import { CheckboxGroup } from '@wisp-ui/react';
import { Text } from '@wisp-ui/react';

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof SwitchGroup> = {
  title: 'React/Components/Data Entry/SwitchGroup',
  component: SwitchGroup,
  tags: ['autodocs'],
  args: {
    orientation: 'vertical',
    disabled: false,
  },
  argTypes: {
    orientation: {
      control: 'select',
      options: ['vertical', 'horizontal'],
    },
    disabled: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof SwitchGroup>;

// ---------------------------------------------------------------------------
// Shared option sets
// ---------------------------------------------------------------------------

const notificationOptions = [
  { value: 'email', label: 'Email notifications' },
  { value: 'push', label: 'Push notifications' },
  { value: 'sms', label: 'SMS alerts' },
];

const notificationOptionsWithDesc = [
  { value: 'email', label: 'Email notifications', description: 'Receive updates and alerts via email' },
  { value: 'push', label: 'Push notifications', description: 'Real-time browser and mobile push alerts' },
  { value: 'sms', label: 'SMS alerts', description: 'Text messages for critical account events' },
  { value: 'slack', label: 'Slack integration', description: 'Post notifications to your Slack workspace' },
];

const interestOptions = [
  { value: 'design', label: 'Design' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'product', label: 'Product' },
];

const interestOptionsWithDesc = [
  { value: 'design', label: 'Design', description: 'UI/UX, visual design, and design systems' },
  { value: 'engineering', label: 'Engineering', description: 'Frontend, backend, and infrastructure' },
  { value: 'marketing', label: 'Marketing', description: 'Growth, content, and brand strategy' },
  { value: 'product', label: 'Product', description: 'Roadmaps, analytics, and user research' },
];

// ---------------------------------------------------------------------------
// 1. SwitchGroupDefault
// ---------------------------------------------------------------------------

export const SwitchGroupDefault: Story = {
  name: 'SwitchGroup Default',
  render: () => (
    <SwitchGroup
      label="Notification Channels"
      description="Choose how you want to be notified."
      options={notificationOptions}
      defaultValue={['email']}
    />
  ),
};

// ---------------------------------------------------------------------------
// 2. SwitchGroupHorizontal
// ---------------------------------------------------------------------------

export const SwitchGroupHorizontal: Story = {
  name: 'SwitchGroup Horizontal',
  render: () => (
    <SwitchGroup
      label="Quick Toggles"
      options={notificationOptions}
      defaultValue={['email', 'push']}
      orientation="horizontal"
    />
  ),
};

// ---------------------------------------------------------------------------
// 3. CheckboxGroupDefault
// ---------------------------------------------------------------------------

export const CheckboxGroupDefault: Story = {
  name: 'CheckboxGroup Default',
  render: () => (
    <CheckboxGroup
      label="Interests"
      description="Select the topics you are interested in."
      options={interestOptions}
      defaultValue={['design']}
    />
  ),
};

// ---------------------------------------------------------------------------
// 4. CheckboxGroupWithDescriptions
// ---------------------------------------------------------------------------

export const CheckboxGroupWithDescriptions: Story = {
  name: 'CheckboxGroup With Descriptions',
  render: () => (
    <CheckboxGroup
      label="Team Interests"
      description="Select all areas your team focuses on."
      options={interestOptionsWithDesc}
      defaultValue={['design', 'engineering']}
    />
  ),
};

// ---------------------------------------------------------------------------
// 5. Disabled
// ---------------------------------------------------------------------------

export const Disabled: Story = {
  name: 'Disabled',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <SwitchGroup
        label="Disabled SwitchGroup"
        description="All toggles are disabled."
        options={notificationOptions}
        defaultValue={['email']}
        disabled
      />
      <CheckboxGroup
        label="Disabled CheckboxGroup"
        description="All checkboxes are disabled."
        options={interestOptions}
        defaultValue={['design', 'product']}
        disabled
      />
      <SwitchGroup
        label="Partially Disabled"
        description="Only specific options are disabled."
        options={[
          { value: 'email', label: 'Email notifications' },
          { value: 'push', label: 'Push notifications', disabled: true },
          { value: 'sms', label: 'SMS alerts' },
        ]}
        defaultValue={['email', 'push']}
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 6. WithError
// ---------------------------------------------------------------------------

export const WithError: Story = {
  name: 'With Error',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <SwitchGroup
        label="Notification Channels"
        description="You must enable at least one channel."
        options={notificationOptions}
        error="Please select at least one notification channel."
      />
      <CheckboxGroup
        label="Required Interests"
        description="Select at least two interests."
        options={interestOptions}
        defaultValue={['design']}
        error="Please select at least two interests to continue."
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 7. Controlled
// ---------------------------------------------------------------------------

export const Controlled: Story = {
  name: 'Controlled',
  render: () => {
    const ControlledDemo = () => {
      const [switchValues, setSwitchValues] = useState<string[]>(['email']);
      const [checkboxValues, setCheckboxValues] = useState<string[]>(['design', 'engineering']);

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <div>
            <SwitchGroup
              label="Controlled SwitchGroup"
              options={notificationOptions}
              value={switchValues}
              onChange={setSwitchValues}
            />
            <Text size="xs" color="secondary" style={{ marginTop: 8 }}>
              Selected: {switchValues.length > 0 ? switchValues.join(', ') : 'none'}
            </Text>
          </div>

          <div>
            <CheckboxGroup
              label="Controlled CheckboxGroup"
              options={interestOptions}
              value={checkboxValues}
              onChange={setCheckboxValues}
            />
            <Text size="xs" color="secondary" style={{ marginTop: 8 }}>
              Selected: {checkboxValues.length > 0 ? checkboxValues.join(', ') : 'none'}
            </Text>
          </div>
        </div>
      );
    };
    return <ControlledDemo />;
  },
};

// ---------------------------------------------------------------------------
// 8. Composition — Settings Panel with mixed groups
// ---------------------------------------------------------------------------

export const Composition: Story = {
  name: 'Composition',
  render: () => {
    const SettingsPanel = () => {
      const [channels, setChannels] = useState<string[]>(['email', 'push']);
      const [privacy, setPrivacy] = useState<string[]>(['profile']);

      return (
        <div
          style={{
            maxWidth: 480,
            display: 'flex',
            flexDirection: 'column',
            gap: 28,
          }}
        >
          <Text size="lg" weight="semibold">
            Account Settings
          </Text>

          <SwitchGroup
            label="Notification Channels"
            description="Select which channels you want to receive notifications through."
            options={notificationOptionsWithDesc}
            value={channels}
            onChange={setChannels}
          />

          <div style={{ height: 1, backgroundColor: 'var(--wisp-border-subtle, #2A2F3C)' }} />

          <CheckboxGroup
            label="Privacy"
            description="Control what information is visible to others."
            options={[
              { value: 'profile', label: 'Public profile', description: 'Allow others to see your profile page' },
              { value: 'activity', label: 'Activity status', description: 'Show when you are active' },
              { value: 'email-visible', label: 'Email visible', description: 'Display your email on your profile' },
            ]}
            value={privacy}
            onChange={setPrivacy}
          />

          <div style={{ height: 1, backgroundColor: 'var(--wisp-border-subtle, #2A2F3C)' }} />

          <div>
            <Text size="xs" color="secondary">
              Notification channels: {channels.length > 0 ? channels.join(', ') : 'none'}
            </Text>
            <Text size="xs" color="secondary" style={{ marginTop: 4 }}>
              Privacy settings: {privacy.length > 0 ? privacy.join(', ') : 'none'}
            </Text>
          </div>
        </div>
      );
    };
    return <SettingsPanel />;
  },
};
