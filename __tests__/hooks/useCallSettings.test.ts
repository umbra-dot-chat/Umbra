import { renderHook, act } from '@testing-library/react-native';
import { useCallSettings } from '@/hooks/useCallSettings';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] ?? null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('useCallSettings', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  it('returns default values', () => {
    const { result } = renderHook(() => useCallSettings());

    expect(result.current.incomingCallDisplay).toBe('fullscreen');
    expect(result.current.ringVolume).toBe(80);
    expect(result.current.defaultVideoQuality).toBe('auto');
    expect(result.current.defaultAudioQuality).toBe('opus-voice');
  });

  it('persists incomingCallDisplay to localStorage', () => {
    const { result } = renderHook(() => useCallSettings());

    act(() => {
      result.current.setIncomingCallDisplay('toast');
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'umbra_call_incoming_display',
      JSON.stringify('toast')
    );
  });

  it('persists ringVolume to localStorage', () => {
    const { result } = renderHook(() => useCallSettings());

    act(() => {
      result.current.setRingVolume(50);
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'umbra_call_ring_volume',
      JSON.stringify(50)
    );
  });

  it('clamps ring volume to 0-100', () => {
    const { result } = renderHook(() => useCallSettings());

    act(() => {
      result.current.setRingVolume(150);
    });

    expect(result.current.ringVolume).toBe(100);

    act(() => {
      result.current.setRingVolume(-10);
    });

    expect(result.current.ringVolume).toBe(0);
  });

  it('persists defaultVideoQuality', () => {
    const { result } = renderHook(() => useCallSettings());

    act(() => {
      result.current.setDefaultVideoQuality('1080p');
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'umbra_call_default_video_quality',
      JSON.stringify('1080p')
    );
  });

  it('persists defaultAudioQuality', () => {
    const { result } = renderHook(() => useCallSettings());

    act(() => {
      result.current.setDefaultAudioQuality('pcm');
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'umbra_call_default_audio_quality',
      JSON.stringify('pcm')
    );
  });

  it('reads stored values on mount', () => {
    // Pre-populate localStorage with JSON-stringified values
    localStorageMock.setItem('umbra_call_incoming_display', JSON.stringify('toast'));
    localStorageMock.setItem('umbra_call_ring_volume', JSON.stringify(60));
    localStorageMock.setItem('umbra_call_default_video_quality', JSON.stringify('720p'));
    localStorageMock.setItem('umbra_call_default_audio_quality', JSON.stringify('pcm'));

    const { result } = renderHook(() => useCallSettings());

    expect(result.current.incomingCallDisplay).toBe('toast');
    expect(result.current.ringVolume).toBe(60);
    expect(result.current.defaultVideoQuality).toBe('720p');
    expect(result.current.defaultAudioQuality).toBe('pcm');
  });
});
