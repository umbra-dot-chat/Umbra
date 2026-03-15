/**
 * Tests for useHoverMessage hook
 *
 * Covers: hover in sets message, hover out clears with delay, rapid hover resets timeout.
 */

import { renderHook, act } from '@testing-library/react-native';
import { useHoverMessage } from '@/hooks/useHoverMessage';

describe('useHoverMessage', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('starts with no hovered message', () => {
    const { result } = renderHook(() => useHoverMessage());
    expect(result.current.hoveredMessage).toBeNull();
  });

  it('handleHoverIn sets the hovered message immediately', () => {
    const { result } = renderHook(() => useHoverMessage());

    act(() => {
      result.current.handleHoverIn('msg-1');
    });

    expect(result.current.hoveredMessage).toBe('msg-1');
  });

  it('handleHoverOut clears the message after delay', () => {
    const { result } = renderHook(() => useHoverMessage(200));

    act(() => {
      result.current.handleHoverIn('msg-1');
    });
    expect(result.current.hoveredMessage).toBe('msg-1');

    act(() => {
      result.current.handleHoverOut();
    });
    // Not cleared yet
    expect(result.current.hoveredMessage).toBe('msg-1');

    act(() => {
      jest.advanceTimersByTime(200);
    });
    expect(result.current.hoveredMessage).toBeNull();
  });

  it('hover in cancels pending hover out', () => {
    const { result } = renderHook(() => useHoverMessage(200));

    act(() => {
      result.current.handleHoverIn('msg-1');
    });

    act(() => {
      result.current.handleHoverOut();
    });

    // Hover into a new message before timeout expires
    act(() => {
      jest.advanceTimersByTime(100);
      result.current.handleHoverIn('msg-2');
    });

    // Advance past original timeout
    act(() => {
      jest.advanceTimersByTime(200);
    });

    // Should still show msg-2, not null
    expect(result.current.hoveredMessage).toBe('msg-2');
  });
});
