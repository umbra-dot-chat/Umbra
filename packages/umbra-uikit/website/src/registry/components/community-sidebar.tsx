import React, { useState } from 'react';
import { CommunitySidebar, useThemeColors } from '@wisp-ui/react';
import type { CommunitySpace, CommunityInfo } from '@wisp-ui/react';
import type { ChannelCategory } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

const community: CommunityInfo = {
  name: 'Umbra Community',
  subtitle: '1,284 members',
};

const spaces: CommunitySpace[] = [
  { id: 'general', name: 'General' },
  { id: 'dev', name: 'Development', unreadCount: 5 },
  { id: 'social', name: 'Social' },
];

const generalCategories: ChannelCategory[] = [
  {
    id: 'info',
    label: 'INFORMATION',
    channels: [
      { id: 'welcome', name: 'welcome', type: 'welcome' },
      { id: 'rules', name: 'rules', type: 'announcement' },
    ],
  },
  {
    id: 'text',
    label: 'TEXT CHANNELS',
    channels: [
      { id: 'general', name: 'general', type: 'text', active: true },
      { id: 'random', name: 'random', type: 'text', unreadCount: 3 },
    ],
  },
  {
    id: 'voice',
    label: 'VOICE CHANNELS',
    channels: [
      { id: 'lounge', name: 'Lounge', type: 'voice' },
    ],
  },
];

const devCategories: ChannelCategory[] = [
  {
    id: 'dev-text',
    label: 'DEV CHANNELS',
    channels: [
      { id: 'frontend', name: 'frontend', type: 'text', active: true },
      { id: 'backend', name: 'backend', type: 'text', unreadCount: 2 },
      { id: 'design', name: 'design', type: 'text' },
    ],
  },
  {
    id: 'resources',
    label: 'RESOURCES',
    channels: [
      { id: 'docs', name: 'documentation', type: 'files' },
      { id: 'releases', name: 'releases', type: 'announcement' },
    ],
  },
];

