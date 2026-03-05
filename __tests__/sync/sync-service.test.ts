/**
 * Jest unit tests for the sync service layer (packages/umbra-service/src/sync.ts)
 *
 * Tests the sync auth flow, blob CRUD operations, WASM wrappers, and
 * high-level convenience functions. Uses mocked fetch and WASM layer to
 * validate correct API calls, error handling, and data transformations.
 *
 * Test IDs: T-SYNC.1 – T-SYNC.30
 */

// ---------------------------------------------------------------------------
// Mock setup — BEFORE importing module under test
// ---------------------------------------------------------------------------

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock WASM module
const mockWasmModule = {
  umbra_wasm_sync_sign_challenge: jest.fn(),
  umbra_wasm_sync_create_blob: jest.fn(),
  umbra_wasm_sync_parse_blob: jest.fn(),
  umbra_wasm_sync_apply_blob: jest.fn(),
};

jest.mock('@umbra/wasm', () => ({
  getWasm: jest.fn(() => mockWasmModule),
}));

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import {
  authenticateSync,
  uploadSyncBlob,
  downloadSyncBlob,
  getSyncBlobMeta,
  deleteSyncBlob,
  createSyncBlob,
  parseSyncBlob,
  applySyncBlob,
  createSyncDelta,
  applySyncDelta,
  fullSyncUpload,
  fullSyncCheck,
  fullSyncRestore,
} from '../../packages/umbra-service/src/sync';
import { ErrorCode } from '../../packages/umbra-service/src/errors';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TEST_RELAY = 'https://relay.umbra.chat';
const TEST_DID = 'did:key:z6MkTestSync123';
const TEST_TOKEN = 'mock-bearer-token';
const TEST_NONCE = 'test-nonce-abc123';
const TEST_SIGNATURE = 'mock-ed25519-signature';
const TEST_PUBLIC_KEY = 'mock-ed25519-pubkey';
const TEST_BLOB_B64 = 'bW9jay1lbmNyeXB0ZWQtYmxvYg=='; // "mock-encrypted-blob"

function mockFetchResponse(status: number, body: any, ok = true) {
  return Promise.resolve({
    ok: ok ?? (status >= 200 && status < 300),
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(typeof body === 'string' ? body : JSON.stringify(body)),
    arrayBuffer: () => {
      // Convert base64 to ArrayBuffer if needed
      const str = typeof body === 'string' ? body : 'mock';
      const buf = new ArrayBuffer(str.length);
      const view = new Uint8Array(buf);
      for (let i = 0; i < str.length; i++) view[i] = str.charCodeAt(i);
      return Promise.resolve(buf);
    },
  });
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks();
  mockFetch.mockReset();
});

// ===========================================================================
// T-SYNC.1-5 — Authentication (challenge-response)
// ===========================================================================

