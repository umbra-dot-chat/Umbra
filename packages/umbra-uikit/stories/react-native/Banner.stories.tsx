import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Banner, Button } from '@wisp-ui/react-native';

const meta: Meta<typeof Banner> = {
  title: 'React Native/Components/Feedback/Banner',
  component: Banner,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['default', 'info', 'success', 'warning', 'danger'] },
    title: { control: 'text' },
    dismissible: { control: 'boolean' },
    fullWidth: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Banner>;

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    variant: 'default',
    title: 'Heads up',
    children: 'This is a default banner with a simple message.',
  },
};

// ---------------------------------------------------------------------------
// 2. Variants
// ---------------------------------------------------------------------------

export const Variants: Story = {
  name: 'Variants',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 520 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Default</div>
      <Banner variant="default" title="Default">
        This is a default banner for general announcements.
      </Banner>

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginTop: 8 }}>Info</div>
      <Banner variant="info" title="Info">
        A new software update is available for download.
      </Banner>

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginTop: 8 }}>Success</div>
      <Banner variant="success" title="Success">
        Your changes have been saved successfully.
      </Banner>

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginTop: 8 }}>Warning</div>
      <Banner variant="warning" title="Warning">
        Your session will expire in 5 minutes.
      </Banner>

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginTop: 8 }}>Danger</div>
      <Banner variant="danger" title="Error">
        Failed to process your request. Please try again.
      </Banner>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. Dismissible
// ---------------------------------------------------------------------------

export const Dismissible: Story = {
  name: 'Dismissible',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 520 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Dismissible Banners</div>
      <Banner variant="info" title="Dismissible" dismissible onDismiss={() => {}}>
        Click the close icon to dismiss this banner.
      </Banner>
      <Banner variant="warning" dismissible onDismiss={() => {}}>
        This warning can be dismissed by the user.
      </Banner>
      <Banner variant="danger" title="Critical Issue" dismissible onDismiss={() => {}}>
        Something went wrong but you can dismiss this notice.
      </Banner>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 4. With Action
// ---------------------------------------------------------------------------

export const WithAction: Story = {
  name: 'With Action',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 520 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Action Banners</div>
      <Banner
        variant="info"
        title="Update Available"
        action={<Button variant="tertiary" size="sm">Update</Button>}
      >
        A new version of the application is ready to install.
      </Banner>
      <Banner
        variant="warning"
        title="Storage Almost Full"
        action={<Button variant="tertiary" size="sm">Manage</Button>}
      >
        You have used 90% of your available storage.
      </Banner>
      <Banner
        variant="success"
        action={<Button variant="tertiary" size="sm">View</Button>}
      >
        Your report has been generated and is ready for review.
      </Banner>
    </div>
  ),
};
