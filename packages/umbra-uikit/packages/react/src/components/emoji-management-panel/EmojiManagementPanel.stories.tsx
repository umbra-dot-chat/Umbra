import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { EmojiManagementPanel } from './EmojiManagementPanel';
import type { CustomEmoji } from '@coexist/wisp-core/types/EmojiManagementPanel.types';

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof EmojiManagementPanel> = {
  title: 'Components/Community/EmojiManagementPanel',
  component: EmojiManagementPanel,
  tags: ['autodocs'],
  argTypes: {
    uploading: { control: 'boolean' },
    maxEmojis: { control: 'number' },
    skeleton: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof EmojiManagementPanel>;

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

const sampleEmojis: CustomEmoji[] = [
  { id: '1', name: 'pepe_happy', imageUrl: 'https://cdn.7tv.app/emote/60ae958e229664e866f9b731/1x.webp', uploadedBy: 'admin', uploadedAt: '2025-01-01' },
  { id: '2', name: 'catjam', imageUrl: 'https://cdn.7tv.app/emote/60ae4bb30e35477634988c18/1x.webp', animated: true, uploadedBy: 'mod', uploadedAt: '2025-01-02' },
  { id: '3', name: 'pog', imageUrl: 'https://cdn.7tv.app/emote/60ae3e54259ac5a73e56a426/1x.webp', uploadedBy: 'admin', uploadedAt: '2025-01-03' },
  { id: '4', name: 'sadge', imageUrl: 'https://cdn.7tv.app/emote/60ae6bca2a23fbc6309ffc54/1x.webp', uploadedBy: 'user1', uploadedAt: '2025-01-04' },
  { id: '5', name: 'kekw', imageUrl: 'https://cdn.7tv.app/emote/60ae9416f8c5347c24db8592/1x.webp', uploadedBy: 'admin', uploadedAt: '2025-01-05' },
];

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    emojis: sampleEmojis,
    maxEmojis: 50,
  },
};

// ---------------------------------------------------------------------------
// 2. With Delete Handler
// ---------------------------------------------------------------------------

export const WithActions: Story = {
  name: 'With Actions',
  args: {
    emojis: sampleEmojis,
    maxEmojis: 50,
    onDelete: (id: string) => console.log('Delete:', id),
    onUpload: (file: File, name: string) => console.log('Upload:', file.name, name),
    onRename: (id: string, name: string) => console.log('Rename:', id, name),
  },
};

// ---------------------------------------------------------------------------
// 3. Near Max
// ---------------------------------------------------------------------------

export const NearMax: Story = {
  name: 'Near Max',
  args: {
    emojis: sampleEmojis,
    maxEmojis: 6,
  },
};

// ---------------------------------------------------------------------------
// 4. Empty
// ---------------------------------------------------------------------------

export const Empty: Story = {
  name: 'Empty',
  args: {
    emojis: [],
    maxEmojis: 50,
  },
};

// ---------------------------------------------------------------------------
// 5. Uploading
// ---------------------------------------------------------------------------

export const Uploading: Story = {
  name: 'Uploading',
  args: {
    emojis: sampleEmojis,
    uploading: true,
  },
};

// ---------------------------------------------------------------------------
// 6. Skeleton
// ---------------------------------------------------------------------------

export const Skeleton: Story = {
  name: 'Skeleton',
  args: {
    emojis: [],
    skeleton: true,
  },
};
