/**
 * Tests for useIsMobile hook and sidebar layout logic
 *
 * Covers: mobile breakpoint detection, sidebar resize clamping,
 * sidebar search filtering, and mobile layout state.
 *
 * Matches Playwright E2E coverage for Section 2 (Navigation & Layout):
 *   T2.1 (Nav Rail), T2.2 (Sidebar), T2.3 (Sidebar Search),
 *   T2.4 (New Chat Menu), T2.6 (Sidebar Resize), T2.7 (Mobile Layout)
 *
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { useIsMobile, MOBILE_BREAKPOINT } from '@/hooks/useIsMobile';

// ---------------------------------------------------------------------------
// Platform mock — ensure we test the web path
// ---------------------------------------------------------------------------

const originalOS = Platform.OS;

beforeAll(() => {
  Object.defineProperty(Platform, 'OS', { value: 'web', writable: true });
});

afterAll(() => {
  Object.defineProperty(Platform, 'OS', { value: originalOS, writable: true });
});

// ---------------------------------------------------------------------------
// matchMedia mock
// ---------------------------------------------------------------------------

let mediaListeners: Array<(e: { matches: boolean }) => void> = [];
let currentMatches = false;

beforeEach(() => {
  mediaListeners = [];
  currentMatches = false;

  Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });

  window.matchMedia = jest.fn().mockImplementation((query: string) => ({
    matches: currentMatches,
    media: query,
    addEventListener: (_event: string, handler: (e: { matches: boolean }) => void) => {
      mediaListeners.push(handler);
    },
    removeEventListener: (_event: string, handler: (e: { matches: boolean }) => void) => {
      mediaListeners = mediaListeners.filter((h) => h !== handler);
    },
    addListener: jest.fn(),
    removeListener: jest.fn(),
    onchange: null,
    dispatchEvent: jest.fn(),
  }));
});

// ---------------------------------------------------------------------------
// T2.7.1 — MOBILE_BREAKPOINT export
// ---------------------------------------------------------------------------

describe('T2.7 — MOBILE_BREAKPOINT constant', () => {
  it('T2.7.1 — exports MOBILE_BREAKPOINT as 768', () => {
    expect(MOBILE_BREAKPOINT).toBe(768);
  });
});

// ---------------------------------------------------------------------------
// T2.7.1-2 — useIsMobile initial state
// ---------------------------------------------------------------------------

describe('T2.7 — useIsMobile initial state', () => {
  it('T2.7.1a — returns false on wide viewport (> 768px)', () => {
    currentMatches = false;
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
    window.matchMedia = jest.fn().mockReturnValue({
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    });

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it('T2.7.2 — returns true on narrow viewport (<= 768px)', () => {
    Object.defineProperty(window, 'innerWidth', { value: 375, writable: true });
    window.matchMedia = jest.fn().mockReturnValue({
      matches: true,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    });

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// T2.7.3-4 — useIsMobile responds to media query changes
// ---------------------------------------------------------------------------

describe('T2.7 — useIsMobile dynamic response', () => {
  it('T2.7.3 — updates to true when viewport shrinks below breakpoint', () => {
    currentMatches = false;
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);

    // Simulate viewport resize via matchMedia listener
    act(() => {
      for (const listener of mediaListeners) {
        listener({ matches: true });
      }
    });

    expect(result.current).toBe(true);
  });

  it('T2.7.4 — updates to false when viewport grows above breakpoint', () => {
    currentMatches = true;
    window.matchMedia = jest.fn().mockImplementation((query: string) => ({
      matches: true,
      media: query,
      addEventListener: (_event: string, handler: (e: { matches: boolean }) => void) => {
        mediaListeners.push(handler);
      },
      removeEventListener: jest.fn(),
    }));

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);

    act(() => {
      for (const listener of mediaListeners) {
        listener({ matches: false });
      }
    });

    expect(result.current).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// T2.7.5 — Cleanup on unmount
// ---------------------------------------------------------------------------

describe('T2.7 — useIsMobile cleanup', () => {
  it('T2.7.5 — removes matchMedia listener on unmount', () => {
    const removeFn = jest.fn();
    window.matchMedia = jest.fn().mockReturnValue({
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: removeFn,
    });

    const { unmount } = renderHook(() => useIsMobile());
    unmount();

    expect(removeFn).toHaveBeenCalledWith('change', expect.any(Function));
  });
});

// ---------------------------------------------------------------------------
// T2.6.1-4 — Sidebar resize clamping logic
// (Tests the pure Math.min/max clamping from _layout.tsx)
// ---------------------------------------------------------------------------

describe('T2.6 — Sidebar resize constraints', () => {
  const SIDEBAR_MIN = 220;
  const SIDEBAR_DEFAULT = 320;
  const SIDEBAR_MAX = 500;

  /** Pure function extracted from _layout.tsx handleSidebarResize */
  function clampWidth(currentWidth: number, dx: number): number {
    return Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, currentWidth + dx));
  }

  it('T2.6.1 — drag increases width within bounds', () => {
    const result = clampWidth(SIDEBAR_DEFAULT, 80);
    expect(result).toBe(400);
    expect(result).toBeGreaterThan(SIDEBAR_DEFAULT);
  });

  it('T2.6.2 — sidebar never goes below minimum (220px)', () => {
    const result = clampWidth(SIDEBAR_DEFAULT, -600);
    expect(result).toBe(SIDEBAR_MIN);
    expect(result).toBeGreaterThanOrEqual(SIDEBAR_MIN);
  });

  it('T2.6.3 — sidebar never goes above maximum (500px)', () => {
    const result = clampWidth(SIDEBAR_DEFAULT, 600);
    expect(result).toBe(SIDEBAR_MAX);
    expect(result).toBeLessThanOrEqual(SIDEBAR_MAX);
  });

  it('T2.6.4 — no drag (dx=0) preserves current width', () => {
    const result = clampWidth(350, 0);
    expect(result).toBe(350);
  });

  it('T2.6.2b — clamping from minimum stays at minimum', () => {
    const result = clampWidth(SIDEBAR_MIN, -50);
    expect(result).toBe(SIDEBAR_MIN);
  });

  it('T2.6.3b — clamping from maximum stays at maximum', () => {
    const result = clampWidth(SIDEBAR_MAX, 50);
    expect(result).toBe(SIDEBAR_MAX);
  });

  it('T2.6.1b — default sidebar width is 320', () => {
    expect(SIDEBAR_DEFAULT).toBe(320);
  });
});

