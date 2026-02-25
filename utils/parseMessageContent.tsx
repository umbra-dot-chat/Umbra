/**
 * parseMessageContent — Parses message text with markdown formatting,
 * custom emoji shortcodes (`:emoji_name:`), standard Unicode shortcodes
 * (`:thumbsup:`, `:fire:`, etc.), and sticker messages.
 *
 * Supported formatting:
 * - **bold**, *italic*, __underline__, ~~strikethrough~~
 * - `inline code`, ```code blocks```
 * - ||spoiler|| (tap/click to reveal)
 * - [link text](url) — clickable hyperlinks
 * - > block quotes
 * - - bullet lists, 1. numbered lists
 * - # Header, ## Subheader
 * - :custom_emoji: — inline images (community / built-in)
 * - :shortcode: — standard Unicode emoji via emojibase
 * - sticker::{stickerId} — full sticker messages
 */

import React, { useState } from 'react';
import { Image, Text, View, Pressable, Linking, type TextStyle, type ViewStyle } from 'react-native';
import type { CommunityEmoji, CommunitySticker } from '@umbra/service';
import { resolveShortcode } from '@/constants/emojiShortcodes';

// ---------------------------------------------------------------------------
// Patterns
// ---------------------------------------------------------------------------

const STICKER_PATTERN = /^sticker::(.+)$/;
const GIF_PATTERN = /^gif::(.+)$/;
const EMOJI_PATTERN = /:([a-zA-Z0-9_]{2,32}):/g;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EmojiMap = Map<string, CommunityEmoji>;
export type StickerMap = Map<string, CommunitySticker>;