describe('T-SYNC.1-5 — authenticateSync', () => {
  it('T-SYNC.1 — sends POST to /api/sync/:did/auth for challenge', async () => {
    // Mock challenge response
    mockFetch
      .mockReturnValueOnce(mockFetchResponse(200, { nonce: TEST_NONCE }))
      .mockReturnValueOnce(
        mockFetchResponse(200, { token: TEST_TOKEN, expires_at: 1700000000 }),
      );

    // Mock WASM sign
    mockWasmModule.umbra_wasm_sync_sign_challenge.mockReturnValue(
      JSON.stringify({ signature: TEST_SIGNATURE, public_key: TEST_PUBLIC_KEY }),
    );

    await authenticateSync(TEST_RELAY, TEST_DID);

    // Verify the challenge request
    expect(mockFetch).toHaveBeenCalledTimes(2);
    const [challengeUrl, challengeOpts] = mockFetch.mock.calls[0];
    expect(challengeUrl).toBe(
      `${TEST_RELAY}/api/sync/${encodeURIComponent(TEST_DID)}/auth`,
    );
    expect(challengeOpts.method).toBe('POST');
  });

  it('T-SYNC.2 — signs nonce via WASM and sends to /api/sync/:did/verify', async () => {
    mockFetch
      .mockReturnValueOnce(mockFetchResponse(200, { nonce: TEST_NONCE }))
      .mockReturnValueOnce(
        mockFetchResponse(200, { token: TEST_TOKEN, expires_at: 1700000000 }),
      );

    mockWasmModule.umbra_wasm_sync_sign_challenge.mockReturnValue(
      JSON.stringify({ signature: TEST_SIGNATURE, public_key: TEST_PUBLIC_KEY }),
    );

    await authenticateSync(TEST_RELAY, TEST_DID);

    // Verify WASM sign was called with the nonce
    expect(mockWasmModule.umbra_wasm_sync_sign_challenge).toHaveBeenCalledWith(
      JSON.stringify({ nonce: TEST_NONCE }),
    );

    // Verify the verify request
    const [verifyUrl, verifyOpts] = mockFetch.mock.calls[1];
    expect(verifyUrl).toBe(
      `${TEST_RELAY}/api/sync/${encodeURIComponent(TEST_DID)}/verify`,
    );
    expect(verifyOpts.method).toBe('POST');
    const verifyBody = JSON.parse(verifyOpts.body);
    expect(verifyBody.nonce).toBe(TEST_NONCE);
    expect(verifyBody.signature).toBe(TEST_SIGNATURE);
    expect(verifyBody.public_key).toBe(TEST_PUBLIC_KEY);
  });

  it('T-SYNC.3 — returns token and expiresAt on success', async () => {
    mockFetch
      .mockReturnValueOnce(mockFetchResponse(200, { nonce: TEST_NONCE }))
      .mockReturnValueOnce(
        mockFetchResponse(200, { token: TEST_TOKEN, expires_at: 1700000000 }),
      );

    mockWasmModule.umbra_wasm_sync_sign_challenge.mockReturnValue(
      JSON.stringify({ signature: TEST_SIGNATURE, public_key: TEST_PUBLIC_KEY }),
    );

    const result = await authenticateSync(TEST_RELAY, TEST_DID);

    expect(result.token).toBe(TEST_TOKEN);
    expect(result.expiresAt).toBe(1700000000);
  });

  it('T-SYNC.4 — throws UmbraError when challenge request fails', async () => {
    mockFetch.mockReturnValueOnce(
      mockFetchResponse(500, 'Internal Server Error', false),
    );

    await expect(authenticateSync(TEST_RELAY, TEST_DID)).rejects.toThrow(
      /Sync auth challenge failed/,
    );
  });

  it('T-SYNC.5 — throws UmbraError when verify request fails', async () => {
    mockFetch
      .mockReturnValueOnce(mockFetchResponse(200, { nonce: TEST_NONCE }))
      .mockReturnValueOnce(mockFetchResponse(401, 'Invalid signature', false));

    mockWasmModule.umbra_wasm_sync_sign_challenge.mockReturnValue(
      JSON.stringify({ signature: 'bad-sig', public_key: TEST_PUBLIC_KEY }),
    );

    await expect(authenticateSync(TEST_RELAY, TEST_DID)).rejects.toThrow(
      /Sync auth verification failed/,
    );
  });
});

// ===========================================================================
// T-SYNC.6-9 — uploadSyncBlob
// ===========================================================================