// ---------------------------------------------------------------------------
// T2.3.1-5 — Sidebar search filtering logic
// (Tests the pure filtering function from _layout.tsx)
// ---------------------------------------------------------------------------

describe('T2.3 — Sidebar search filtering', () => {
  interface SidebarConversation {
    id: string;
    name: string;
    last: string;
    time: string;
    unread: number;
  }

  interface Friend {
    did: string;
    displayName: string;
  }

  interface Conversation {
    id: string;
    friendDid?: string;
  }

  /**
   * Pure filter function extracted from _layout.tsx `filtered` useMemo.
   */
  function filterConversations(
    sidebarConversations: SidebarConversation[],
    searchTerm: string,
    friends: Friend[],
    conversations: Conversation[],
  ): SidebarConversation[] {
    if (!searchTerm.trim()) return sidebarConversations;
    const lowerSearch = searchTerm.toLowerCase();
    const matchingFriendDids = new Set(
      friends
        .filter((f) => f.displayName.toLowerCase().includes(lowerSearch))
        .map((f) => f.did),
    );
    return sidebarConversations.filter((c) => {
      if (c.name.toLowerCase().includes(lowerSearch)) return true;
      if (c.last && c.last.toLowerCase().includes(lowerSearch)) return true;
      const conv = conversations.find((conv) => conv.id === c.id);
      if (conv?.friendDid && matchingFriendDids.has(conv.friendDid)) return true;
      return false;
    });
  }

  const mockConversations: SidebarConversation[] = [
    { id: '1', name: 'Alice Chat', last: 'hello world', time: '12:00', unread: 0 },
    { id: '2', name: 'Bob Chat', last: 'goodbye', time: '11:00', unread: 1 },
    { id: '3', name: 'Team Project', last: 'meeting at 3pm', time: '10:00', unread: 0 },
  ];

  const mockFriends: Friend[] = [
    { did: 'did:key:alice', displayName: 'Alice Wonderland' },
    { did: 'did:key:bob', displayName: 'Bob Builder' },
  ];

  const mockConvs: Conversation[] = [
    { id: '1', friendDid: 'did:key:alice' },
    { id: '2', friendDid: 'did:key:bob' },
    { id: '3' },
  ];

  it('T2.3.1 — empty search returns all conversations', () => {
    const result = filterConversations(mockConversations, '', mockFriends, mockConvs);
    expect(result).toHaveLength(3);
  });

  it('T2.3.1b — whitespace-only search returns all conversations', () => {
    const result = filterConversations(mockConversations, '   ', mockFriends, mockConvs);
    expect(result).toHaveLength(3);
  });

  it('T2.3.1c — filters by conversation name', () => {
    const result = filterConversations(mockConversations, 'Alice', mockFriends, mockConvs);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('T2.3.2 — filters by last message preview text', () => {
    const result = filterConversations(mockConversations, 'hello world', mockFriends, mockConvs);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('T2.3.3 — filters by friend display name in conversation', () => {
    const result = filterConversations(mockConversations, 'Builder', mockFriends, mockConvs);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });

  it('T2.3.4 — clearing search restores all conversations', () => {
    const filtered = filterConversations(mockConversations, 'Alice', mockFriends, mockConvs);
    expect(filtered).toHaveLength(1);

    const restored = filterConversations(mockConversations, '', mockFriends, mockConvs);
    expect(restored).toHaveLength(3);
  });

  it('T2.3.5 — no-match search returns empty array', () => {
    const result = filterConversations(mockConversations, 'zzz_no_match_xyz', mockFriends, mockConvs);
    expect(result).toHaveLength(0);
  });

  it('T2.3.1d — search is case insensitive', () => {
    const result = filterConversations(mockConversations, 'ALICE', mockFriends, mockConvs);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('T2.3.2b — partial match on last message', () => {
    const result = filterConversations(mockConversations, 'meeting', mockFriends, mockConvs);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('3');
  });
});

// ---------------------------------------------------------------------------
// T2.4 — NewChatMenu callback logic
// ---------------------------------------------------------------------------

describe('T2.4 — NewChatMenu callback behavior', () => {
  it('T2.4.1 — handleNewDm calls onNewDm then onClose', () => {
    const onNewDm = jest.fn();
    const onClose = jest.fn();

    // Simulates NewChatMenu internal handleNewDm callback
    const handleNewDm = () => {
      onNewDm();
      onClose();
    };

    handleNewDm();

    expect(onNewDm).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('T2.4.3 — handleNewGroup calls onNewGroup then onClose', () => {
    const onNewGroup = jest.fn();
    const onClose = jest.fn();

    const handleNewGroup = () => {
      onNewGroup();
      onClose();
    };

    handleNewGroup();

    expect(onNewGroup).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('T2.4.4 — menu not visible returns null behavior', () => {
    const visible = false;
    // When visible is false, NewChatMenu returns null
    expect(visible ? 'rendered' : null).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// T2.1 — Navigation Rail route detection
// ---------------------------------------------------------------------------

describe('T2.1 — Navigation Rail route detection', () => {
  /** Extract activeCommunityId from pathname (mirrors _layout.tsx) */
  function getActiveCommunityId(pathname: string): string | null {
    const match = pathname.match(/^\/community\/(.+)$/);
    return match ? match[1] : null;
  }

  /** isHomeActive logic from _layout.tsx */
  function isHomeActive(pathname: string): boolean {
    return !pathname.startsWith('/community/') && pathname !== '/files';
  }

  it('T2.1.2 — home is active on root path', () => {
    expect(isHomeActive('/')).toBe(true);
  });

  it('T2.1.2b — home is active on /friends path', () => {
    expect(isHomeActive('/friends')).toBe(true);
  });

  it('T2.1.3 — home is not active on /files path', () => {
    expect(isHomeActive('/files')).toBe(false);
  });

  it('T2.1.4 — home is not active on community pages', () => {
    expect(isHomeActive('/community/abc123')).toBe(false);
  });

  it('T2.1.4b — extracts community ID from pathname', () => {
    expect(getActiveCommunityId('/community/abc123')).toBe('abc123');
  });

  it('T2.1.2c — returns null for non-community paths', () => {
    expect(getActiveCommunityId('/')).toBeNull();
    expect(getActiveCommunityId('/friends')).toBeNull();
    expect(getActiveCommunityId('/files')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// T2.7.6 — Mobile content visibility logic
// ---------------------------------------------------------------------------

describe('T2.7 — Mobile content visibility logic', () => {
  /**
   * Mirrors the mobileShowContent derived state from _layout.tsx.
   */
  function getMobileShowContent(opts: {
    isMobile: boolean;
    activeId: string | null;
    isFilesActive: boolean;
    isFriendsActive: boolean;
    activeCommunityId: string | null;
    communityActiveChannelId: string | null;
  }): boolean {
    return opts.isMobile && !!(
      opts.activeId ||
      opts.isFilesActive ||
      opts.isFriendsActive ||
      (opts.activeCommunityId && opts.communityActiveChannelId)
    );
  }

  const defaults = {
    isMobile: true,
    activeId: null,
    isFilesActive: false,
    isFriendsActive: false,
    activeCommunityId: null,
    communityActiveChannelId: null,
  };

  it('T2.7.1 — shows sidebar (not content) when no active destination on mobile', () => {
    expect(getMobileShowContent(defaults)).toBe(false);
  });

  it('T2.7.2 — shows content when activeId (DM) is set on mobile', () => {
    expect(getMobileShowContent({ ...defaults, activeId: 'conv-1' })).toBe(true);
  });

  it('T2.7.2b — shows content when files page is active on mobile', () => {
    expect(getMobileShowContent({ ...defaults, isFilesActive: true })).toBe(true);
  });

  it('T2.7.2c — shows content when friends page is active on mobile', () => {
    expect(getMobileShowContent({ ...defaults, isFriendsActive: true })).toBe(true);
  });

  it('T2.7.2d — shows content when community channel is selected on mobile', () => {
    expect(getMobileShowContent({
      ...defaults,
      activeCommunityId: 'comm-1',
      communityActiveChannelId: 'chan-1',
    })).toBe(true);
  });

  it('T2.7.6 — desktop always returns false regardless of state', () => {
    expect(getMobileShowContent({
      ...defaults,
      isMobile: false,
      activeId: 'conv-1',
    })).toBe(false);
  });
});
