/**
 * SearchQueryParser — Parses search queries with inline filter tokens.
 *
 * Supports tokens: from:, in:, before:, after:, has:file, has:pin, has:reaction, has:link
 * Remaining text becomes the free-text query.
 *
 * @example
 * parseSearchQuery('from:Matt in:general before:2025-03-01 hello world')
 * // => { text: 'hello world', from: 'Matt', in: 'general', before: '2025-03-01' }
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ParsedSearchQuery {
  /** Free-text portion of the query (everything not captured by tokens) */
  text: string;
  /** User display name or DID to filter by sender */
  from?: string;
  /** Conversation/channel name to scope results */
  in?: string;
  /** ISO date string — results before this date */
  before?: string;
  /** ISO date string — results after this date */
  after?: string;
  /** Filter to messages with file attachments */
  hasFile?: boolean;
  /** Filter to messages with reactions */
  hasReaction?: boolean;
  /** Filter to pinned messages */
  hasPinned?: boolean;
  /** Filter to messages containing links */
  hasLink?: boolean;
}

/** Token names recognized by the parser. */
export type TokenKey = 'from' | 'in' | 'before' | 'after' | 'has';

/** Values accepted by the `has:` token. */
export type HasValue = 'file' | 'pin' | 'reaction' | 'link';

/** A single parsed token extracted from the query string. */
export interface ParsedToken {
  key: TokenKey;
  value: string;
  /** Start index in the original query string */
  start: number;
  /** End index (exclusive) in the original query string */
  end: number;
}

// ---------------------------------------------------------------------------
// Token regex
// ---------------------------------------------------------------------------

/**
 * Matches tokens in the form `key:value` or `key:"value with spaces"`.
 * Captures: [1] = key, [2] = quoted value (if quoted), [3] = unquoted value
 */
const TOKEN_REGEX = /\b(from|in|before|after|has):((?:"[^"]*")|(?:\S+))/gi;

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

/**
 * Parse a raw search query string into a structured filter object.
 * Tokens are extracted and the remaining text is returned as `text`.
 */
export function parseSearchQuery(raw: string): ParsedSearchQuery {
  const result: ParsedSearchQuery = { text: '' };
  const tokens = extractTokens(raw);

  for (const token of tokens) {
    applyToken(result, token);
  }

  // Build free-text by removing all token spans from the raw query
  result.text = removeTokenSpans(raw, tokens).trim().replace(/\s+/g, ' ');

  return result;
}

/**
 * Extract all token matches from a raw query string.
 */
export function extractTokens(raw: string): ParsedToken[] {
  const tokens: ParsedToken[] = [];
  let match: RegExpExecArray | null;

  // Reset regex state
  TOKEN_REGEX.lastIndex = 0;

  while ((match = TOKEN_REGEX.exec(raw)) !== null) {
    const key = match[1].toLowerCase() as TokenKey;
    let value = match[2];

    // Strip surrounding quotes
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }

    tokens.push({
      key,
      value,
      start: match.index,
      end: match.index + match[0].length,
    });
  }

  return tokens;
}

/**
 * Serialize a ParsedSearchQuery back into a query string with inline tokens.
 */
export function serializeSearchQuery(query: ParsedSearchQuery): string {
  const parts: string[] = [];

  if (query.from) {
    parts.push(query.from.includes(' ') ? `from:"${query.from}"` : `from:${query.from}`);
  }
  if (query.in) {
    parts.push(query.in.includes(' ') ? `in:"${query.in}"` : `in:${query.in}`);
  }
  if (query.before) parts.push(`before:${query.before}`);
  if (query.after) parts.push(`after:${query.after}`);
  if (query.hasFile) parts.push('has:file');
  if (query.hasPinned) parts.push('has:pin');
  if (query.hasReaction) parts.push('has:reaction');
  if (query.hasLink) parts.push('has:link');
  if (query.text) parts.push(query.text);

  return parts.join(' ');
}

/**
 * Check whether a parsed query has any active filters (tokens or text).
 */
export function isEmptyQuery(query: ParsedSearchQuery): boolean {
  return (
    !query.text &&
    !query.from &&
    !query.in &&
    !query.before &&
    !query.after &&
    !query.hasFile &&
    !query.hasReaction &&
    !query.hasPinned &&
    !query.hasLink
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function applyToken(result: ParsedSearchQuery, token: ParsedToken): void {
  switch (token.key) {
    case 'from':
      result.from = token.value;
      break;
    case 'in':
      result.in = token.value;
      break;
    case 'before':
      result.before = token.value;
      break;
    case 'after':
      result.after = token.value;
      break;
    case 'has':
      applyHasToken(result, token.value.toLowerCase() as HasValue);
      break;
  }
}

function applyHasToken(result: ParsedSearchQuery, value: HasValue): void {
  switch (value) {
    case 'file':
      result.hasFile = true;
      break;
    case 'pin':
      result.hasPinned = true;
      break;
    case 'reaction':
      result.hasReaction = true;
      break;
    case 'link':
      result.hasLink = true;
      break;
  }
}

function removeTokenSpans(raw: string, tokens: ParsedToken[]): string {
  if (tokens.length === 0) return raw;

  // Sort by start position descending to safely splice
  const sorted = [...tokens].sort((a, b) => b.start - a.start);
  let result = raw;

  for (const token of sorted) {
    result = result.slice(0, token.start) + result.slice(token.end);
  }

  return result;
}
