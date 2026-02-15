/**
 * Friend page UI components.
 *
 * Follows the Wisp MemberList visual pattern for consistency:
 * - Collapsible sections with SVG chevron icons
 * - Avatar + status dot layout (matching MemberList)
 * - Wisp Button for all actions and interactions
 */

import React, { useState } from 'react';
import { View } from 'react-native';
import {
  Text, Button, HStack, VStack, Avatar,
  useTheme,
} from '@coexist/wisp-react-native';
import { ChevronDownIcon, ChevronRightIcon } from '@/components/icons';

// ---------------------------------------------------------------------------
// FriendListItem
// ---------------------------------------------------------------------------

export interface FriendAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onPress?: () => void;
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
        <Text size="sm" weight="medium">{name}</Text>
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

  return (
    <HStack
      style={{
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: flat ? 4 : 12,
        gap: 10,
        borderRadius: 4,
        marginHorizontal: flat ? 0 : 4,
      }}
    >
      {avatar ?? <Avatar name={name} size="sm" />}

      <VStack style={{ flex: 1, gap: 1 }}>
        <Text size="sm" weight="medium">{name}</Text>
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
          <Button variant="success" size="xs" onPress={onAccept}>
            Accept
          </Button>
          <Button variant="secondary" size="xs" onPress={onDecline}>
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
  children?: React.ReactNode;
}

export function FriendSection({
  title,
  count,
  emptyMessage,
  defaultCollapsed = false,
  children,
}: FriendSectionProps) {
  const { theme } = useTheme();
  const tc = theme.colors;
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const hasChildren = React.Children.count(children) > 0;
  const headerText = count !== undefined ? `${title} (${count})` : title;

  return (
    <View style={{ marginBottom: 12 }}>
      {/* Section header — matches wisp MemberList chevron + label pattern */}
      <Button
        variant="tertiary"
        size="xs"
        onPress={() => setCollapsed(!collapsed)}
        accessibilityLabel={`${headerText}, ${collapsed ? 'collapsed' : 'expanded'}`}
        iconLeft={
          collapsed
            ? <ChevronRightIcon size={12} color={tc.text.muted} />
            : <ChevronDownIcon size={12} color={tc.text.muted} />
        }
        style={{ justifyContent: 'flex-start', paddingHorizontal: 4, marginBottom: 2 }}
      >
        <Text size="xs" weight="semibold" style={{ textTransform: 'uppercase', letterSpacing: 0.6, color: tc.text.muted }}>
          {headerText}
        </Text>
      </Button>

      {/* Body */}
      {!collapsed && (
        <>
          {hasChildren ? (
            <View>{children}</View>
          ) : emptyMessage ? (
            <Text size="sm" style={{ color: tc.text.muted, paddingVertical: 12, textAlign: 'center' }}>
              {emptyMessage}
            </Text>
          ) : null}
        </>
      )}
    </View>
  );
}

