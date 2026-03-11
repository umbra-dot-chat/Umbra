import React from 'react';
import { ThreadPanel, Avatar, VStack } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

const parentMessage = {
  id: '1',
  sender: 'Alice Chen',
  content: 'Has anyone looked into the new API rate limiting changes? I think we need to update our retry logic.',
  timestamp: '2:30 PM',
  avatar: <Avatar name="Alice Chen" size="sm" />,
};

const replies = [
  {
    id: '2',
    sender: 'Bob Smith',
    content: 'Yes, I saw the changelog. The new limits are 100 req/min for free tier. We should add exponential backoff.',
    timestamp: '2:35 PM',
    avatar: <Avatar name="Bob Smith" size="sm" />,
  },
  {
    id: '3',
    sender: 'Alice Chen',
    content: "Good point. I'll create a ticket for it.",
    timestamp: '2:37 PM',
    avatar: <Avatar name="Alice Chen" size="sm" />,
    isOwn: true,
  },
];

export const threadPanelEntry: ComponentEntry = {
  slug: 'thread-panel',
  name: 'ThreadPanel',
  category: 'components',
  subcategory: 'Chat & Messaging',
  description:
    'Side panel for threaded message replies with parent message, reply chain, and input. Inspired by Slack and Discord threads.',
  variantCount: 1,
  keywords: ['thread', 'panel', 'reply', 'message', 'sidebar', 'chat', 'conversation', 'slack', 'discord'],

  cardPreview: (
    <div style={{ width: '100%', maxWidth: 340, height: 260, overflow: 'hidden', pointerEvents: 'none' }}>
      <ThreadPanel
        parentMessage={parentMessage}
        replies={replies.slice(0, 1)}
        title="Thread"
      />
    </div>
  ),

  examples: [
    {
      title: 'Default',
      render: (
        <div style={{ height: 400, width: '100%', maxWidth: 380 }}>
          <ThreadPanel
            parentMessage={parentMessage}
            replies={replies}
            onClose={() => console.log('Close')}
            onReply={(text) => console.log('Reply:', text)}
          />
        </div>
      ),
      code: `import { ThreadPanel, Avatar } from '@wisp-ui/react';

<ThreadPanel
  parentMessage={{
    id: '1',
    sender: 'Alice Chen',
    content: 'Has anyone looked into the API changes?',
    timestamp: '2:30 PM',
    avatar: <Avatar name="Alice Chen" size="sm" />,
  }}
  replies={replies}
  onClose={() => setOpen(false)}
  onReply={(text) => sendReply(text)}
/>`,
    },
    {
      title: 'Loading State',
      render: (
        <div style={{ height: 300, width: '100%', maxWidth: 380 }}>
          <ThreadPanel
            parentMessage={parentMessage}
            replies={[]}
            loading
            onClose={() => {}}
          />
        </div>
      ),
      code: `<ThreadPanel
  parentMessage={parentMessage}
  replies={[]}
  loading
  onClose={() => setOpen(false)}
/>`,
    },
    {
      title: 'Custom Reply Count',
      render: (
        <div style={{ height: 350, width: '100%', maxWidth: 380 }}>
          <ThreadPanel
            parentMessage={parentMessage}
            replies={replies}
            replyCount={42}
            onClose={() => {}}
            onReply={(text) => console.log('Reply:', text)}
          />
        </div>
      ),
      code: `<ThreadPanel
  parentMessage={parentMessage}
  replies={loadedReplies}
  replyCount={42}
  onClose={() => setOpen(false)}
  onReply={sendReply}
/>`,
    },
  ],

  props: [
    { name: 'parentMessage', type: 'ThreadMessage', description: 'The parent message that started the thread.' },
    { name: 'replies', type: 'ThreadMessage[]', description: 'Array of reply messages in the thread.' },
    { name: 'replyCount', type: 'number', description: 'Total reply count (may differ from replies.length if paginated).' },
    { name: 'onClose', type: '() => void', description: 'Called when the close button is clicked.' },
    { name: 'onReply', type: '(text: string) => void', description: 'Called when a new reply is submitted. Hides input if not provided.' },
    { name: 'title', type: 'string', default: "'Thread'", description: 'Title text for the panel header.' },
    { name: 'sending', type: 'boolean', default: 'false', description: 'Whether the reply input is in a sending state.' },
    { name: 'placeholder', type: 'string', default: "'Reply...'", description: 'Placeholder text for the reply input.' },
    { name: 'loading', type: 'boolean', default: 'false', description: 'Whether to show a loading state for replies.' },
    { name: 'renderMessage', type: '(msg: ThreadMessage) => ReactNode', description: 'Custom renderer for each message.' },
  ],
};
