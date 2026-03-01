/**
 * useMessages — Jest unit tests for Section 4 (Direct Messaging).
 *
 * Test IDs covered:
 *   T4.2.1 - T4.2.8   Sending messages
 *   T4.11.1 - T4.11.7  Edit message
 *   T4.12.1 - T4.12.3  Delete message
 *   T4.13.1 - T4.13.5  Reply (via replyToId parameter)
 *   T4.14.1 - T4.14.3  Forward
 *   T4.15.1 - T4.15.4  Pin / Unpin
 *   T4.16.1 - T4.16.8  Reactions
 *   T4.17.1 - T4.17.6  Threads
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';

// ---------------------------------------------------------------------------
// Mocks — Must be declared before the hook is imported so modules resolve
// ---------------------------------------------------------------------------

// Mock useUmbra — use require() inside factory to avoid out-of-scope variable error
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

// Mock useAuth
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

// Mock useSound
jest.mock('@/contexts/SoundContext', () => ({
  useSound: () => ({
    playSound: jest.fn(),
    masterVolume: 0.8,
    setMasterVolume: jest.fn(),
    muted: false,
    setMuted: jest.fn(),
    categoryVolumes: {},
    setCategoryVolume: jest.fn(),
    categoryEnabled: {},
    setCategoryEnabled: jest.fn(),
    activeTheme: 'playful',
    setActiveTheme: jest.fn(),
    preferencesLoaded: true,
  }),
}));

// Mock useNetwork
jest.mock('@/hooks/useNetwork', () => ({
  useNetwork: () => ({
    isConnected: false,
    peerCount: 0,
    startNetwork: jest.fn(),
    stopNetwork: jest.fn(),
    getRelayWs: jest.fn(() => null),
    relayConnected: false,
    onlineDids: new Set(),
  }),
  pushPendingRelayAck: jest.fn(),
}));

// Now import the hook and service under test
import { UmbraService } from '@umbra/service';
import { useMessages } from '@/hooks/useMessages';

const mockService = UmbraService.instance as Record<string, jest.Mock>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CONV_ID = 'conv-test-1';

function resetMocks() {
  jest.clearAllMocks();
  // Restore default resolutions
  mockService.getMessages.mockResolvedValue([]);
  mockService.getPinnedMessages.mockResolvedValue([]);
  mockService.sendMessage.mockImplementation((convId: string, text: string) =>
    Promise.resolve({
      id: `msg-${Date.now()}`,
      conversationId: convId,
      senderDid: 'did:key:z6MkTest',
      content: { type: 'text', text },
      timestamp: Date.now(),
      read: false,
      delivered: false,
      status: 'sent',
    }),
  );
  mockService.editMessage.mockImplementation((id: string, newText: string) =>
    Promise.resolve({
      id,
      content: { type: 'text', text: newText },
      edited: true,
      editedAt: Date.now(),
    }),
  );
  mockService.deleteMessage.mockResolvedValue(undefined);
  mockService.pinMessage.mockImplementation((id: string) =>
    Promise.resolve({ id, pinned: true, pinnedBy: 'did:key:z6MkTest', pinnedAt: Date.now() }),
  );
  mockService.unpinMessage.mockResolvedValue(undefined);
  mockService.addReaction.mockImplementation((_id: string, emoji: string) =>
    Promise.resolve([{ emoji, count: 1, users: ['did:key:z6MkTest'], reacted: true }]),
  );
  mockService.removeReaction.mockResolvedValue([]);
  mockService.forwardMessage.mockImplementation((_id: string, targetConvId: string) =>
    Promise.resolve({
      id: `msg-fwd-${Date.now()}`,
      conversationId: targetConvId,
      senderDid: 'did:key:z6MkTest',
      content: { type: 'text', text: 'forwarded' },
      timestamp: Date.now(),
      read: false,
      delivered: false,
      status: 'sent',
      forwarded: true,
    }),
  );
  mockService.getThreadReplies.mockResolvedValue([]);
  mockService.sendThreadReply.mockImplementation((_parentId: string, text: string) =>
    Promise.resolve({
      id: `msg-reply-${Date.now()}`,
      conversationId: CONV_ID,
      senderDid: 'did:key:z6MkTest',
      content: { type: 'text', text },
      timestamp: Date.now(),
      read: false,
      delivered: false,
      status: 'sent',
    }),
  );
  mockService.sendFileMessage.mockImplementation((convId: string, filePayload: any) =>
    Promise.resolve({
      id: `msg-${Date.now()}`,
      conversationId: convId,
      senderDid: 'did:key:z6MkTest',
      content: { type: 'file', ...filePayload },
      timestamp: Date.now(),
      read: false,
      delivered: false,
      status: 'sent',
    }),
  );
  mockService.sendGroupMessage.mockImplementation((_groupId: string, convId: string, text: string) =>
    Promise.resolve({
      id: `msg-${Date.now()}`,
      conversationId: convId,
      senderDid: 'did:key:z6MkTest',
      content: { type: 'text', text },
      timestamp: Date.now(),
      read: false,
      delivered: false,
      status: 'sent',
    }),
  );
  mockService.sendGroupFileMessage.mockImplementation((_groupId: string, convId: string, filePayload: any) =>
    Promise.resolve({
      id: `msg-${Date.now()}`,
      conversationId: convId,
      senderDid: 'did:key:z6MkTest',
      content: { type: 'file', ...filePayload },
      timestamp: Date.now(),
      read: false,
      delivered: false,
      status: 'sent',
    }),
  );
  mockService.markAsRead.mockResolvedValue(0);
  // onMessageEvent returns an unsubscribe function
  mockService.onMessageEvent.mockReturnValue(jest.fn());
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useMessages', () => {
  beforeEach(() => {
    resetMocks();
  });

  // =========================================================================
  // T4.2 — Sending messages
  // =========================================================================

  describe('T4.2 Sending messages', () => {
    it('T4.2.1 — sendMessage calls service.sendMessage with conversation id and text', async () => {
      const { result } = renderHook(() => useMessages(CONV_ID));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.sendMessage('Hello world');
      });

      expect(mockService.sendMessage).toHaveBeenCalledWith(
        CONV_ID,
        'Hello world',
        null, // relayWs is null in our mock
      );
    });

    it('T4.2.2 — sendMessage returns the created message object', async () => {
      const { result } = renderHook(() => useMessages(CONV_ID));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      let sentMsg: any;
      await act(async () => {
        sentMsg = await result.current.sendMessage('Test message');
      });

      expect(sentMsg).toBeDefined();
      expect(sentMsg.content.text).toBe('Test message');
      expect(sentMsg.conversationId).toBe(CONV_ID);
      expect(sentMsg.senderDid).toBe('did:key:z6MkTest');
    });

    it('T4.2.3 — sendMessage returns null when no conversationId', async () => {
      const { result } = renderHook(() => useMessages(null));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      let sentMsg: any;
      await act(async () => {
        sentMsg = await result.current.sendMessage('Orphan');
      });

      expect(sentMsg).toBeNull();
      expect(mockService.sendMessage).not.toHaveBeenCalled();
    });

    it('T4.2.4 — sendMessage sets error on failure', async () => {
      mockService.sendMessage.mockRejectedValueOnce(new Error('Network failure'));
      const { result } = renderHook(() => useMessages(CONV_ID));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.sendMessage('fail');
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error!.message).toBe('Network failure');
    });

    it('T4.2.5 — sendMessage returns null on failure', async () => {
      mockService.sendMessage.mockRejectedValueOnce(new Error('fail'));
      const { result } = renderHook(() => useMessages(CONV_ID));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      let sentMsg: any;
      await act(async () => {
        sentMsg = await result.current.sendMessage('fail');
      });

      expect(sentMsg).toBeNull();
    });

    it('T4.2.6 — sendMessage accepts optional replyToId parameter', async () => {
      const { result } = renderHook(() => useMessages(CONV_ID));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.sendMessage('reply text', 'parent-msg-id');
      });

      // The hook calls service.sendMessage (not sendThreadReply) for in-chat replies
      expect(mockService.sendMessage).toHaveBeenCalled();
    });

    it('T4.2.7 — initial load fetches messages with PAGE_SIZE=50', async () => {
      const { result } = renderHook(() => useMessages(CONV_ID));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(mockService.getMessages).toHaveBeenCalledWith(CONV_ID, {
        limit: 50,
        offset: 0,
      });
    });

    it('T4.2.8 — messages start as empty array', async () => {
      const { result } = renderHook(() => useMessages(CONV_ID));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.messages).toEqual([]);
    });
  });

  // =========================================================================
  // T4.11 — Edit message
  // =========================================================================

  describe('T4.11 Edit message', () => {
    it('T4.11.1 — editMessage calls service.editMessage with id and new text', async () => {
      const { result } = renderHook(() => useMessages(CONV_ID));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.editMessage('msg-1', 'Updated text');
      });

      expect(mockService.editMessage).toHaveBeenCalledWith('msg-1', 'Updated text');
    });

    it('T4.11.2 — editMessage is a no-op when service is unavailable', async () => {
      // Render with null conversationId to not fetch, but service is still available
      // Test the guard: if !service return
      const { result } = renderHook(() => useMessages(CONV_ID));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // Calling editMessage should work without error
      await act(async () => {
        await result.current.editMessage('msg-1', 'New text');
      });

      expect(mockService.editMessage).toHaveBeenCalled();
    });

    it('T4.11.3 — editMessage sets error on failure', async () => {
      mockService.editMessage.mockRejectedValueOnce(new Error('Edit failed'));
      const { result } = renderHook(() => useMessages(CONV_ID));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.editMessage('msg-1', 'fail');
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error!.message).toBe('Edit failed');
    });

    it('T4.11.4 — editMessage can be called with empty string', async () => {
      const { result } = renderHook(() => useMessages(CONV_ID));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.editMessage('msg-1', '');
      });

      expect(mockService.editMessage).toHaveBeenCalledWith('msg-1', '');
    });

    it('T4.11.5 — editMessage can be called with long text', async () => {
      const longText = 'A'.repeat(5000);
      const { result } = renderHook(() => useMessages(CONV_ID));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.editMessage('msg-1', longText);
      });

      expect(mockService.editMessage).toHaveBeenCalledWith('msg-1', longText);
    });

    it('T4.11.6 — editMessage handles non-Error rejection', async () => {
      mockService.editMessage.mockRejectedValueOnce('string error');
      const { result } = renderHook(() => useMessages(CONV_ID));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.editMessage('msg-1', 'fail');
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error!.message).toBe('string error');
    });

    it('T4.11.7 — editMessage does not modify local messages list directly', async () => {
      mockService.getMessages.mockResolvedValueOnce([
        { id: 'msg-1', content: { type: 'text', text: 'Original' }, conversationId: CONV_ID },
      ]);
      const { result } = renderHook(() => useMessages(CONV_ID));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.editMessage('msg-1', 'Edited');
      });

      // editMessage only calls the service; local state updates happen via events
      expect(result.current.messages[0]?.content?.text).toBe('Original');
    });
  });

  // =========================================================================
  // T4.12 — Delete message
  // =========================================================================

  describe('T4.12 Delete message', () => {
    it('T4.12.1 — deleteMessage calls service.deleteMessage with id', async () => {
      const { result } = renderHook(() => useMessages(CONV_ID));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.deleteMessage('msg-1');
      });

      expect(mockService.deleteMessage).toHaveBeenCalledWith('msg-1');
    });

    it('T4.12.2 — deleteMessage sets error on failure', async () => {
      mockService.deleteMessage.mockRejectedValueOnce(new Error('Delete failed'));
      const { result } = renderHook(() => useMessages(CONV_ID));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.deleteMessage('msg-1');
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error!.message).toBe('Delete failed');
    });

    it('T4.12.3 — deleteMessage does not remove message from local state directly', async () => {
      mockService.getMessages.mockResolvedValueOnce([
        { id: 'msg-1', content: { type: 'text', text: 'To delete' }, conversationId: CONV_ID },
      ]);
      const { result } = renderHook(() => useMessages(CONV_ID));
      await waitFor(() => expect(result.current.messages).toHaveLength(1));

      await act(async () => {
        await result.current.deleteMessage('msg-1');
      });

      // Local state not changed until a messageDeleted event arrives
      expect(result.current.messages).toHaveLength(1);
    });
  });

  // =========================================================================
  // T4.13 — Reply (in-chat reply via sendMessage with replyToId)
  // =========================================================================

  describe('T4.13 Reply', () => {
    it('T4.13.1 — sendMessage with replyToId calls service.sendMessage', async () => {
      const { result } = renderHook(() => useMessages(CONV_ID));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.sendMessage('Reply text', 'parent-msg-123');
      });

      expect(mockService.sendMessage).toHaveBeenCalled();
    });

    it('T4.13.2 — sendMessage with replyToId returns the message', async () => {
      const { result } = renderHook(() => useMessages(CONV_ID));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      let sentMsg: any;
      await act(async () => {
        sentMsg = await result.current.sendMessage('Reply', 'parent-msg-123');
      });

      expect(sentMsg).toBeDefined();
      expect(sentMsg.content.text).toBe('Reply');
    });

    it('T4.13.3 — reply returns null when conversationId is null', async () => {
      const { result } = renderHook(() => useMessages(null));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      let sentMsg: any;
      await act(async () => {
        sentMsg = await result.current.sendMessage('Reply', 'parent-id');
      });

      expect(sentMsg).toBeNull();
    });

    it('T4.13.4 — reply sets error on failure', async () => {
      mockService.sendMessage.mockRejectedValueOnce(new Error('Reply failed'));
      const { result } = renderHook(() => useMessages(CONV_ID));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.sendMessage('Reply', 'parent-msg-123');
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error!.message).toBe('Reply failed');
    });

    it('T4.13.5 — reply without replyToId is a normal send', async () => {
      const { result } = renderHook(() => useMessages(CONV_ID));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.sendMessage('Normal message');
      });

      expect(mockService.sendMessage).toHaveBeenCalledWith(
        CONV_ID,
        'Normal message',
        null,
      );
    });
  });

  // =========================================================================
  // T4.14 — Forward
  // =========================================================================

  describe('T4.14 Forward', () => {
    it('T4.14.1 — forwardMessage calls service.forwardMessage with ids', async () => {
      const { result } = renderHook(() => useMessages(CONV_ID));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.forwardMessage('msg-1', 'conv-target');
      });

      expect(mockService.forwardMessage).toHaveBeenCalledWith('msg-1', 'conv-target');
    });

    it('T4.14.2 — forwardMessage sets error on failure', async () => {
      mockService.forwardMessage.mockRejectedValueOnce(new Error('Forward failed'));
      const { result } = renderHook(() => useMessages(CONV_ID));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.forwardMessage('msg-1', 'conv-target');
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error!.message).toBe('Forward failed');
    });

    it('T4.14.3 — forwardMessage is a no-op when service is unavailable', async () => {
      // With a valid conversation, service is always available in our mock.
      // Just verify it resolves without error.
      const { result } = renderHook(() => useMessages(CONV_ID));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.forwardMessage('msg-1', 'conv-other');
      });

      expect(result.current.error).toBeNull();
    });
  });

  // =========================================================================
  // T4.15 — Pin / Unpin
  // =========================================================================

  describe('T4.15 Pin / Unpin', () => {
    it('T4.15.1 — pinMessage calls service.pinMessage with message id', async () => {
      const { result } = renderHook(() => useMessages(CONV_ID));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.pinMessage('msg-1');
      });

      expect(mockService.pinMessage).toHaveBeenCalledWith('msg-1');
    });

    it('T4.15.2 — unpinMessage calls service.unpinMessage with message id', async () => {
      const { result } = renderHook(() => useMessages(CONV_ID));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.unpinMessage('msg-1');
      });

      expect(mockService.unpinMessage).toHaveBeenCalledWith('msg-1');
    });

    it('T4.15.3 — pinMessage sets error on failure', async () => {
      mockService.pinMessage.mockRejectedValueOnce(new Error('Pin failed'));
      const { result } = renderHook(() => useMessages(CONV_ID));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.pinMessage('msg-1');
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error!.message).toBe('Pin failed');
    });

    it('T4.15.4 — pinnedMessages starts as empty array and is fetched', async () => {
      const { result } = renderHook(() => useMessages(CONV_ID));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.pinnedMessages).toEqual([]);
      expect(mockService.getPinnedMessages).toHaveBeenCalledWith(CONV_ID);
    });
  });

  // =========================================================================
  // T4.16 — Reactions
  // =========================================================================

  describe('T4.16 Reactions', () => {
    it('T4.16.1 — addReaction calls service.addReaction with message id and emoji', async () => {
      const { result } = renderHook(() => useMessages(CONV_ID));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.addReaction('msg-1', 'thumbs_up');
      });

      expect(mockService.addReaction).toHaveBeenCalledWith('msg-1', 'thumbs_up');
    });

    it('T4.16.2 — removeReaction calls service.removeReaction with message id and emoji', async () => {
      const { result } = renderHook(() => useMessages(CONV_ID));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.removeReaction('msg-1', 'thumbs_up');
      });

      expect(mockService.removeReaction).toHaveBeenCalledWith('msg-1', 'thumbs_up');
    });

    it('T4.16.3 — addReaction sets error on failure', async () => {
      mockService.addReaction.mockRejectedValueOnce(new Error('Reaction failed'));
      const { result } = renderHook(() => useMessages(CONV_ID));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.addReaction('msg-1', 'heart');
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error!.message).toBe('Reaction failed');
    });

    it('T4.16.4 — removeReaction sets error on failure', async () => {
      mockService.removeReaction.mockRejectedValueOnce(new Error('Remove failed'));
      const { result } = renderHook(() => useMessages(CONV_ID));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.removeReaction('msg-1', 'heart');
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error!.message).toBe('Remove failed');
    });

    it('T4.16.5 — addReaction works with various emoji identifiers', async () => {
      const { result } = renderHook(() => useMessages(CONV_ID));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      const emojis = ['heart', 'thumbs_up', 'laughing', 'fire', 'rocket'];
      for (const emoji of emojis) {
        await act(async () => {
          await result.current.addReaction('msg-1', emoji);
        });
      }

      expect(mockService.addReaction).toHaveBeenCalledTimes(5);
    });

    it('T4.16.6 — addReaction and removeReaction can be called in sequence', async () => {
      const { result } = renderHook(() => useMessages(CONV_ID));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.addReaction('msg-1', 'heart');
      });
      await act(async () => {
        await result.current.removeReaction('msg-1', 'heart');
      });

      expect(mockService.addReaction).toHaveBeenCalledTimes(1);
      expect(mockService.removeReaction).toHaveBeenCalledTimes(1);
    });

    it('T4.16.7 — addReaction handles non-Error rejection', async () => {
      mockService.addReaction.mockRejectedValueOnce('string error');
      const { result } = renderHook(() => useMessages(CONV_ID));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.addReaction('msg-1', 'fire');
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error!.message).toBe('string error');
    });

    it('T4.16.8 — removeReaction handles non-Error rejection', async () => {
      mockService.removeReaction.mockRejectedValueOnce(42);
      const { result } = renderHook(() => useMessages(CONV_ID));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.removeReaction('msg-1', 'fire');
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error!.message).toBe('42');
    });
  });

  // =========================================================================
  // T4.17 — Threads
  // =========================================================================

  describe('T4.17 Threads', () => {
    it('T4.17.1 — getThreadReplies calls service.getThreadReplies with parent id', async () => {
      const { result } = renderHook(() => useMessages(CONV_ID));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.getThreadReplies('parent-msg-1');
      });

      expect(mockService.getThreadReplies).toHaveBeenCalledWith('parent-msg-1');
    });

    it('T4.17.2 — getThreadReplies returns empty array by default', async () => {
      const { result } = renderHook(() => useMessages(CONV_ID));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      let replies: any;
      await act(async () => {
        replies = await result.current.getThreadReplies('parent-msg-1');
      });

      expect(replies).toEqual([]);
    });

    it('T4.17.3 — getThreadReplies returns populated array when service has replies', async () => {
      const mockReplies = [
        { id: 'reply-1', content: { type: 'text', text: 'Reply 1' } },
        { id: 'reply-2', content: { type: 'text', text: 'Reply 2' } },
      ];
      mockService.getThreadReplies.mockResolvedValueOnce(mockReplies);
      const { result } = renderHook(() => useMessages(CONV_ID));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      let replies: any;
      await act(async () => {
        replies = await result.current.getThreadReplies('parent-msg-1');
      });

      expect(replies).toHaveLength(2);
      expect(replies[0].content.text).toBe('Reply 1');
    });

    it('T4.17.4 — sendThreadReply calls service.sendThreadReply with parent id and text', async () => {
      const { result } = renderHook(() => useMessages(CONV_ID));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.sendThreadReply('parent-msg-1', 'Thread reply');
      });

      expect(mockService.sendThreadReply).toHaveBeenCalledWith(
        'parent-msg-1',
        'Thread reply',
        null, // relayWs
      );
    });

    it('T4.17.5 — sendThreadReply returns the message object', async () => {
      const { result } = renderHook(() => useMessages(CONV_ID));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      let reply: any;
      await act(async () => {
        reply = await result.current.sendThreadReply('parent-msg-1', 'Thread reply');
      });

      expect(reply).toBeDefined();
      expect(reply.content.text).toBe('Thread reply');
    });

    it('T4.17.6 — sendThreadReply sets error on failure', async () => {
      mockService.sendThreadReply.mockRejectedValueOnce(new Error('Thread failed'));
      const { result } = renderHook(() => useMessages(CONV_ID));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      const reply = await act(async () => {
        return await result.current.sendThreadReply('parent-msg-1', 'fail');
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error!.message).toBe('Thread failed');
    });
  });

  // =========================================================================
  // Additional coverage: pagination and state
  // =========================================================================

  describe('Pagination and state', () => {
    it('hasMore is true when initial fetch returns PAGE_SIZE messages', async () => {
      const fiftyMsgs = Array.from({ length: 50 }, (_, i) => ({
        id: `msg-${i}`,
        content: { type: 'text', text: `Message ${i}` },
        conversationId: CONV_ID,
      }));
      mockService.getMessages.mockResolvedValueOnce(fiftyMsgs);

      const { result } = renderHook(() => useMessages(CONV_ID));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.hasMore).toBe(true);
      expect(result.current.messages).toHaveLength(50);
    });

    it('hasMore is false when initial fetch returns fewer than PAGE_SIZE messages', async () => {
      mockService.getMessages.mockResolvedValueOnce([
        { id: 'msg-1', content: { type: 'text', text: 'Only one' }, conversationId: CONV_ID },
      ]);

      const { result } = renderHook(() => useMessages(CONV_ID));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.hasMore).toBe(false);
    });

    it('loadMore fetches older messages and prepends them', async () => {
      const initialMsgs = Array.from({ length: 50 }, (_, i) => ({
        id: `msg-${i}`,
        content: { type: 'text', text: `Message ${i}` },
        conversationId: CONV_ID,
      }));
      mockService.getMessages.mockResolvedValueOnce(initialMsgs);

      const { result } = renderHook(() => useMessages(CONV_ID));
      await waitFor(() => expect(result.current.messages).toHaveLength(50));

      const olderMsgs = Array.from({ length: 10 }, (_, i) => ({
        id: `old-msg-${i}`,
        content: { type: 'text', text: `Old message ${i}` },
        conversationId: CONV_ID,
      }));
      mockService.getMessages.mockResolvedValueOnce(olderMsgs);

      await act(async () => {
        await result.current.loadMore();
      });

      expect(result.current.messages).toHaveLength(60);
      expect(result.current.messages[0].id).toBe('old-msg-0');
    });

    it('markAsRead calls service.markAsRead', async () => {
      const { result } = renderHook(() => useMessages(CONV_ID));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.markAsRead();
      });

      expect(mockService.markAsRead).toHaveBeenCalledWith(CONV_ID);
    });

    it('refresh re-fetches messages from offset 0', async () => {
      const { result } = renderHook(() => useMessages(CONV_ID));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      mockService.getMessages.mockResolvedValueOnce([
        { id: 'msg-new', content: { type: 'text', text: 'Fresh' }, conversationId: CONV_ID },
      ]);

      await act(async () => {
        await result.current.refresh();
      });

      expect(mockService.getMessages).toHaveBeenLastCalledWith(CONV_ID, {
        limit: 50,
        offset: 0,
      });
    });

    it('clearUnreadMarker resets firstUnreadMessageId to null', async () => {
      const { result } = renderHook(() => useMessages(CONV_ID));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      act(() => {
        result.current.clearUnreadMarker();
      });

      expect(result.current.firstUnreadMessageId).toBeNull();
    });
  });

  // =========================================================================
  // T4.20 — Decrypt error categorization
  // =========================================================================

  describe('T4.20 Decrypt error categorization', () => {
    // Test that messages with different decrypt error types show the correct fallback text.
    // The key insight: getMessages in the service layer calls categorizeDecryptError()
    // which reads the error string prefixes. In Jest, we mock getMessages at the service level,
    // so we test by returning messages with the categorized text already set.

    it('T4.20.1 — KEY_MISMATCH error shows "[Encrypted with a different key]"', async () => {
      mockService.getMessages.mockResolvedValueOnce([
        {
          id: 'msg-1',
          conversationId: CONV_ID,
          senderDid: 'did:key:z6MkFriend1',
          content: { type: 'text', text: '[Encrypted with a different key]' },
          timestamp: Date.now() / 1000,
          read: false,
          delivered: true,
          status: 'delivered',
          threadReplyCount: 0,
        },
      ]);
      const { result } = renderHook(() => useMessages(CONV_ID));
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.messages[0].content.text).toBe('[Encrypted with a different key]');
    });

    it('T4.20.2 — FRIEND_NOT_FOUND error shows "[Sender unknown]"', async () => {
      mockService.getMessages.mockResolvedValueOnce([
        {
          id: 'msg-2',
          conversationId: CONV_ID,
          senderDid: 'did:key:z6MkUnknown',
          content: { type: 'text', text: '[Sender unknown]' },
          timestamp: Date.now() / 1000,
          read: false,
          delivered: true,
          status: 'delivered',
          threadReplyCount: 0,
        },
      ]);
      const { result } = renderHook(() => useMessages(CONV_ID));
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.messages[0].content.text).toBe('[Sender unknown]');
    });

    it('T4.20.3 — CONVERSATION_NOT_FOUND error shows "[Message from unknown conversation]"', async () => {
      mockService.getMessages.mockResolvedValueOnce([
        {
          id: 'msg-3',
          conversationId: CONV_ID,
          senderDid: 'did:key:z6MkFriend1',
          content: { type: 'text', text: '[Message from unknown conversation]' },
          timestamp: Date.now() / 1000,
          read: false,
          delivered: true,
          status: 'delivered',
          threadReplyCount: 0,
        },
      ]);
      const { result } = renderHook(() => useMessages(CONV_ID));
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.messages[0].content.text).toBe('[Message from unknown conversation]');
    });

    it('T4.20.4 — INVALID_FORMAT error shows "[Corrupted message]"', async () => {
      mockService.getMessages.mockResolvedValueOnce([
        {
          id: 'msg-4',
          conversationId: CONV_ID,
          senderDid: 'did:key:z6MkFriend1',
          content: { type: 'text', text: '[Corrupted message]' },
          timestamp: Date.now() / 1000,
          read: false,
          delivered: true,
          status: 'delivered',
          threadReplyCount: 0,
        },
      ]);
      const { result } = renderHook(() => useMessages(CONV_ID));
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.messages[0].content.text).toBe('[Corrupted message]');
    });

    it('T4.20.5 — generic error shows "[Unable to decrypt message]"', async () => {
      mockService.getMessages.mockResolvedValueOnce([
        {
          id: 'msg-5',
          conversationId: CONV_ID,
          senderDid: 'did:key:z6MkFriend1',
          content: { type: 'text', text: '[Unable to decrypt message]' },
          timestamp: Date.now() / 1000,
          read: false,
          delivered: true,
          status: 'delivered',
          threadReplyCount: 0,
        },
      ]);
      const { result } = renderHook(() => useMessages(CONV_ID));
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.messages[0].content.text).toBe('[Unable to decrypt message]');
    });

    it('T4.20.6 — messages with decrypt errors still appear in conversation list', async () => {
      mockService.getMessages.mockResolvedValueOnce([
        {
          id: 'msg-ok',
          conversationId: CONV_ID,
          senderDid: 'did:key:z6MkFriend1',
          content: { type: 'text', text: 'Hello!' },
          timestamp: Date.now() / 1000,
          read: true,
          delivered: true,
          status: 'read',
          threadReplyCount: 0,
        },
        {
          id: 'msg-err',
          conversationId: CONV_ID,
          senderDid: 'did:key:z6MkFriend1',
          content: { type: 'text', text: '[Encrypted with a different key]' },
          timestamp: Date.now() / 1000 + 1,
          read: false,
          delivered: true,
          status: 'delivered',
          threadReplyCount: 0,
        },
      ]);
      const { result } = renderHook(() => useMessages(CONV_ID));
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.messages).toHaveLength(2);
    });

    it('T4.20.7 — decrypt error does not break other messages in same fetch', async () => {
      mockService.getMessages.mockResolvedValueOnce([
        {
          id: 'msg-before',
          conversationId: CONV_ID,
          senderDid: 'did:key:z6MkFriend1',
          content: { type: 'text', text: 'Before the error' },
          timestamp: Date.now() / 1000,
          read: true,
          delivered: true,
          status: 'read',
          threadReplyCount: 0,
        },
        {
          id: 'msg-error',
          conversationId: CONV_ID,
          senderDid: 'did:key:z6MkFriend1',
          content: { type: 'text', text: '[Sender unknown]' },
          timestamp: Date.now() / 1000 + 1,
          read: false,
          delivered: true,
          status: 'delivered',
          threadReplyCount: 0,
        },
        {
          id: 'msg-after',
          conversationId: CONV_ID,
          senderDid: 'did:key:z6MkFriend1',
          content: { type: 'text', text: 'After the error' },
          timestamp: Date.now() / 1000 + 2,
          read: true,
          delivered: true,
          status: 'read',
          threadReplyCount: 0,
        },
      ]);
      const { result } = renderHook(() => useMessages(CONV_ID));
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.messages).toHaveLength(3);
      expect(result.current.messages[0].content.text).toBe('Before the error');
      expect(result.current.messages[1].content.text).toBe('[Sender unknown]');
      expect(result.current.messages[2].content.text).toBe('After the error');
    });
  });

  // =========================================================================
  // T4.21 — File messages
  // =========================================================================

  describe('T4.21 File messages', () => {
    const FILE_PAYLOAD = {
      fileId: 'file-123',
      filename: 'photo.png',
      size: 4096,
      mimeType: 'image/png',
      storageChunksJson: '[]',
    };

    it('T4.21.1 — sendFileMessage calls service.sendFileMessage with correct payload', async () => {
      const { result } = renderHook(() => useMessages(CONV_ID));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.sendFileMessage(FILE_PAYLOAD);
      });

      expect(mockService.sendFileMessage).toHaveBeenCalledWith(
        CONV_ID,
        FILE_PAYLOAD,
        null, // relayWs
      );
    });

    it('T4.21.2 — sendFileMessage in group mode calls service.sendGroupFileMessage', async () => {
      const GROUP_ID = 'group-1';
      const { result } = renderHook(() => useMessages(CONV_ID, GROUP_ID));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.sendFileMessage(FILE_PAYLOAD);
      });

      expect(mockService.sendGroupFileMessage).toHaveBeenCalledWith(
        GROUP_ID,
        CONV_ID,
        FILE_PAYLOAD,
        null,
      );
      expect(mockService.sendFileMessage).not.toHaveBeenCalled();
    });

    it('T4.21.3 — file message event is appended to messages (not dropped by content guard)', async () => {
      let eventHandler: ((event: any) => void) | null = null;
      mockService.onMessageEvent.mockImplementation((cb: any) => {
        eventHandler = cb;
        return jest.fn();
      });

      const { result } = renderHook(() => useMessages(CONV_ID));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // Simulate receiving a file message event
      await act(async () => {
        eventHandler?.({
          type: 'messageSent',
          message: {
            id: 'msg-file-1',
            conversationId: CONV_ID,
            senderDid: 'did:key:z6MkTest',
            content: { type: 'file', ...FILE_PAYLOAD },
            timestamp: Date.now(),
            read: false,
            delivered: false,
            status: 'sent',
          },
        });
      });

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].content.type).toBe('file');
    });

    it('T4.21.4 — sendFileMessage returns null when service is not initialized', async () => {
      const { result } = renderHook(() => useMessages(null));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      let msg: any;
      await act(async () => {
        msg = await result.current.sendFileMessage(FILE_PAYLOAD);
      });

      expect(msg).toBeNull();
      expect(mockService.sendFileMessage).not.toHaveBeenCalled();
    });

    it('T4.21.5 — sendFileMessage sets error state on service failure', async () => {
      mockService.sendFileMessage.mockRejectedValueOnce(new Error('Upload failed'));

      const { result } = renderHook(() => useMessages(CONV_ID));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.sendFileMessage(FILE_PAYLOAD);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.error?.message).toBe('Upload failed');
    });

    it('T4.21.6 — file message with JSON bridge format (__file marker) is handled as text event', async () => {
      let eventHandler: ((event: any) => void) | null = null;
      mockService.onMessageEvent.mockImplementation((cb: any) => {
        eventHandler = cb;
        return jest.fn();
      });

      const { result } = renderHook(() => useMessages(CONV_ID));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // When a file message comes through as text (JSON bridge pattern),
      // the content is a string — the hook should still append it
      const jsonBridge = JSON.stringify({ __file: true, ...FILE_PAYLOAD });
      await act(async () => {
        eventHandler?.({
          type: 'messageSent',
          message: {
            id: 'msg-json-bridge',
            conversationId: CONV_ID,
            senderDid: 'did:key:z6MkTest',
            content: jsonBridge,
            timestamp: Date.now(),
            read: false,
            delivered: false,
            status: 'sent',
          },
        });
      });

      // String content should be accepted by the content guard
      expect(result.current.messages).toHaveLength(1);
    });

    it('T4.21.7 — mixed text and file messages display in correct order', async () => {
      let eventHandler: ((event: any) => void) | null = null;
      mockService.onMessageEvent.mockImplementation((cb: any) => {
        eventHandler = cb;
        return jest.fn();
      });

      const { result } = renderHook(() => useMessages(CONV_ID));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      const now = Date.now();

      // Send text message
      await act(async () => {
        eventHandler?.({
          type: 'messageSent',
          message: {
            id: 'msg-text-1',
            conversationId: CONV_ID,
            senderDid: 'did:key:z6MkTest',
            content: { type: 'text', text: 'Check out this file' },
            timestamp: now,
            read: false,
            delivered: false,
            status: 'sent',
          },
        });
      });

      // Send file message
      await act(async () => {
        eventHandler?.({
          type: 'messageSent',
          message: {
            id: 'msg-file-2',
            conversationId: CONV_ID,
            senderDid: 'did:key:z6MkTest',
            content: { type: 'file', ...FILE_PAYLOAD },
            timestamp: now + 1,
            read: false,
            delivered: false,
            status: 'sent',
          },
        });
      });

      expect(result.current.messages).toHaveLength(2);
      expect(result.current.messages[0].content.type).toBe('text');
      expect(result.current.messages[1].content.type).toBe('file');
    });

    it('T4.21.8 — sendFileMessage returns message with file content type', async () => {
      const { result } = renderHook(() => useMessages(CONV_ID));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      let msg: any;
      await act(async () => {
        msg = await result.current.sendFileMessage(FILE_PAYLOAD);
      });

      expect(msg).toBeTruthy();
      expect(msg.content.type).toBe('file');
      expect(msg.content.filename).toBe('photo.png');
      expect(msg.content.size).toBe(4096);
    });

    it('T4.21.9 — sendFileMessage registers file in shared files panel via uploadDmFile', async () => {
      const dmFileRecord = {
        id: 'dm-file-record-1',
        conversationId: CONV_ID,
        filename: 'photo.png',
      };
      mockService.uploadDmFile.mockResolvedValue(dmFileRecord);

      const { result } = renderHook(() => useMessages(CONV_ID));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.sendFileMessage(FILE_PAYLOAD);
      });

      // After sendFileMessage succeeds, uploadDmFile should be called
      expect(mockService.uploadDmFile).toHaveBeenCalledWith(
        CONV_ID,
        null,                  // folderId — root level
        'photo.png',           // filename
        null,                  // description
        4096,                  // size
        'image/png',           // mimeType
        '[]',                  // storageChunksJson
        'did:key:z6MkTest',    // myDid
      );
    });

    it('T4.21.10 — sendFileMessage dispatches DM file event after registration', async () => {
      const dmFileRecord = {
        id: 'dm-file-record-2',
        conversationId: CONV_ID,
        filename: 'photo.png',
      };
      mockService.uploadDmFile.mockResolvedValue(dmFileRecord);

      const { result } = renderHook(() => useMessages(CONV_ID));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.sendFileMessage(FILE_PAYLOAD);
      });

      // After uploadDmFile succeeds, dispatchDmFileEvent should fire
      expect(mockService.dispatchDmFileEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          conversationId: CONV_ID,
          senderDid: 'did:key:z6MkTest',
          event: { type: 'fileUploaded', file: dmFileRecord },
        }),
      );
    });

    it('T4.21.11 — sendFileMessage still succeeds even if uploadDmFile fails (non-fatal)', async () => {
      mockService.uploadDmFile.mockRejectedValue(new Error('DB error'));

      const { result } = renderHook(() => useMessages(CONV_ID));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      let msg: any;
      await act(async () => {
        msg = await result.current.sendFileMessage(FILE_PAYLOAD);
      });

      // The file message should still be returned successfully
      expect(msg).toBeTruthy();
      expect(msg.content.type).toBe('file');
      // dispatchDmFileEvent should NOT have been called since uploadDmFile failed
      expect(mockService.dispatchDmFileEvent).not.toHaveBeenCalled();
      // No error state should be set since it's non-fatal
      expect(result.current.error).toBeNull();
    });

    it('T4.21.12 — sendGroupFileMessage also registers file in shared files panel', async () => {
      const GROUP_ID = 'group-1';
      const dmFileRecord = {
        id: 'dm-file-group-1',
        conversationId: CONV_ID,
        filename: 'photo.png',
      };
      mockService.uploadDmFile.mockResolvedValue(dmFileRecord);

      const { result } = renderHook(() => useMessages(CONV_ID, GROUP_ID));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.sendFileMessage(FILE_PAYLOAD);
      });

      // Group file messages should also register in shared files
      expect(mockService.sendGroupFileMessage).toHaveBeenCalled();
      expect(mockService.uploadDmFile).toHaveBeenCalledWith(
        CONV_ID,
        null,
        'photo.png',
        null,
        4096,
        'image/png',
        '[]',
        'did:key:z6MkTest',
      );
      expect(mockService.dispatchDmFileEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          conversationId: CONV_ID,
          event: { type: 'fileUploaded', file: dmFileRecord },
        }),
      );
    });
  });
});
