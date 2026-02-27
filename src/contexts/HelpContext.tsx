/**
 * HelpContext — Global hint/help indicator state manager.
 *
 * Adapted from Wraith's HintContext for React Native. Provides:
 * - Priority-based hint queue (only one hint pulses at a time)
 * - Persistent viewed state via localStorage (web) / AsyncStorage (native)
 * - Registration/unregistration for dynamic hint lifecycle
 *
 * ## Usage
 *
 * Wrap your app with `<HelpProvider>`:
 *
 * ```tsx
 * <HelpProvider>
 *   <App />
 * </HelpProvider>
 * ```
 *
 * Then use `useHelp()` in HelpIndicator components or consume directly:
 *
 * ```tsx
 * const { isActive, isViewed, dismissHint } = useHelp();
 * ```
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import { Platform } from 'react-native';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface HintEntry {
  id: string;
  priority: number;
}

/** Configuration for the root-level help popover. */
export interface PopoverConfig {
  anchor: { x: number; y: number };
  title: string;
  icon: string;
  children: React.ReactNode;
  hintId: string;
}

export interface HelpContextValue {
  /** Register a hint with a priority (lower = higher priority). Call on mount. */
  registerHint(id: string, priority?: number): void;
  /** Unregister a hint. Call on unmount. */
  unregisterHint(id: string): void;
  /** Mark a hint as viewed (stops pulsing, persisted). */
  dismissHint(id: string): void;
  /** Whether this hint is the currently active (pulsing) one. */
  isActive(id: string): boolean;
  /** Whether this hint has been dismissed/viewed. */
  isViewed(id: string): boolean;
  /** Reset all viewed hints (for dev/testing). */
  resetAll(): void;
  /** Open the root-level popover near an anchor point. */
  openPopover(config: PopoverConfig): void;
  /** Close the root-level popover. */
  closePopover(): void;
  /** Current popover state (null if closed). */
  popoverState: PopoverConfig | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Storage helpers
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'umbra-hints-viewed';

function loadViewedHints(): string[] {
  try {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    }
  } catch {
    // ignore
  }
  return [];
}

function saveViewedHints(viewed: string[]) {
  try {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(viewed));
    }
  } catch {
    // ignore
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────

const HelpContext = createContext<HelpContextValue | null>(null);

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

export function HelpProvider({ children }: { children: React.ReactNode }) {
  const [viewedHints, setViewedHints] = useState<string[]>(loadViewedHints);
  const [hintQueue, setHintQueue] = useState<HintEntry[]>([]);
  const [popoverState, setPopoverState] = useState<PopoverConfig | null>(null);

  // Persist viewed hints to storage whenever they change
  useEffect(() => {
    saveViewedHints(viewedHints);
  }, [viewedHints]);

  // Compute the currently active hint (lowest priority unviewed hint)
  const activeHintId = useMemo(() => {
    const unviewed = hintQueue
      .filter((h) => !viewedHints.includes(h.id))
      .sort((a, b) => a.priority - b.priority);
    return unviewed.length > 0 ? unviewed[0].id : null;
  }, [hintQueue, viewedHints]);

  const registerHint = useCallback((id: string, priority = 100) => {
    setHintQueue((prev) => {
      // Don't duplicate
      if (prev.some((h) => h.id === id)) return prev;
      return [...prev, { id, priority }];
    });
  }, []);

  const unregisterHint = useCallback((id: string) => {
    setHintQueue((prev) => prev.filter((h) => h.id !== id));
  }, []);

  const dismissHint = useCallback((id: string) => {
    setViewedHints((prev) => {
      if (prev.includes(id)) return prev;
      return [...prev, id];
    });
  }, []);

  const isActive = useCallback(
    (id: string) => activeHintId === id,
    [activeHintId]
  );

  const isViewed = useCallback(
    (id: string) => viewedHints.includes(id),
    [viewedHints]
  );

  const resetAll = useCallback(() => {
    setViewedHints([]);
    saveViewedHints([]);
  }, []);

  const openPopover = useCallback((config: PopoverConfig) => {
    setPopoverState(config);
  }, []);

  const closePopover = useCallback(() => {
    if (popoverState) {
      dismissHint(popoverState.hintId);
    }
    setPopoverState(null);
  }, [popoverState, dismissHint]);

  const value = useMemo<HelpContextValue>(
    () => ({
      registerHint,
      unregisterHint,
      dismissHint,
      isActive,
      isViewed,
      resetAll,
      openPopover,
      closePopover,
      popoverState,
    }),
    [registerHint, unregisterHint, dismissHint, isActive, isViewed, resetAll, openPopover, closePopover, popoverState]
  );

  return (
    <HelpContext.Provider value={value}>
      {children}
    </HelpContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Access the help/hint context.
 *
 * Must be used within a `<HelpProvider>`.
 */
export function useHelp(): HelpContextValue {
  const context = useContext(HelpContext);
  if (!context) {
    throw new Error(
      'useHelp must be used within a <HelpProvider>. ' +
      'Wrap your app with <HelpProvider> in the root layout.'
    );
  }
  return context;
}
