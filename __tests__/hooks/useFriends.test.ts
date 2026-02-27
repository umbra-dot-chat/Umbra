import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useFriends } from '@/hooks/useFriends';

jest.mock('@/contexts/UmbraContext', () => ({
  useUmbra: jest.fn(),
}));

jest.mock('@/hooks/useNetwork', () => ({
  useNetwork: () => ({
    onlineDids: new Set(),
    connectionStatus: 'connected',
    getRelayWs: jest.fn().mockReturnValue(null),
  }),
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

const mockFriends = [
  {
    did: 'did:key:z6MkFriend1',
    alias: 'Alice',
    addedAt: Date.now() - 86400000,
    status: 'confirmed',
  },
  {
    did: 'did:key:z6MkFriend2',
    alias: 'Bob',
    addedAt: Date.now() - 43200000,
    status: 'confirmed',
  },
];

const mockIncomingRequests = [
  {
    id: 'req-in-1',
    fromDid: 'did:key:z6MkRequester',
    toDid: 'did:key:z6MkMe',
    direction: 'incoming',
    createdAt: Date.now() - 3600000,
    status: 'pending',
  },
];

const mockOutgoingRequests = [
  {
    id: 'req-out-1',
    fromDid: 'did:key:z6MkMe',
    toDid: 'did:key:z6MkTarget',
    direction: 'outgoing',
    createdAt: Date.now() - 7200000,
    status: 'pending',
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
    getBlockedUsers: jest.fn().mockResolvedValue([]),
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

describe('useFriends', () => {
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

  test('returns loading state initially', () => {
    (useUmbra as jest.Mock).mockReturnValue({
      isReady: false,
      isLoading: true,
      error: null,
      service: null,
      version: '0.1.0-test',
    });

    const { result } = renderHook(() => useFriends());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.friends).toEqual([]);
    expect(result.current.incomingRequests).toEqual([]);
    expect(result.current.outgoingRequests).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  test('fetches friends and requests when ready', async () => {
    mockService.getFriends.mockResolvedValue(mockFriends);
    mockService.getIncomingRequests.mockResolvedValue(mockIncomingRequests);
    mockService.getOutgoingRequests.mockResolvedValue(mockOutgoingRequests);

    const { result } = renderHook(() => useFriends());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockService.getFriends).toHaveBeenCalled();
    expect(mockService.getIncomingRequests).toHaveBeenCalled();
    expect(mockService.getOutgoingRequests).toHaveBeenCalled();
    expect(result.current.friends).toEqual(mockFriends);
    expect(result.current.incomingRequests).toEqual(mockIncomingRequests);
    expect(result.current.outgoingRequests).toEqual(mockOutgoingRequests);
    expect(result.current.error).toBeNull();
  });

  test('sendRequest calls service.sendFriendRequest then refreshes', async () => {
    mockService.getFriends.mockResolvedValue([]);
    mockService.getIncomingRequests.mockResolvedValue([]);
    mockService.getOutgoingRequests.mockResolvedValue([]);

    const newRequest = {
      id: 'req-new',
      fromDid: 'did:key:z6MkMe',
      toDid: 'did:key:z6MkNewFriend',
      direction: 'outgoing',
      createdAt: Date.now(),
      status: 'pending',
    };
    mockService.sendFriendRequest.mockResolvedValue(newRequest);

    const { result } = renderHook(() => useFriends());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Clear call counts from initial fetch
    mockService.getFriends.mockClear();
    mockService.getIncomingRequests.mockClear();
    mockService.getOutgoingRequests.mockClear();

    let returnedRequest: any;
    await act(async () => {
      returnedRequest = await result.current.sendRequest(
        'did:key:z6MkNewFriend',
        'Hey, let us connect!'
      );
    });

    expect(mockService.sendFriendRequest).toHaveBeenCalledWith(
      'did:key:z6MkNewFriend',
      'Hey, let us connect!',
      null,
      expect.objectContaining({ did: 'did:key:z6MkMe', displayName: 'Me' })
    );
    expect(returnedRequest).toEqual(newRequest);
    // fetchAll should be called again to refresh after sending
    expect(mockService.getFriends).toHaveBeenCalled();
    expect(mockService.getIncomingRequests).toHaveBeenCalled();
    expect(mockService.getOutgoingRequests).toHaveBeenCalled();
  });

  test('acceptRequest calls service.acceptFriendRequest then refreshes', async () => {
    mockService.getFriends.mockResolvedValue([]);
    mockService.getIncomingRequests.mockResolvedValue(mockIncomingRequests);
    mockService.getOutgoingRequests.mockResolvedValue([]);

    const { result } = renderHook(() => useFriends());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Clear call counts from initial fetch
    mockService.getFriends.mockClear();
    mockService.getIncomingRequests.mockClear();
    mockService.getOutgoingRequests.mockClear();

    await act(async () => {
      await result.current.acceptRequest('req-in-1');
    });

    expect(mockService.acceptFriendRequest).toHaveBeenCalledWith(
      'req-in-1',
      null,
      expect.objectContaining({ did: 'did:key:z6MkMe', displayName: 'Me' })
    );
    // fetchAll should be called to refresh after accepting
    expect(mockService.getFriends).toHaveBeenCalled();
    expect(mockService.getIncomingRequests).toHaveBeenCalled();
    expect(mockService.getOutgoingRequests).toHaveBeenCalled();
  });

  test('rejectRequest calls service.rejectFriendRequest then refreshes', async () => {
    mockService.getFriends.mockResolvedValue([]);
    mockService.getIncomingRequests.mockResolvedValue(mockIncomingRequests);
    mockService.getOutgoingRequests.mockResolvedValue([]);

    const { result } = renderHook(() => useFriends());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Clear call counts from initial fetch
    mockService.getFriends.mockClear();
    mockService.getIncomingRequests.mockClear();
    mockService.getOutgoingRequests.mockClear();

    await act(async () => {
      await result.current.rejectRequest('req-in-1');
    });

    expect(mockService.rejectFriendRequest).toHaveBeenCalledWith('req-in-1');
    // fetchAll should be called to refresh after rejecting
    expect(mockService.getFriends).toHaveBeenCalled();
    expect(mockService.getIncomingRequests).toHaveBeenCalled();
    expect(mockService.getOutgoingRequests).toHaveBeenCalled();
  });

  test('subscribes to friend events', async () => {
    mockService.getFriends.mockResolvedValue(mockFriends);
    mockService.getIncomingRequests.mockResolvedValue([]);
    mockService.getOutgoingRequests.mockResolvedValue([]);

    const { result } = renderHook(() => useFriends());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Verify onFriendEvent was called with a callback
    expect(mockService.onFriendEvent).toHaveBeenCalledTimes(1);
    expect(mockService.onFriendEvent).toHaveBeenCalledWith(
      expect.any(Function)
    );

    // Clear call counts to isolate the event-triggered refresh
    mockService.getFriends.mockClear();
    mockService.getIncomingRequests.mockClear();
    mockService.getOutgoingRequests.mockClear();

    // Simulate a friend event by calling the registered callback
    const eventCallback = mockService.onFriendEvent.mock.calls[0][0];

    await act(async () => {
      eventCallback({ type: 'requestReceived', request: { id: 'req-event' } });
    });

    // The event handler should trigger a full refresh (fetchAll)
    await waitFor(() => {
      expect(mockService.getFriends).toHaveBeenCalled();
    });
    expect(mockService.getIncomingRequests).toHaveBeenCalled();
    expect(mockService.getOutgoingRequests).toHaveBeenCalled();
  });
});
