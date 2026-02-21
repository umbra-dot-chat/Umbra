/**
 * Shared PIN creation step used by both CreateWalletFlow and ImportWalletFlow.
 *
 * Two sub-stages:
 *  1. Enter a 5-digit PIN
 *  2. Confirm the PIN (re-enter to verify)
 *
 * Provides a "Skip for now" option so the PIN is optional.
 */

import React, { useState, useCallback } from 'react';
import { Pressable } from 'react-native';
import {
  Text,
  VStack,
  Alert,
  Presence,
} from '@coexist/wisp-react-native';
import { KeyIcon } from '@/components/icons';
import { GrowablePinInput } from './GrowablePinInput';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PIN_LENGTH = 5;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface PinSetupStepProps {
  /** Called when the user finishes (pin string) or skips (null). */
  onComplete: (pin: string | null) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PinSetupStep({ onComplete }: PinSetupStepProps) {
  const [stage, setStage] = useState<'enter' | 'confirm'>('enter');
  const [enteredPin, setEnteredPin] = useState('');
  const [confirmValue, setConfirmValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Stage 1 — user finishes entering their desired PIN
  const handleEnterComplete = useCallback((value: string) => {
    setEnteredPin(value);
    setConfirmValue('');
    setError(null);
    setStage('confirm');
  }, []);

  // Stage 2 — user re-enters the PIN for confirmation
  const handleConfirmComplete = useCallback(
    (value: string) => {
      if (value === enteredPin) {
        onComplete(value);
      } else {
        setError('PINs do not match. Please try again.');
        setConfirmValue('');
      }
    },
    [enteredPin, onComplete],
  );

  const handleBack = useCallback(() => {
    setStage('enter');
    setEnteredPin('');
    setConfirmValue('');
    setError(null);
  }, []);

  const handleSkip = useCallback(() => {
    onComplete(null);
  }, [onComplete]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (stage === 'confirm') {
    return (
      <Presence visible animation="slideUp">
        <VStack gap="lg" style={{ alignItems: 'center' }}>
          <KeyIcon size={40} color="#6366f1" />

          <VStack gap="xs" style={{ alignItems: 'center' }}>
            <Text size="xl" weight="bold">
              Confirm Your PIN
            </Text>
            <Text size="sm" color="secondary" align="center">
              Re-enter your PIN to confirm.
            </Text>
          </VStack>

          {error && (
            <Alert variant="danger" description={error} />
          )}

          <GrowablePinInput
            minLength={PIN_LENGTH}
            maxLength={PIN_LENGTH}
            value={confirmValue}
            onChange={setConfirmValue}
            onComplete={handleConfirmComplete}
            mask
            autoFocus
            error={!!error}
          />

          <Pressable onPress={handleBack}>
            <Text size="sm" color="muted" style={{ textDecorationLine: 'underline' }}>
              Go back
            </Text>
          </Pressable>
        </VStack>
      </Presence>
    );
  }

  return (
    <VStack gap="lg" style={{ alignItems: 'center' }}>
      <KeyIcon size={40} color="#6366f1" />

      <VStack gap="xs" style={{ alignItems: 'center' }}>
        <Text size="xl" weight="bold">
          Secure Your Account
        </Text>
        <Text size="sm" color="secondary" align="center">
          Create a 5-digit PIN to lock the app and protect your keys.{'\n'}
          You'll need this PIN each time you open the app.
        </Text>
      </VStack>

      <GrowablePinInput
        minLength={PIN_LENGTH}
        maxLength={PIN_LENGTH}
        value={enteredPin}
        onChange={setEnteredPin}
        onComplete={handleEnterComplete}
        mask
        autoFocus
      />

      <Pressable onPress={handleSkip}>
        <Text size="sm" color="muted" style={{ textDecorationLine: 'underline' }}>
          Skip for now
        </Text>
      </Pressable>
    </VStack>
  );
}
