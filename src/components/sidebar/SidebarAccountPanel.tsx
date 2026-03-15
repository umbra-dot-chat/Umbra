/**
 * SidebarAccountPanel — Inline sidebar section for account switching.
 *
 * Renders as a native sidebar section matching the "CONVERSATIONS" pattern.
 * Shows all stored accounts with switch/profile actions, and an "Add Account" button.
 */

import React, { useCallback, useState, useRef, useEffect } from 'react';
import { Animated, Easing, Image, Pressable, ScrollView } from 'react-native';
import {
  Box,
  Button,
  Text,
  useTheme,
} from '@coexist/wisp-react-native';
import { CheckIcon, PlusIcon, TrashIcon, XIcon } from '@/components/ui';
import { GrowablePinInput } from '@/components/auth/GrowablePinInput';
import type { StoredAccount } from '@/contexts/AuthContext';
import { dbg } from '@/utils/debug';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ANIM_DURATION_IN = 200;
const ANIM_DURATION_OUT = 150;
const SLIDE_DISTANCE = 80;
const AVATAR_SIZE = 36;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface SidebarAccountPanelProps {
  onClose?: () => void;
  accounts: StoredAccount[];
  activeAccountDid: string | null;
  onSwitchAccount: (did: string) => void;
  onActiveAccountPress: () => void;
  onAddAccount: () => void;
  onRemoveAccount?: (did: string) => void;
}

export function SidebarAccountPanel({
  onClose,
  accounts,
  activeAccountDid,
  onSwitchAccount,
  onActiveAccountPress,
  onAddAccount,
  onRemoveAccount,
}: SidebarAccountPanelProps) {
  if (__DEV__) dbg.trackRender('SidebarAccountPanel');
  const { theme } = useTheme();
  const tc = theme.colors;

  // Animation — slide up + fade in
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(SLIDE_DISTANCE)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: ANIM_DURATION_IN,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: ANIM_DURATION_IN,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

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

  const handleAccountPress = useCallback(
    (did: string) => {
      if (removeTarget) return;
      if (did === activeAccountDid) {
        onClose?.();
        onActiveAccountPress();
      } else {
        onClose?.();
        onSwitchAccount(did);
      }
    },
    [activeAccountDid, onClose, onSwitchAccount, onActiveAccountPress, removeTarget],
  );

  const handleAddPress = useCallback(() => {
    onClose?.();
    onAddAccount();
  }, [onClose, onAddAccount]);

  const handleRemovePress = useCallback((account: StoredAccount) => {
    if (account.pin) {
      setRemoveTarget(account);
      setPinValue('');
      setPinError(null);
    } else {
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

  const handleClose = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: ANIM_DURATION_OUT,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: SLIDE_DISTANCE,
        duration: ANIM_DURATION_OUT,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose?.();
    });
  }, [fadeAnim, slideAnim, onClose]);

  return (
    <Animated.View
      style={{
        flex: 1,
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      {/* Section header */}
      <Box style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingTop: 12, paddingBottom: 8 }}>
        <Text size="xs" weight="semibold" style={{ color: tc.text.onRaisedSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Accounts
        </Text>
        <Button
          variant="tertiary"
          onSurface
          size="xs"
          onPress={handleClose}
          accessibilityLabel="Close accounts"
          iconLeft={<XIcon size={13} color={tc.text.onRaisedSecondary} />}
          shape="pill"
        />
      </Box>

      {/* PIN verification view */}
      {removeTarget ? (
        <Box style={{ padding: 16, alignItems: 'center' }}>
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
            <Text size="xs" style={{ color: tc.status.danger, marginTop: 8 }}>
              {pinError}
            </Text>
          )}
          <Button variant="tertiary" size="xs" onPress={resetRemoveState} style={{ marginTop: 12 }}>
            <Text size="xs" style={{ color: tc.text.secondary, textDecorationLine: 'underline' }}>
              Cancel
            </Text>
          </Button>
        </Box>
      ) : (
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {accounts.map((account) => {
            const isActive = account.did === activeAccountDid;
            return (
              <Pressable
                key={account.did}
                onPress={() => handleAccountPress(account.did)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  backgroundColor: pressed
                    ? tc.background.sunken
                    : isActive
                      ? tc.background.surface
                      : 'transparent',
                })}
              >
                <Box
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
                    <Text size="sm" weight="bold" style={{ color: tc.text.onAccent }}>
                      {(account.displayName ?? '?').charAt(0).toUpperCase()}
                    </Text>
                  )}
                </Box>

                <Box style={{ flex: 1, marginRight: 4 }}>
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
                </Box>

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

          {/* Add account */}
          <Pressable
            onPress={handleAddPress}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderTopWidth: 1,
              borderTopColor: tc.border.subtle,
              backgroundColor: pressed ? tc.background.sunken : 'transparent',
            })}
          >
            <Box
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
            </Box>
            <Text size="sm" style={{ color: tc.text.secondary }}>
              Add Account
            </Text>
          </Pressable>
        </ScrollView>
      )}
    </Animated.View>
  );
}
