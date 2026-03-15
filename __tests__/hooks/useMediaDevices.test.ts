/**
 * Tests for useMediaDevices hook
 *
 * Covers: device enumeration, permission request, device change events.
 *
 * Note: The hook's `isMobile` const is captured at module load time from
 * Platform.OS. In jest-expo (Platform.OS = 'ios'), it always resolves to
 * the mobile path. We test the mobile behavior here which is the actual
 * runtime behavior in this test environment.
 *
 * @jest-environment jsdom
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';

import { useMediaDevices } from '@/hooks/useMediaDevices';

// ---------------------------------------------------------------------------
// Tests — Mobile path (Platform.OS defaults to 'ios' in jest-expo)
// ---------------------------------------------------------------------------

describe('useMediaDevices', () => {
  it('provides default mobile devices', () => {
    const { result } = renderHook(() => useMediaDevices());

    // Mobile defaults: 1 mic + 2 cameras
    expect(result.current.audioInputs.length).toBe(1);
    expect(result.current.audioInputs[0].label).toBe('Default Microphone');
    expect(result.current.videoInputs.length).toBe(2);
    expect(result.current.videoInputs[0].label).toBe('Front Camera');
    expect(result.current.videoInputs[1].label).toBe('Back Camera');
    expect(result.current.isSupported).toBe(true);
  });

  it('refresh on mobile re-sets default devices', async () => {
    const { result } = renderHook(() => useMediaDevices());

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.audioInputs.length).toBe(1);
    expect(result.current.videoInputs.length).toBe(2);
  });

  it('requestPermission on mobile returns true optimistically', async () => {
    const { result } = renderHook(() => useMediaDevices());

    let granted: boolean;
    await act(async () => {
      granted = await result.current.requestPermission(true);
    });

    expect(granted!).toBe(true);
  });

  it('audioOutputs is empty on mobile', () => {
    const { result } = renderHook(() => useMediaDevices());
    expect(result.current.audioOutputs).toEqual([]);
  });

  it('deviceChanged starts as false', () => {
    const { result } = renderHook(() => useMediaDevices());
    expect(result.current.deviceChanged).toBe(false);
  });
});
