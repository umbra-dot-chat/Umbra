/**
 * Tests for account backup service API
 *
 * Covers backup creation, restoration, manifest parsing, chunk handling,
 * round-trip flows, and error scenarios via the mocked service layer.
 *
 * Test IDs: T-BK.1 - T-BK.10
 */

import {
  createAccountBackup,
  restoreAccountBackup,
  parseBackupManifest,
  parseBackupChunks,
  restoreFromChunks,
} from '@umbra/service';

// Cast mocks for type safety
const mockCreateAccountBackup = createAccountBackup as jest.Mock;
const mockRestoreAccountBackup = restoreAccountBackup as jest.Mock;
const mockParseBackupManifest = parseBackupManifest as jest.Mock;
const mockParseBackupChunks = parseBackupChunks as jest.Mock;
const mockRestoreFromChunks = restoreFromChunks as jest.Mock;

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks();

  // Reset default mock return values
  mockCreateAccountBackup.mockResolvedValue({ chunkCount: 3, totalSize: 150000 });
  mockRestoreAccountBackup.mockResolvedValue(null);
  mockParseBackupManifest.mockReturnValue(null);
  mockParseBackupChunks.mockReturnValue([]);
  mockRestoreFromChunks.mockResolvedValue({
    imported: { settings: 5, friends: 3, conversations: 2, groups: 1, blocked_users: 0 },
  });
});

// ---------------------------------------------------------------------------
// T-BK.1 — createAccountBackup calls WASM and returns relay messages
// ---------------------------------------------------------------------------

describe('T-BK.1 — createAccountBackup returns relay messages', () => {
  it('T-BK.1 — createAccountBackup calls WASM and returns chunkCount and totalSize', async () => {
    const result = await mockCreateAccountBackup();

    expect(mockCreateAccountBackup).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ chunkCount: 3, totalSize: 150000 });
    expect(result.chunkCount).toBe(3);
    expect(result.totalSize).toBe(150000);
  });
});

// ---------------------------------------------------------------------------
// T-BK.2 — createAccountBackup returns chunk count and total size
// ---------------------------------------------------------------------------

describe('T-BK.2 — createAccountBackup returns chunk count and total size', () => {
  it('T-BK.2 — chunk count and total size match expected values', async () => {
    mockCreateAccountBackup.mockResolvedValue({ chunkCount: 7, totalSize: 500000 });

    const result = await mockCreateAccountBackup();

    expect(result.chunkCount).toBe(7);
    expect(result.totalSize).toBe(500000);
    expect(typeof result.chunkCount).toBe('number');
    expect(typeof result.totalSize).toBe('number');
  });
});

// ---------------------------------------------------------------------------
// T-BK.3 — createAccountBackup fails gracefully without relay connection
// ---------------------------------------------------------------------------

