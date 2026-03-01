/**
 * Tests for useNetwork hook
 *
 * Covers connection state management, network start/stop,
 * WebRTC signaling flow, and relay connection lifecycle.
 *
 * Test IDs: T11.10.1 - T11.10.25
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';

// ---------------------------------------------------------------------------
// Mock contexts BEFORE importing the hook
// ---------------------------------------------------------------------------

const mockService = {
  getNetworkStatus: jest.fn(() =>
    Promise.resolve({ isRunning: false, peerCount: 0, listenAddresses: [] }),
  ),
  startNetwork: jest.fn(() => Promise.resolve()),
  stopNetwork: jest.fn(() => Promise.resolve()),
  createOffer: jest.fn(() => Promise.resolve('{"sdp":"mock-offer","sdp_type":"offer"}')),
  acceptOffer: jest.fn(() => Promise.resolve('{"sdp":"mock-answer","sdp_type":"answer"}')),
  completeHandshake: jest.fn(() => Promise.resolve(true)),
  completeAnswerer: jest.fn(() => Promise.resolve(true)),
  connectRelay: jest.fn((url: string) =>
    Promise.resolve({
      connected: true,
      relayUrl: url,
      did: 'did:key:z6MkTest',
      registerMessage: JSON.stringify({ type: 'register', did: 'did:key:z6MkTest' }),
    }),
  ),
  disconnectRelay: jest.fn(() => Promise.resolve()),
  createOfferSession: jest.fn(() =>
    Promise.resolve({
      relayUrl: 'wss://relay.test/ws',
      did: 'did:key:z6MkTest',
      peerId: 'mock-peer-id',
      offerPayload: '{}',
      createSessionMessage: '{}',
      sessionId: 'session-1',
      link: 'https://relay.test/join/session-1',
    }),
  ),
  acceptSession: jest.fn(() =>
    Promise.resolve({
      sessionId: 'session-1',
      answerPayload: '{}',
      joinSessionMessage: '{}',
      did: 'did:key:z6MkTest',
      peerId: 'mock-peer-id',
    }),
  ),
  onDiscoveryEvent: jest.fn(() => jest.fn()),
  onRelayEvent: jest.fn(() => jest.fn()),
  setRelayWs: jest.fn(),
  getRelayWs: jest.fn(() => null),
  relaySend: jest.fn(() =>
    Promise.resolve({ relayMessage: '{}' }),
  ),
  relayFetchOffline: jest.fn(() => Promise.resolve('{}')),
  getFriends: jest.fn(() => Promise.resolve([])),
  getCommunities: jest.fn(() => Promise.resolve([])),
};

const mockIdentity = {
  did: 'did:key:z6MkTest',
  displayName: 'Test User',
  createdAt: Date.now() / 1000,
};

jest.mock('@/contexts/UmbraContext', () => ({
  useUmbra: jest.fn(() => ({
    isReady: true,
    isLoading: false,
    error: null,
    service: mockService,
    version: '0.1.0-test',
    initStage: 'ready',
  })),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    identity: mockIdentity,
    isAuthenticated: true,
    isHydrated: true,
  })),
}));

jest.mock('@/config', () => ({
  PRIMARY_RELAY_URL: 'wss://relay.test/ws',
  DEFAULT_RELAY_SERVERS: ['wss://relay.test/ws', 'wss://relay2.test/ws'],
  NETWORK_CONFIG: {
    enableDht: false,
    enableRelay: true,
    autoConnectRelay: false, // Disable auto-connect for controlled testing
    timeout: 30000,
    reconnectDelay: 5000,
    maxReconnectAttempts: 5,
    keepAliveInterval: 25000,
    maxBackoffDelay: 30000,
  },
}));

import { useNetwork } from '@/hooks/useNetwork';
import { useUmbra } from '@/contexts/UmbraContext';

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks();

  // Restore the default useUmbra mock (tests that override it must be self-contained)
  (useUmbra as jest.Mock).mockReturnValue({
    isReady: true,
    isLoading: false,
    error: null,
    service: mockService,
    version: '0.1.0-test',
    initStage: 'ready',
  });

  // Reset service mock return values
  mockService.getNetworkStatus.mockResolvedValue({
    isRunning: false,
    peerCount: 0,
    listenAddresses: [],
  });
  mockService.startNetwork.mockResolvedValue(undefined);
  mockService.stopNetwork.mockResolvedValue(undefined);
  mockService.createOffer.mockResolvedValue('{"sdp":"mock-offer","sdp_type":"offer"}');
  mockService.acceptOffer.mockResolvedValue('{"sdp":"mock-answer","sdp_type":"answer"}');
  mockService.completeHandshake.mockResolvedValue(true);
  mockService.completeAnswerer.mockResolvedValue(true);
  mockService.onDiscoveryEvent.mockReturnValue(jest.fn());
});

// ---------------------------------------------------------------------------
// T11.10.1 — Initial state
// ---------------------------------------------------------------------------

describe('T11.10.1-3 — Initial State', () => {
  it('T11.10.1 — isConnected starts as false', async () => {
    const { result } = renderHook(() => useNetwork());
    expect(result.current.isConnected).toBe(false);
  });

  it('T11.10.2 — peerCount starts at 0', () => {
    const { result } = renderHook(() => useNetwork());
    expect(result.current.peerCount).toBe(0);
  });

  it('T11.10.3 — connectionState starts as idle', () => {
    const { result } = renderHook(() => useNetwork());
    expect(result.current.connectionState).toBe('idle');
  });
});

// ---------------------------------------------------------------------------
// T11.10.4-6 — Fetch status
// ---------------------------------------------------------------------------

describe('T11.10.4-6 — Network Status Fetching', () => {
  it('T11.10.4 — fetches status on mount when service is ready', async () => {
    renderHook(() => useNetwork());
    await waitFor(() => {
      expect(mockService.getNetworkStatus).toHaveBeenCalled();
    });
  });

  it('T11.10.5 — updates isConnected when status returns isRunning: true', async () => {
    mockService.getNetworkStatus.mockResolvedValue({
      isRunning: true,
      peerCount: 3,
      listenAddresses: ['/ip4/127.0.0.1/tcp/4001'],
    });

    const { result } = renderHook(() => useNetwork());

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
      expect(result.current.peerCount).toBe(3);
    });
  });

  it('T11.10.6 — does not fetch when service is not ready', async () => {
    // Use mockReturnValue (not Once) so re-renders also get the unready state
    (useUmbra as jest.Mock).mockReturnValue({
      isReady: false,
      isLoading: true,
      error: null,
      service: null,
      version: '',
      initStage: 'booting',
    });

    renderHook(() => useNetwork());

    // Should not have called getNetworkStatus because service is null
    expect(mockService.getNetworkStatus).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// T11.10.7-9 — Start / Stop Network
// ---------------------------------------------------------------------------

describe('T11.10.7-9 — Start / Stop Network', () => {
  it('T11.10.7 — startNetwork calls service.startNetwork and refreshes status', async () => {
    const { result } = renderHook(() => useNetwork());

    await act(async () => {
      await result.current.startNetwork();
    });

    expect(mockService.startNetwork).toHaveBeenCalled();
    // Should have fetched status after starting (once on mount + once after start)
    expect(mockService.getNetworkStatus).toHaveBeenCalled();
  });

  it('T11.10.8 — stopNetwork calls service.stopNetwork and refreshes status', async () => {
    const { result } = renderHook(() => useNetwork());

    await act(async () => {
      await result.current.stopNetwork();
    });

    expect(mockService.stopNetwork).toHaveBeenCalled();
    expect(mockService.getNetworkStatus).toHaveBeenCalled();
  });

  it('T11.10.9 — startNetwork sets error on failure', async () => {
    mockService.startNetwork.mockRejectedValueOnce(new Error('Network failed'));

    const { result } = renderHook(() => useNetwork());

    await act(async () => {
      await result.current.startNetwork();
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Network failed');
  });
});

// ---------------------------------------------------------------------------
// T11.10.10-14 — WebRTC Signaling Flow
// ---------------------------------------------------------------------------

describe('T11.10.10-14 — WebRTC Signaling', () => {
  it('T11.10.10 — createOffer transitions to waiting_for_answer', async () => {
    const { result } = renderHook(() => useNetwork());

    await act(async () => {
      await result.current.createOffer();
    });

    expect(result.current.connectionState).toBe('waiting_for_answer');
    expect(result.current.offerData).toBeTruthy();
  });

  it('T11.10.11 — createOffer calls service.createOffer', async () => {
    const { result } = renderHook(() => useNetwork());

    await act(async () => {
      await result.current.createOffer();
    });

    expect(mockService.createOffer).toHaveBeenCalled();
  });

  it('T11.10.12 — acceptOffer transitions to connected', async () => {
    const { result } = renderHook(() => useNetwork());

    await act(async () => {
      await result.current.acceptOffer('{"sdp":"offer","sdp_type":"offer"}');
    });

    expect(result.current.connectionState).toBe('connected');
    expect(result.current.answerData).toBeTruthy();
  });

  it('T11.10.13 — completeHandshake transitions to connected', async () => {
    const { result } = renderHook(() => useNetwork());

    await act(async () => {
      await result.current.completeHandshake('{"sdp":"answer","sdp_type":"answer"}');
    });

    expect(result.current.connectionState).toBe('connected');
  });

  it('T11.10.14 — createOffer sets error and state on failure', async () => {
    mockService.createOffer.mockRejectedValueOnce(new Error('Offer failed'));

    const { result } = renderHook(() => useNetwork());

    await act(async () => {
      await result.current.createOffer();
    });

    expect(result.current.connectionState).toBe('error');
    expect(result.current.error?.message).toBe('Offer failed');
  });
});

// ---------------------------------------------------------------------------
// T11.10.15-16 — Reset Signaling
// ---------------------------------------------------------------------------

describe('T11.10.15-16 — Reset Signaling', () => {
  it('T11.10.15 — resetSignaling returns to idle state', async () => {
    const { result } = renderHook(() => useNetwork());

    // First create an offer to change state
    await act(async () => {
      await result.current.createOffer();
    });
    expect(result.current.connectionState).toBe('waiting_for_answer');

    // Reset
    act(() => {
      result.current.resetSignaling();
    });

    expect(result.current.connectionState).toBe('idle');
    expect(result.current.offerData).toBeNull();
    expect(result.current.answerData).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('T11.10.16 — resetSignaling clears error state', async () => {
    mockService.createOffer.mockRejectedValueOnce(new Error('Test error'));

    const { result } = renderHook(() => useNetwork());

    await act(async () => {
      await result.current.createOffer();
    });
    expect(result.current.error).not.toBeNull();

    act(() => {
      result.current.resetSignaling();
    });

    expect(result.current.error).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// T11.10.17-19 — Relay State
// ---------------------------------------------------------------------------

describe('T11.10.17-19 — Relay State', () => {
  it('T11.10.17 — relayConnected starts as false', () => {
    const { result } = renderHook(() => useNetwork());
    expect(result.current.relayConnected).toBe(false);
  });

  it('T11.10.18 — relayUrl starts as null', () => {
    const { result } = renderHook(() => useNetwork());
    expect(result.current.relayUrl).toBeNull();
  });

  it('T11.10.19 — getRelayWs returns null initially', () => {
    const { result } = renderHook(() => useNetwork());
    expect(result.current.getRelayWs()).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// T11.10.20-21 — Stop Network Error Handling
// ---------------------------------------------------------------------------

describe('T11.10.20-21 — Stop Network Error Handling', () => {
  it('T11.10.20 — stopNetwork sets error on failure', async () => {
    mockService.stopNetwork.mockRejectedValueOnce(new Error('Stop failed'));

    const { result } = renderHook(() => useNetwork());

    await act(async () => {
      await result.current.stopNetwork();
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Stop failed');
  });

  it('T11.10.21 — acceptOffer sets error on failure', async () => {
    mockService.acceptOffer.mockRejectedValueOnce(new Error('Accept failed'));

    const { result } = renderHook(() => useNetwork());

    await act(async () => {
      await result.current.acceptOffer('{"sdp":"offer"}');
    });

    expect(result.current.connectionState).toBe('error');
    expect(result.current.error?.message).toBe('Accept failed');
  });
});

// ---------------------------------------------------------------------------
// T11.10.22-23 — completeHandshake Error Handling
// ---------------------------------------------------------------------------

describe('T11.10.22-23 — Handshake Error Handling', () => {
  it('T11.10.22 — completeHandshake sets error on failure', async () => {
    mockService.completeHandshake.mockRejectedValueOnce(new Error('Handshake failed'));

    const { result } = renderHook(() => useNetwork());

    await act(async () => {
      await result.current.completeHandshake('{"sdp":"answer"}');
    });

    expect(result.current.connectionState).toBe('error');
    expect(result.current.error?.message).toBe('Handshake failed');
  });

  it('T11.10.23 — completeHandshake calls service.completeHandshake', async () => {
    const { result } = renderHook(() => useNetwork());

    await act(async () => {
      await result.current.completeHandshake('{"sdp":"answer","sdp_type":"answer"}');
    });

    expect(mockService.completeHandshake).toHaveBeenCalledWith(
      '{"sdp":"answer","sdp_type":"answer"}',
    );
  });
});

// ---------------------------------------------------------------------------
// T11.10.24-25 — Service Unavailable
// ---------------------------------------------------------------------------

describe('T11.10.24-25 — Service Unavailable Guards', () => {
  it('T11.10.24 — startNetwork is a no-op when service is null', async () => {
    // Use persistent mock so re-renders also see null service
    const noServiceMock = {
      isReady: false,
      isLoading: true,
      error: null,
      service: null,
      version: '',
      initStage: 'booting' as const,
    };
    (useUmbra as jest.Mock).mockReturnValue(noServiceMock);

    const { result } = renderHook(() => useNetwork());

    await act(async () => {
      await result.current.startNetwork();
    });

    // Should not have thrown and should not have called the mock
    expect(mockService.startNetwork).not.toHaveBeenCalled();
  });

  it('T11.10.25 — createOffer is a no-op when service is null', async () => {
    const noServiceMock = {
      isReady: false,
      isLoading: true,
      error: null,
      service: null,
      version: '',
      initStage: 'booting' as const,
    };
    (useUmbra as jest.Mock).mockReturnValue(noServiceMock);

    const { result } = renderHook(() => useNetwork());

    await act(async () => {
      await result.current.createOffer();
    });

    expect(mockService.createOffer).not.toHaveBeenCalled();
    // connectionState should still be idle
    expect(result.current.connectionState).toBe('idle');
  });
});
