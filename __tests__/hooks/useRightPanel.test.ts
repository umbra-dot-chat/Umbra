/**
 * Tests for useRightPanel hook
 *
 * Covers: toggle open/close, panel switching, initial state.
 */

import { renderHook, act } from '@testing-library/react-native';
import { Animated } from 'react-native';

// Mock Animated.timing to execute instantly
jest.spyOn(Animated, 'timing').mockImplementation((value: any, config: any) => ({
  start: (callback?: any) => {
    value.setValue(config.toValue);
    if (callback) callback({ finished: true });
  },
  stop: jest.fn(),
  reset: jest.fn(),
}));

import { useRightPanel } from '@/hooks/useRightPanel';

describe('useRightPanel', () => {
  it('starts with no panel open', () => {
    const { result } = renderHook(() => useRightPanel());
    expect(result.current.rightPanel).toBeNull();
    expect(result.current.visiblePanel).toBeNull();
  });

  it('togglePanel opens a panel', () => {
    const { result } = renderHook(() => useRightPanel());

    act(() => {
      result.current.togglePanel('members');
    });

    expect(result.current.rightPanel).toBe('members');
    expect(result.current.visiblePanel).toBe('members');
  });

  it('togglePanel closes same panel', () => {
    const { result } = renderHook(() => useRightPanel());

    act(() => {
      result.current.togglePanel('members');
    });
    expect(result.current.rightPanel).toBe('members');

    act(() => {
      result.current.togglePanel('members');
    });
    expect(result.current.rightPanel).toBeNull();
    expect(result.current.visiblePanel).toBeNull();
  });

  it('togglePanel switches between panels', () => {
    const { result } = renderHook(() => useRightPanel());

    act(() => {
      result.current.togglePanel('members');
    });
    expect(result.current.rightPanel).toBe('members');

    act(() => {
      result.current.togglePanel('pins');
    });
    expect(result.current.rightPanel).toBe('pins');
    expect(result.current.visiblePanel).toBe('pins');
  });
});
