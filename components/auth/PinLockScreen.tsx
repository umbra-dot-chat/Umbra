/**
 * Full-screen PIN lock overlay.
 *
 * Renders on top of the entire app when a PIN is set but not yet verified
 * for the current session. Blocks all interaction until the correct PIN
 * is entered.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Animated, type ViewStyle } from 'react-native';
import {
  Text,
  VStack,
  PinInput,
  Presence,
  useTheme,
} from '@coexist/wisp-react-native';
import { ShieldIcon } from '@/components/icons';
import { useAuth } from '@/contexts/AuthContext';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_ATTEMPTS = 5;
const COOLDOWN_SECONDS = 30;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PinLockScreen() {
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

      const success = verifyPin(pin);
      if (success) {
        // AuthContext sets isPinVerified = true, AuthGate will hide this screen
        return;
      }

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
    [verifyPin, attempts, cooldown, triggerShake],
  );

  const isLocked = cooldown > 0;

  return (
    <View style={[containerStyle, { backgroundColor: theme.colors.background.canvas }]}>
      <Presence visible animation="scaleIn">
        <VStack gap="xl" style={{ alignItems: 'center', paddingHorizontal: 32 }}>
          <ShieldIcon size={48} color={theme.colors.text.muted} />

          <VStack gap="xs" style={{ alignItems: 'center' }}>
            <Text size="display-sm" weight="bold">
              Welcome Back
            </Text>
            <Text size="sm" color="secondary" align="center">
              Enter your PIN to unlock
            </Text>
          </VStack>

          <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
            <PinInput
              length={6}
              value={value}
              onChange={setValue}
              onComplete={handleComplete}
              mask
              autoFocus
              type="number"
              size="lg"
              disabled={isLocked}
              error={error ? true : undefined}
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