export interface ParseOptions {
  emojiMap: EmojiMap;
  stickerMap?: StickerMap;
  textColor?: string;
  linkColor?: string;
  codeBgColor?: string;
  codeTextColor?: string;
  spoilerBgColor?: string;
  quoteBorderColor?: string;
  baseFontSize?: number;
  /** Override emoji display size (px). Computed automatically for emoji-only messages. */
  emojiSize?: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function buildEmojiMap(emojis: CommunityEmoji[]): EmojiMap {
  const map = new Map<string, CommunityEmoji>();
  for (const emoji of emojis) {
    map.set(emoji.name, emoji);
  }
  return map;
}

export function buildStickerMap(stickers: CommunitySticker[]): StickerMap {
  const map = new Map<string, CommunitySticker>();
  for (const sticker of stickers) {
    map.set(sticker.id, sticker);
  }
  return map;
}

export function isStickerMessage(content: string): boolean {
  return STICKER_PATTERN.test(content);
}

export function extractStickerId(content: string): string | null {
  const match = content.match(STICKER_PATTERN);
  return match ? match[1] : null;
}

export function isGifMessage(content: string): boolean {
  return GIF_PATTERN.test(content);
}

export function extractGifUrl(content: string): string | null {
  const match = content.match(GIF_PATTERN);
  return match ? match[1] : null;
}

// ---------------------------------------------------------------------------
// Spoiler wrapper component
// ---------------------------------------------------------------------------

function SpoilerText({
  children,
  bgColor,
}: {
  children: React.ReactNode;
  bgColor: string;
}) {
  const [revealed, setRevealed] = useState(false);

  return (
    <Pressable onPress={() => setRevealed((v) => !v)}>
      <Text
        style={{
          backgroundColor: revealed ? bgColor + '40' : bgColor,
          color: revealed ? undefined : 'transparent',
          borderRadius: 4,
          paddingHorizontal: 2,
          overflow: 'hidden',
        }}
        accessibilityLabel={revealed ? undefined : 'Spoiler (tap to reveal)'}
      >
        {children}
      </Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Inline token types
// ---------------------------------------------------------------------------

type InlineToken =
  | { type: 'text'; value: string }
  | { type: 'bold'; children: InlineToken[] }
  | { type: 'italic'; children: InlineToken[] }
  | { type: 'underline'; children: InlineToken[] }
  | { type: 'strikethrough'; children: InlineToken[] }
  | { type: 'code'; value: string }
  | { type: 'spoiler'; children: InlineToken[] }
  | { type: 'link'; text: string; url: string }
  | { type: 'emoji'; name: string }
  | { type: 'unicode_shortcode'; emoji: string; name: string };

// ---------------------------------------------------------------------------
// Inline parser — turns a text string into inline tokens
// ---------------------------------------------------------------------------

/**
 * Regex that matches the next inline formatting token.
 * Order matters — longer delimiters first to avoid partial matches.
 *
 * Groups:
 *  1: code `...`
 *  2: spoiler ||...||
 *  3: bold **...**
 *  4: underline __...__
 *  5: strikethrough ~~...~~
 *  6: italic *...*
 *  7: link [text](url)
 *  8: custom emoji :name:
 */
const INLINE_RE =
  /`([^`]+)`|\|\|(.+?)\|\||\*\*(.+?)\*\*|__(.+?)__(?!_)|~~(.+?)~~|\*(.+?)\*|\[([^\]]+)\]\(([^)]+)\)|:([a-zA-Z0-9_-]{2,32}):/gs;

function parseInline(text: string, emojiMap: EmojiMap): InlineToken[] {
  const tokens: InlineToken[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  INLINE_RE.lastIndex = 0;

  while ((match = INLINE_RE.exec(text)) !== null) {
    // Push any text before this match
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }

    const [, code, spoiler, bold, underline, strike, italic, linkText, linkUrl, emojiName] = match;

    if (code !== undefined) {
      tokens.push({ type: 'code', value: code });
    } else if (spoiler !== undefined) {
      tokens.push({ type: 'spoiler', children: parseInline(spoiler, emojiMap) });
    } else if (bold !== undefined) {
      tokens.push({ type: 'bold', children: parseInline(bold, emojiMap) });
    } else if (underline !== undefined) {
      tokens.push({ type: 'underline', children: parseInline(underline, emojiMap) });
    } else if (strike !== undefined) {
      tokens.push({ type: 'strikethrough', children: parseInline(strike, emojiMap) });
    } else if (italic !== undefined) {
      tokens.push({ type: 'italic', children: parseInline(italic, emojiMap) });
    } else if (linkText !== undefined && linkUrl !== undefined) {
      tokens.push({ type: 'link', text: linkText, url: linkUrl });
    } else if (emojiName !== undefined) {
      if (emojiMap.has(emojiName)) {
        // Custom / built-in emoji (image-based)
        tokens.push({ type: 'emoji', name: emojiName });
      } else {
        // Try standard Unicode shortcode (e.g. :thumbsup: → 👍)
        const unicode = resolveShortcode(emojiName);
        if (unicode) {
          tokens.push({ type: 'unicode_shortcode', emoji: unicode, name: emojiName });
        } else {
          // Not a known shortcode — keep raw text
          tokens.push({ type: 'text', value: match[0] });
        }
      }
    }

    lastIndex = match.index + match[0].length;
  }

  // Remaining text
  if (lastIndex < text.length) {
    tokens.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return tokens;
}

// ---------------------------------------------------------------------------
// Render inline tokens to React Native elements
// ---------------------------------------------------------------------------

function renderInlineTokens(
  tokens: InlineToken[],
  opts: ParseOptions,
  keyPrefix: string,
): React.ReactNode[] {
  return tokens.map((token, i) => {
    const key = `${keyPrefix}-${i}`;

    switch (token.type) {
      case 'text':
        return <Text key={key}>{token.value}</Text>;

      case 'bold':
        return (
          <Text key={key} style={{ fontWeight: '700' }}>
            {renderInlineTokens(token.children, opts, key)}
          </Text>
        );

      case 'italic':
        return (
          <Text key={key} style={{ fontStyle: 'italic' }}>
            {renderInlineTokens(token.children, opts, key)}
          </Text>
        );

      case 'underline':
        return (
          <Text key={key} style={{ textDecorationLine: 'underline' }}>
            {renderInlineTokens(token.children, opts, key)}
          </Text>
        );

      case 'strikethrough':
        return (
          <Text key={key} style={{ textDecorationLine: 'line-through' }}>
            {renderInlineTokens(token.children, opts, key)}
          </Text>
        );

      case 'code':
        return (
          <Text
            key={key}
            style={{
              fontFamily: 'monospace',
              fontSize: (opts.baseFontSize ?? 14) - 1,
              backgroundColor: opts.codeBgColor ?? '#2f3136',
              color: opts.codeTextColor ?? '#e0e0e0',
              paddingHorizontal: 4,
              paddingVertical: 1,
              borderRadius: 3,
              overflow: 'hidden',
            }}
          >
            {token.value}
          </Text>
        );

      case 'spoiler':
        return (
          <SpoilerText key={key} bgColor={opts.spoilerBgColor ?? '#555555'}>
            {renderInlineTokens(token.children, opts, key)}
          </SpoilerText>
        );

      case 'link':
        return (
          <Text
            key={key}
            style={{ color: opts.linkColor ?? '#5865F2', textDecorationLine: 'underline' }}
            onPress={() => {
              try {
                Linking.openURL(token.url);
              } catch {
                // Ignore invalid URLs
              }
            }}
            accessibilityRole="link"
          >
            {token.text}
          </Text>
        );

      case 'emoji': {
        const emoji = opts.emojiMap.get(token.name);
        if (!emoji) return <Text key={key}>:{token.name}:</Text>;
        const sz = opts.emojiSize ?? 20;
        return (
          <Image
            key={key}
            source={{ uri: emoji.imageUrl }}
            style={{
              width: sz,
              height: sz,
              marginHorizontal: sz > 24 ? 2 : 1,
              marginBottom: sz > 24 ? 0 : -4,
            }}
            resizeMode="contain"
            accessibilityLabel={`:${token.name}:`}
          />
        );
      }

      case 'unicode_shortcode':
        return (
          <Text key={key} accessibilityLabel={`:${token.name}:`}>
            {token.emoji}
          </Text>
        );

      default:
        return null;
    }
  });
}

/**
 * Render tokens for an emoji-only message with separate sizing for custom
 * (image-based, sticker-like) and Unicode (text-based, moderate) emoji.
 */
function renderEmojiOnlyTokens(
  tokens: InlineToken[],
  opts: ParseOptions,
  customSize: number,
  unicodeSize: number,
  keyPrefix: string,
): React.ReactNode[] {
  return tokens.map((token, i) => {
    const key = `${keyPrefix}-${i}`;
    if (token.type === 'emoji') {
      const emoji = opts.emojiMap.get(token.name);
      if (!emoji) return <Text key={key}>:{token.name}:</Text>;
      return (
        <Image
          key={key}
          source={{ uri: emoji.imageUrl }}
          style={{ width: customSize, height: customSize }}
          resizeMode="contain"
          accessibilityLabel={`:${token.name}:`}
        />
      );
    }
    if (token.type === 'unicode_shortcode') {
      return (
        <Text key={key} style={{ fontSize: unicodeSize, lineHeight: unicodeSize * 1.15 }} accessibilityLabel={`:${token.name}:`}>
          {token.emoji}
        </Text>
      );
    }
    if (token.type === 'text') {
      const stripped = token.value.trim();
      if (stripped.length === 0) return null;
      return (
        <Text key={key} style={{ fontSize: unicodeSize, lineHeight: unicodeSize * 1.15 }}>
          {stripped}
        </Text>
      );
    }
    return null;
  });
}

// ---------------------------------------------------------------------------
// Block-level types
// ---------------------------------------------------------------------------

type BlockToken =
  | { type: 'paragraph'; content: string }
  | { type: 'heading'; level: 1 | 2; content: string }
  | { type: 'codeBlock'; language: string; code: string }
  | { type: 'quote'; lines: string[] }
  | { type: 'unorderedList'; items: string[] }
  | { type: 'orderedList'; items: string[] };

// ---------------------------------------------------------------------------
// Block-level parser — splits content into block tokens
// ---------------------------------------------------------------------------

function parseBlocks(text: string): BlockToken[] {
  const lines = text.split('\n');
  const blocks: BlockToken[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block: ```lang\n...\n```
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++; // skip closing ```
      blocks.push({ type: 'codeBlock', language: lang, code: codeLines.join('\n') });
      continue;
    }

    // Heading: # or ##
    if (line.startsWith('## ')) {
      blocks.push({ type: 'heading', level: 2, content: line.slice(3) });
      i++;
      continue;
    }
    if (line.startsWith('# ')) {
      blocks.push({ type: 'heading', level: 1, content: line.slice(2) });
      i++;
      continue;
    }

    // Block quote: > text
    if (line.startsWith('> ')) {
      const quoteLines: string[] = [line.slice(2)];
      i++;
      while (i < lines.length && lines[i].startsWith('> ')) {
        quoteLines.push(lines[i].slice(2));
        i++;
      }
      blocks.push({ type: 'quote', lines: quoteLines });
      continue;
    }

    // Unordered list: - item
    if (/^[-*] /.test(line)) {
      const items: string[] = [line.slice(2)];
      i++;
      while (i < lines.length && /^[-*] /.test(lines[i])) {
        items.push(lines[i].slice(2));
        i++;
      }
      blocks.push({ type: 'unorderedList', items });
      continue;
    }

    // Ordered list: 1. item
    if (/^\d+\. /.test(line)) {
      const items: string[] = [line.replace(/^\d+\.\s/, '')];
      i++;
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ''));
        i++;
      }
      blocks.push({ type: 'orderedList', items });
      continue;
    }

    // Empty line — skip
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Default: paragraph (collect consecutive non-empty lines)
    const paraLines: string[] = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].startsWith('```') &&
      !lines[i].startsWith('# ') &&
      !lines[i].startsWith('## ') &&
      !lines[i].startsWith('> ') &&
      !/^[-*] /.test(lines[i]) &&
      !/^\d+\. /.test(lines[i])
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    blocks.push({ type: 'paragraph', content: paraLines.join('\n') });
  }

  return blocks;
}

