/**
 * 4-step Import Wallet flow:
 *
 * Step 0: Enter 24-word recovery seed phrase
 * Step 1: Enter display name
 * Step 2: Configure a security PIN (optional — can skip)
 * Step 3: Success / Error — restore identity and finalize auth
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View } from 'react-native';
import {
  Text,
  Button,
  VStack,
  HStack,
  Input,
  Alert,
  Spinner,
  Card,
  Presence,
} from '@coexist/wisp-react-native';
import type { ProgressStep } from '@coexist/wisp-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useWalletFlow } from '@/hooks/useWalletFlow';
import { WalletFlowLayout } from './WalletFlowLayout';
import { SeedPhraseInput } from './SeedPhraseInput';
import { PinSetupStep } from './PinSetupStep';
import {
  UserIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircleIcon,
} from '@/components/icons';
import UmbraService from '@/packages/umbra-service/src';
import type { Identity } from '@/packages/umbra-service/src';

// ---------------------------------------------------------------------------
// Step definitions
// ---------------------------------------------------------------------------

const STEPS: ProgressStep[] = [
  { id: 'seed', label: 'Recovery Phrase' },
  { id: 'name', label: 'Display Name' },
  { id: 'pin', label: 'Security PIN' },
  { id: 'complete', label: 'Complete' },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ImportWalletFlowProps {
  open: boolean;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createEmptyWords(): string[] {
  return Array(24).fill('');
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ImportWalletFlow({ open, onClose }: ImportWalletFlowProps) {
  const { login, setPin, setRecoveryPhrase, setRememberMe, addAccount } = useAuth();

  // Flow state
  const [words, setWords] = useState<string[]>(createEmptyWords);
  const [displayName, setDisplayName] = useState('');
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [chosenPin, setChosenPin] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phraseError, setPhraseError] = useState<string | null>(null);

  const { currentStep, goNext, goBack, isFirstStep, reset, goToStep } = useWalletFlow({
    totalSteps: 4,
  });

  // Reset state when flow is closed
  useEffect(() => {
    if (!open) {
      setWords(createEmptyWords());
      setDisplayName('');
      setIdentity(null);
      setChosenPin(null);
      setIsLoading(false);
      setError(null);
      setPhraseError(null);
      reset();
    }
  }, [open, reset]);

  // Restore identity when entering step 3 (Complete)
  useEffect(() => {
    if (currentStep === 3 && !identity && !isLoading) {
      restoreWallet();
    }
  }, [currentStep]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleWordChange = useCallback((index: number, value: string) => {
    setWords((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    setPhraseError(null);
  }, []);

  const handlePasteAll = useCallback((pastedWords: string[]) => {
    setWords(pastedWords);
    setPhraseError(null);
  }, []);

  const validateAndAdvance = useCallback(() => {
    // Check all 24 words are filled
    const filledWords = words.filter((w) => w.trim().length > 0);
    if (filledWords.length !== 24) {
      setPhraseError(`Please fill in all 24 words (${filledWords.length}/24 entered)`);
      return;
    }

    // Validate the phrase
    const isValid = UmbraService.validateRecoveryPhrase(words);
    if (!isValid) {
      setPhraseError('Invalid recovery phrase. Please check your words and try again.');
      return;
    }

    setPhraseError(null);
    goNext();
  }, [words, goNext]);

  const restoreWallet = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Initialize service if not already
      if (!UmbraService.isInitialized) {
        await UmbraService.initialize();
      }
      const result = await UmbraService.instance.restoreIdentity(words, displayName.trim());
      setIdentity(result);
    } catch (err: any) {
      setError(err.message ?? 'Failed to restore account');
    } finally {
      setIsLoading(false);
    }
  }, [words, displayName]);

  const handlePinComplete = useCallback(
    (pin: string | null) => {
      setChosenPin(pin);
      goNext();
    },
    [goNext],
  );

  const handleComplete = useCallback(() => {
    if (identity) {
      // Set the PIN in AuthContext before login (if one was chosen)
      if (chosenPin) {
        setPin(chosenPin);
      }
      // Persist recovery phrase so WASM identity can be restored on page refresh
      setRecoveryPhrase(words);
      // Enable rememberMe so identity persists across page refreshes
      setRememberMe(true);

      // Register account for multi-account switching
      addAccount({
        did: identity.did,
        displayName: identity.displayName,
        avatar: identity.avatar,
        recoveryPhrase: words,
        pin: chosenPin ?? undefined,
        rememberMe: true,
        addedAt: Date.now(),
      });

      // Login directly — AuthGate will redirect to /(main) and unmount the
      // auth screen (including this overlay), so no manual close needed.
      login(identity);
    }
  }, [identity, login, chosenPin, setPin, words, setRecoveryPhrase, setRememberMe, addAccount]);

  const handleRetry = useCallback(() => {
    setError(null);
    setIdentity(null);
    goToStep(0);
  }, [goToStep]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  // ---------------------------------------------------------------------------
  // Step content
  // ---------------------------------------------------------------------------

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <VStack gap="lg">
            <VStack gap="xs">
              <Text size="xl" weight="bold">
                Enter Your Recovery Phrase
              </Text>
              <Text size="sm" color="secondary">
                Enter all 24 words of your recovery phrase in the correct order
                to restore your account.
              </Text>
            </VStack>

            <SeedPhraseInput
              words={words}
              onWordChange={handleWordChange}
              onPasteAll={handlePasteAll}
              error={phraseError}
            />
          </VStack>
        );

      case 1:
        return (
          <VStack gap="lg">
            <VStack gap="xs">
              <Text size="xl" weight="bold">
                Choose Your Name
              </Text>
              <Text size="sm" color="secondary">
                This is how others will see you. You can change it anytime.
              </Text>
            </VStack>
            <Input
              icon={UserIcon}
              label="Display Name"
              placeholder="Enter your name"
              value={displayName}
              onChangeText={setDisplayName}
              fullWidth
              autoFocus
            />
          </VStack>
        );

      case 2:
        return <PinSetupStep onComplete={handlePinComplete} />;

      case 3:
        if (isLoading) {
          return (
            <VStack gap="lg" style={{ alignItems: 'center', paddingVertical: 32 }}>
              <Spinner />
              <Text size="sm" color="muted">
                Restoring your account...
              </Text>
            </VStack>
          );
        }

        if (error) {
          return (
            <VStack gap="lg" style={{ alignItems: 'center', paddingVertical: 16 }}>
              <Alert
                variant="danger"
                title="Restore Failed"
                description={error}
              />
              <Button variant="primary" onPress={handleRetry}>
                Try Again
              </Button>
            </VStack>
          );
        }

        return (
          <VStack gap="lg" style={{ alignItems: 'center', paddingVertical: 16 }}>
            <Presence visible animation="scaleIn">
              <CheckCircleIcon size={64} color="#22c55e" />
            </Presence>

            <Presence visible animation="fadeIn" duration={400}>
              <VStack gap="xs" style={{ alignItems: 'center' }}>
                <Text size="xl" weight="bold">
                  Account Restored!
                </Text>
                <Text size="sm" color="secondary" align="center">
                  Your identity has been recovered. Welcome back!
                </Text>
              </VStack>
            </Presence>

            {identity && (
              <Presence visible animation="slideUp" duration={500}>
                <Card variant="outlined" padding="md" style={{ width: '100%' }}>
                  <VStack gap="sm">
                    <HStack gap="sm" style={{ alignItems: 'center' }}>
                      <Text size="sm" color="muted">Name:</Text>
                      <Text size="sm" weight="semibold">{identity.displayName}</Text>
                    </HStack>
                    <HStack gap="sm" style={{ alignItems: 'center' }}>
                      <Text size="sm" color="muted">DID:</Text>
                      <Text size="xs" color="secondary" style={{ flex: 1 }}>
                        {identity.did.length > 32
                          ? `${identity.did.slice(0, 16)}...${identity.did.slice(-16)}`
                          : identity.did}
                      </Text>
                    </HStack>
                  </VStack>
                </Card>
              </Presence>
            )}
          </VStack>
        );

      default:
        return null;
    }
  };

  // ---------------------------------------------------------------------------
  // Footer
  // ---------------------------------------------------------------------------

  const renderFooter = () => {
    switch (currentStep) {
      case 0:
        return (
          <HStack gap="md" style={{ justifyContent: 'flex-end' }}>
            <Button
              variant="primary"
              onPress={validateAndAdvance}
              iconRight={<ArrowRightIcon size={16} color="#FFFFFF" />}
            >
              Continue
            </Button>
          </HStack>
        );

      case 1:
        return (
          <HStack gap="md" style={{ justifyContent: 'flex-end' }}>
            <Button
              variant="primary"
              onPress={goNext}
              disabled={!displayName.trim()}
              iconRight={<ArrowRightIcon size={16} color="#FFFFFF" />}
            >
              Continue
            </Button>
          </HStack>
        );

      // Step 2 (PIN) — footer is handled by PinSetupStep itself (skip / confirm)
      case 2:
        return null;

      case 3:
        if (isLoading) {
          return (
            <HStack gap="md" style={{ justifyContent: 'flex-end' }}>
              <Button variant="primary" disabled>
                Restoring...
              </Button>
            </HStack>
          );
        }

        if (error) {
          return (
            <HStack gap="md" style={{ justifyContent: 'space-between' }}>
              <Button
                variant="tertiary"
                onPress={handleRetry}
                iconLeft={<ArrowLeftIcon size={16} />}
              >
                Start Over
              </Button>
            </HStack>
          );
        }

        return (
          <HStack gap="md" style={{ justifyContent: 'flex-end' }}>
            <Button
              variant="primary"
              onPress={handleComplete}
              size="lg"
              fullWidth
            >
              Get Started
            </Button>
          </HStack>
        );

      default:
        return null;
    }
  };

  return (
    <WalletFlowLayout
      open={open}
      onClose={handleClose}
      onBack={isFirstStep ? handleClose : goBack}
      steps={STEPS}
      currentStep={currentStep}
      allowBackdropClose={isFirstStep}
      footer={renderFooter()}
    >
      {renderStepContent()}
    </WalletFlowLayout>
  );
}
