import React, { createContext, useContext, useState, useCallback } from 'react';

interface ActiveConversationState {
  activeId: string | null;
  setActiveId: (id: string) => void;
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
  searchPanelRequested: false,
  requestSearchPanel: () => {},
  clearSearchPanelRequest: () => {},
});

export function ActiveConversationProvider({ children }: { children: React.ReactNode }) {
  const [activeId, setActiveIdRaw] = useState<string | null>(null);
  const [searchPanelRequested, setSearchPanelRequested] = useState(false);

  const setActiveId = useCallback((id: string) => {
    setActiveIdRaw(id);
  }, []);

  const requestSearchPanel = useCallback(() => {
    setSearchPanelRequested(true);
  }, []);

  const clearSearchPanelRequest = useCallback(() => {
    setSearchPanelRequested(false);
  }, []);

  return (
    <ActiveConversationContext.Provider value={{ activeId, setActiveId, searchPanelRequested, requestSearchPanel, clearSearchPanelRequest }}>
      {children}
    </ActiveConversationContext.Provider>
  );
}

export function useActiveConversation() {
  return useContext(ActiveConversationContext);
}