// ---------------------------------------------------------------------------
// Render blocks
// ---------------------------------------------------------------------------

function renderBlocks(
  blocks: BlockToken[],
  opts: ParseOptions,
): React.ReactNode[] {
  const fontSize = opts.baseFontSize ?? 14;
  const textColor = opts.textColor ?? '#ffffff';

  return blocks.map((block, bi) => {
    const key = `block-${bi}`;

    switch (block.type) {
      case 'paragraph': {
        const tokens = parseInline(block.content, opts.emojiMap);
        const emojiInfo = analyzeEmojiOnly(tokens);
        if (emojiInfo) {
          const cSz = Math.round(fontSize * customEmojiMultiplier(emojiInfo.total));
          const uSz = Math.round(fontSize * unicodeEmojiMultiplier(emojiInfo.total));
          const gap = cSz > 40 ? 4 : 2;
          return (
            <View key={key} style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap }}>
              {renderEmojiOnlyTokens(tokens, opts, cSz, uSz, key)}
            </View>
          );
        }
        return (
          <Text key={key} style={{ color: textColor, fontSize }}>
            {renderInlineTokens(tokens, opts, key)}
          </Text>
        );
      }

      case 'heading': {
        const tokens = parseInline(block.content, opts.emojiMap);
        const hStyle: TextStyle = {
          color: textColor,
          fontSize: block.level === 1 ? fontSize + 6 : fontSize + 3,
          fontWeight: '700',
          marginBottom: 2,
        };
        return (
          <Text key={key} style={hStyle}>
            {renderInlineTokens(tokens, opts, key)}
          </Text>
        );
      }

      case 'codeBlock': {
        const cbStyle: ViewStyle = {
          backgroundColor: opts.codeBgColor ?? '#2f3136',
          borderRadius: 6,
          padding: 10,
          marginVertical: 4,
        };
        return (
          <View key={key} style={cbStyle}>
            <Text
              style={{
                fontFamily: 'monospace',
                fontSize: fontSize - 1,
                color: opts.codeTextColor ?? '#e0e0e0',
              }}
            >
              {block.code}
            </Text>
          </View>
        );
      }

      case 'quote': {
        const qStyle: ViewStyle = {
          borderLeftWidth: 3,
          borderLeftColor: opts.quoteBorderColor ?? '#4f545c',
          paddingLeft: 10,
          marginVertical: 2,
        };
        return (
          <View key={key} style={qStyle}>
            {block.lines.map((line, li) => {
              const tokens = parseInline(line, opts.emojiMap);
              return (
                <Text key={`${key}-${li}`} style={{ color: textColor, fontSize, fontStyle: 'italic' }}>
                  {renderInlineTokens(tokens, opts, `${key}-${li}`)}
                </Text>
              );
            })}
          </View>
        );
      }

      case 'unorderedList':
        return (
          <View key={key} style={{ marginVertical: 2, paddingLeft: 12 }}>
            {block.items.map((item, li) => {
              const tokens = parseInline(item, opts.emojiMap);
              return (
                <Text key={`${key}-${li}`} style={{ color: textColor, fontSize }}>
                  •{' '}{renderInlineTokens(tokens, opts, `${key}-${li}`)}
                </Text>
              );
            })}
          </View>
        );

      case 'orderedList':
        return (
          <View key={key} style={{ marginVertical: 2, paddingLeft: 12 }}>
            {block.items.map((item, li) => {
              const tokens = parseInline(item, opts.emojiMap);
              return (
                <Text key={`${key}-${li}`} style={{ color: textColor, fontSize }}>
                  {li + 1}.{' '}{renderInlineTokens(tokens, opts, `${key}-${li}`)}
                </Text>
              );
            })}
          </View>
        );

      default:
        return null;
    }
  });
}

