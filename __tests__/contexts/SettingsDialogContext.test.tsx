/**
 * SettingsDialogContext — Unit Tests
 *
 * Tests for settings dialog open/close state and section targeting.
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import {
  SettingsDialogProvider,
  useSettingsDialog,
} from '@/contexts/SettingsDialogContext';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

function wrapper({ children }: { children: React.ReactNode }) {
  return <SettingsDialogProvider>{children}</SettingsDialogProvider>;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SettingsDialogContext', () => {
  it('isOpen defaults to false', () => {
    const { result } = renderHook(() => useSettingsDialog(), { wrapper });
    expect(result.current.isOpen).toBe(false);
  });

  it('initialSection defaults to undefined', () => {
    const { result } = renderHook(() => useSettingsDialog(), { wrapper });
    expect(result.current.initialSection).toBeUndefined();
  });

  it('openSettings opens the dialog', () => {
    const { result } = renderHook(() => useSettingsDialog(), { wrapper });

    act(() => {
      result.current.openSettings();
    });

    expect(result.current.isOpen).toBe(true);
  });

  it('openSettings with section sets initialSection', () => {
    const { result } = renderHook(() => useSettingsDialog(), { wrapper });

    act(() => {
      result.current.openSettings('appearance');
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.initialSection).toBe('appearance');
  });

  it('closeSettings closes the dialog and clears section', () => {
    const { result } = renderHook(() => useSettingsDialog(), { wrapper });

    act(() => {
      result.current.openSettings('sounds');
    });
    expect(result.current.isOpen).toBe(true);
    expect(result.current.initialSection).toBe('sounds');

    act(() => {
      result.current.closeSettings();
    });
    expect(result.current.isOpen).toBe(false);
    expect(result.current.initialSection).toBeUndefined();
  });

  it('works outside provider with default values', () => {
    const { result } = renderHook(() => useSettingsDialog());
    expect(result.current.isOpen).toBe(false);
    expect(result.current.initialSection).toBeUndefined();
  });
});
