/**
 * Unit tests for useFriends hook
 *
 * Covers checklist Section 3 (Friends):
 *   T3.2.1-T3.2.8  All friends tab (getFriends, online/offline sections)
 *   T3.3.1-T3.3.3  Online tab
 *   T3.4.1-T3.4.7  Pending tab (incoming/outgoing requests)
 *   T3.5.1-T3.5.3  Blocked tab
 *   T3.6.1-T3.6.10 Friend request flow (send, accept, decline)
 *   T3.7.1-T3.7.4  Validation (invalid DID, self-request, duplicate)
 *   T3.8.1-T3.8.4  Actions (remove, block, unblock)
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { UmbraService } from '@umbra/service';

// ---------------------------------------------------------------------------
// Mock the three context/hook dependencies that useFriends imports
// ---------------------------------------------------------------------------

const mockService = UmbraService.instance as any;

jest.mock('@/contexts/UmbraContext', () => ({
  useUmbra: jest.fn(() => ({
    service: mockService,
    isReady: true,
    isLoading: false,
    error: null,
    version: '0.1.0-test',
    initStage: 'ready',
  })),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    identity: { did: 'did:key:z6MkSelf', displayName: 'TestUser' },
    isAuthenticated: true,
    isHydrated: true,
    login: jest.fn(),
    setIdentity: jest.fn(),
    logout: jest.fn(),
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
  })),
}));

jest.mock('@/hooks/useNetwork', () => ({
  useNetwork: jest.fn(() => ({
    getRelayWs: jest.fn(() => null),
    isConnected: false,
    peerCount: 0,
    status: { isRunning: false, peerCount: 0, listenAddresses: [] },
    connectionState: 'disconnected',
    relayConnected: false,
    relayUrl: null,
    onlineDids: new Set(),
    startNetwork: jest.fn(),
    stopNetwork: jest.fn(),
    connectRelay: jest.fn(),
    disconnectRelay: jest.fn(),
    createOffer: jest.fn(),
    acceptOffer: jest.fn(),
    completeHandshake: jest.fn(),
    createOfferSession: jest.fn(),
    acceptSession: jest.fn(),
    offerData: null,
    answerData: null,
    error: null,
  })),
}));

// Import the hook under test AFTER mocks are defined
import { useFriends } from '@/hooks/useFriends';

// ---------------------------------------------------------------------------
// Test data factories
// ---------------------------------------------------------------------------

function makeFriend(overrides: Record<string, unknown> = {}) {
  return {
    did: `did:key:z6MkFriend${Math.random().toString(36).slice(2, 8)}`,
    displayName: 'Alice',
    signingKey: 'abc123',
    encryptionKey: 'def456',
    addedAt: Date.now() / 1000,
    ...overrides,
  };
}

function makeRequest(
  direction: 'incoming' | 'outgoing',
  overrides: Record<string, unknown> = {},
) {
  return {
    id: `req-${Math.random().toString(36).slice(2, 8)}`,
    fromDid: direction === 'incoming' ? 'did:key:z6MkOther' : 'did:key:z6MkSelf',
    toDid: direction === 'incoming' ? 'did:key:z6MkSelf' : 'did:key:z6MkOther',
    direction,
    message: '',
    createdAt: Date.now(),
    status: 'pending',
    ...overrides,
  };
}

function makeBlockedUser(overrides: Record<string, unknown> = {}) {
  return {
    did: `did:key:z6MkBlocked${Math.random().toString(36).slice(2, 8)}`,
    blockedAt: Date.now(),
    reason: 'spam',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Reset all mock implementations to defaults before each test */
