/**
 * FeatureCard — Individual feature documentation card.
 *
 * Shows an icon, title, status badge (Working, Beta, Coming Soon),
 * description, and optional how-to-use steps + limitations.
 */

import React from 'react';
import { View } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import { Text, useTheme } from '@coexist/wisp-react-native';

export type FeatureStatus = 'working' | 'beta' | 'coming-soon';

export interface FeatureCardProps {
  /** Feature title */
  title: string;
  /** Short description */
  description: string;
  /** Feature status */
  status: FeatureStatus;
  /** Icon element */
  icon?: React.ReactNode;
  /** How to use steps */
  howTo?: string[];
  /** Limitations or caveats */
  limitations?: string[];
}

const STATUS_CONFIG: Record<FeatureStatus, { label: string; bg: string; color: string }> = {
  working: { label: 'Working', bg: '#22C55E20', color: '#22C55E' },
  beta: { label: 'Beta', bg: '#EAB30820', color: '#EAB308' },
  'coming-soon': { label: 'Coming Soon', bg: '#6366F120', color: '#6366F1' },
};

export function FeatureCard({
  title,
  description,
  status,
  icon,
  howTo,
  limitations,
}: FeatureCardProps) {
  const { theme, mode } = useTheme();
  const tc = theme.colors;
  const isDark = mode === 'dark';
  const statusCfg = STATUS_CONFIG[status];

  const styles = React.useMemo(
    () => ({
      container: {
        borderRadius: 10,
        borderWidth: 1,
        borderColor: isDark ? '#27272A' : tc.border.subtle,
        backgroundColor: isDark ? '#09090B' : tc.background.canvas,
        padding: 14,
        gap: 10,
      } as ViewStyle,
      header: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: 10,
      } as ViewStyle,
      titleRow: {
        flex: 1,
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: 8,
      } as ViewStyle,
      title: {
        fontSize: 14,
        fontWeight: '600' as const,
        color: tc.text.primary,
      } as TextStyle,
      badge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        backgroundColor: statusCfg.bg,
      } as ViewStyle,
      badgeText: {
        fontSize: 11,
        fontWeight: '600' as const,
        color: statusCfg.color,
      } as TextStyle,
      description: {
        fontSize: 13,
        color: tc.text.secondary,
        lineHeight: 18,
      } as TextStyle,
      sectionLabel: {
        fontSize: 12,
        fontWeight: '600' as const,
        color: tc.text.muted,
        textTransform: 'uppercase' as const,
        letterSpacing: 0.5,
        marginTop: 4,
      } as TextStyle,
      step: {
        fontSize: 13,
        color: tc.text.primary,
        paddingLeft: 8,
        lineHeight: 20,
      } as TextStyle,
      limitation: {
        fontSize: 12,
        color: '#F59E0B',
        paddingLeft: 8,
        lineHeight: 18,
      } as TextStyle,
    }),
    [statusCfg, tc, isDark]
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {icon}
        <View style={styles.titleRow}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{statusCfg.label}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.description}>{description}</Text>

      {howTo && howTo.length > 0 && (
        <View>
          <Text style={styles.sectionLabel}>How to Use</Text>
          {howTo.map((step, i) => (
            <Text key={i} style={styles.step}>
              {i + 1}. {step}
            </Text>
          ))}
        </View>
      )}

      {limitations && limitations.length > 0 && (
        <View>
          <Text style={styles.sectionLabel}>Limitations</Text>
          {limitations.map((lim, i) => (
            <Text key={i} style={styles.limitation}>
              {'\u26A0'} {lim}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}
