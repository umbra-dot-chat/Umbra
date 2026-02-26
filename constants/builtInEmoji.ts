/**
 * builtInEmoji — Platform-provided emoji that are always available in the
 * picker and message renderer, independent of any community.
 *
 * These use local assets bundled with the app. On web/Tauri the bundler
 * resolves `require()` to a URL string; on native Expo resolves it via
 * the asset system. We handle both cases without `Image.resolveAssetSource`.
 *
 * Umbra ghost emoji are registered as built-in:
 *   :umbra:           — black ghost
 *   :umbra-white:     — white ghost
 *   :umbra-wave:      — ghost waving hello
 *   :umbra-surprised: — ghost with shocked expression
 *   :umbra-laugh:     — ghost laughing
 *   :umbra-cry:       — ghost crying
 *   :umbra-love:      — ghost with heart eyes
 *   :umbra-thumbsup:  — ghost giving thumbs up
 *   :umbra-angel:     — ghost with halo
 *   :umbra-blush:     — ghost blushing
 *   :umbra-frozen:    — frozen ghost
 *   :umbra-puke:      — ghost puking
 *   :umbra-scared:    — scared ghost
 *   :umbra-silly:     — ghost with silly grin
 *   :umbra-princess:  — ghost with crown
 *   :umbra-mindblown: — ghost mind blown
 *   :umbra-finger:    — ghost flipping off
 *   :umbra-angry:     — ghost angry on phone
 *   :umbra-devil:     — ghost with devil horns
 *   :umbra-shush:     — ghost with zipped mouth
 *   :umbra-pregnant:  — pregnant ghost
 *   :umbra-lockeyes:  — ghost with lock eyes
 *   :umbra-clown:     — clown ghost
 *   :umbra-heart:     — heart-shaped ghost
 *   :umbra-horrified: — horrified ghost
 *   :umbra-banhammer: — ghost with ban hammer
 *   :umbra-cursing:   — ghost cursing with censored text
 *   :umbra-gaming:    — ghost playing video games
 *   :umbra-writing:   — ghost writing on paper
 *   :umbra-fist:      — ghost fist bump
 *   :umbra-dead:      — dead ghost with X eyes
 */

import { Image, Platform } from 'react-native';
import type { CommunityEmoji } from '@umbra/service';
import type { EmojiItem } from '@coexist/wisp-core/types/EmojiPicker.types';

// ---------------------------------------------------------------------------
// Local asset registry
// ---------------------------------------------------------------------------

/* eslint-disable @typescript-eslint/no-var-requires */
const umbraBlackSource = require('@/assets/emoji/umbra-black.png');
const umbraWhiteSource = require('@/assets/emoji/umbra-white.png');
const umbraWaveSource = require('@/assets/emoji/umbra-wave.png');
const umbraSurprisedSource = require('@/assets/emoji/umbra-surprised.png');
const umbraLaughSource = require('@/assets/emoji/umbra-laugh.png');
const umbraCrySource = require('@/assets/emoji/umbra-cry.png');
const umbraLoveSource = require('@/assets/emoji/umbra-love.png');
const umbraThumbsupSource = require('@/assets/emoji/umbra-thumbsup.png');
const umbraAngelSource = require('@/assets/emoji/umbra-angel.png');
const umbraBlushSource = require('@/assets/emoji/umbra-blush.png');
const umbraFrozenSource = require('@/assets/emoji/umbra-frozen.png');
const umbraPukeSource = require('@/assets/emoji/umbra-puke.png');
const umbraScaredSource = require('@/assets/emoji/umbra-scared.png');
const umbraSillySource = require('@/assets/emoji/umbra-silly.png');
const umbraPrincessSource = require('@/assets/emoji/umbra-princess.png');
const umbraMindblownSource = require('@/assets/emoji/umbra-mindblown.png');
const umbraFingerSource = require('@/assets/emoji/umbra-finger.png');
const umbraShushSource = require('@/assets/emoji/umbra-shush.png');
const umbraDevilSource = require('@/assets/emoji/umbra-devil.png');
const umbraAngrySource = require('@/assets/emoji/umbra-angry.png');
const umbraCocktailSource = require('@/assets/emoji/umbra-cocktail.png');
const umbraSmokeSource = require('@/assets/emoji/umbra-smoke.png');
const umbraKnifeSource = require('@/assets/emoji/umbra-knife.png');
const umbraToiletSource = require('@/assets/emoji/umbra-toilet.png');
const umbraTwerkSource = require('@/assets/emoji/umbra-twerk.png');
const umbraBeerSource = require('@/assets/emoji/umbra-beer.png');
const umbraPregnantSource = require('@/assets/emoji/umbra-pregnant.png');
const umbraLockeyesSource = require('@/assets/emoji/umbra-lockeyes.png');
const umbraClownSource = require('@/assets/emoji/umbra-clown.png');
const umbraHeartSource = require('@/assets/emoji/umbra-heart.png');
const umbraHorrifiedSource = require('@/assets/emoji/umbra-horrified.png');
const umbraBanhammerSource = require('@/assets/emoji/umbra-banhammer.png');
const umbraCursingSource = require('@/assets/emoji/umbra-cursing.png');
const umbraGamingSource = require('@/assets/emoji/umbra-gaming.png');
const umbraWritingSource = require('@/assets/emoji/umbra-writing.png');
const umbraFistSource = require('@/assets/emoji/umbra-fist.png');
const umbraDeadSource = require('@/assets/emoji/umbra-dead.png');
/* eslint-enable @typescript-eslint/no-var-requires */

