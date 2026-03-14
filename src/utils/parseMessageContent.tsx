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
import { Image, Pressable, Linking, type TextStyle, type ViewStyle } from 'react-native';
import { Box, Text, useTheme } from '@coexist/wisp-react-native';
import type { CommunityEmoji, CommunitySticker } from '@umbra/service';
import { resolveShortcode } from '@/constants/emojiShortcodes';
import { dbg } from '@/utils/debug';

// ── Parse stats for per-render-cycle tracking ──
let _parseCallCount = 0;
let _parseTotalMs = 0;

export function resetParseStats() { _parseCallCount = 0; _parseTotalMs = 0; }
export function getParseStats() { return { calls: _parseCallCount, totalMs: _parseTotalMs }; }

// ── Parse result cache ───────────────────────────────────────────────
// Under message flood (e.g. 5 ghost bots), ChatArea re-renders 2-3×/sec
// and calls parseMessageContent for EVERY visible message (up to 200).
// Caching by content+theme eliminates ~99% of redundant regex parsing,
// reducing main-thread pressure from ~300ms/sec to ~5ms/sec.
const _PARSE_CACHE_MAX = 300;
const _parseCache = new Map<string, string | React.ReactNode>();
let _parseCacheHits = 0;

function _parseCacheKey(content: string, textColor?: string): string {
  // textColor acts as a proxy for the full theme; theme changes invalidate cache
  return textColor ? `${textColor}\0${content}` : content;
}

/** Clear the parse cache (e.g., on theme change or for tests). */
export function clearParseCache(): void {
  _parseCache.clear();
  _parseCacheHits = 0;
}

export function getParseCacheStats() {
  return { size: _parseCache.size, hits: _parseCacheHits };
}

/** Insert into cache with LRU-style eviction (drop oldest half when full). */
function _cacheSet(key: string, value: string | React.ReactNode): void {
  if (_parseCache.size >= _PARSE_CACHE_MAX) {
    // Map iteration order is insertion order — delete the oldest half
    const deleteCount = Math.floor(_PARSE_CACHE_MAX / 2);
    let deleted = 0;
    for (const k of _parseCache.keys()) {
      if (deleted >= deleteCount) break;
      _parseCache.delete(k);
      deleted++;
    }
  }
  _parseCache.set(key, value);
}

// ---------------------------------------------------------------------------
// Startup guard — defer parsing to avoid V8 GC exhaustion during app init
// ---------------------------------------------------------------------------

let _parsingEnabled = false;
const _STARTUP_DELAY_MS = 5000;

// Enable parsing after the startup window. During the first 5s, the V8
// cage is near-full from WASM modules and compiled JS. Deferring regex
// parsing avoids the "Ineffective mark-compacts near heap limit" crash.
if (typeof setTimeout !== 'undefined') {
  setTimeout(() => {
    _parsingEnabled = true;
    if (__DEV__) dbg.info('messages', 'Markdown parsing enabled (startup guard lifted)', undefined, 'parseMessageContent');
  }, _STARTUP_DELAY_MS);
}

/** Allow tests or other code to enable/disable parsing imperatively. */
export function setParsingEnabled(enabled: boolean): void {
  _parsingEnabled = enabled;
}

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
  | { type: 'unicode_shortcode'; emoji: string; name: string }
  | { type: 'annotation'; word: string; translation: string; pronunciation: string };

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

/** Regex for {{word|translation|pronunciation}} annotations */
const ANNOTATION_RE = /\{\{([^|{}]+)\|([^|{}]+)\|([^}]*)\}\}/g;

function parseInline(text: string, emojiMap: EmojiMap): InlineToken[] {
  // First pass: split on annotation patterns {{word|translation|pronunciation}}
  const segments: InlineToken[] = [];
  let annLastIndex = 0;
  let annMatch: RegExpExecArray | null;
  ANNOTATION_RE.lastIndex = 0;

  while ((annMatch = ANNOTATION_RE.exec(text)) !== null) {
    // Parse the text before this annotation with standard inline rules
    if (annMatch.index > annLastIndex) {
      segments.push(...parseInlineStandard(text.slice(annLastIndex, annMatch.index), emojiMap));
    }
    segments.push({
      type: 'annotation',
      word: annMatch[1],
      translation: annMatch[2],
      pronunciation: annMatch[3],
    });
    annLastIndex = annMatch.index + annMatch[0].length;
  }

  // Parse remaining text after last annotation
  if (annLastIndex < text.length) {
    segments.push(...parseInlineStandard(text.slice(annLastIndex), emojiMap));
  } else if (annLastIndex === 0) {
    // No annotations at all — parse normally
    return parseInlineStandard(text, emojiMap);
  }

  return segments;
}

