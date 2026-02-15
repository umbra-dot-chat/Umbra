import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useMessages } from '@/hooks/useMessages';

jest.mock('@/contexts/UmbraContext', () => ({
  useUmbra: jest.fn(),
}));

jest.mock('@/hooks/useNetwork', () => ({
  useNetwork: jest.fn(() => ({
    getRelayWs: jest.fn(() => null),
    sendSignal: jest.fn(),
    isConnected: false,
    relayConnected: false,
    relayUrl: null,
  })),
  pushPendingRelayAck: jest.fn(),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn().mockReturnValue({
    identity: { did: 'did:key:z6MkMe', displayName: 'Me', createdAt: Date.now() / 1000 },
    isAuthenticated: true,
    hasPin: false,
    isPinVerified: false,
    rememberMe: false,
    login: jest.fn(),
    logout: jest.fn(),
    setRememberMe: jest.fn(),
    setPin: jest.fn(),
    verifyPin: jest.fn(),
    lockApp: jest.fn(),
  }),
  AuthProvider: ({ children }: any) => children,
}));

const { useUmbra } = require('@/contexts/UmbraContext');

const mockMessages = [
  {
    id: 'msg-1',
    conversationId: 'conv-1',
    senderDid: 'did:key:z6MkA',
    content: { type: 'text', text: 'Hello' },
    timestamp: Date.now() - 2000,
    read: true,
    delivered: true,
    status: 'delivered',
  },
  {
    id: 'msg-2',
    conversationId: 'conv-1',
    senderDid: 'did:key:z6MkB',
    content: { type: 'text', text: 'Hi there' },
    timestamp: Date.now() - 1000,
    read: false,
    delivered: true,
    status: 'delivered',
  },
];

function createMockService(overrides = {}) {
  return {
    getConversations: jest.fn().mockResolvedValue([]),
    getMessages: jest.fn().mockResolvedValue([]),
    sendMessage: jest.fn().mockResolvedValue({
      id: 'msg-1',
      conversationId: 'conv-1',
      senderDid: 'did:key:z6MkMe',
      content: { type: 'text', text: 'hello' },
      timestamp: Date.now(),
      read: false,
      delivered: false,
      status: 'sent',
    }),
    markAsRead: jest.fn().mockResolvedValue(0),
    getFriends: jest.fn().mockResolvedValue([]),
    getIncomingRequests: jest.fn().mockResolvedValue([]),
    getOutgoingRequests: jest.fn().mockResolvedValue([]),
    sendFriendRequest: jest.fn().mockResolvedValue({
      id: 'req-1',
      fromDid: '',
      toDid: '',
      direction: 'outgoing',
      createdAt: Date.now(),
      status: 'pending',
    }),
    acceptFriendRequest: jest.fn().mockResolvedValue(undefined),
    rejectFriendRequest: jest.fn().mockResolvedValue(undefined),
    removeFriend: jest.fn().mockResolvedValue(true),
    blockUser: jest.fn().mockResolvedValue(undefined),
    unblockUser: jest.fn().mockResolvedValue(true),
    getNetworkStatus: jest.fn().mockResolvedValue({
      isRunning: false,
      peerCount: 0,
      listenAddresses: [],
    }),
    getConnectionInfo: jest.fn().mockResolvedValue({
      did: '',
      peerId: '',
      addresses: [],
    }),
    startNetwork: jest.fn().mockResolvedValue(undefined),
    stopNetwork: jest.fn().mockResolvedValue(undefined),
    onMessageEvent: jest.fn().mockReturnValue(jest.fn()),
    onFriendEvent: jest.fn().mockReturnValue(jest.fn()),
    onDiscoveryEvent: jest.fn().mockReturnValue(jest.fn()),
    // Extended messaging methods
    editMessage: jest.fn().mockResolvedValue({
      id: 'msg-1', content: { type: 'text', text: 'edited' }, edited: true, editedAt: Date.now(),
      conversationId: 'conv-1', senderDid: 'did:key:z6MkMe', timestamp: Date.now(),
      read: false, delivered: false, status: 'sent',
    }),
    deleteMessage: jest.fn().mockResolvedValue(undefined),
    pinMessage: jest.fn().mockResolvedValue({
      id: 'msg-1', pinned: true, pinnedBy: 'did:key:z6MkMe', pinnedAt: Date.now(),
      conversationId: 'conv-1', senderDid: 'did:key:z6MkMe', content: { type: 'text', text: 'hi' },
      timestamp: Date.now(), read: false, delivered: false, status: 'sent',
    }),
    unpinMessage: jest.fn().mockResolvedValue(undefined),
    addReaction: jest.fn().mockResolvedValue([{ emoji: '👍', count: 1, users: ['did:key:z6MkMe'], reacted: true }]),
    removeReaction: jest.fn().mockResolvedValue([]),
    forwardMessage: jest.fn().mockResolvedValue({
      id: 'msg-fwd', conversationId: 'conv-2', senderDid: 'did:key:z6MkMe',
      content: { type: 'text', text: 'forwarded' }, timestamp: Date.now(),
      read: false, delivered: false, status: 'sent', forwarded: true,
    }),
    getThreadReplies: jest.fn().mockResolvedValue([]),
    sendThreadReply: jest.fn().mockResolvedValue({
      id: 'msg-reply', conversationId: 'conv-1', senderDid: 'did:key:z6MkMe',
      content: { type: 'text', text: 'thread reply' }, timestamp: Date.now(),
      read: false, delivered: false, status: 'sent',
    }),
    getPinnedMessages: jest.fn().mockResolvedValue([]),
    ...overrides,
  };
}

