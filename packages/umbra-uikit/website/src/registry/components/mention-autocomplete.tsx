import React from 'react';
import { MentionAutocomplete, Avatar, VStack, Text } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

const sampleUsers = [
  { id: '1', name: 'Alice Johnson', username: 'alice', avatar: <Avatar name="Alice Johnson" size="sm" />, online: true },
  { id: '2', name: 'Bob Smith', username: 'bob', avatar: <Avatar name="Bob Smith" size="sm" /> },
  { id: '3', name: 'Carol Davis', username: 'carol', avatar: <Avatar name="Carol Davis" size="sm" />, online: true },
  { id: '4', name: 'David Lee', username: 'david', avatar: <Avatar name="David Lee" size="sm" /> },
  { id: '5', name: 'Eve Martinez', username: 'eve', avatar: <Avatar name="Eve Martinez" size="sm" />, online: true },
];

export const mentionAutocompleteEntry: ComponentEntry = {
  slug: 'mention-autocomplete',
  name: 'MentionAutocomplete',
  category: 'components',
  subcategory: 'Chat & Messaging',
  description:
    'Dropdown overlay for @mention user search and selection with avatar, name, username, and keyboard navigation support.',
  variantCount: 1,
  keywords: ['mention', 'autocomplete', 'at', 'user', 'search', 'dropdown', 'suggest'],

  cardPreview: (
    <div style={{ width: '100%', pointerEvents: 'none' }}>
      <MentionAutocomplete
        users={sampleUsers.slice(0, 3)}
        activeIndex={0}
        onSelect={() => {}}
        maxVisible={3}
      />
    </div>
  ),

  examples: [
    {
      title: 'Default',
      render: (
        <VStack gap="md" style={{ width: '100%', maxWidth: 320 }}>
          <MentionAutocomplete
            users={sampleUsers}
            activeIndex={0}
            onSelect={(user) => console.log('Selected:', user.name)}
          />
        </VStack>
      ),
      code: `import { MentionAutocomplete, Avatar } from '@wisp-ui/react';

const users = [
  { id: '1', name: 'Alice', username: 'alice', avatar: <Avatar name="Alice" size="sm" />, online: true },
  { id: '2', name: 'Bob', username: 'bob', avatar: <Avatar name="Bob" size="sm" /> },
];

<MentionAutocomplete
  users={users}
  activeIndex={activeIdx}
  onSelect={(user) => insertMention(user)}
  onActiveIndexChange={setActiveIdx}
/>`,
    },
    {
      title: 'Filtered Results',
      render: (
        <VStack gap="md" style={{ width: '100%', maxWidth: 320 }}>
          <Text size="xs" color="secondary">Query: "@ali"</Text>
          <MentionAutocomplete
            users={sampleUsers.filter(u => u.name.toLowerCase().includes('ali'))}
            query="ali"
            activeIndex={0}
            onSelect={(user) => console.log('Selected:', user.name)}
          />
        </VStack>
      ),
      code: `<MentionAutocomplete
  users={users.filter(u => u.name.includes(query))}
  query="ali"
  activeIndex={0}
  onSelect={handleSelect}
/>`,
    },
    {
      title: 'Empty State',
      render: (
        <VStack gap="md" style={{ width: '100%', maxWidth: 320 }}>
          <MentionAutocomplete
            users={[]}
            query="xyz"
            onSelect={() => {}}
          />
        </VStack>
      ),
      code: `<MentionAutocomplete users={[]} query="xyz" onSelect={handleSelect} />`,
    },
    {
      title: 'Loading',
      render: (
        <VStack gap="md" style={{ width: '100%', maxWidth: 320 }}>
          <MentionAutocomplete
            users={[]}
            loading
            onSelect={() => {}}
          />
        </VStack>
      ),
      code: `<MentionAutocomplete users={[]} loading onSelect={handleSelect} />`,
    },
  ],

  props: [
    { name: 'users', type: 'MentionUser[]', description: 'Filtered list of matching users to display.' },
    { name: 'query', type: 'string', description: 'The current search query (text after "@").' },
    { name: 'activeIndex', type: 'number', default: '0', description: 'Index of the currently highlighted item.' },
    { name: 'onSelect', type: '(user: MentionUser) => void', description: 'Called when a user is selected.' },
    { name: 'onActiveIndexChange', type: '(index: number) => void', description: 'Called when active index changes via keyboard.' },
    { name: 'maxVisible', type: 'number', default: '5', description: 'Maximum visible items before scrolling.' },
    { name: 'open', type: 'boolean', default: 'true', description: 'Whether the dropdown is visible.' },
    { name: 'loading', type: 'boolean', default: 'false', description: 'Show loading state.' },
    { name: 'emptyText', type: 'string', default: "'No users found'", description: 'Text shown when no users match.' },
  ],
};
