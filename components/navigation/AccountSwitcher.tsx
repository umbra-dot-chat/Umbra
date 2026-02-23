/**
 * AccountSwitcher — Popover that shows stored accounts for quick switching.
 *
 * Appears when the user taps their avatar bubble in the NavigationRail.
 * - Tap a different account → switch to it
 * - Tap the currently active account → open profile settings
 * - "Add Account" button → navigate to auth screen to create/import
 * - Trash icon on each account → remove account (requires PIN if set)
 */

import React, { useCallback, useState, useRef } from 'react';
import { Image, Platform, Pressable, ScrollView, View, Animated } from 'react-native';
import type { ViewStyle } from 'react-native';
import { Text, useTheme } from '@coexist/wisp-react-native';
import { PlusIcon, CheckIcon, TrashIcon } from '@/components/icons';
import { GrowablePinInput } from '@/components/auth/GrowablePinInput';
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
  /** Remove an account from the stored list */
  onRemoveAccount?: (did: string) => void;
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
  onRemoveAccount,
  anchor,
}: AccountSwitcherProps) {
  const { theme } = useTheme();
  const tc = theme.colors;

  // Remove account flow state
  const [removeTarget, setRemoveTarget] = useState<StoredAccount | null>(null);
  const [pinValue, setPinValue] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const resetRemoveState = useCallback(() => {
    setRemoveTarget(null);
    setPinValue('');
    setPinError(null);
  }, []);

  // Reset state when popover closes
  const handleClose = useCallback(() => {
    resetRemoveState();
    onClose();
  }, [onClose, resetRemoveState]);

  const handleAccountPress = useCallback(
    (did: string) => {
      if (removeTarget) return; // Ignore taps during remove flow
      if (did === activeAccountDid) {
        handleClose();
        onActiveAccountPress();
      } else {
        handleClose();
        onSwitchAccount(did);
      }
    },
    [activeAccountDid, handleClose, onSwitchAccount, onActiveAccountPress, removeTarget],
  );

  const handleAddPress = useCallback(() => {
    handleClose();
    onAddAccount();
  }, [handleClose, onAddAccount]);

  // Initiate remove: if account has PIN, show PIN input; otherwise confirm
  const handleRemovePress = useCallback((account: StoredAccount) => {
    if (account.pin) {
      setRemoveTarget(account);
      setPinValue('');
      setPinError(null);
    } else {
      // No PIN — remove directly
      onRemoveAccount?.(account.did);
      resetRemoveState();
    }
  }, [onRemoveAccount, resetRemoveState]);

  const triggerShake = useCallback(() => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 4, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  // PIN verification for remove
  const handlePinComplete = useCallback((pin: string) => {
    if (!removeTarget) return;
    if (pin === removeTarget.pin) {
      onRemoveAccount?.(removeTarget.did);
      resetRemoveState();
    } else {
      setPinError('Incorrect PIN');
      setPinValue('');
      triggerShake();
    }
  }, [removeTarget, onRemoveAccount, resetRemoveState, triggerShake]);

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

  // PIN verification view (replaces account list when removing a PIN-protected account)
  if (removeTarget) {
    return (
      <>
        <Pressable
          onPress={handleClose}
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 9998,
          }}
          accessibilityRole="button"
          accessibilityLabel="Close account switcher"
        />
        <View style={popoverStyle}>
          <View style={{ padding: 16, alignItems: 'center' }}>
            <Text size="sm" weight="semibold" style={{ color: tc.text.primary, marginBottom: 4 }}>
              Remove Account
            </Text>
            <Text size="xs" align="center" style={{ color: tc.text.secondary, marginBottom: 16 }}>
              Enter PIN for {removeTarget.displayName}
            </Text>

            <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
              <GrowablePinInput
                minLength={5}
                maxLength={5}
                value={pinValue}
                onChange={setPinValue}
                onComplete={handlePinComplete}
                mask
                autoFocus
                error={!!pinError}
                cellSize={36}
                gap={6}
              />
            </Animated.View>

            {pinError && (
              <Text size="xs" style={{ color: tc.status?.dangerText ?? '#ef4444', marginTop: 8 }}>
                {pinError}
              </Text>
            )}

            <Pressable onPress={resetRemoveState} style={{ marginTop: 12 }}>
              <Text size="xs" style={{ color: tc.text.secondary, textDecorationLine: 'underline' }}>
                Cancel
              </Text>
            </Pressable>
          </View>
        </View>
      </>
    );
  }

  return (
    <>
      {/* Backdrop — press to dismiss */}
      <Pressable
        onPress={handleClose}
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
                <View style={{ flex: 1, marginRight: 4 }}>
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

                {/* Active indicator or remove button */}
                {isActive ? (
                  <CheckIcon size={16} color={tc.accent.primary} />
                ) : onRemoveAccount ? (
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation?.();
                      handleRemovePress(account);
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={({ pressed }) => ({
                      padding: 4,
                      borderRadius: 4,
                      opacity: pressed ? 0.5 : 0.4,
                    })}
                  >
                    <TrashIcon size={14} color={tc.text.muted} />
                  </Pressable>
                ) : null}
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
