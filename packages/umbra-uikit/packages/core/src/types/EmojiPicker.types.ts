/**
 * @module types/EmojiPicker
 * @description Type definitions for the EmojiPicker component — emoji
 * selection grid with category tabs, keyword search, skin tone selector,
 * and scroll-synced navigation.
 */

import type { ThemeRadii } from '../theme/types';
import type React from 'react';
import { defaultSpacing, defaultTypography } from '../theme/create-theme';

/** Framework-agnostic icon component type (compatible with Lucide icons). */
type IconComponent = React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

// ---------------------------------------------------------------------------
// Skin Tones (Fitzpatrick scale)
// ---------------------------------------------------------------------------

export const skinTones = ['default', 'light', 'medium-light', 'medium', 'medium-dark', 'dark'] as const;
export type SkinTone = (typeof skinTones)[number];

/** Unicode Fitzpatrick modifiers appended to skin-tone-capable emojis. */
export const SKIN_TONE_MODIFIERS: Record<SkinTone, string> = {
  default: '',
  light: '\u{1F3FB}',
  'medium-light': '\u{1F3FC}',
  medium: '\u{1F3FD}',
  'medium-dark': '\u{1F3FE}',
  dark: '\u{1F3FF}' };

// ---------------------------------------------------------------------------
// Size
// ---------------------------------------------------------------------------

export const emojiPickerSizes = ['sm', 'md', 'lg'] as const;
export type EmojiPickerSize = (typeof emojiPickerSizes)[number];

export interface EmojiPickerSizeConfig {
  /** Width of the picker panel. */
  width: number;
  /** Height of the picker panel. */
  height: number;
  /** Size of each emoji cell. */
  cellSize: number;
  /** Font size for emojis. */
  emojiSize: number;
  /** Font size for labels. */
  fontSize: number;
  /** Padding. */
  padding: number;
  /** Gap between cells. */
  gap: number;
  /** Category tab height. */
  tabHeight: number;
  /** Search input height. */
  searchHeight: number;
  /** Border radius. */
  borderRadius: keyof ThemeRadii;
  /** Icon size for category tabs (Lucide icons). */
  tabIconSize: number;
  /** Number of emoji columns in the grid. */
  columnsCount: number;
  /** Size of skin tone selector dots. */
  skinToneDotSize: number;
}

export const emojiPickerSizeMap: Record<EmojiPickerSize, EmojiPickerSizeConfig> = {
  sm: { width: 340, height: 360, cellSize: 30, emojiSize: 18, fontSize: defaultTypography.sizes.xs.fontSize, padding: defaultSpacing.sm, gap: defaultSpacing['2xs'], tabHeight: 32, searchHeight: 32, borderRadius: 'lg', tabIconSize: 14, columnsCount: 8, skinToneDotSize: 18 },
  md: { width: 420, height: 440, cellSize: 36, emojiSize: 22, fontSize: defaultTypography.sizes.xs.fontSize, padding: defaultSpacing.md, gap: defaultSpacing['2xs'], tabHeight: 36, searchHeight: 36, borderRadius: 'xl', tabIconSize: 16, columnsCount: 8, skinToneDotSize: 22 },
  lg: { width: 480, height: 520, cellSize: 44, emojiSize: 28, fontSize: defaultTypography.sizes.sm.fontSize, padding: defaultSpacing.lg, gap: defaultSpacing.xs, tabHeight: 42, searchHeight: 40, borderRadius: 'xl', tabIconSize: 18, columnsCount: 8, skinToneDotSize: 26 } };

// ---------------------------------------------------------------------------
// Emoji categories & data
// ---------------------------------------------------------------------------

export const emojiCategories = [
  'recent',
  'custom',
  'smileys',
  'people',
  'animals',
  'food',
  'travel',
  'activities',
  'objects',
  'symbols',
  'flags',
] as const;
export type EmojiCategory = (typeof emojiCategories)[number];

export interface EmojiItem {
  /** The emoji character. */
  emoji: string;
  /** Display name / search term. */
  name: string;
  /** Category the emoji belongs to. */
  category: EmojiCategory;
  /** Keywords for search matching. */
  keywords: string[];
  /** Whether this emoji supports skin tone modifiers. */
  skinToneSupport?: boolean;
  /** Popularity rank (lower = more popular). */
  popularityRank?: number;
  /** Optional image URL for custom emoji (community/server emoji). */
  imageUrl?: string;
  /** Whether this is an animated emoji. */
  animated?: boolean;
  /** Optional group/source identifier for sectioning custom emoji (e.g. community ID). */
  groupId?: string;
  /** Optional display label for the group (e.g. community name, "Umbra"). */
  groupName?: string;
}

/** Map of category names to Lucide icon component types. */
export type CategoryIconMap = Record<EmojiCategory, IconComponent>;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface EmojiPickerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'onSelect'> {
  /** Size preset. @default 'md' */
  size?: EmojiPickerSize;

  /** Called when an emoji is selected. */
  onSelect?: (emoji: string, item?: EmojiItem) => void;

  /** Custom emoji data. If not provided, uses built-in set. */
  emojis?: EmojiItem[];

  /** Recently used emojis (shown in a special top section). */
  recent?: string[];

  /** Search placeholder text. @default 'Search emoji...' */
  searchPlaceholder?: string;

  /** Show search bar. @default true */
  showSearch?: boolean;

  /** Show category tabs. @default true */
  showCategories?: boolean;

  /** Show loading skeleton. @default false */
  skeleton?: boolean;

  /** Show skin tone selector. @default true */
  showSkinTones?: boolean;

  /** Default skin tone (uncontrolled). @default 'default' */
  defaultSkinTone?: SkinTone;

  /** Controlled skin tone. */
  skinTone?: SkinTone;

  /** Callback when skin tone changes. */
  onSkinToneChange?: (tone: SkinTone) => void;

  /** Auto-focus the search input on mount. @default false */
  autoFocusSearch?: boolean;

  /** Custom community/server emoji to include in the 'custom' category. */
  customEmojis?: EmojiItem[];

  /** Label for the custom emoji category tab. @default 'Custom' */
  customCategoryLabel?: string;
}

// ---------------------------------------------------------------------------
// Trigger Props
// ---------------------------------------------------------------------------

export interface EmojiPickerTriggerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Size preset for the picker panel. @default 'md' */
  size?: EmojiPickerSize;

  /** Props passed to the inner EmojiPicker. */
  pickerProps?: Omit<EmojiPickerProps, 'size' | 'style' | 'className'>;

  /** Size of the trigger button. @default 'md' */
  buttonSize?: 'sm' | 'md' | 'lg';

  /** Variant of the trigger button. @default 'tertiary' */
  buttonVariant?: 'primary' | 'secondary' | 'tertiary' | 'destructive';

  /** Popover placement relative to the trigger. @default 'bottom' */
  placement?: 'top' | 'bottom' | 'left' | 'right';

  /** Popover alignment. @default 'start' */
  align?: 'start' | 'center' | 'end';

  /** Popover offset in pixels. */
  offset?: number;

  /** Custom trigger icon (Lucide component type). */
  icon?: IconComponent;

  /** Custom trigger content (replaces default button). */
  children?: React.ReactNode;
}