/**
 * Maximum text length we'll run regex parsing on. Texts longer than this
 * (e.g. raw ciphertext from failed decryption) are returned as a single
 * text token. Without this guard, the INLINE_RE regex creates enough
 * temporary objects to trigger V8 "Ineffective mark-compacts near heap
 * limit" OOM crashes.
 */
const MAX_PARSEABLE_LENGTH = 2000;

// Detect undecrypted ciphertext (base64 blobs) — skip regex to avoid GC pressure
const BASE64_CIPHERTEXT_RE = /^[A-Za-z0-9+/]{20,}={0,2}$/;

function parseInlineStandard(text: string, emojiMap: EmojiMap): InlineToken[] {
  // Guard: skip regex parsing for oversized text to avoid V8 GC exhaustion
  if (text.length > MAX_PARSEABLE_LENGTH) {
    if (__DEV__) dbg.trace('messages', `parseInlineStandard SKIP (size guard len=${text.length})`, undefined, 'parseInlineStandard');
    return [{ type: 'text', value: text.slice(0, MAX_PARSEABLE_LENGTH) + '…' }];
  }
  // Guard: skip regex for undecrypted ciphertext (base64 blobs from failed decryption)
  if (text.length > 30 && BASE64_CIPHERTEXT_RE.test(text)) {
    if (__DEV__) dbg.trace('messages', `parseInlineStandard SKIP (ciphertext guard len=${text.length})`, undefined, 'parseInlineStandard');
    return [{ type: 'text', value: text }];
  }

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
// Annotation chip — tappable word with translation tooltip
// ---------------------------------------------------------------------------

function AnnotationChip({
  word,
  translation,
  pronunciation,
}: {
  word: string;
  translation: string;
  pronunciation: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const { theme } = useTheme();
  const colors = theme.colors;

  return (
    <Pressable onPress={() => setExpanded((v) => !v)} style={{ flexDirection: 'row', alignItems: 'baseline' }}>
      <Text
        style={{
          color: colors.accent.primary,
          fontWeight: '600',
          textDecorationLine: 'underline',
          textDecorationStyle: 'dotted',
        }}
      >
        {word}
      </Text>
      {expanded && (
        <Text size="xs" style={{ color: colors.text.muted, marginLeft: 3 }}>
          ({translation}{pronunciation ? ` · ${pronunciation}` : ''})
        </Text>
      )}
    </Pressable>
  );
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

      case 'annotation':
        return (
          <AnnotationChip
            key={key}
            word={token.word}
            translation={token.translation}
            pronunciation={token.pronunciation}
          />
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
            <Box key={key} style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap }}>
              {renderEmojiOnlyTokens(tokens, opts, cSz, uSz, key)}
            </Box>
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
          <Box key={key} style={cbStyle}>
            <Text
              style={{
                fontFamily: 'monospace',
                fontSize: fontSize - 1,
                color: opts.codeTextColor ?? '#e0e0e0',
              }}
            >
              {block.code}
            </Text>
          </Box>
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
          <Box key={key} style={qStyle}>
            {block.lines.map((line, li) => {
              const tokens = parseInline(line, opts.emojiMap);
              return (
                <Text key={`${key}-${li}`} style={{ color: textColor, fontSize, fontStyle: 'italic' }}>
                  {renderInlineTokens(tokens, opts, `${key}-${li}`)}
                </Text>
              );
            })}
          </Box>
        );
      }

      case 'unorderedList':
        return (
          <Box key={key} style={{ marginVertical: 2, paddingLeft: 12 }}>
            {block.items.map((item, li) => {
              const tokens = parseInline(item, opts.emojiMap);
              return (
                <Text key={`${key}-${li}`} style={{ color: textColor, fontSize }}>
                  •{' '}{renderInlineTokens(tokens, opts, `${key}-${li}`)}
                </Text>
              );
            })}
          </Box>
        );

      case 'orderedList':
        return (
          <Box key={key} style={{ marginVertical: 2, paddingLeft: 12 }}>
            {block.items.map((item, li) => {
              const tokens = parseInline(item, opts.emojiMap);
              return (
                <Text key={`${key}-${li}`} style={{ color: textColor, fontSize }}>
                  {li + 1}.{' '}{renderInlineTokens(tokens, opts, `${key}-${li}`)}
                </Text>
              );
            })}
          </Box>
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
 *   2 emoji  → 15×  (14px base → 210px)
 *   3 emoji  → 10×  (14px base → 140px)  — half the max size
 *   4 emoji  → 6×   (14px base → 84px)
 *   5 emoji  → 4×   (14px base → 56px)
 *   ≥7       → 2×   (14px base → 28px)   — compact inline
 */
function customEmojiMultiplier(count: number): number {
  if (count <= 0) return 1;
  if (count === 1) return 20;
  if (count === 2) return 15;
  if (count === 3) return 10;
  if (count >= 7) return 2;
  // 4–6: linear from 6× down to 2×
  return 6 - (count - 4) * (4 / 3);
}

/**
 * Unicode emoji scaling — moderate enlargement, not sticker-sized.
 *
 *   1 emoji  → 2.5× (14px base → 35px)
 *   2 emoji  → 2×   (14px base → 28px)
 *   3 emoji  → 1.25× (14px base → ~18px) — half the max size
 *   4 emoji  → 1.1×  (14px base → ~15px)
 *   ≥5       → 1×   (normal inline size)
 */
function unicodeEmojiMultiplier(count: number): number {
  if (count <= 0) return 1;
  if (count === 1) return 2.5;
  if (count === 2) return 2;
  if (count === 3) return 1.25;
  if (count === 4) return 1.1;
  return 1;
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

  // STARTUP GUARD: During the first seconds after app load, V8's main cage
  // is under extreme pressure (~3.9GB used from WASM modules, compiled code,
  // and the dev bundle). Any allocation in parseInlineStandard triggers
  // "Ineffective mark-compacts near heap limit" and crashes the renderer.
  // Return plain text during startup to avoid creating parse tokens and
  // React elements. After the cage stabilizes, parsing resumes normally.
  if (!_parsingEnabled) {
    if (__DEV__) dbg.trace('messages', 'parseMessageContent SKIP (startup guard)', undefined, 'parseMessageContent');
    return content;
  }

  // Guard: very large content (e.g. raw ciphertext from failed group decryption)
  // is truncated early to avoid OOM from regex parsing and React element creation.
  if (content.length > 5000) {
    if (__DEV__) dbg.trace('messages', `parseMessageContent SKIP (size guard len=${content.length})`, undefined, 'parseMessageContent');
    return content.slice(0, 2000) + '…';
  }

  // ── Cache lookup ─────────────────────────────────────────────────────
  // Message text is immutable after creation, so the parse result for a
  // given (content + theme) pair never changes. Caching prevents re-running
  // expensive regex parsing for all 200 visible messages on every render.
  const cacheKey = _parseCacheKey(content, themeColors?.textColor);
  const cached = _parseCache.get(cacheKey);
  if (cached !== undefined) {
    _parseCacheHits++;
    return cached;
  }

  const _t0 = __DEV__ ? performance.now() : 0;

  // Sticker message
  if (stickerMap && stickerMap.size > 0) {
    const stickerId = extractStickerId(content);
    if (stickerId) {
      const sticker = stickerMap.get(stickerId);
      if (sticker) {
        if (__DEV__) { const dur = performance.now() - _t0; _parseCallCount++; _parseTotalMs += dur; dbg.tracePerf('messages', 'parseMessageContent len=' + content.length, dur, 'parseMessageContent'); }
        return (
          <Box style={{ alignItems: 'flex-start' }}>
            <Image
              source={{ uri: sticker.imageUrl }}
              style={{ width: 200, height: 200 }}
              resizeMode="contain"
              accessibilityLabel={sticker.name}
            />
          </Box>
        );
      }
    }
  }

  // GIF message
  const gifUrl = extractGifUrl(content);
  if (gifUrl) {
    if (__DEV__) { const dur = performance.now() - _t0; _parseCallCount++; _parseTotalMs += dur; dbg.tracePerf('messages', 'parseMessageContent len=' + content.length, dur, 'parseMessageContent'); }
    return (
      <Box style={{ alignItems: 'flex-start' }}>
        <Image
          source={{ uri: gifUrl }}
          style={{ width: 250, height: 200, borderRadius: 8 }}
          resizeMode="contain"
          accessibilityLabel="GIF"
        />
      </Box>
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
    content.includes(':') ||
    content.includes('{{');

  // If no formatting markers and no emoji, return plain string
  if (!hasFormatting && emojiMap.size === 0) {
    if (__DEV__) { const dur = performance.now() - _t0; _parseCallCount++; _parseTotalMs += dur; dbg.tracePerf('messages', 'parseMessageContent len=' + content.length, dur, 'parseMessageContent'); }
    _cacheSet(cacheKey, content);
    return content;
  }

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

    if (__DEV__) {
      const dur = performance.now() - _t0; _parseCallCount++; _parseTotalMs += dur;
      if (dur > 5) dbg.tracePerf('messages', 'parseMessageContent SLOW len=' + content.length, dur, 'parseMessageContent');
      else dbg.tracePerf('messages', 'parseMessageContent len=' + content.length, dur, 'parseMessageContent');
    }

    // If there's only one paragraph block, unwrap it
    if (blocks.length === 1 && blocks[0].type === 'paragraph') {
      _cacheSet(cacheKey, rendered[0]);
      return rendered[0];
    }

    const blockResult = <Box style={{ gap: 4 }}>{rendered}</Box>;
    _cacheSet(cacheKey, blockResult);
    return blockResult;
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

    if (__DEV__) {
      const dur = performance.now() - _t0; _parseCallCount++; _parseTotalMs += dur;
      if (dur > 5) dbg.tracePerf('messages', 'parseMessageContent SLOW len=' + content.length, dur, 'parseMessageContent');
      else dbg.tracePerf('messages', 'parseMessageContent len=' + content.length, dur, 'parseMessageContent');
    }

    const emojiResult = (
      <Box style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap }}>
        {renderEmojiOnlyTokens(tokens, opts, cSz, uSz, 'emoji-only')}
      </Box>
    );
    _cacheSet(cacheKey, emojiResult);
    return emojiResult;
  }

  // If all tokens are plain text, return the original string
  if (tokens.every((t) => t.type === 'text')) {
    if (__DEV__) { const dur = performance.now() - _t0; _parseCallCount++; _parseTotalMs += dur; dbg.tracePerf('messages', 'parseMessageContent len=' + content.length, dur, 'parseMessageContent'); }
    _cacheSet(cacheKey, content);
    return content;
  }

  if (__DEV__) {
    const dur = performance.now() - _t0; _parseCallCount++; _parseTotalMs += dur;
    if (dur > 5) dbg.tracePerf('messages', 'parseMessageContent SLOW len=' + content.length, dur, 'parseMessageContent');
    else dbg.tracePerf('messages', 'parseMessageContent len=' + content.length, dur, 'parseMessageContent');
  }

  const inlineResult = (
    <Text style={{ color: opts.textColor ?? '#ffffff', fontSize: opts.baseFontSize ?? 14 }}>
      {renderInlineTokens(tokens, opts, 'inline')}
    </Text>
  );
  _cacheSet(cacheKey, inlineResult);
  return inlineResult;
}

