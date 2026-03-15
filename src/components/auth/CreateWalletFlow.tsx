/**
 * 5-step Create Wallet flow:
 *
 * Step 0: Choose a username (used as both display name and discovery username)
 * Step 1: View recovery seed phrase (calls createIdentity)
 * Step 2: Confirm backup (checkbox acknowledgment)
 * Step 3: Configure a security PIN (optional — can skip)
 * Step 4: Success — finalize auth
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Image } from 'react-native';
import {
  Text,
  Button,
  Box,
  VStack,
  HStack,
  Input,
  Alert,
  Checkbox,
  Spinner,
  Card,
  Presence,
  Separator,
  useTheme,
} from '@coexist/wisp-react-native';
import type { ProgressStep } from '@coexist/wisp-react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useWalletFlow } from '@/hooks/useWalletFlow';
import { WalletFlowLayout } from './WalletFlowLayout';
import { SeedPhraseGrid } from './SeedPhraseGrid';
import { PinSetupStep } from './PinSetupStep';
import { ProfileImportSelector, type NormalizedProfile } from './ProfileImportSelector';
import { linkAccountDirect, updateSettings, registerUsername } from '../../../packages/umbra-service/src/discovery/api';
import { DiscoveryOptInDialog } from '@/components/discovery/DiscoveryOptInDialog';
import type { UsernameResponse } from '../../../packages/umbra-service/src/discovery/types';
import {
  UserIcon,
  ArrowRightIcon,
  CheckCircleIcon,
} from '@/components/ui';
import UmbraService from '@umbra/service';
import type { Identity } from '@umbra/service';
import { enablePersistence, getWasm } from '@umbra/wasm';
import { setPendingSyncOptIn } from '@/contexts/SyncContext';
import { TEST_IDS } from '@/constants/test-ids';
import { dbg } from '@/utils/debug';

const SRC = 'CreateWalletFlow';

// ---------------------------------------------------------------------------
// Step definitions
// ---------------------------------------------------------------------------

const STEP_KEYS = ['stepUsername', 'stepRecoveryPhrase', 'stepConfirmBackup', 'stepSecurityPin', 'stepComplete'] as const;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface CreateWalletFlowProps {
  open: boolean;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CreateWalletFlow({ open, onClose }: CreateWalletFlowProps) {
  if (__DEV__) dbg.trackRender('CreateWalletFlow');
  const { login, setPin, setRememberMe: setAuthRememberMe, setRecoveryPhrase, addAccount } = useAuth();
  const { t } = useTranslation('auth');
  const { t: tCommon } = useTranslation('common');
  const { theme } = useTheme();
  const colors = theme.colors;

  const STEPS: ProgressStep[] = STEP_KEYS.map((key, i) => ({
    id: ['username', 'seed', 'confirm', 'pin', 'complete'][i],
    label: t(key),
  }));

  // Flow state
  const [displayName, setDisplayName] = useState('');
  const [seedPhrase, setSeedPhrase] = useState<string[] | null>(null);
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [backupConfirmed, setBackupConfirmed] = useState(false);
  const [chosenPin, setChosenPin] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(true);

  // Username registration state (registered during identity creation)
  const [usernameResult, setUsernameResult] = useState<UsernameResponse | null>(null);

  // Profile import state
  const [importedProfile, setImportedProfile] = useState<NormalizedProfile | null>(null);

  // Discovery opt-in state (shown after profile import + auto-link)
  const [showDiscoveryOptIn, setShowDiscoveryOptIn] = useState(false);
  const [accountLinkedDuringCreation, setAccountLinkedDuringCreation] = useState(false);

  // Sync opt-in state
  const [syncOptIn, setSyncOptIn] = useState(true);

  const { currentStep, goNext, goBack, isFirstStep, reset } = useWalletFlow({
    totalSteps: 5,
  });

  // Reset state when flow is closed
  useEffect(() => {
    if (!open) {
      setDisplayName('');
      setSeedPhrase(null);
      setIdentity(null);
      setBackupConfirmed(false);
      setChosenPin(null);
      setRememberMe(true);
      setIsLoading(false);
      setError(null);
      setImportedProfile(null);
      setUsernameResult(null);
      setShowDiscoveryOptIn(false);
      setAccountLinkedDuringCreation(false);
      setSyncOptIn(true);
      reset();
    }
  }, [open, reset]);

  // Handle profile import from OAuth
  const handleProfileImported = useCallback((profile: NormalizedProfile) => {
    setImportedProfile(profile);
    // Pre-fill display name from imported profile
    if (profile.displayName) {
      setDisplayName(profile.displayName);
    }
  }, []);

  // Clear imported profile
  const handleClearImport = useCallback(() => {
    setImportedProfile(null);
  }, []);

  // Create identity when entering step 1
  useEffect(() => {
    if (currentStep === 1 && !seedPhrase && !isLoading) {
      createWallet();
    }
  }, [currentStep]); // eslint-disable-line react-hooks/exhaustive-deps

  const createWallet = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Initialize service if not already
      if (!UmbraService.isInitialized) {
        await UmbraService.initialize();
      }
      const result = await UmbraService.instance.createIdentity(displayName.trim());
      setSeedPhrase(result.recoveryPhrase);

      // If we have an imported profile with an avatar, set it
      let finalIdentity = result.identity;
      if (importedProfile?.avatarBase64) {
        const avatarDataUrl = `data:${importedProfile.avatarMime || 'image/png'};base64,${importedProfile.avatarBase64}`;
        if (__DEV__) dbg.info('auth', 'Setting avatar', { size: avatarDataUrl.length }, SRC);
        try {
          await UmbraService.instance.updateProfile({ type: 'avatar', value: avatarDataUrl });
          // Update the identity with the avatar
          finalIdentity = { ...result.identity, avatar: avatarDataUrl };
          if (__DEV__) dbg.info('auth', 'Avatar saved successfully', undefined, SRC);
        } catch (avatarErr: any) {
          if (__DEV__) dbg.error('auth', 'Failed to save avatar', avatarErr, SRC);
        }
      }

      // Auto-link the imported platform account for friend discovery
      if (importedProfile?.platformId) {
        try {
          await linkAccountDirect(
            result.identity.did,
            importedProfile.platform,
            importedProfile.platformId,
            importedProfile.displayName || importedProfile.username
          );
          setAccountLinkedDuringCreation(true);
          if (__DEV__) dbg.info('auth', 'Platform account auto-linked', { platform: importedProfile.platform }, SRC);
        } catch (linkErr: any) {
          // Non-fatal — account linking is optional
          if (__DEV__) dbg.warn('auth', 'Failed to auto-link account', linkErr, SRC);
        }
      }

      setIdentity(finalIdentity);

      // Auto-register the username with the discovery service (non-blocking)
      try {
        const usernameRes = await registerUsername(result.identity.did, displayName.trim());
        setUsernameResult(usernameRes);
        if (__DEV__) dbg.info('auth', 'Username registered', { username: usernameRes.username }, SRC);
      } catch (usernameErr: any) {
        // Non-fatal — username registration is best-effort
        if (__DEV__) dbg.warn('auth', 'Failed to register username', usernameErr, SRC);
      }
    } catch (err: any) {
      setError(err.message ?? 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  }, [displayName, importedProfile]);

  const handlePinComplete = useCallback(
    (pin: string | null) => {
      setChosenPin(pin);
      goNext();
    },
    [goNext],
  );

  // Finalize login after identity switch decision (or when no old data exists)
  const doLogin = useCallback(() => {
    if (!identity) return;
    // Set the PIN in AuthContext before login (if one was chosen)
    if (chosenPin) {
      setPin(chosenPin);
    }
    // Persist preference before login so the login() call can use it
    setAuthRememberMe(rememberMe);
    // Persist recovery phrase so WASM identity can be restored on page refresh
    if (seedPhrase) {
      setRecoveryPhrase(seedPhrase);
    }
    // Enable IndexedDB persistence now that we have a DID.
    // The database was initialized in-memory (no DID at startup for new users),
    // so this retroactively enables persistence for all subsequent writes.
    enablePersistence(identity.did);

    // Register account for multi-account switching
    if (seedPhrase) {
      addAccount({
        did: identity.did,
        displayName: identity.displayName,
        avatar: identity.avatar,
        recoveryPhrase: seedPhrase,
        pin: chosenPin ?? undefined,
        rememberMe,
        addedAt: Date.now(),
      });
    }

    // Signal sync opt-in via module-level flag so SyncContext picks it up
    // after login, even if the KV write (async on RN native bridge) hasn't
    // completed by the time SyncContext reads from the database.
    if (syncOptIn) {
      setPendingSyncOptIn(true);
      // Also fire-and-forget the KV write so it persists for next app launch
      try {
        const w = getWasm();
        if (w) {
          (w as any).umbra_wasm_plugin_kv_set('__umbra_system__', '__sync_enabled__', 'true');
        }
      } catch { /* ignore */ }
    }

    // Login — AuthGate will redirect to /(main) and unmount the auth
    // screen (including this overlay), so we don't need to manually close.
    login(identity);
  }, [identity, login, chosenPin, setPin, rememberMe, setAuthRememberMe, seedPhrase, setRecoveryPhrase, addAccount, syncOptIn]);

  // Called after discovery opt-in decision (or skip) to finish login
  const finishLogin = useCallback(() => {
    doLogin();
  }, [doLogin]);

  const handleComplete = useCallback(async () => {
    if (!identity) return;

    // If a platform was linked during creation, show the discovery opt-in first
    if (accountLinkedDuringCreation && importedProfile) {
      setShowDiscoveryOptIn(true);
      return; // Wait for opt-in decision
    }

    finishLogin();
  }, [identity, accountLinkedDuringCreation, importedProfile, finishLogin]);

  // Handle discovery opt-in from the dialog
  const handleEnableDiscovery = useCallback(async () => {
    if (!identity) return false;
    try {
      await updateSettings(identity.did, true);
      if (__DEV__) dbg.info('auth', 'Friend discovery enabled during signup', undefined, SRC);
      return true;
    } catch (err: any) {
      if (__DEV__) dbg.error('auth', 'Failed to enable discovery', err, SRC);
      return false;
    }
  }, [identity]);

  // Called when the discovery opt-in dialog closes (either choice)
  const handleDiscoveryOptInClose = useCallback(() => {
    setShowDiscoveryOptIn(false);
    finishLogin();
  }, [finishLogin]);

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
                {/* TODO: add i18n key for "Choose a Username" */}
                Choose a Username
              </Text>
              <Text size="sm" color="secondary">
                {/* TODO: add i18n key for username step description */}
                This is how others will see you and how friends can find you. You can change it anytime.
              </Text>
            </VStack>
            <Input
              icon={UserIcon}
              label={t('stepUsername')}
              placeholder="e.g., Matt" // TODO: add i18n key for placeholder
              value={displayName}
              onChangeText={setDisplayName}
              fullWidth
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
              testID={TEST_IDS.CREATE.NAME_INPUT}
              accessibilityLabel="Username input"
              gradientBorder
            />

            <Separator spacing="lg" />

            {/* Profile import section */}
            {!importedProfile ? (
              <Box testID={TEST_IDS.CREATE.IMPORT_PROFILE_BUTTON} accessibilityLabel="Import profile from another platform">
                <ProfileImportSelector
                  onProfileImported={handleProfileImported}
                  compact
                />
              </Box>
            ) : (
              <VStack gap="md">
                <HStack style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text size="sm" weight="semibold" color="secondary">
                    {/* TODO: add i18n key for "Profile Imported" */}
                    Profile Imported
                  </Text>
                  <Button variant="tertiary" size="sm" onPress={handleClearImport}>
                    {/* TODO: add i18n key for "Change" */}
                    Change
                  </Button>
                </HStack>

                <Card variant="filled" padding="md">
                  <HStack gap="md" style={{ alignItems: 'center' }}>
                    <Box style={{ width: 48, height: 48, borderRadius: 24, overflow: 'hidden' }}>
                      {importedProfile.avatarBase64 ? (
                        <Image
                          source={{ uri: `data:${importedProfile.avatarMime || 'image/png'};base64,${importedProfile.avatarBase64}` }}
                          style={{ width: 48, height: 48 }}
                        />
                      ) : importedProfile.avatarUrl ? (
                        <Image
                          source={{ uri: importedProfile.avatarUrl }}
                          style={{ width: 48, height: 48 }}
                        />
                      ) : (
                        <Box style={{ width: 48, height: 48, backgroundColor: colors.accent.primary, alignItems: 'center', justifyContent: 'center' }}>
                          <Text size="lg" weight="bold" style={{ color: colors.text.inverse }}>
                            {(importedProfile.displayName || importedProfile.username || '?').charAt(0).toUpperCase()}
                          </Text>
                        </Box>
                      )}
                    </Box>
                    <VStack gap="xs" style={{ flex: 1 }}>
                      <Text size="md" weight="semibold">
                        {importedProfile.displayName}
                      </Text>
                      <Text size="xs" color="muted" style={{ textTransform: 'capitalize' }}>
                        from {importedProfile.platform}
                      </Text>
                    </VStack>
                  </HStack>
                </Card>
              </VStack>
            )}
          </VStack>
        );

      case 1:
        return (
          <VStack gap="lg">
            <VStack gap="xs">
              <Text size="xl" weight="bold">
                {/* TODO: add i18n key for "Your Recovery Phrase" */}
                Your Recovery Phrase
              </Text>
              <Text size="sm" color="secondary">
                {t('recoveryPhraseHelp')}
              </Text>
            </VStack>

            <Alert
              variant="warning"
              title="Important" // TODO: add i18n key for "Important"
              description="Never share your recovery phrase with anyone. Anyone with these words can access your account." // TODO: add i18n key
            />

            {isLoading ? (
              <Box style={{ alignItems: 'center', paddingVertical: 32 }}>
                <Spinner />
                <Text size="sm" color="muted" style={{ marginTop: 12 }}>
                  {/* TODO: add i18n key for "Generating your account..." */}
                  Generating your account...
                </Text>
              </Box>
            ) : error ? (
              <Alert variant="danger" title={tCommon('error')} description={error} />
            ) : seedPhrase ? (
              <Box testID={TEST_IDS.CREATE.SEED_PHRASE_GRID} accessibilityLabel="Recovery seed phrase grid">
                <SeedPhraseGrid words={seedPhrase} showCopy />
              </Box>
            ) : null}
          </VStack>
        );

      case 2:
        return (
          <VStack gap="lg">
            <VStack gap="xs">
              <Text size="xl" weight="bold">
                {t('stepConfirmBackup')}
              </Text>
              <Text size="sm" color="secondary">
                {/* TODO: add i18n key for confirm backup description */}
                Make sure you have written down your recovery phrase and stored
                it in a safe place. You will not be able to see it again.
              </Text>
            </VStack>

            <Alert
              variant="info"
              title="Why this matters" // TODO: add i18n key for "Why this matters"
              description="Your recovery phrase is the master key to your account. Without it, your messages and identity cannot be recovered." // TODO: add i18n key
            />

            <Checkbox
              checked={backupConfirmed}
              onChange={setBackupConfirmed}
              label="I have written down my recovery phrase and stored it securely" // TODO: add i18n key
              description="I understand that losing this phrase means losing access to my account forever." // TODO: add i18n key
              testID={TEST_IDS.CREATE.BACKUP_CHECKBOX}
              accessibilityLabel="Confirm backup checkbox"
            />
          </VStack>
        );

      case 3:
        return (
          <Box testID={TEST_IDS.CREATE.PIN_STEP} accessibilityLabel="PIN setup step">
            <PinSetupStep onComplete={handlePinComplete} />
          </Box>
        );

      case 4:
        return (
          <VStack gap="lg" style={{ paddingVertical: 16 }} testID={TEST_IDS.CREATE.SUCCESS_SCREEN} accessibilityLabel="Account created success screen">
            <Box style={{ alignItems: 'center' }}>
              <Presence visible animation="scaleIn">
                <CheckCircleIcon size={64} color={colors.status.success} />
              </Presence>
            </Box>

            <Presence visible animation="fadeIn" duration={400}>
              <VStack gap="xs" style={{ alignItems: 'center' }}>
                <Text size="xl" weight="bold">
                  {/* TODO: add i18n key for "Account Created!" */}
                  Account Created!
                </Text>
                <Text size="sm" color="secondary" align="center">
                  {/* TODO: add i18n key for success description */}
                  Your identity has been created. You're ready to start using Umbra.
                </Text>
              </VStack>
            </Presence>

            {identity && (
              <Presence visible animation="slideUp" duration={500}>
                <Card variant="outlined" padding="md">
                  <VStack gap="sm">
                    <HStack gap="sm" style={{ alignItems: 'center' }}>
                      <Text size="sm" color="muted">{/* TODO: add i18n key */}Name:</Text>
                      <Text size="sm" weight="semibold">{identity.displayName}</Text>
                    </HStack>
                    {usernameResult?.username && (
                      <HStack gap="sm" style={{ alignItems: 'center' }}>
                        <Text size="sm" color="muted">{t('stepUsername')}:</Text>
                        <Text size="sm" weight="semibold">{usernameResult.username}</Text>
                      </HStack>
                    )}
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

            <Presence visible animation="fadeIn" duration={600}>
              <Checkbox
                checked={rememberMe}
                onChange={setRememberMe}
                label="Remember me on this device" // TODO: add i18n key
                description="Stay logged in between sessions. Your identity will be stored locally." // TODO: add i18n key
                testID={TEST_IDS.CREATE.REMEMBER_ME_CHECKBOX}
                accessibilityLabel="Remember me checkbox"
              />
            </Presence>

            <Presence visible animation="fadeIn" duration={700}>
              <Checkbox
                checked={syncOptIn}
                onChange={setSyncOptIn}
                label="Enable account sync" // TODO: add i18n key
                description="Keep friends, groups, and preferences synced across devices. Encrypted with your recovery phrase." // TODO: add i18n key
                accessibilityLabel="Enable account sync checkbox"
                testID={TEST_IDS.SYNC.OPT_IN_CHECKBOX}
              />
            </Presence>
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
              onPress={goNext}
              disabled={!displayName.trim()}
              iconRight={<ArrowRightIcon size={16} color={colors.text.inverse} />}
              testID={TEST_IDS.CREATE.NAME_NEXT}
              accessibilityLabel="Continue to next step"
            >
              {/* TODO: add i18n key for "Continue" */}
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
              disabled={!seedPhrase || isLoading}
              iconRight={<ArrowRightIcon size={16} color={colors.text.inverse} />}
              testID={TEST_IDS.CREATE.SEED_NEXT}
              accessibilityLabel="Continue after seed phrase"
            >
              {/* TODO: add i18n key for "Continue" */}
              Continue
            </Button>
          </HStack>
        );

      case 2:
        return (
          <HStack gap="md" style={{ justifyContent: 'flex-end' }}>
            <Button
              variant="primary"
              onPress={goNext}
              disabled={!backupConfirmed}
              iconRight={<ArrowRightIcon size={16} color={colors.text.inverse} />}
              testID={TEST_IDS.CREATE.BACKUP_NEXT}
              accessibilityLabel="Continue after backup confirmation"
            >
              {/* TODO: add i18n key for "Continue" */}
              Continue
            </Button>
          </HStack>
        );

      // Step 3 (PIN) — footer is handled by PinSetupStep itself (skip / confirm)
      case 3:
        return null;

      case 4:
        return (
          <HStack gap="md" style={{ justifyContent: 'flex-end' }}>
            <Button
              variant="primary"
              onPress={handleComplete}
              size="lg"
              fullWidth
              testID={TEST_IDS.CREATE.SUCCESS_DONE}
              accessibilityLabel="Get started"
            >
              {/* TODO: add i18n key for "Get Started" */}
              Get Started
            </Button>
          </HStack>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <WalletFlowLayout
        open={open}
        onClose={handleClose}
        onBack={isFirstStep ? handleClose : goBack}
        steps={STEPS}
        currentStep={currentStep}
        allowBackdropClose={isFirstStep}
        footer={renderFooter()}
        testID={TEST_IDS.CREATE.FLOW}
        accessibilityLabel={t('createNewAccountAccessibility')}
        backButtonTestID={TEST_IDS.CREATE.BACK_BUTTON}
        backButtonAccessibilityLabel={t('goBack')}
      >
        {renderStepContent()}
      </WalletFlowLayout>

      {/* Discovery Opt-In Dialog — shown after profile import + auto-link */}
      {importedProfile && (
        <DiscoveryOptInDialog
          open={showDiscoveryOptIn}
          onClose={handleDiscoveryOptInClose}
          platform={importedProfile.platform}
          onEnableDiscovery={handleEnableDiscovery}
        />
      )}

    </>
  );
}
