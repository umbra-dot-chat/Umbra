import React from 'react';
import { EmojiPicker, EmojiPickerTrigger, VStack, HStack, Text, Button } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

export const emojiPickerEntry: ComponentEntry = {
  slug: 'emoji-picker',
  name: 'EmojiPicker',
  category: 'components',
  subcategory: 'Chat & Messaging',
  description:
    'Full-featured emoji selection panel with category tabs, keyword search, skin tone selector, scroll-synced navigation, and Lucide icons for tabs. Includes EmojiPickerTrigger for popover integration.',
  variantCount: 3,
  keywords: [
    'emoji', 'picker', 'smiley', 'emoticon', 'chat', 'select', 'grid',
    'search', 'category', 'skin tone', 'popover', 'trigger', 'reaction',
  ],

  cardPreview: (
    <div style={{ pointerEvents: 'none', transform: 'scale(0.55)', transformOrigin: 'center center' }}>
      <EmojiPicker size="sm" showSearch={false} showSkinTones={false} />
    </div>
  ),

  examples: [
    {
      title: 'Default',
      render: (
        <EmojiPicker onSelect={(emoji) => console.log('Selected:', emoji)} />
      ),
      code: `import { EmojiPicker } from '@wisp-ui/react';

<EmojiPicker onSelect={(emoji) => handleEmoji(emoji)} />`,
    },
    {
      title: 'Sizes',
      render: (
        <HStack gap="lg" style={{ alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <VStack gap="xs">
            <Text size="xs" color="secondary">sm</Text>
            <EmojiPicker size="sm" showSkinTones={false} />
          </VStack>
          <VStack gap="xs">
            <Text size="xs" color="secondary">md</Text>
            <EmojiPicker size="md" showSkinTones={false} />
          </VStack>
        </HStack>
      ),
      code: `<EmojiPicker size="sm" />
<EmojiPicker size="md" />
<EmojiPicker size="lg" />`,
    },
    {
      title: 'Skin Tone Selector',
      render: (
        <EmojiPicker
          showSkinTones
          defaultSkinTone="medium"
          onSelect={(emoji) => console.log('Selected:', emoji)}
        />
      ),
      code: `<EmojiPicker
  showSkinTones
  defaultSkinTone="medium"
  onSelect={(emoji) => console.log(emoji)}
/>`,
    },
    {
      title: 'With Recent Emojis',
      render: (
        <EmojiPicker recent={['😂', '👍', '❤️', '🔥', '🚀', '💯', '🎉', '👏']} />
      ),
      code: `<EmojiPicker recent={['😂', '👍', '❤️', '🔥', '🚀', '💯', '🎉', '👏']} />`,
    },
    {
      title: 'Trigger Button',
      render: (
        <HStack gap="md" style={{ alignItems: 'center' }}>
          <EmojiPickerTrigger
            size="md"
            pickerProps={{ onSelect: (emoji) => console.log('Emoji:', emoji) }}
          />
          <Text color="secondary">Click the button to open</Text>
        </HStack>
      ),
      code: `import { EmojiPickerTrigger } from '@wisp-ui/react';

<EmojiPickerTrigger
  size="md"
  pickerProps={{ onSelect: (emoji) => handleEmoji(emoji) }}
/>`,
    },
    {
      title: 'Custom Trigger',
      render: (
        <EmojiPickerTrigger
          size="sm"
          pickerProps={{ onSelect: (emoji) => console.log('Emoji:', emoji) }}
        >
          <Button size="sm" variant="secondary">
            Add Reaction
          </Button>
        </EmojiPickerTrigger>
      ),
      code: `<EmojiPickerTrigger size="sm" pickerProps={{ onSelect: handleEmoji }}>
  <Button size="sm" variant="secondary">Add Reaction</Button>
</EmojiPickerTrigger>`,
    },
    {
      title: 'Minimal (No Categories)',
      render: (
        <EmojiPicker showCategories={false} showSkinTones={false} size="sm" />
      ),
      code: `<EmojiPicker showCategories={false} showSkinTones={false} />`,
    },
    {
      title: 'Skeleton',
      render: (
        <HStack gap="md">
          <EmojiPicker skeleton size="sm" />
          <EmojiPicker skeleton size="md" />
        </HStack>
      ),
      code: `<EmojiPicker skeleton />`,
    },
  ],

  props: [
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Size preset.' },
    { name: 'onSelect', type: '(emoji: string, item?: EmojiItem) => void', description: 'Called when an emoji is selected.' },
    { name: 'emojis', type: 'EmojiItem[]', description: 'Custom emoji data set.' },
    { name: 'recent', type: 'string[]', description: 'Recently used emojis.' },
    { name: 'searchPlaceholder', type: 'string', default: "'Search emoji...'", description: 'Search placeholder text.' },
    { name: 'showSearch', type: 'boolean', default: 'true', description: 'Show search bar.' },
    { name: 'showCategories', type: 'boolean', default: 'true', description: 'Show category tabs.' },
    { name: 'showSkinTones', type: 'boolean', default: 'true', description: 'Show skin tone selector.' },
    { name: 'defaultSkinTone', type: 'SkinTone', default: "'default'", description: 'Default skin tone (uncontrolled).' },
    { name: 'skinTone', type: 'SkinTone', description: 'Controlled skin tone.' },
    { name: 'onSkinToneChange', type: '(tone: SkinTone) => void', description: 'Callback when skin tone changes.' },
    { name: 'autoFocusSearch', type: 'boolean', default: 'false', description: 'Auto-focus search on mount.' },
    { name: 'skeleton', type: 'boolean', default: 'false', description: 'Show loading skeleton.' },
  ],
};
