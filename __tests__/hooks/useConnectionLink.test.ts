/**
 * Tests for useConnectionLink hook
 *
 * Covers: initial state, fetch connection info, parse link, error handling.
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockGetConnectionInfo = jest.fn();
const mockParseConnectionInfo = jest.fn();

jest.mock('@/contexts/UmbraContext', () => ({
  useUmbra: () => ({
    service: {
      getConnectionInfo: mockGetConnectionInfo,
      parseConnectionInfo: mockParseConnectionInfo,
    },
    isReady: true,
  }),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    identity: { did: 'did:key:z6MkTest', displayName: 'TestUser' },
  }),
}));

import { useConnectionLink } from '@/hooks/useConnectionLink';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useConnectionLink', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetConnectionInfo.mockResolvedValue(null);
  });

  it('fetches connection info on mount', async () => {
    const mockInfo = {
      did: 'did:key:z6MkTest',
      link: 'umbra://connect/abc123',
    };
    mockGetConnectionInfo.mockResolvedValue(mockInfo);

    const { result } = renderHook(() => useConnectionLink());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.myDid).toBe('did:key:z6MkTest');
    expect(result.current.myLink).toBe('umbra://connect/abc123');
    expect(result.current.error).toBeNull();
  });

  it('handles fetch error', async () => {
    mockGetConnectionInfo.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useConnectionLink());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Network error');
  });

  it('parseLink returns parsed info on success', async () => {
    const parsedInfo = { did: 'did:key:z6MkOther', peerId: 'peer-123' };
    mockParseConnectionInfo.mockResolvedValue(parsedInfo);

    const { result } = renderHook(() => useConnectionLink());

    // Wait for initial fetch to complete
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let parseResult: any;
    await act(async () => {
      parseResult = await result.current.parseLink('umbra://connect/xyz');
    });

    expect(parseResult.success).toBe(true);
    expect(parseResult.connectionInfo).toEqual(parsedInfo);
  });

  it('parseLink returns error for empty input', async () => {
    const { result } = renderHook(() => useConnectionLink());

    // Wait for initial fetch to complete
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let parseResult: any;
    await act(async () => {
      parseResult = await result.current.parseLink('   ');
    });

    expect(parseResult.success).toBe(false);
    expect(parseResult.error).toBe('Empty input');
  });
});
