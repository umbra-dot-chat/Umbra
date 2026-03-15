/**
 * Tests for SearchHistoryService
 *
 * Covers getSearchHistory, addSearchQuery, removeSearchQuery, clearSearchHistory.
 *
 * @jest-environment jsdom
 */

import {
  getSearchHistory,
  addSearchQuery,
  removeSearchQuery,
  clearSearchHistory,
} from '@/services/SearchHistoryService';

// =============================================================================
// localStorage mock
// =============================================================================

const mockStorage: Record<string, string> = {};

beforeEach(() => {
  Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
  jest.spyOn(Storage.prototype, 'getItem').mockImplementation((k) => mockStorage[k] ?? null);
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation((k, v) => {
    mockStorage[k] = v;
  });
  jest.spyOn(Storage.prototype, 'removeItem').mockImplementation((k) => {
    delete mockStorage[k];
  });
});

afterEach(() => jest.restoreAllMocks());

// =============================================================================
// getSearchHistory
// =============================================================================

describe('getSearchHistory', () => {
  it('returns empty array when storage is empty', () => {
    expect(getSearchHistory()).toEqual([]);
  });

  it('returns parsed array from valid JSON', () => {
    mockStorage['umbra:search-history'] = JSON.stringify(['foo', 'bar']);
    expect(getSearchHistory()).toEqual(['foo', 'bar']);
  });

  it('returns empty array for corrupted JSON', () => {
    mockStorage['umbra:search-history'] = 'not valid json{{{';
    expect(getSearchHistory()).toEqual([]);
  });

  it('returns empty array if stored value is not an array', () => {
    mockStorage['umbra:search-history'] = JSON.stringify({ key: 'value' });
    expect(getSearchHistory()).toEqual([]);
  });
});

// =============================================================================
// addSearchQuery
// =============================================================================

describe('addSearchQuery', () => {
  it('adds a new query to empty history', () => {
    addSearchQuery('hello');
    expect(getSearchHistory()).toEqual(['hello']);
  });

  it('moves duplicate query to front', () => {
    addSearchQuery('first');
    addSearchQuery('second');
    addSearchQuery('first');
    const history = getSearchHistory();
    expect(history[0]).toBe('first');
    expect(history).toEqual(['first', 'second']);
  });

  it('enforces max 20 entries', () => {
    for (let i = 0; i < 25; i++) {
      addSearchQuery(`query-${i}`);
    }
    const history = getSearchHistory();
    expect(history).toHaveLength(20);
    // Most recent should be first
    expect(history[0]).toBe('query-24');
  });

  it('ignores empty string', () => {
    addSearchQuery('');
    expect(getSearchHistory()).toEqual([]);
  });

  it('ignores whitespace-only string', () => {
    addSearchQuery('   ');
    expect(getSearchHistory()).toEqual([]);
  });

  it('trims whitespace from query before adding', () => {
    addSearchQuery('  hello  ');
    expect(getSearchHistory()).toEqual(['hello']);
  });
});

// =============================================================================
// removeSearchQuery
// =============================================================================

describe('removeSearchQuery', () => {
  it('removes an existing entry', () => {
    addSearchQuery('first');
    addSearchQuery('second');
    removeSearchQuery('first');
    expect(getSearchHistory()).toEqual(['second']);
  });

  it('is a no-op for non-existent entry', () => {
    addSearchQuery('first');
    removeSearchQuery('nonexistent');
    expect(getSearchHistory()).toEqual(['first']);
  });
});

// =============================================================================
// clearSearchHistory
// =============================================================================

describe('clearSearchHistory', () => {
  it('empties the history list', () => {
    addSearchQuery('first');
    addSearchQuery('second');
    clearSearchHistory();
    expect(getSearchHistory()).toEqual([]);
  });
});

// =============================================================================
// Edge cases
// =============================================================================

describe('edge cases', () => {
  it('does not crash when localStorage.setItem throws (quota exceeded)', () => {
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    // Should not throw
    expect(() => addSearchQuery('hello')).not.toThrow();
  });
});
