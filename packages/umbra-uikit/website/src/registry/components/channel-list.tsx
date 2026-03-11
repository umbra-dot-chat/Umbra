import React from 'react';
import { ChannelList } from '@wisp-ui/react';
import type { ChannelCategory } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

const sampleCategories: ChannelCategory[] = [
  {
    id: 'text',
    label: 'TEXT CHANNELS',
    channels: [
      { id: 'general', name: 'general', type: 'text', active: true, unreadCount: 0 },
      { id: 'random', name: 'random', type: 'text', unreadCount: 3 },
      { id: 'announcements', name: 'announcements', type: 'announcement' },
    ],
  },
  {
    id: 'voice',
    label: 'VOICE CHANNELS',
    channels: [
      { id: 'lounge', name: 'Lounge', type: 'voice' },
      { id: 'gaming', name: 'Gaming', type: 'voice' },
    ],
  },
];

const categoriesWithBadges: ChannelCategory[] = [
  {
    id: 'text',
    label: 'TEXT CHANNELS',
    channels: [
      { id: 'general', name: 'general', type: 'text', unreadCount: 5, hasMention: true },
      { id: 'help', name: 'help', type: 'text', unreadCount: 12 },
      { id: 'off-topic', name: 'off-topic', type: 'text', muted: true, unreadCount: 99 },
      { id: 'announcements', name: 'announcements', type: 'announcement', unreadCount: 1 },
    ],
  },
  {
    id: 'community',
    label: 'COMMUNITY',
    channels: [
      { id: 'forum', name: 'forum', type: 'forum', unreadCount: 3 },
      { id: 'threads', name: 'feedback', type: 'thread' },
    ],
  },
];

const collapsedCategories: ChannelCategory[] = [
  {
    id: 'text',
    label: 'TEXT CHANNELS',
    channels: [
      { id: 'general', name: 'general', type: 'text' },
      { id: 'random', name: 'random', type: 'text' },
    ],
  },
  {
    id: 'voice',
    label: 'VOICE CHANNELS',
    collapsed: true,
    channels: [
      { id: 'lounge', name: 'Lounge', type: 'voice' },
      { id: 'gaming', name: 'Gaming', type: 'voice' },
    ],
  },
  {
    id: 'archive',
    label: 'ARCHIVED',
    collapsed: true,
    channels: [
      { id: 'old-general', name: 'old-general', type: 'text', muted: true },
    ],
  },
];

export const channelListEntry: ComponentEntry = {
  slug: 'channel-list',
  name: 'ChannelList',
  category: 'components',
  subcategory: 'Chat & Messaging',
  description:
    'Collapsible category-grouped channel list sidebar with text, voice, and other channel types.',
  variantCount: 4,
  keywords: ['channel', 'list', 'sidebar', 'category', 'text', 'voice', 'discord', 'server'],

  cardPreview: (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
      <ChannelList
        categories={[
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
        ]}
        style={{ width: 220 }}
      />
    </div>
  ),

  examples: [
    {
      title: 'Default',
      render: (
        <ChannelList
          categories={sampleCategories}
          onChannelClick={() => {}}
          onCategoryToggle={() => {}}
          style={{ width: 240 }}
        />
      ),
      code: `<ChannelList
  categories={[
    {
      id: 'text',
      label: 'TEXT CHANNELS',
      channels: [
        { id: 'general', name: 'general', type: 'text', active: true },
        { id: 'random', name: 'random', type: 'text', unreadCount: 3 },
        { id: 'announcements', name: 'announcements', type: 'announcement' },
      ],
    },
    {
      id: 'voice',
      label: 'VOICE CHANNELS',
      channels: [
        { id: 'lounge', name: 'Lounge', type: 'voice' },
        { id: 'gaming', name: 'Gaming', type: 'voice' },
      ],
    },
  ]}
  onChannelClick={(ch) => setActiveChannel(ch.id)}
  onCategoryToggle={(catId) => toggleCategory(catId)}
/>`,
    },
    {
      title: 'With Header',
      render: (
        <ChannelList
          categories={sampleCategories}
          onChannelClick={() => {}}
          header={
            <span style={{ fontWeight: 700, fontSize: 15 }}>My Server</span>
          }
          style={{ width: 240 }}
        />
      ),
      code: `<ChannelList
  categories={categories}
  onChannelClick={(ch) => setActiveChannel(ch.id)}
  header={<span style={{ fontWeight: 700 }}>My Server</span>}
/>`,
    },
    {
      title: 'Active Channel & Badges',
      render: (
        <ChannelList
          categories={categoriesWithBadges}
          onChannelClick={() => {}}
          style={{ width: 240 }}
        />
      ),
      code: `<ChannelList
  categories={[
    {
      id: 'text',
      label: 'TEXT CHANNELS',
      channels: [
        { id: 'general', name: 'general', unreadCount: 5, hasMention: true },
        { id: 'help', name: 'help', unreadCount: 12 },
        { id: 'off-topic', name: 'off-topic', muted: true, unreadCount: 99 },
      ],
    },
  ]}
  onChannelClick={(ch) => setActiveChannel(ch.id)}
/>`,
    },
    {
      title: 'Collapsed Categories',
      render: (
        <ChannelList
          categories={collapsedCategories}
          onChannelClick={() => {}}
          onCategoryToggle={() => {}}
          style={{ width: 240 }}
        />
      ),
      code: `<ChannelList
  categories={[
    { id: 'text', label: 'TEXT CHANNELS', channels: [...] },
    { id: 'voice', label: 'VOICE CHANNELS', collapsed: true, channels: [...] },
    { id: 'archive', label: 'ARCHIVED', collapsed: true, channels: [...] },
  ]}
  onChannelClick={(ch) => setActiveChannel(ch.id)}
  onCategoryToggle={(catId) => toggleCategory(catId)}
/>`,
    },
  ],

  props: [
    { name: 'categories', type: 'ChannelCategory[]', required: true, description: 'List of channel categories.' },
    { name: 'onChannelClick', type: '(channel: ChannelItem) => void', description: 'Called when a channel is clicked.' },
    { name: 'onCategoryToggle', type: '(categoryId: string) => void', description: 'Called when a category collapse state toggles.' },
    { name: 'header', type: 'ReactNode', description: 'Optional header element above the channel list (e.g. server name).' },
    { name: 'loading', type: 'boolean', default: 'false', description: 'Whether the list is loading.' },
    { name: 'skeleton', type: 'boolean', default: 'false', description: 'Show loading skeleton.' },
  ],
};
