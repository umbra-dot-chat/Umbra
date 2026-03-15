/**
 * Tests for SearchQueryParser
 *
 * Covers parseSearchQuery, extractTokens, serializeSearchQuery, isEmptyQuery.
 *
 * @jest-environment jsdom
 */

import {
  parseSearchQuery,
  extractTokens,
  serializeSearchQuery,
  isEmptyQuery,
  type ParsedSearchQuery,
} from '@/services/SearchQueryParser';

// =============================================================================
// parseSearchQuery
// =============================================================================

describe('parseSearchQuery', () => {
  it('parses basic free-text query', () => {
    const result = parseSearchQuery('hello world');
    expect(result.text).toBe('hello world');
    expect(result.from).toBeUndefined();
    expect(result.in).toBeUndefined();
  });

  it('parses from: token', () => {
    const result = parseSearchQuery('from:Matt');
    expect(result.from).toBe('Matt');
    expect(result.text).toBe('');
  });

  it('parses in: token', () => {
    const result = parseSearchQuery('in:general');
    expect(result.in).toBe('general');
    expect(result.text).toBe('');
  });

  it('parses before: token', () => {
    const result = parseSearchQuery('before:2024-01-01');
    expect(result.before).toBe('2024-01-01');
    expect(result.text).toBe('');
  });

  it('parses after: token', () => {
    const result = parseSearchQuery('after:2024-01-01');
    expect(result.after).toBe('2024-01-01');
    expect(result.text).toBe('');
  });

  it('parses multiple tokens combined with free text', () => {
    const result = parseSearchQuery('from:Matt in:general hello world');
    expect(result.from).toBe('Matt');
    expect(result.in).toBe('general');
    expect(result.text).toBe('hello world');
  });

  it('parses has:file token', () => {
    const result = parseSearchQuery('has:file');
    expect(result.hasFile).toBe(true);
    expect(result.text).toBe('');
  });

  it('parses has:pin token', () => {
    const result = parseSearchQuery('has:pin');
    expect(result.hasPinned).toBe(true);
  });

  it('parses has:reaction token', () => {
    const result = parseSearchQuery('has:reaction');
    expect(result.hasReaction).toBe(true);
  });

  it('parses has:link token', () => {
    const result = parseSearchQuery('has:link');
    expect(result.hasLink).toBe(true);
  });

  it('parses quoted values with spaces', () => {
    const result = parseSearchQuery('from:"John Doe"');
    expect(result.from).toBe('John Doe');
  });

  it('returns empty text for empty string', () => {
    const result = parseSearchQuery('');
    expect(result.text).toBe('');
    expect(result.from).toBeUndefined();
  });

  it('handles mixed tokens and free text with extra whitespace', () => {
    const result = parseSearchQuery('  from:Matt   hello   world  ');
    expect(result.from).toBe('Matt');
    expect(result.text).toBe('hello world');
  });

  it('handles all tokens combined', () => {
    const result = parseSearchQuery(
      'from:Matt in:general before:2025-01-01 after:2024-01-01 has:file has:pin test query'
    );
    expect(result.from).toBe('Matt');
    expect(result.in).toBe('general');
    expect(result.before).toBe('2025-01-01');
    expect(result.after).toBe('2024-01-01');
    expect(result.hasFile).toBe(true);
    expect(result.hasPinned).toBe(true);
    expect(result.text).toBe('test query');
  });

  it('last token wins when duplicated', () => {
    const result = parseSearchQuery('from:Alice from:Bob');
    expect(result.from).toBe('Bob');
  });
});

// =============================================================================
// extractTokens
// =============================================================================

