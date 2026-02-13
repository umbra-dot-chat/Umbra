import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useConversations } from '@/hooks/useConversations';

jest.mock('@/contexts/UmbraContext', () => ({
  useUmbra: jest.fn(),
}));

const { useUmbra } = require('@/contexts/UmbraContext');

const mockConversations = [
  {
    id: 'conv-1',
    participants: ['did:key:z6MkA', 'did:key:z6MkB'],
    lastMessageAt: Date.now() - 1000,
    unreadCount: 2,
    type: 'dm',
    friendDid: 'did:key:z6MkB',
  },
  {
    id: 'conv-2',
    participants: ['did:key:z6MkA', 'did:key:z6MkC'],
    lastMessageAt: Date.now() - 5000,
    unreadCount: 0,
    type: 'dm',
    friendDid: 'did:key:z6MkC',
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
    ...overrides,
  };
}

describe('useConversations', () => {
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

  test('returns initial loading state', () => {
    // Set service to not ready so fetch doesn't run
    (useUmbra as jest.Mock).mockReturnValue({
      isReady: false,
      isLoading: true,
      error: null,
      service: null,
      version: '0.1.0-test',
    });

    const { result } = renderHook(() => useConversations());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.conversations).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  test('fetches conversations when service is ready', async () => {
    mockService.getConversations.mockResolvedValue(mockConversations);

    const { result } = renderHook(() => useConversations());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockService.getConversations).toHaveBeenCalled();
    expect(result.current.conversations).toEqual(mockConversations);
    expect(result.current.error).toBeNull();
  });

  test('returns empty array when no conversations', async () => {
    mockService.getConversations.mockResolvedValue([]);

    const { result } = renderHook(() => useConversations());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.conversations).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  test('sets error when getConversations fails', async () => {
    const errorMessage = 'Network error';
    mockService.getConversations.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useConversations());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe(errorMessage);
    expect(result.current.conversations).toEqual([]);
  });

  test('refresh() re-fetches conversations', async () => {
    mockService.getConversations.mockResolvedValue([]);

    const { result } = renderHook(() => useConversations());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockService.getConversations).toHaveBeenCalledTimes(1);

    // Now update mock to return conversations
    mockService.getConversations.mockResolvedValue(mockConversations);

    await act(async () => {
      await result.current.refresh();
    });

    expect(mockService.getConversations).toHaveBeenCalledTimes(2);
    expect(result.current.conversations).toEqual(mockConversations);
  });

  test('subscribes to message events', async () => {
    const { result } = renderHook(() => useConversations());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Verify onMessageEvent was called with a callback
    expect(mockService.onMessageEvent).toHaveBeenCalledTimes(1);
    expect(mockService.onMessageEvent).toHaveBeenCalledWith(
      expect.any(Function)
    );

    // Simulate a message event by calling the registered callback
    const eventCallback = mockService.onMessageEvent.mock.calls[0][0];
    mockService.getConversations.mockResolvedValue(mockConversations);

    await act(async () => {
      eventCallback({ type: 'messageReceived', message: { id: 'msg-new' } });
    });

    // The event handler should trigger a refresh (fetchConversations)
    await waitFor(() => {
      expect(mockService.getConversations).toHaveBeenCalledTimes(2);
    });
  });
});
