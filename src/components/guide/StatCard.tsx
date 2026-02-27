/**
 * StatCard — Data visualization card.
 *
 * Shows a single statistic with label, value, and optional
 * color accent. Used for quick-glance app statistics.
 */

import React from 'react';
import { View } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import { Text, useTheme } from '@coexist/wisp-react-native';

export interface StatCardProps {
  /** Stat label */
  label: string;
  /** Stat value */
  value: string | number;
  /** Optional icon */
  icon?: React.ReactNode;
  /** Accent color */
  color?: string;
}

export function StatCard({ label, value, icon, color = '#3B82F6' }: StatCardProps) {
  const { theme, mode } = useTheme();
  const tc = theme.colors;
  const isDark = mode === 'dark';

  const styles = React.useMemo(
    () => ({
      container: {
        flex: 1,
        minWidth: 120,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: isDark ? '#27272A' : tc.border.subtle,
        backgroundColor: isDark ? '#09090B' : tc.background.canvas,
        padding: 14,
        gap: 6,
      } as ViewStyle,
      iconRow: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: 8,
      } as ViewStyle,
      value: {
        fontSize: 24,
        fontWeight: '700' as const,
        color: color,
      } as TextStyle,
      label: {
        fontSize: 12,
        color: tc.text.muted,
        fontWeight: '500' as const,
        textTransform: 'uppercase' as const,
        letterSpacing: 0.5,
      } as TextStyle,
    }),
    [color, tc, isDark]
  );

  return (
    <View style={styles.container}>
      <View style={styles.iconRow}>
        {icon}
        <Text style={styles.value}>{value}</Text>
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}
