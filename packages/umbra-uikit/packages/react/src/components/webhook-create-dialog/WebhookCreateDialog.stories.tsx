import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { WebhookCreateDialog } from './WebhookCreateDialog';

const meta: Meta<typeof WebhookCreateDialog> = {
  title: 'Components/Community/WebhookCreateDialog',
  component: WebhookCreateDialog,
  tags: ['autodocs'],
  argTypes: {
    open: { control: 'boolean' },
    submitting: { control: 'boolean' },
    error: { control: 'text' },
    title: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof WebhookCreateDialog>;

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

const sampleChannels = [
  { id: 'c1', name: 'general' },
  { id: 'c2', name: 'dev' },
  { id: 'c3', name: 'random' },
  { id: 'c4', name: 'announcements' },
];

// ---------------------------------------------------------------------------
// Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    open: true,
    onClose: () => console.log('Close'),
    onSubmit: (data) => console.log('Submit:', data),
    channels: sampleChannels,
  },
};

// ---------------------------------------------------------------------------
// Submitting
// ---------------------------------------------------------------------------

export const Submitting: Story = {
  args: {
    open: true,
    onClose: () => console.log('Close'),
    channels: sampleChannels,
    submitting: true,
  },
};

// ---------------------------------------------------------------------------
// With error
// ---------------------------------------------------------------------------

export const WithError: Story = {
  name: 'With Error',
  args: {
    open: true,
    onClose: () => console.log('Close'),
    channels: sampleChannels,
    error: 'A webhook with that name already exists.',
  },
};

// ---------------------------------------------------------------------------
// Custom title
// ---------------------------------------------------------------------------

export const CustomTitle: Story = {
  name: 'Custom Title',
  args: {
    open: true,
    onClose: () => console.log('Close'),
    channels: sampleChannels,
    title: 'Add Integration',
  },
};
