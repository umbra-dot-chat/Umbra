/**
 * Full-screen PIN lock overlay.
 *
 * Used in two contexts:
 *   1. Session unlock — when a PIN is set but not yet verified (AuthGate).
 *      Uses `verifyPin` from AuthContext internally.
 *   2. Account switch — when re-logging into a stored account with a PIN.
 *      The parent passes `onVerify` and `subtitle` props.
 *
 * When `onVerify` is provided it takes precedence over the built-in
 * `verifyPin` call, allowing the parent to handle verification.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Image, View, Animated, Platform, Pressable, type ViewStyle } from 'react-native';
import {
  Text,
  VStack,
  Presence,
  useTheme,
} from '@coexist/wisp-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { GrowablePinInput } from './GrowablePinInput';
import { ArrowLeftIcon } from '@/components/icons';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const lockMascot = require('@/assets/images/lock-mascot.png');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_ATTEMPTS = 5;
const COOLDOWN_SECONDS = 30;
const PIN_LENGTH = 5;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PinLockScreenProps {
  /**
   * Custom verification callback. Return `true` if PIN is correct.
   * When omitted, falls back to `AuthContext.verifyPin`.
   */
  onVerify?: (pin: string) => boolean;
  /** Optional subtitle shown below "Welcome Back". */
  subtitle?: string;
  /** Show a back button. When pressed, calls `onBack`. */
  onBack?: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PinLockScreen({ onVerify, subtitle, onBack }: PinLockScreenProps) {
  const { verifyPin } = useAuth();
  const { theme } = useTheme();

  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [cooldown, setCooldown] = useState(0);

  // Shake animation
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setAttempts(0);
          setError(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

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

  const handleComplete = useCallback(
    (pin: string) => {
      if (cooldown > 0) return;

      const success = onVerify ? onVerify(pin) : verifyPin(pin);
      if (success) return; // parent or AuthContext handles the rest

      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setValue('');
      triggerShake();

      if (newAttempts >= MAX_ATTEMPTS) {
        setError(`Too many attempts. Try again in ${COOLDOWN_SECONDS}s.`);
        setCooldown(COOLDOWN_SECONDS);
      } else {
        setError(`Incorrect PIN. ${MAX_ATTEMPTS - newAttempts} attempts remaining.`);
      }
    },
    [verifyPin, onVerify, attempts, cooldown, triggerShake],
  );

  const isLocked = cooldown > 0;

  return (
    <View style={[containerStyle, { backgroundColor: theme.colors.background.canvas }]}>
      {/* Optional back button */}
      {onBack && (
        <Pressable
          onPress={onBack}
          style={{
            position: 'absolute',
            top: Platform.OS === 'web' ? 24 : 56,
            left: 20,
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ArrowLeftIcon size={24} color={theme.colors.text.primary} />
        </Pressable>
      )}

      <Presence visible animation="scaleIn">
        <VStack gap="xl" style={{ alignItems: 'center', paddingHorizontal: 32 }}>
          <Image
            source={lockMascot}
            style={{ width: 240, height: 240 }}
            resizeMode="contain"
            accessibilityLabel="Lock mascot"
          />

          <VStack gap="xs" style={{ alignItems: 'center' }}>
            <Text size="display-sm" weight="bold">
              Welcome Back
            </Text>
            <Text size="sm" color="secondary" align="center">
              {subtitle ?? 'Enter your PIN to unlock'}
            </Text>
          </VStack>

          <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
            <GrowablePinInput
              minLength={PIN_LENGTH}
              maxLength={PIN_LENGTH}
              value={value}
              onChange={setValue}
              onComplete={handleComplete}
              mask
              autoFocus
              disabled={isLocked}
              error={!!error}
            />
          </Animated.View>

          {error && (
            <Presence visible animation="fadeIn">
              <Text size="sm" color="danger" align="center">
                {isLocked ? `Too many attempts. Try again in ${cooldown}s.` : error}
              </Text>
            </Presence>
          )}
        </VStack>
      </Presence>
    </View>
  );
}

const containerStyle: ViewStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 9999,
};