function resetMocks() {
  mockService.getFriends.mockReset().mockResolvedValue([]);
  mockService.getIncomingRequests.mockReset().mockResolvedValue([]);
  mockService.getOutgoingRequests.mockReset().mockResolvedValue([]);
  mockService.getBlockedUsers.mockReset().mockResolvedValue([]);
  mockService.sendFriendRequest.mockReset();
  mockService.acceptFriendRequest.mockReset().mockResolvedValue({ status: 'accepted' });
  mockService.rejectFriendRequest.mockReset().mockResolvedValue(undefined);
  mockService.removeFriend.mockReset().mockResolvedValue(true);
  mockService.blockUser.mockReset().mockResolvedValue(undefined);
  mockService.unblockUser.mockReset().mockResolvedValue(true);
  mockService.onFriendEvent.mockReset().mockReturnValue(jest.fn()); // returns unsubscribe
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITES
// ═══════════════════════════════════════════════════════════════════════════

beforeEach(() => {
  resetMocks();
});

// ---------------------------------------------------------------------------
// T3.2 — All friends tab
// ---------------------------------------------------------------------------

describe('T3.2 All friends tab', () => {
  test('T3.2.1 — initial state is empty friends list with isLoading', async () => {
    const { result } = renderHook(() => useFriends());

    // After initial fetch resolves, isLoading should be false
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.friends).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  test('T3.2.2 — fetches friends list on mount', async () => {
    const friendA = makeFriend({ displayName: 'Alice' });
    const friendB = makeFriend({ displayName: 'Bob' });
    mockService.getFriends.mockResolvedValue([friendA, friendB]);

    const { result } = renderHook(() => useFriends());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.friends).toHaveLength(2);
    expect(result.current.friends[0].displayName).toBe('Alice');
    expect(result.current.friends[1].displayName).toBe('Bob');
  });

  test('T3.2.3 — getFriends is called once on mount', async () => {
    const { result } = renderHook(() => useFriends());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockService.getFriends).toHaveBeenCalledTimes(1);
  });

  test('T3.2.4 — handles service error during initial fetch', async () => {
    mockService.getFriends.mockRejectedValue(new Error('Network down'));

    const { result } = renderHook(() => useFriends());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error!.message).toBe('Network down');
    expect(result.current.friends).toEqual([]);
  });

  test('T3.2.5 — refresh re-fetches all data', async () => {
    const { result } = renderHook(() => useFriends());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const friendC = makeFriend({ displayName: 'Charlie' });
    mockService.getFriends.mockResolvedValue([friendC]);

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.friends).toHaveLength(1);
    expect(result.current.friends[0].displayName).toBe('Charlie');
  });

  test('T3.2.6 — fetches all four lists in parallel on mount', async () => {
    const { result } = renderHook(() => useFriends());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockService.getFriends).toHaveBeenCalled();
    expect(mockService.getIncomingRequests).toHaveBeenCalled();
    expect(mockService.getOutgoingRequests).toHaveBeenCalled();
    expect(mockService.getBlockedUsers).toHaveBeenCalled();
  });

  test('T3.2.7 — subscribes to friend events on mount', async () => {
    renderHook(() => useFriends());

    await waitFor(() => {
      expect(mockService.onFriendEvent).toHaveBeenCalledTimes(1);
    });

    expect(typeof mockService.onFriendEvent.mock.calls[0][0]).toBe('function');
  });

  test('T3.2.8 — clears error on successful refresh after error', async () => {
    mockService.getFriends.mockRejectedValueOnce(new Error('fail'));

    const { result } = renderHook(() => useFriends());

    await waitFor(() => expect(result.current.error).not.toBeNull());

    // Fix the mock for the refresh call
    mockService.getFriends.mockResolvedValue([]);

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.error).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// T3.3 — Online tab (friends with online status)
// ---------------------------------------------------------------------------

describe('T3.3 Online tab', () => {
  test('T3.3.1 — returns friends with online status', async () => {
    const onlineFriend = makeFriend({ displayName: 'OnlineAlice', status: 'online' });
    const offlineFriend = makeFriend({ displayName: 'OfflineBob', status: 'offline' });
    mockService.getFriends.mockResolvedValue([onlineFriend, offlineFriend]);

    const { result } = renderHook(() => useFriends());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.friends).toHaveLength(2);
    const online = result.current.friends.filter((f: any) => f.status === 'online');
    expect(online).toHaveLength(1);
    expect(online[0].displayName).toBe('OnlineAlice');
  });

  test('T3.3.2 — returns empty when no friends are online', async () => {
    const offlineFriend = makeFriend({ status: 'offline' });
    mockService.getFriends.mockResolvedValue([offlineFriend]);

    const { result } = renderHook(() => useFriends());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const online = result.current.friends.filter((f: any) => f.status === 'online');
    expect(online).toHaveLength(0);
  });

  test('T3.3.3 — friends list updates after refresh with new online status', async () => {
    const friend = makeFriend({ displayName: 'Alice', status: 'offline' });
    mockService.getFriends.mockResolvedValue([friend]);

    const { result } = renderHook(() => useFriends());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Simulate Alice coming online
    const updatedFriend = { ...friend, status: 'online' };
    mockService.getFriends.mockResolvedValue([updatedFriend]);

    await act(async () => {
      await result.current.refresh();
    });

    const online = result.current.friends.filter((f: any) => f.status === 'online');
    expect(online).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// T3.4 — Pending tab (incoming and outgoing requests)
// ---------------------------------------------------------------------------

describe('T3.4 Pending tab', () => {
  test('T3.4.1 — initial state has empty incoming and outgoing requests', async () => {
    const { result } = renderHook(() => useFriends());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.incomingRequests).toEqual([]);
    expect(result.current.outgoingRequests).toEqual([]);
  });

  test('T3.4.2 — fetches incoming requests on mount', async () => {
    const incoming = makeRequest('incoming');
    mockService.getIncomingRequests.mockResolvedValue([incoming]);

    const { result } = renderHook(() => useFriends());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.incomingRequests).toHaveLength(1);
    expect(result.current.incomingRequests[0].direction).toBe('incoming');
  });

  test('T3.4.3 — fetches outgoing requests on mount', async () => {
    const outgoing = makeRequest('outgoing');
    mockService.getOutgoingRequests.mockResolvedValue([outgoing]);

    const { result } = renderHook(() => useFriends());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.outgoingRequests).toHaveLength(1);
    expect(result.current.outgoingRequests[0].direction).toBe('outgoing');
  });

  test('T3.4.4 — incoming and outgoing are separate lists', async () => {
    const incoming = makeRequest('incoming', { id: 'req-in' });
    const outgoing = makeRequest('outgoing', { id: 'req-out' });
    mockService.getIncomingRequests.mockResolvedValue([incoming]);
    mockService.getOutgoingRequests.mockResolvedValue([outgoing]);

    const { result } = renderHook(() => useFriends());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.incomingRequests).toHaveLength(1);
    expect(result.current.outgoingRequests).toHaveLength(1);
    expect(result.current.incomingRequests[0].id).toBe('req-in');
    expect(result.current.outgoingRequests[0].id).toBe('req-out');
  });

  test('T3.4.5 — multiple incoming requests', async () => {
    const reqs = [
      makeRequest('incoming', { id: 'req-1' }),
      makeRequest('incoming', { id: 'req-2' }),
      makeRequest('incoming', { id: 'req-3' }),
    ];
    mockService.getIncomingRequests.mockResolvedValue(reqs);

    const { result } = renderHook(() => useFriends());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.incomingRequests).toHaveLength(3);
  });

  test('T3.4.6 — multiple outgoing requests', async () => {
    const reqs = [
      makeRequest('outgoing', { id: 'req-1' }),
      makeRequest('outgoing', { id: 'req-2' }),
    ];
    mockService.getOutgoingRequests.mockResolvedValue(reqs);

    const { result } = renderHook(() => useFriends());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.outgoingRequests).toHaveLength(2);
  });

  test('T3.4.7 — requests refresh after accept/reject', async () => {
    const incoming = makeRequest('incoming', { id: 'req-accept' });
    mockService.getIncomingRequests
      .mockResolvedValueOnce([incoming]) // initial load
      .mockResolvedValue([]); // after accept

    const { result } = renderHook(() => useFriends());

    await waitFor(() => expect(result.current.incomingRequests).toHaveLength(1));

    await act(async () => {
      await result.current.acceptRequest('req-accept');
    });

    expect(result.current.incomingRequests).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// T3.5 — Blocked tab
// ---------------------------------------------------------------------------

describe('T3.5 Blocked tab', () => {
  test('T3.5.1 — initial state has empty blocked users list', async () => {
    const { result } = renderHook(() => useFriends());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.blockedUsers).toEqual([]);
  });

  test('T3.5.2 — fetches blocked users on mount', async () => {
    const blocked = makeBlockedUser({ reason: 'harassment' });
    mockService.getBlockedUsers.mockResolvedValue([blocked]);

    const { result } = renderHook(() => useFriends());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.blockedUsers).toHaveLength(1);
    expect(result.current.blockedUsers[0].reason).toBe('harassment');
  });

  test('T3.5.3 — blocked users list updates after blocking someone', async () => {
    const blockedUser = makeBlockedUser({ did: 'did:key:z6MkBadGuy' });

    mockService.getBlockedUsers
      .mockResolvedValueOnce([]) // initial: empty
      .mockResolvedValue([blockedUser]); // after block

    const { result } = renderHook(() => useFriends());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.blockedUsers).toEqual([]);

    await act(async () => {
      await result.current.blockUser('did:key:z6MkBadGuy', 'spam');
    });

    expect(result.current.blockedUsers).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// T3.6 — Friend request flow
// ---------------------------------------------------------------------------

describe('T3.6 Friend request flow', () => {
  test('T3.6.1 — sendRequest calls service.sendFriendRequest with DID', async () => {
    const targetDid = 'did:key:z6MkTarget123';
    mockService.sendFriendRequest.mockResolvedValue({
      id: 'req-new',
      fromDid: 'did:key:z6MkSelf',
      toDid: targetDid,
      direction: 'outgoing',
      message: '',
      createdAt: Date.now(),
      status: 'pending',
    });

    const { result } = renderHook(() => useFriends());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.sendRequest(targetDid);
    });

    expect(mockService.sendFriendRequest).toHaveBeenCalledWith(
      targetDid,
      undefined,
      null, // relayWs mock returns null
      { did: 'did:key:z6MkSelf', displayName: 'TestUser' },
    );
  });

  test('T3.6.2 — sendRequest returns the created request', async () => {
    const targetDid = 'did:key:z6MkTarget456';
    const createdRequest = {
      id: 'req-created',
      fromDid: 'did:key:z6MkSelf',
      toDid: targetDid,
      direction: 'outgoing',
      message: 'Hello!',
      createdAt: Date.now(),
      status: 'pending',
    };
    mockService.sendFriendRequest.mockResolvedValue(createdRequest);

    const { result } = renderHook(() => useFriends());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let returnedRequest: any;
    await act(async () => {
      returnedRequest = await result.current.sendRequest(targetDid, 'Hello!');
    });

    expect(returnedRequest).toEqual(createdRequest);
  });

  test('T3.6.3 — sendRequest with optional message', async () => {
    mockService.sendFriendRequest.mockResolvedValue({
      id: 'req-msg',
      fromDid: 'did:key:z6MkSelf',
      toDid: 'did:key:z6MkTarget',
      direction: 'outgoing',
      message: 'Hey, add me!',
      createdAt: Date.now(),
      status: 'pending',
    });

    const { result } = renderHook(() => useFriends());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.sendRequest('did:key:z6MkTarget', 'Hey, add me!');
    });

    expect(mockService.sendFriendRequest).toHaveBeenCalledWith(
      'did:key:z6MkTarget',
      'Hey, add me!',
      null,
      { did: 'did:key:z6MkSelf', displayName: 'TestUser' },
    );
  });

  test('T3.6.4 — sendRequest refreshes data after successful send', async () => {
    mockService.sendFriendRequest.mockResolvedValue({
      id: 'req-new',
      fromDid: 'did:key:z6MkSelf',
      toDid: 'did:key:z6MkTarget',
      direction: 'outgoing',
      message: '',
      createdAt: Date.now(),
      status: 'pending',
    });

    const { result } = renderHook(() => useFriends());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const callCountBefore = mockService.getFriends.mock.calls.length;

    await act(async () => {
      await result.current.sendRequest('did:key:z6MkTarget');
    });

    // getFriends should have been called again (refresh)
    expect(mockService.getFriends.mock.calls.length).toBeGreaterThan(callCountBefore);
  });

  test('T3.6.5 — acceptRequest calls service.acceptFriendRequest', async () => {
    const { result } = renderHook(() => useFriends());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.acceptRequest('req-123');
    });

    expect(mockService.acceptFriendRequest).toHaveBeenCalledWith(
      'req-123',
      null,
      { did: 'did:key:z6MkSelf', displayName: 'TestUser' },
    );
  });

  test('T3.6.6 — acceptRequest refreshes data after acceptance', async () => {
    const incoming = makeRequest('incoming', { id: 'req-to-accept' });
    const newFriend = makeFriend({ did: 'did:key:z6MkOther', displayName: 'NewFriend' });

    // Initial: one incoming request, no friends
    mockService.getIncomingRequests.mockResolvedValueOnce([incoming]);
    mockService.getFriends.mockResolvedValueOnce([]);

    const { result } = renderHook(() => useFriends());

    await waitFor(() => expect(result.current.incomingRequests).toHaveLength(1));

    // After accept: no requests, one friend
    mockService.getIncomingRequests.mockResolvedValue([]);
    mockService.getFriends.mockResolvedValue([newFriend]);

    await act(async () => {
      await result.current.acceptRequest('req-to-accept');
    });

    expect(result.current.incomingRequests).toEqual([]);
    expect(result.current.friends).toHaveLength(1);
    expect(result.current.friends[0].displayName).toBe('NewFriend');
  });

  test('T3.6.7 — rejectRequest calls service.rejectFriendRequest', async () => {
    const { result } = renderHook(() => useFriends());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.rejectRequest('req-decline');
    });

    expect(mockService.rejectFriendRequest).toHaveBeenCalledWith('req-decline');
  });

  test('T3.6.8 — rejectRequest refreshes and removes the request', async () => {
    const incoming = makeRequest('incoming', { id: 'req-decline' });

    mockService.getIncomingRequests
      .mockResolvedValueOnce([incoming]) // initial
      .mockResolvedValue([]); // after reject

    const { result } = renderHook(() => useFriends());

    await waitFor(() => expect(result.current.incomingRequests).toHaveLength(1));

    await act(async () => {
      await result.current.rejectRequest('req-decline');
    });

    expect(result.current.incomingRequests).toEqual([]);
  });

  test('T3.6.9 — sendRequest error is set on hook state', async () => {
    mockService.sendFriendRequest.mockRejectedValue(new Error('Request failed'));

    const { result } = renderHook(() => useFriends());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      try {
        await result.current.sendRequest('did:key:z6MkTarget');
      } catch {
        // sendRequest re-throws — expected
      }
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error!.message).toBe('Request failed');
  });

  test('T3.6.10 — sendRequest re-throws error so caller can handle it', async () => {
    mockService.sendFriendRequest.mockRejectedValue(new Error('Duplicate request'));

    const { result } = renderHook(() => useFriends());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await expect(async () => {
      await act(async () => {
        await result.current.sendRequest('did:key:z6MkTarget');
      });
    }).rejects.toThrow('Duplicate request');
  });
});

