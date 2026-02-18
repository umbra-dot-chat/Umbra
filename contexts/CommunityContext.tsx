/**
 * CommunityContext — Active community/space/channel state.
 *
 * Manages which community, space, and channel are currently selected.
 * Wraps the community route group and provides selection callbacks.
 *
 * Pattern: matches ActiveConversationContext
 */

import React, { createContext, useContext, useState, useCallback } from 'react';

interface CommunityContextState {
  /** Currently active community ID */
  activeCommunityId: string | null;
  /** Currently active space ID */
  activeSpaceId: string | null;
  /** Currently active channel ID */
  activeChannelId: string | null;
  /** Set the active community */
  setActiveCommunityId: (id: string | null) => void;
  /** Set the active space */
  setActiveSpaceId: (id: string | null) => void;
  /** Set the active channel */
  setActiveChannelId: (id: string | null) => void;
  /** Whether the right panel (members) is visible */
  showMemberList: boolean;
  /** Toggle the member list panel */
  toggleMemberList: () => void;
  /** Set member list visibility */
  setShowMemberList: (show: boolean) => void;
}

const CommunityContext = createContext<CommunityContextState>({
  activeCommunityId: null,
  activeSpaceId: null,
  activeChannelId: null,
  setActiveCommunityId: () => {},
  setActiveSpaceId: () => {},
  setActiveChannelId: () => {},
  showMemberList: true,
  toggleMemberList: () => {},
  setShowMemberList: () => {},
});

export function CommunityProvider({ children }: { children: React.ReactNode }) {
  const [activeCommunityId, setActiveCommunityIdRaw] = useState<string | null>(null);
  const [activeSpaceId, setActiveSpaceIdRaw] = useState<string | null>(null);
  const [activeChannelId, setActiveChannelIdRaw] = useState<string | null>(null);
  const [showMemberList, setShowMemberList] = useState(true);

  const setActiveCommunityId = useCallback((id: string | null) => {
    setActiveCommunityIdRaw(id);
    // Reset space and channel when community changes
    setActiveSpaceIdRaw(null);
    setActiveChannelIdRaw(null);
  }, []);

  const setActiveSpaceId = useCallback((id: string | null) => {
    setActiveSpaceIdRaw(id);
  }, []);

  const setActiveChannelId = useCallback((id: string | null) => {
    setActiveChannelIdRaw(id);
  }, []);

  const toggleMemberList = useCallback(() => {
    setShowMemberList((prev) => !prev);
  }, []);

  return (
    <CommunityContext.Provider
      value={{
        activeCommunityId,
        activeSpaceId,
        activeChannelId,
        setActiveCommunityId,
        setActiveSpaceId,
        setActiveChannelId,
        showMemberList,
        toggleMemberList,
        setShowMemberList,
      }}
    >
      {children}
    </CommunityContext.Provider>
  );
}

export function useCommunityContext() {
  return useContext(CommunityContext);
}
