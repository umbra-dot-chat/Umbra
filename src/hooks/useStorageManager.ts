/**
 * useStorageManager — Hook for monitoring and managing local file storage.
 *
 * Provides storage usage breakdown, smart cleanup actions, and
 * configurable auto-cleanup rules.
 *
 * ## Usage
 *
 * ```tsx
 * const {
 *   storageUsage, isLoading,
 *   smartCleanup, cleanupSuggestions,
 *   autoCleanupRules, setAutoCleanupRules,
 * } = useStorageManager();
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { useUmbra } from '@/contexts/UmbraContext';
import {
  getStorageUsage,
  smartCleanup as runSmartCleanup,
  getCleanupSuggestions,
  setAutoCleanupRules as setRules,
  getAutoCleanupRules,
  formatBytes,
} from '@umbra/service';
import type {
  StorageUsage,
  CleanupResult,
  CleanupSuggestion,
  AutoCleanupRules,
} from '@umbra/service';

// ---------------------------------------------------------------------------
// Result type
// ---------------------------------------------------------------------------

export interface UseStorageManagerResult {
  /** Current storage usage breakdown */
  storageUsage: StorageUsage | null;
  /** Whether storage data is loading */
  isLoading: boolean;
  /** Error from operations */
  error: Error | null;
  /** Run smart cleanup */
  smartCleanup: () => Promise<CleanupResult | null>;
  /** Cleanup suggestions */
  cleanupSuggestions: CleanupSuggestion[];
  /** Whether cleanup is running */
  isCleaningUp: boolean;
  /** Last cleanup result */
  lastCleanupResult: CleanupResult | null;
  /** Current auto-cleanup rules */
  autoCleanupRules: AutoCleanupRules;
  /** Update auto-cleanup rules */
  setAutoCleanupRules: (rules: Partial<AutoCleanupRules>) => void;
  /** Refresh storage data */
  refresh: () => Promise<void>;
  /** Format bytes to human-readable string */
  formatBytes: (bytes: number) => string;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useStorageManager(): UseStorageManagerResult {
  const { isReady } = useUmbra();

  const [storageUsage, setStorageUsage] = useState<StorageUsage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [cleanupSuggestions, setCleanupSuggestions] = useState<CleanupSuggestion[]>([]);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [lastCleanupResult, setLastCleanupResult] = useState<CleanupResult | null>(null);
  const [autoCleanupRules, setAutoCleanupRulesState] = useState<AutoCleanupRules>(
    getAutoCleanupRules(),
  );

  // -------------------------------------------------------------------------
  // Fetch storage usage
  // -------------------------------------------------------------------------

  const fetchUsage = useCallback(async () => {
    try {
      setIsLoading(true);
      const [usage, suggestions] = await Promise.all([
        getStorageUsage(),
        getCleanupSuggestions(),
      ]);
      setStorageUsage(usage);
      setCleanupSuggestions(suggestions);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isReady) {
      fetchUsage();
    }
  }, [isReady, fetchUsage]);

  // -------------------------------------------------------------------------
  // Smart cleanup
  // -------------------------------------------------------------------------

  const smartCleanup = useCallback(async (): Promise<CleanupResult | null> => {
    try {
      setIsCleaningUp(true);
      const result = await runSmartCleanup();
      setLastCleanupResult(result);
      // Refresh usage after cleanup
      await fetchUsage();
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return null;
    } finally {
      setIsCleaningUp(false);
    }
  }, [fetchUsage]);

  // -------------------------------------------------------------------------
  // Auto-cleanup rules
  // -------------------------------------------------------------------------

  const updateAutoCleanupRules = useCallback((rules: Partial<AutoCleanupRules>) => {
    setRules(rules);
    setAutoCleanupRulesState(getAutoCleanupRules());
  }, []);

  // -------------------------------------------------------------------------
  // Refresh
  // -------------------------------------------------------------------------

  const refresh = useCallback(async () => {
    await fetchUsage();
  }, [fetchUsage]);

  // -------------------------------------------------------------------------
  // Return
  // -------------------------------------------------------------------------

  return {
    storageUsage,
    isLoading,
    error,
    smartCleanup,
    cleanupSuggestions,
    isCleaningUp,
    lastCleanupResult,
    autoCleanupRules,
    setAutoCleanupRules: updateAutoCleanupRules,
    refresh,
    formatBytes,
  };
}
