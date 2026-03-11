import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { NodeRegistrationWizard } from './NodeRegistrationWizard';

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof NodeRegistrationWizard> = {
  title: 'Components/Community/NodeRegistrationWizard',
  component: NodeRegistrationWizard,
  tags: ['autodocs'],
  argTypes: {
    open: { control: 'boolean' },
    submitting: { control: 'boolean' },
    error: { control: 'text' },
    generatedPublicKey: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof NodeRegistrationWizard>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    open: true,
    onClose: () => console.log('Close'),
    onComplete: (data) => console.log('Complete:', data),
  },
};

export const WithError: Story = {
  name: 'With Error',
  args: {
    open: true,
    onClose: () => console.log('Close'),
    error: 'Failed to register node. Please check your network connection and try again.',
  },
};

export const WithPublicKey: Story = {
  name: 'With Generated Key',
  args: {
    open: true,
    onClose: () => console.log('Close'),
    generatedPublicKey: 'pk_ed25519_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0',
    onComplete: (data) => console.log('Complete:', data),
  },
};

export const Submitting: Story = {
  args: {
    open: true,
    onClose: () => console.log('Close'),
    submitting: true,
  },
};

export const Closed: Story = {
  args: {
    open: false,
    onClose: () => console.log('Close'),
  },
};
