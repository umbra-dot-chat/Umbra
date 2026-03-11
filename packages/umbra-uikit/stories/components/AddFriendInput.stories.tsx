/**
 * AddFriendInput — Stories showing all variants and usage patterns.
 *
 * @module stories/add-friend-input
 */

import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { AddFriendInput } from '@wisp-ui/react';

const meta: Meta<typeof AddFriendInput> = {
  title: 'React/Components/Social/AddFriendInput',
  component: AddFriendInput,
  tags: ['autodocs'],
  argTypes: {
    feedbackState: { control: 'select', options: ['idle', 'loading', 'success', 'error'] },
    disabled: { control: 'boolean' },
    skeleton: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof AddFriendInput>;

// ---------------------------------------------------------------------------
// Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    placeholder: 'Add friend by username...',
    onSubmit: () => {},
  },
};

// ---------------------------------------------------------------------------
// Success Feedback
// ---------------------------------------------------------------------------

export const SuccessFeedback: Story = {
  name: 'Success Feedback',
  render: () => (
    <div style={{ maxWidth: 480 }}>
      <AddFriendInput
        value="alice"
        feedbackState="success"
        feedbackMessage="Friend request sent to @alice!"
        onSubmit={() => {}}
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// Error Feedback
// ---------------------------------------------------------------------------

export const ErrorFeedback: Story = {
  name: 'Error Feedback',
  render: () => (
    <div style={{ maxWidth: 480 }}>
      <AddFriendInput
        value="unknownuser"
        feedbackState="error"
        feedbackMessage="No user found with that username. Please check and try again."
        onSubmit={() => {}}
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export const Skeleton: Story = {
  name: 'Skeleton',
  render: () => (
    <div style={{ maxWidth: 480 }}>
      <AddFriendInput skeleton />
    </div>
  ),
};
