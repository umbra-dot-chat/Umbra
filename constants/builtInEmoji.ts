/**
 * builtInEmoji — Platform-provided emoji that are always available in the
 * picker and message renderer, independent of any community.
 *
 * These use local assets bundled with the app. On web/Tauri the bundler
 * resolves `require()` to a URL string; on native Expo resolves it via
 * the asset system. We handle both cases without `Image.resolveAssetSource`.
 *
 * Two Umbra ghost variants are registered as separate emoji:
 *   :umbra:       — black ghost (for light backgrounds)
 *   :umbra-white: — white ghost (for dark backgrounds)
 */

import { Image, Platform } from 'react-native';
import type { CommunityEmoji } from '@umbra/service';
import type { EmojiItem } from '@coexist/wisp-core/types/EmojiPicker.types';

// ---------------------------------------------------------------------------
// Local asset registry
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-var-requires
const umbraBlackSource = require('@/assets/emoji/umbra-black.png');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const umbraWhiteSource = require('@/assets/emoji/umbra-white.png');

interface BuiltInAsset {
  id: string;
  name: string;
  source: any;
  keywords: string[];
  animated: boolean;
}

const BUILT_IN_ASSETS: BuiltInAsset[] = [
  {
    id: '__builtin__umbra',
    name: 'umbra',
    source: umbraBlackSource,
    keywords: ['umbra', 'ghost', 'logo', 'dark'],
    animated: false,
  },
  {
    id: '__builtin__umbra_white',
    name: 'umbra-white',
    source: umbraWhiteSource,
    keywords: ['umbra', 'ghost', 'logo', 'white', 'light'],
    animated: false,
  },
];

// ---------------------------------------------------------------------------
// Resolve asset URIs — platform-safe
// ---------------------------------------------------------------------------

function resolveAssetUri(source: any): string {
  // Web / Tauri: bundler returns a string URL directly
  if (typeof source === 'string') return source;

  // Some bundlers wrap in { default: '...' } or { uri: '...' }
  if (source && typeof source === 'object') {
    if (typeof source.default === 'string') return source.default;
    if (typeof source.uri === 'string') return source.uri;
  }

  // Native (Expo/RN): use resolveAssetSource if available
  if (Platform.OS !== 'web' && typeof Image.resolveAssetSource === 'function') {
    const resolved = Image.resolveAssetSource(source);
    return resolved?.uri ?? '';
  }

  // Fallback: coerce to string (Expo web may return a number that maps to an
  // internal asset — shouldn't happen with modern metro/webpack, but safe)
  return String(source);
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

/**
 * Built-in emoji as `CommunityEmoji` objects — used for building the
 * `emojiMap` in `parseMessageContent` so these render inline in messages.
 */
export function getBuiltInCommunityEmoji(): CommunityEmoji[] {
  return BUILT_IN_ASSETS.map((asset) => ({
    id: asset.id,
    communityId: '__builtin__',
    name: asset.name,
    imageUrl: resolveAssetUri(asset.source),
    animated: asset.animated,
    uploadedBy: 'system',
    createdAt: 0,
  }));
}

/**
 * Built-in emoji as `EmojiItem` objects — used for the EmojiPicker
 * `customEmojis` prop so they appear in the Custom category.
 */
export function getBuiltInEmojiItems(): EmojiItem[] {
  return BUILT_IN_ASSETS.map((asset) => ({
    emoji: `:${asset.name}:`,
    name: asset.name,
    category: 'custom' as const,
    keywords: asset.keywords,
    imageUrl: resolveAssetUri(asset.source),
    animated: asset.animated,
  }));
}
