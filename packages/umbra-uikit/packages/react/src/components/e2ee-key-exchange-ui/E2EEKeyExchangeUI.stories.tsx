/**
 * E2EEKeyExchangeUI — Stories showing all status states and variants.
 *
 * @module stories/e2ee-key-exchange-ui
 */

import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { E2EEKeyExchangeUI } from './E2EEKeyExchangeUI';

const meta: Meta<typeof E2EEKeyExchangeUI> = {
  title: 'Components/Community/E2EEKeyExchangeUI',
  component: E2EEKeyExchangeUI,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof E2EEKeyExchangeUI>;

// ---------------------------------------------------------------------------
// All Statuses
// ---------------------------------------------------------------------------

export const AllStatuses: Story = {
  name: 'All Statuses',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 420 }}>
      <E2EEKeyExchangeUI status="pending" keyVersion={1} />
      <E2EEKeyExchangeUI status="active" keyVersion={3} onRotateKey={() => {}} />
      <E2EEKeyExchangeUI status="rotating" keyVersion={3} />
      <E2EEKeyExchangeUI status="error" errorMessage="Peer did not respond to key exchange" onRetry={() => {}} />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// Active with Rotate
// ---------------------------------------------------------------------------

export const ActiveWithRotate: Story = {
  name: 'Active with Rotate',
  render: () => {
    const Demo = () => {
      const [rotating, setRotating] = useState(false);
      return (
        <E2EEKeyExchangeUI
          status="active"
          keyVersion={5}
          onRotateKey={() => {
            setRotating(true);
            setTimeout(() => setRotating(false), 2000);
          }}
          rotating={rotating}
          style={{ maxWidth: 420 }}
        />
      );
    };
    return <Demo />;
  },
};

// ---------------------------------------------------------------------------
// Compact
// ---------------------------------------------------------------------------

export const Compact: Story = {
  name: 'Compact Banner',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 420 }}>
      <E2EEKeyExchangeUI status="active" keyVersion={3} compact />
      <E2EEKeyExchangeUI status="pending" compact />
      <E2EEKeyExchangeUI status="error" compact />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export const Skeleton: Story = {
  name: 'Skeleton',
  render: () => (
    <E2EEKeyExchangeUI status="active" skeleton style={{ maxWidth: 420 }} />
  ),
};

// ---------------------------------------------------------------------------
// Error with Custom Message
// ---------------------------------------------------------------------------

export const ErrorWithMessage: Story = {
  name: 'Error with Custom Message',
  render: () => (
    <E2EEKeyExchangeUI
      status="error"
      errorMessage="Connection timed out during key exchange. Please check your network connection."
      onRetry={() => console.log('retry')}
      style={{ maxWidth: 420 }}
    />
  ),
};
