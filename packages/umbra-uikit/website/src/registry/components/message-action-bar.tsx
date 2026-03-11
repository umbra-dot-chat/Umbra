import React from 'react';
import { MessageActionBar, VStack, Text } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

// Inline SVG icons for examples
function ReplyIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 17 4 12 9 7" />
      <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
    </svg>
  );
}

function ForwardIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 17 20 12 15 7" />
      <path d="M4 18v-2a4 4 0 0 1 4-4h12" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 17v5" />
      <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16h14v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

export const messageActionBarEntry: ComponentEntry = {
  slug: 'message-action-bar',
  name: 'MessageActionBar',
  category: 'components',
  subcategory: 'Chat & Messaging',
  description:
    'Floating action bar shown on message hover/long-press with actions like reply, react, forward, pin, and delete.',
  variantCount: 1,
  keywords: ['message', 'action', 'bar', 'hover', 'reply', 'react', 'forward', 'pin', 'delete', 'toolbar'],

  cardPreview: (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
      <MessageActionBar
        actions={[
          { key: 'reply', label: 'Reply', icon: <ReplyIcon />, onClick: () => {} },
          { key: 'forward', label: 'Forward', icon: <ForwardIcon />, onClick: () => {} },
          { key: 'pin', label: 'Pin', icon: <PinIcon />, onClick: () => {} },
        ]}
        showEmojiReact
      />
    </div>
  ),

  examples: [
    {
      title: 'Default',
      render: (
        <VStack gap="md" style={{ alignItems: 'center' }}>
          <MessageActionBar
            actions={[
              { key: 'reply', label: 'Reply', icon: <ReplyIcon />, onClick: () => console.log('Reply') },
              { key: 'forward', label: 'Forward', icon: <ForwardIcon />, onClick: () => console.log('Forward') },
              { key: 'copy', label: 'Copy', icon: <CopyIcon />, onClick: () => console.log('Copy') },
              { key: 'pin', label: 'Pin', icon: <PinIcon />, onClick: () => console.log('Pin') },
              { key: 'delete', label: 'Delete', icon: <TrashIcon />, onClick: () => console.log('Delete'), destructive: true },
            ]}
            showEmojiReact
            onEmojiReactClick={() => console.log('Emoji react')}
          />
        </VStack>
      ),
      code: `import { MessageActionBar } from '@wisp-ui/react';

<MessageActionBar
  actions={[
    { key: 'reply', label: 'Reply', icon: <ReplyIcon />, onClick: handleReply },
    { key: 'forward', label: 'Forward', icon: <ForwardIcon />, onClick: handleForward },
    { key: 'copy', label: 'Copy', icon: <CopyIcon />, onClick: handleCopy },
    { key: 'pin', label: 'Pin', icon: <PinIcon />, onClick: handlePin },
    { key: 'delete', label: 'Delete', icon: <TrashIcon />, onClick: handleDelete, destructive: true },
  ]}
  showEmojiReact
  onEmojiReactClick={openPicker}
/>`,
    },
    {
      title: 'Without Emoji React',
      render: (
        <VStack gap="md" style={{ alignItems: 'center' }}>
          <MessageActionBar
            actions={[
              { key: 'reply', label: 'Reply', icon: <ReplyIcon />, onClick: () => {} },
              { key: 'forward', label: 'Forward', icon: <ForwardIcon />, onClick: () => {} },
              { key: 'delete', label: 'Delete', icon: <TrashIcon />, onClick: () => {}, destructive: true },
            ]}
          />
        </VStack>
      ),
      code: `<MessageActionBar
  actions={[
    { key: 'reply', label: 'Reply', icon: <ReplyIcon />, onClick: handleReply },
    { key: 'forward', label: 'Forward', icon: <ForwardIcon />, onClick: handleForward },
    { key: 'delete', label: 'Delete', icon: <TrashIcon />, onClick: handleDelete, destructive: true },
  ]}
/>`,
    },
    {
      title: 'Minimal',
      render: (
        <VStack gap="md" style={{ alignItems: 'center' }}>
          <MessageActionBar
            actions={[
              { key: 'reply', label: 'Reply', icon: <ReplyIcon />, onClick: () => {} },
            ]}
            showEmojiReact
          />
        </VStack>
      ),
      code: `<MessageActionBar
  actions={[{ key: 'reply', label: 'Reply', icon: <ReplyIcon />, onClick: handleReply }]}
  showEmojiReact
/>`,
    },
    {
      title: 'With Disabled Action',
      render: (
        <VStack gap="md" style={{ alignItems: 'center' }}>
          <MessageActionBar
            actions={[
              { key: 'reply', label: 'Reply', icon: <ReplyIcon />, onClick: () => {} },
              { key: 'forward', label: 'Forward', icon: <ForwardIcon />, onClick: () => {}, disabled: true },
              { key: 'pin', label: 'Pin', icon: <PinIcon />, onClick: () => {} },
            ]}
          />
        </VStack>
      ),
      code: `<MessageActionBar
  actions={[
    { key: 'reply', label: 'Reply', icon: <ReplyIcon />, onClick: handleReply },
    { key: 'forward', label: 'Forward', icon: <ForwardIcon />, onClick: handleForward, disabled: true },
    { key: 'pin', label: 'Pin', icon: <PinIcon />, onClick: handlePin },
  ]}
/>`,
    },
  ],

  props: [
    { name: 'actions', type: 'MessageAction[]', description: 'Array of actions to display. Each has key, label, icon, onClick, and optional destructive/disabled flags.' },
    { name: 'position', type: "'top-left' | 'top-right'", default: "'top-right'", description: 'Position relative to the message.' },
    { name: 'showEmojiReact', type: 'boolean', default: 'false', description: 'Show the emoji quick-react button.' },
    { name: 'onEmojiReactClick', type: '() => void', description: 'Called when the emoji react button is clicked.' },
  ],
};