describe('T-SYNC.6-9 — uploadSyncBlob', () => {
  it('T-SYNC.6 — creates blob via WASM and uploads binary to relay', async () => {
    const createResult = {
      blob: TEST_BLOB_B64,
      sections: { preferences: 1, friends: 1 },
      size: 512,
    };

    mockWasmModule.umbra_wasm_sync_create_blob.mockReturnValue(
      JSON.stringify(createResult),
    );
    mockFetch.mockReturnValueOnce(mockFetchResponse(200, { ok: true }));

    const result = await uploadSyncBlob(TEST_RELAY, TEST_DID, TEST_TOKEN);

    // Verify WASM was called
    expect(mockWasmModule.umbra_wasm_sync_create_blob).toHaveBeenCalled();

    // Verify fetch was called with PUT and auth header
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toBe(
      `${TEST_RELAY}/api/sync/${encodeURIComponent(TEST_DID)}`,
    );
    expect(opts.method).toBe('PUT');
    expect(opts.headers.Authorization).toBe(`Bearer ${TEST_TOKEN}`);
    expect(opts.headers['Content-Type']).toBe('application/octet-stream');

    // Verify result
    expect(result.blob).toBe(TEST_BLOB_B64);
    expect(result.sections.preferences).toBe(1);
    expect(result.size).toBe(512);
  });

  it('T-SYNC.7 — passes section versions to WASM when provided', async () => {
    const sectionVersions = { preferences: 5, friends: 3 };

    mockWasmModule.umbra_wasm_sync_create_blob.mockReturnValue(
      JSON.stringify({
        blob: TEST_BLOB_B64,
        sections: { preferences: 6, friends: 4 },
        size: 256,
      }),
    );
    mockFetch.mockReturnValueOnce(mockFetchResponse(200, { ok: true }));

    await uploadSyncBlob(TEST_RELAY, TEST_DID, TEST_TOKEN, sectionVersions);

    const wasmInput = JSON.parse(
      mockWasmModule.umbra_wasm_sync_create_blob.mock.calls[0][0],
    );
    expect(wasmInput.section_versions).toEqual(sectionVersions);
  });

  it('T-SYNC.8 — throws SyncUploadFailed on non-OK response', async () => {
    mockWasmModule.umbra_wasm_sync_create_blob.mockReturnValue(
      JSON.stringify({ blob: TEST_BLOB_B64, sections: {}, size: 10 }),
    );
    mockFetch.mockReturnValueOnce(
      mockFetchResponse(413, 'Payload too large', false),
    );

    await expect(
      uploadSyncBlob(TEST_RELAY, TEST_DID, TEST_TOKEN),
    ).rejects.toThrow(/Sync blob upload failed/);
  });

  it('T-SYNC.9 — strips trailing slashes from relay URL', async () => {
    mockWasmModule.umbra_wasm_sync_create_blob.mockReturnValue(
      JSON.stringify({ blob: TEST_BLOB_B64, sections: {}, size: 10 }),
    );
    mockFetch.mockReturnValueOnce(mockFetchResponse(200, { ok: true }));

    await uploadSyncBlob(`${TEST_RELAY}/`, TEST_DID, TEST_TOKEN);

    const [url] = mockFetch.mock.calls[0];
    expect(url).not.toContain('//api');
    expect(url).toContain('/api/sync/');
  });
});

// ===========================================================================
// T-SYNC.10-13 — downloadSyncBlob
// ===========================================================================

describe('T-SYNC.10-13 — downloadSyncBlob', () => {
  it('T-SYNC.10 — sends GET with auth header and returns base64', async () => {
    const mockBody = 'raw-binary-data';
    mockFetch.mockReturnValueOnce(mockFetchResponse(200, mockBody));

    const result = await downloadSyncBlob(TEST_RELAY, TEST_DID, TEST_TOKEN);

    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toBe(
      `${TEST_RELAY}/api/sync/${encodeURIComponent(TEST_DID)}`,
    );
    expect(opts.method).toBe('GET');
    expect(opts.headers.Authorization).toBe(`Bearer ${TEST_TOKEN}`);
    expect(result).not.toBeNull();
    expect(typeof result).toBe('string');
  });

  it('T-SYNC.11 — returns null for 404 (no blob)', async () => {
    mockFetch.mockReturnValueOnce(mockFetchResponse(404, 'Not Found', false));

    const result = await downloadSyncBlob(TEST_RELAY, TEST_DID, TEST_TOKEN);

    expect(result).toBeNull();
  });

  it('T-SYNC.12 — throws SyncDownloadFailed on non-OK/non-404 response', async () => {
    mockFetch.mockReturnValueOnce(
      mockFetchResponse(500, 'Internal error', false),
    );

    await expect(
      downloadSyncBlob(TEST_RELAY, TEST_DID, TEST_TOKEN),
    ).rejects.toThrow(/Sync blob download failed/);
  });

  it('T-SYNC.13 — encodes DID in URL', async () => {
    const specialDid = 'did:key:z6Mk+special/chars';
    mockFetch.mockReturnValueOnce(mockFetchResponse(404, '', false));

    await downloadSyncBlob(TEST_RELAY, specialDid, TEST_TOKEN);

    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain(encodeURIComponent(specialDid));
  });
});

