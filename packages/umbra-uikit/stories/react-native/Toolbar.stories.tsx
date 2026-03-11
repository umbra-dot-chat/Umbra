import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Toolbar, ToolbarGroup, ToolbarSeparator, Button } from '@wisp-ui/react-native';

const meta: Meta<typeof Toolbar> = {
  title: 'React Native/Components/Utilities/Toolbar',
  component: Toolbar,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    variant: { control: 'select', options: ['elevated', 'pill', 'transparent'] },
  },
};

export default meta;
type Story = StoryObj<typeof Toolbar>;

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  name: 'Default',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Elevated (default)</div>
      <Toolbar>
        <Button variant="tertiary" size="sm">Cut</Button>
        <Button variant="tertiary" size="sm">Copy</Button>
        <Button variant="tertiary" size="sm">Paste</Button>
      </Toolbar>

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginTop: 8 }}>Pill</div>
      <Toolbar variant="pill">
        <Button variant="tertiary" size="sm">Cut</Button>
        <Button variant="tertiary" size="sm">Copy</Button>
        <Button variant="tertiary" size="sm">Paste</Button>
      </Toolbar>

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginTop: 8 }}>Transparent</div>
      <Toolbar variant="transparent">
        <Button variant="tertiary" size="sm">Cut</Button>
        <Button variant="tertiary" size="sm">Copy</Button>
        <Button variant="tertiary" size="sm">Paste</Button>
      </Toolbar>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 2. With Groups
// ---------------------------------------------------------------------------

export const WithGroups: Story = {
  name: 'With Groups',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Grouped Actions</div>
      <Toolbar>
        <ToolbarGroup>
          <Button variant="tertiary" size="sm">Bold</Button>
          <Button variant="tertiary" size="sm">Italic</Button>
          <Button variant="tertiary" size="sm">Underline</Button>
        </ToolbarGroup>
        <ToolbarGroup>
          <Button variant="tertiary" size="sm">Left</Button>
          <Button variant="tertiary" size="sm">Center</Button>
          <Button variant="tertiary" size="sm">Right</Button>
        </ToolbarGroup>
      </Toolbar>

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginTop: 8 }}>Custom Gap</div>
      <Toolbar variant="pill">
        <ToolbarGroup gap="md">
          <Button variant="tertiary" size="sm">Undo</Button>
          <Button variant="tertiary" size="sm">Redo</Button>
        </ToolbarGroup>
        <ToolbarGroup gap="sm">
          <Button variant="tertiary" size="sm">Save</Button>
          <Button variant="tertiary" size="sm">Export</Button>
        </ToolbarGroup>
      </Toolbar>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. With Separator
// ---------------------------------------------------------------------------

export const WithSeparator: Story = {
  name: 'With Separator',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Separator Between Groups</div>
      <Toolbar>
        <ToolbarGroup>
          <Button variant="tertiary" size="sm">Bold</Button>
          <Button variant="tertiary" size="sm">Italic</Button>
          <Button variant="tertiary" size="sm">Underline</Button>
        </ToolbarGroup>
        <ToolbarSeparator />
        <ToolbarGroup>
          <Button variant="tertiary" size="sm">Left</Button>
          <Button variant="tertiary" size="sm">Center</Button>
          <Button variant="tertiary" size="sm">Right</Button>
        </ToolbarGroup>
        <ToolbarSeparator />
        <ToolbarGroup>
          <Button variant="tertiary" size="sm">Link</Button>
          <Button variant="tertiary" size="sm">Image</Button>
        </ToolbarGroup>
      </Toolbar>

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginTop: 8 }}>Pill With Separators</div>
      <Toolbar variant="pill">
        <ToolbarGroup>
          <Button variant="tertiary" size="sm">File</Button>
          <Button variant="tertiary" size="sm">Edit</Button>
        </ToolbarGroup>
        <ToolbarSeparator />
        <ToolbarGroup>
          <Button variant="tertiary" size="sm">View</Button>
          <Button variant="tertiary" size="sm">Help</Button>
        </ToolbarGroup>
      </Toolbar>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 4. Sizes
// ---------------------------------------------------------------------------

export const Sizes: Story = {
  name: 'Sizes',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <div key={size}>
          <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{size}</div>
          <Toolbar size={size}>
            <ToolbarGroup>
              <Button variant="tertiary" size="sm">Cut</Button>
              <Button variant="tertiary" size="sm">Copy</Button>
              <Button variant="tertiary" size="sm">Paste</Button>
            </ToolbarGroup>
            <ToolbarSeparator />
            <Button variant="tertiary" size="sm">Undo</Button>
          </Toolbar>
        </div>
      ))}
    </div>
  ),
};
