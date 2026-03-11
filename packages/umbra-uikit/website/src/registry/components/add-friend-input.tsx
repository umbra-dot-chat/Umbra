import React from 'react';
import { AddFriendInput, VStack } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

export const addFriendInputEntry: ComponentEntry = {
  slug: 'add-friend-input',
  name: 'AddFriendInput',
  category: 'components',
  subcategory: 'Social',
  description:
    'A specialised input for sending friend requests by username. Features a submit button and inline feedback messages for success, error, and loading states.',
  variantCount: 4,
  keywords: ['add', 'friend', 'input', 'request', 'username', 'search', 'social', 'form'],

  cardPreview: (
    <div style={{ width: '100%', pointerEvents: 'none' }}>
      <AddFriendInput
        placeholder="Add friend by username..."
        feedbackState="idle"
      />
    </div>
  ),

  examples: [
    {
      title: 'Default',
      render: (
        <VStack gap="md" style={{ width: '100%', maxWidth: 480 }}>
          <AddFriendInput
            placeholder="Add friend by username..."
            onSubmit={() => {}}
          />
        </VStack>
      ),
      code: `import { AddFriendInput } from '@wisp-ui/react';

<AddFriendInput
  placeholder="Add friend by username..."
  onSubmit={(value) => sendFriendRequest(value)}
/>`,
    },
    {
      title: 'Success Feedback',
      render: (
        <VStack gap="md" style={{ width: '100%', maxWidth: 480 }}>
          <AddFriendInput
            value="alice#1234"
            feedbackState="success"
            feedbackMessage="Friend request sent to alice#1234!"
            onSubmit={() => {}}
          />
        </VStack>
      ),
      code: `<AddFriendInput
  value="alice#1234"
  feedbackState="success"
  feedbackMessage="Friend request sent to alice#1234!"
  onSubmit={(value) => sendFriendRequest(value)}
/>`,
    },
    {
      title: 'Error Feedback',
      render: (
        <VStack gap="md" style={{ width: '100%', maxWidth: 480 }}>
          <AddFriendInput
            value="unknownuser"
            feedbackState="error"
            feedbackMessage="Hm, that didn't work. Double-check the username."
            onSubmit={() => {}}
          />
        </VStack>
      ),
      code: `<AddFriendInput
  value="unknownuser"
  feedbackState="error"
  feedbackMessage="Hm, that didn't work. Double-check the username."
  onSubmit={(value) => sendFriendRequest(value)}
/>`,
    },
    {
      title: 'Skeleton',
      render: (
        <VStack gap="md" style={{ width: '100%', maxWidth: 480 }}>
          <AddFriendInput skeleton />
        </VStack>
      ),
      code: `<AddFriendInput skeleton />`,
    },
  ],

  props: [
    { name: 'value', type: 'string', description: 'Current input value (controlled).' },
    { name: 'defaultValue', type: 'string', description: 'Default input value (uncontrolled).' },
    { name: 'placeholder', type: 'string', default: "'Add friend by username...'", description: 'Placeholder text.' },
    { name: 'onValueChange', type: '(value: string) => void', description: 'Called when the input value changes.' },
    { name: 'onSubmit', type: '(value: string) => void', description: 'Called when the user submits (Enter or button click).' },
    { name: 'feedbackState', type: "'idle' | 'loading' | 'success' | 'error'", default: "'idle'", description: 'Current feedback state.' },
    { name: 'feedbackMessage', type: 'string', description: 'Feedback message shown below the input.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Whether the input is disabled.' },
    { name: 'skeleton', type: 'boolean', default: 'false', description: 'Show loading skeleton.' },
  ],
};
