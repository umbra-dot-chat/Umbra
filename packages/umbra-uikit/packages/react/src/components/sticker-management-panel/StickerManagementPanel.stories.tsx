import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { StickerManagementPanel } from './StickerManagementPanel';
import type { StickerPack } from '@coexist/wisp-core/types/StickerManagementPanel.types';

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof StickerManagementPanel> = {
  title: 'Components/Community/StickerManagementPanel',
  component: StickerManagementPanel,
  tags: ['autodocs'],
  argTypes: {
    skeleton: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof StickerManagementPanel>;

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

const samplePacks: StickerPack[] = [
  {
    id: 'pack-1',
    name: 'Cute Animals',
    stickers: [
      { id: 's1', name: 'Happy Cat', imageUrl: 'https://picsum.photos/seed/cat/64' },
      { id: 's2', name: 'Sleepy Dog', imageUrl: 'https://picsum.photos/seed/dog/64' },
      { id: 's3', name: 'Smug Frog', imageUrl: 'https://picsum.photos/seed/frog/64' },
      { id: 's4', name: 'Cool Penguin', imageUrl: 'https://picsum.photos/seed/penguin/64' },
    ],
  },
  {
    id: 'pack-2',
    name: 'Reactions',
    stickers: [
      { id: 's5', name: 'Thumbs Up', imageUrl: 'https://picsum.photos/seed/thumbsup/64' },
      { id: 's6', name: 'Clap', imageUrl: 'https://picsum.photos/seed/clap/64' },
    ],
  },
  {
    id: 'pack-3',
    name: 'Food',
    stickers: [
      { id: 's7', name: 'Pizza', imageUrl: 'https://picsum.photos/seed/pizza/64' },
    ],
  },
];

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    packs: samplePacks,
  },
};

// ---------------------------------------------------------------------------
// 2. With Actions
// ---------------------------------------------------------------------------

export const WithActions: Story = {
  name: 'With Actions',
  args: {
    packs: samplePacks,
    onCreatePack: (name: string) => console.log('Create pack:', name),
    onDeletePack: (packId: string) => console.log('Delete pack:', packId),
    onUploadSticker: (packId: string, file: File, name: string) =>
      console.log('Upload sticker:', packId, file.name, name),
    onDeleteSticker: (packId: string, stickerId: string) =>
      console.log('Delete sticker:', packId, stickerId),
  },
};

// ---------------------------------------------------------------------------
// 3. Empty
// ---------------------------------------------------------------------------

export const Empty: Story = {
  name: 'Empty',
  args: {
    packs: [],
  },
};

// ---------------------------------------------------------------------------
// 4. Single Pack
// ---------------------------------------------------------------------------

export const SinglePack: Story = {
  name: 'Single Pack',
  args: {
    packs: [samplePacks[0]],
  },
};

// ---------------------------------------------------------------------------
// 5. Skeleton
// ---------------------------------------------------------------------------

export const Skeleton: Story = {
  name: 'Skeleton',
  args: {
    packs: [],
    skeleton: true,
  },
};