// ===========================================================================
// T-SYNC.14-16 — getSyncBlobMeta
// ===========================================================================

describe('T-SYNC.14-16 — getSyncBlobMeta', () => {
  it('T-SYNC.14 — returns metadata with snake_case to camelCase conversion', async () => {
    mockFetch.mockReturnValueOnce(
      mockFetchResponse(200, {
        did: TEST_DID,
        size: 2048,
        updated_at: 1700000000,
        expires_at: 1707776000,
      }),
    );

    const result = await getSyncBlobMeta(TEST_RELAY, TEST_DID, TEST_TOKEN);

    expect(result).not.toBeNull();
    expect(result!.did).toBe(TEST_DID);
    expect(result!.size).toBe(2048);
    expect(result!.updatedAt).toBe(1700000000);
    expect(result!.expiresAt).toBe(1707776000);
  });

  it('T-SYNC.15 — returns null on 404', async () => {
    mockFetch.mockReturnValueOnce(mockFetchResponse(404, '', false));

    const result = await getSyncBlobMeta(TEST_RELAY, TEST_DID, TEST_TOKEN);
    expect(result).toBeNull();
  });

  it('T-SYNC.16 — calls /meta endpoint', async () => {
    mockFetch.mockReturnValueOnce(mockFetchResponse(404, '', false));

    await getSyncBlobMeta(TEST_RELAY, TEST_DID, TEST_TOKEN);

    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('/meta');
  });
});

// ===========================================================================
// T-SYNC.17-19 — deleteSyncBlob
// ===========================================================================

describe('T-SYNC.17-19 — deleteSyncBlob', () => {
  it('T-SYNC.17 — sends DELETE with auth header and returns true', async () => {
    mockFetch.mockReturnValueOnce(mockFetchResponse(200, { ok: true }));

    const result = await deleteSyncBlob(TEST_RELAY, TEST_DID, TEST_TOKEN);

    const [url, opts] = mockFetch.mock.calls[0];
    expect(opts.method).toBe('DELETE');
    expect(opts.headers.Authorization).toBe(`Bearer ${TEST_TOKEN}`);
    expect(result).toBe(true);
  });

  it('T-SYNC.18 — returns false for 404 (nothing to delete)', async () => {
    mockFetch.mockReturnValueOnce(mockFetchResponse(404, '', false));

    const result = await deleteSyncBlob(TEST_RELAY, TEST_DID, TEST_TOKEN);
    expect(result).toBe(false);
  });

  it('T-SYNC.19 — throws SyncDeleteFailed on server error', async () => {
    mockFetch.mockReturnValueOnce(
      mockFetchResponse(500, 'Server error', false),
    );

    await expect(
      deleteSyncBlob(TEST_RELAY, TEST_DID, TEST_TOKEN),
    ).rejects.toThrow(/Sync blob delete failed/);
  });
});

// ===========================================================================
// T-SYNC.20-23 — WASM wrappers (createSyncBlob, parseSyncBlob, applySyncBlob)
// ===========================================================================

