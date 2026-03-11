/**
 * @module components/boost-node-dashboard
 * @description React Native BoostNodeDashboard component for the Wisp design system.
 *
 * Reuses type definitions from `@coexist/wisp-core`.
 * Renders via `<View>` + `<Text>` + `<Pressable>` instead of DOM elements.
 */

import React, { forwardRef, useMemo } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import type { ViewProps, ViewStyle, TextStyle } from 'react-native';
import type {
  BoostNode,
  BoostNodeStatus,
  BoostNodeType,
} from '@coexist/wisp-core/types/BoostNodeDashboard.types';
import { resolveStatusColor } from '@coexist/wisp-core/styles/BoostNodeDashboard.styles';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface BoostNodeDashboardProps extends ViewProps {
  nodes: BoostNode[];
  onNodeClick?: (nodeId: string) => void;
  onRegisterClick?: () => void;
  title?: string;
  loading?: boolean;
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const BoostNodeDashboard = forwardRef<View, BoostNodeDashboardProps>(
  function BoostNodeDashboard(
    {
      nodes,
      onNodeClick,
      onRegisterClick,
      title = 'Boost Nodes',
      loading = false,
      skeleton = false,
      style: userStyle,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();

    const containerStyle = useMemo<ViewStyle>(() => ({
      gap: theme.spacing.lg,
    }), [theme]);

    const headerStyle = useMemo<ViewStyle>(() => ({
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
    }), [theme]);

    const titleStyle = useMemo<TextStyle>(() => ({
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text.primary,
    }), [theme]);

    if (skeleton) {
      return (
        <View ref={ref} style={[containerStyle, userStyle]} {...rest}>
          {[1, 2, 3].map((i) => (
            <View
              key={i}
              style={{
                height: 140,
                borderRadius: theme.radii.lg,
                backgroundColor: theme.colors.border.subtle,
              }}
            />
          ))}
        </View>
      );
    }

    return (
      <View ref={ref} style={[containerStyle, userStyle]} {...rest}>
        <View style={headerStyle}>
          <Text style={titleStyle}>{title}</Text>
          {onRegisterClick && (
            <Pressable
              onPress={onRegisterClick}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: theme.radii.md,
                backgroundColor: theme.colors.accent.primary,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '500' }}>Register Node</Text>
            </Pressable>
          )}
        </View>

        {loading && (
          <Text style={{ textAlign: 'center', padding: 24, color: theme.colors.text.muted, fontSize: 14 }}>
            Loading nodes...
          </Text>
        )}

        {!loading && nodes.length === 0 && (
          <Text style={{ textAlign: 'center', padding: 32, color: theme.colors.text.muted, fontSize: 14 }}>
            No boost nodes registered yet.
          </Text>
        )}

        {!loading && nodes.map((node) => (
          <Pressable
            key={node.id}
            onPress={() => onNodeClick?.(node.id)}
            style={{
              gap: theme.spacing.sm,
              padding: theme.spacing.lg,
              borderRadius: theme.radii.lg,
              backgroundColor: theme.colors.background.surface,
              borderWidth: 1,
              borderColor: theme.colors.border.subtle,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: resolveStatusColor(node.status, theme),
                  }}
                />
                <Text style={{ fontSize: 15, fontWeight: '600', color: theme.colors.text.primary }}>
                  {node.name}
                </Text>
              </View>
              <View
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 9999,
                  backgroundColor: theme.colors.border.subtle,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: '500', color: theme.colors.text.secondary, textTransform: 'uppercase' }}>
                  {node.nodeType}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 12, color: theme.colors.text.muted }}>{node.status}</Text>
              <Text style={{ fontSize: 12, color: theme.colors.text.muted }}>{node.enabled ? 'Enabled' : 'Disabled'}</Text>
            </View>

            <View style={{ gap: 4 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 12, color: theme.colors.text.muted }}>Storage</Text>
                <Text style={{ fontSize: 12, color: theme.colors.text.muted }}>
                  {formatBytes(node.usedStorageBytes)} / {formatBytes(node.maxStorageBytes)}
                </Text>
              </View>
              <View style={{ height: 6, borderRadius: 3, backgroundColor: theme.colors.border.subtle, overflow: 'hidden' }}>
                <View
                  style={{
                    height: '100%',
                    borderRadius: 3,
                    backgroundColor: theme.colors.accent.primary,
                    width: `${Math.min(100, (node.usedStorageBytes / node.maxStorageBytes) * 100)}%`,
                  }}
                />
              </View>
            </View>

            <Text style={{ fontSize: 12, color: theme.colors.text.muted }}>
              {node.maxBandwidthMbps} Mbps max bandwidth
            </Text>
          </Pressable>
        ))}
      </View>
    );
  },
);

BoostNodeDashboard.displayName = 'BoostNodeDashboard';
