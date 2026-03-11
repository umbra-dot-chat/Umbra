import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Toast, Button, Text } from '@wisp-ui/react-native';

const meta: Meta<typeof Toast> = {
  title: 'React Native/Primitives/Toast',
  component: Toast,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['default', 'success', 'warning', 'danger', 'info'] },
    dismissible: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Toast>;

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    title: 'Notification',
    description: 'This is a default toast notification.',
    variant: 'default',
  },
};

// ---------------------------------------------------------------------------
// 2. Variants
// ---------------------------------------------------------------------------

export const Variants: Story = {
  name: 'Variants',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 420 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Semantic variants</div>
      <Toast variant="default" title="Default" description="Neutral notification message." />
      <Toast variant="info" title="Info" description="Here is some useful information." />
      <Toast variant="success" title="Success" description="Your changes have been saved." />
      <Toast variant="warning" title="Warning" description="This action may have side effects." />
      <Toast variant="danger" title="Error" description="Something went wrong. Please try again." />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. Dismissible
// ---------------------------------------------------------------------------

export const Dismissible: Story = {
  name: 'Dismissible',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 420 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>With dismiss button</div>
      <Toast
        variant="info"
        title="Dismissible"
        description="Press the X to dismiss this notification."
        onDismiss={() => {}}
      />
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginTop: 8 }}>Dismiss disabled</div>
      <Toast
        variant="info"
        title="Not dismissible"
        description="The dismiss button is hidden even though onDismiss is set."
        onDismiss={() => {}}
        dismissible={false}
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 4. With Action
// ---------------------------------------------------------------------------

export const WithAction: Story = {
  name: 'With Action',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 420 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Action slot</div>
      <Toast
        variant="info"
        title="Update available"
        description="A new version is ready to install."
        action={<Button size="sm">Update</Button>}
      />
      <Toast
        variant="danger"
        title="Connection lost"
        description="Unable to reach the server."
        action={<Button size="sm">Retry</Button>}
        onDismiss={() => {}}
      />
      <Toast
        variant="success"
        title="File uploaded"
        description="report-q4.pdf was uploaded successfully."
        action={<Button size="sm">View</Button>}
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 5. With Icon
// ---------------------------------------------------------------------------

export const WithIcon: Story = {
  name: 'With Icon',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 420 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Leading icon</div>
      <Toast
        variant="success"
        title="Saved"
        description="Your changes were saved."
        icon={<Text style={{ fontSize: 16 }}>{'\u2713'}</Text>}
      />
      <Toast
        variant="warning"
        title="Low storage"
        description="You are running low on disk space."
        icon={<Text style={{ fontSize: 16 }}>{'\u26A0'}</Text>}
        onDismiss={() => {}}
      />
    </div>
  ),
};