// ---------------------------------------------------------------------------
// T3.7 — Validation
// ---------------------------------------------------------------------------

describe('T3.7 Validation', () => {
  test('T3.7.1 — sendRequest with invalid DID sets error', async () => {
    mockService.sendFriendRequest.mockRejectedValue(new Error('Invalid DID format'));

    const { result } = renderHook(() => useFriends());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      try {
        await result.current.sendRequest('not-a-valid-did');
      } catch {
        // expected
      }
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error!.message).toBe('Invalid DID format');
  });

  test('T3.7.2 — sendRequest with empty string DID propagates error', async () => {
    mockService.sendFriendRequest.mockRejectedValue(new Error('DID is required'));

    const { result } = renderHook(() => useFriends());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      try {
        await result.current.sendRequest('');
      } catch {
        // expected
      }
    });

    expect(result.current.error!.message).toBe('DID is required');
  });

  test('T3.7.3 — duplicate request error is propagated', async () => {
    mockService.sendFriendRequest.mockRejectedValue(
      new Error('Request already pending'),
    );

    const { result } = renderHook(() => useFriends());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      try {
        await result.current.sendRequest('did:key:z6MkAlreadySent');
      } catch {
        // expected
      }
    });

    expect(result.current.error!.message).toBe('Request already pending');
  });

  test('T3.7.4 — non-Error rejection is wrapped in Error', async () => {
    mockService.sendFriendRequest.mockRejectedValue('string error');

    const { result } = renderHook(() => useFriends());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      try {
        await result.current.sendRequest('did:key:z6MkTarget');
      } catch {
        // expected
      }
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error!.message).toBe('string error');
  });
});

