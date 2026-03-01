/**
 * useDmFiles — Jest unit tests for DM shared file operations.
 *
 * Test IDs covered:
 *   T4.22.1  - T4.22.10  DM files CRUD, events, filters
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

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

import { UmbraService } from '@umbra/service';
import { useDmFiles } from '@/hooks/useDmFiles';

const mockService = UmbraService.instance as Record<string, jest.Mock>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CONV_ID = 'conv-1';

const makeFile = (overrides: Record<string, unknown> = {}) => ({
  id: 'file-1',
  conversationId: CONV_ID,
  folderId: null,
  filename: 'photo.png',
  description: null,
  fileSize: 4096,
  mimeType: 'image/png',
  uploadedBy: 'did:key:z6MkTest',
  version: 1,
  downloadCount: 0,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  storageChunksJson: '[]',
  ...overrides,
});

function resetMocks() {
  jest.clearAllMocks();
  mockService.getDmFiles.mockResolvedValue([]);
  mockService.uploadDmFile.mockImplementation(
    (_convId: string, _folderId: any, filename: string) =>
      Promise.resolve(makeFile({ id: `dm-file-${Date.now()}`, filename })),
  );
  mockService.deleteDmFile.mockResolvedValue(undefined);
  mockService.moveDmFile.mockResolvedValue(undefined);
  mockService.recordDmFileDownload.mockResolvedValue(undefined);
  mockService.onDmFileEvent.mockReturnValue(jest.fn());
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useDmFiles', () => {
  beforeEach(() => {
    resetMocks();
  });

  // =========================================================================
  // T4.22 — DM file operations
  // =========================================================================

  it('T4.22.1 — Hook loads DM files on mount', async () => {
    const file1 = makeFile();
    const file2 = makeFile({ id: 'file-2', filename: 'doc.pdf', mimeType: 'application/pdf' });
    mockService.getDmFiles.mockResolvedValue([file1, file2]);

    const { result } = renderHook(() => useDmFiles(CONV_ID));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockService.getDmFiles).toHaveBeenCalledWith(CONV_ID, null, 100, 0);
    expect(result.current.files).toHaveLength(2);
    expect(result.current.files[0].id).toBe('file-1');
    expect(result.current.files[1].id).toBe('file-2');
  });

  it('T4.22.2 — uploadFile calls service.uploadDmFile with correct args', async () => {
    const { result } = renderHook(() => useDmFiles(CONV_ID));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.uploadFile(
        'report.pdf',    // filename
        8192,            // fileSize
        'application/pdf', // mimeType
        '["chunk-1"]',   // storageChunksJson
        'Quarterly report', // description
      );
    });

    expect(mockService.uploadDmFile).toHaveBeenCalledWith(
      CONV_ID,
      null,                // folderId (flat list)
      'report.pdf',        // filename
      'Quarterly report',  // description
      8192,                // fileSize
      'application/pdf',   // mimeType
      '["chunk-1"]',       // storageChunksJson
      'did:key:z6MkTest',  // identity.did
    );
  });

  it('T4.22.3 — deleteFile calls service.deleteDmFile and removes from list', async () => {
    const file1 = makeFile();
    mockService.getDmFiles.mockResolvedValue([file1]);

    const { result } = renderHook(() => useDmFiles(CONV_ID));
    await waitFor(() => expect(result.current.files).toHaveLength(1));

    await act(async () => {
      await result.current.deleteFile('file-1');
    });

    expect(mockService.deleteDmFile).toHaveBeenCalledWith('file-1', 'did:key:z6MkTest');
    expect(result.current.files).toHaveLength(0);
  });

  it('T4.22.4 — recordDownload increments download count optimistically', async () => {
    const file1 = makeFile({ downloadCount: 0 });
    mockService.getDmFiles.mockResolvedValue([file1]);

    const { result } = renderHook(() => useDmFiles(CONV_ID));
    await waitFor(() => expect(result.current.files).toHaveLength(1));

    await act(async () => {
      await result.current.recordDownload('file-1');
    });

    expect(mockService.recordDmFileDownload).toHaveBeenCalledWith('file-1');
    expect(result.current.files[0].downloadCount).toBe(1);
  });

  it('T4.22.5 — Real-time fileUploaded event adds new file to list', async () => {
    let eventCallback: ((event: any) => void) | null = null;
    mockService.onDmFileEvent.mockImplementation((cb: any) => {
      eventCallback = cb;
      return jest.fn();
    });

    const { result } = renderHook(() => useDmFiles(CONV_ID));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const newFile = makeFile({ id: 'file-rt-1', filename: 'realtime.png' });

    await act(async () => {
      eventCallback?.({
        conversationId: CONV_ID,
        event: { type: 'fileUploaded', file: newFile },
      });
    });

    expect(result.current.files).toHaveLength(1);
    expect(result.current.files[0].id).toBe('file-rt-1');
  });

  it('T4.22.6 — Real-time fileDeleted event removes file from list', async () => {
    const file1 = makeFile();
    mockService.getDmFiles.mockResolvedValue([file1]);

    let eventCallback: ((event: any) => void) | null = null;
    mockService.onDmFileEvent.mockImplementation((cb: any) => {
      eventCallback = cb;
      return jest.fn();
    });

    const { result } = renderHook(() => useDmFiles(CONV_ID));
    await waitFor(() => expect(result.current.files).toHaveLength(1));

    await act(async () => {
      eventCallback?.({
        conversationId: CONV_ID,
        event: { type: 'fileDeleted', fileId: 'file-1' },
      });
    });

    expect(result.current.files).toHaveLength(0);
  });

  it('T4.22.7 — moveFile calls service.moveDmFile with correct args', async () => {
    const { result } = renderHook(() => useDmFiles(CONV_ID));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.moveFile('file-1', 'folder-abc');
    });

    expect(mockService.moveDmFile).toHaveBeenCalledWith('file-1', 'folder-abc');
  });

  it('T4.22.8 — Error state set when upload fails', async () => {
    mockService.uploadDmFile.mockRejectedValue(new Error('Upload failed'));

    const { result } = renderHook(() => useDmFiles(CONV_ID));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.uploadFile('bad.txt', 100, 'text/plain', '[]');
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.error?.message).toBe('Upload failed');
  });

  it('T4.22.9 — Hook does nothing when conversationId is null', async () => {
    const { result } = renderHook(() => useDmFiles(null));

    // Wait a tick
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(mockService.getDmFiles).not.toHaveBeenCalled();
    expect(result.current.files).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('T4.22.10 — Duplicate fileUploaded event does not add file twice (dedup guard)', async () => {
    let eventCallback: ((event: any) => void) | null = null;
    mockService.onDmFileEvent.mockImplementation((cb: any) => {
      eventCallback = cb;
      return jest.fn();
    });

    const existingFile = makeFile({ id: 'file-dup-1', filename: 'dup.png' });
    mockService.getDmFiles.mockResolvedValue([existingFile]);

    const { result } = renderHook(() => useDmFiles(CONV_ID));
    await waitFor(() => expect(result.current.files).toHaveLength(1));

    // Fire a fileUploaded event with the same file ID that already exists
    await act(async () => {
      eventCallback?.({
        conversationId: CONV_ID,
        event: { type: 'fileUploaded', file: existingFile },
      });
    });

    // Should still have exactly 1 file, not 2
    expect(result.current.files).toHaveLength(1);
    expect(result.current.files[0].id).toBe('file-dup-1');
  });

  it('T4.22.11 — Filter by type works (images filter)', async () => {
    const imageFile = makeFile({ id: 'img-1', filename: 'photo.png', mimeType: 'image/png' });
    const pdfFile = makeFile({ id: 'pdf-1', filename: 'doc.pdf', mimeType: 'application/pdf' });
    const videoFile = makeFile({ id: 'vid-1', filename: 'clip.mp4', mimeType: 'video/mp4' });
    const jpegFile = makeFile({ id: 'img-2', filename: 'shot.jpg', mimeType: 'image/jpeg' });

    mockService.getDmFiles.mockResolvedValue([imageFile, pdfFile, videoFile, jpegFile]);

    const { result } = renderHook(() => useDmFiles(CONV_ID));
    await waitFor(() => expect(result.current.files).toHaveLength(4));

    // Switch to images filter
    act(() => {
      result.current.setFilter('images');
    });

    expect(result.current.files).toHaveLength(2);
    expect(result.current.files.every((f) => f.mimeType?.startsWith('image/'))).toBe(true);
    expect(result.current.files.map((f) => f.id)).toEqual(
      expect.arrayContaining(['img-1', 'img-2']),
    );
  });
});
