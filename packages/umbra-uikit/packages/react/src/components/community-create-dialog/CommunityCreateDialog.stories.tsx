import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { CommunityCreateDialog } from './CommunityCreateDialog';
import { Button } from '../../primitives/button';

const meta: Meta<typeof CommunityCreateDialog> = {
  title: 'Components/Community/CommunityCreateDialog',
  component: CommunityCreateDialog,
  tags: ['autodocs'],
  argTypes: {
    submitting: { control: 'boolean' },
    error: { control: 'text' },
    title: { control: 'text' },
    maxNameLength: { control: 'number' },
    maxDescriptionLength: { control: 'number' },
  },
};

export default meta;
type Story = StoryObj<typeof CommunityCreateDialog>;

export const Default: Story = {
  render: () => {
    const Demo = () => {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button onClick={() => setOpen(true)}>Create Community</Button>
          <CommunityCreateDialog
            open={open}
            onClose={() => setOpen(false)}
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
          <Button onClick={() => setOpen(true)}>Create Community (Error)</Button>
          <CommunityCreateDialog
            open={open}
            onClose={() => setOpen(false)}
            error="A community with this name already exists."
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
          <Button onClick={() => setOpen(true)}>Create Community (Loading)</Button>
          <CommunityCreateDialog
            open={open}
            onClose={() => setOpen(false)}
            submitting
            onSubmit={(data) => console.log('Submit:', data)}
          />
        </>
      );
    };
    return <Demo />;
  },
};
