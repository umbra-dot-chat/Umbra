/**
 * ProfilePopoverContext — Unit Tests
 *
 * Tests for profile popover state management via the context wrapper
 * around the useProfilePopover hook.
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import {
  ProfilePopoverProvider,
  useProfilePopoverContext,
} from '@/contexts/ProfilePopoverContext';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

function wrapper({ children }: { children: React.ReactNode }) {
  return <ProfilePopoverProvider>{children}</ProfilePopoverProvider>;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ProfilePopoverContext', () => {
  it('throws when used outside provider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => {
      renderHook(() => useProfilePopoverContext());
    }).toThrow('useProfilePopoverContext must be used within ProfilePopoverProvider');
    spy.mockRestore();
  });

  it('selectedMember starts as null', () => {
    const { result } = renderHook(() => useProfilePopoverContext(), { wrapper });
    expect(result.current.selectedMember).toBeNull();
  });

  it('popoverAnchor starts as null', () => {
    const { result } = renderHook(() => useProfilePopoverContext(), { wrapper });
    expect(result.current.popoverAnchor).toBeNull();
  });

  it('showProfile sets selectedMember and anchor', () => {
    const { result } = renderHook(() => useProfilePopoverContext(), { wrapper });

    act(() => {
      result.current.showProfile('Alice', { pageX: 100, pageY: 200 }, 'online');
    });

    expect(result.current.selectedMember).toEqual({
      id: 'Alice',
      name: 'Alice',
      status: 'online',
      avatar: undefined,
    });
    expect(result.current.popoverAnchor).toEqual({ x: 100, y: 200 });
  });

  it('closeProfile clears selectedMember and anchor', () => {
    const { result } = renderHook(() => useProfilePopoverContext(), { wrapper });

    act(() => {
      result.current.showProfile('Bob', { pageX: 50, pageY: 100 }, 'idle');
    });
    expect(result.current.selectedMember).not.toBeNull();

    act(() => {
      result.current.closeProfile();
    });

    expect(result.current.selectedMember).toBeNull();
    expect(result.current.popoverAnchor).toBeNull();
  });
});
