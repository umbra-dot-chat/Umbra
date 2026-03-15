/**
 * SettingsNavigationContext — manages the active section/subsection for the
 * inline settings view.  Shared between the settings sidebar nav and the
 * settings content pane so both stay in sync.
 */

import React, { createContext, useCallback, useContext, useState } from 'react';
import type { SettingsSection } from '@/components/modals/SettingsDialog';

interface SettingsNavigationContextValue {
  activeSection: SettingsSection;
  activeSubsection: string | null;
  setActiveSection: (section: SettingsSection, subsection?: string | null) => void;
}

const SettingsNavigationContext = createContext<SettingsNavigationContextValue>({
  activeSection: 'account',
  activeSubsection: null,
  setActiveSection: () => {},
});

export function SettingsNavigationProvider({
  children,
  initialSection,
}: {
  children: React.ReactNode;
  initialSection?: SettingsSection;
}) {
  const [activeSection, setSection] = useState<SettingsSection>(initialSection ?? 'account');
  const [activeSubsection, setSubsection] = useState<string | null>(null);

  const setActiveSection = useCallback(
    (section: SettingsSection, subsection?: string | null) => {
      setSection(section);
      setSubsection(subsection ?? null);
    },
    [],
  );

  return (
    <SettingsNavigationContext.Provider value={{ activeSection, activeSubsection, setActiveSection }}>
      {children}
    </SettingsNavigationContext.Provider>
  );
}

export const useSettingsNavigation = () => useContext(SettingsNavigationContext);
