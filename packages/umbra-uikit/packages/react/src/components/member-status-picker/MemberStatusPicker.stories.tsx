/**
 * MemberStatusPicker -- Stories for the member status picker component.
 *
 * @module stories/member-status-picker
 */

import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { MemberStatusPicker } from './MemberStatusPicker';
import type { MemberStatusData } from '@coexist/wisp-core/types/MemberStatusPicker.types';

const meta: Meta<typeof MemberStatusPicker> = {
  title: 'Components/Community/MemberStatusPicker',
  component: MemberStatusPicker,
  tags: ['autodocs'],
  argTypes: {
    open: { control: 'boolean' },
    submitting: { control: 'boolean' },
    title: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof MemberStatusPicker>;

// ---------------------------------------------------------------------------
// Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  name: 'Default',
  render: () => {
    const Demo = () => {
      const [open, setOpen] = useState(true);
      return (
        <div>
          <button onClick={() => setOpen(true)}>Open Picker</button>
          <MemberStatusPicker
            open={open}
            onClose={() => setOpen(false)}
            onSubmit={(data) => {
              console.log('Submit:', data);
              setOpen(false);
            }}
          />
        </div>
      );
    };
    return <Demo />;
  },
};

// ---------------------------------------------------------------------------
// WithCurrentStatus
// ---------------------------------------------------------------------------

export const WithCurrentStatus: Story = {
  name: 'With Current Status',
  render: () => {
    const Demo = () => {
      const [open, setOpen] = useState(true);
      const [status, setStatus] = useState<MemberStatusData>({
        text: 'In a meeting',
        emoji: '\u{1F4BB}',
        expiresAt: '1h',
      });
      return (
        <div>
          <button onClick={() => setOpen(true)}>Open Picker</button>
          <MemberStatusPicker
            open={open}
            onClose={() => setOpen(false)}
            currentStatus={status}
            onSubmit={(data) => {
              setStatus(data);
              setOpen(false);
            }}
            onClear={() => {
              setStatus({});
              setOpen(false);
            }}
          />
        </div>
      );
    };
    return <Demo />;
  },
};

// ---------------------------------------------------------------------------
// Submitting
// ---------------------------------------------------------------------------

export const Submitting: Story = {
  name: 'Submitting State',
  render: () => (
    <MemberStatusPicker
      open
      onClose={() => {}}
      submitting
      currentStatus={{ text: 'Busy', emoji: '\u{1F525}' }}
    />
  ),
};

// ---------------------------------------------------------------------------
// CustomTitle
// ---------------------------------------------------------------------------

export const CustomTitle: Story = {
  name: 'Custom Title',
  render: () => (
    <MemberStatusPicker
      open
      onClose={() => {}}
      title="Update Your Status"
    />
  ),
};

// ---------------------------------------------------------------------------
// CustomExpiryPresets
// ---------------------------------------------------------------------------

export const CustomExpiryPresets: Story = {
  name: 'Custom Expiry Presets',
  render: () => (
    <MemberStatusPicker
      open
      onClose={() => {}}
      expiryPresets={[
        { label: '15 minutes', value: '15m' },
        { label: '1 hour', value: '1h' },
        { label: 'End of day', value: 'eod' },
        { label: 'Never', value: null },
      ]}
    />
  ),
};
