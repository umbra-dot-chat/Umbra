import { renderHook, act } from '@testing-library/react-native';
import { Animated } from 'react-native';
import { useRightPanel } from '@/hooks/useRightPanel';

// Mock Animated.timing to call callbacks synchronously
jest.spyOn(Animated, 'timing').mockImplementation((value, config) => ({
  start: (callback?: (result: { finished: boolean }) => void) => {
    (value as any).setValue(config.toValue);
    callback?.({ finished: true });
  },
  stop: jest.fn(),
  reset: jest.fn(),
}));

describe('useRightPanel', () => {
  test('initial state is null for both panel states', () => {
    const { result } = renderHook(() => useRightPanel());
    expect(result.current.rightPanel).toBeNull();
    expect(result.current.visiblePanel).toBeNull();
  });

  test('opening a panel sets both rightPanel and visiblePanel', () => {
    const { result } = renderHook(() => useRightPanel());
    act(() => {
      result.current.togglePanel('members');
    });
    expect(result.current.rightPanel).toBe('members');
    expect(result.current.visiblePanel).toBe('members');
  });

  test('closing same panel resets to null', () => {
    const { result } = renderHook(() => useRightPanel());
    act(() => {
      result.current.togglePanel('members');
    });
    act(() => {
      result.current.togglePanel('members');
    });
    expect(result.current.rightPanel).toBeNull();
    expect(result.current.visiblePanel).toBeNull();
  });

  test('switching panels updates to new panel', () => {
    const { result } = renderHook(() => useRightPanel());
    act(() => {
      result.current.togglePanel('members');
    });
    expect(result.current.visiblePanel).toBe('members');

    act(() => {
      result.current.togglePanel('pins');
    });
    expect(result.current.rightPanel).toBe('pins');
    expect(result.current.visiblePanel).toBe('pins');
  });

  test('search panel can be opened', () => {
    const { result } = renderHook(() => useRightPanel());
    act(() => {
      result.current.togglePanel('search');
    });
    expect(result.current.rightPanel).toBe('search');
    expect(result.current.visiblePanel).toBe('search');
  });

  test('panelWidth is an Animated.Value', () => {
    const { result } = renderHook(() => useRightPanel());
    expect(result.current.panelWidth).toBeInstanceOf(Animated.Value);
  });
});