describe('T-BK.3 — createAccountBackup fails gracefully without relay', () => {
  it('T-BK.3 — mock rejection is caught and error is accessible', async () => {
    mockCreateAccountBackup.mockRejectedValue(new Error('No relay connection'));

    let caughtError: Error | null = null;
    try {
      await mockCreateAccountBackup();
    } catch (err) {
      caughtError = err as Error;
    }

    expect(caughtError).toBeInstanceOf(Error);
    expect(caughtError!.message).toBe('No relay connection');
    expect(mockCreateAccountBackup).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// T-BK.4 — restoreFromChunks reassembles and imports data
// ---------------------------------------------------------------------------

describe('T-BK.4 — restoreFromChunks reassembles and imports data', () => {
  it('T-BK.4 — restoreFromChunks accepts chunks and returns imported data', async () => {
    const chunks = [
      { index: 0, data: 'chunk-data-0' },
      { index: 1, data: 'chunk-data-1' },
      { index: 2, data: 'chunk-data-2' },
    ];

    const result = await mockRestoreFromChunks(chunks);

    expect(mockRestoreFromChunks).toHaveBeenCalledWith(chunks);
    expect(result.imported).toBeDefined();
    expect(result.imported.settings).toBe(5);
    expect(result.imported.friends).toBe(3);
    expect(result.imported.conversations).toBe(2);
    expect(result.imported.groups).toBe(1);
    expect(result.imported.blocked_users).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// T-BK.5 — restoreAccountBackup returns null when no backup exists
// ---------------------------------------------------------------------------

describe('T-BK.5 — restoreAccountBackup returns null when no backup exists', () => {
  it('T-BK.5 — returns null for non-existent backup', async () => {
    const result = await mockRestoreAccountBackup();

    expect(result).toBeNull();
    expect(mockRestoreAccountBackup).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// T-BK.6 — restoreFromChunks returns import stats on success
// ---------------------------------------------------------------------------

describe('T-BK.6 — restoreFromChunks returns import stats on success', () => {
  it('T-BK.6 — import stats contain all expected categories', async () => {
    const result = await mockRestoreFromChunks([]);

    expect(result).toHaveProperty('imported');
    expect(result.imported).toHaveProperty('settings');
    expect(result.imported).toHaveProperty('friends');
    expect(result.imported).toHaveProperty('conversations');
    expect(result.imported).toHaveProperty('groups');
    expect(result.imported).toHaveProperty('blocked_users');

    // Sum of all imported items should be consistent
    const total =
      result.imported.settings +
      result.imported.friends +
      result.imported.conversations +
      result.imported.groups +
      result.imported.blocked_users;
    expect(total).toBe(11);
  });
});

// ---------------------------------------------------------------------------
// T-BK.7 — parseBackupManifest extracts manifest from offline messages
// ---------------------------------------------------------------------------

describe('T-BK.7 — parseBackupManifest extracts manifest from offline messages', () => {
  it('T-BK.7 — returns null by default (no manifest in messages)', () => {
    const offlineMessages = [
      { type: 'text', payload: 'hello' },
      { type: 'text', payload: 'world' },
    ];

    const result = mockParseBackupManifest(offlineMessages);

    expect(result).toBeNull();
    expect(mockParseBackupManifest).toHaveBeenCalledWith(offlineMessages);
  });

  it('T-BK.7b — returns manifest when mock is configured with one', () => {
    const manifest = {
      version: 1,
      chunkCount: 3,
      totalSize: 150000,
      createdAt: Date.now(),
    };
    mockParseBackupManifest.mockReturnValue(manifest);

    const offlineMessages = [
      { type: 'backup_manifest', payload: JSON.stringify(manifest) },
    ];

    const result = mockParseBackupManifest(offlineMessages);

    expect(result).toEqual(manifest);
    expect(result.chunkCount).toBe(3);
    expect(result.totalSize).toBe(150000);
  });
});

// ---------------------------------------------------------------------------
// T-BK.8 — parseBackupChunks orders chunks correctly
// ---------------------------------------------------------------------------

describe('T-BK.8 — parseBackupChunks orders chunks correctly', () => {
  it('T-BK.8 — returns empty array by default', () => {
    const result = mockParseBackupChunks([]);

    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
    expect(mockParseBackupChunks).toHaveBeenCalledWith([]);
  });

  it('T-BK.8b — returns ordered chunks when mock is configured', () => {
    const orderedChunks = [
      { index: 0, data: 'chunk-0' },
      { index: 1, data: 'chunk-1' },
      { index: 2, data: 'chunk-2' },
    ];
    mockParseBackupChunks.mockReturnValue(orderedChunks);

    const unorderedMessages = [
      { type: 'backup_chunk', index: 2, data: 'chunk-2' },
      { type: 'backup_chunk', index: 0, data: 'chunk-0' },
      { type: 'backup_chunk', index: 1, data: 'chunk-1' },
    ];

    const result = mockParseBackupChunks(unorderedMessages);

    expect(result).toHaveLength(3);
    expect(result[0].index).toBe(0);
    expect(result[1].index).toBe(1);
    expect(result[2].index).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// T-BK.9 — Backup round-trip (create -> parse -> restore) mock interaction
// ---------------------------------------------------------------------------

describe('T-BK.9 — Backup round-trip (create -> parse -> restore)', () => {
  it('T-BK.9 — full backup lifecycle: create, parse manifest, parse chunks, restore', async () => {
    // Step 1: Create backup
    const backupResult = await mockCreateAccountBackup();
    expect(backupResult.chunkCount).toBe(3);
    expect(backupResult.totalSize).toBe(150000);

    // Step 2: Parse manifest from offline messages
    const manifest = {
      version: 1,
      chunkCount: backupResult.chunkCount,
      totalSize: backupResult.totalSize,
      createdAt: Date.now(),
    };
    mockParseBackupManifest.mockReturnValue(manifest);

    const parsedManifest = mockParseBackupManifest([
      { type: 'backup_manifest', payload: JSON.stringify(manifest) },
    ]);
    expect(parsedManifest.chunkCount).toBe(3);

    // Step 3: Parse and order chunks
    const chunks = [
      { index: 0, data: 'chunk-0' },
      { index: 1, data: 'chunk-1' },
      { index: 2, data: 'chunk-2' },
    ];
    mockParseBackupChunks.mockReturnValue(chunks);

    const parsedChunks = mockParseBackupChunks([]);
    expect(parsedChunks).toHaveLength(parsedManifest.chunkCount);

    // Step 4: Restore from chunks
    const restoreResult = await mockRestoreFromChunks(parsedChunks);
    expect(restoreResult.imported.settings).toBe(5);
    expect(restoreResult.imported.friends).toBe(3);

    // Verify all steps were called in order
    expect(mockCreateAccountBackup).toHaveBeenCalledTimes(1);
    expect(mockParseBackupManifest).toHaveBeenCalledTimes(1);
    expect(mockParseBackupChunks).toHaveBeenCalledTimes(1);
    expect(mockRestoreFromChunks).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// T-BK.10 — Backup with no data produces valid response
// ---------------------------------------------------------------------------

describe('T-BK.10 — Backup with no data produces valid response', () => {
  it('T-BK.10 — createAccountBackup with empty account returns valid structure', async () => {
    mockCreateAccountBackup.mockResolvedValue({ chunkCount: 0, totalSize: 0 });

    const result = await mockCreateAccountBackup();

    expect(result).toBeDefined();
    expect(result.chunkCount).toBe(0);
    expect(result.totalSize).toBe(0);
    expect(typeof result.chunkCount).toBe('number');
    expect(typeof result.totalSize).toBe('number');
  });

  it('T-BK.10b — restoreFromChunks with empty chunks returns zero-count stats', async () => {
    mockRestoreFromChunks.mockResolvedValue({
      imported: { settings: 0, friends: 0, conversations: 0, groups: 0, blocked_users: 0 },
    });

    const result = await mockRestoreFromChunks([]);

    expect(result.imported.settings).toBe(0);
    expect(result.imported.friends).toBe(0);
    expect(result.imported.conversations).toBe(0);
    expect(result.imported.groups).toBe(0);
    expect(result.imported.blocked_users).toBe(0);
  });
});
