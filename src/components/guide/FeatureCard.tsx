/**
 * FeatureCard — Individual feature documentation card.
 *
 * Shows an icon, title, status badge (Working, Beta, Coming Soon),
 * description, and optional how-to-use steps + limitations.
 * Also displays test coverage info and links to source code and tests.
 */

import React from 'react';
import { View, Pressable, Linking } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import { Text, useTheme } from '@coexist/wisp-react-native';
import { ExternalLinkIcon, CheckCircleIcon, CodeIcon } from '@/components/ui';

export type FeatureStatus = 'working' | 'beta' | 'coming-soon';

export interface SourceLink {
  /** Display label for the source link */
  label: string;
  /** Relative path from repo root (e.g. 'packages/umbra-core/src/crypto/encryption.rs') */
  path: string;
}

export interface TestLink {
  /** Display label for the test file */
  label: string;
  /** Relative path from repo root (e.g. '__tests__/hooks/useMessages.test.ts') */
  path: string;
}

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
  /** Links to source code in the repository */
  sourceLinks?: SourceLink[];
  /** Links to test files in the repository */
  testLinks?: TestLink[];
}

const REPO_BASE = 'https://github.com/InfamousVague/Umbra/blob/main';

// Status colors are resolved dynamically in the component using theme tokens.
// This maps each status to the theme token keys used.
const STATUS_CONFIG_KEYS: Record<FeatureStatus, { label: string; tokenKey: 'success' | 'warning' | 'info' }> = {
  working: { label: 'Working', tokenKey: 'success' },
  beta: { label: 'Beta', tokenKey: 'warning' },
  'coming-soon': { label: 'Coming Soon', tokenKey: 'info' },
};

function openLink(path: string) {
  const url = `${REPO_BASE}/${path}`;
  Linking.openURL(url).catch(() => {});
}

export function FeatureCard({
  title,
  description,
  status,
  icon,
  howTo,
  limitations,
  sourceLinks,
  testLinks,
}: FeatureCardProps) {
  const { theme, mode } = useTheme();
  const tc = theme.colors;
  const isDark = mode === 'dark';
  const statusCfg = STATUS_CONFIG_KEYS[status];
  const statusColor = tc.status[statusCfg.tokenKey];
  const statusSurfaceKey = `${statusCfg.tokenKey}Surface` as keyof typeof tc.status;
  const statusBg = tc.status[statusSurfaceKey] ?? `${statusColor}20`;

  const styles = React.useMemo(
    () => ({
      container: {
        borderRadius: 10,
        borderWidth: 1,
        borderColor: tc.border.subtle,
        backgroundColor: tc.background.sunken,
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
        backgroundColor: statusBg,
      } as ViewStyle,
      badgeText: {
        fontSize: 11,
        fontWeight: '600' as const,
        color: statusColor,
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
        color: tc.status.warning,
        paddingLeft: 8,
        lineHeight: 18,
      } as TextStyle,
      sourceRow: {
        flexDirection: 'row' as const,
        flexWrap: 'wrap' as const,
        alignItems: 'center' as const,
        gap: 6,
        marginTop: 2,
      } as ViewStyle,
      sourceChip: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        backgroundColor: tc.background.raised,
        borderWidth: 1,
        borderColor: tc.border.subtle,
        cursor: 'pointer',
      } as ViewStyle,
      sourceLabel: {
        fontSize: 11,
        color: tc.status.info,
        fontFamily: 'monospace',
      } as TextStyle,
    }),
    [statusColor, statusBg, tc, isDark]
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

      {sourceLinks && sourceLinks.length > 0 && (
        <View style={styles.sourceRow}>
          <CodeIcon size={10} color={tc.text.muted} />
          <Text style={{ fontSize: 10, color: tc.text.muted, marginRight: 2 }}>Source:</Text>
          {sourceLinks.map((link, i) => (
            <Pressable
              key={i}
              onPress={() => openLink(link.path)}
              style={({ pressed }) => [
                styles.sourceChip,
                pressed && { opacity: 0.7 },
              ]}
              accessibilityLabel={`View source: ${link.label}`}
            >
              <Text style={styles.sourceLabel}>{link.label}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {testLinks && testLinks.length > 0 && (
        <View style={styles.sourceRow}>
          <CheckCircleIcon size={10} color="#22C55E" />
          <Text style={{ fontSize: 10, color: tc.text.muted, marginRight: 2 }}>Tests:</Text>
          {testLinks.map((link, i) => (
            <Pressable
              key={i}
              onPress={() => openLink(link.path)}
              style={({ pressed }) => [
                styles.sourceChip,
                { borderColor: '#22C55E40', backgroundColor: '#22C55E10' },
                pressed && { opacity: 0.7 },
              ]}
              accessibilityLabel={`View test: ${link.label}`}
            >
              <Text style={[styles.sourceLabel, { color: '#22C55E' }]}>{link.label}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
