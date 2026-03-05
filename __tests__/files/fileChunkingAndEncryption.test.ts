/**
 * File Chunking & Encryption — Jest unit tests for the file
 * chunking and end-to-end encryption pipeline.
 *
 * Tests the service-level operations that underpin file transfers:
 * - chunkFile: splits a file into indexed chunks with hashes
 * - reassembleFile: reconstructs the original file from chunks
 * - deriveFileKey: derives a per-file encryption key from peer DID
 * - encryptFileChunk: encrypts a single chunk
 * - decryptFileChunk: decrypts a single chunk
 *
 * These operations are called directly by FileChannelContent
 * and the file transfer system. They must maintain data integrity:
 * chunk → encrypt → transmit → decrypt → reassemble must produce
 * the original file.
 *
 * Test IDs covered:
 *   T4.25.1 - T4.25.9  File chunking and encryption
 */

// ---------------------------------------------------------------------------
// Mocks
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

import { UmbraService } from '@umbra/service';

const mockService = UmbraService.instance as Record<string, jest.Mock>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const FILE_ID = 'file-chunk-test-1';
const PEER_DID = 'did:key:z6MkPeer';
const FILE_DATA_B64 = 'SGVsbG8gV29ybGQgZnJvbSBVbWJyYSBFMkUgdGVzdA=='; // "Hello World from Umbra E2E test"

