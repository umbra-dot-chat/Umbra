import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { TimeoutDialog } from './TimeoutDialog';
import { Button } from '../../primitives/button';

const meta: Meta<typeof TimeoutDialog> = {
  title: 'Components/Community/TimeoutDialog',
  component: TimeoutDialog,
  tags: ['autodocs'],
  argTypes: {
    submitting: { control: 'boolean' },
    error: { control: 'text' },
    title: { control: 'text' },
    memberName: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof TimeoutDialog>;

export const Default: Story = {
  render: () => {
    const Demo = () => {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button onClick={() => setOpen(true)}>Timeout Member</Button>
          <TimeoutDialog
            open={open}
            onClose={() => setOpen(false)}
            memberName="JaneDoe"
            onSubmit={(data) => {
              console.log('Submit:', data);
              setOpen(false);
            }}
          />
        </>
      );
    };
    return <Demo />;
  },
};

export const WithError: Story = {
  name: 'With Error',
  render: () => {
    const Demo = () => {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button onClick={() => setOpen(true)}>Timeout (Error)</Button>
          <TimeoutDialog
            open={open}
            onClose={() => setOpen(false)}
            memberName="JaneDoe"
            error="User is already timed out."
            onSubmit={(data) => console.log('Submit:', data)}
          />
        </>
      );
    };
    return <Demo />;
  },
};

export const Submitting: Story = {
  name: 'Submitting',
  render: () => {
    const Demo = () => {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button onClick={() => setOpen(true)}>Timeout (Loading)</Button>
          <TimeoutDialog
            open={open}
            onClose={() => setOpen(false)}
            memberName="JaneDoe"
            submitting
            onSubmit={(data) => console.log('Submit:', data)}
          />
        </>
      );
    };
    return <Demo />;
  },
};

export const CustomPresets: Story = {
  name: 'Custom Duration Presets',
  render: () => {
    const Demo = () => {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button onClick={() => setOpen(true)}>Timeout (Custom)</Button>
          <TimeoutDialog
            open={open}
            onClose={() => setOpen(false)}
            memberName="JaneDoe"
            durationPresets={[
              { label: '30 seconds', value: 30 },
              { label: '2 minutes', value: 120 },
              { label: '30 minutes', value: 1800 },
            ]}
            onSubmit={(data) => {
              console.log('Submit:', data);
              setOpen(false);
            }}
          />
        </>
      );
    };
    return <Demo />;
  },
};