describe('T-SYNC.20-23 — WASM Wrappers', () => {
  it('T-SYNC.20 — createSyncBlob passes section versions to WASM', async () => {
    const expected = {
      blob: TEST_BLOB_B64,
      sections: { preferences: 2 },
      size: 100,
    };
    mockWasmModule.umbra_wasm_sync_create_blob.mockReturnValue(
      JSON.stringify(expected),
    );

    const result = await createSyncBlob({ preferences: 1 });

    const input = JSON.parse(
      mockWasmModule.umbra_wasm_sync_create_blob.mock.calls[0][0],
    );
    expect(input.section_versions).toEqual({ preferences: 1 });
    expect(result.blob).toBe(TEST_BLOB_B64);
    expect(result.sections.preferences).toBe(2);
  });

  it('T-SYNC.21 — parseSyncBlob passes blob to WASM and returns summary', async () => {
    const summary = {
      v: 1,
      updated_at: 1700000000,
      sections: {
        preferences: { v: 3, count: 10, updated_at: 1700000000 },
      },
    };
    mockWasmModule.umbra_wasm_sync_parse_blob.mockReturnValue(
      JSON.stringify(summary),
    );

    const result = await parseSyncBlob(TEST_BLOB_B64);

    expect(mockWasmModule.umbra_wasm_sync_parse_blob).toHaveBeenCalledWith(
      JSON.stringify({ blob: TEST_BLOB_B64 }),
    );
    expect(result.v).toBe(1);
    // Note: snake_case is converted to camelCase by parseWasm
    expect(result.updatedAt).toBe(1700000000);
  });

  it('T-SYNC.22 — applySyncBlob passes blob to WASM and returns import result', async () => {
    const importResult = {
      imported: { settings: 5, friends: 3, groups: 2, blocked_users: 0 },
    };
    mockWasmModule.umbra_wasm_sync_apply_blob.mockReturnValue(
      JSON.stringify(importResult),
    );

    const result = await applySyncBlob(TEST_BLOB_B64);

    expect(mockWasmModule.umbra_wasm_sync_apply_blob).toHaveBeenCalledWith(
      JSON.stringify({ blob: TEST_BLOB_B64 }),
    );
    expect(result.imported.settings).toBe(5);
    expect(result.imported.friends).toBe(3);
  });

  it('T-SYNC.23 — createSyncBlob with no args sends empty object', async () => {
    mockWasmModule.umbra_wasm_sync_create_blob.mockReturnValue(
      JSON.stringify({ blob: 'x', sections: {}, size: 0 }),
    );

    await createSyncBlob();

    const input = JSON.parse(
      mockWasmModule.umbra_wasm_sync_create_blob.mock.calls[0][0],
    );
    expect(input).toEqual({});
  });
});

// ===========================================================================
// T-SYNC.24-25 — Delta operations
// ===========================================================================

describe('T-SYNC.24-25 — Delta Operations', () => {
  it('T-SYNC.24 — createSyncDelta passes section name to WASM', async () => {
    mockWasmModule.umbra_wasm_sync_create_blob.mockReturnValue(
      JSON.stringify({
        section: 'friends',
        version: 5,
        encrypted_data: 'delta-data',
      }),
    );

    const result = await createSyncDelta('friends');

    const input = JSON.parse(
      mockWasmModule.umbra_wasm_sync_create_blob.mock.calls[0][0],
    );
    expect(input.sections).toEqual(['friends']);
  });

  it('T-SYNC.25 — applySyncDelta passes delta fields to WASM', async () => {
    const delta = {
      section: 'preferences',
      version: 7,
      encryptedData: 'encrypted-delta',
    };

    mockWasmModule.umbra_wasm_sync_apply_blob.mockReturnValue(
      JSON.stringify({
        applied: true,
        section: 'preferences',
        version: 7,
      }),
    );

    const result = await applySyncDelta(delta);

    const input = JSON.parse(
      mockWasmModule.umbra_wasm_sync_apply_blob.mock.calls[0][0],
    );
    expect(input.blob).toBe('encrypted-delta');
    expect(input.section).toBe('preferences');
    expect(input.version).toBe(7);
    expect(result.applied).toBe(true);
    expect(result.section).toBe('preferences');
  });
});

// ===========================================================================
// T-SYNC.26-30 — High-level convenience functions
// ===========================================================================