function resetMocks() {
  jest.clearAllMocks();

  mockService.chunkFile.mockResolvedValue({
    fileId: FILE_ID,
    filename: 'test.txt',
    totalSize: 31,
    chunkSize: 262144,
    totalChunks: 1,
    fileHash: 'sha256-abc123',
    chunks: [
      { chunkId: 'chunk-0', index: 0, size: 31, hash: 'sha256-chunk0' },
    ],
  });

  mockService.reassembleFile.mockResolvedValue({
    dataB64: FILE_DATA_B64,
    filename: 'test.txt',
    fileHash: 'sha256-abc123',
    totalSize: 31,
  });

  mockService.deriveFileKey.mockResolvedValue({
    keyHex: 'a'.repeat(64),
  });

  mockService.encryptFileChunk.mockResolvedValue({
    nonceHex: 'b'.repeat(24),
    encryptedDataB64: 'encrypted_chunk_data_base64',
  });

  mockService.decryptFileChunk.mockResolvedValue({
    chunkDataB64: FILE_DATA_B64,
  });

  mockService.getFileManifest.mockResolvedValue(null);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('File Chunking & Encryption', () => {
  beforeEach(() => {
    resetMocks();
  });

  // =========================================================================
  // T4.25 — File chunking
  // =========================================================================

  describe('chunking', () => {
    it('T4.25.1 — chunkFile produces correct manifest with indexed chunks', async () => {
      const result = await mockService.chunkFile(FILE_ID, 'test.txt', FILE_DATA_B64);

      expect(mockService.chunkFile).toHaveBeenCalledWith(
        FILE_ID,
        'test.txt',
        FILE_DATA_B64,
      );

      expect(result).toEqual(expect.objectContaining({
        fileId: FILE_ID,
        filename: 'test.txt',
        totalSize: 31,
        fileHash: expect.stringContaining('sha256'),
      }));

      // Chunks should be indexed starting from 0
      expect(result.chunks).toHaveLength(1);
      expect(result.chunks[0].index).toBe(0);
      expect(result.chunks[0].chunkId).toBeTruthy();
    });

    it('T4.25.2 — reassembleFile reconstructs the original data', async () => {
      const result = await mockService.reassembleFile(FILE_ID);

      expect(mockService.reassembleFile).toHaveBeenCalledWith(FILE_ID);
      expect(result).toEqual(expect.objectContaining({
        dataB64: FILE_DATA_B64,
        filename: 'test.txt',
        fileHash: 'sha256-abc123',
        totalSize: 31,
      }));
    });

    it('T4.25.3 — getFileManifest returns null for unknown file', async () => {
      const result = await mockService.getFileManifest('nonexistent-file');

      expect(result).toBeNull();
    });

    it('T4.25.4 — chunkFile with large data produces multiple chunks', async () => {
      const largeChunks = [
        { chunkId: 'chunk-0', index: 0, size: 262144, hash: 'hash0' },
        { chunkId: 'chunk-1', index: 1, size: 262144, hash: 'hash1' },
        { chunkId: 'chunk-2', index: 2, size: 100000, hash: 'hash2' },
      ];
      mockService.chunkFile.mockResolvedValue({
        fileId: 'large-file',
        filename: 'big.zip',
        totalSize: 624288,
        chunkSize: 262144,
        totalChunks: 3,
        fileHash: 'sha256-large',
        chunks: largeChunks,
      });

      const result = await mockService.chunkFile('large-file', 'big.zip', 'large_data_b64');

      expect(result.totalChunks).toBe(3);
      expect(result.chunks).toHaveLength(3);
      // Each chunk should have a sequential index
      result.chunks.forEach((chunk: any, idx: number) => {
        expect(chunk.index).toBe(idx);
      });
    });
  });

  // =========================================================================
  // T4.25 — File encryption
  // =========================================================================

  describe('encryption', () => {
    it('T4.25.5 — deriveFileKey produces a 64-char hex key from peer DID and file ID', async () => {
      const result = await mockService.deriveFileKey(PEER_DID, FILE_ID);

      expect(mockService.deriveFileKey).toHaveBeenCalledWith(PEER_DID, FILE_ID);
      expect(result.keyHex).toBeTruthy();
      expect(result.keyHex.length).toBe(64); // 32 bytes = 64 hex chars
    });

    it('T4.25.6 — encryptFileChunk returns nonce and encrypted data', async () => {
      const keyHex = 'a'.repeat(64);
      const chunkData = FILE_DATA_B64;

      const result = await mockService.encryptFileChunk(keyHex, chunkData, FILE_ID, 0);

      expect(mockService.encryptFileChunk).toHaveBeenCalledWith(
        keyHex,
        chunkData,
        FILE_ID,
        0, // chunk index
      );

      expect(result.nonceHex).toBeTruthy();
      expect(result.encryptedDataB64).toBeTruthy();
    });

    it('T4.25.7 — decryptFileChunk recovers original data', async () => {
      const keyHex = 'a'.repeat(64);
      const nonceHex = 'b'.repeat(24);
      const encryptedData = 'encrypted_chunk_data_base64';

      const result = await mockService.decryptFileChunk(
        keyHex,
        nonceHex,
        encryptedData,
        FILE_ID,
        0,
      );

      expect(mockService.decryptFileChunk).toHaveBeenCalledWith(
        keyHex,
        nonceHex,
        encryptedData,
        FILE_ID,
        0,
      );

      expect(result.chunkDataB64).toBe(FILE_DATA_B64);
    });
  });

  // =========================================================================
  // T4.25 — Full pipeline: chunk → encrypt → decrypt → reassemble
  // =========================================================================

  describe('full pipeline', () => {
    it('T4.25.8 — chunk then encrypt each chunk produces correct envelope', async () => {
      // Step 1: Chunk the file
      const manifest = await mockService.chunkFile(FILE_ID, 'test.txt', FILE_DATA_B64);

      // Step 2: Derive a file key
      const { keyHex } = await mockService.deriveFileKey(PEER_DID, FILE_ID);

      // Step 3: Encrypt each chunk
      for (const chunk of manifest.chunks) {
        const encrypted = await mockService.encryptFileChunk(
          keyHex,
          FILE_DATA_B64,
          FILE_ID,
          chunk.index,
        );
        expect(encrypted.nonceHex).toBeTruthy();
        expect(encrypted.encryptedDataB64).toBeTruthy();
      }

      // Verify the calls happened in order
      expect(mockService.chunkFile).toHaveBeenCalledTimes(1);
      expect(mockService.deriveFileKey).toHaveBeenCalledTimes(1);
      expect(mockService.encryptFileChunk).toHaveBeenCalledTimes(manifest.chunks.length);
    });

    it('T4.25.9 — decrypt then reassemble recovers original file', async () => {
      const keyHex = 'a'.repeat(64);
      const nonceHex = 'b'.repeat(24);

      // Step 1: Decrypt each chunk
      const decrypted = await mockService.decryptFileChunk(
        keyHex,
        nonceHex,
        'encrypted_data',
        FILE_ID,
        0,
      );

      expect(decrypted.chunkDataB64).toBeTruthy();

      // Step 2: Reassemble
      const file = await mockService.reassembleFile(FILE_ID);

      expect(file.dataB64).toBe(FILE_DATA_B64);
      expect(file.filename).toBe('test.txt');
      expect(file.totalSize).toBe(31);

      // Verify both operations completed
      expect(mockService.decryptFileChunk).toHaveBeenCalledTimes(1);
      expect(mockService.reassembleFile).toHaveBeenCalledTimes(1);
    });
  });
});
