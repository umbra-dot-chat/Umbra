import React, { createContext, useContext, useState, useCallback } from 'react';
import { dbg } from '@/utils/debug';

const SRC = 'ActiveConversationContext';

interface ActiveConversationState {
  activeId: string | null;
  setActiveId: (id: string) => void;
  /** Clear the active conversation (mobile back navigation) */
  clearActiveId: () => void;
  /** Whether the search panel should be opened (set by CommandPalette, consumed by ChatPage) */
  searchPanelRequested: boolean;
  /** Request the search panel to open */
  requestSearchPanel: () => void;
  /** Clear the search panel request (after consuming it) */
  clearSearchPanelRequest: () => void;
}

const ActiveConversationContext = createContext<ActiveConversationState>({
  activeId: null,
  setActiveId: () => {},
  clearActiveId: () => {},
  searchPanelRequested: false,
  requestSearchPanel: () => {},
  clearSearchPanelRequest: () => {},
});

export function ActiveConversationProvider({ children }: { children: React.ReactNode }) {
  const [activeId, setActiveIdRaw] = useState<string | null>(null);
  const [searchPanelRequested, setSearchPanelRequested] = useState(false);

  const setActiveId = useCallback((id: string) => {
    if (__DEV__) dbg.debug('conversations', 'conversation switch', { id }, SRC);
    setActiveIdRaw(id);
  }, []);

  const clearActiveId = useCallback(() => {
    if (__DEV__) dbg.debug('conversations', 'conversation cleared', {}, SRC);
    setActiveIdRaw(null);
  }, []);

  const requestSearchPanel = useCallback(() => {
    if (__DEV__) dbg.debug('conversations', 'search panel opened', {}, SRC);
    setSearchPanelRequested(true);
  }, []);

  const clearSearchPanelRequest = useCallback(() => {
    if (__DEV__) dbg.debug('conversations', 'search panel closed', {}, SRC);
    setSearchPanelRequested(false);
  }, []);

  return (
    <ActiveConversationContext.Provider value={{ activeId, setActiveId, clearActiveId, searchPanelRequested, requestSearchPanel, clearSearchPanelRequest }}>
      {children}
    </ActiveConversationContext.Provider>
  );
}

export function useActiveConversation() {
  return useContext(ActiveConversationContext);
}
