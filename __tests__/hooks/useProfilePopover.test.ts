/**
 * Tests for useProfilePopover hook
 *
 * Covers: show profile, anchor positioning, close profile.
 */

import { renderHook, act } from '@testing-library/react-native';
import { useProfilePopover } from '@/hooks/useProfilePopover';

describe('useProfilePopover', () => {
  it('starts with no selected member', () => {
    const { result } = renderHook(() => useProfilePopover());
    expect(result.current.selectedMember).toBeNull();
    expect(result.current.popoverAnchor).toBeNull();
  });

  it('showProfile sets member and anchor', () => {
    const { result } = renderHook(() => useProfilePopover());

    act(() => {
      result.current.showProfile('Alice', { nativeEvent: { pageX: 100, pageY: 200 } }, 'online');
    });

    expect(result.current.selectedMember).toEqual({
      id: 'Alice',
      name: 'Alice',
      status: 'online',
      avatar: undefined,
    });
    expect(result.current.popoverAnchor).toEqual({ x: 100, y: 200 });
  });

  it('closeProfile clears member and anchor', () => {
    const { result } = renderHook(() => useProfilePopover());

    act(() => {
      result.current.showProfile('Bob', { pageX: 50, pageY: 75 }, 'idle');
    });
    expect(result.current.selectedMember).not.toBeNull();

    act(() => {
      result.current.closeProfile();
    });
    expect(result.current.selectedMember).toBeNull();
    expect(result.current.popoverAnchor).toBeNull();
  });

  it('defaults status to offline when not provided', () => {
    const { result } = renderHook(() => useProfilePopover());

    act(() => {
      result.current.showProfile('Charlie');
    });

    expect(result.current.selectedMember?.status).toBe('offline');
  });
});