describe('T-SYNC.26-30 — Convenience Functions', () => {
  beforeEach(() => {
    // Common mock setup for multi-step flows
    mockWasmModule.umbra_wasm_sync_sign_challenge.mockReturnValue(
      JSON.stringify({ signature: TEST_SIGNATURE, public_key: TEST_PUBLIC_KEY }),
    );
  });

  it('T-SYNC.26 — fullSyncUpload authenticates then uploads', async () => {
    // Auth mocks
    mockFetch
      .mockReturnValueOnce(mockFetchResponse(200, { nonce: TEST_NONCE })) // challenge
      .mockReturnValueOnce(
        mockFetchResponse(200, {
          token: TEST_TOKEN,
          expires_at: 1700000000,
        }),
      ) // verify
      .mockReturnValueOnce(mockFetchResponse(200, { ok: true })); // upload PUT

    mockWasmModule.umbra_wasm_sync_create_blob.mockReturnValue(
      JSON.stringify({
        blob: TEST_BLOB_B64,
        sections: { preferences: 1 },
        size: 256,
      }),
    );

    const result = await fullSyncUpload(TEST_RELAY, TEST_DID);

    expect(result.auth.token).toBe(TEST_TOKEN);
    expect(result.result.size).toBe(256);
    expect(mockFetch).toHaveBeenCalledTimes(3); // challenge + verify + upload
  });

  it('T-SYNC.27 — fullSyncCheck authenticates, downloads, and parses', async () => {
    // Auth
    mockFetch
      .mockReturnValueOnce(mockFetchResponse(200, { nonce: TEST_NONCE }))
      .mockReturnValueOnce(
        mockFetchResponse(200, {
          token: TEST_TOKEN,
          expires_at: 1700000000,
        }),
      )
      // Download
      .mockReturnValueOnce(mockFetchResponse(200, 'binary-data'));

    mockWasmModule.umbra_wasm_sync_parse_blob.mockReturnValue(
      JSON.stringify({
        v: 1,
        updated_at: 1700000000,
        sections: { preferences: { v: 2, count: 5, updated_at: 1700000000 } },
      }),
    );

    const result = await fullSyncCheck(TEST_RELAY, TEST_DID);

    expect(result).not.toBeNull();
    expect(result!.auth.token).toBe(TEST_TOKEN);
    expect(result!.summary.v).toBe(1);
    expect(result!.blob).toBeTruthy();
  });

  it('T-SYNC.28 — fullSyncCheck returns null when no blob exists', async () => {
    mockFetch
      .mockReturnValueOnce(mockFetchResponse(200, { nonce: TEST_NONCE }))
      .mockReturnValueOnce(
        mockFetchResponse(200, {
          token: TEST_TOKEN,
          expires_at: 1700000000,
        }),
      )
      .mockReturnValueOnce(mockFetchResponse(404, '', false));

    const result = await fullSyncCheck(TEST_RELAY, TEST_DID);
    expect(result).toBeNull();
  });

  it('T-SYNC.29 — fullSyncRestore authenticates, downloads, and applies', async () => {
    mockFetch
      .mockReturnValueOnce(mockFetchResponse(200, { nonce: TEST_NONCE }))
      .mockReturnValueOnce(
        mockFetchResponse(200, {
          token: TEST_TOKEN,
          expires_at: 1700000000,
        }),
      )
      .mockReturnValueOnce(mockFetchResponse(200, 'binary'));

    mockWasmModule.umbra_wasm_sync_apply_blob.mockReturnValue(
      JSON.stringify({
        imported: { settings: 3, friends: 2, groups: 1, blocked_users: 0 },
      }),
    );

    const result = await fullSyncRestore(TEST_RELAY, TEST_DID);

    expect(result).not.toBeNull();
    expect(result!.imported.settings).toBe(3);
    expect(result!.imported.friends).toBe(2);
  });

  it('T-SYNC.30 — fullSyncRestore returns null when no blob exists', async () => {
    mockFetch
      .mockReturnValueOnce(mockFetchResponse(200, { nonce: TEST_NONCE }))
      .mockReturnValueOnce(
        mockFetchResponse(200, {
          token: TEST_TOKEN,
          expires_at: 1700000000,
        }),
      )
      .mockReturnValueOnce(mockFetchResponse(404, '', false));

    const result = await fullSyncRestore(TEST_RELAY, TEST_DID);
    expect(result).toBeNull();
  });
});
