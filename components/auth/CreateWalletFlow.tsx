/**
 * 5-step Create Wallet flow:
 *
 * Step 0: Enter display name
 * Step 1: View recovery seed phrase (calls createIdentity)
 * Step 2: Confirm backup (checkbox acknowledgment)
 * Step 3: Configure a security PIN (optional — can skip)
 * Step 4: Success — finalize auth
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Image } from 'react-native';
import {
  Text,
  Button,
  VStack,
  HStack,
  Input,
  Alert,
  Checkbox,
  Spinner,
  Card,
  Presence,
  Dialog,
  Separator,
} from '@coexist/wisp-react-native';
import type { ProgressStep } from '@coexist/wisp-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useWalletFlow } from '@/hooks/useWalletFlow';
import { WalletFlowLayout } from './WalletFlowLayout';
import { SeedPhraseGrid } from './SeedPhraseGrid';
import { PinSetupStep } from './PinSetupStep';
import { ProfileImportSelector, type NormalizedProfile } from './ProfileImportSelector';
import { linkAccountDirect, updateSettings, registerUsername } from '@/packages/umbra-service/src/discovery/api';
import { DiscoveryOptInDialog } from '@/components/discovery/DiscoveryOptInDialog';
import type { UsernameResponse } from '@/packages/umbra-service/src/discovery/types';
import {
  UserIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
} from '@/components/icons';
import UmbraService from '@/packages/umbra-service/src';
import type { Identity } from '@/packages/umbra-service/src';
import { enablePersistence, listStoredDids, clearDatabaseExport } from '@umbra/wasm';

// ---------------------------------------------------------------------------
// Step definitions
// ---------------------------------------------------------------------------

const STEPS: ProgressStep[] = [
  { id: 'name', label: 'Display Name' },
  { id: 'seed', label: 'Recovery Phrase' },
  { id: 'confirm', label: 'Confirm Backup' },
  { id: 'pin', label: 'Security PIN' },
  { id: 'username', label: 'Username' },
  { id: 'complete', label: 'Complete' },
];

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
  const { login, setPin, setRememberMe: setAuthRememberMe, setRecoveryPhrase } = useAuth();

  // Flow state
  const [displayName, setDisplayName] = useState('');
  const [seedPhrase, setSeedPhrase] = useState<string[] | null>(null);
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [backupConfirmed, setBackupConfirmed] = useState(false);
  const [chosenPin, setChosenPin] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(true);

  // Username step state
  const [usernameInput, setUsernameInput] = useState('');
  const [usernameResult, setUsernameResult] = useState<UsernameResponse | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameLoading, setUsernameLoading] = useState(false);

  // Profile import state
  const [importedProfile, setImportedProfile] = useState<NormalizedProfile | null>(null);

  // Discovery opt-in state (shown after profile import + auto-link)
  const [showDiscoveryOptIn, setShowDiscoveryOptIn] = useState(false);
  const [accountLinkedDuringCreation, setAccountLinkedDuringCreation] = useState(false);

  // Identity switch dialog state
  const [showSwitchDialog, setShowSwitchDialog] = useState(false);
  const [oldDids, setOldDids] = useState<string[]>([]);

  const { currentStep, goNext, goBack, isFirstStep, reset } = useWalletFlow({
    totalSteps: 6,
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
      setUsernameInput('');
      setUsernameResult(null);
      setUsernameError(null);
      setUsernameLoading(false);
      setShowDiscoveryOptIn(false);
      setAccountLinkedDuringCreation(false);
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
        console.log('[CreateWalletFlow] Setting avatar, size:', avatarDataUrl.length);
        try {
          await UmbraService.instance.updateProfile({ type: 'avatar', value: avatarDataUrl });
          // Update the identity with the avatar
          finalIdentity = { ...result.identity, avatar: avatarDataUrl };
          console.log('[CreateWalletFlow] Avatar saved successfully');
        } catch (avatarErr: any) {
          console.error('[CreateWalletFlow] Failed to save avatar:', avatarErr);
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
          console.log('[CreateWalletFlow] Platform account auto-linked:', importedProfile.platform);
        } catch (linkErr: any) {
          // Non-fatal — account linking is optional
          console.warn('[CreateWalletFlow] Failed to auto-link account:', linkErr);
        }
      }

      setIdentity(finalIdentity);
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

  // Register username
  const handleRegisterUsername = useCallback(async () => {
    if (!identity || !usernameInput.trim()) return;
    setUsernameLoading(true);
    setUsernameError(null);
    try {
      const result = await registerUsername(identity.did, usernameInput.trim());
      setUsernameResult(result);
    } catch (err: any) {
      setUsernameError(err.message ?? 'Failed to register username');
    } finally {
      setUsernameLoading(false);
    }
  }, [identity, usernameInput]);

  // Skip username step
  const handleSkipUsername = useCallback(() => {
    goNext();
  }, [goNext]);

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

    // Login — AuthGate will redirect to /(main) and unmount the auth
    // screen (including this overlay), so we don't need to manually close.
    login(identity);
  }, [identity, login, chosenPin, setPin, rememberMe, setAuthRememberMe, seedPhrase, setRecoveryPhrase]);

  // Called after discovery opt-in decision (or skip) to finish login
  const finishLogin = useCallback(async () => {
    if (!identity) return;
    // Check if there's old IndexedDB data from a different identity
    try {
      const stored = await listStoredDids();
      const otherDids = stored.filter((did) => did !== identity.did);
      if (otherDids.length > 0) {
        setOldDids(otherDids);
        setShowSwitchDialog(true);
        return; // Wait for user decision
      }
    } catch {
      // listStoredDids may fail in unsupported environments — proceed normally
    }
    doLogin();
  }, [identity, doLogin]);

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
      console.log('[CreateWalletFlow] Friend discovery enabled during signup');
      return true;
    } catch (err: any) {
      console.error('[CreateWalletFlow] Failed to enable discovery:', err);
      return false;
    }
  }, [identity]);

  // Called when the discovery opt-in dialog closes (either choice)
  const handleDiscoveryOptInClose = useCallback(() => {
    setShowDiscoveryOptIn(false);
    finishLogin();
  }, [finishLogin]);

  // Identity switch dialog: keep old data
  const handleKeepOldData = useCallback(() => {
    setShowSwitchDialog(false);
    doLogin();
  }, [doLogin]);

  // Identity switch dialog: clear old data
  const handleClearOldData = useCallback(async () => {
    setShowSwitchDialog(false);
    for (const did of oldDids) {
      try {
        await clearDatabaseExport(did);
      } catch {
        // best-effort cleanup
      }
    }
    doLogin();
  }, [oldDids, doLogin]);

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

            <Separator spacing="lg" />

            {/* Profile import section */}
            {!importedProfile ? (
              <ProfileImportSelector
                onProfileImported={handleProfileImported}
                compact
              />
            ) : (
              <VStack gap="md">
                <HStack style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text size="sm" weight="semibold" color="secondary">
                    Profile Imported
                  </Text>
                  <Button variant="tertiary" size="sm" onPress={handleClearImport}>
                    Change
                  </Button>
                </HStack>

                <Card variant="filled" padding="md">
                  <HStack gap="md" style={{ alignItems: 'center' }}>
                    <View style={{ width: 48, height: 48, borderRadius: 24, overflow: 'hidden' }}>
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
                        <View style={{ width: 48, height: 48, backgroundColor: '#5865F2', alignItems: 'center', justifyContent: 'center' }}>
                          <Text size="lg" weight="bold" style={{ color: 'white' }}>
                            {importedProfile.displayName.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                    </View>
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
                Your Recovery Phrase
              </Text>
              <Text size="sm" color="secondary">
                Write down these 24 words in order. This is the only way to
                recover your account if you lose access to your device.
              </Text>
            </VStack>

            <Alert
              variant="warning"
              title="Important"
              description="Never share your recovery phrase with anyone. Anyone with these words can access your account."
            />

            {isLoading ? (
              <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                <Spinner />
                <Text size="sm" color="muted" style={{ marginTop: 12 }}>
                  Generating your account...
                </Text>
              </View>
            ) : error ? (
              <Alert variant="danger" title="Error" description={error} />
            ) : seedPhrase ? (
              <SeedPhraseGrid words={seedPhrase} showCopy />
            ) : null}
          </VStack>
        );

      case 2:
        return (
          <VStack gap="lg">
            <VStack gap="xs">
              <Text size="xl" weight="bold">
                Confirm Your Backup
              </Text>
              <Text size="sm" color="secondary">
                Make sure you have written down your recovery phrase and stored
                it in a safe place. You will not be able to see it again.
              </Text>
            </VStack>

            <Alert
              variant="info"
              title="Why this matters"
              description="Your recovery phrase is the master key to your account. Without it, your messages and identity cannot be recovered."
            />

            <Checkbox
              checked={backupConfirmed}
              onChange={setBackupConfirmed}
              label="I have written down my recovery phrase and stored it securely"
              description="I understand that losing this phrase means losing access to my account forever."
            />
          </VStack>
        );

      case 3:
        return <PinSetupStep onComplete={handlePinComplete} />;

      case 4:
        return (
          <VStack gap="lg">
            <VStack gap="xs">
              <Text size="xl" weight="bold">
                Choose a Username
              </Text>
              <Text size="sm" color="secondary">
                Pick a unique username so friends can find you easily. A numeric tag will be assigned automatically (e.g., Matt#01283).
              </Text>
            </VStack>

            {!usernameResult ? (
              <VStack gap="md">
                <Input
                  icon={UserIcon}
                  label="Username"
                  placeholder="e.g., Matt"
                  value={usernameInput}
                  onChangeText={(text: string) => {
                    setUsernameInput(text);
                    setUsernameError(null);
                  }}
                  fullWidth
                  autoFocus
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <Text size="xs" color="muted">
                  1-32 characters. Letters, numbers, underscores, and hyphens only.
                </Text>

                {usernameError && (
                  <Alert variant="danger" title="Error" description={usernameError} />
                )}

                {usernameLoading && (
                  <View style={{ alignItems: 'center', paddingVertical: 8 }}>
                    <Spinner />
                  </View>
                )}
              </VStack>
            ) : (
              <VStack gap="md" style={{ alignItems: 'center' }}>
                <Presence visible animation="scaleIn">
                  <CheckCircleIcon size={48} color="#22c55e" />
                </Presence>

                <VStack gap="xs" style={{ alignItems: 'center' }}>
                  <Text size="sm" color="secondary">Your username is</Text>
                  <Text size="xl" weight="bold">
                    {usernameResult.username}
                  </Text>
                </VStack>

                <Card variant="filled" padding="sm" style={{ width: '100%' }}>
                  <Text size="xs" color="muted" align="center">
                    Share this with friends so they can find and add you on Umbra.
                  </Text>
                </Card>
              </VStack>
            )}
          </VStack>
        );

      case 5:
        return (
          <VStack gap="lg" style={{ paddingVertical: 16 }}>
            <View style={{ alignItems: 'center' }}>
              <Presence visible animation="scaleIn">
                <CheckCircleIcon size={64} color="#22c55e" />
              </Presence>
            </View>

            <Presence visible animation="fadeIn" duration={400}>
              <VStack gap="xs" style={{ alignItems: 'center' }}>
                <Text size="xl" weight="bold">
                  Account Created!
                </Text>
                <Text size="sm" color="secondary" align="center">
                  Your identity has been created. You're ready to start using Umbra.
                </Text>
              </VStack>
            </Presence>

            {identity && (
              <Presence visible animation="slideUp" duration={500}>
                <Card variant="outlined" padding="md">
                  <VStack gap="sm">
                    <HStack gap="sm" style={{ alignItems: 'center' }}>
                      <Text size="sm" color="muted">Name:</Text>
                      <Text size="sm" weight="semibold">{identity.displayName}</Text>
                    </HStack>
                    {usernameResult?.username && (
                      <HStack gap="sm" style={{ alignItems: 'center' }}>
                        <Text size="sm" color="muted">Username:</Text>
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
                label="Remember me on this device"
                description="Stay logged in between sessions. Your identity will be stored locally."
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
              disabled={!seedPhrase || isLoading}
              iconRight={<ArrowRightIcon size={16} color="#FFFFFF" />}
            >
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
              iconRight={<ArrowRightIcon size={16} color="#FFFFFF" />}
            >
              Continue
            </Button>
          </HStack>
        );

      // Step 3 (PIN) — footer is handled by PinSetupStep itself (skip / confirm)
      case 3:
        return null;

      // Step 4 (Username)
      case 4:
        return (
          <HStack gap="md" style={{ justifyContent: 'space-between' }}>
            {!usernameResult ? (
              <>
                <Button variant="tertiary" onPress={handleSkipUsername}>
                  Skip for now
                </Button>
                <Button
                  variant="primary"
                  onPress={handleRegisterUsername}
                  disabled={!usernameInput.trim() || usernameLoading}
                  iconRight={<ArrowRightIcon size={16} color="#FFFFFF" />}
                >
                  Claim Username
                </Button>
              </>
            ) : (
              <Button
                variant="primary"
                onPress={goNext}
                fullWidth
                iconRight={<ArrowRightIcon size={16} color="#FFFFFF" />}
              >
                Continue
              </Button>
            )}
          </HStack>
        );

      case 5:
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
    <>
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

      {/* Discovery Opt-In Dialog — shown after profile import + auto-link */}
      {importedProfile && (
        <DiscoveryOptInDialog
          open={showDiscoveryOptIn}
          onClose={handleDiscoveryOptInClose}
          platform={importedProfile.platform}
          onEnableDiscovery={handleEnableDiscovery}
        />
      )}

      {/* Identity Switch Dialog — shown when creating a new identity over existing data */}
      <Dialog
        open={showSwitchDialog}
        onClose={handleKeepOldData}
        title="Existing Data Found"
        description={`You have data from ${oldDids.length} previous ${oldDids.length === 1 ? 'identity' : 'identities'} on this device. Would you like to keep or remove it?`}
        icon={<AlertTriangleIcon size={24} color="#F59E0B" />}
        size="sm"
        footer={
          <HStack gap="sm" style={{ justifyContent: 'flex-end' }}>
            <Button variant="secondary" onPress={handleClearOldData}>
              Start Fresh
            </Button>
            <Button variant="primary" onPress={handleKeepOldData}>
              Keep Old Data
            </Button>
          </HStack>
        }
      />
    </>
  );
}
