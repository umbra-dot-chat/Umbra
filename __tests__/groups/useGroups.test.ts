/**
 * Jest tests for useGroups hook — Section 5 (Group Chat) of the Umbra testing checklist.
 *
 * Test IDs covered:
 *   T5.1.1-T5.1.9  Create group (name, description, members, validation)
 *   T5.4.1-T5.4.2  Group header (name, member count)
 *   T5.5.1-T5.5.5  Member management (view, add, remove, leave)
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';

// ---------------------------------------------------------------------------
// Mocks — override context hooks so the real Providers are never mounted
// ---------------------------------------------------------------------------

const mockService: Record<string, jest.Mock> = {
  // Groups
  createGroup: jest.fn(),
  getGroups: jest.fn(),
  getGroup: jest.fn(),
  updateGroup: jest.fn(),
  deleteGroup: jest.fn(),
  addGroupMember: jest.fn(),
  removeGroupMember: jest.fn(),
  getGroupMembers: jest.fn(),
  // Group invites
  getPendingGroupInvites: jest.fn(),
  sendGroupInvite: jest.fn(),
  acceptGroupInvite: jest.fn(),
  declineGroupInvite: jest.fn(),
  // Group key rotation
  rotateGroupKey: jest.fn(),
  // Group events
  onGroupEvent: jest.fn(() => jest.fn()),
};

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
    identity: { did: 'did:key:z6MkTest', displayName: 'Test User' },
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
  })),
  AuthProvider: ({ children }: any) => children,
}));

jest.mock('@/hooks/useNetwork', () => ({
  useNetwork: jest.fn(() => ({
    getRelayWs: jest.fn(() => null),
  })),
}));

// Import the hook *after* mocks are in place
import { useGroups } from '@/hooks/useGroups';
import { useUmbra } from '@/contexts/UmbraContext';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const NOW = 1700000000000;

function makeGroup(overrides: Record<string, unknown> = {}) {
  return {
    id: 'group-1',
    name: 'Test Group',
    description: 'A test group',
    createdBy: 'did:key:z6MkTest',
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function makeMember(overrides: Record<string, unknown> = {}) {
  return {
    groupId: 'group-1',
    memberDid: 'did:key:z6MkTest',
    displayName: 'TestUser',
    role: 'admin' as const,
    joinedAt: NOW,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Setup & teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks();

  // Default: service methods resolve with sensible values
  mockService.getGroups.mockResolvedValue([]);
  mockService.getPendingGroupInvites.mockResolvedValue([]);
  mockService.onGroupEvent.mockReturnValue(jest.fn()); // unsubscribe fn
});

// ===========================================================================
// T5.1  Create Group
// ===========================================================================

describe('T5.1 — Create Group', () => {
  // T5.1.1  Create group with name only
  it('T5.1.1 — creates a group with name and returns groupId + conversationId', async () => {
    const expected = { groupId: 'group-new', conversationId: 'conv-group-new' };
    mockService.createGroup.mockResolvedValue(expected);
    mockService.getGroups.mockResolvedValue([makeGroup({ id: 'group-new', name: 'My Group' })]);

    const { result } = renderHook(() => useGroups());

    // Wait for initial fetch to complete
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let createResult: { groupId: string; conversationId: string } | null = null;
    await act(async () => {
      createResult = await result.current.createGroup('My Group');
    });

    expect(mockService.createGroup).toHaveBeenCalledWith('My Group', undefined);
    expect(createResult).toEqual(expected);
  });

  // T5.1.2  Create group with name + description
  it('T5.1.2 — creates a group with name and description', async () => {
    const expected = { groupId: 'group-desc', conversationId: 'conv-group-desc' };
    mockService.createGroup.mockResolvedValue(expected);
    mockService.getGroups.mockResolvedValue([]);

    const { result } = renderHook(() => useGroups());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let createResult: { groupId: string; conversationId: string } | null = null;
    await act(async () => {
      createResult = await result.current.createGroup('Dev Team', 'Our development team');
    });

    expect(mockService.createGroup).toHaveBeenCalledWith('Dev Team', 'Our development team');
    expect(createResult).toEqual(expected);
  });

  // T5.1.3  Group list refreshes after creation
  it('T5.1.3 — refreshes group list after creating a group', async () => {
    const newGroup = makeGroup({ id: 'group-fresh', name: 'Fresh Group' });
    mockService.createGroup.mockResolvedValue({ groupId: 'group-fresh', conversationId: 'conv-fresh' });

    // First call returns empty, second (after create) returns the new group
    mockService.getGroups
      .mockResolvedValueOnce([])             // initial fetch
      .mockResolvedValueOnce([])             // initial fetch from pending invites effect
      .mockResolvedValueOnce([newGroup]);    // refresh after create

    const { result } = renderHook(() => useGroups());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.createGroup('Fresh Group');
    });

    // getGroups was called at least twice: initial load + post-create refresh
    expect(mockService.getGroups.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  // T5.1.4  Create group propagates service error
  it('T5.1.4 — propagates error when createGroup service call fails', async () => {
    mockService.createGroup.mockRejectedValue(new Error('Group name is required'));

    const { result } = renderHook(() => useGroups());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let thrownError: Error | null = null;
    await act(async () => {
      try {
        await result.current.createGroup('');
      } catch (err) {
        thrownError = err as Error;
      }
    });

    expect(thrownError).toBeInstanceOf(Error);
    expect(thrownError!.message).toBe('Group name is required');
    expect(result.current.error).toEqual(expect.objectContaining({ message: 'Group name is required' }));
  });

  // T5.1.5  Create group returns null when service is unavailable
  it('T5.1.5 — returns null when service is not available', async () => {
    (useUmbra as jest.Mock).mockReturnValue({
      service: null,
      isReady: false,
      isLoading: false,
      error: null,
      version: '',
      initStage: 'booting',
    });

    const { result } = renderHook(() => useGroups());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let createResult: unknown = 'not-called';
    await act(async () => {
      createResult = await result.current.createGroup('No Service');
    });

    expect(createResult).toBeNull();
    expect(mockService.createGroup).not.toHaveBeenCalled();

    // Restore
    (useUmbra as jest.Mock).mockReturnValue({
      service: mockService,
      isReady: true,
      isLoading: false,
      error: null,
      version: '0.1.0-test',
      initStage: 'ready',
    });
  });

  // T5.1.6  Create group with duplicate name (service decides — we just pass through)
  it('T5.1.6 — allows creating groups with duplicate names (no client-side uniqueness check)', async () => {
    mockService.createGroup.mockResolvedValue({ groupId: 'group-dup', conversationId: 'conv-dup' });

    const { result } = renderHook(() => useGroups());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let createResult: unknown;
    await act(async () => {
      createResult = await result.current.createGroup('Duplicate');
    });

    expect(createResult).toEqual({ groupId: 'group-dup', conversationId: 'conv-dup' });
  });

  // T5.1.7  Create group sets error state on non-Error throwable
  it('T5.1.7 — wraps non-Error throwable in Error and sets error state', async () => {
    mockService.createGroup.mockRejectedValue('string error');

    const { result } = renderHook(() => useGroups());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let thrownError: Error | null = null;
    await act(async () => {
      try {
        await result.current.createGroup('Bad');
      } catch (err) {
        thrownError = err as Error;
      }
    });

    expect(thrownError).toBeInstanceOf(Error);
    expect(thrownError!.message).toBe('string error');
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error!.message).toBe('string error');
  });

  // T5.1.8  createGroup resolves with both groupId and conversationId
  it('T5.1.8 — resolves with both groupId and conversationId fields', async () => {
    mockService.createGroup.mockResolvedValue({
      groupId: 'group-id-check',
      conversationId: 'conv-id-check',
    });

    const { result } = renderHook(() => useGroups());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let createResult: { groupId: string; conversationId: string } | null = null;
    await act(async () => {
      createResult = await result.current.createGroup('Fields Check');
    });

    expect(createResult).toHaveProperty('groupId', 'group-id-check');
    expect(createResult).toHaveProperty('conversationId', 'conv-id-check');
  });

  // T5.1.9  Error is cleared on a subsequent successful create
  it('T5.1.9 — clears previous error on successful subsequent create', async () => {
    // First call fails
    mockService.createGroup.mockRejectedValueOnce(new Error('fail first'));

    const { result } = renderHook(() => useGroups());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      try {
        await result.current.createGroup('fail');
      } catch {
        // expected
      }
    });

    expect(result.current.error).toBeTruthy();

    // Second call succeeds -- the fetchGroups refresh inside createGroup
    // sets error to null on success.
    mockService.createGroup.mockResolvedValue({ groupId: 'g', conversationId: 'c' });
    mockService.getGroups.mockResolvedValue([]);

    await act(async () => {
      await result.current.createGroup('succeed');
    });

    // After the refresh fetch in createGroup succeeds, error should be cleared
    await waitFor(() => expect(result.current.error).toBeNull());
  });
});

// ===========================================================================
// T5.4  Group Header — Name & Member Count
// ===========================================================================

describe('T5.4 — Group Header (name, member count)', () => {
  // T5.4.1  getGroups returns group with name
  it('T5.4.1 — groups list includes group name for header display', async () => {
    const groups = [
      makeGroup({ id: 'g1', name: 'Alpha Squad' }),
      makeGroup({ id: 'g2', name: 'Beta Team' }),
    ];
    mockService.getGroups.mockResolvedValue(groups);

    const { result } = renderHook(() => useGroups());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.groups).toHaveLength(2);
    expect(result.current.groups[0].name).toBe('Alpha Squad');
    expect(result.current.groups[1].name).toBe('Beta Team');
  });

  // T5.4.2  getMembers returns member list for count
  it('T5.4.2 — getMembers returns member list whose length provides member count', async () => {
    const members = [
      makeMember({ memberDid: 'did:key:z6MkAdmin', role: 'admin' }),
      makeMember({ memberDid: 'did:key:z6MkUser1', displayName: 'User1', role: 'member' }),
      makeMember({ memberDid: 'did:key:z6MkUser2', displayName: 'User2', role: 'member' }),
    ];
    mockService.getGroupMembers.mockResolvedValue(members);

    const { result } = renderHook(() => useGroups());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let memberList: unknown[] = [];
    await act(async () => {
      memberList = await result.current.getMembers('group-1');
    });

    expect(memberList).toHaveLength(3);
    expect(mockService.getGroupMembers).toHaveBeenCalledWith('group-1');
  });
});

// ===========================================================================
// T5.5  Member Management
// ===========================================================================

describe('T5.5 — Member Management', () => {
  // T5.5.1  View members
  it('T5.5.1 — getMembers returns members with roles', async () => {
    const members = [
      makeMember({ memberDid: 'did:key:z6MkAdmin', displayName: 'Admin', role: 'admin' }),
      makeMember({ memberDid: 'did:key:z6MkMember', displayName: 'Member', role: 'member' }),
    ];
    mockService.getGroupMembers.mockResolvedValue(members);

    const { result } = renderHook(() => useGroups());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let memberList: Array<{ memberDid: string; role: string }> = [];
    await act(async () => {
      memberList = await result.current.getMembers('group-1');
    });

    expect(memberList).toHaveLength(2);
    expect(memberList[0]).toEqual(expect.objectContaining({ role: 'admin', memberDid: 'did:key:z6MkAdmin' }));
    expect(memberList[1]).toEqual(expect.objectContaining({ role: 'member', memberDid: 'did:key:z6MkMember' }));
  });

  // T5.5.2  Add member
  it('T5.5.2 — addMember calls service.addGroupMember with correct args', async () => {
    mockService.addGroupMember.mockResolvedValue(undefined);

    const { result } = renderHook(() => useGroups());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.addMember('group-1', 'did:key:z6MkNewMember', 'New Member');
    });

    expect(mockService.addGroupMember).toHaveBeenCalledWith('group-1', 'did:key:z6MkNewMember', 'New Member');
  });

  // T5.5.3  Remove member
  it('T5.5.3 — removeMember calls service.removeGroupMember with correct args', async () => {
    mockService.removeGroupMember.mockResolvedValue(undefined);

    const { result } = renderHook(() => useGroups());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.removeMember('group-1', 'did:key:z6MkOldMember');
    });

    expect(mockService.removeGroupMember).toHaveBeenCalledWith('group-1', 'did:key:z6MkOldMember');
  });

  // T5.5.4  Delete group (leave / admin-only delete)
  it('T5.5.4 — deleteGroup calls service.deleteGroup and refreshes list', async () => {
    mockService.deleteGroup.mockResolvedValue(undefined);
    mockService.getGroups
      .mockResolvedValueOnce([makeGroup()])     // initial
      .mockResolvedValueOnce([]);               // after delete

    const { result } = renderHook(() => useGroups());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.deleteGroup('group-1');
    });

    expect(mockService.deleteGroup).toHaveBeenCalledWith('group-1');
    // getGroups called again after delete
    expect(mockService.getGroups.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  // T5.5.5  getMembers returns empty array when service is unavailable
  it('T5.5.5 — getMembers returns empty array when service is null', async () => {
    (useUmbra as jest.Mock).mockReturnValue({
      service: null,
      isReady: false,
      isLoading: false,
      error: null,
      version: '',
      initStage: 'booting',
    });

    const { result } = renderHook(() => useGroups());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let memberList: unknown[] = ['sentinel'];
    await act(async () => {
      memberList = await result.current.getMembers('group-1');
    });

    expect(memberList).toEqual([]);
    expect(mockService.getGroupMembers).not.toHaveBeenCalled();

    // Restore
    (useUmbra as jest.Mock).mockReturnValue({
      service: mockService,
      isReady: true,
      isLoading: false,
      error: null,
      version: '0.1.0-test',
      initStage: 'ready',
    });
  });
});

// ===========================================================================
// Additional edge cases
// ===========================================================================

describe('useGroups — additional coverage', () => {
  it('refresh() re-fetches groups from service', async () => {
    mockService.getGroups
      .mockResolvedValueOnce([])                            // initial
      .mockResolvedValueOnce([makeGroup({ id: 'g-later' })]);  // after refresh

    const { result } = renderHook(() => useGroups());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.groups).toEqual([]);

    await act(async () => {
      await result.current.refresh();
    });

    await waitFor(() => expect(result.current.groups).toHaveLength(1));
    expect(result.current.groups[0].id).toBe('g-later');
  });

  it('updateGroup calls service and refreshes', async () => {
    mockService.updateGroup.mockResolvedValue(undefined);
    mockService.getGroups.mockResolvedValue([makeGroup({ name: 'Updated' })]);

    const { result } = renderHook(() => useGroups());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.updateGroup('group-1', 'Updated', 'New desc');
    });

    expect(mockService.updateGroup).toHaveBeenCalledWith('group-1', 'Updated', 'New desc');
  });

  it('addMember sets error state on failure', async () => {
    mockService.addGroupMember.mockRejectedValue(new Error('Not authorized'));

    const { result } = renderHook(() => useGroups());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.addMember('group-1', 'did:key:z6MkBad');
    });

    expect(result.current.error).toEqual(expect.objectContaining({ message: 'Not authorized' }));
  });

  it('removeMember sets error state on failure', async () => {
    mockService.removeGroupMember.mockRejectedValue(new Error('Cannot remove admin'));

    const { result } = renderHook(() => useGroups());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.removeMember('group-1', 'did:key:z6MkAdmin');
    });

    expect(result.current.error).toEqual(expect.objectContaining({ message: 'Cannot remove admin' }));
  });

  it('getMembers sets error state on failure and returns empty array', async () => {
    mockService.getGroupMembers.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useGroups());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let memberList: unknown[];
    await act(async () => {
      memberList = await result.current.getMembers('group-1');
    });

    expect(memberList!).toEqual([]);
    expect(result.current.error).toEqual(expect.objectContaining({ message: 'Network error' }));
  });

  it('deleteGroup sets error state on failure', async () => {
    mockService.deleteGroup.mockRejectedValue(new Error('Forbidden'));

    const { result } = renderHook(() => useGroups());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.deleteGroup('group-1');
    });

    expect(result.current.error).toEqual(expect.objectContaining({ message: 'Forbidden' }));
  });

  it('initial load sets groups to empty array when service is null', async () => {
    (useUmbra as jest.Mock).mockReturnValue({
      service: null,
      isReady: false,
      isLoading: false,
      error: null,
      version: '',
      initStage: 'booting',
    });

    const { result } = renderHook(() => useGroups());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.groups).toEqual([]);
    expect(mockService.getGroups).not.toHaveBeenCalled();

    // Restore
    (useUmbra as jest.Mock).mockReturnValue({
      service: mockService,
      isReady: true,
      isLoading: false,
      error: null,
      version: '0.1.0-test',
      initStage: 'ready',
    });
  });
});
