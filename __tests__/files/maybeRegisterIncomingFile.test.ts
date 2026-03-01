/**
 * maybeRegisterIncomingFile — Unit tests for incoming file registration.
 *
 * When a relay message contains a JSON-bridge file payload (__file:true),
 * it should be registered in dm_shared_files so it appears in the
 * Shared Files panel.
 *
 * Test IDs covered:
 *   T4.23.1 - T4.23.8  Incoming file registration
 */

// ---------------------------------------------------------------------------
// Mocks — Must be defined BEFORE importing the module under test
// ---------------------------------------------------------------------------

jest.mock('@/contexts/UmbraContext', () => ({
  useUmbra: () => ({
    service: null,
    isReady: false,
    isLoading: false,
    error: null,
    version: '0.1.0-test',
    initStage: 'ready',
  }),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    identity: null,
    isAuthenticated: false,
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

jest.mock('@/config', () => ({
  PRIMARY_RELAY_URL: 'wss://relay.test/ws',
  DEFAULT_RELAY_SERVERS: ['wss://relay.test/ws'],
  NETWORK_CONFIG: {
    enableDht: false,
    enableRelay: true,
    autoConnectRelay: false,
    timeout: 30000,
    reconnectDelay: 5000,
    maxReconnectAttempts: 5,
    keepAliveInterval: 25000,
    maxBackoffDelay: 30000,
  },
}));

import { maybeRegisterIncomingFile } from '@/hooks/useNetwork';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CONV_ID = 'conv-test-1';
const SENDER_DID = 'did:key:z6MkFriend1';

function makeFileText(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    __file: true,
    fileId: 'file-abc-123',
    filename: 'document.pdf',
    size: 8192,
    mimeType: 'application/pdf',
    storageChunksJson: '["chunk-1","chunk-2"]',
    ...overrides,
  });
}

function createMockService() {
  return {
    uploadDmFile: jest.fn(() =>
      Promise.resolve({
        id: 'dm-file-reg-1',
        conversationId: CONV_ID,
        filename: 'document.pdf',
      }),
    ),
    dispatchDmFileEvent: jest.fn(),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('maybeRegisterIncomingFile', () => {
  it('T4.23.1 — Registers file when message contains __file JSON payload', async () => {
    const service = createMockService();
    const fileText = makeFileText();

    await maybeRegisterIncomingFile(service, CONV_ID, SENDER_DID, fileText);

    expect(service.uploadDmFile).toHaveBeenCalledWith(
      CONV_ID,
      null,
      'document.pdf',
      null,
      8192,
      'application/pdf',
      '["chunk-1","chunk-2"]',
      SENDER_DID,
    );
  });

  it('T4.23.2 — Dispatches fileUploaded event after registration', async () => {
    const dmRecord = { id: 'dm-file-reg-2', conversationId: CONV_ID, filename: 'doc.pdf' };
    const service = createMockService();
    service.uploadDmFile.mockResolvedValue(dmRecord);

    await maybeRegisterIncomingFile(service, CONV_ID, SENDER_DID, makeFileText());

    expect(service.dispatchDmFileEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        conversationId: CONV_ID,
        senderDid: SENDER_DID,
        event: { type: 'fileUploaded', file: dmRecord },
      }),
    );
  });

  it('T4.23.3 — Skips non-file text messages (no-op)', async () => {
    const service = createMockService();

    await maybeRegisterIncomingFile(service, CONV_ID, SENDER_DID, 'Hello world!');

    expect(service.uploadDmFile).not.toHaveBeenCalled();
    expect(service.dispatchDmFileEvent).not.toHaveBeenCalled();
  });

  it('T4.23.4 — Skips JSON without __file marker', async () => {
    const service = createMockService();
    const text = JSON.stringify({ type: 'text', content: 'Hello' });

    await maybeRegisterIncomingFile(service, CONV_ID, SENDER_DID, text);

    expect(service.uploadDmFile).not.toHaveBeenCalled();
  });

  it('T4.23.5 — Skips __file payload missing fileId', async () => {
    const service = createMockService();
    const text = makeFileText({ fileId: undefined });

    await maybeRegisterIncomingFile(service, CONV_ID, SENDER_DID, text);

    expect(service.uploadDmFile).not.toHaveBeenCalled();
  });

  it('T4.23.6 — Skips __file payload missing filename', async () => {
    const service = createMockService();
    const text = makeFileText({ filename: undefined });

    await maybeRegisterIncomingFile(service, CONV_ID, SENDER_DID, text);

    expect(service.uploadDmFile).not.toHaveBeenCalled();
  });

  it('T4.23.7 — Uses default values when size/mimeType/storageChunksJson are missing', async () => {
    const service = createMockService();
    const text = JSON.stringify({
      __file: true,
      fileId: 'file-minimal',
      filename: 'mystery.bin',
      // No size, mimeType, or storageChunksJson
    });

    await maybeRegisterIncomingFile(service, CONV_ID, SENDER_DID, text);

    expect(service.uploadDmFile).toHaveBeenCalledWith(
      CONV_ID,
      null,
      'mystery.bin',
      null,
      0,                           // default size
      'application/octet-stream',  // default mimeType
      '{}',                        // default storageChunksJson
      SENDER_DID,
    );
  });

  it('T4.23.8 — Silently swallows errors from uploadDmFile (non-fatal)', async () => {
    const service = createMockService();
    service.uploadDmFile.mockRejectedValue(new Error('DB full'));

    // Should not throw
    await expect(
      maybeRegisterIncomingFile(service, CONV_ID, SENDER_DID, makeFileText()),
    ).resolves.toBeUndefined();

    // dispatchDmFileEvent should NOT have been called since upload failed
    expect(service.dispatchDmFileEvent).not.toHaveBeenCalled();
  });

  it('T4.23.9 — Works with group message context (different sender DID)', async () => {
    const service = createMockService();
    const groupSender = 'did:key:z6MkGroupMember';
    const groupConvId = 'group-conv-1';

    await maybeRegisterIncomingFile(
      service, groupConvId, groupSender, makeFileText(),
    );

    expect(service.uploadDmFile).toHaveBeenCalledWith(
      groupConvId,
      null,
      'document.pdf',
      null,
      8192,
      'application/pdf',
      '["chunk-1","chunk-2"]',
      groupSender,
    );
    expect(service.dispatchDmFileEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        conversationId: groupConvId,
        senderDid: groupSender,
      }),
    );
  });
});
