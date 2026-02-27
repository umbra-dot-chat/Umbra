/**
 * SettingsDialogContext — provides a way for child routes (e.g. ChatPage)
 * to open the SettingsDialog to a specific section from the layout.
 */

import React, { createContext, useContext, useCallback, useState } from 'react';
import type { SettingsSection } from '@/components/modals/SettingsDialog';

interface SettingsDialogContextValue {
  /** Open the settings dialog, optionally jumping to a specific section. */
  openSettings: (section?: SettingsSection) => void;
  /** Whether the dialog is open. */
  isOpen: boolean;
  /** Close the dialog. */
  closeSettings: () => void;
  /** The requested initial section (if any). */
  initialSection: SettingsSection | undefined;
}

const SettingsDialogContext = createContext<SettingsDialogContextValue>({
  openSettings: () => {},
  isOpen: false,
  closeSettings: () => {},
  initialSection: undefined,
});

export function SettingsDialogProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [initialSection, setInitialSection] = useState<SettingsSection | undefined>(undefined);

  const openSettings = useCallback((section?: SettingsSection) => {
    setInitialSection(section);
    setIsOpen(true);
  }, []);

  const closeSettings = useCallback(() => {
    setIsOpen(false);
    setInitialSection(undefined);
  }, []);

  return (
    <SettingsDialogContext.Provider value={{ openSettings, isOpen, closeSettings, initialSection }}>
      {children}
    </SettingsDialogContext.Provider>
  );
}

export function useSettingsDialog() {
  return useContext(SettingsDialogContext);
}
