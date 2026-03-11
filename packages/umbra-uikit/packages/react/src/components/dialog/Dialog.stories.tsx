import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Dialog } from './Dialog';
import { dialogSizes } from '@coexist/wisp-core/types/Dialog.types';
import { Text } from '../../primitives/text';
import { Button } from '../../primitives/button';

const meta: Meta<typeof Dialog> = {
  title: 'Components/Dialog',
  component: Dialog,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: [...dialogSizes] },
    closeOnOverlayClick: { control: 'boolean' },
    closeOnEscape: { control: 'boolean' },
    showCloseButton: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Dialog>;

const SectionLabel = ({ children }: { children: string }) => (
  <Text size="xs" color="tertiary" weight="semibold" as="div" style={{ textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 4 }}>
    {children}
  </Text>
);

export const Default: Story = {
  render: () => {
    const Demo = () => {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button onClick={() => setOpen(true)}>Open Dialog</Button>
          <Dialog open={open} onClose={() => setOpen(false)} title="Confirm action" description="Are you sure you want to proceed?">
            <Text size="sm" color="secondary">This action cannot be undone. Please review before continuing.</Text>
          </Dialog>
        </>
      );
    };
    return <Demo />;
  },
};

export const Sizes: Story = {
  name: 'Sizes',
  render: () => {
    const Demo = () => {
      const [openSize, setOpenSize] = useState<string | null>(null);
      return (
        <div style={{ display: 'flex', gap: 12 }}>
          {dialogSizes.map((size) => (
            <React.Fragment key={size}>
              <Button variant="secondary" size="sm" onClick={() => setOpenSize(size)}>
                {size}
              </Button>
              <Dialog open={openSize === size} onClose={() => setOpenSize(null)} size={size} title={`${size.toUpperCase()} Dialog`} description={`This dialog uses the "${size}" size preset.`}>
                <Text size="sm" color="secondary">Dialog content goes here.</Text>
              </Dialog>
            </React.Fragment>
          ))}
        </div>
      );
    };
    return <Demo />;
  },
};

export const WithFooter: Story = {
  name: 'With Footer',
  render: () => {
    const Demo = () => {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button onClick={() => setOpen(true)}>Delete Item</Button>
          <Dialog
            open={open}
            onClose={() => setOpen(false)}
            title="Delete item"
            description="This will permanently remove this item from your account."
            footer={
              <>
                <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
                <Button variant="destructive" size="sm" onClick={() => setOpen(false)}>Delete</Button>
              </>
            }
          >
            <Text size="sm" color="secondary">Are you sure? This cannot be undone.</Text>
          </Dialog>
        </>
      );
    };
    return <Demo />;
  },
};

export const LongContent: Story = {
  name: 'Long Content',
  render: () => {
    const Demo = () => {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button onClick={() => setOpen(true)}>Terms of Service</Button>
          <Dialog
            open={open}
            onClose={() => setOpen(false)}
            title="Terms of Service"
            footer={
              <>
                <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>Decline</Button>
                <Button variant="primary" size="sm" onClick={() => setOpen(false)}>Accept</Button>
              </>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Array.from({ length: 8 }, (_, i) => (
                <Text key={i} size="sm" color="secondary">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
                </Text>
              ))}
            </div>
          </Dialog>
        </>
      );
    };
    return <Demo />;
  },
};

export const Glass: Story = {
  name: 'Glass',
  render: () => {
    const Demo = () => {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button onClick={() => setOpen(true)}>Open Glass Dialog</Button>
          <Dialog
            open={open}
            onClose={() => setOpen(false)}
            title="Glass Dialog"
            description="This dialog uses the frosted-glass variant."
            variant="glass"
            footer={
              <>
                <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
                <Button variant="primary" size="sm" onClick={() => setOpen(false)}>Confirm</Button>
              </>
            }
          >
            <Text size="sm" color="secondary">
              The panel background uses backdrop-filter blur for a glassmorphism effect.
            </Text>
          </Dialog>
        </>
      );
    };
    return <Demo />;
  },
};

export const Composition: Story = {
  name: 'Composition',
  render: () => {
    const Demo = () => {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button onClick={() => setOpen(true)}>Create Project</Button>
          <Dialog
            open={open}
            onClose={() => setOpen(false)}
            title="New Project"
            description="Fill in the details to create a new project."
            size="md"
            footer={
              <>
                <Button variant="tertiary" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
                <Button variant="primary" size="sm" onClick={() => setOpen(false)}>Create</Button>
              </>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <Text size="sm" weight="medium" as="label" style={{ marginBottom: 4, display: 'block' }}>Project name</Text>
                <Text size="xs" color="tertiary">Enter a name for your project</Text>
              </div>
              <div>
                <Text size="sm" weight="medium" as="label" style={{ marginBottom: 4, display: 'block' }}>Description</Text>
                <Text size="xs" color="tertiary">Optional description for context</Text>
              </div>
            </div>
          </Dialog>
        </>
      );
    };
    return <Demo />;
  },
};