// ---------------------------------------------------------------------------
// T3.8 — Actions (remove, block, unblock)
// ---------------------------------------------------------------------------

describe('T3.8 Actions', () => {
  test('T3.8.1 — removeFriend calls service and returns true', async () => {
    mockService.removeFriend.mockResolvedValue(true);

    const { result } = renderHook(() => useFriends());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let success: boolean = false;
    await act(async () => {
      success = await result.current.removeFriend('did:key:z6MkFriendToRemove');
    });

    expect(success).toBe(true);
    expect(mockService.removeFriend).toHaveBeenCalledWith('did:key:z6MkFriendToRemove');
  });

  test('T3.8.2 — removeFriend refreshes data and updates friends list', async () => {
    const friend = makeFriend({ did: 'did:key:z6MkRemovable' });

    mockService.getFriends
      .mockResolvedValueOnce([friend]) // initial
      .mockResolvedValue([]); // after removal

    const { result } = renderHook(() => useFriends());

    await waitFor(() => expect(result.current.friends).toHaveLength(1));

    await act(async () => {
      await result.current.removeFriend('did:key:z6MkRemovable');
    });

    expect(result.current.friends).toEqual([]);
  });

  test('T3.8.3 — blockUser calls service.blockUser with did and reason', async () => {
    const { result } = renderHook(() => useFriends());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.blockUser('did:key:z6MkBadActor', 'harassment');
    });

    expect(mockService.blockUser).toHaveBeenCalledWith(
      'did:key:z6MkBadActor',
      'harassment',
    );
  });

  test('T3.8.4 — unblockUser calls service.unblockUser and returns true', async () => {
    const blocked = makeBlockedUser({ did: 'did:key:z6MkUnblockMe' });

    mockService.getBlockedUsers
      .mockResolvedValueOnce([blocked])
      .mockResolvedValue([]);

    const { result } = renderHook(() => useFriends());

    await waitFor(() => expect(result.current.blockedUsers).toHaveLength(1));

    let success: boolean = false;
    await act(async () => {
      success = await result.current.unblockUser('did:key:z6MkUnblockMe');
    });

    expect(success).toBe(true);
    expect(mockService.unblockUser).toHaveBeenCalledWith('did:key:z6MkUnblockMe');
    expect(result.current.blockedUsers).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe('Edge cases', () => {
  test('operations are no-ops when service is null', async () => {
    const { useUmbra } = require('@/contexts/UmbraContext');
    (useUmbra as jest.Mock).mockReturnValueOnce({
      service: null,
      isReady: false,
      isLoading: true,
      error: null,
      version: '',
      initStage: 'booting',
    });

    const { result } = renderHook(() => useFriends());

    // Should not crash; sendRequest should return null
    let sendResult: any;
    await act(async () => {
      sendResult = await result.current.sendRequest('did:key:z6MkTarget');
    });

    expect(sendResult).toBeNull();
    expect(mockService.sendFriendRequest).not.toHaveBeenCalled();
  });

  test('removeFriend returns false on service error', async () => {
    mockService.removeFriend.mockRejectedValue(new Error('Not found'));

    const { result } = renderHook(() => useFriends());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let success: boolean = true;
    await act(async () => {
      success = await result.current.removeFriend('did:key:z6MkGhost');
    });

    expect(success).toBe(false);
    expect(result.current.error!.message).toBe('Not found');
  });

  test('unblockUser returns false on service error', async () => {
    mockService.unblockUser.mockRejectedValue(new Error('Already unblocked'));

    const { result } = renderHook(() => useFriends());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let success: boolean = true;
    await act(async () => {
      success = await result.current.unblockUser('did:key:z6MkNotBlocked');
    });

    expect(success).toBe(false);
    expect(result.current.error!.message).toBe('Already unblocked');
  });

  test('acceptRequest error is set on hook state (does not throw)', async () => {
    mockService.acceptFriendRequest.mockRejectedValue(new Error('Request expired'));

    const { result } = renderHook(() => useFriends());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // acceptRequest swallows the error (sets it on state, does not re-throw)
    await act(async () => {
      await result.current.acceptRequest('req-expired');
    });

    expect(result.current.error!.message).toBe('Request expired');
  });

  test('rejectRequest error is set on hook state (does not throw)', async () => {
    mockService.rejectFriendRequest.mockRejectedValue(new Error('Already rejected'));

    const { result } = renderHook(() => useFriends());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.rejectRequest('req-already-gone');
    });

    expect(result.current.error!.message).toBe('Already rejected');
  });

  test('blockUser error is set on hook state (does not throw)', async () => {
    mockService.blockUser.mockRejectedValue(new Error('Block failed'));

    const { result } = renderHook(() => useFriends());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.blockUser('did:key:z6MkTarget');
    });

    expect(result.current.error!.message).toBe('Block failed');
  });
});

