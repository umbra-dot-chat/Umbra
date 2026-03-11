import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { WarningDialog } from './WarningDialog';
import { Button } from '../../primitives/button';

const meta: Meta<typeof WarningDialog> = {
  title: 'Components/Community/WarningDialog',
  component: WarningDialog,
  tags: ['autodocs'],
  argTypes: {
    submitting: { control: 'boolean' },
    error: { control: 'text' },
    title: { control: 'text' },
    memberName: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof WarningDialog>;

export const Default: Story = {
  render: () => {
    const Demo = () => {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button onClick={() => setOpen(true)}>Issue Warning</Button>
          <WarningDialog
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
          <Button onClick={() => setOpen(true)}>Issue Warning (Error)</Button>
          <WarningDialog
            open={open}
            onClose={() => setOpen(false)}
            memberName="JaneDoe"
            error="Failed to issue warning. Please try again."
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
          <Button onClick={() => setOpen(true)}>Issue Warning (Loading)</Button>
          <WarningDialog
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
