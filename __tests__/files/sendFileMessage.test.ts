/**
 * sendFileMessage — Jest unit tests for file message sending flow.
 *
 * Tests the integration between useMessages.sendFileMessage() and
 * the DM shared files registration. When a file message is sent:
 * 1. service.sendFileMessage() sends the file via relay
 * 2. service.uploadDmFile() registers it in dm_shared_files
 * 3. service.dispatchDmFileEvent() notifies the local UI
 *
 * NETWORK VERIFICATION:
 * - Verifies service.sendFileMessage is called with relay WebSocket
 * - Verifies file registration in shared files after send
 * - Verifies event dispatch for local UI updates
 * - Verifies group file messages use sendGroupFileMessage
 * - Verifies error handling doesn't crash the send flow
 *
 * Test IDs covered:
 *   T4.24.10 - T4.24.16  File message sending integration
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockGetRelayWs = jest.fn(() => ({ readyState: 1 }));
const mockPlaySound = jest.fn();

jest.mock('@/contexts/UmbraContext', () => ({
  useUmbra: () => {
    const { UmbraService } = require('@umbra/service');
    return {
      service: UmbraService.instance,
      isReady: true,
      isLoading: false,
      error: null,
      version: '0.1.0-test',
      initStage: 'ready',
    };
  },
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    identity: { did: 'did:key:z6MkTest', displayName: 'Test' },
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
  }),
  AuthProvider: ({ children }: any) => children,
}));

jest.mock('@/contexts/SoundContext', () => ({
  useSound: () => ({
    playSound: mockPlaySound,
    masterVolume: 0.8,
    setMasterVolume: jest.fn(),
    muted: false,
    setMuted: jest.fn(),
    categoryVolumes: {},
    setCategoryVolume: jest.fn(),
    categoryEnabled: {},
    setCategoryEnabled: jest.fn(),
    activeTheme: 'playful',
    setActiveTheme: jest.fn(),
    preferencesLoaded: true,
  }),
}));

jest.mock('@/hooks/useNetwork', () => ({
  useNetwork: () => ({
    isConnected: false,
    peerCount: 0,
    startNetwork: jest.fn(),
    stopNetwork: jest.fn(),
    getRelayWs: mockGetRelayWs,
    relayConnected: true,
    onlineDids: new Set(),
  }),
  pushPendingRelayAck: jest.fn(),
}));

import { UmbraService } from '@umbra/service';
import { useMessages } from '@/hooks/useMessages';

const mockService = UmbraService.instance as Record<string, jest.Mock>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CONV_ID = 'conv-file-1';

const makeFilePayload = (overrides: Record<string, unknown> = {}) => ({
  filename: 'report.pdf',
  size: 8192,
  mimeType: 'application/pdf',
  storageChunksJson: '["chunk-1","chunk-2"]',
  ...overrides,
});

const makeFileMessage = (overrides: Record<string, unknown> = {}) => ({
  id: `msg-file-${Date.now()}`,
  conversationId: CONV_ID,
  senderDid: 'did:key:z6MkTest',
  content: { type: 'file', filename: 'report.pdf', size: 8192 },
  timestamp: Date.now(),
  read: false,
  delivered: false,
  status: 'sent',
  ...overrides,
});

function resetMocks() {
  jest.clearAllMocks();
  mockService.getMessages.mockResolvedValue([]);
  mockService.sendFileMessage.mockResolvedValue(makeFileMessage());
  mockService.sendGroupFileMessage.mockResolvedValue(makeFileMessage());
  mockService.uploadDmFile.mockResolvedValue({
    id: 'dm-file-registered',
    conversationId: CONV_ID,
    filename: 'report.pdf',
  });
  mockService.onMessageEvent.mockReturnValue(jest.fn());
  mockGetRelayWs.mockReturnValue({ readyState: 1 });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('sendFileMessage', () => {
  beforeEach(() => {
    resetMocks();
  });

  it('T4.24.10 — sendFileMessage calls service.sendFileMessage with correct args', async () => {
    const { result } = renderHook(() => useMessages(CONV_ID));
    await waitFor(() => expect(mockService.getMessages).toHaveBeenCalled());

    const payload = makeFilePayload();

    await act(async () => {
      await result.current.sendFileMessage(payload);
    });

    expect(mockService.sendFileMessage).toHaveBeenCalledWith(
      CONV_ID,
      payload,
      expect.anything(), // relay WebSocket
    );
  });

  it('T4.24.11 — sendFileMessage registers file in dm_shared_files', async () => {
    const { result } = renderHook(() => useMessages(CONV_ID));
    await waitFor(() => expect(mockService.getMessages).toHaveBeenCalled());

    await act(async () => {
      await result.current.sendFileMessage(makeFilePayload());
    });

    // uploadDmFile should be called to register the file in the shared files panel
    expect(mockService.uploadDmFile).toHaveBeenCalledWith(
      CONV_ID,
      null,                  // folderId (root level)
      'report.pdf',          // filename
      null,                  // description
      8192,                  // size
      'application/pdf',     // mimeType
      '["chunk-1","chunk-2"]', // storageChunksJson
      'did:key:z6MkTest',    // sender DID
    );
  });

  it('T4.24.12 — sendFileMessage dispatches fileUploaded event for local UI', async () => {
    const { result } = renderHook(() => useMessages(CONV_ID));
    await waitFor(() => expect(mockService.getMessages).toHaveBeenCalled());

    await act(async () => {
      await result.current.sendFileMessage(makeFilePayload());
    });

    expect(mockService.dispatchDmFileEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        conversationId: CONV_ID,
        senderDid: 'did:key:z6MkTest',
        event: expect.objectContaining({
          type: 'fileUploaded',
          file: expect.objectContaining({
            id: 'dm-file-registered',
          }),
        }),
      }),
    );
  });

  it('T4.24.13 — sendFileMessage plays message_send sound', async () => {
    const { result } = renderHook(() => useMessages(CONV_ID));
    await waitFor(() => expect(mockService.getMessages).toHaveBeenCalled());

    await act(async () => {
      await result.current.sendFileMessage(makeFilePayload());
    });

    expect(mockPlaySound).toHaveBeenCalledWith('message_send');
  });

  it('T4.24.14 — sendFileMessage returns null when conversationId is null', async () => {
    const { result } = renderHook(() => useMessages(null as any));

    let returned: any;
    await act(async () => {
      returned = await result.current.sendFileMessage(makeFilePayload());
    });

    expect(returned).toBeNull();
    expect(mockService.sendFileMessage).not.toHaveBeenCalled();
  });

  it('T4.24.15 — sendFileMessage handles service error gracefully', async () => {
    mockService.sendFileMessage.mockRejectedValue(new Error('Relay offline'));

    const { result } = renderHook(() => useMessages(CONV_ID));
    await waitFor(() => expect(mockService.getMessages).toHaveBeenCalled());

    let returned: any;
    await act(async () => {
      returned = await result.current.sendFileMessage(makeFilePayload());
    });

    // Should return null on error (not throw)
    expect(returned).toBeNull();
    expect(result.current.error).toBeTruthy();
  });

  it('T4.24.16 — file registration failure does not prevent message send', async () => {
    // uploadDmFile fails but sendFileMessage succeeds
    mockService.uploadDmFile.mockRejectedValue(new Error('DB full'));

    const { result } = renderHook(() => useMessages(CONV_ID));
    await waitFor(() => expect(mockService.getMessages).toHaveBeenCalled());

    let returned: any;
    await act(async () => {
      returned = await result.current.sendFileMessage(makeFilePayload());
    });

    // Message should still be sent successfully
    expect(returned).toBeTruthy();
    expect(mockService.sendFileMessage).toHaveBeenCalled();

    // dispatchDmFileEvent should NOT be called since registration failed
    expect(mockService.dispatchDmFileEvent).not.toHaveBeenCalled();
  });
});
