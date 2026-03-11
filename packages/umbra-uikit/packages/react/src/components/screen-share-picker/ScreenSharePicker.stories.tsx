import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ScreenSharePicker } from './ScreenSharePicker';
import type { ScreenShareSource } from '@coexist/wisp-core/types/ScreenSharePicker.types';
import { Text } from '../../primitives/text';

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof ScreenSharePicker> = {
  title: 'Components/ScreenSharePicker',
  component: ScreenSharePicker,
  tags: ['autodocs'],
  argTypes: {
    open: { control: 'boolean' },
    loading: { control: 'boolean' },
    skeleton: { control: 'boolean' },
    title: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof ScreenSharePicker>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SectionLabel = ({ children }: { children: string }) => (
  <Text size="xs" color="tertiary" weight="semibold" as="div" style={{ textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 4 }}>
    {children}
  </Text>
);

const mockSources: ScreenShareSource[] = [
  { id: 's1', name: 'Main Display', type: 'screen' },
  { id: 's2', name: 'Secondary Monitor', type: 'screen' },
  { id: 'w1', name: 'VS Code', type: 'window' },
  { id: 'w2', name: 'Chrome Browser', type: 'window' },
  { id: 'w3', name: 'Slack', type: 'window' },
  { id: 'w4', name: 'Figma', type: 'window' },
  { id: 't1', name: 'GitHub - Pull Request #42', type: 'tab' },
  { id: 't2', name: 'Jira Board', type: 'tab' },
  { id: 't3', name: 'Google Docs - Meeting Notes', type: 'tab' },
];

// ---------------------------------------------------------------------------
// 1. Default (playground)
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    open: true,
    sources: mockSources,
    title: 'Share Your Screen',
    loading: false,
    skeleton: false,
  },
  render: (args) => {
    return <ScreenSharePicker {...args} onClose={() => {}} onSelect={(id) => console.log('Selected:', id)} />;
  },
};

// ---------------------------------------------------------------------------
// 2. Interactive
// ---------------------------------------------------------------------------

export const Interactive: Story = {
  name: 'Interactive',
  render: () => {
    const [open, setOpen] = useState(true);
    return (
      <div>
        <button onClick={() => setOpen(true)} style={{ padding: '8px 16px', cursor: 'pointer' }}>
          Open Picker
        </button>
        <ScreenSharePicker
          open={open}
          onClose={() => setOpen(false)}
          sources={mockSources}
          onSelect={(id) => {
            console.log('Selected:', id);
            setOpen(false);
          }}
        />
      </div>
    );
  },
};

// ---------------------------------------------------------------------------
// 3. Loading
// ---------------------------------------------------------------------------

export const Loading: Story = {
  name: 'Loading',
  args: {
    open: true,
    loading: true,
    sources: [],
  },
  render: (args) => (
    <ScreenSharePicker {...args} onClose={() => {}} />
  ),
};

// ---------------------------------------------------------------------------
// 4. Skeleton
// ---------------------------------------------------------------------------

export const Skeleton: Story = {
  name: 'Skeleton',
  args: {
    open: true,
    skeleton: true,
  },
  render: (args) => (
    <ScreenSharePicker {...args} onClose={() => {}} />
  ),
};

// ---------------------------------------------------------------------------
// 5. Empty sources
// ---------------------------------------------------------------------------

export const EmptySources: Story = {
  name: 'Empty Sources',
  args: {
    open: true,
    sources: [],
  },
  render: (args) => (
    <ScreenSharePicker {...args} onClose={() => {}} />
  ),
};

// ---------------------------------------------------------------------------
// 6. Custom title
// ---------------------------------------------------------------------------

export const CustomTitle: Story = {
  name: 'Custom Title',
  args: {
    open: true,
    sources: mockSources,
    title: 'Choose what to share',
  },
  render: (args) => (
    <ScreenSharePicker {...args} onClose={() => {}} />
  ),
};
