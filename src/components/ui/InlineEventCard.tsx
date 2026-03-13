/**
 * InlineEventCard — Reusable animated card for in-chat event notifications.
 *
 * Used for active calls, tutor events, file transfers, and other
 * real-time status cards rendered inline in the chat area.
 */

import React from 'react';
import type { ViewStyle } from 'react-native';
import { Box, Card, Text, useTheme } from '@coexist/wisp-react-native';
import { AnimatedPresence } from './AnimatedPresence';
import { dbg } from '@/utils/debug';

export interface InlineEventCardProps {
  /** Controls visibility — triggers slide-down animation. */
  visible: boolean;
  /** Accent color for the left border strip. */
  accentColor: string;
  /** Icon element rendered on the left. */
  icon: React.ReactNode;
  /** Primary title text. */
  title: string;
  /** Optional secondary text below the title. */
  subtitle?: string;
  /** Right-side action buttons or status content. */
  actions?: React.ReactNode;
  /** Optional extra content below the title row. */
  children?: React.ReactNode;
  /** Test ID for E2E testing. */
  testID?: string;
}

export function InlineEventCard({
  visible,
  accentColor,
  icon,
  title,
  subtitle,
  actions,
  children,
  testID,
}: InlineEventCardProps) {
  if (__DEV__) dbg.trackRender('InlineEventCard');
  const { theme } = useTheme();

  const cardStyle: ViewStyle = {
    borderLeftWidth: 3,
    borderLeftColor: accentColor,
    marginHorizontal: 12,
    marginVertical: 4,
  };

  return (
    <AnimatedPresence visible={visible} preset="slideDown">
      <Card
        testID={testID}
        variant="outlined"
        padding="sm"
        radius="sm"
        style={cardStyle}
      >
        <Box style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {icon}
          <Box style={{ flex: 1, gap: 2 }}>
            <Text size="sm" weight="semibold">{title}</Text>
            {subtitle ? <Text size="xs" style={{ color: theme.colors.text.muted }}>{subtitle}</Text> : null}
          </Box>
          {actions}
        </Box>
        {children}
      </Card>
    </AnimatedPresence>
  );
}
