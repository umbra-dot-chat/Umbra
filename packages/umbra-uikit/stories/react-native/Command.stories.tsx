import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  Command,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandEmpty,
} from '@wisp-ui/react-native';

const meta: Meta<typeof Command> = {
  title: 'React Native/Components/Utilities/Command',
  component: Command,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    loading: { control: 'boolean' },
    closeOnSelect: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Command>;

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  name: 'Default',
  render: () => {
    const [open, setOpen] = useState(true);
    return (
      <div style={{ minHeight: 400 }}>
        <button onClick={() => setOpen(true)} style={{ marginBottom: 16, padding: '8px 16px', cursor: 'pointer' }}>
          Open Command
        </button>
        <Command open={open} onOpenChange={setOpen}>
          <CommandInput placeholder="Type a command or search..." />
          <CommandList>
            <CommandItem value="calendar">Calendar</CommandItem>
            <CommandItem value="search">Search</CommandItem>
            <CommandItem value="settings">Settings</CommandItem>
            <CommandItem value="profile">Profile</CommandItem>
          </CommandList>
        </Command>
      </div>
    );
  },
};

// ---------------------------------------------------------------------------
// 2. With Groups
// ---------------------------------------------------------------------------

export const WithGroups: Story = {
  name: 'With Groups',
  render: () => {
    const [open, setOpen] = useState(true);
    return (
      <div style={{ minHeight: 500 }}>
        <button onClick={() => setOpen(true)} style={{ marginBottom: 16, padding: '8px 16px', cursor: 'pointer' }}>
          Open Command
        </button>
        <Command open={open} onOpenChange={setOpen}>
          <CommandInput placeholder="Search commands..." />
          <CommandList>
            <CommandGroup heading="Suggestions">
              <CommandItem value="calendar" keywords={['date', 'schedule']}>Calendar</CommandItem>
              <CommandItem value="search" keywords={['find', 'lookup']}>Search</CommandItem>
              <CommandItem value="emoji" keywords={['smiley', 'face']}>Emoji</CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Settings">
              <CommandItem value="profile" description="Manage your profile">Profile</CommandItem>
              <CommandItem value="billing" description="View billing info">Billing</CommandItem>
              <CommandItem value="preferences" description="App preferences">Preferences</CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Actions">
              <CommandItem value="new-file">New File</CommandItem>
              <CommandItem value="new-folder">New Folder</CommandItem>
              <CommandItem value="export">Export</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </div>
    );
  },
};

// ---------------------------------------------------------------------------
// 3. Empty
// ---------------------------------------------------------------------------

export const Empty: Story = {
  name: 'Empty',
  render: () => {
    const [open, setOpen] = useState(true);
    return (
      <div style={{ minHeight: 300 }}>
        <button onClick={() => setOpen(true)} style={{ marginBottom: 16, padding: '8px 16px', cursor: 'pointer' }}>
          Open Command
        </button>
        <Command open={open} onOpenChange={setOpen}>
          <CommandInput placeholder="Search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
          </CommandList>
        </Command>
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
    const [openSize, setOpenSize] = useState<'sm' | 'md' | 'lg' | null>('md');
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minHeight: 400 }}>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Select a size</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setOpenSize('sm')} style={{ padding: '8px 16px', cursor: 'pointer' }}>Small</button>
          <button onClick={() => setOpenSize('md')} style={{ padding: '8px 16px', cursor: 'pointer' }}>Medium</button>
          <button onClick={() => setOpenSize('lg')} style={{ padding: '8px 16px', cursor: 'pointer' }}>Large</button>
        </div>
        {openSize && (
          <Command open={true} onOpenChange={() => setOpenSize(null)} size={openSize}>
            <CommandInput placeholder={`Size: ${openSize}`} />
            <CommandList>
              <CommandItem value="item-1">Item One</CommandItem>
              <CommandItem value="item-2">Item Two</CommandItem>
              <CommandItem value="item-3">Item Three</CommandItem>
            </CommandList>
          </Command>
        )}
      </div>
    );
  },
};

// ---------------------------------------------------------------------------
// 5. With Disabled Items
// ---------------------------------------------------------------------------

export const WithDisabledItems: Story = {
  name: 'With Disabled Items',
  render: () => {
    const [open, setOpen] = useState(true);
    return (
      <div style={{ minHeight: 400 }}>
        <button onClick={() => setOpen(true)} style={{ marginBottom: 16, padding: '8px 16px', cursor: 'pointer' }}>
          Open Command
        </button>
        <Command open={open} onOpenChange={setOpen}>
          <CommandInput placeholder="Search..." />
          <CommandList>
            <CommandGroup heading="Actions">
              <CommandItem value="save">Save</CommandItem>
              <CommandItem value="save-as">Save As</CommandItem>
              <CommandItem value="delete" disabled>Delete (disabled)</CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Navigation">
              <CommandItem value="home">Home</CommandItem>
              <CommandItem value="dashboard" disabled>Dashboard (disabled)</CommandItem>
              <CommandItem value="settings">Settings</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </div>
    );
  },
};