describe('extractTokens', () => {
  it('returns empty array when no tokens found', () => {
    expect(extractTokens('hello world')).toEqual([]);
  });

  it('extracts a single token', () => {
    const tokens = extractTokens('from:Matt');
    expect(tokens).toHaveLength(1);
    expect(tokens[0].key).toBe('from');
    expect(tokens[0].value).toBe('Matt');
  });

  it('extracts multiple tokens', () => {
    const tokens = extractTokens('from:Matt in:general has:file');
    expect(tokens).toHaveLength(3);
    expect(tokens.map((t) => t.key)).toEqual(['from', 'in', 'has']);
  });

  it('is case insensitive for token keys', () => {
    const tokens = extractTokens('FROM:Matt IN:general');
    expect(tokens).toHaveLength(2);
    expect(tokens[0].key).toBe('from');
    expect(tokens[1].key).toBe('in');
  });

  it('strips quotes from quoted values', () => {
    const tokens = extractTokens('from:"John Doe"');
    expect(tokens).toHaveLength(1);
    expect(tokens[0].value).toBe('John Doe');
  });

  it('records correct start and end positions', () => {
    const tokens = extractTokens('from:Matt');
    expect(tokens[0].start).toBe(0);
    expect(tokens[0].end).toBe(9);
  });

  it('handles tokens embedded in text', () => {
    const tokens = extractTokens('hello from:Matt world');
    expect(tokens).toHaveLength(1);
    expect(tokens[0].value).toBe('Matt');
  });
});

// =============================================================================
// serializeSearchQuery
// =============================================================================

describe('serializeSearchQuery', () => {
  it('serializes text only', () => {
    expect(serializeSearchQuery({ text: 'hello world' })).toBe('hello world');
  });

  it('serializes from and in filters', () => {
    const result = serializeSearchQuery({ text: '', from: 'Matt', in: 'general' });
    expect(result).toContain('from:Matt');
    expect(result).toContain('in:general');
  });

  it('serializes has flags', () => {
    const result = serializeSearchQuery({
      text: '',
      hasFile: true,
      hasPinned: true,
      hasReaction: true,
      hasLink: true,
    });
    expect(result).toContain('has:file');
    expect(result).toContain('has:pin');
    expect(result).toContain('has:reaction');
    expect(result).toContain('has:link');
  });

  it('quotes values with spaces', () => {
    const result = serializeSearchQuery({ text: '', from: 'John Doe' });
    expect(result).toContain('from:"John Doe"');
  });

  it('does not quote values without spaces', () => {
    const result = serializeSearchQuery({ text: '', from: 'Matt' });
    expect(result).toBe('from:Matt');
  });

  it('round-trips: parse then serialize produces equivalent query', () => {
    const original = 'from:Matt in:general has:file hello world';
    const parsed = parseSearchQuery(original);
    const serialized = serializeSearchQuery(parsed);
    const reparsed = parseSearchQuery(serialized);
    expect(reparsed).toEqual(parsed);
  });

  it('serializes empty query as empty string', () => {
    expect(serializeSearchQuery({ text: '' })).toBe('');
  });
});

// =============================================================================
// isEmptyQuery
// =============================================================================

describe('isEmptyQuery', () => {
  it('returns true for truly empty query', () => {
    expect(isEmptyQuery({ text: '' })).toBe(true);
  });

  it('returns false when text is set', () => {
    expect(isEmptyQuery({ text: 'hello' })).toBe(false);
  });

  it('returns false when from filter is set', () => {
    expect(isEmptyQuery({ text: '', from: 'Matt' })).toBe(false);
  });

  it('returns false when hasFile is true', () => {
    expect(isEmptyQuery({ text: '', hasFile: true })).toBe(false);
  });

  it('returns true for default parseSearchQuery("") result', () => {
    expect(isEmptyQuery(parseSearchQuery(''))).toBe(true);
  });

  it('returns false when all fields are populated', () => {
    const query: ParsedSearchQuery = {
      text: 'hello',
      from: 'Matt',
      in: 'general',
      before: '2025-01-01',
      after: '2024-01-01',
      hasFile: true,
      hasReaction: true,
      hasPinned: true,
      hasLink: true,
    };
    expect(isEmptyQuery(query)).toBe(false);
  });
});
