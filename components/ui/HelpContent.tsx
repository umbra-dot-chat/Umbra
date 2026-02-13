/**
 * HelpContent — Composable content helpers for help indicator popups.
 *
 * Adapted from Wraith's RichTooltipContent for React Native. Provides
 * consistent, themed building blocks for help popup content.
 *
 * ## Usage
 *
 * ```tsx
 * <HelpIndicator id="my-hint" title="What is this?">
 *   <HelpText>Explanation text goes here.</HelpText>
 *   <HelpHighlight icon="key">Important detail here.</HelpHighlight>
 *   <HelpListItem>First point</HelpListItem>
 *   <HelpListItem>Second point</HelpListItem>
 * </HelpIndicator>
 * ```
 */

import React from 'react';
import { View, Text as RNText } from 'react-native';
import type { ViewStyle } from 'react-native';
import { useTheme } from '@coexist/wisp-react-native';

// ─────────────────────────────────────────────────────────────────────────────
// HelpSection — Section with title header
// ─────────────────────────────────────────────────────────────────────────────

interface HelpSectionProps {
  title: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

export function HelpSection({ title, children, style }: HelpSectionProps) {
  const { theme } = useTheme();
  const tc = theme.colors;

  return (
    <View style={[{ gap: 6 }, style]}>
      <RNText
        style={{
          fontSize: 10,
          fontWeight: '700',
          color: tc.text.muted,
          textTransform: 'uppercase',
          letterSpacing: 0.8,
        }}
      >
        {title}
      </RNText>
      {children}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HelpText — Body text paragraph
// ─────────────────────────────────────────────────────────────────────────────

interface HelpTextProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function HelpText({ children, style }: HelpTextProps) {
  const { theme } = useTheme();
  const tc = theme.colors;

  return (
    <View style={style}>
      <RNText
        style={{
          fontSize: 13,
          lineHeight: 20,
          color: tc.text.secondary,
        }}
      >
        {children}
      </RNText>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HelpHighlight — Colored callout box with optional emoji/icon
// ─────────────────────────────────────────────────────────────────────────────

interface HelpHighlightProps {
  children: React.ReactNode;
  /** Lucide icon component or fallback string */
  icon?: React.ReactNode;
  color?: string;
  style?: ViewStyle;
}

export function HelpHighlight({ children, icon, color, style }: HelpHighlightProps) {
  const { theme } = useTheme();
  const accentColor = color || theme.colors.accent.primary;

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 8,
          padding: 10,
          borderRadius: 8,
          backgroundColor: accentColor + '10',
          borderLeftWidth: 3,
          borderLeftColor: accentColor,
        },
        style,
      ]}
    >
      {icon && (
        <View style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}>
          {typeof icon === 'string' ? (
            <RNText style={{ fontSize: 20, lineHeight: 28 }}>{icon}</RNText>
          ) : (
            icon
          )}
        </View>
      )}
      <RNText
        style={{
          fontSize: 12,
          lineHeight: 18,
          color: theme.colors.text.primary,
          flex: 1,
        }}
      >
        {children}
      </RNText>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HelpListItem — Bullet point item
// ─────────────────────────────────────────────────────────────────────────────

interface HelpListItemProps {
  children: React.ReactNode;
  icon?: string;
  style?: ViewStyle;
}

export function HelpListItem({ children, icon, style }: HelpListItemProps) {
  const { theme } = useTheme();
  const tc = theme.colors;

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 8,
          paddingLeft: 4,
        },
        style,
      ]}
    >
      <RNText
        style={{
          fontSize: 16,
          lineHeight: 22,
          color: tc.text.muted,
          width: 20,
          textAlign: 'center',
        }}
      >
        {icon || '\u2022'}
      </RNText>
      <RNText
        style={{
          fontSize: 12,
          lineHeight: 18,
          color: tc.text.secondary,
          flex: 1,
        }}
      >
        {children}
      </RNText>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HelpDivider — Subtle separator line
// ─────────────────────────────────────────────────────────────────────────────

export function HelpDivider() {
  const { theme } = useTheme();

  return (
    <View
      style={{
        height: 1,
        backgroundColor: theme.colors.border.subtle,
        marginVertical: 4,
      }}
    />
  );
}