// ---------------------------------------------------------------------------
// Emoji-only detection & scaling
// ---------------------------------------------------------------------------

/**
 * Matches a single Unicode emoji (including ZWJ sequences, flags, keycaps,
 * skin-tone modifiers, etc.). Covers the vast majority of emoji in use.
 */
const UNICODE_EMOJI_RE =
  /(?:\p{Emoji_Presentation}|\p{Extended_Pictographic})(?:\uFE0F?\u20E3|\uFE0F)?(?:\u200D(?:\p{Emoji_Presentation}|\p{Extended_Pictographic})(?:\uFE0F?\u20E3|\uFE0F)?)*/gu;

/** Breakdown of an emoji-only message: how many custom (image) vs Unicode emoji. */
interface EmojiOnlyInfo {
  total: number;
  customCount: number;   // image-based emoji (community / built-in)
  unicodeCount: number;  // native Unicode emoji + :shortcode: resolved emoji
}

/**
 * Check whether a flat token list contains only emoji (and optional whitespace).
 * Returns counts broken down by type, or `null` if the message has non-emoji content.
 */
function analyzeEmojiOnly(tokens: InlineToken[]): EmojiOnlyInfo | null {
  let customCount = 0;
  let unicodeCount = 0;
  for (const t of tokens) {
    if (t.type === 'emoji') {
      customCount++;
    } else if (t.type === 'unicode_shortcode') {
      unicodeCount++;
    } else if (t.type === 'text') {
      // Strip whitespace, then check if what remains is only Unicode emoji
      const stripped = t.value.replace(/\s/g, '');
      if (stripped.length === 0) continue; // whitespace-only — fine
      const emojiMatches = stripped.match(UNICODE_EMOJI_RE);
      if (!emojiMatches) return null; // non-emoji text
      // Verify that the emoji matches cover the entire stripped string
      const joined = emojiMatches.join('');
      if (joined !== stripped) return null; // leftover non-emoji characters
      unicodeCount += emojiMatches.length;
    } else {
      // Any other formatting (bold, code, link, etc.) means not emoji-only
      return null;
    }
  }
  const total = customCount + unicodeCount;
  if (total === 0) return null;
  return { total, customCount, unicodeCount };
}

