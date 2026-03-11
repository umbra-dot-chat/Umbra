import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { StickerPicker } from './StickerPicker';
import { stickerPickerSizes } from '@coexist/wisp-core/types/StickerPicker.types';
import type { StickerPickerPack } from '@coexist/wisp-core/types/StickerPicker.types';

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof StickerPicker> = {
  title: 'Components/Community/StickerPicker',
  component: StickerPicker,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: [...stickerPickerSizes] },
    skeleton: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof StickerPicker>;

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

const samplePacks: StickerPickerPack[] = [
  {
    id: 'pack-1',
    name: 'Animals',
    iconUrl: 'https://picsum.photos/seed/animals-icon/24',
    stickers: [
      { id: 's1', name: 'Cat', imageUrl: 'https://picsum.photos/seed/cat-stk/80' },
      { id: 's2', name: 'Dog', imageUrl: 'https://picsum.photos/seed/dog-stk/80' },
      { id: 's3', name: 'Frog', imageUrl: 'https://picsum.photos/seed/frog-stk/80' },
      { id: 's4', name: 'Penguin', imageUrl: 'https://picsum.photos/seed/penguin-stk/80' },
      { id: 's5', name: 'Fox', imageUrl: 'https://picsum.photos/seed/fox-stk/80' },
      { id: 's6', name: 'Bear', imageUrl: 'https://picsum.photos/seed/bear-stk/80' },
    ],
  },
  {
    id: 'pack-2',
    name: 'Reactions',
    stickers: [
      { id: 's7', name: 'Thumbs Up', imageUrl: 'https://picsum.photos/seed/thumbsup-stk/80' },
      { id: 's8', name: 'Heart', imageUrl: 'https://picsum.photos/seed/heart-stk/80' },
      { id: 's9', name: 'Laugh', imageUrl: 'https://picsum.photos/seed/laugh-stk/80' },
    ],
  },
  {
    id: 'pack-3',
    name: 'Food',
    stickers: [
      { id: 's10', name: 'Pizza', imageUrl: 'https://picsum.photos/seed/pizza-stk/80' },
      { id: 's11', name: 'Taco', imageUrl: 'https://picsum.photos/seed/taco-stk/80' },
    ],
  },
];

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    packs: samplePacks,
    size: 'md',
    skeleton: false,
  },
};

// ---------------------------------------------------------------------------
// 2. Sizes
// ---------------------------------------------------------------------------

export const Sizes: Story = {
  name: 'Sizes',
  render: () => (
    <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      {stickerPickerSizes.map((size) => (
        <div key={size} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: '#999' }}>{size}</span>
          <StickerPicker packs={samplePacks} size={size} />
        </div>
      ))}
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. Single Pack
// ---------------------------------------------------------------------------

export const SinglePack: Story = {
  name: 'Single Pack',
  args: {
    packs: [samplePacks[0]],
    size: 'md',
  },
};

// ---------------------------------------------------------------------------
// 4. Empty
// ---------------------------------------------------------------------------

export const Empty: Story = {
  name: 'Empty',
  args: {
    packs: [],
    size: 'md',
  },
};

// ---------------------------------------------------------------------------
// 5. Skeleton
// ---------------------------------------------------------------------------

export const Skeleton: Story = {
  name: 'Skeleton',
  args: {
    packs: [],
    size: 'md',
    skeleton: true,
  },
};
