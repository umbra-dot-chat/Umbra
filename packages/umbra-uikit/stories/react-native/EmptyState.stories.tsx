import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { EmptyState, Button, Text } from '@wisp-ui/react-native';

const meta: Meta<typeof EmptyState> = {
  title: 'React Native/Layouts/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    title: { control: 'text' },
    description: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    title: 'No results found',
    description: 'Try adjusting your search or filter to find what you are looking for.',
    size: 'md',
  },
};

// ---------------------------------------------------------------------------
// 2. With Icon
// ---------------------------------------------------------------------------

export const WithIcon: Story = {
  name: 'With Icon',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Icon + description</div>
      <EmptyState
        icon={<Text style={{ fontSize: 32 }}>{'\uD83D\uDCC2'}</Text>}
        title="No files uploaded"
        description="Upload a file to get started."
      />
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Icon only</div>
      <EmptyState
        icon={<Text style={{ fontSize: 32 }}>{'\uD83D\uDD0D'}</Text>}
        title="No results"
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. With Action
// ---------------------------------------------------------------------------

export const WithAction: Story = {
  name: 'With Action',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Action button</div>
      <EmptyState
        icon={<Text style={{ fontSize: 32 }}>{'\uD83D\uDCE6'}</Text>}
        title="No items yet"
        description="Create your first item to see it here."
        action={<Button size="sm">Create Item</Button>}
      />
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Without description</div>
      <EmptyState
        title="Inbox is empty"
        action={<Button size="sm">Refresh</Button>}
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 4. Sizes
// ---------------------------------------------------------------------------

export const Sizes: Story = {
  name: 'Sizes',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <div key={size}>
          <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            size="{size}"
          </div>
          <div style={{ border: '1px dashed #334155', borderRadius: 6 }}>
            <EmptyState
              size={size}
              icon={<Text style={{ fontSize: 24 }}>{'\u2709'}</Text>}
              title="No messages"
              description="You have no new messages at this time."
            />
          </div>
        </div>
      ))}
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 5. Full Example
// ---------------------------------------------------------------------------

export const FullExample: Story = {
  name: 'Full Example',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>All props combined</div>
      <div style={{ border: '1px dashed #334155', borderRadius: 6 }}>
        <EmptyState
          size="lg"
          icon={<Text style={{ fontSize: 40 }}>{'\uD83D\uDE80'}</Text>}
          title="Ready for launch"
          description="Your project is set up and ready to go. Start by adding your first deployment."
          action={<Button>Deploy Now</Button>}
        />
      </div>
    </div>
  ),
};
