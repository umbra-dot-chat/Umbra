/**
 * SlotRenderer — Renders plugin components registered for a given UI slot.
 *
 * Queries the PluginRegistry for active components at the specified slot,
 * wraps each in a PluginErrorBoundary, and passes through slot-specific props.
 *
 * @example
 * ```tsx
 * <SlotRenderer slot="chat-toolbar" props={{ conversationId }} />
 * ```
 */

import React from 'react';
import { View } from 'react-native';
import type { SlotName } from '@umbra/plugin-sdk';
import { SlotPropsContext } from '@umbra/plugin-sdk';
import { usePlugins } from '@/contexts/PluginContext';
import { PluginErrorBoundary } from './PluginErrorBoundary';

export interface SlotRendererProps {
  /** Which slot to render */
  slot: SlotName;
  /** Props to pass to each plugin component via SlotPropsContext */
  props?: Record<string, any>;
  /** Container style override */
  style?: any;
}

export function SlotRenderer({ slot, props, style }: SlotRendererProps) {
  const { getSlotComponents } = usePlugins();
  const entries = getSlotComponents(slot);

  if (entries.length === 0) return null;

  return (
    <View style={style}>
      {entries.map((entry) => (
        <PluginErrorBoundary key={entry.pluginId} pluginId={entry.pluginId} slot={slot}>
          <SlotPropsContext.Provider value={props ?? {}}>
            <entry.Component {...(props ?? {})} />
          </SlotPropsContext.Provider>
        </PluginErrorBoundary>
      ))}
    </View>
  );
}
