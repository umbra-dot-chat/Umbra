/**
 * Integration tests for the file sharing system.
 *
 * Tests the UmbraService file-related methods:
 * - Community file CRUD
 * - DM file CRUD
 * - File chunking and reassembly
 * - File transfer lifecycle
 * - File encryption (E2EE)
 */

const { UmbraService } = require('@umbra/service');

describe('File Sharing', () => {
  let svc: typeof UmbraService.instance;

  beforeAll(async () => {
    await UmbraService.initialize();
    svc = UmbraService.instance;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Community Files ──────────────────────────────────────────────────

  describe('Community Files', () => {
    test('getCommunityFiles returns array', async () => {
      const files = await svc.getCommunityFiles('ch-1', null, 50, 0);
      expect(Array.isArray(files)).toBe(true);
    });

    test('getCommunityFile returns a file record', async () => {
      const file = await svc.getCommunityFile('file-1');
      expect(file).toBeDefined();
      expect(file.id).toBe('file-1');
      expect(file.filename).toBe('test.txt');
      expect(file.fileSize).toBeGreaterThan(0);
      expect(file.mimeType).toBe('text/plain');
      expect(file.uploadedBy).toMatch(/^did:key:/);
    });

    test('uploadCommunityFile returns new file record', async () => {
      const file = await svc.uploadCommunityFile('ch-1', null, 'upload.txt', 512, 'text/plain', '[]');
      expect(file).toBeDefined();
      expect(file.id).toBeDefined();
      expect(file.filename).toBe('upload.txt');
      expect(file.channelId).toBe('ch-1');
    });

    test('deleteCommunityFile resolves', async () => {
      await expect(svc.deleteCommunityFile('file-1')).resolves.not.toThrow();
    });

    test('getCommunityFolders returns array', async () => {
      const folders = await svc.getCommunityFolders('ch-1', null);
      expect(Array.isArray(folders)).toBe(true);
    });

    test('createCommunityFolder returns folder record', async () => {
      const folder = await svc.createCommunityFolder('ch-1', 'Documents');
      expect(folder).toBeDefined();
      expect(folder.id).toBeDefined();
      expect(folder.name).toBe('Documents');
      expect(folder.channelId).toBe('ch-1');
    });

    test('deleteCommunityFolder resolves', async () => {
      await expect(svc.deleteCommunityFolder('folder-1')).resolves.not.toThrow();
    });
  });

  // ── DM Files ─────────────────────────────────────────────────────────

  describe('DM Files', () => {
    test('getDmFiles returns array', async () => {
      const files = await svc.getDmFiles('conv-1', null, 50, 0);
      expect(Array.isArray(files)).toBe(true);
    });

    test('getDmFile returns a file record', async () => {
      const file = await svc.getDmFile('dm-file-1');
      expect(file).toBeDefined();
      expect(file.id).toBe('dm-file-1');
      expect(file.conversationId).toBe('conv-1');
      expect(file.filename).toBe('shared.txt');
    });

    test('deleteDmFile resolves', async () => {
      await expect(svc.deleteDmFile('dm-file-1')).resolves.not.toThrow();
    });

    test('createDmFolder returns folder record', async () => {
      const folder = await svc.createDmFolder('conv-1', null, 'Shared Photos', 'did:key:z6MkTest');
      expect(folder).toBeDefined();
      expect(folder.id).toBeDefined();
      expect(folder.name).toBe('Shared Photos');
      expect(folder.conversationId).toBe('conv-1');
      expect(folder.createdBy).toBe('did:key:z6MkTest');
    });

    test('getDmFolders returns array', async () => {
      const folders = await svc.getDmFolders('conv-1');
      expect(Array.isArray(folders)).toBe(true);
    });

    test('deleteDmFolder resolves', async () => {
      await expect(svc.deleteDmFolder('dm-folder-1')).resolves.not.toThrow();
    });

    test('renameDmFolder resolves', async () => {
      await expect(svc.renameDmFolder('dm-folder-1', 'New Name')).resolves.not.toThrow();
    });

    test('buildDmFileEventEnvelope returns envelope', () => {
      const envelope = svc.buildDmFileEventEnvelope('conv-1', 'did:key:z6MkTest', { type: 'fileUploaded', fileId: 'f1' });
      expect(envelope).toBeDefined();
      expect(envelope.type).toBe('dm_file_event');
      expect(envelope.conversationId).toBe('conv-1');
    });

    test('broadcastDmFileEvent resolves', async () => {
      const envelope = { type: 'dm_file_event' };
      await expect(svc.broadcastDmFileEvent(['did:key:z6MkPeer'], envelope, null)).resolves.not.toThrow();
    });
  });

  // ── File Chunking ────────────────────────────────────────────────────

  describe('File Chunking', () => {
    test('chunkFile returns manifest with chunks', async () => {
      const manifest = await svc.chunkFile('file-1', 'test.txt', 'SGVsbG8=');
      expect(manifest).toBeDefined();
      expect(manifest.fileId).toBe('file-1');
      expect(manifest.filename).toBe('test.txt');
      expect(manifest.totalSize).toBeGreaterThan(0);
      expect(manifest.totalChunks).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(manifest.chunks)).toBe(true);
      expect(manifest.chunks.length).toBeGreaterThan(0);
    });

    test('chunkFile returns valid chunk references', async () => {
      const manifest = await svc.chunkFile('file-2', 'data.bin', 'AQID');
      for (const chunk of manifest.chunks) {
        expect(chunk.chunkId).toBeDefined();
        expect(typeof chunk.index).toBe('number');
        expect(chunk.size).toBeGreaterThan(0);
        expect(chunk.hash).toBeDefined();
      }
    });

    test('reassembleFile returns base64 data', async () => {
      const result = await svc.reassembleFile('file-1');
      expect(result).toBeDefined();
      expect(result.dataB64).toBeDefined();
      expect(result.filename).toBe('test.txt');
      expect(result.fileHash).toBeDefined();
      expect(result.totalSize).toBeGreaterThan(0);
    });

    test('getFileManifest returns null for non-existent file', async () => {
      const manifest = await svc.getFileManifest('non-existent');
      expect(manifest).toBeNull();
    });
  });

  // ── File Transfer ────────────────────────────────────────────────────

  describe('File Transfer', () => {
    test('initiateTransfer returns transfer progress', async () => {
      const progress = await svc.initiateTransfer('file-1', 'did:key:z6MkPeer', '{}', 'upload', 'relay');
      expect(progress).toBeDefined();
      expect(progress.transferId).toBe('xfer-1');
      expect(progress.direction).toBe('upload');
      expect(progress.state).toBe('negotiating');
    });

    test('acceptTransfer transitions to transferring', async () => {
      const progress = await svc.acceptTransfer('xfer-1');
      expect(progress.state).toBe('transferring');
    });

    test('pauseTransfer transitions to paused', async () => {
      const progress = await svc.pauseTransfer('xfer-1');
      expect(progress.state).toBe('paused');
    });

    test('resumeTransfer transitions to transferring', async () => {
      const progress = await svc.resumeTransfer('xfer-1');
      expect(progress.state).toBe('transferring');
    });

    test('cancelTransfer transitions to cancelled', async () => {
      const progress = await svc.cancelTransfer('xfer-1');
      expect(progress.state).toBe('cancelled');
    });

    test('getTransfers returns array', async () => {
      const transfers = await svc.getTransfers();
      expect(Array.isArray(transfers)).toBe(true);
    });

    test('getIncompleteTransfers returns array', async () => {
      const transfers = await svc.getIncompleteTransfers();
      expect(Array.isArray(transfers)).toBe(true);
    });

    test('onFileTransferEvent returns unsubscribe function', () => {
      const unsub = svc.onFileTransferEvent(() => {});
      expect(typeof unsub).toBe('function');
    });
  });

  // ── File Encryption (E2EE) ───────────────────────────────────────────

  describe('File Encryption', () => {
    test('deriveFileKey returns a hex key', async () => {
      const result = await svc.deriveFileKey('did:key:z6MkPeer', 'file-uuid-1');
      expect(result).toBeDefined();
      expect(result.keyHex).toBeDefined();
      expect(result.keyHex.length).toBe(64); // 32 bytes = 64 hex chars
    });

    test('deriveFileKey is called with correct args', async () => {
      await svc.deriveFileKey('did:key:z6MkPeer', 'file-123', 'conv-ctx');
      expect(svc.deriveFileKey).toHaveBeenCalledWith('did:key:z6MkPeer', 'file-123', 'conv-ctx');
    });

    test('encryptFileChunk returns nonce and encrypted data', async () => {
      const keyHex = 'a'.repeat(64);
      const result = await svc.encryptFileChunk(keyHex, 'SGVsbG8=', 'file-1', 0);
      expect(result).toBeDefined();
      expect(result.nonceHex).toBeDefined();
      expect(result.encryptedDataB64).toBeDefined();
    });

    test('decryptFileChunk returns plaintext data', async () => {
      const keyHex = 'a'.repeat(64);
      const nonceHex = 'b'.repeat(24);
      const result = await svc.decryptFileChunk(keyHex, nonceHex, 'SGVsbG8=', 'file-1', 0);
      expect(result).toBeDefined();
      expect(result.chunkDataB64).toBeDefined();
    });

    test('encrypt-decrypt round trip preserves data', async () => {
      const keyHex = 'a'.repeat(64);
      const originalData = 'SGVsbG8gV29ybGQ='; // "Hello World" in base64

      const encrypted = await svc.encryptFileChunk(keyHex, originalData, 'file-rt', 0);
      const decrypted = await svc.decryptFileChunk(
        keyHex,
        encrypted.nonceHex,
        encrypted.encryptedDataB64,
        'file-rt',
        0,
      );

      // Mock preserves data through, so the round trip should work
      expect(decrypted.chunkDataB64).toBe(originalData);
    });
  });
});
