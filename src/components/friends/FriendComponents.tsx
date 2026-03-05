/**
 * Friend page UI components.
 *
 * Follows the Wisp MemberList visual pattern for consistency:
 * - Collapsible sections with SVG chevron icons
 * - Avatar + status dot layout (matching MemberList)
 * - Wisp Button for all actions and interactions
 */

import React, { useCallback, useRef, useState } from 'react';
import { Animated, Platform, View } from 'react-native';
import { TEST_IDS } from '@/constants/test-ids';
import {
  Text, Button, HStack, VStack, Avatar, Collapse,
  useTheme,
} from '@coexist/wisp-react-native';
import { ChevronDownIcon, ChevronRightIcon } from '@/components/ui';

// ---------------------------------------------------------------------------
// FriendListItem
// ---------------------------------------------------------------------------

export interface FriendAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onPress?: (event?: any) => void;
}

export interface FriendListItemProps {
  name: string;
  username?: string;
  avatar?: React.ReactNode;
  status?: 'online' | 'idle' | 'dnd' | 'offline';
  statusText?: string;
  actions?: FriendAction[];
  flat?: boolean;
}

/** Map FriendListItem statuses to Wisp Avatar status values. */
function toAvatarStatus(status: string): 'online' | 'offline' | 'busy' | 'away' {
  switch (status) {
    case 'online': return 'online';
    case 'idle': return 'away';
    case 'dnd': return 'busy';
    default: return 'offline';
  }
}

export function FriendListItem({
  name,
  username,
  avatar,
  status = 'offline',
  statusText,
  actions,
  flat,
}: FriendListItemProps) {
  const { theme } = useTheme();
  const tc = theme.colors;

  return (
    <HStack
      testID={TEST_IDS.FRIENDS.CARD}
      style={{
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: flat ? 4 : 12,
        gap: 10,
        borderRadius: 4,
        marginHorizontal: flat ? 0 : 4,
      }}
    >
      {/* Avatar with built-in Wisp status indicator */}
      {avatar ?? <Avatar name={name} size="sm" status={toAvatarStatus(status)} />}

      {/* Info */}
      <VStack style={{ flex: 1, gap: 1 }}>
        <Text testID={TEST_IDS.FRIENDS.CARD_NAME} size="sm" weight="medium">{name}</Text>
        {(username || statusText) && (
          <Text size="xs" style={{ color: tc.text.muted }} numberOfLines={1}>
            {statusText || username}
          </Text>
        )}
      </VStack>

      {/* Actions */}
      {actions && actions.length > 0 && (
        <HStack style={{ gap: 6 }}>
          {actions.map((a) => (
            <Button
              key={a.id}
              variant="tertiary"
              size="md"
              onPress={a.onPress}
              accessibilityLabel={a.label}
              iconLeft={a.icon}
            />
          ))}
        </HStack>
      )}
    </HStack>
  );
}

// ---------------------------------------------------------------------------
// FriendRequestItem
// ---------------------------------------------------------------------------

export interface FriendRequestItemProps {
  name: string;
  username?: string;
  avatar?: React.ReactNode;
  type: 'incoming' | 'outgoing';
  timestamp?: string;
  onAccept?: () => void;
  onDecline?: () => void;
  onCancel?: () => void;
  flat?: boolean;
}

