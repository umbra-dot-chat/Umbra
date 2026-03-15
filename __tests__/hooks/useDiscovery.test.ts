/**
 * Tests for useDiscovery hook
 *
 * Covers: lookupPeer, getConnectionInfo, error state, no-service handling.
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockLookupPeer = jest.fn();
const mockGetConnectionInfo = jest.fn();
const mockParseConnectionInfo = jest.fn();
const mockConnectDirect = jest.fn();

jest.mock('@/contexts/UmbraContext', () => ({
  useUmbra: () => ({
    service: {
      lookupPeer: mockLookupPeer,
      getConnectionInfo: mockGetConnectionInfo,
      parseConnectionInfo: mockParseConnectionInfo,
      connectDirect: mockConnectDirect,
    },
  }),
}));

import { useDiscovery } from '@/hooks/useDiscovery';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useDiscovery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('starts with null connection info', () => {
    const { result } = renderHook(() => useDiscovery());
    expect(result.current.connectionInfo).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('lookupPeer returns discovery result', async () => {
    mockLookupPeer.mockResolvedValue({ status: 'found', addresses: ['addr1'] });

    const { result } = renderHook(() => useDiscovery());

    let lookupResult: any;
    await act(async () => {
      lookupResult = await result.current.lookupPeer('did:key:z6MkAlice');
    });

    expect(lookupResult.status).toBe('found');
    expect(result.current.isLoading).toBe(false);
  });

  it('lookupPeer handles errors gracefully', async () => {
    mockLookupPeer.mockRejectedValue(new Error('Lookup failed'));

    const { result } = renderHook(() => useDiscovery());

    let lookupResult: any;
    await act(async () => {
      lookupResult = await result.current.lookupPeer('did:key:z6MkBad');
    });

    expect(lookupResult.status).toBe('notFound');
    expect(result.current.error?.message).toBe('Lookup failed');
  });

  it('getConnectionInfo fetches and caches info', async () => {
    const info = { did: 'did:key:z6MkSelf', link: 'umbra://abc' };
    mockGetConnectionInfo.mockResolvedValue(info);

    const { result } = renderHook(() => useDiscovery());

    let fetchedInfo: any;
    await act(async () => {
      fetchedInfo = await result.current.getConnectionInfo();
    });

    expect(fetchedInfo).toEqual(info);
    expect(result.current.connectionInfo).toEqual(info);
  });
});
