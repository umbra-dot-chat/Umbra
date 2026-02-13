import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useNetwork } from '@/hooks/useNetwork';

jest.mock('@/contexts/UmbraContext', () => ({
  useUmbra: jest.fn(),
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

const mockNetworkStatus = {
  isRunning: true,
  peerCount: 3,
  listenAddresses: [
    '/ip4/127.0.0.1/tcp/4001/p2p/12D3KooWTest',
    '/ip4/192.168.1.10/tcp/4001/p2p/12D3KooWTest',
  ],
};

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

describe('useNetwork', () => {
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

    const { result } = renderHook(() => useNetwork());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isConnected).toBe(false);
    expect(result.current.peerCount).toBe(0);
    expect(result.current.listenAddresses).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  test('fetches network status when ready', async () => {
    mockService.getNetworkStatus.mockResolvedValue(mockNetworkStatus);

    const { result } = renderHook(() => useNetwork());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockService.getNetworkStatus).toHaveBeenCalled();
    expect(result.current.isConnected).toBe(true);
    expect(result.current.peerCount).toBe(3);
    expect(result.current.listenAddresses).toEqual(
      mockNetworkStatus.listenAddresses
    );
    expect(result.current.error).toBeNull();
  });

  test('returns default values when service not ready', async () => {
    (useUmbra as jest.Mock).mockReturnValue({
      isReady: false,
      isLoading: false,
      error: null,
      service: null,
      version: '0.1.0-test',
    });

    const { result } = renderHook(() => useNetwork());

    // Service is not ready, so no fetch occurs
    expect(mockService.getNetworkStatus).not.toHaveBeenCalled();
    expect(result.current.isConnected).toBe(false);
    expect(result.current.peerCount).toBe(0);
    expect(result.current.listenAddresses).toEqual([]);
  });

  test('refresh re-fetches status', async () => {
    mockService.getNetworkStatus.mockResolvedValue({
      isRunning: false,
      peerCount: 0,
      listenAddresses: [],
    });

    const { result } = renderHook(() => useNetwork());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isConnected).toBe(false);
    expect(mockService.getNetworkStatus).toHaveBeenCalledTimes(1);

    // Update mock to return a connected status
    mockService.getNetworkStatus.mockResolvedValue(mockNetworkStatus);

    await act(async () => {
      await result.current.refresh();
    });

    expect(mockService.getNetworkStatus).toHaveBeenCalledTimes(2);
    expect(result.current.isConnected).toBe(true);
    expect(result.current.peerCount).toBe(3);
    expect(result.current.listenAddresses).toEqual(
      mockNetworkStatus.listenAddresses
    );
  });
});
