/**
 * GuideSection — Collapsible section with icon header.
 *
 * Each section in the guide has a vibrant icon, title, and
 * expand/collapse capability. When collapsed, only the header
 * is shown; when expanded, children content blocks are revealed.
 */

import React, { useState, useCallback } from 'react';
import { View, Pressable, LayoutAnimation, Platform, UIManager } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import { Text, useTheme } from '@coexist/wisp-react-native';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export interface GuideSectionProps {
  /** Section title */
  title: string;
  /** Optional subtitle/description */
  subtitle?: string;
  /** Icon element to show in header */
  icon: React.ReactNode;
  /** Background color for icon container */
  iconBg?: string;
  /** Whether the section starts expanded */
  defaultExpanded?: boolean;
  /** Extra content to render below subtitle (e.g., badges) */
  headerExtra?: React.ReactNode;
  /** Children content */
  children: React.ReactNode;
}

export function GuideSection({
  title,
  subtitle,
  icon,
  iconBg = '#3B82F6',
  defaultExpanded = false,
  headerExtra,
  children,
}: GuideSectionProps) {
  const { theme, mode } = useTheme();
  const tc = theme.colors;
  const isDark = mode === 'dark';
  const [expanded, setExpanded] = useState(defaultExpanded);

  const toggleExpanded = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  }, []);

  const styles = React.useMemo(
    () => ({
      container: {
        borderRadius: 12,
        borderWidth: 1,
        borderColor: isDark ? '#27272A' : tc.border.subtle,
        backgroundColor: isDark ? '#18181B' : tc.background.sunken,
        overflow: 'hidden' as const,
      } as ViewStyle,
      header: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        padding: 16,
        gap: 12,
      } as ViewStyle,
      iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: iconBg,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
      } as ViewStyle,
      titleContainer: {
        flex: 1,
      } as ViewStyle,
      title: {
        fontSize: 16,
        fontWeight: '600' as const,
        color: tc.text.primary,
      } as TextStyle,
      subtitle: {
        fontSize: 13,
        color: tc.text.secondary,
        marginTop: 2,
      } as TextStyle,
      chevron: {
        fontSize: 18,
        color: tc.text.muted,
        fontWeight: '600' as const,
      } as TextStyle,
      content: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        gap: 12,
      } as ViewStyle,
    }),
    [iconBg, tc, isDark]
  );

  return (
    <View style={styles.container}>
      <Pressable
        onPress={toggleExpanded}
        style={styles.header}
        accessibilityRole="button"
        accessibilityLabel={`${title} section, ${expanded ? 'collapse' : 'expand'}`}
      >
        <View style={styles.iconContainer}>{icon}</View>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          {headerExtra}
        </View>
        <Text style={styles.chevron}>{expanded ? '\u25B2' : '\u25BC'}</Text>
      </Pressable>

      {expanded && <View style={styles.content}>{children}</View>}
    </View>
  );
}
