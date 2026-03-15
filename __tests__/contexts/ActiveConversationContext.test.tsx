/**
 * ActiveConversationContext — Unit Tests
 *
 * Tests for active conversation selection and search panel request state.
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import {
  ActiveConversationProvider,
  useActiveConversation,
} from '@/contexts/ActiveConversationContext';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

function wrapper({ children }: { children: React.ReactNode }) {
  return <ActiveConversationProvider>{children}</ActiveConversationProvider>;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ActiveConversationContext — Default state', () => {
  it('activeId starts as null', () => {
    const { result } = renderHook(() => useActiveConversation(), { wrapper });
    expect(result.current.activeId).toBeNull();
  });

  it('searchPanelRequested starts as false', () => {
    const { result } = renderHook(() => useActiveConversation(), { wrapper });
    expect(result.current.searchPanelRequested).toBe(false);
  });
});

describe('ActiveConversationContext — Conversation selection', () => {
  it('setActiveId sets the active conversation', () => {
    const { result } = renderHook(() => useActiveConversation(), { wrapper });

    act(() => {
      result.current.setActiveId('conv-123');
    });

    expect(result.current.activeId).toBe('conv-123');
  });

  it('clearActiveId resets to null', () => {
    const { result } = renderHook(() => useActiveConversation(), { wrapper });

    act(() => {
      result.current.setActiveId('conv-123');
    });
    expect(result.current.activeId).toBe('conv-123');

    act(() => {
      result.current.clearActiveId();
    });
    expect(result.current.activeId).toBeNull();
  });

  it('setActiveId replaces existing conversation', () => {
    const { result } = renderHook(() => useActiveConversation(), { wrapper });

    act(() => {
      result.current.setActiveId('conv-1');
    });
    expect(result.current.activeId).toBe('conv-1');

    act(() => {
      result.current.setActiveId('conv-2');
    });
    expect(result.current.activeId).toBe('conv-2');
  });
});

describe('ActiveConversationContext — Search panel', () => {
  it('requestSearchPanel sets flag to true', () => {
    const { result } = renderHook(() => useActiveConversation(), { wrapper });

    act(() => {
      result.current.requestSearchPanel();
    });

    expect(result.current.searchPanelRequested).toBe(true);
  });

  it('clearSearchPanelRequest resets flag to false', () => {
    const { result } = renderHook(() => useActiveConversation(), { wrapper });

    act(() => {
      result.current.requestSearchPanel();
    });
    expect(result.current.searchPanelRequested).toBe(true);

    act(() => {
      result.current.clearSearchPanelRequest();
    });
    expect(result.current.searchPanelRequested).toBe(false);
  });
});
