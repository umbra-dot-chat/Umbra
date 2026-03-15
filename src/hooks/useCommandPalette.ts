/**
 * useCommandPalette — Keyboard shortcuts for the command palette and sidebar search.
 *
 * - Cmd+K → toggle command palette open/close
 * - Cmd+Shift+F → activate sidebar search (in-conversation search)
 *
 * Web-only — early returns on non-web platforms.
 */

import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { useUnifiedSearch } from '@/contexts/UnifiedSearchContext';

export function useCommandPalette() {
  const { setSidebarSearchActive } = useUnifiedSearch();
  const [open, setOpenRaw] = useState(false);

  const openPalette = useCallback(() => setOpenRaw(true), []);
  const closePalette = useCallback(() => setOpenRaw(false), []);
  const setOpen = useCallback((v: boolean) => { v ? openPalette() : closePalette(); }, [openPalette, closePalette]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handler = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K → toggle command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpenRaw((prev) => !prev);
      }

      // Cmd+Shift+F or Ctrl+Shift+F → activate sidebar search
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        setSidebarSearchActive(true);
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [setSidebarSearchActive]);

  return {
    open,
    setOpen,
    openPalette,
    closePalette,
  };
}