// ---------------------------------------------------------------------------
// Public emoji-only detection helper
// ---------------------------------------------------------------------------

/**
 * Check whether a raw message string contains only emoji (and whitespace).
 * This is a lightweight check that works on raw text without needing a full
 * token parse — it strips custom emoji shortcodes (:name:) and whitespace,
 * then checks if the remainder is all Unicode emoji.
 *
 * Returns `true` if the message is emoji-only (1+ emoji, no other content).
 */
export function isEmojiOnlyMessage(text: string): boolean {
  if (!text || text.length === 0) return false;

  // Reject block-level formatting (code blocks, headings, lists, quotes)
  if (/^```|^#{1,3}\s|^>\s|^- |^\d+\.\s/m.test(text)) return false;

  // Reject inline formatting markers
  if (/\*\*|__|~~|\|\||`/.test(text)) return false;

  // Reject links
  if (/\[.*?\]\(.*?\)|https?:\/\//.test(text)) return false;

  // Reject sticker/gif patterns
  if (STICKER_PATTERN.test(text) || GIF_PATTERN.test(text)) return false;

  // Strip custom emoji shortcodes (:name:) — use a fresh regex to avoid
  // lastIndex issues with the module-level `g`-flagged EMOJI_PATTERN.
  const emojiShortcodeRe = /:([a-zA-Z0-9_]{2,32}):/g;
  const withoutCustom = text.replace(emojiShortcodeRe, '');
  const hadCustomEmoji = withoutCustom !== text;

  // Strip whitespace
  const stripped = withoutCustom.replace(/\s/g, '');

  // If nothing left, the message was all custom emoji (and/or whitespace)
  if (stripped.length === 0) {
    return hadCustomEmoji;
  }

  // Check if remainder is all Unicode emoji
  const emojiMatches = stripped.match(UNICODE_EMOJI_RE);
  if (!emojiMatches) return false;

  return emojiMatches.join('') === stripped;
}
