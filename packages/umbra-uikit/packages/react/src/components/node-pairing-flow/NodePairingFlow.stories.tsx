import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { NodePairingFlow } from './NodePairingFlow';

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof NodePairingFlow> = {
  title: 'Components/Community/NodePairingFlow',
  component: NodePairingFlow,
  tags: ['autodocs'],
  argTypes: {
    open: { control: 'boolean' },
    pairingStatus: { control: 'select', options: ['idle', 'waiting', 'connected', 'failed'] },
    error: { control: 'text' },
    pairingToken: { control: 'text' },
    remoteAddress: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof NodePairingFlow>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    open: true,
    onClose: () => console.log('Close'),
    onGenerateToken: () => console.log('Generate token'),
    onVerifyPairing: (token) => console.log('Verify:', token),
  },
};

export const WithToken: Story = {
  name: 'With Pairing Token',
  args: {
    open: true,
    onClose: () => console.log('Close'),
    pairingToken: 'bp_tok_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8',
    pairingStatus: 'waiting',
    remoteAddress: '192.168.1.100:8443',
    onVerifyPairing: (token) => console.log('Verify:', token),
  },
};

export const Connected: Story = {
  args: {
    open: true,
    onClose: () => console.log('Close'),
    pairingToken: 'bp_tok_connected_abc123',
    pairingStatus: 'connected',
    remoteAddress: '10.0.0.50:8443',
  },
};

export const Failed: Story = {
  args: {
    open: true,
    onClose: () => console.log('Close'),
    pairingToken: 'bp_tok_failed_xyz789',
    pairingStatus: 'failed',
    error: 'Connection timed out. The remote node may be offline or behind a firewall.',
    onGenerateToken: () => console.log('Regenerate'),
  },
};

export const Closed: Story = {
  args: {
    open: false,
    onClose: () => console.log('Close'),
  },
};
