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
import type { ViewStyle } from 'react-native';
import { Box, Text, useTheme } from '@coexist/wisp-react-native';
import { dbg } from '@/utils/debug';

// ─────────────────────────────────────────────────────────────────────────────
// HelpSection — Section with title header
// ─────────────────────────────────────────────────────────────────────────────

interface HelpSectionProps {
  title: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

export function HelpSection({ title, children, style }: HelpSectionProps) {
  if (__DEV__) dbg.trackRender('HelpSection');
  const { theme } = useTheme();
  const tc = theme.colors;

  return (
    <Box style={{ gap: 6, ...style }}>
      <Text
        size="xs"
        weight="bold"
        style={{
          color: tc.text.muted,
          textTransform: 'uppercase',
          letterSpacing: 0.8,
        }}
      >
        {title}
      </Text>
      {children}
    </Box>
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
    <Box style={style}>
      <Text size="sm" style={{ color: tc.text.secondary, lineHeight: 20 }}>
        {children}
      </Text>
    </Box>
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
    <Box
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        padding: 10,
        borderRadius: 8,
        backgroundColor: accentColor + '10',
        borderLeftWidth: 3,
        borderLeftColor: accentColor,
        ...style,
      }}
    >
      {icon && (
        <Box style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}>
          {typeof icon === 'string' ? (
            <Text size="lg" style={{ lineHeight: 28 }}>{icon}</Text>
          ) : (
            icon
          )}
        </Box>
      )}
      <Text
        size="xs"
        style={{
          color: theme.colors.text.primary,
          flex: 1,
          lineHeight: 18,
        }}
      >
        {children}
      </Text>
    </Box>
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
    <Box
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        paddingLeft: 4,
        ...style,
      }}
    >
      <Text
        size="md"
        style={{
          color: tc.text.muted,
          width: 20,
          textAlign: 'center',
          lineHeight: 22,
        }}
      >
        {icon || '\u2022'}
      </Text>
      <Text
        size="xs"
        style={{
          color: tc.text.secondary,
          flex: 1,
          lineHeight: 18,
        }}
      >
        {children}
      </Text>
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HelpDivider — Subtle separator line
// ─────────────────────────────────────────────────────────────────────────────

export function HelpDivider() {
  const { theme } = useTheme();

  return (
    <Box
      style={{
        height: 1,
        backgroundColor: theme.colors.border.subtle,
        marginVertical: 4,
      }}
    />
  );
}