/**
 * Custom emoji (image-based) scaling — these act like stickers.
 *
 *   1 emoji  → 20×  (14px base → 280px)
 *   2 emoji  → 14×  (14px base → 196px)
 *   3 emoji  → 10×  (14px base → 140px)
 *   5 emoji  → 6×   (14px base → 84px)
 *   ≥10      → 1.5× (14px base → 21px)
 */
function customEmojiMultiplier(count: number): number {
  if (count <= 0) return 1;
  if (count >= 10) return 1.5;
  // Linear: 1 → 20×, 10 → 1.5×
  return 20 - (count - 1) * (18.5 / 9);
}

/**
 * Unicode emoji scaling — moderate enlargement, not sticker-sized.
 *
 *   1 emoji  → 2.5× (14px base → 35px)
 *   3 emoji  → 2×   (14px base → 28px)
 *   5 emoji  → 1.5× (14px base → 21px)
 *   ≥8       → 1×   (normal inline size)
 */
function unicodeEmojiMultiplier(count: number): number {
  if (count <= 0) return 1;
  if (count >= 8) return 1;
  // Linear: 1 → 2.5×, 8 → 1×
  return 2.5 - (count - 1) * (1.5 / 7);
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Parse message content with full markdown formatting support.
 *
 * - Detects sticker messages (`sticker::{id}`) and renders sticker images
 * - Parses block-level formatting (headings, code blocks, quotes, lists)
 * - Parses inline formatting (bold, italic, underline, strikethrough, code,
 *   spoiler, links, custom emoji)
 * - Returns the original string for simple text with no formatting
 *
 * @param content - Raw message text
 * @param emojiMap - Map of emoji name → CommunityEmoji
 * @param stickerMap - Optional map of sticker ID → CommunitySticker
 * @param themeColors - Optional theme colors for consistent styling
 */
export function parseMessageContent(
  content: string,
  emojiMap: EmojiMap,
  stickerMap?: StickerMap,
  themeColors?: {
    textColor?: string;
    linkColor?: string;
    codeBgColor?: string;
    codeTextColor?: string;
    spoilerBgColor?: string;
    quoteBorderColor?: string;
  },
): string | React.ReactNode {
  if (!content) return content;

  // Sticker message
  if (stickerMap && stickerMap.size > 0) {
    const stickerId = extractStickerId(content);
    if (stickerId) {
      const sticker = stickerMap.get(stickerId);
      if (sticker) {
        return (
          <View style={{ alignItems: 'flex-start' }}>
            <Image
              source={{ uri: sticker.imageUrl }}
              style={{ width: 200, height: 200 }}
              resizeMode="contain"
              accessibilityLabel={sticker.name}
            />
          </View>
        );
      }
    }
  }

  // GIF message
  const gifUrl = extractGifUrl(content);
  if (gifUrl) {
    return (
      <View style={{ alignItems: 'flex-start' }}>
        <Image
          source={{ uri: gifUrl }}
          style={{ width: 250, height: 200, borderRadius: 8 }}
          resizeMode="contain"
          accessibilityLabel="GIF"
        />
      </View>
    );
  }

  // Quick check: does the content have any formatting markers?
  const hasFormatting =
    content.includes('*') ||
    content.includes('_') ||
    content.includes('~') ||
    content.includes('`') ||
    content.includes('|') ||
    content.includes('[') ||
    content.includes('#') ||
    content.includes('>') ||
    content.includes(':');

  // If no formatting markers and no emoji, return plain string
  if (!hasFormatting && emojiMap.size === 0) return content;

  // Check if content has any block-level formatting
  const hasBlocks =
    content.includes('\n') ||
    content.startsWith('```') ||
    content.startsWith('# ') ||
    content.startsWith('## ') ||
    content.startsWith('> ') ||
    /^[-*] /.test(content) ||
    /^\d+\. /.test(content);

  const opts: ParseOptions = {
    emojiMap,
    stickerMap,
    ...themeColors,
  };

  if (hasBlocks) {
    const blocks = parseBlocks(content);
    const rendered = renderBlocks(blocks, opts);

    // If there's only one paragraph block, unwrap it
    if (blocks.length === 1 && blocks[0].type === 'paragraph') {
      return rendered[0];
    }

    return <View style={{ gap: 4 }}>{rendered}</View>;
  }

  // Single-line inline parsing
  const tokens = parseInline(content, emojiMap);

  // Emoji-only messages get scaled — custom emoji large (sticker-like),
  // Unicode emoji moderately enlarged.
  const emojiInfo = analyzeEmojiOnly(tokens);
  if (emojiInfo) {
    const baseFontSize = opts.baseFontSize ?? 14;
    const cSz = Math.round(baseFontSize * customEmojiMultiplier(emojiInfo.total));
    const uSz = Math.round(baseFontSize * unicodeEmojiMultiplier(emojiInfo.total));
    const gap = cSz > 40 ? 4 : 2;

    return (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap }}>
        {renderEmojiOnlyTokens(tokens, opts, cSz, uSz, 'emoji-only')}
      </View>
    );
  }

  // If all tokens are plain text, return the original string
  if (tokens.every((t) => t.type === 'text')) {
    return content;
  }

  return (
    <Text style={{ color: opts.textColor ?? '#ffffff', fontSize: opts.baseFontSize ?? 14 }}>
      {renderInlineTokens(tokens, opts, 'inline')}
    </Text>
  );
}