interface BuiltInAsset {
  id: string;
  name: string;
  source: any;
  keywords: string[];
  animated: boolean;
}

const BUILT_IN_ASSETS: BuiltInAsset[] = [
  // ── Logo variants ──
  { id: '__builtin__umbra', name: 'umbra', source: umbraBlackSource, keywords: ['umbra', 'ghost', 'logo', 'dark'], animated: false },
  { id: '__builtin__umbra_white', name: 'umbra-white', source: umbraWhiteSource, keywords: ['umbra', 'ghost', 'logo', 'white', 'light'], animated: false },

  // ── Expressive ghosts ──
  { id: '__builtin__umbra_wave', name: 'umbra-wave', source: umbraWaveSource, keywords: ['umbra', 'ghost', 'wave', 'hi', 'hello', 'hey', 'greeting'], animated: false },
  { id: '__builtin__umbra_laugh', name: 'umbra-laugh', source: umbraLaughSource, keywords: ['umbra', 'ghost', 'laugh', 'lol', 'haha', 'happy', 'joy'], animated: false },
  { id: '__builtin__umbra_cry', name: 'umbra-cry', source: umbraCrySource, keywords: ['umbra', 'ghost', 'cry', 'sad', 'tears', 'upset'], animated: false },
  { id: '__builtin__umbra_love', name: 'umbra-love', source: umbraLoveSource, keywords: ['umbra', 'ghost', 'love', 'heart', 'eyes', 'crush', 'adore'], animated: false },
  { id: '__builtin__umbra_surprised', name: 'umbra-surprised', source: umbraSurprisedSource, keywords: ['umbra', 'ghost', 'surprised', 'shocked', 'wow', 'omg', 'whoa'], animated: false },
  { id: '__builtin__umbra_scared', name: 'umbra-scared', source: umbraScaredSource, keywords: ['umbra', 'ghost', 'scared', 'afraid', 'frightened', 'horror'], animated: false },
  { id: '__builtin__umbra_blush', name: 'umbra-blush', source: umbraBlushSource, keywords: ['umbra', 'ghost', 'blush', 'embarrassed', 'shy', 'awkward'], animated: false },
  { id: '__builtin__umbra_silly', name: 'umbra-silly', source: umbraSillySource, keywords: ['umbra', 'ghost', 'silly', 'goofy', 'derp', 'grin'], animated: false },
  { id: '__builtin__umbra_mindblown', name: 'umbra-mindblown', source: umbraMindblownSource, keywords: ['umbra', 'ghost', 'mindblown', 'mind', 'blown', 'explode', 'shocked'], animated: false },
  { id: '__builtin__umbra_puke', name: 'umbra-puke', source: umbraPukeSource, keywords: ['umbra', 'ghost', 'puke', 'sick', 'vomit', 'gross', 'nausea'], animated: false },

  // ── Action ghosts ──
  { id: '__builtin__umbra_thumbsup', name: 'umbra-thumbsup', source: umbraThumbsupSource, keywords: ['umbra', 'ghost', 'thumbsup', 'like', 'ok', 'yes', 'approve'], animated: false },
  { id: '__builtin__umbra_cocktail', name: 'umbra-cocktail', source: umbraCocktailSource, keywords: ['umbra', 'ghost', 'cocktail', 'martini', 'drink', 'fancy', 'party'], animated: false },
  { id: '__builtin__umbra_smoke', name: 'umbra-smoke', source: umbraSmokeSource, keywords: ['umbra', 'ghost', 'smoke', 'smoking', 'joint', 'weed', 'chill', 'high'], animated: false },
  { id: '__builtin__umbra_beer', name: 'umbra-beer', source: umbraBeerSource, keywords: ['umbra', 'ghost', 'beer', 'bottle', 'miller', 'drink', 'brew'], animated: false },
  { id: '__builtin__umbra_knife', name: 'umbra-knife', source: umbraKnifeSource, keywords: ['umbra', 'ghost', 'knife', 'stab', 'cut', 'scary', 'kill'], animated: false },
  { id: '__builtin__umbra_finger', name: 'umbra-finger', source: umbraFingerSource, keywords: ['umbra', 'ghost', 'finger', 'middle', 'rude', 'flip'], animated: false },
  { id: '__builtin__umbra_angry', name: 'umbra-angry', source: umbraAngrySource, keywords: ['umbra', 'ghost', 'angry', 'mad', 'phone', 'rage', 'furious'], animated: false },
  { id: '__builtin__umbra_twerk', name: 'umbra-twerk', source: umbraTwerkSource, keywords: ['umbra', 'ghost', 'twerk', 'booty', 'dance', 'shake', 'butt'], animated: false },
  { id: '__builtin__umbra_toilet', name: 'umbra-toilet', source: umbraToiletSource, keywords: ['umbra', 'ghost', 'toilet', 'poop', 'bathroom', 'potty', 'sitting'], animated: false },

  // ── Character ghosts ──
  { id: '__builtin__umbra_angel', name: 'umbra-angel', source: umbraAngelSource, keywords: ['umbra', 'ghost', 'angel', 'halo', 'innocent', 'holy', 'good'], animated: false },
  { id: '__builtin__umbra_devil', name: 'umbra-devil', source: umbraDevilSource, keywords: ['umbra', 'ghost', 'devil', 'demon', 'horns', 'evil', 'naughty'], animated: false },
  { id: '__builtin__umbra_princess', name: 'umbra-princess', source: umbraPrincessSource, keywords: ['umbra', 'ghost', 'princess', 'crown', 'queen', 'royal'], animated: false },
  { id: '__builtin__umbra_frozen', name: 'umbra-frozen', source: umbraFrozenSource, keywords: ['umbra', 'ghost', 'frozen', 'cold', 'ice', 'freezing', 'brrr'], animated: false },
  { id: '__builtin__umbra_shush', name: 'umbra-shush', source: umbraShushSource, keywords: ['umbra', 'ghost', 'shush', 'quiet', 'secret', 'zip', 'mute', 'silence'], animated: false },
  { id: '__builtin__umbra_pregnant', name: 'umbra-pregnant', source: umbraPregnantSource, keywords: ['umbra', 'ghost', 'pregnant', 'baby', 'expecting', 'belly'], animated: false },
  { id: '__builtin__umbra_lockeyes', name: 'umbra-lockeyes', source: umbraLockeyesSource, keywords: ['umbra', 'ghost', 'lock', 'eyes', 'private', 'secret', 'secure'], animated: false },
  { id: '__builtin__umbra_clown', name: 'umbra-clown', source: umbraClownSource, keywords: ['umbra', 'ghost', 'clown', 'circus', 'funny', 'nose', 'party'], animated: false },
  { id: '__builtin__umbra_heart', name: 'umbra-heart', source: umbraHeartSource, keywords: ['umbra', 'ghost', 'heart', 'love', 'cute', 'sweet', 'affection'], animated: false },
  { id: '__builtin__umbra_horrified', name: 'umbra-horrified', source: umbraHorrifiedSource, keywords: ['umbra', 'ghost', 'horrified', 'horror', 'creepy', 'terrified', 'scream'], animated: false },
  { id: '__builtin__umbra_banhammer', name: 'umbra-banhammer', source: umbraBanhammerSource, keywords: ['umbra', 'ghost', 'ban', 'hammer', 'mod', 'moderator', 'banned', 'smash'], animated: false },
  { id: '__builtin__umbra_cursing', name: 'umbra-cursing', source: umbraCursingSource, keywords: ['umbra', 'ghost', 'cursing', 'swearing', 'angry', 'censor', 'profanity', 'mad'], animated: false },
  { id: '__builtin__umbra_gaming', name: 'umbra-gaming', source: umbraGamingSource, keywords: ['umbra', 'ghost', 'gaming', 'gamer', 'controller', 'videogame', 'play', 'console'], animated: false },
  { id: '__builtin__umbra_writing', name: 'umbra-writing', source: umbraWritingSource, keywords: ['umbra', 'ghost', 'writing', 'pencil', 'paper', 'draw', 'note', 'letter'], animated: false },
  { id: '__builtin__umbra_fist', name: 'umbra-fist', source: umbraFistSource, keywords: ['umbra', 'ghost', 'fist', 'punch', 'bump', 'power', 'fight', 'knuckles'], animated: false },
  { id: '__builtin__umbra_dead', name: 'umbra-dead', source: umbraDeadSource, keywords: ['umbra', 'ghost', 'dead', 'rip', 'ko', 'knocked', 'faint', 'x', 'eyes', 'done'], animated: false },
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
