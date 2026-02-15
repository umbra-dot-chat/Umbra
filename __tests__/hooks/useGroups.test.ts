import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useGroups } from '@/hooks/useGroups';

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

const { useUmbra } = require('@/contexts/UmbraContext');

const mockGroups = [
  {
    id: 'group-1',
    name: 'Test Group',
    description: 'A test group',
    createdBy: 'did:key:z6MkMe',
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 86400000,
  },
  {
    id: 'group-2',
    name: 'Another Group',
    description: null,
    createdBy: 'did:key:z6MkMe',
    createdAt: Date.now() - 43200000,
    updatedAt: Date.now() - 43200000,
  },
];

const mockMembers = [
  {
    groupId: 'group-1',
    memberDid: 'did:key:z6MkMe',
    displayName: 'Me',
    role: 'admin',
    joinedAt: Date.now() - 86400000,
  },
  {
    groupId: 'group-1',
    memberDid: 'did:key:z6MkAlice',
    displayName: 'Alice',
    role: 'member',
    joinedAt: Date.now() - 43200000,
  },
];

function createMockService(overrides = {}) {
  return {
    getConversations: jest.fn().mockResolvedValue([]),
    getMessages: jest.fn().mockResolvedValue([]),
    sendMessage: jest.fn().mockResolvedValue({
      id: 'msg-1', conversationId: 'conv-1', senderDid: 'did:key:z6MkMe',
      content: { type: 'text', text: 'hello' }, timestamp: Date.now(),
      read: false, delivered: false, status: 'sent',
    }),
    markAsRead: jest.fn().mockResolvedValue(0),
    getFriends: jest.fn().mockResolvedValue([]),
    getIncomingRequests: jest.fn().mockResolvedValue([]),
    getOutgoingRequests: jest.fn().mockResolvedValue([]),
    sendFriendRequest: jest.fn().mockResolvedValue({
      id: 'req-1', fromDid: '', toDid: '', direction: 'outgoing',
      createdAt: Date.now(), status: 'pending',
    }),
    acceptFriendRequest: jest.fn().mockResolvedValue(undefined),
    rejectFriendRequest: jest.fn().mockResolvedValue(undefined),
    removeFriend: jest.fn().mockResolvedValue(true),
    blockUser: jest.fn().mockResolvedValue(undefined),
    unblockUser: jest.fn().mockResolvedValue(true),
    getNetworkStatus: jest.fn().mockResolvedValue({
      isRunning: false, peerCount: 0, listenAddresses: [],
    }),
    getConnectionInfo: jest.fn().mockResolvedValue({
      did: '', peerId: '', addresses: [],
    }),
    startNetwork: jest.fn().mockResolvedValue(undefined),
    stopNetwork: jest.fn().mockResolvedValue(undefined),
    onMessageEvent: jest.fn().mockReturnValue(jest.fn()),
    onFriendEvent: jest.fn().mockReturnValue(jest.fn()),
    onDiscoveryEvent: jest.fn().mockReturnValue(jest.fn()),
    // Group methods
    createGroup: jest.fn().mockResolvedValue({
      groupId: 'group-new', conversationId: 'conv-group-new',
    }),
    getGroup: jest.fn().mockResolvedValue(mockGroups[0]),
    getGroups: jest.fn().mockResolvedValue([]),
    updateGroup: jest.fn().mockResolvedValue(undefined),
    deleteGroup: jest.fn().mockResolvedValue(undefined),
    addGroupMember: jest.fn().mockResolvedValue(undefined),
    removeGroupMember: jest.fn().mockResolvedValue(undefined),
    getGroupMembers: jest.fn().mockResolvedValue(mockMembers),
    onGroupEvent: jest.fn().mockReturnValue(jest.fn()),
    getPendingGroupInvites: jest.fn().mockResolvedValue([]),
    sendGroupInvite: jest.fn().mockResolvedValue(undefined),
    acceptGroupInvite: jest.fn().mockResolvedValue({ groupId: 'group-1', conversationId: 'conv-group-1' }),
    declineGroupInvite: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('useGroups', () => {
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
    let resolveGroups!: (value: any) => void;
    mockService.getGroups.mockReturnValue(
      new Promise((resolve) => {
        resolveGroups = resolve;
      })
    );

    const { result } = renderHook(() => useGroups());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.groups).toEqual([]);
    expect(result.current.error).toBeNull();

    await act(async () => {
      resolveGroups(mockGroups);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.groups).toEqual(mockGroups);
  });

  test('returns empty state when service is not ready', () => {
    (useUmbra as jest.Mock).mockReturnValue({
      isReady: false,
      isLoading: true,
      error: null,
      service: null,
      version: '0.1.0-test',
    });

    const { result } = renderHook(() => useGroups());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.groups).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  test('fetches groups when service is ready', async () => {
    mockService.getGroups.mockResolvedValue(mockGroups);

    const { result } = renderHook(() => useGroups());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockService.getGroups).toHaveBeenCalled();
    expect(result.current.groups).toEqual(mockGroups);
    expect(result.current.error).toBeNull();
  });

  test('createGroup calls service and refreshes list', async () => {
    mockService.getGroups.mockResolvedValue([]);

    const { result } = renderHook(() => useGroups());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Clear call counts from initial fetch
    mockService.getGroups.mockClear();
    mockService.getGroups.mockResolvedValue(mockGroups);

    let created: any;
    await act(async () => {
      created = await result.current.createGroup('New Group', 'Description');
    });

    expect(mockService.createGroup).toHaveBeenCalledWith('New Group', 'Description');
    expect(created).toBeDefined();
    expect(created.groupId).toBe('group-new');
    expect(created.conversationId).toBe('conv-group-new');
    // Should refresh groups after creating
    expect(mockService.getGroups).toHaveBeenCalled();
  });

  test('updateGroup calls service and refreshes list', async () => {
    mockService.getGroups.mockResolvedValue(mockGroups);

    const { result } = renderHook(() => useGroups());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    mockService.getGroups.mockClear();

    await act(async () => {
      await result.current.updateGroup('group-1', 'Updated Name', 'Updated Desc');
    });

    expect(mockService.updateGroup).toHaveBeenCalledWith(
      'group-1',
      'Updated Name',
      'Updated Desc'
    );
    expect(mockService.getGroups).toHaveBeenCalled();
  });

  test('deleteGroup calls service and refreshes list', async () => {
    mockService.getGroups.mockResolvedValue(mockGroups);

    const { result } = renderHook(() => useGroups());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    mockService.getGroups.mockClear();

    await act(async () => {
      await result.current.deleteGroup('group-1');
    });

    expect(mockService.deleteGroup).toHaveBeenCalledWith('group-1');
    expect(mockService.getGroups).toHaveBeenCalled();
  });

  test('addMember calls service.addGroupMember', async () => {
    mockService.getGroups.mockResolvedValue(mockGroups);

    const { result } = renderHook(() => useGroups());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.addMember('group-1', 'did:key:z6MkBob', 'Bob');
    });

    expect(mockService.addGroupMember).toHaveBeenCalledWith(
      'group-1',
      'did:key:z6MkBob',
      'Bob'
    );
  });

  test('removeMember calls service.removeGroupMember', async () => {
    mockService.getGroups.mockResolvedValue(mockGroups);

    const { result } = renderHook(() => useGroups());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.removeMember('group-1', 'did:key:z6MkAlice');
    });

    expect(mockService.removeGroupMember).toHaveBeenCalledWith(
      'group-1',
      'did:key:z6MkAlice'
    );
  });

  test('getMembers returns array of members', async () => {
    mockService.getGroups.mockResolvedValue(mockGroups);

    const { result } = renderHook(() => useGroups());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let members: any;
    await act(async () => {
      members = await result.current.getMembers('group-1');
    });

    expect(mockService.getGroupMembers).toHaveBeenCalledWith('group-1');
    expect(Array.isArray(members)).toBe(true);
    expect(members).toEqual(mockMembers);
  });

  test('getMembers returns empty array when service not available', async () => {
    (useUmbra as jest.Mock).mockReturnValue({
      isReady: false,
      isLoading: false,
      error: null,
      service: null,
      version: '0.1.0-test',
    });

    const { result } = renderHook(() => useGroups());

    let members: any;
    await act(async () => {
      members = await result.current.getMembers('group-1');
    });

    expect(members).toEqual([]);
  });

  test('refresh re-fetches groups', async () => {
    mockService.getGroups.mockResolvedValue([]);

    const { result } = renderHook(() => useGroups());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockService.getGroups).toHaveBeenCalledTimes(1);
    expect(result.current.groups).toEqual([]);

    // Update mock to return groups
    mockService.getGroups.mockResolvedValue(mockGroups);

    await act(async () => {
      await result.current.refresh();
    });

    expect(mockService.getGroups).toHaveBeenCalledTimes(2);
    expect(result.current.groups).toEqual(mockGroups);
  });

  test('sets error when getGroups fails', async () => {
    const errorMessage = 'Failed to fetch groups';
    mockService.getGroups.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useGroups());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe(errorMessage);
    expect(result.current.groups).toEqual([]);
  });

  test('sets error when createGroup fails', async () => {
    mockService.getGroups.mockResolvedValue([]);
    mockService.createGroup.mockRejectedValue(new Error('Create failed'));

    const { result } = renderHook(() => useGroups());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let thrownError: Error | undefined;
    await act(async () => {
      try {
        await result.current.createGroup('Fail Group');
      } catch (err) {
        thrownError = err as Error;
      }
    });

    expect(thrownError).toBeInstanceOf(Error);
    expect((thrownError as Error).message).toBe('Create failed');
    expect(result.current.error).toBeInstanceOf(Error);
    expect((result.current.error as Error).message).toBe('Create failed');
  });

  test('createGroup returns null when service not available', async () => {
    (useUmbra as jest.Mock).mockReturnValue({
      isReady: false,
      isLoading: false,
      error: null,
      service: null,
      version: '0.1.0-test',
    });

    const { result } = renderHook(() => useGroups());

    let created: any;
    await act(async () => {
      created = await result.current.createGroup('No Service Group');
    });

    expect(created).toBeNull();
  });
});
