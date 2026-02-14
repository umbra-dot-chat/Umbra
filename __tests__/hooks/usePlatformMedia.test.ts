import { renderHook } from '@testing-library/react-native';
import { usePlatformMedia } from '@/hooks/usePlatformMedia';

jest.mock('react-native', () => ({
  Platform: { OS: 'web' },
}));

const mockGetUserMedia = jest.fn().mockResolvedValue({ getTracks: () => [] });
const mockGetDisplayMedia = jest.fn().mockResolvedValue({ getTracks: () => [] });
const mockEnumerateDevices = jest.fn().mockResolvedValue([]);

Object.defineProperty(global, 'navigator', {
  value: {
    mediaDevices: {
      getUserMedia: mockGetUserMedia,
      getDisplayMedia: mockGetDisplayMedia,
      enumerateDevices: mockEnumerateDevices,
    },
  },
  writable: true,
});

describe('usePlatformMedia', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('isSupported is true on web', () => {
    const { result } = renderHook(() => usePlatformMedia());

    expect(result.current.isSupported).toBe(true);
  });

  it('getUserMedia delegates to navigator', async () => {
    const { result } = renderHook(() => usePlatformMedia());

    await result.current.getUserMedia({ audio: true });

    expect(mockGetUserMedia).toHaveBeenCalledWith({ audio: true });
  });

  it('getDisplayMedia delegates to navigator', async () => {
    const { result } = renderHook(() => usePlatformMedia());

    await result.current.getDisplayMedia();

    expect(mockGetDisplayMedia).toHaveBeenCalled();
  });

  it('enumerateDevices delegates to navigator', async () => {
    const { result } = renderHook(() => usePlatformMedia());

    await result.current.enumerateDevices();

    expect(mockEnumerateDevices).toHaveBeenCalled();
  });
});