const socialCategories: ChannelCategory[] = [
  {
    id: 'hangout',
    label: 'HANGOUT',
    channels: [
      { id: 'off-topic', name: 'off-topic', type: 'text', active: true },
      { id: 'gaming', name: 'gaming', type: 'text' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Demo components
// ---------------------------------------------------------------------------

function InteractiveDemo() {
  const [activeSpace, setActiveSpace] = useState('general');

  const categoryMap: Record<string, ChannelCategory[]> = {
    general: generalCategories,
    dev: devCategories,
    social: socialCategories,
  };

  return (
    <div style={{ width: 240, height: 420, borderRadius: 8, overflow: 'hidden' }}>
      <CommunitySidebar
        community={community}
        spaces={spaces}
        activeSpaceId={activeSpace}
        onSpaceChange={setActiveSpace}
        categories={categoryMap[activeSpace] ?? []}
        onChannelClick={() => {}}
        onChannelCreate={() => {}}
        onCommunityClick={() => {}}
      />
    </div>
  );
}

function SingleSpaceDemo() {
  return (
    <div style={{ width: 240, height: 320, borderRadius: 8, overflow: 'hidden' }}>
      <CommunitySidebar
        community={{ name: 'Small Project', subtitle: '12 members' }}
        spaces={[{ id: 'main', name: 'Main' }]}
        activeSpaceId="main"
        categories={generalCategories}
        onChannelClick={() => {}}
      />
    </div>
  );
}

function SkeletonDemo() {
  return (
    <div style={{ width: 240, height: 320, borderRadius: 8, overflow: 'hidden' }}>
      <CommunitySidebar
        community={community}
        spaces={spaces}
        activeSpaceId="general"
        categories={[]}
        skeleton
      />
    </div>
  );
}

function CommunitySidebarPreview() {
  const colors = useThemeColors();
  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        padding: 12,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          width: 160,
          borderRadius: 8,
          border: `1px solid ${colors.border.subtle}`,
          backgroundColor: colors.background.surface,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '8px 10px',
            borderBottom: `1px solid ${colors.border.subtle}`,
            fontSize: 11,
            fontWeight: 600,
            color: colors.text.primary,
          }}
        >
          Community
        </div>
        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            gap: 0,
            borderBottom: `1px solid ${colors.border.subtle}`,
            padding: '0 4px',
          }}
        >
          <div
            style={{
              fontSize: 9,
              padding: '4px 6px',
              color: colors.text.primary,
              fontWeight: 600,
              borderBottom: `2px solid ${colors.accent.primary}`,
            }}
          >
            General
          </div>
          <div
            style={{
              fontSize: 9,
              padding: '4px 6px',
              color: colors.text.muted,
              fontWeight: 400,
            }}
          >
            Dev
          </div>
        </div>
        {/* Channels */}
        <div style={{ padding: '6px 0' }}>
          <div style={{ fontSize: 8, color: colors.text.muted, padding: '2px 10px', textTransform: 'uppercase', fontWeight: 600 }}>
            Channels
          </div>
          <div
            style={{
              fontSize: 9,
              padding: '3px 10px',
              color: colors.text.primary,
              backgroundColor: colors.accent.highlight,
              borderRadius: 4,
              margin: '1px 6px',
            }}
          >
            # general
          </div>
          <div
            style={{
              fontSize: 9,
              padding: '3px 10px',
              color: colors.text.secondary,
              margin: '1px 6px',
            }}
          >
            # random
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Registry entry
// ---------------------------------------------------------------------------

export const communitySidebarEntry: ComponentEntry = {
  slug: 'community-sidebar',
  name: 'CommunitySidebar',
  category: 'components',
  subcategory: 'Community',
  description:
    'Community navigation panel with space tabs at the top and a channel list below. Renders inside an existing sidebar container.',
  variantCount: 4,
  keywords: [
    'community', 'sidebar', 'navigation', 'space', 'channel',
    'tab', 'server', 'category', 'list',
  ],

  cardPreview: <CommunitySidebarPreview />,

  examples: [
    {
      title: 'Interactive',
      render: <InteractiveDemo />,
      code: `import { CommunitySidebar } from '@wisp-ui/react';

const [activeSpace, setActiveSpace] = useState('general');

<CommunitySidebar
  community={{ name: 'Umbra', subtitle: '1,284 members' }}
  spaces={[
    { id: 'general', name: 'General' },
    { id: 'dev', name: 'Development', unreadCount: 5 },
  ]}
  activeSpaceId={activeSpace}
  onSpaceChange={setActiveSpace}
  categories={categoriesForActiveSpace}
  onChannelClick={(ch) => setActiveChannel(ch.id)}
  onChannelCreate={(catId) => openCreateChannel(catId)}
  onCommunityClick={() => openSettings()}
/>`,
    },
    {
      title: 'Single Space',
      render: <SingleSpaceDemo />,
      code: `<CommunitySidebar
  community={{ name: 'Small Project', subtitle: '12 members' }}
  spaces={[{ id: 'main', name: 'Main' }]}
  activeSpaceId="main"
  categories={categories}
  onChannelClick={(ch) => setActiveChannel(ch.id)}
/>`,
    },
    {
      title: 'Skeleton',
      render: <SkeletonDemo />,
      code: `<CommunitySidebar
  community={community}
  spaces={spaces}
  activeSpaceId="general"
  categories={[]}
  skeleton
/>`,
    },
  ],

  props: [
    { name: 'community', type: 'CommunityInfo', required: true, description: 'Community metadata (name, icon, subtitle) for the header.' },
    { name: 'spaces', type: 'CommunitySpace[]', required: true, description: 'Available spaces within the community.' },
    { name: 'activeSpaceId', type: 'string', required: true, description: 'Currently active space ID.' },
    { name: 'onSpaceChange', type: '(spaceId: string) => void', description: 'Called when the user selects a different space tab.' },
    { name: 'categories', type: 'ChannelCategory[]', required: true, description: 'Channel categories for the currently active space.' },
    { name: 'onChannelClick', type: '(channel: ChannelItem) => void', description: 'Called when a channel is clicked.' },
    { name: 'onCategoryToggle', type: '(categoryId: string) => void', description: 'Called when a category collapse state toggles.' },
    { name: 'onChannelCreate', type: '(categoryId: string) => void', description: 'Called when the + button is clicked on a category header to create a new channel.' },
    { name: 'onCommunityClick', type: '() => void', description: 'Called when the community header is clicked (e.g. open settings).' },
    { name: 'loading', type: 'boolean', default: 'false', description: 'Whether the channel list is loading.' },
    { name: 'skeleton', type: 'boolean', default: 'false', description: 'Show loading skeleton.' },
  ],
};
