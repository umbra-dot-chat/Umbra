import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Sheet, Button, Text } from '@wisp-ui/react-native';

const meta: Meta<typeof Sheet> = {
  title: 'React Native/Components/Overlays/Sheet',
  component: Sheet,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg', 'full'] },
    overlay: { control: 'boolean' },
    closeOnOverlayClick: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Sheet>;

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
        <div style={sectionLabel}>Basic sheet</div>
        <Button onPress={() => setOpen(true)}>Open Sheet</Button>
        <Sheet open={open} onClose={() => setOpen(false)}>
          <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>Sheet Title</Text>
          <Text style={{ fontSize: 14, color: '#6B7280' }}>
            This is a basic bottom sheet with default settings.
          </Text>
        </Sheet>
      </div>
    );
  },
};

// ---------------------------------------------------------------------------
// 2. FromBottom
// ---------------------------------------------------------------------------

export const FromBottom: Story = {
  name: 'From Bottom',
  render: () => {
    const [openSize, setOpenSize] = useState<'sm' | 'md' | 'lg' | 'full' | null>(null);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 480 }}>
        <div style={sectionLabel}>Size presets</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['sm', 'md', 'lg', 'full'] as const).map((size) => (
            <Button key={size} size="sm" onPress={() => setOpenSize(size)}>
              {size.toUpperCase()}
            </Button>
          ))}
        </div>
        {(['sm', 'md', 'lg', 'full'] as const).map((size) => (
          <Sheet
            key={size}
            open={openSize === size}
            onClose={() => setOpenSize(null)}
            size={size}
          >
            <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>
              {size.toUpperCase()} Sheet
            </Text>
            <Text style={{ fontSize: 14, color: '#6B7280' }}>
              This sheet uses the "{size}" size, which takes up{' '}
              {size === 'sm' ? '40%' : size === 'md' ? '60%' : size === 'lg' ? '80%' : '100%'} of the screen height.
            </Text>
          </Sheet>
        ))}
      </div>
    );
  },
};

// ---------------------------------------------------------------------------
// 3. WithContent
// ---------------------------------------------------------------------------

export const WithContent: Story = {
  name: 'With Content',
  render: () => {
    const [open, setOpen] = useState(false);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 480 }}>
        <div style={sectionLabel}>Sheet with structured content</div>
        <Button onPress={() => setOpen(true)}>View Options</Button>
        <Sheet open={open} onClose={() => setOpen(false)} size="md">
          <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 4 }}>Sort By</Text>
          <Text style={{ fontSize: 13, color: '#94A0B8', marginBottom: 16 }}>
            Choose how to sort your items.
          </Text>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {['Most Recent', 'Alphabetical', 'File Size', 'Date Modified'].map((option) => (
              <Text key={option} style={{ fontSize: 14, paddingVertical: 4 }}>{option}</Text>
            ))}
          </div>
        </Sheet>
      </div>
    );
  },
};

// ---------------------------------------------------------------------------
// 4. WithoutOverlay
// ---------------------------------------------------------------------------

export const WithoutOverlay: Story = {
  name: 'Without Overlay',
  render: () => {
    const [open, setOpen] = useState(false);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 480 }}>
        <div style={sectionLabel}>Overlay disabled</div>
        <Button onPress={() => setOpen(true)}>Open Sheet (No Overlay)</Button>
        <Sheet open={open} onClose={() => setOpen(false)} overlay={false} size="sm">
          <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>No Overlay</Text>
          <Text style={{ fontSize: 14, color: '#6B7280' }}>
            This sheet appears without a dimmed backdrop overlay.
          </Text>
          <div style={{ marginTop: 16 }}>
            <Button size="sm" onPress={() => setOpen(false)}>Close</Button>
          </div>
        </Sheet>
      </div>
    );
  },
};

// ---------------------------------------------------------------------------
// 5. NonDismissible
// ---------------------------------------------------------------------------

export const NonDismissible: Story = {
  name: 'Non-Dismissible',
  render: () => {
    const [open, setOpen] = useState(false);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 480 }}>
        <div style={sectionLabel}>Overlay click disabled</div>
        <Button onPress={() => setOpen(true)}>Open Required Sheet</Button>
        <Sheet open={open} onClose={() => setOpen(false)} closeOnOverlayClick={false} size="sm">
          <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>Required Action</Text>
          <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 16 }}>
            This sheet cannot be dismissed by tapping the overlay. You must use the button below.
          </Text>
          <Button size="sm" onPress={() => setOpen(false)}>Acknowledge</Button>
        </Sheet>
      </div>
    );
  },
};