describe('useMessages', () => {
  let mockService: ReturnType<typeof createMockService>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockService = createMockService();
    (useUmbra as jest.Mock).mockReturnValue({
      isReady: true,
      isLoading: false,
      error: null,
      service: mockService,
      version: '0.1.0-test',
    });
  });

  test('returns loading state initially then resolves', async () => {
    // When service is ready but getMessages hasn't resolved yet, isLoading should be true
    let resolveMessages!: (value: any) => void;
    mockService.getMessages.mockReturnValue(
      new Promise((resolve) => {
        resolveMessages = resolve;
      })
    );

    const { result } = renderHook(() => useMessages('conv-1'));

    // While getMessages is pending, isLoading should be true
    expect(result.current.isLoading).toBe(true);
    expect(result.current.messages).toEqual([]);
    expect(result.current.error).toBeNull();

    // Resolve the fetch
    await act(async () => {
      resolveMessages(mockMessages);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.messages).toEqual(mockMessages);
  });

  test('returns empty state when service is not ready', () => {
    (useUmbra as jest.Mock).mockReturnValue({
      isReady: false,
      isLoading: true,
      error: null,
      service: null,
      version: '0.1.0-test',
    });

    const { result } = renderHook(() => useMessages('conv-1'));

    // With no service, hook immediately sets isLoading=false and messages=[]
    expect(result.current.isLoading).toBe(false);
    expect(result.current.messages).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  test('returns empty messages when conversationId is null', async () => {
    const { result } = renderHook(() => useMessages(null));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.messages).toEqual([]);
    expect(mockService.getMessages).not.toHaveBeenCalled();
  });

  test('fetches messages when conversationId is provided', async () => {
    mockService.getMessages.mockResolvedValue(mockMessages);

    const { result } = renderHook(() => useMessages('conv-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockService.getMessages).toHaveBeenCalledWith('conv-1', {
      limit: 50,
      offset: 0,
    });
    expect(result.current.messages).toEqual(mockMessages);
    expect(result.current.error).toBeNull();
    // mockMessages has 2 items which is less than PAGE_SIZE (50), so hasMore = false
    expect(result.current.hasMore).toBe(false);
  });

  test('sendMessage calls service.sendMessage', async () => {
    mockService.getMessages.mockResolvedValue(mockMessages);
    const sentMessage = {
      id: 'msg-new',
      conversationId: 'conv-1',
      senderDid: 'did:key:z6MkMe',
      content: { type: 'text', text: 'new message' },
      timestamp: Date.now(),
      read: false,
      delivered: false,
      status: 'sent',
    };
    mockService.sendMessage.mockResolvedValue(sentMessage);

    const { result } = renderHook(() => useMessages('conv-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let returnedMessage: any;
    await act(async () => {
      returnedMessage = await result.current.sendMessage('new message');
    });

    expect(mockService.sendMessage).toHaveBeenCalledWith('conv-1', 'new message', null);
    expect(returnedMessage).toEqual(sentMessage);
  });

  test('markAsRead calls service.markAsRead', async () => {
    mockService.getMessages.mockResolvedValue(mockMessages);

    const { result } = renderHook(() => useMessages('conv-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.markAsRead();
    });

    expect(mockService.markAsRead).toHaveBeenCalledWith('conv-1');
  });

  test('loadMore fetches with offset', async () => {
    // Return PAGE_SIZE (50) messages so hasMore is true
    const fiftyMessages = Array.from({ length: 50 }, (_, i) => ({
      id: `msg-${i}`,
      conversationId: 'conv-1',
      senderDid: 'did:key:z6MkA',
      content: { type: 'text', text: `Message ${i}` },
      timestamp: Date.now() - i * 1000,
      read: true,
      delivered: true,
      status: 'delivered',
    }));
    mockService.getMessages.mockResolvedValue(fiftyMessages);

    const { result } = renderHook(() => useMessages('conv-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasMore).toBe(true);

    // Return 10 older messages for the loadMore call
    const olderMessages = Array.from({ length: 10 }, (_, i) => ({
      id: `msg-old-${i}`,
      conversationId: 'conv-1',
      senderDid: 'did:key:z6MkA',
      content: { type: 'text', text: `Old message ${i}` },
      timestamp: Date.now() - (50 + i) * 1000,
      read: true,
      delivered: true,
      status: 'delivered',
    }));
    mockService.getMessages.mockResolvedValue(olderMessages);

    await act(async () => {
      await result.current.loadMore();
    });

    // Second call should use offset = 50 (the count from the first fetch)
    expect(mockService.getMessages).toHaveBeenCalledWith('conv-1', {
      limit: 50,
      offset: 50,
    });

    // Messages should include both old and new (older prepended)
    expect(result.current.messages).toHaveLength(60);
    // hasMore should be false since olderMessages (10) < PAGE_SIZE (50)
    expect(result.current.hasMore).toBe(false);
  });

  // ── Extended messaging hook methods ──

  test('editMessage calls service.editMessage', async () => {
    mockService.getMessages.mockResolvedValue(mockMessages);
    const { result } = renderHook(() => useMessages('conv-1'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.editMessage('msg-1', 'New text');
    });

    expect(mockService.editMessage).toHaveBeenCalledWith('msg-1', 'New text');
  });

  test('deleteMessage calls service.deleteMessage', async () => {
    mockService.getMessages.mockResolvedValue(mockMessages);
    const { result } = renderHook(() => useMessages('conv-1'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.deleteMessage('msg-1');
    });

    expect(mockService.deleteMessage).toHaveBeenCalledWith('msg-1');
  });

  test('pinMessage calls service.pinMessage', async () => {
    mockService.getMessages.mockResolvedValue(mockMessages);
    const { result } = renderHook(() => useMessages('conv-1'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.pinMessage('msg-1');
    });

    expect(mockService.pinMessage).toHaveBeenCalledWith('msg-1');
  });

  test('unpinMessage calls service.unpinMessage', async () => {
    mockService.getMessages.mockResolvedValue(mockMessages);
    const { result } = renderHook(() => useMessages('conv-1'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.unpinMessage('msg-1');
    });

    expect(mockService.unpinMessage).toHaveBeenCalledWith('msg-1');
  });

  test('addReaction calls service.addReaction', async () => {
    mockService.getMessages.mockResolvedValue(mockMessages);
    const { result } = renderHook(() => useMessages('conv-1'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.addReaction('msg-1', '👍');
    });

    expect(mockService.addReaction).toHaveBeenCalledWith('msg-1', '👍');
  });

  test('removeReaction calls service.removeReaction', async () => {
    mockService.getMessages.mockResolvedValue(mockMessages);
    const { result } = renderHook(() => useMessages('conv-1'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.removeReaction('msg-1', '👍');
    });

    expect(mockService.removeReaction).toHaveBeenCalledWith('msg-1', '👍');
  });

  test('forwardMessage calls service.forwardMessage', async () => {
    mockService.getMessages.mockResolvedValue(mockMessages);
    const { result } = renderHook(() => useMessages('conv-1'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.forwardMessage('msg-1', 'conv-2');
    });

    expect(mockService.forwardMessage).toHaveBeenCalledWith('msg-1', 'conv-2');
  });

  test('getThreadReplies calls service.getThreadReplies', async () => {
    mockService.getMessages.mockResolvedValue(mockMessages);
    const { result } = renderHook(() => useMessages('conv-1'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let replies: any;
    await act(async () => {
      replies = await result.current.getThreadReplies('msg-1');
    });

    expect(mockService.getThreadReplies).toHaveBeenCalledWith('msg-1');
    expect(Array.isArray(replies)).toBe(true);
  });

  test('sendThreadReply calls service.sendThreadReply', async () => {
    mockService.getMessages.mockResolvedValue(mockMessages);
    const { result } = renderHook(() => useMessages('conv-1'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let reply: any;
    await act(async () => {
      reply = await result.current.sendThreadReply('msg-1', 'Reply text');
    });

    expect(mockService.sendThreadReply).toHaveBeenCalledWith('msg-1', 'Reply text', null);
    expect(reply).toBeDefined();
    expect(reply.content.text).toBe('thread reply');
  });

  test('pinnedMessages is initially empty array', async () => {
    mockService.getMessages.mockResolvedValue(mockMessages);
    const { result } = renderHook(() => useMessages('conv-1'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(Array.isArray(result.current.pinnedMessages)).toBe(true);
    expect(result.current.pinnedMessages).toEqual([]);
  });

  test('refreshPinned fetches pinned messages', async () => {
    const pinnedMsg = {
      id: 'msg-pinned',
      conversationId: 'conv-1',
      senderDid: 'did:key:z6MkA',
      content: { type: 'text', text: 'Pinned!' },
      timestamp: Date.now(),
      read: true, delivered: true, status: 'delivered',
      pinned: true,
    };
    mockService.getPinnedMessages.mockResolvedValue([pinnedMsg]);
    mockService.getMessages.mockResolvedValue(mockMessages);

    const { result } = renderHook(() => useMessages('conv-1'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.refreshPinned();
    });

    expect(mockService.getPinnedMessages).toHaveBeenCalledWith('conv-1');
    expect(result.current.pinnedMessages).toEqual([pinnedMsg]);
  });
});