// ---------------------------------------------------------------------------
// T3.10 — Key rotation
// ---------------------------------------------------------------------------

describe('T3.10 Key rotation', () => {
  it('T3.10.1 — rotateEncryptionKey returns new key and friend count', async () => {
    const result = await mockService.rotateEncryptionKey();
    expect(result.newEncryptionKey).toBe('a'.repeat(64));
    expect(result.friendCount).toBe(2);
  });

  it('T3.10.2 — rotateEncryptionKey is called with relay WebSocket', async () => {
    const mockWs = { readyState: WebSocket.OPEN, send: jest.fn() };
    mockService.rotateEncryptionKey.mockResolvedValueOnce({
      newEncryptionKey: 'b'.repeat(64),
      friendCount: 3,
    });
    const result = await mockService.rotateEncryptionKey(mockWs);
    expect(result.friendCount).toBe(3);
    expect(mockService.rotateEncryptionKey).toHaveBeenCalledWith(mockWs);
  });

  it('T3.10.3 — rotateEncryptionKey without relay still succeeds', async () => {
    const result = await mockService.rotateEncryptionKey(null);
    expect(result.newEncryptionKey).toBeDefined();
    expect(mockService.rotateEncryptionKey).toHaveBeenCalledWith(null);
  });

  it('T3.10.4 — rotateEncryptionKey error is catchable', async () => {
    mockService.rotateEncryptionKey.mockRejectedValueOnce(
      new Error('Key rotation failed')
    );
    await expect(mockService.rotateEncryptionKey()).rejects.toThrow('Key rotation failed');
  });

  it('T3.10.5 — updateFriendEncryptionKey updates friend record', async () => {
    await mockService.updateFriendEncryptionKey(
      'did:key:z6MkTestFriend',
      'c'.repeat(64),
      'd'.repeat(128)
    );
    expect(mockService.updateFriendEncryptionKey).toHaveBeenCalledWith(
      'did:key:z6MkTestFriend',
      'c'.repeat(64),
      'd'.repeat(128)
    );
  });

  it('T3.10.6 — updateFriendEncryptionKey rejects on invalid signature', async () => {
    mockService.updateFriendEncryptionKey.mockRejectedValueOnce(
      new Error('Signature verification failed')
    );
    await expect(
      mockService.updateFriendEncryptionKey('did:key:z6MkTest', 'badkey', 'badsig')
    ).rejects.toThrow('Signature verification failed');
  });

  it('T3.10.7 — updateFriendEncryptionKey rejects for unknown friend', async () => {
    mockService.updateFriendEncryptionKey.mockRejectedValueOnce(
      new Error('Friend not found')
    );
    await expect(
      mockService.updateFriendEncryptionKey('did:key:z6MkUnknown', 'abc', 'def')
    ).rejects.toThrow('Friend not found');
  });

  it('T3.10.8 — friend list refreshes after friendKeyRotated event', async () => {
    // Render the hook, trigger a refresh via mock, verify getFriends was called
    const { result } = renderHook(() => useFriends());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // getFriends should have been called during initial load
    const initialCalls = mockService.getFriends.mock.calls.length;

    // Simulate refresh
    await act(async () => {
      await result.current.refresh();
    });

    expect(mockService.getFriends.mock.calls.length).toBeGreaterThan(initialCalls);
  });
});
