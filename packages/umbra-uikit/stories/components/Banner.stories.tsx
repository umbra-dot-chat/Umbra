/**
 * Banner — Stories showing all variants and usage patterns.
 *
 * @module stories/banner
 */

import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Banner } from '@wisp-ui/react';
import { Button } from '@wisp-ui/react';
import { Info, CheckCircle, AlertTriangle, XCircle, Bell } from 'lucide-react';

const meta: Meta<typeof Banner> = {
  title: 'React/Components/Feedback/Banner',
  component: Banner,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Banner>;

// ---------------------------------------------------------------------------
// Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    children: 'This is a default banner message.',
  },
};

// ---------------------------------------------------------------------------
// All Variants
// ---------------------------------------------------------------------------

export const AllVariants: Story = {
  name: 'All Variants',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 560 }}>
      <Banner variant="default" icon={Bell}>
        This is a default notification banner.
      </Banner>
      <Banner variant="info" icon={Info}>
        A new software update is available. See what's new.
      </Banner>
      <Banner variant="success" icon={CheckCircle}>
        Your changes have been saved successfully.
      </Banner>
      <Banner variant="warning" icon={AlertTriangle}>
        Your trial expires in 3 days. Upgrade to keep access.
      </Banner>
      <Banner variant="danger" icon={XCircle}>
        There was an error processing your payment. Please try again.
      </Banner>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// With Title
// ---------------------------------------------------------------------------

export const WithTitle: Story = {
  name: 'With Title',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 560 }}>
      <Banner variant="info" icon={Info} title="Update Available">
        A new version of the application is ready. Refresh to update.
      </Banner>
      <Banner variant="danger" icon={XCircle} title="Payment Failed">
        Your last payment attempt was declined. Please update your payment method.
      </Banner>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// With Action
// ---------------------------------------------------------------------------

export const WithAction: Story = {
  name: 'With Action',
  render: () => (
    <Banner variant="info" icon={Info} title="New feature" action={<Button variant="secondary" size="sm">Learn more</Button>} style={{ maxWidth: 560 }}>
      We've added dark mode support. Try it out in settings.
    </Banner>
  ),
};

// ---------------------------------------------------------------------------
// Dismissible
// ---------------------------------------------------------------------------

export const Dismissible: Story = {
  name: 'Dismissible',
  render: () => {
    const Demo = () => {
      const [visible, setVisible] = useState(true);
      return visible ? (
        <Banner
          variant="warning"
          icon={AlertTriangle}
          dismissible
          onDismiss={() => setVisible(false)}
          style={{ maxWidth: 560 }}
        >
          Your trial expires in 3 days. Upgrade now to keep access.
        </Banner>
      ) : (
        <Button size="sm" onClick={() => setVisible(true)}>Show Banner</Button>
      );
    };
    return <Demo />;
  },
};

// ---------------------------------------------------------------------------
// Full Width
// ---------------------------------------------------------------------------

export const FullWidth: Story = {
  name: 'Full Width',
  render: () => (
    <Banner variant="info" icon={Info} fullWidth dismissible>
      This banner stretches to the full width of its container.
    </Banner>
  ),
};
