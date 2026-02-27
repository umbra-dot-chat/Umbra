/**
 * TechSpec — Technical specification blocks.
 *
 * Displays crypto algorithms, protocol versions,
 * data storage details, and network architecture info.
 */

import React from 'react';
import { View } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import { Text, useTheme } from '@coexist/wisp-react-native';

export interface TechSpecEntry {
  label: string;
  value: string;
}

export interface TechSpecProps {
  /** Title of the spec block */
  title: string;
  /** Entries to display */
  entries: TechSpecEntry[];
  /** Optional accent color */
  accentColor?: string;
}

export function TechSpec({ title, entries, accentColor = '#3B82F6' }: TechSpecProps) {
  const { theme, mode } = useTheme();
  const tc = theme.colors;
  const isDark = mode === 'dark';

  const styles = React.useMemo(
    () => ({
      container: {
        borderRadius: 10,
        borderWidth: 1,
        borderColor: isDark ? '#27272A' : tc.border.subtle,
        backgroundColor: isDark ? '#09090B' : tc.background.canvas,
        overflow: 'hidden' as const,
      } as ViewStyle,
      header: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: 8,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: isDark ? '#27272A' : tc.border.subtle,
        backgroundColor: isDark ? '#18181B' : tc.background.sunken,
      } as ViewStyle,
      headerDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: accentColor,
      } as ViewStyle,
      title: {
        fontSize: 13,
        fontWeight: '600' as const,
        color: tc.text.primary,
        textTransform: 'uppercase' as const,
        letterSpacing: 0.5,
      } as TextStyle,
      row: {
        flexDirection: 'row' as const,
        justifyContent: 'space-between' as const,
        alignItems: 'center' as const,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: isDark ? '#1A1A1E' : tc.border.subtle,
      } as ViewStyle,
      label: {
        fontSize: 13,
        color: tc.text.secondary,
        fontWeight: '500' as const,
      } as TextStyle,
      value: {
        fontSize: 13,
        color: tc.text.primary,
        fontFamily: 'monospace',
        maxWidth: '60%' as unknown as number,
        textAlign: 'right' as const,
      } as TextStyle,
    }),
    [accentColor, tc, isDark]
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerDot} />
        <Text style={styles.title}>{title}</Text>
      </View>
      {entries.map((entry, i) => (
        <View
          key={i}
          style={[styles.row, i === entries.length - 1 && { borderBottomWidth: 0 }]}
        >
          <Text style={styles.label}>{entry.label}</Text>
          <Text style={styles.value} numberOfLines={1}>
            {entry.value}
          </Text>
        </View>
      ))}
    </View>
  );
}
