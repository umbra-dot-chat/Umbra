import React from 'react';
import { PinnedMessages, Avatar, VStack } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

const sampleMessages = [
  {
    id: '1',
    sender: 'Alice Chen',
    avatar: <Avatar name="Alice Chen" size="xs" />,
    content: 'Important: New deployment process starts Monday. Please read the updated docs before then.',
    timestamp: 'Jan 12',
    pinnedBy: 'Bob Smith',
  },
  {
    id: '2',
    sender: 'Dave Wilson',
    avatar: <Avatar name="Dave Wilson" size="xs" />,
    content: 'Team standup moved to 10:30 AM starting next week. Calendar invites have been updated.',
    timestamp: 'Jan 8',
    pinnedBy: 'Alice Chen',
  },
  {
    id: '3',
    sender: 'Sarah Lee',
    avatar: <Avatar name="Sarah Lee" size="xs" />,
    content: 'Useful links for onboarding: wiki page, design system docs, and the component library.',
    timestamp: 'Dec 15',
  },
];

export const pinnedMessagesEntry: ComponentEntry = {
  slug: 'pinned-messages',
  name: 'PinnedMessages',
  category: 'components',
  subcategory: 'Chat & Messaging',
  description:
    'Panel listing all pinned messages in a channel or conversation, with click-to-jump and unpin actions.',
  variantCount: 1,
  keywords: ['pinned', 'messages', 'panel', 'channel', 'pin', 'bookmark', 'saved', 'chat'],

  cardPreview: (
    <div style={{ width: '100%', maxWidth: 340, height: 260, overflow: 'hidden', pointerEvents: 'none' }}>
      <PinnedMessages
        messages={sampleMessages.slice(0, 2)}
        title="Pinned Messages"
      />
    </div>
  ),

  examples: [
    {
      title: 'Default',
      render: (
        <div style={{ height: 420, width: '100%', maxWidth: 360 }}>
          <PinnedMessages
            messages={sampleMessages}
            onClose={() => console.log('Close')}
            onMessageClick={(msg) => console.log('Click:', msg.id)}
            onUnpin={(msg) => console.log('Unpin:', msg.id)}
          />
        </div>
      ),
      code: `import { PinnedMessages, Avatar } from '@wisp-ui/react';

<PinnedMessages
  messages={pinnedMessages}
  onClose={() => setOpen(false)}
  onMessageClick={(msg) => scrollToMessage(msg.id)}
  onUnpin={(msg) => unpinMessage(msg.id)}
/>`,
    },
    {
      title: 'Empty State',
      render: (
        <div style={{ height: 300, width: '100%', maxWidth: 360 }}>
          <PinnedMessages
            messages={[]}
            onClose={() => {}}
          />
        </div>
      ),
      code: `<PinnedMessages
  messages={[]}
  onClose={() => setOpen(false)}
/>`,
    },
    {
      title: 'Loading',
      render: (
        <div style={{ height: 300, width: '100%', maxWidth: 360 }}>
          <PinnedMessages
            messages={[]}
            loading
            onClose={() => {}}
          />
        </div>
      ),
      code: `<PinnedMessages
  messages={[]}
  loading
  onClose={() => setOpen(false)}
/>`,
    },
    {
      title: 'Without Unpin',
      render: (
        <div style={{ height: 380, width: '100%', maxWidth: 360 }}>
          <PinnedMessages
            messages={sampleMessages}
            onClose={() => {}}
            onMessageClick={(msg) => console.log('Click:', msg.id)}
          />
        </div>
      ),
      code: `<PinnedMessages
  messages={pinnedMessages}
  onClose={() => setOpen(false)}
  onMessageClick={(msg) => scrollToMessage(msg.id)}
/>`,
    },
  ],

  props: [
    { name: 'messages', type: 'PinnedMessage[]', description: 'Array of pinned messages to display.' },
    { name: 'onClose', type: '() => void', description: 'Called when the close button is clicked.' },
    { name: 'onMessageClick', type: '(message: PinnedMessage) => void', description: 'Called when a pinned message card is clicked (e.g. jump to message).' },
    { name: 'onUnpin', type: '(message: PinnedMessage) => void', description: 'Called when the unpin button is clicked.' },
    { name: 'title', type: 'string', default: "'Pinned Messages'", description: 'Title text for the panel header.' },
    { name: 'loading', type: 'boolean', default: 'false', description: 'Whether to show a loading state.' },
    { name: 'emptyText', type: 'string', default: "'No pinned messages'", description: 'Text shown when there are no pinned messages.' },
    { name: 'emptyIcon', type: 'ReactNode', description: 'Icon or element shown in the empty state.' },
  ],
};
