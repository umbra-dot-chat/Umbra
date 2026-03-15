/**
 * MarketplaceNavigationContext — manages the active section and tab for the
 * inline marketplace view.  Shared between the marketplace sidebar nav and the
 * marketplace content pane so both stay in sync.
 */

import React, { createContext, useCallback, useContext, useState } from 'react';

export type MarketplaceSection = 'plugins' | 'themes' | 'fonts';
export type MarketplaceTab = 'browse' | 'installed';

interface MarketplaceNavigationContextValue {
  activeSection: MarketplaceSection;
  activeTab: MarketplaceTab;
  setActiveSection: (section: MarketplaceSection) => void;
  setActiveTab: (tab: MarketplaceTab) => void;
}

const MarketplaceNavigationContext = createContext<MarketplaceNavigationContextValue>({
  activeSection: 'plugins',
  activeTab: 'browse',
  setActiveSection: () => {},
  setActiveTab: () => {},
});

export function MarketplaceNavigationProvider({ children }: { children: React.ReactNode }) {
  const [activeSection, setSectionState] = useState<MarketplaceSection>('plugins');
  const [activeTab, setTabState] = useState<MarketplaceTab>('browse');

  const setActiveSection = useCallback((section: MarketplaceSection) => {
    setSectionState(section);
  }, []);

  const setActiveTab = useCallback((tab: MarketplaceTab) => {
    setTabState(tab);
  }, []);

  return (
    <MarketplaceNavigationContext.Provider
      value={{ activeSection, activeTab, setActiveSection, setActiveTab }}
    >
      {children}
    </MarketplaceNavigationContext.Provider>
  );
}

export const useMarketplaceNavigation = () => useContext(MarketplaceNavigationContext);
