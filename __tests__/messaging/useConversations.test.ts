/**
 * useConversations — Jest unit tests for conversation list and DM dialog.
 *
 * Test IDs covered:
 *   T2.2.6 - T2.2.10  Conversation list
 *   T2.5.1 - T2.5.5   New DM dialog (conversation creation path)
 *   T4.23.1 - T4.23.2  Empty state
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('@/contexts/UmbraContext', () => ({
  useUmbra: () => {
    const { UmbraService } = require('@umbra/service');
    return {
      service: UmbraService.instance,
      isReady: true,
      isLoading: false,
      error: null,
      version: '0.1.0-test',
      initStage: 'ready',
    };
  },
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    identity: { did: 'did:key:z6MkTest', displayName: 'Test' },
    isAuthenticated: true,
    isHydrated: true,
    login: jest.fn(),
    logout: jest.fn(),
    setIdentity: jest.fn(),
    rememberMe: false,
    setRememberMe: jest.fn(),
    recoveryPhrase: null,
    setRecoveryPhrase: jest.fn(),
    pin: null,
    hasPin: false,
    isPinVerified: false,
    setPin: jest.fn(),
    verifyPin: jest.fn(),
    lockApp: jest.fn(),
    accounts: [],
    addAccount: jest.fn(),
    removeAccount: jest.fn(),
    switchAccount: jest.fn(),
    loginFromStoredAccount: jest.fn(),
    isSwitching: false,
    switchGeneration: 0,
  }),
  AuthProvider: ({ children }: any) => children,
}));

import { UmbraService } from '@umbra/service';
import { useConversations } from '@/hooks/useConversations';

const mockService = UmbraService.instance as Record<string, jest.Mock>;

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

const sampleConversations = [
  {
    id: 'conv-1',
    peerDid: 'did:key:z6MkPeerA',
    peerDisplayName: 'Alice',
    lastMessageAt: Date.now() - 1000,
    unreadCount: 2,
  },
  {
    id: 'conv-2',
    peerDid: 'did:key:z6MkPeerB',
    peerDisplayName: 'Bob',
    lastMessageAt: Date.now() - 5000,
    unreadCount: 0,
  },
  {
    id: 'conv-3',
    peerDid: 'did:key:z6MkPeerC',
    peerDisplayName: 'Charlie',
    lastMessageAt: Date.now() - 60000,
    unreadCount: 5,
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resetMocks() {
  jest.clearAllMocks();
  mockService.getConversations.mockResolvedValue([]);
  mockService.onMessageEvent.mockReturnValue(jest.fn());
  mockService.onFriendEvent.mockReturnValue(jest.fn());
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useConversations', () => {
  beforeEach(() => {
    resetMocks();
  });

  // =========================================================================
  // T2.2 — Conversation list
  // =========================================================================

  describe('T2.2 Conversation list', () => {
    it('T2.2.6 — fetches conversations on mount when service is ready', async () => {
      mockService.getConversations.mockResolvedValueOnce(sampleConversations);

      const { result } = renderHook(() => useConversations());

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(mockService.getConversations).toHaveBeenCalled();
      expect(result.current.conversations).toHaveLength(3);
    });

    it('T2.2.7 — conversations array contains expected conversation objects', async () => {
      mockService.getConversations.mockResolvedValueOnce(sampleConversations);

      const { result } = renderHook(() => useConversations());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.conversations[0].id).toBe('conv-1');
      expect(result.current.conversations[0].peerDisplayName).toBe('Alice');
      expect(result.current.conversations[1].peerDisplayName).toBe('Bob');
      expect(result.current.conversations[2].peerDisplayName).toBe('Charlie');
    });

    it('T2.2.8 — sets error when getConversations fails', async () => {
      mockService.getConversations.mockRejectedValueOnce(new Error('Fetch failed'));

      const { result } = renderHook(() => useConversations());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error!.message).toBe('Fetch failed');
    });

    it('T2.2.9 — refresh re-fetches conversations', async () => {
      mockService.getConversations.mockResolvedValueOnce(sampleConversations);

      const { result } = renderHook(() => useConversations());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // Now mock a fresh result for refresh
      const updatedConversations = [
        ...sampleConversations,
        {
          id: 'conv-4',
          peerDid: 'did:key:z6MkPeerD',
          peerDisplayName: 'Diana',
          lastMessageAt: Date.now(),
          unreadCount: 1,
        },
      ];
      mockService.getConversations.mockResolvedValueOnce(updatedConversations);

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.conversations).toHaveLength(4);
    });

    it('T2.2.10 — subscribes to message events and refreshes on message activity', async () => {
      mockService.getConversations.mockResolvedValue([]);

      renderHook(() => useConversations());

      await waitFor(() => {
        expect(mockService.onMessageEvent).toHaveBeenCalled();
      });

      // onMessageEvent should have been called with a callback
      const callArgs = mockService.onMessageEvent.mock.calls[0];
      expect(typeof callArgs[0]).toBe('function');
    });
  });

  // =========================================================================
  // T2.5 — New DM dialog (conversation creation path)
  // =========================================================================

  describe('T2.5 New DM dialog', () => {
    it('T2.5.1 — conversations starts empty when backend returns no conversations', async () => {
      mockService.getConversations.mockResolvedValueOnce([]);

      const { result } = renderHook(() => useConversations());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.conversations).toEqual([]);
    });

    it('T2.5.2 — refresh after creating a DM picks up new conversation', async () => {
      mockService.getConversations.mockResolvedValueOnce([]);

      const { result } = renderHook(() => useConversations());
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.conversations).toEqual([]);

      // Simulate DM creation by returning a conversation on next fetch
      mockService.getConversations.mockResolvedValueOnce([
        {
          id: 'conv-new',
          peerDid: 'did:key:z6MkNewPeer',
          peerDisplayName: 'New Friend',
          lastMessageAt: Date.now(),
          unreadCount: 0,
        },
      ]);

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.conversations).toHaveLength(1);
      expect(result.current.conversations[0].peerDisplayName).toBe('New Friend');
    });

    it('T2.5.3 — handles non-Error rejection gracefully', async () => {
      mockService.getConversations.mockRejectedValueOnce('string error');

      const { result } = renderHook(() => useConversations());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error!.message).toBe('string error');
    });

    it('T2.5.4 — subscribes to friend events for real-time DM creation', async () => {
      mockService.getConversations.mockResolvedValue([]);

      renderHook(() => useConversations());

      await waitFor(() => {
        expect(mockService.onFriendEvent).toHaveBeenCalled();
      });

      const callArgs = mockService.onFriendEvent.mock.calls[0];
      expect(typeof callArgs[0]).toBe('function');
    });

    it('T2.5.5 — unsubscribes from events on unmount', async () => {
      const unsubMessage = jest.fn();
      const unsubFriend = jest.fn();
      mockService.onMessageEvent.mockReturnValue(unsubMessage);
      mockService.onFriendEvent.mockReturnValue(unsubFriend);
      mockService.getConversations.mockResolvedValue([]);

      const { unmount } = renderHook(() => useConversations());
      await waitFor(() => {
        expect(mockService.onMessageEvent).toHaveBeenCalled();
      });

      unmount();

      expect(unsubMessage).toHaveBeenCalled();
      expect(unsubFriend).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // T4.23 — Empty state
  // =========================================================================

  describe('T4.23 Empty state', () => {
    it('T4.23.1 — conversations is empty array when no conversations exist', async () => {
      mockService.getConversations.mockResolvedValueOnce([]);

      const { result } = renderHook(() => useConversations());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.conversations).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('T4.23.2 — isLoading transitions from true to false after fetch', async () => {
      mockService.getConversations.mockResolvedValueOnce([]);

      const { result } = renderHook(() => useConversations());

      // Initially loading
      expect(result.current.isLoading).toBe(true);

      await waitFor(() => expect(result.current.isLoading).toBe(false));
    });
  });
});
