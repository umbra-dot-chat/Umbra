import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Dialog, Button, Text } from '@wisp-ui/react-native';

const meta: Meta<typeof Dialog> = {
  title: 'React Native/Components/Overlays/Dialog',
  component: Dialog,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    showCloseButton: { control: 'boolean' },
    closeOnOverlayClick: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Dialog>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const sectionLabel = { fontSize: 11, color: '#94A0B8', textTransform: 'uppercase' as const, letterSpacing: 1 };

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  name: 'Default',
  render: () => {
    const [open, setOpen] = useState(false);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 480 }}>
        <div style={sectionLabel}>Basic dialog</div>
        <Button onPress={() => setOpen(true)}>Open Dialog</Button>
        <Dialog
          open={open}
          onClose={() => setOpen(false)}
          title="Welcome"
          description="This is a basic dialog with a title and description."
        />
      </div>
    );
  },
};

// ---------------------------------------------------------------------------
// 2. WithActions
// ---------------------------------------------------------------------------

export const WithActions: Story = {
  name: 'With Actions',
  render: () => {
    const [open, setOpen] = useState(false);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 480 }}>
        <div style={sectionLabel}>Dialog with footer actions</div>
        <Button onPress={() => setOpen(true)}>Edit Profile</Button>
        <Dialog
          open={open}
          onClose={() => setOpen(false)}
          title="Edit Profile"
          description="Update your display name and email address."
          footer={
            <>
              <Button size="sm" variant="ghost" onPress={() => setOpen(false)}>Cancel</Button>
              <Button size="sm" onPress={() => setOpen(false)}>Save Changes</Button>
            </>
          }
        >
          <Text style={{ fontSize: 13, color: '#6B7280' }}>
            Form fields would go here. The footer provides action buttons for the user.
          </Text>
        </Dialog>
      </div>
    );
  },
};

// ---------------------------------------------------------------------------
// 3. Confirmation
// ---------------------------------------------------------------------------

export const Confirmation: Story = {
  name: 'Confirmation',
  render: () => {
    const [open, setOpen] = useState(false);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 480 }}>
        <div style={sectionLabel}>Destructive confirmation dialog</div>
        <Button onPress={() => setOpen(true)}>Delete Account</Button>
        <Dialog
          open={open}
          onClose={() => setOpen(false)}
          title="Delete Account"
          description="Are you sure you want to delete your account? This action is permanent and cannot be undone."
          size="sm"
          closeOnOverlayClick={false}
          footer={
            <>
              <Button size="sm" variant="ghost" onPress={() => setOpen(false)}>Cancel</Button>
              <Button size="sm" variant="danger" onPress={() => setOpen(false)}>Delete</Button>
            </>
          }
        />
      </div>
    );
  },
};

// ---------------------------------------------------------------------------
// 4. Sizes
// ---------------------------------------------------------------------------

export const Sizes: Story = {
  name: 'Sizes',
  render: () => {
    const [openSize, setOpenSize] = useState<'sm' | 'md' | 'lg' | null>(null);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 480 }}>
        <div style={sectionLabel}>Size variants</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['sm', 'md', 'lg'] as const).map((size) => (
            <Button key={size} size="sm" onPress={() => setOpenSize(size)}>
              {size.toUpperCase()}
            </Button>
          ))}
        </div>
        {(['sm', 'md', 'lg'] as const).map((size) => (
          <Dialog
            key={size}
            open={openSize === size}
            onClose={() => setOpenSize(null)}
            title={`${size.toUpperCase()} Dialog`}
            description={`This dialog uses the "${size}" size preset.`}
            size={size}
            footer={
              <Button size="sm" onPress={() => setOpenSize(null)}>Close</Button>
            }
          />
        ))}
      </div>
    );
  },
};

// ---------------------------------------------------------------------------
// 5. WithContent
// ---------------------------------------------------------------------------

export const WithContent: Story = {
  name: 'With Content',
  render: () => {
    const [open, setOpen] = useState(false);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 480 }}>
        <div style={sectionLabel}>Dialog with body content</div>
        <Button onPress={() => setOpen(true)}>View Details</Button>
        <Dialog
          open={open}
          onClose={() => setOpen(false)}
          title="Project Details"
          description="Overview of the current project status."
          size="md"
          footer={
            <Button size="sm" onPress={() => setOpen(false)}>Done</Button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Text style={{ fontSize: 13, fontWeight: '600' }}>Status: Active</Text>
            <Text style={{ fontSize: 13, color: '#6B7280' }}>
              The project is on track for the Q2 milestone. All tasks are assigned and progress is being tracked.
            </Text>
            <Text style={{ fontSize: 12, color: '#94A0B8', marginTop: 4 }}>
              Last updated: Feb 9, 2026
            </Text>
          </div>
        </Dialog>
      </div>
    );
  },
};
