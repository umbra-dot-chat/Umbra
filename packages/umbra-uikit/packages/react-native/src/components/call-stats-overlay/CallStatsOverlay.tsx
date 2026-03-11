/**
 * CallStatsOverlay — Toggleable real-time WebRTC stats panel.
 */

import React, { forwardRef, useMemo } from 'react';
import { View, Pressable } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import { Text } from '../../primitives';
import type { CallStatsData } from '@coexist/wisp-core/types/CallStatsOverlay.types';
import {
  resolveStatsBackground,
  resolveStatsTextColor,
  resolveStatsLabelColor,
} from '@coexist/wisp-core/styles/CallStatsOverlay.styles';
import { useTheme } from '../../providers';

export interface CallStatsOverlayProps {
  stats: CallStatsData;
  visible?: boolean;
  onToggle?: () => void;
  style?: ViewStyle;
}

interface StatRow {
  label: string;
  value: string;
}

function formatStats(stats: CallStatsData): StatRow[] {
  const rows: StatRow[] = [];

  if (stats.resolution) {
    rows.push({ label: 'Resolution', value: `${stats.resolution.width}x${stats.resolution.height}` });
  }
  if (stats.frameRate != null) {
    rows.push({ label: 'Frame Rate', value: `${stats.frameRate} fps` });
  }
  if (stats.bitrate != null) {
    rows.push({ label: 'Bitrate', value: `${stats.bitrate} kbps` });
  }
  if (stats.packetLoss != null) {
    rows.push({ label: 'Packet Loss', value: `${stats.packetLoss.toFixed(1)}%` });
  }
  if (stats.codec) {
    rows.push({ label: 'Codec', value: stats.codec });
  }
  if (stats.roundTripTime != null) {
    rows.push({ label: 'RTT', value: `${stats.roundTripTime.toFixed(0)} ms` });
  }
  if (stats.jitter != null) {
    rows.push({ label: 'Jitter', value: `${stats.jitter.toFixed(1)} ms` });
  }

  return rows;
}

export const CallStatsOverlay = forwardRef<View, CallStatsOverlayProps>(function CallStatsOverlay(
  {
    stats,
    visible = true,
    onToggle,
    style: userStyle,
  },
  ref,
) {
  const { theme } = useTheme();
  const bgColor = resolveStatsBackground(theme);
  const textColor = resolveStatsTextColor(theme);
  const labelColor = resolveStatsLabelColor(theme);

  const rows = useMemo(() => formatStats(stats), [stats]);

  const containerStyle = useMemo<ViewStyle>(() => ({
    backgroundColor: bgColor,
    borderRadius: 8,
    padding: 10,
    gap: 4,
    minWidth: 160,
  }), [bgColor]);

  const headerStyle = useMemo<ViewStyle>(() => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  }), []);

  const titleStyle = useMemo<TextStyle>(() => ({
    fontSize: 10,
    fontWeight: '700',
    color: labelColor,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  }), [labelColor]);

  const toggleStyle = useMemo<TextStyle>(() => ({
    fontSize: 10,
    color: labelColor,
  }), [labelColor]);

  const rowStyle = useMemo<ViewStyle>(() => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  }), []);

  const labelStyle = useMemo<TextStyle>(() => ({
    fontSize: 11,
    color: labelColor,
  }), [labelColor]);

  const valueStyle = useMemo<TextStyle>(() => ({
    fontSize: 11,
    fontWeight: '600',
    color: textColor,
    fontVariant: ['tabular-nums'],
  }), [textColor]);

  if (!visible) {
    if (onToggle) {
      return (
        <Pressable onPress={onToggle} accessibilityLabel="Show call stats">
          <View style={{ backgroundColor: bgColor, borderRadius: 6, padding: 6 }}>
            <Text style={titleStyle}>Stats</Text>
          </View>
        </Pressable>
      );
    }
    return null;
  }

  return (
    <View ref={ref} style={[containerStyle, userStyle]}>
      <View style={headerStyle}>
        <Text style={titleStyle}>Call Stats</Text>
        {onToggle && (
          <Pressable onPress={onToggle} accessibilityLabel="Hide call stats">
            <Text style={toggleStyle}>Hide</Text>
          </Pressable>
        )}
      </View>

      {rows.length === 0 ? (
        <Text style={labelStyle}>Collecting data...</Text>
      ) : (
        rows.map((row) => (
          <View key={row.label} style={rowStyle}>
            <Text style={labelStyle}>{row.label}</Text>
            <Text style={valueStyle}>{row.value}</Text>
          </View>
        ))
      )}
    </View>
  );
});

CallStatsOverlay.displayName = 'CallStatsOverlay';
