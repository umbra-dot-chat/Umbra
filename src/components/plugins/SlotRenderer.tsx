/**
 * SlotRenderer — Renders plugin components registered for a given UI slot.
 *
 * Uses `useSyncExternalStore` to subscribe directly to the PluginRegistry
 * (via the stable PluginRegistryContext), avoiding the full PluginContext.
 * This means SlotRenderer only re-renders when the specific slot's entries
 * change (plugin enable/disable), NOT when unrelated context values update.
 *
 * Wrapped in React.memo with a custom comparator that shallow-compares
 * the `props` Record to prevent re-renders from new object literals
 * (e.g. `props={{ conversationId }}`).
 *
 * @example
 * ```tsx
 * <SlotRenderer slot="chat-toolbar" props={{ conversationId }} />
 * ```
 */

import React, { useCallback, useMemo, useSyncExternalStore } from 'react';
import { Box } from '@coexist/wisp-react-native';
import type { SlotName, SlotEntry } from '@umbra/plugin-sdk';
import { dbg } from '@/utils/debug';
import { SlotPropsContext } from '@umbra/plugin-sdk';
import { usePluginRegistry } from '@/contexts/PluginContext';
import { PluginErrorBoundary } from './PluginErrorBoundary';
import type { PluginRegistry } from '@umbra/plugin-runtime';

export interface SlotRendererProps {
  /** Which slot to render */
  slot: SlotName;
  /** Props to pass to each plugin component via SlotPropsContext */
  props?: Record<string, any>;
  /** Container style override */
  style?: any;
}

// Stable empty array to avoid creating new references for empty slots.
const EMPTY_ENTRIES: SlotEntry[] = [];

/**
 * Subscribe to the PluginRegistry for a specific slot via useSyncExternalStore.
 * Only triggers a re-render when the slot's entry array reference changes
 * (i.e. when plugins are enabled/disabled), not on any other context update.
 */
function useSlotEntries(registry: PluginRegistry, slot: SlotName): SlotEntry[] {
  const subscribe = useCallback(
    (onStoreChange: () => void) => registry.onChange(onStoreChange),
    [registry],
  );

  const getSnapshot = useCallback(() => {
    const entries = registry.getSlotComponents(slot);
    // Return stable reference for empty slots so useSyncExternalStore
    // doesn't trigger spurious re-renders from new [] allocations.
    return entries.length === 0 ? EMPTY_ENTRIES : entries;
  }, [registry, slot]);

  return useSyncExternalStore(subscribe, getSnapshot);
}

/** Shallow-compare two Records by own enumerable keys + values. */
function shallowEqualRecords(
  a: Record<string, any> | undefined,
  b: Record<string, any> | undefined,
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (a[key] !== b[key]) return false;
  }
  return true;
}

function SlotRendererInner({ slot, props, style }: SlotRendererProps) {
  if (__DEV__) dbg.trackRender('SlotRenderer');

  const registry = usePluginRegistry();
  const entries = useSlotEntries(registry, slot);

  // Stable reference for the empty-props fallback so SlotPropsContext.Provider
  // doesn't create a new value on every render when props is undefined.
  const stableProps = useMemo(() => props ?? {}, [props]);

  if (entries.length === 0) return null;

  return (
    <Box style={style}>
      {entries.map((entry) => (
        <PluginErrorBoundary key={entry.pluginId} pluginId={entry.pluginId} slot={slot}>
          <SlotPropsContext.Provider value={stableProps}>
            <entry.Component {...stableProps} />
          </SlotPropsContext.Provider>
        </PluginErrorBoundary>
      ))}
    </Box>
  );
}

export const SlotRenderer = React.memo(SlotRendererInner, (prev, next) => {
  if (prev.slot !== next.slot) return false;
  if (prev.style !== next.style) return false;
  if (!shallowEqualRecords(prev.props, next.props)) return false;
  return true;
});

// Preserve display name for React DevTools and debug logging
SlotRenderer.displayName = 'SlotRenderer';
