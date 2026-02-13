import { renderHook, act } from '@testing-library/react-native';
import { useHoverMessage } from '@/hooks/useHoverMessage';

describe('useHoverMessage', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('initial state is null', () => {
    const { result } = renderHook(() => useHoverMessage());
    expect(result.current.hoveredMessage).toBeNull();
  });

  test('handleHoverIn sets the hovered message', () => {
    const { result } = renderHook(() => useHoverMessage());
    act(() => {
      result.current.handleHoverIn('msg-1');
    });
    expect(result.current.hoveredMessage).toBe('msg-1');
  });

  test('handleHoverOut clears after delay', () => {
    const { result } = renderHook(() => useHoverMessage(100));
    act(() => {
      result.current.handleHoverIn('msg-1');
    });
    expect(result.current.hoveredMessage).toBe('msg-1');

    act(() => {
      result.current.handleHoverOut();
    });
    // Still showing during the delay
    expect(result.current.hoveredMessage).toBe('msg-1');

    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(result.current.hoveredMessage).toBeNull();
  });

  test('rapid hover-in cancels pending hover-out', () => {
    const { result } = renderHook(() => useHoverMessage(150));
    act(() => {
      result.current.handleHoverIn('msg-1');
    });

    act(() => {
      result.current.handleHoverOut();
    });

    // Hover back in before timeout fires
    act(() => {
      jest.advanceTimersByTime(50);
      result.current.handleHoverIn('msg-1');
    });

    // After original delay would have expired
    act(() => {
      jest.advanceTimersByTime(200);
    });
    expect(result.current.hoveredMessage).toBe('msg-1');
  });

  test('hover-in on different message replaces current', () => {
    const { result } = renderHook(() => useHoverMessage());
    act(() => {
      result.current.handleHoverIn('msg-1');
    });
    expect(result.current.hoveredMessage).toBe('msg-1');

    act(() => {
      result.current.handleHoverIn('msg-2');
    });
    expect(result.current.hoveredMessage).toBe('msg-2');
  });

  test('uses default 150ms delay', () => {
    const { result } = renderHook(() => useHoverMessage());
    act(() => {
      result.current.handleHoverIn('msg-1');
    });
    act(() => {
      result.current.handleHoverOut();
    });

    act(() => {
      jest.advanceTimersByTime(149);
    });
    expect(result.current.hoveredMessage).toBe('msg-1');

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current.hoveredMessage).toBeNull();
  });
});
