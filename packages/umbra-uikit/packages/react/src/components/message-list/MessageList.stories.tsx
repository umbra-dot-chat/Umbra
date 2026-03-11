import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { MessageList } from './MessageList';
import type { MessageListEntry } from '@coexist/wisp-core/types/MessageList.types';

const meta: Meta<typeof MessageList> = {
  title: 'Components/Community/MessageList',
  component: MessageList,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ height: 500, maxWidth: 600, border: '1px solid #333', borderRadius: 8 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof MessageList>;

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

const defaultEntries: MessageListEntry[] = [
  {
    type: 'message',
    id: '1',
    sender: 'Alice',
    content: 'Hey everyone! Welcome to the channel.',
    timestamp: '2:30 PM',
  },
  {
    type: 'message',
    id: '2',
    sender: 'Alice',
    content: 'Feel free to introduce yourselves.',
    timestamp: '2:31 PM',
  },
  {
    type: 'message',
    id: '3',
    sender: 'Bob',
    content: 'Thanks Alice! Excited to be here.',
    timestamp: '2:32 PM',
  },
  {
    type: 'message',
    id: '4',
    sender: 'You',
    content: 'Hi all! Looking forward to collaborating.',
    timestamp: '2:33 PM',
    isOwn: true,
  },
  {
    type: 'message',
    id: '5',
    sender: 'Charlie',
    content: 'Hey folks! Glad to join this community.',
    timestamp: '2:34 PM',
  },
  {
    type: 'message',
    id: '6',
    sender: 'Charlie',
    content: 'Anyone working on the new feature?',
    timestamp: '2:35 PM',
  },
  {
    type: 'message',
    id: '7',
    sender: 'You',
    content: 'Yes, I started on it yesterday!',
    timestamp: '2:36 PM',
    isOwn: true,
  },
  {
    type: 'message',
    id: '8',
    sender: 'You',
    content: 'Should have a PR up by end of day.',
    timestamp: '2:36 PM',
    isOwn: true,
  },
];

const separatorEntries: MessageListEntry[] = [
  { type: 'separator', label: 'Yesterday' },
  {
    type: 'message',
    id: '1',
    sender: 'Alice',
    content: 'Let me know when the docs are ready.',
    timestamp: '11:45 AM',
  },
  {
    type: 'message',
    id: '2',
    sender: 'Bob',
    content: 'Will do!',
    timestamp: '11:50 AM',
    isOwn: true,
  },
  { type: 'separator', label: 'Today' },
  {
    type: 'message',
    id: '3',
    sender: 'Alice',
    content: 'Good morning! Any updates?',
    timestamp: '9:00 AM',
  },
  { type: 'new-messages' },
  {
    type: 'message',
    id: '4',
    sender: 'Bob',
    content: 'Docs are ready for review.',
    timestamp: '9:15 AM',
    isOwn: true,
  },
  {
    type: 'message',
    id: '5',
    sender: 'Alice',
    content: 'Awesome, reviewing now!',
    timestamp: '9:20 AM',
  },
  {
    type: 'message',
    id: '6',
    sender: 'Charlie',
    content: 'Nice work, team.',
    timestamp: '9:25 AM',
  },
];

// ---------------------------------------------------------------------------
// Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  name: 'Default',
  render: () => <MessageList entries={defaultEntries} />,
};

// ---------------------------------------------------------------------------
// WithSeparators
// ---------------------------------------------------------------------------

export const WithSeparators: Story = {
  name: 'WithSeparators',
  render: () => <MessageList entries={separatorEntries} />,
};

// ---------------------------------------------------------------------------
// Empty
// ---------------------------------------------------------------------------

export const Empty: Story = {
  name: 'Empty',
  render: () => <MessageList entries={[]} />,
};

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------

export const Loading: Story = {
  name: 'Loading',
  render: () => (
    <MessageList
      entries={defaultEntries}
      loadingMore
      hasMore
      onLoadMore={() => {}}
    />
  ),
};
