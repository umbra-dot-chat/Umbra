/**
 * useTrackedState — State hook with automatic debug logging of changes.
 *
 * Drop-in replacement for useState that logs shallow diffs to the debug system.
 * Only active in __DEV__ mode — zero overhead in production.
 *
 * Usage in context providers:
 *   const [value, setValue] = useTrackedState('AuthContext', 'isAuthenticated', false);
 */

import { useState, useCallback } from 'react';
import { dbg } from '@/utils/debug';

const SRC = 'TrackedState';

/** Compute a shallow diff between two values */
function shallowDiff(a: unknown, b: unknown): Record<string, unknown> {
  if (a === b) return { unchanged: true };

  // Primitive comparison
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) {
    return { old: a, new: b };
  }

  // Array comparison (just lengths + changed indicator)
  if (Array.isArray(a) && Array.isArray(b)) {
    return { oldLen: a.length, newLen: b.length, changed: a.length !== b.length || a.some((v, i) => v !== b[i]) };
  }

  // Object shallow diff
  const aObj = a as Record<string, unknown>;
  const bObj = b as Record<string, unknown>;
  const allKeys = new Set([...Object.keys(aObj), ...Object.keys(bObj)]);
  const added: string[] = [];
  const removed: string[] = [];
  const changed: string[] = [];

  for (const key of allKeys) {
    if (!(key in aObj)) added.push(key);
    else if (!(key in bObj)) removed.push(key);
    else if (aObj[key] !== bObj[key]) changed.push(key);
  }

  if (added.length === 0 && removed.length === 0 && changed.length === 0) {
    return { unchanged: true };
  }

  const diff: Record<string, unknown> = {};
  if (added.length > 0) diff.added = added;
  if (removed.length > 0) diff.removed = removed;
  if (changed.length > 0) diff.changed = changed;
  return diff;
}

/**
 * useState wrapper that logs state changes to the debug system.
 *
 * @param contextName - Name of the context (e.g., 'AuthContext')
 * @param fieldName - Name of the state field (e.g., 'isAuthenticated')
 * @param initialValue - Initial state value
 */
export function useTrackedState<T>(
  contextName: string,
  fieldName: string,
  initialValue: T | (() => T),
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, rawSet] = useState(initialValue);

  const set = useCallback((next: React.SetStateAction<T>) => {
    rawSet((prev: T) => {
      const resolved = typeof next === 'function' ? (next as (prev: T) => T)(prev) : next;
      if (__DEV__ && prev !== resolved) {
        const diff = shallowDiff(prev, resolved);
        if (!diff.unchanged) {
          dbg.debug('state', `${contextName}.${fieldName}`, diff, SRC);
        }
      }
      return resolved;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contextName, fieldName]);

  return [value, set];
}
