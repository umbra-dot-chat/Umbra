import React from 'react';
import { UserSearchResult, Avatar, VStack } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

export const userSearchResultEntry: ComponentEntry = {
  slug: 'user-search-result',
  name: 'UserSearchResult',
  category: 'components',
  subcategory: 'Social',
  description:
    'A search result row for the "Add Friend" flow showing a user with avatar, name, username, mutual friends count, and a contextual button reflecting the current relationship state (Send Request / Pending / Already Friends).',
  variantCount: 2,
  keywords: ['search', 'result', 'user', 'friend', 'request', 'add', 'social', 'find'],

  cardPreview: (
    <div style={{ width: '100%', pointerEvents: 'none' }}>
      <UserSearchResult
        name="Alice Johnson"
        username="@alice"
        requestState="none"
        mutualFriends={5}
        avatar={<Avatar name="Alice Johnson" size="md" />}
      />
    </div>
  ),

  examples: [
    {
      title: 'Default',
      render: (
        <VStack gap="xs" style={{ width: '100%', maxWidth: 400 }}>
          <UserSearchResult
            name="Alice Johnson"
            username="@alice"
            avatar={<Avatar name="Alice Johnson" size="md" />}
            requestState="none"
            mutualFriends={5}
            onSendRequest={() => {}}
          />
          <UserSearchResult
            name="Bob Smith"
            username="@bobsmith"
            avatar={<Avatar name="Bob Smith" size="md" />}
            requestState="pending"
            mutualFriends={2}
          />
          <UserSearchResult
            name="Carol Davis"
            username="@carol"
            avatar={<Avatar name="Carol Davis" size="md" />}
            requestState="friends"
            mutualFriends={12}
          />
        </VStack>
      ),
      code: `import { UserSearchResult, Avatar } from '@wisp-ui/react';

<UserSearchResult
  name="Alice Johnson"
  username="@alice"
  avatar={<Avatar name="Alice Johnson" size="md" />}
  requestState="none"
  mutualFriends={5}
  onSendRequest={() => {}}
/>
<UserSearchResult
  name="Bob Smith"
  username="@bobsmith"
  avatar={<Avatar name="Bob Smith" size="md" />}
  requestState="pending"
/>
<UserSearchResult
  name="Carol Davis"
  username="@carol"
  avatar={<Avatar name="Carol Davis" size="md" />}
  requestState="friends"
/>`,
    },
    {
      title: 'Skeleton',
      render: (
        <VStack gap="xs" style={{ width: '100%', maxWidth: 400 }}>
          <UserSearchResult skeleton name="" />
          <UserSearchResult skeleton name="" />
          <UserSearchResult skeleton name="" />
        </VStack>
      ),
      code: `<UserSearchResult skeleton name="" />`,
    },
  ],

  props: [
    { name: 'name', type: 'string', required: true, description: "User's display name." },
    { name: 'username', type: 'string', description: "Username handle (e.g. '@alice')." },
    { name: 'avatar', type: 'ReactNode', description: 'Avatar element (typically an Avatar component).' },
    { name: 'requestState', type: "'none' | 'pending' | 'friends'", default: "'none'", description: 'Current request / relationship state.' },
    { name: 'mutualFriends', type: 'number', description: 'Number of mutual friends.' },
    { name: 'onSendRequest', type: '() => void', description: "Called when 'Send Request' is pressed (only active in 'none' state)." },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Whether the item is disabled.' },
    { name: 'skeleton', type: 'boolean', default: 'false', description: 'Show loading skeleton.' },
  ],
};
