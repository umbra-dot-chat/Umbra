import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  Button,
  Text,
} from '@wisp-ui/react-native';

const meta: Meta<typeof DropdownMenu> = {
  title: 'React Native/Components/Overlays/DropdownMenu',
  component: DropdownMenu,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof DropdownMenu>;

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  name: 'Default',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Basic menu</div>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button>Open menu</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={() => {}}>Profile</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => {}}>Settings</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => {}}>Help</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 2. With Separators
// ---------------------------------------------------------------------------

export const WithSeparators: Story = {
  name: 'With Separators',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Grouped items with separators</div>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button>Actions</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={() => {}}>New file</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => {}}>New folder</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => {}}>Download</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => {}}>Share</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => {}} disabled>Archive</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => {}} danger>Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. With Icons
// ---------------------------------------------------------------------------

export const WithIcons: Story = {
  name: 'With Icons',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Items with leading icons</div>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button>Account</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={() => {}} icon={<Text style={{ fontSize: 14 }}>{'\u{1F464}'}</Text>}>
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => {}} icon={<Text style={{ fontSize: 14 }}>{'\u2699'}</Text>}>
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => {}} icon={<Text style={{ fontSize: 14 }}>{'\u2709'}</Text>}>
            Messages
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => {}} icon={<Text style={{ fontSize: 14 }}>{'\u2190'}</Text>} danger>
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ),
};
