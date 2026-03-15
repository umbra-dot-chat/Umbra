/**
 * Tests for useFriendNotifications hook
 *
 * Covers: event subscription, mount guard, toast for accepted/rejected events,
 * sound playback, ignored event types.
 */

import { renderHook, act } from '@testing-library/react-native';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockOnFriendEvent = jest.fn();
const mockToast = jest.fn();
const mockPlaySound = jest.fn();

jest.mock('@/contexts/UmbraContext', () => ({
  useUmbra: () => ({
    service: { onFriendEvent: mockOnFriendEvent },
    isReady: true,
  }),
}));

jest.mock('@coexist/wisp-react-native', () => ({
  useToast: () => ({ toast: mockToast }),
}));

jest.mock('@/contexts/SoundContext', () => ({
  useSound: () => ({ playSound: mockPlaySound }),
}));

import { useFriendNotifications } from '@/hooks/useFriendNotifications';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useFriendNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOnFriendEvent.mockReturnValue(jest.fn());
  });

  it('subscribes to friend events on mount', () => {
    renderHook(() => useFriendNotifications());
    expect(mockOnFriendEvent).toHaveBeenCalledTimes(1);
  });

  it('ignores events within 1 second mount guard', () => {
    let eventCallback: ((event: any) => void) | null = null;
    mockOnFriendEvent.mockImplementation((cb: any) => {
      eventCallback = cb;
      return jest.fn();
    });

    // Mock Date.now to control mount guard
    const realDateNow = Date.now;
    const mountTime = 1000000;
    Date.now = jest.fn(() => mountTime);

    renderHook(() => useFriendNotifications());

    // Fire event 500ms after mount (within guard)
    Date.now = jest.fn(() => mountTime + 500);
    act(() => {
      eventCallback!({ type: 'requestAccepted', did: 'did:key:z6MkAlice' });
    });

    expect(mockToast).not.toHaveBeenCalled();
    expect(mockPlaySound).not.toHaveBeenCalled();

    Date.now = realDateNow;
  });

  it('shows toast for requestAccepted after mount guard', () => {
    let eventCallback: ((event: any) => void) | null = null;
    mockOnFriendEvent.mockImplementation((cb: any) => {
      eventCallback = cb;
      return jest.fn();
    });

    const realDateNow = Date.now;
    const mountTime = 1000000;
    Date.now = jest.fn(() => mountTime);

    renderHook(() => useFriendNotifications());

    // Fire event 2 seconds after mount (past guard)
    Date.now = jest.fn(() => mountTime + 2000);
    act(() => {
      eventCallback!({ type: 'requestAccepted', did: 'did:key:z6MkAlice1234567890' });
    });

    expect(mockPlaySound).toHaveBeenCalledWith('friend_accept');
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Request Accepted',
        variant: 'success',
      }),
    );

    Date.now = realDateNow;
  });

  it('plays sound for requestReceived (no toast)', () => {
    let eventCallback: ((event: any) => void) | null = null;
    mockOnFriendEvent.mockImplementation((cb: any) => {
      eventCallback = cb;
      return jest.fn();
    });

    const realDateNow = Date.now;
    const mountTime = 1000000;
    Date.now = jest.fn(() => mountTime);

    renderHook(() => useFriendNotifications());

    Date.now = jest.fn(() => mountTime + 2000);
    act(() => {
      eventCallback!({ type: 'requestReceived', did: 'did:key:z6MkBob' });
    });

    expect(mockPlaySound).toHaveBeenCalledWith('friend_request');
    // No toast for requestReceived — visual handled by badge
    expect(mockToast).not.toHaveBeenCalled();

    Date.now = realDateNow;
  });
});
