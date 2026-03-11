import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Alert } from '@wisp-ui/react-native';

const meta: Meta<typeof Alert> = {
  title: 'React Native/Primitives/Alert',
  component: Alert,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['default', 'info', 'success', 'warning', 'danger'] },
    title: { control: 'text' },
    description: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof Alert>;

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    variant: 'default',
    description: 'This is a default alert message.',
  },
};

// ---------------------------------------------------------------------------
// 2. Variants
// ---------------------------------------------------------------------------

export const Variants: Story = {
  name: 'Variants',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 480 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Default</div>
      <Alert variant="default" description="This is a default alert for general information." />

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginTop: 8 }}>Info</div>
      <Alert variant="info" description="A new software update is available for download." />

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginTop: 8 }}>Success</div>
      <Alert variant="success" description="Your changes have been saved successfully." />

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginTop: 8 }}>Warning</div>
      <Alert variant="warning" description="Your session will expire in 5 minutes." />

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginTop: 8 }}>Danger</div>
      <Alert variant="danger" description="Failed to delete the resource. Please try again." />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. With Title
// ---------------------------------------------------------------------------

export const WithTitle: Story = {
  name: 'With Title',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 480 }}>
      <Alert
        variant="info"
        title="Update Available"
        description="A new version of the application is ready to install."
      />
      <Alert
        variant="success"
        title="Payment Confirmed"
        description="Your payment of $49.99 has been processed."
      />
      <Alert
        variant="warning"
        title="Storage Almost Full"
        description="You have used 90% of your available storage."
      />
      <Alert
        variant="danger"
        title="Connection Lost"
        description="Unable to reach the server. Check your network settings."
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 4. With Icon
// ---------------------------------------------------------------------------

export const WithIcon: Story = {
  name: 'With Icon',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 480 }}>
      <Alert
        variant="info"
        title="Tip"
        description="You can press Ctrl+S to save your work at any time."
        icon={<span style={{ fontSize: 16 }}>i</span>}
      />
      <Alert
        variant="success"
        title="Uploaded"
        description="All files have been uploaded successfully."
        icon={<span style={{ fontSize: 16 }}>&#10003;</span>}
      />
      <Alert
        variant="warning"
        description="This action cannot be undone."
        icon={<span style={{ fontSize: 16 }}>!</span>}
      />
      <Alert
        variant="danger"
        title="Error"
        description="Something went wrong while processing your request."
        icon={<span style={{ fontSize: 16 }}>&times;</span>}
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 5. With Action
// ---------------------------------------------------------------------------

export const WithAction: Story = {
  name: 'With Action',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 480 }}>
      <Alert
        variant="info"
        title="New Feature"
        description="Dark mode is now available in settings."
        action={
          <span style={{ fontSize: 13, fontWeight: 600, color: '#5B8DEF', cursor: 'pointer' }}>
            Try it
          </span>
        }
      />
      <Alert
        variant="warning"
        title="Unsaved Changes"
        description="You have unsaved changes that will be lost."
        action={
          <span style={{ fontSize: 13, fontWeight: 600, color: '#E5A540', cursor: 'pointer' }}>
            Save now
          </span>
        }
      />
      <Alert
        variant="danger"
        description="Your trial expires tomorrow."
        action={
          <span style={{ fontSize: 13, fontWeight: 600, color: '#E5564B', cursor: 'pointer' }}>
            Upgrade
          </span>
        }
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 6. All Combinations
// ---------------------------------------------------------------------------

export const AllCombinations: Story = {
  name: 'All Combinations',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 480 }}>
      {(['default', 'info', 'success', 'warning', 'danger'] as const).map((variant) => (
        <Alert
          key={variant}
          variant={variant}
          title={`${variant.charAt(0).toUpperCase()}${variant.slice(1)} Alert`}
          description={`This is a ${variant} alert with a title and description.`}
          icon={<span style={{ fontSize: 16 }}>&#9679;</span>}
        />
      ))}
    </div>
  ),
};
