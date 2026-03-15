/**
 * Tests for useTyping hook
 *
 * Covers: typing indicator subscription, display formatting,
 * stop typing, event filtering.
 */

// ---------------------------------------------------------------------------
// Mocks — defined before imports
// ---------------------------------------------------------------------------

let eventCallback: ((event: any) => void) | null = null;

jest.mock('@/contexts/UmbraContext', () => ({
  useUmbra: () => ({
    service: {
      onMessageEvent: (cb: any) => {
        eventCallback = cb;
        return () => { eventCallback = null; };
      },
      sendTypingIndicator: () => Promise.resolve(),
    },
    isReady: true,
  }),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    identity: { did: 'did:key:z6MkSelf', displayName: 'Self' },
  }),
}));

// Mock the entire useNetwork module to avoid heavy transitive imports
jest.mock('@/hooks/useNetwork', () => ({
  useNetwork: () => ({
    getRelayWs: () => null,
    isConnected: false,
    peerCount: 0,
    startNetwork: jest.fn(),
    stopNetwork: jest.fn(),
    relayConnected: false,
  }),
}));

// Ensure @umbra/service doesn't load heavy modules
jest.mock('@umbra/service', () => ({}));

import { renderHook, act } from '@testing-library/react-native';
import { useTyping } from '@/hooks/useTyping';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useTyping', () => {
  beforeEach(() => {
    eventCallback = null;
  });

  it('starts with no typing users', () => {
    const { result } = renderHook(() => useTyping('conv-1', ['did:key:z6MkOther']));
    expect(result.current.typingUsers.size).toBe(0);
    expect(result.current.typingDisplay).toBeNull();
  });

  it('shows single typer display', () => {
    const { result } = renderHook(() => useTyping('conv-1', ['did:key:z6MkOther']));

    act(() => {
      eventCallback!({
        type: 'typingStarted',
        conversationId: 'conv-1',
        did: 'did:key:z6MkAlice',
        senderName: 'Alice',
      });
    });

    expect(result.current.typingUsers.size).toBe(1);
    expect(result.current.typingDisplay).toBe('Alice is typing...');
  });

  it('shows two typers display', () => {
    const { result } = renderHook(() => useTyping('conv-1', []));

    act(() => {
      eventCallback!({
        type: 'typingStarted',
        conversationId: 'conv-1',
        did: 'did:key:z6MkAlice',
        senderName: 'Alice',
      });
      eventCallback!({
        type: 'typingStarted',
        conversationId: 'conv-1',
        did: 'did:key:z6MkBob',
        senderName: 'Bob',
      });
    });

    expect(result.current.typingUsers.size).toBe(2);
    expect(result.current.typingDisplay).toBe('Alice and Bob are typing...');
  });

  it('ignores own typing events', () => {
    const { result } = renderHook(() => useTyping('conv-1', []));

    act(() => {
      eventCallback!({
        type: 'typingStarted',
        conversationId: 'conv-1',
        did: 'did:key:z6MkSelf',
        senderName: 'Self',
      });
    });

    expect(result.current.typingUsers.size).toBe(0);
  });

  it('removes typer on typingStopped event', () => {
    const { result } = renderHook(() => useTyping('conv-1', []));

    act(() => {
      eventCallback!({
        type: 'typingStarted',
        conversationId: 'conv-1',
        did: 'did:key:z6MkAlice',
        senderName: 'Alice',
      });
    });
    expect(result.current.typingUsers.size).toBe(1);

    act(() => {
      eventCallback!({
        type: 'typingStopped',
        conversationId: 'conv-1',
        did: 'did:key:z6MkAlice',
      });
    });
    expect(result.current.typingUsers.size).toBe(0);
    expect(result.current.typingDisplay).toBeNull();
  });

  it('ignores events for other conversations', () => {
    const { result } = renderHook(() => useTyping('conv-1', []));

    act(() => {
      eventCallback!({
        type: 'typingStarted',
        conversationId: 'conv-other',
        did: 'did:key:z6MkAlice',
        senderName: 'Alice',
      });
    });

    expect(result.current.typingUsers.size).toBe(0);
  });
});
