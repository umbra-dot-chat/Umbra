/**
 * @module components/node-detail-panel
 * @description React Native NodeDetailPanel component for the Wisp design system.
 *
 * Reuses type definitions from `@coexist/wisp-core`.
 * Renders via `<View>` + `<Text>` + `<Pressable>` + `<TextInput>`.
 */

import React, { forwardRef, useMemo, useState, useCallback } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import type { ViewProps, ViewStyle, TextStyle } from 'react-native';
import type { BoostNodeType, BoostNodeStatus } from '@coexist/wisp-core/types/BoostNodeDashboard.types';
import type { NodeConfigUpdate } from '@coexist/wisp-core/types/NodeDetailPanel.types';
import { resolveStatusColor } from '@coexist/wisp-core/styles/BoostNodeDashboard.styles';
import { useTheme } from '../../providers';
import * as Clipboard from 'expo-clipboard';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface NodeDetailPanelProps extends ViewProps {
  name: string;
  nodeType: BoostNodeType;
  enabled: boolean;
  lastSeenAt?: string;
  maxStorageBytes: number;
  usedStorageBytes: number;
  maxBandwidthMbps: number;
  publicKey: string;
  status: BoostNodeStatus;
  onToggleEnabled?: (enabled: boolean) => void;
  onUpdateConfig?: (updates: NodeConfigUpdate) => void;
  onDelete?: () => void;
  onClose?: () => void;
  saving?: boolean;
  skeleton?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatTimestamp(iso?: string): string {
  if (!iso) return 'Never';
  try { return new Date(iso).toLocaleString(); } catch { return iso; }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const NodeDetailPanel = forwardRef<View, NodeDetailPanelProps>(
  function NodeDetailPanel(
    {
      name, nodeType, enabled, lastSeenAt, maxStorageBytes, usedStorageBytes,
      maxBandwidthMbps, publicKey, status, onToggleEnabled, onUpdateConfig,
      onDelete, onClose, saving = false, skeleton = false, style: userStyle, ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();
    const [confirmDelete, setConfirmDelete] = useState(false);
    const storagePercent = maxStorageBytes > 0 ? (usedStorageBytes / maxStorageBytes) * 100 : 0;

    const handleCopyKey = useCallback(async () => {
      try { await Clipboard.setStringAsync(publicKey); } catch {}
    }, [publicKey]);

    if (skeleton) {
      return (
        <View ref={ref} style={[{ height: 400, borderRadius: theme.radii.lg, backgroundColor: theme.colors.border.subtle }, userStyle]} {...rest} />
      );
    }

    const sectionBorder: ViewStyle = { paddingTop: theme.spacing.md, borderTopWidth: 1, borderTopColor: theme.colors.border.subtle, gap: theme.spacing.sm };

    return (
      <View
        ref={ref}
        style={[{
          gap: theme.spacing.lg,
          padding: theme.spacing.xl,
          borderRadius: theme.radii.lg,
          backgroundColor: theme.colors.background.surface,
          borderWidth: 1,
          borderColor: theme.colors.border.subtle,
        }, userStyle]}
        {...rest}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: resolveStatusColor(status, theme) }} />
            <Text style={{ fontSize: 18, fontWeight: '600', color: theme.colors.text.primary }}>{name}</Text>
            <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 9999, backgroundColor: theme.colors.border.subtle }}>
              <Text style={{ fontSize: 11, fontWeight: '500', color: theme.colors.text.secondary, textTransform: 'uppercase' }}>{nodeType}</Text>
            </View>
          </View>
          {onClose && <Pressable onPress={onClose}><Text style={{ color: theme.colors.text.muted, fontSize: 18 }}>x</Text></Pressable>}
        </View>

        {/* Status info */}
        <View style={sectionBorder}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 13, color: theme.colors.text.muted }}>Status</Text>
            <Text style={{ fontSize: 14, color: theme.colors.text.primary, textTransform: 'capitalize' }}>{status}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 13, color: theme.colors.text.muted }}>Last Seen</Text>
            <Text style={{ fontSize: 14, color: theme.colors.text.primary }}>{formatTimestamp(lastSeenAt)}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 13, color: theme.colors.text.muted }}>Enabled</Text>
            <Pressable
              onPress={() => onToggleEnabled?.(!enabled)}
              style={{
                width: 40, height: 22, borderRadius: 11,
                backgroundColor: enabled ? theme.colors.accent.primary : theme.colors.border.subtle,
                justifyContent: 'center',
                paddingHorizontal: 2,
              }}
            >
              <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: '#fff', alignSelf: enabled ? 'flex-end' : 'flex-start' }} />
            </Pressable>
          </View>
        </View>

        {/* Public key */}
        <View style={sectionBorder}>
          <Text style={{ fontSize: 13, fontWeight: '500', color: theme.colors.text.secondary }}>Public Key</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, padding: theme.spacing.md, borderRadius: theme.radii.md, backgroundColor: theme.colors.background.sunken }}>
            <Text style={{ flex: 1, fontFamily: 'monospace', fontSize: 12, color: theme.colors.text.secondary }}>{publicKey}</Text>
            <Pressable onPress={handleCopyKey}><Text style={{ color: theme.colors.text.muted, fontSize: 12 }}>Copy</Text></Pressable>
          </View>
        </View>

        {/* Storage */}
        <View style={sectionBorder}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 13, fontWeight: '500', color: theme.colors.text.secondary }}>Storage Usage</Text>
            <Text style={{ fontSize: 12, color: theme.colors.text.muted }}>{formatBytes(usedStorageBytes)} / {formatBytes(maxStorageBytes)}</Text>
          </View>
          <View style={{ height: 8, borderRadius: 4, backgroundColor: theme.colors.border.subtle, overflow: 'hidden' }}>
            <View style={{ height: '100%', borderRadius: 4, backgroundColor: storagePercent > 90 ? theme.colors.status.warning : theme.colors.accent.primary, width: `${Math.min(100, storagePercent)}%` }} />
          </View>
        </View>

        {/* Danger zone */}
        {onDelete && (
          <View style={{ gap: theme.spacing.sm, padding: theme.spacing.lg, borderRadius: theme.radii.md, borderWidth: 1, borderColor: theme.colors.status.dangerBorder, backgroundColor: theme.colors.status.dangerSurface }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.status.danger }}>Danger Zone</Text>
            {!confirmDelete ? (
              <Pressable onPress={() => setConfirmDelete(true)} style={{ alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 8, borderRadius: theme.radii.md, borderWidth: 1, borderColor: theme.colors.status.danger }}>
                <Text style={{ color: theme.colors.status.danger, fontSize: 13 }}>Delete Node</Text>
              </Pressable>
            ) : (
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <Text style={{ fontSize: 13, color: theme.colors.status.danger }}>Are you sure?</Text>
                <Pressable onPress={() => { onDelete(); setConfirmDelete(false); }} style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: theme.radii.md, backgroundColor: theme.colors.status.danger }}>
                  <Text style={{ color: '#fff', fontSize: 13, fontWeight: '500' }}>Confirm</Text>
                </Pressable>
                <Pressable onPress={() => setConfirmDelete(false)} style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: theme.radii.md, borderWidth: 1, borderColor: theme.colors.border.strong }}>
                  <Text style={{ color: theme.colors.text.secondary, fontSize: 13 }}>Cancel</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}

        {saving && <Text style={{ fontSize: 12, color: theme.colors.text.muted }}>Saving...</Text>}
      </View>
    );
  },
);

NodeDetailPanel.displayName = 'NodeDetailPanel';
