/**
 * CommunityContext — Unit Tests
 *
 * Tests for the community selection state context:
 *   - Default state (no active community/space/channel)
 *   - Setting active community, space, channel
 *   - Community change resets space and channel
 *   - Member list visibility toggle
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { CommunityProvider, useCommunityContext } from '@/contexts/CommunityContext';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

function wrapper({ children }: { children: React.ReactNode }) {
  return <CommunityProvider>{children}</CommunityProvider>;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CommunityContext — Default state', () => {
  it('activeCommunityId starts as null', () => {
    const { result } = renderHook(() => useCommunityContext(), { wrapper });
    expect(result.current.activeCommunityId).toBeNull();
  });

  it('activeSpaceId starts as null', () => {
    const { result } = renderHook(() => useCommunityContext(), { wrapper });
    expect(result.current.activeSpaceId).toBeNull();
  });

  it('activeChannelId starts as null', () => {
    const { result } = renderHook(() => useCommunityContext(), { wrapper });
    expect(result.current.activeChannelId).toBeNull();
  });

  it('showMemberList defaults to true', () => {
    const { result } = renderHook(() => useCommunityContext(), { wrapper });
    expect(result.current.showMemberList).toBe(true);
  });
});

describe('CommunityContext — Selection', () => {
  it('setActiveCommunityId sets the community', () => {
    const { result } = renderHook(() => useCommunityContext(), { wrapper });

    act(() => {
      result.current.setActiveCommunityId('community-1');
    });

    expect(result.current.activeCommunityId).toBe('community-1');
  });

  it('setActiveSpaceId sets the space', () => {
    const { result } = renderHook(() => useCommunityContext(), { wrapper });

    act(() => {
      result.current.setActiveSpaceId('space-1');
    });

    expect(result.current.activeSpaceId).toBe('space-1');
  });

  it('setActiveChannelId sets the channel', () => {
    const { result } = renderHook(() => useCommunityContext(), { wrapper });

    act(() => {
      result.current.setActiveChannelId('channel-1');
    });

    expect(result.current.activeChannelId).toBe('channel-1');
  });

  it('changing community resets space and channel', () => {
    const { result } = renderHook(() => useCommunityContext(), { wrapper });

    act(() => {
      result.current.setActiveCommunityId('community-1');
      result.current.setActiveSpaceId('space-1');
      result.current.setActiveChannelId('channel-1');
    });

    expect(result.current.activeSpaceId).toBe('space-1');
    expect(result.current.activeChannelId).toBe('channel-1');

    act(() => {
      result.current.setActiveCommunityId('community-2');
    });

    expect(result.current.activeCommunityId).toBe('community-2');
    expect(result.current.activeSpaceId).toBeNull();
    expect(result.current.activeChannelId).toBeNull();
  });

  it('setting community to null resets space and channel', () => {
    const { result } = renderHook(() => useCommunityContext(), { wrapper });

    act(() => {
      result.current.setActiveCommunityId('community-1');
      result.current.setActiveSpaceId('space-1');
      result.current.setActiveChannelId('channel-1');
    });

    act(() => {
      result.current.setActiveCommunityId(null);
    });

    expect(result.current.activeCommunityId).toBeNull();
    expect(result.current.activeSpaceId).toBeNull();
    expect(result.current.activeChannelId).toBeNull();
  });
});

describe('CommunityContext — Member list', () => {
  it('toggleMemberList toggles visibility', () => {
    const { result } = renderHook(() => useCommunityContext(), { wrapper });

    expect(result.current.showMemberList).toBe(true);

    act(() => {
      result.current.toggleMemberList();
    });
    expect(result.current.showMemberList).toBe(false);

    act(() => {
      result.current.toggleMemberList();
    });
    expect(result.current.showMemberList).toBe(true);
  });

  it('setShowMemberList sets visibility directly', () => {
    const { result } = renderHook(() => useCommunityContext(), { wrapper });

    act(() => {
      result.current.setShowMemberList(false);
    });
    expect(result.current.showMemberList).toBe(false);

    act(() => {
      result.current.setShowMemberList(true);
    });
    expect(result.current.showMemberList).toBe(true);
  });
});

describe('CommunityContext — Default context (outside provider)', () => {
  it('useCommunityContext works outside provider with default values', () => {
    // CommunityContext uses createContext with a default value, so no throw
    const { result } = renderHook(() => useCommunityContext());
    expect(result.current.activeCommunityId).toBeNull();
    expect(result.current.showMemberList).toBe(true);
  });
});
