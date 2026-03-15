/**
 * UnifiedSearchContext — Unit Tests
 *
 * Tests for unified search state management:
 *   - Default state
 *   - Open/close overlay
 *   - Query management
 *   - Scope switching
 *   - Filter panel
 *   - Sidebar search
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react-native';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('@/contexts/UmbraContext', () => ({
  useUmbra: () => ({
    service: null,
    isReady: false,
  }),
}));

jest.mock('@/services/SearchQueryParser', () => ({
  parseSearchQuery: jest.fn((raw: string) => ({ text: raw })),
  serializeSearchQuery: jest.fn((pq: any) => pq.text || ''),
  isEmptyQuery: jest.fn((pq: any) => !pq.text),
}));

jest.mock('@/services/SearchIndexService', () => ({
  SearchIndexService: jest.fn().mockImplementation(() => ({
    search: jest.fn(() => []),
    buildIndex: jest.fn().mockResolvedValue(undefined),
    indexMessage: jest.fn(),
    onStatusChange: jest.fn(() => jest.fn()),
    size: 0,
  })),
}));

jest.mock('@/services/SearchHistoryService', () => ({
  getSearchHistory: jest.fn(() => []),
  addSearchQuery: jest.fn(),
  removeSearchQuery: jest.fn(),
  clearSearchHistory: jest.fn(),
}));

import {
  UnifiedSearchProvider,
  useUnifiedSearch,
} from '@/contexts/UnifiedSearchContext';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

function wrapper({ children }: { children: React.ReactNode }) {
  return <UnifiedSearchProvider>{children}</UnifiedSearchProvider>;
}

// ---------------------------------------------------------------------------
// Setup / teardown — use fake timers to control debounce
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  // Flush any pending debounced searches to prevent "cannot log after tests" warnings
  act(() => {
    jest.runAllTimers();
  });
  jest.useRealTimers();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('UnifiedSearchContext — Default state', () => {
  it('isOpen starts as false', () => {
    const { result } = renderHook(() => useUnifiedSearch(), { wrapper });
    expect(result.current.isOpen).toBe(false);
  });

  it('query starts as empty string', () => {
    const { result } = renderHook(() => useUnifiedSearch(), { wrapper });
    expect(result.current.query).toBe('');
  });

  it('scope defaults to all', () => {
    const { result } = renderHook(() => useUnifiedSearch(), { wrapper });
    expect(result.current.scope).toBe('all');
  });

  it('results starts as empty array', () => {
    const { result } = renderHook(() => useUnifiedSearch(), { wrapper });
    expect(result.current.results).toEqual([]);
  });

  it('loading starts as false', () => {
    const { result } = renderHook(() => useUnifiedSearch(), { wrapper });
    expect(result.current.loading).toBe(false);
  });

  it('filtersExpanded starts as false', () => {
    const { result } = renderHook(() => useUnifiedSearch(), { wrapper });
    expect(result.current.filtersExpanded).toBe(false);
  });

  it('sidebarSearchActive starts as false', () => {
    const { result } = renderHook(() => useUnifiedSearch(), { wrapper });
    expect(result.current.sidebarSearchActive).toBe(false);
  });

  it('activeConversationId starts as null', () => {
    const { result } = renderHook(() => useUnifiedSearch(), { wrapper });
    expect(result.current.activeConversationId).toBeNull();
  });
});

describe('UnifiedSearchContext — Open/close', () => {
  it('openSearch sets isOpen to true', () => {
    const { result } = renderHook(() => useUnifiedSearch(), { wrapper });

    act(() => {
      result.current.openSearch();
    });
    expect(result.current.isOpen).toBe(true);
  });

  it('closeSearch resets state', () => {
    const { result } = renderHook(() => useUnifiedSearch(), { wrapper });

    act(() => {
      result.current.openSearch();
      result.current.setQuery('test');
    });

    act(() => {
      result.current.closeSearch();
    });

    expect(result.current.isOpen).toBe(false);
    expect(result.current.query).toBe('');
    expect(result.current.filtersExpanded).toBe(false);
  });
});

describe('UnifiedSearchContext — Query', () => {
  it('setQuery updates the query', () => {
    const { result } = renderHook(() => useUnifiedSearch(), { wrapper });

    act(() => {
      result.current.setQuery('hello world');
    });

    expect(result.current.query).toBe('hello world');
  });
});

describe('UnifiedSearchContext — Scope', () => {
  it('setScope changes the scope', () => {
    const { result } = renderHook(() => useUnifiedSearch(), { wrapper });

    act(() => {
      result.current.setScope('current');
    });
    expect(result.current.scope).toBe('current');

    act(() => {
      result.current.setScope('all');
    });
    expect(result.current.scope).toBe('all');
  });
});

describe('UnifiedSearchContext — Filters', () => {
  it('setFiltersExpanded toggles filter panel', () => {
    const { result } = renderHook(() => useUnifiedSearch(), { wrapper });

    act(() => {
      result.current.setFiltersExpanded(true);
    });
    expect(result.current.filtersExpanded).toBe(true);

    act(() => {
      result.current.setFiltersExpanded(false);
    });
    expect(result.current.filtersExpanded).toBe(false);
  });
});

describe('UnifiedSearchContext — Sidebar search', () => {
  it('setSidebarSearchActive activates sidebar and sets scope to current', () => {
    const { result } = renderHook(() => useUnifiedSearch(), { wrapper });

    act(() => {
      result.current.setSidebarSearchActive(true);
    });

    expect(result.current.sidebarSearchActive).toBe(true);
    expect(result.current.scope).toBe('current');
  });

  it('deactivating sidebar search resets query', () => {
    const { result } = renderHook(() => useUnifiedSearch(), { wrapper });

    act(() => {
      result.current.setSidebarSearchActive(true);
      result.current.setQuery('search term');
    });

    act(() => {
      result.current.setSidebarSearchActive(false);
    });

    expect(result.current.sidebarSearchActive).toBe(false);
    expect(result.current.query).toBe('');
  });
});

describe('UnifiedSearchContext — Active conversation', () => {
  it('setActiveConversationId updates the active conversation', () => {
    const { result } = renderHook(() => useUnifiedSearch(), { wrapper });

    act(() => {
      result.current.setActiveConversationId('conv-123');
    });
    expect(result.current.activeConversationId).toBe('conv-123');

    act(() => {
      result.current.setActiveConversationId(null);
    });
    expect(result.current.activeConversationId).toBeNull();
  });
});

describe('UnifiedSearchContext — Default context (outside provider)', () => {
  it('works outside provider with default values', () => {
    // UnifiedSearchContext uses createContext with defaults, so no throw
    const { result } = renderHook(() => useUnifiedSearch());
    expect(result.current.isOpen).toBe(false);
    expect(result.current.query).toBe('');
  });
});