export function FriendRequestItem({
  name,
  username,
  avatar,
  type,
  timestamp,
  onAccept,
  onDecline,
  onCancel,
  flat,
}: FriendRequestItemProps) {
  const { theme } = useTheme();
  const tc = theme.colors;
  const glowOpacity = useRef(new Animated.Value(0)).current;

  const handleAccept = useCallback(() => {
    // Green glow burst
    glowOpacity.setValue(0.4);
    Animated.timing(glowOpacity, {
      toValue: 0,
      duration: 500,
      useNativeDriver: false,
    }).start();
    onAccept?.();
  }, [onAccept, glowOpacity]);

  return (
    <Animated.View
      style={[
        {
          borderRadius: 4,
          marginHorizontal: flat ? 0 : 4,
        },
        Platform.OS === 'web' ? {
          boxShadow: glowOpacity.interpolate({
            inputRange: [0, 0.4],
            outputRange: ['0 0 0px transparent', `0 0 12px ${tc.status.success}`],
          }),
        } as any : {},
      ]}
    >
      <HStack
        testID={TEST_IDS.FRIENDS.CARD}
        style={{
          alignItems: 'center',
          paddingVertical: 6,
          paddingHorizontal: flat ? 4 : 12,
          gap: 10,
        }}
      >
        {avatar ?? <Avatar name={name} size="sm" />}

        <VStack style={{ flex: 1, gap: 1 }}>
          <Text testID={TEST_IDS.FRIENDS.CARD_NAME} size="sm" weight="medium">{name}</Text>
          {username && (
            <Text size="xs" style={{ color: tc.text.muted }} numberOfLines={1}>
              {username}
            </Text>
          )}
          {timestamp && (
            <Text size="xs" style={{ color: tc.text.muted, marginTop: 1 }}>{timestamp}</Text>
          )}
        </VStack>

        {type === 'incoming' && (
          <HStack style={{ gap: 6 }}>
            <Button testID={TEST_IDS.FRIENDS.CARD_ACCEPT} variant="success" size="xs" onPress={handleAccept}>
              Accept
            </Button>
            <Button testID={TEST_IDS.FRIENDS.CARD_REJECT} variant="secondary" size="xs" onPress={onDecline}>
              Decline
            </Button>
          </HStack>
        )}

        {type === 'outgoing' && (
          <Button variant="secondary" size="xs" onPress={onCancel}>
            Cancel
          </Button>
        )}
      </HStack>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// FriendSection — matches MemberList section header pattern
// ---------------------------------------------------------------------------

export interface FriendSectionProps {
  title: string;
  count?: number;
  emptyMessage?: string;
  defaultCollapsed?: boolean;
  headerRight?: React.ReactNode;
  children?: React.ReactNode;
}

export function FriendSection({
  title,
  count,
  emptyMessage,
  defaultCollapsed = false,
  headerRight,
  children,
}: FriendSectionProps) {
  const { theme } = useTheme();
  const tc = theme.colors;
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const chevronRotation = useRef(new Animated.Value(defaultCollapsed ? 0 : 1)).current;

  const hasChildren = React.Children.count(children) > 0;
  const headerText = count !== undefined ? `${title} (${count})` : title;

  const handleToggle = useCallback(() => {
    const next = !collapsed;
    setCollapsed(next);
    Animated.spring(chevronRotation, {
      toValue: next ? 0 : 1,
      tension: 300,
      friction: 20,
      useNativeDriver: true,
    }).start();
  }, [collapsed, chevronRotation]);

  const chevronStyle = {
    transform: [{
      rotate: chevronRotation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '90deg'],
      }),
    }],
  };

  return (
    <View style={{ marginBottom: 12 }}>
      {/* Section header — matches wisp MemberList chevron + label pattern */}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Button
          variant="tertiary"
          size="xs"
          onPress={handleToggle}
          accessibilityLabel={`${headerText}, ${collapsed ? 'collapsed' : 'expanded'}`}
          iconLeft={
            <Animated.View style={chevronStyle}>
              <ChevronRightIcon size={12} color={tc.text.muted} />
            </Animated.View>
          }
          style={{ justifyContent: 'flex-start', paddingHorizontal: 4, marginBottom: 2 }}
        >
          <Text size="xs" weight="semibold" style={{ textTransform: 'uppercase', letterSpacing: 0.6, color: tc.text.muted }}>
            {headerText}
          </Text>
        </Button>
        {headerRight && <View style={{ marginLeft: 4 }}>{headerRight}</View>}
      </View>

      {/* Body — animated collapse */}
      <Collapse open={!collapsed}>
        {hasChildren ? (
          <View>{children}</View>
        ) : emptyMessage ? (
          <Text size="sm" style={{ color: tc.text.muted, paddingVertical: 12, textAlign: 'center' }}>
            {emptyMessage}
          </Text>
        ) : null}
      </Collapse>
    </View>
  );
}

