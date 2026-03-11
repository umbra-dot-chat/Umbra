import React from 'react';
import { FriendSection, FriendListItem, Avatar, VStack } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

export const friendSectionEntry: ComponentEntry = {
  slug: 'friend-section',
  name: 'FriendSection',
  category: 'components',
  subcategory: 'Social',
  description:
    'A collapsible section header with count badge that groups FriendListItem or FriendRequestItem children. Supports controlled and uncontrolled collapsed state with an optional empty message.',
  variantCount: 3,
  keywords: ['friend', 'section', 'group', 'collapsible', 'header', 'list', 'social'],

  cardPreview: (
    <div style={{ width: '100%', pointerEvents: 'none' }}>
      <FriendSection title="Online" count={3}>
        <FriendListItem
          name="Alice Johnson"
          username="@alice"
          status="online"
          avatar={<Avatar name="Alice Johnson" size="md" />}
        />
      </FriendSection>
    </div>
  ),

  examples: [
    {
      title: 'Default',
      render: (
        <VStack gap="md" style={{ width: '100%', maxWidth: 400 }}>
          <FriendSection title="Online" count={2}>
            <FriendListItem
              name="Alice Johnson"
              username="@alice"
              avatar={<Avatar name="Alice Johnson" size="md" />}
              status="online"
              statusText="Playing Valorant"
            />
            <FriendListItem
              name="Bob Smith"
              username="@bobsmith"
              avatar={<Avatar name="Bob Smith" size="md" />}
              status="online"
            />
          </FriendSection>
          <FriendSection title="Offline" count={1}>
            <FriendListItem
              name="Carol Davis"
              username="@carol"
              avatar={<Avatar name="Carol Davis" size="md" />}
              status="offline"
            />
          </FriendSection>
        </VStack>
      ),
      code: `import { FriendSection, FriendListItem, Avatar } from '@wisp-ui/react';

<FriendSection title="Online" count={2}>
  <FriendListItem
    name="Alice Johnson"
    username="@alice"
    avatar={<Avatar name="Alice Johnson" size="md" />}
    status="online"
    statusText="Playing Valorant"
  />
  <FriendListItem
    name="Bob Smith"
    username="@bobsmith"
    avatar={<Avatar name="Bob Smith" size="md" />}
    status="online"
  />
</FriendSection>`,
    },
    {
      title: 'Collapsed',
      render: (
        <VStack gap="md" style={{ width: '100%', maxWidth: 400 }}>
          <FriendSection title="Online" count={3} defaultCollapsed={false}>
            <FriendListItem
              name="Alice Johnson"
              username="@alice"
              avatar={<Avatar name="Alice Johnson" size="md" />}
              status="online"
            />
          </FriendSection>
          <FriendSection title="Offline" count={5} defaultCollapsed>
            <FriendListItem
              name="Dave Wilson"
              username="@dave"
              avatar={<Avatar name="Dave Wilson" size="md" />}
              status="offline"
            />
          </FriendSection>
        </VStack>
      ),
      code: `<FriendSection title="Online" count={3}>
  {/* children visible */}
</FriendSection>

<FriendSection title="Offline" count={5} defaultCollapsed>
  {/* children hidden until expanded */}
</FriendSection>`,
    },
    {
      title: 'Empty State',
      render: (
        <VStack gap="md" style={{ width: '100%', maxWidth: 400 }}>
          <FriendSection
            title="Online"
            count={0}
            emptyMessage="No friends online right now."
          />
        </VStack>
      ),
      code: `<FriendSection
  title="Online"
  count={0}
  emptyMessage="No friends online right now."
/>`,
    },
  ],

  props: [
    { name: 'title', type: 'string', required: true, description: "Section title (e.g. 'Online', 'Pending Requests')." },
    { name: 'count', type: 'number', description: 'Item count displayed next to the title.' },
    { name: 'defaultCollapsed', type: 'boolean', default: 'false', description: 'Whether the section is initially collapsed.' },
    { name: 'collapsed', type: 'boolean', description: 'Controlled collapsed state.' },
    { name: 'onCollapsedChange', type: '(collapsed: boolean) => void', description: 'Callback when collapsed state changes.' },
    { name: 'children', type: 'ReactNode', description: 'Content (typically FriendListItem / FriendRequestItem children).' },
    { name: 'emptyMessage', type: 'string', description: 'Message shown when the section has no children.' },
  ],
};
