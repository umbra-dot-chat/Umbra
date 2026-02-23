/**
 * AccountSwitcher — Popover that shows stored accounts for quick switching.
 *
 * Appears when the user taps their avatar bubble in the NavigationRail.
 * - Tap a different account → switch to it
 * - Tap the currently active account → open profile settings
 * - "Add Account" button → navigate to auth screen to create/import
 */

import React, { useCallback } from 'react';
import { Image, Platform, Pressable, ScrollView, View } from 'react-native';
import type { ViewStyle } from 'react-native';
import { Text, useTheme } from '@coexist/wisp-react-native';
import { PlusIcon, CheckIcon } from '@/components/icons';
import type { StoredAccount } from '@/contexts/AuthContext';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface AccountSwitcherProps {
  /** Whether the popover is visible */
  open: boolean;
  /** Close the popover */
  onClose: () => void;
  /** All stored accounts */
  accounts: StoredAccount[];
  /** DID of the currently active account */
  activeAccountDid: string | null;
  /** Switch to a different account */
  onSwitchAccount: (did: string) => void;
  /** Active account tapped — open profile settings */
  onActiveAccountPress: () => void;
  /** Add a new account — navigate to auth flow */
  onAddAccount: () => void;
  /** Anchor position for the popover */
  anchor?: { x: number; y: number };
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const POPOVER_WIDTH = 240;
const AVATAR_SIZE = 36;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AccountSwitcher({
  open,
  onClose,
  accounts,
  activeAccountDid,
  onSwitchAccount,
  onActiveAccountPress,
  onAddAccount,
  anchor,
}: AccountSwitcherProps) {
  const { theme } = useTheme();
  const tc = theme.colors;

  const handleAccountPress = useCallback(
    (did: string) => {
      if (did === activeAccountDid) {
        onClose();
        onActiveAccountPress();
      } else {
        onClose();
        onSwitchAccount(did);
      }
    },
    [activeAccountDid, onClose, onSwitchAccount, onActiveAccountPress],
  );

  const handleAddPress = useCallback(() => {
    onClose();
    onAddAccount();
  }, [onClose, onAddAccount]);

  if (!open) return null;

  // Position the popover above and to the right of the avatar bubble
  const popoverStyle: ViewStyle = {
    position: 'absolute',
    bottom: anchor ? undefined : 80,
    left: anchor ? anchor.x + 8 : 72,
    top: anchor ? Math.max(anchor.y - (accounts.length * 52 + 80), 16) : undefined,
    zIndex: 9999,
    width: POPOVER_WIDTH,
    borderRadius: 12,
    backgroundColor: tc.background.surface,
    borderWidth: 1,
    borderColor: tc.border.subtle,
    overflow: 'hidden',
    ...(Platform.OS === 'web'
      ? ({ boxShadow: '0 8px 32px rgba(0,0,0,0.25)' } as any)
      : {}),
  };

  return (
    <>
      {/* Backdrop — press to dismiss */}
      <Pressable
        onPress={onClose}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9998,
        }}
        accessibilityRole="button"
        accessibilityLabel="Close account switcher"
      />

      {/* Popover */}
      <View style={popoverStyle}>
        {/* Header */}
        <View
          style={{
            paddingHorizontal: 14,
            paddingTop: 12,
            paddingBottom: 8,
            borderBottomWidth: 1,
            borderBottomColor: tc.border.subtle,
          }}
        >
          <Text size="sm" weight="semibold" style={{ color: tc.text.primary }}>
            Accounts
          </Text>
        </View>

        {/* Account list */}
        <ScrollView
          style={{ maxHeight: 260 }}
          showsVerticalScrollIndicator={false}
        >
          {accounts.map((account) => {
            const isActive = account.did === activeAccountDid;
            return (
              <Pressable
                key={account.did}
                onPress={() => handleAccountPress(account.did)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  backgroundColor: pressed
                    ? tc.background.sunken
                    : isActive
                      ? tc.background.surface
                      : 'transparent',
                })}
              >
                {/* Avatar */}
                <View
                  style={{
                    width: AVATAR_SIZE,
                    height: AVATAR_SIZE,
                    borderRadius: AVATAR_SIZE / 2,
                    backgroundColor: tc.accent.primary,
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    marginRight: 10,
                    flexShrink: 0,
                  }}
                >
                  {account.avatar ? (
                    <Image
                      source={{ uri: account.avatar }}
                      style={{ width: AVATAR_SIZE, height: AVATAR_SIZE }}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text
                      size="sm"
                      weight="bold"
                      style={{ color: tc.text.inverse }}
                    >
                      {(account.displayName ?? '?').charAt(0).toUpperCase()}
                    </Text>
                  )}
                </View>

                {/* Name + DID */}
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text
                    size="sm"
                    weight={isActive ? 'semibold' : 'regular'}
                    style={{ color: tc.text.primary }}
                    numberOfLines={1}
                  >
                    {account.displayName}
                  </Text>
                  <Text
                    size="xs"
                    style={{ color: tc.text.secondary, marginTop: 1 }}
                    numberOfLines={1}
                  >
                    {account.did.slice(0, 24)}...
                  </Text>
                </View>

                {/* Active indicator */}
                {isActive && (
                  <CheckIcon size={16} color={tc.accent.primary} />
                )}
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Add account button */}
        <Pressable
          onPress={handleAddPress}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderTopWidth: 1,
            borderTopColor: tc.border.subtle,
            backgroundColor: pressed ? tc.background.sunken : 'transparent',
          })}
        >
          <View
            style={{
              width: AVATAR_SIZE,
              height: AVATAR_SIZE,
              borderRadius: AVATAR_SIZE / 2,
              backgroundColor: tc.background.sunken,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 10,
              borderWidth: 1,
              borderColor: tc.border.subtle,
              borderStyle: 'dashed',
            }}
          >
            <PlusIcon size={16} color={tc.text.secondary} />
          </View>
          <Text size="sm" style={{ color: tc.text.secondary }}>
            Add Account
          </Text>
        </Pressable>
      </View>
    </>
  );
}
