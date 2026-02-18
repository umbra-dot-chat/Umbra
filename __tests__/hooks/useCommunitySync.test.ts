/**
 * Tests for useCommunitySync hook.
 *
 * Verifies that syncEvent dispatches locally AND broadcasts via relay.
 */

import { renderHook, act } from '@testing-library/react-native';

// Mock contexts
const mockService = {
  dispatchCommunityEvent: jest.fn(),
  broadcastCommunityEvent: jest.fn(() => Promise.resolve()),
  getRelayWs: jest.fn(() => null),
};

jest.mock('@/contexts/UmbraContext', () => ({
  useUmbra: () => ({
    service: mockService,
    isReady: true,
  }),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    identity: { did: 'did:key:z6MkTestUser' },
  }),
}));

import { useCommunitySync } from '@/hooks/useCommunitySync';
import type { CommunityEvent } from '@umbra/service';

describe('useCommunitySync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns a syncEvent function', () => {
    const { result } = renderHook(() => useCommunitySync('community-1'));
    expect(typeof result.current.syncEvent).toBe('function');
  });

  it('dispatches locally via service.dispatchCommunityEvent', () => {
    const { result } = renderHook(() => useCommunitySync('community-1'));

    const event: CommunityEvent = {
      type: 'channelCreated',
      communityId: 'community-1',
      channelId: 'channel-1',
    };

    act(() => {
      result.current.syncEvent(event);
    });

    expect(mockService.dispatchCommunityEvent).toHaveBeenCalledWith(event);
  });

  it('broadcasts via service.broadcastCommunityEvent with correct args', () => {
    const mockWs = { readyState: 1 } as unknown as WebSocket;
    (mockService.getRelayWs as jest.Mock).mockReturnValue(mockWs);

    const { result } = renderHook(() => useCommunitySync('community-1'));

    const event: CommunityEvent = {
      type: 'spaceCreated',
      communityId: 'community-1',
      spaceId: 'space-1',
    };

    act(() => {
      result.current.syncEvent(event);
    });

    expect(mockService.broadcastCommunityEvent).toHaveBeenCalledWith(
      'community-1',
      event,
      'did:key:z6MkTestUser',
      mockWs,
    );
  });

  it('dispatches locally even when relay is not connected', () => {
    (mockService.getRelayWs as jest.Mock).mockReturnValue(null);

    const { result } = renderHook(() => useCommunitySync('community-1'));

    const event: CommunityEvent = {
      type: 'categoryDeleted',
      categoryId: 'cat-1',
    };

    act(() => {
      result.current.syncEvent(event);
    });

    // Local dispatch should still happen
    expect(mockService.dispatchCommunityEvent).toHaveBeenCalledWith(event);
    // Broadcast should still be called (it handles null WS internally)
    expect(mockService.broadcastCommunityEvent).toHaveBeenCalled();
  });

  it('does not throw when broadcast fails', () => {
    mockService.broadcastCommunityEvent.mockRejectedValueOnce(new Error('network error'));

    const { result } = renderHook(() => useCommunitySync('community-1'));

    const event: CommunityEvent = {
      type: 'channelDeleted',
      communityId: 'community-1',
      channelId: 'ch-1',
    };

    // Should not throw
    act(() => {
      result.current.syncEvent(event);
    });

    // Local dispatch still happens
    expect(mockService.dispatchCommunityEvent).toHaveBeenCalledWith(event);
  });
});
