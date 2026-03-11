import React from 'react';
import { NewMessageDivider, VStack, ChatBubble, Text } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

export const newMessageDividerEntry: ComponentEntry = {
  slug: 'new-message-divider',
  name: 'NewMessageDivider',
  category: 'components',
  subcategory: 'Chat & Messaging',
  description:
    'A horizontal divider that marks the boundary between read and unread messages. Renders a colored line with a centered label.',
  variantCount: 1,
  keywords: ['divider', 'new', 'message', 'unread', 'separator', 'chat', 'indicator'],

  cardPreview: (
    <div style={{ width: '100%', maxWidth: 220, pointerEvents: 'none' }}>
      <NewMessageDivider />
    </div>
  ),

  examples: [
    {
      title: 'Default',
      render: (
        <VStack gap="sm" style={{ maxWidth: 400 }}>
          <div style={{ alignSelf: 'flex-start' }}>
            <ChatBubble align="incoming" timestamp="Yesterday">
              See you tomorrow!
            </ChatBubble>
          </div>
          <NewMessageDivider />
          <div style={{ alignSelf: 'flex-start' }}>
            <ChatBubble align="incoming" timestamp="2:30 PM">
              Good morning! Ready for the standup?
            </ChatBubble>
          </div>
        </VStack>
      ),
      code: `import { NewMessageDivider, ChatBubble } from '@wisp-ui/react';

<ChatBubble align="incoming" timestamp="Yesterday">
  See you tomorrow!
</ChatBubble>

<NewMessageDivider />

<ChatBubble align="incoming" timestamp="2:30 PM">
  Good morning! Ready for the standup?
</ChatBubble>`,
      rnCode: `import { NewMessageDivider, ChatBubble } from '@wisp-ui/react-native';

<ChatBubble align="incoming" timestamp="Yesterday">
  See you tomorrow!
</ChatBubble>

<NewMessageDivider />

<ChatBubble align="incoming" timestamp="2:30 PM">
  Good morning! Ready for the standup?
</ChatBubble>`,
    },
    {
      title: 'Custom Label',
      render: (
        <VStack gap="md" style={{ maxWidth: 400 }}>
          <NewMessageDivider label="3 new messages" />
          <NewMessageDivider label="Unread" />
        </VStack>
      ),
      code: `<NewMessageDivider label="3 new messages" />
<NewMessageDivider label="Unread" />`,
      rnCode: `import { NewMessageDivider } from '@wisp-ui/react-native';

<NewMessageDivider label="3 new messages" />
<NewMessageDivider label="Unread" />`,
    },
    {
      title: 'Custom Color',
      render: (
        <VStack gap="md" style={{ maxWidth: 400 }}>
          <NewMessageDivider color="#6366f1" label="New" />
          <NewMessageDivider color="#f59e0b" label="Warnings" />
          <NewMessageDivider color="#22c55e" label="Resolved" />
        </VStack>
      ),
      code: `<NewMessageDivider color="#6366f1" label="New" />
<NewMessageDivider color="#f59e0b" label="Warnings" />
<NewMessageDivider color="#22c55e" label="Resolved" />`,
      rnCode: `import { NewMessageDivider } from '@wisp-ui/react-native';

<NewMessageDivider color="#6366f1" label="New" />
<NewMessageDivider color="#f59e0b" label="Warnings" />
<NewMessageDivider color="#22c55e" label="Resolved" />`,
    },
  ],

  props: [
    { name: 'label', type: 'string', default: "'New'", description: 'Label text displayed in the center of the divider.' },
    { name: 'color', type: 'string', description: 'Color override for the line and label. Defaults to the theme danger color (red).' },
  ],
};
