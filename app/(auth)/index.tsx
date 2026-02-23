import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, ScrollView, Platform, Text as RNText, Dimensions, useWindowDimensions, Animated, Pressable, Image } from 'react-native';
import { Text, Button, Card, VStack, HStack, Separator, Presence, useTheme } from '@coexist/wisp-react-native';
import { useBlobPath, AnimatedBlobs } from '@/components/auth/AnimatedBlobs';
import { WalletIcon, DownloadIcon, KeyIcon, LockIcon, ShieldIcon, ArrowLeftIcon } from '@/components/icons';
import { CreateWalletFlow } from '@/components/auth/CreateWalletFlow';
import { ImportWalletFlow } from '@/components/auth/ImportWalletFlow';
import { GrowablePinInput } from '@/components/auth/GrowablePinInput';
import { HelpIndicator } from '@/components/ui/HelpIndicator';
import { HelpText, HelpHighlight, HelpListItem } from '@/components/ui/HelpContent';
import { useAuth, type StoredAccount } from '@/contexts/AuthContext';
// react-native-svg is already used by AnimatedBlobs, safe to import on all platforms
import Svg, { Path } from 'react-native-svg';

// Ghost logo assets — black and white variants for theme + blob inversion
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ghostBlack = require('@/assets/images/ghost-black.png');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ghostWhite = require('@/assets/images/ghost-white.png');

// ---------------------------------------------------------------------------
// Shared content rendered twice: normal (black text) + inverted (white text
// clipped to blob shape). The inverted layer sits on top so text edges that
// overlap the blob appear white at the pixel level.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Slot-machine tagline rotation
// ---------------------------------------------------------------------------

export const TAGLINES = [
  // Original taglines
  'Private by math, not by promise.',
  'Messaging that forgets you exist.',
  'The chat app that can\u2019t read your chats.',
  'Zero-trust messaging for everyone.',
  // Privacy & Encryption
  'Encrypted before it leaves your fingertips.',
  'Even we can\u2019t read your messages.',
  '256-bit encryption. Zero compromises.',
  'Your secrets, mathematically protected.',
  'End-to-end encryption, no exceptions.',
  'Where "private" actually means private.',
  'Servers see ciphertext. You see conversations.',
  'Privacy you don\u2019t have to trust\u2014you can verify.',
  // Identity & Ownership
  'No phone number. No email. No problem.',
  '24 words. One identity. Total control.',
  'Your keys live on your device. Always.',
  'Self-sovereign identity for everyone.',
  'Own your identity with a recovery phrase.',
  'No accounts to hack. No passwords to leak.',
  'Your identity, powered by cryptography.',
  'Portable identity across every device.',
  // Architecture & P2P
  'Messages flow peer-to-peer, not through servers.',
  'Direct connections. No middleman.',
  'Decentralized by design, not by buzzword.',
  'Your data stays on your devices.',
  'No honeypot servers to breach.',
  'P2P messaging with relay fallback.',
  'The network gets stronger with every user.',
  // Anti-Surveillance
  'Mass surveillance? Architecturally impossible.',
  'No metadata to mine. No graphs to build.',
  'We can\u2019t comply with data requests\u2014we don\u2019t have the data.',
  'Built for journalists, activists, and you.',
  'Where SIM swap attacks can\u2019t follow.',
  'No third-party SMS. No Twilio breaches.',
  // File Sharing
  'Share files of any size. No limits. No uploads.',
  'P2P file transfers, encrypted per-file.',
  'Your files never touch our servers.',
  // Features
  'Communities without corporate control.',
  'Voice calls that stay between you.',
  'Plugins built by community, not committees.',
  'Discord features. Signal privacy.',
  'Cross-platform: iOS, Android, Web, Desktop.',
  // Philosophy
  'Open source. Auditable. Trustless.',
  'When the company dies, your data lives on.',
  'No terms of service can delete your community.',
];

const TAGLINE_INTERVAL = 3500; // ms between rotations
const TAGLINE_ANIM_DURATION = 500; // ms for the slide transition

interface AuthContentProps {
  inverted?: boolean;
  onCreateWallet: () => void;
  onImportWallet: () => void;
  /** Current tagline index from shared rotation */
  taglineIndex: number;
  /** Animated translateY for slot-machine effect */
  taglineSlideAnim: Animated.Value;
  /** Line height of the tagline text for clipping */
  taglineLineHeight: number;
  /** Whether the app is in dark mode */
  isDark: boolean;
  /** Theme color tokens */
  tc: {
    text: { primary: string; secondary: string; muted: string };
    background: { canvas: string; surface?: string; sunken?: string };
    border: { subtle: string };
    accent?: { primary?: string };
  };
  /** Stored accounts for re-login (only rendered on normal layer) */
  accounts?: StoredAccount[];
  /** Called when user taps a stored account */
  onAccountPress?: (account: StoredAccount) => void;
}

function AuthContent({ inverted, onCreateWallet, onImportWallet, taglineIndex, taglineSlideAnim, taglineLineHeight, isDark, tc, accounts, onAccountPress }: AuthContentProps) {
  // Normal layer: use theme text colors. Inverted layer: flip — bg color on blob.
  const textColor = inverted ? tc.background.canvas : tc.text.primary;
  const mutedColor = inverted
    ? (isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)')
    : tc.text.secondary;

  // Whether to show the compact "has accounts" layout
  const hasAccounts = accounts && accounts.length > 0;

  // Inverted card/button/separator styles
  // Inside the blob, colors flip: dark theme blob is light, so borders should be dark.
  const invertedBorder = isDark ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.35)';
  const invertedBorderSubtle = isDark ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.25)';
  // Cards must be solid-filled — inverted uses blob fill color (tc.text.primary),
  // normal uses canvas so the card is opaque black/white matching the theme.
  const invertedCardStyle = inverted
    ? { backgroundColor: tc.text.primary, borderColor: invertedBorder }
    : { backgroundColor: tc.background.canvas };
  const invertedSepStyle = inverted
    ? { backgroundColor: invertedBorderSubtle }
    : undefined;
  // Button icon color: inverted uses text color (on canvas bg button), normal uses canvas (on primary button)
  const btnIconColor = inverted ? tc.text.primary : tc.background.canvas;

  // ── Branding block ──────────────────────────────────────────────────────
  // Ghost logo: PNG assets matching the loading screen, 25% smaller (225px).
  // Normal layer: dark mode → white ghost, light mode → black ghost
  // Inverted layer (on blob): dark mode → black ghost, light mode → white ghost
  const GHOST_SIZE = 225;
  const ghostSource = inverted
    ? (isDark ? ghostBlack : ghostWhite)
    : (isDark ? ghostWhite : ghostBlack);
  const brandingBlock = (
    <VStack gap="none" style={{ alignItems: 'center', marginBottom: hasAccounts ? 8 : 16, width: '100%' }}>
      <Image
        source={ghostSource}
        style={{ width: GHOST_SIZE, height: GHOST_SIZE }}
        resizeMode="contain"
      />
      {/* Slot-machine tagline rotation */}
      <View style={{ height: taglineLineHeight, overflow: 'hidden' }}>
        <Animated.View style={{ transform: [{ translateY: taglineSlideAnim }] }}>
          <Text
            size="md"
            align="center"
            style={{ color: mutedColor }}
          >
            {TAGLINES[taglineIndex]}
          </Text>
        </Animated.View>
      </View>
    </VStack>
  );

  return (
    <View style={{ width: '100%' }}>
      <VStack gap="xl" style={{ alignItems: 'center' }}>
        {brandingBlock}

        {hasAccounts ? (
          /* ── Compact layout: accounts + small action buttons ──────────── */
          <>
            {/* Stored accounts list */}
            <Card
              variant="outlined"
              padding="lg"
              radius="md"
              style={{ width: '100%', ...invertedCardStyle }}
            >
              <VStack gap="md">
                <VStack gap="xs">
                  <Text size="lg" weight="semibold" style={{ color: textColor }}>
                    Your Accounts
                  </Text>
                  <Text size="sm" style={{ color: mutedColor }}>
                    Tap an account to sign back in.
                  </Text>
                </VStack>
                {accounts.map((account) => (
                  <Pressable
                    key={account.did}
                    onPress={() => onAccountPress?.(account)}
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: 12,
                      borderRadius: 8,
                      backgroundColor: inverted
                        ? tc.text.primary
                        : tc.background.canvas,
                      borderWidth: 1,
                      borderColor: inverted
                        ? (isDark ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.2)')
                        : tc.border.subtle,
                      opacity: pressed && !inverted ? 0.8 : 1,
                    })}
                  >
                    <View style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: inverted ? (isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)') : (tc.accent?.primary ?? '#5865F2'),
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      marginRight: 12,
                    }}>
                      {!inverted && account.avatar ? (
                        <Image source={{ uri: account.avatar }} style={{ width: 40, height: 40 }} />
                      ) : (
                        <Text size="sm" weight="bold" style={{ color: inverted ? textColor : '#fff' }}>
                          {(account.displayName ?? '?').charAt(0).toUpperCase()}
                        </Text>
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text size="md" weight="semibold" style={{ color: textColor }}>
                        {account.displayName}
                      </Text>
                      <Text size="xs" style={{ color: mutedColor }}>
                        {account.did.slice(0, 24)}...
                      </Text>
                    </View>
                    {account.pin && (
                      <LockIcon size={16} color={mutedColor} />
                    )}
                  </Pressable>
                ))}
              </VStack>
            </Card>

            {/* Compact action row: Create / Import as small buttons */}
            <HStack gap="md" style={{ width: '100%', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Separator spacing="none" style={invertedSepStyle} />
              </View>
              <Text size="sm" style={{ color: mutedColor }}>
                or
              </Text>
              <View style={{ flex: 1 }}>
                <Separator spacing="none" style={invertedSepStyle} />
              </View>
            </HStack>
            <HStack gap="sm" style={{ width: '100%' }}>
              {inverted ? (
                /* Inverted layer: plain Views matching Button shape so we control all colors */
                <>
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 36, borderRadius: 8, backgroundColor: tc.background.canvas, borderWidth: 1, borderColor: tc.background.canvas }}>
                    <WalletIcon size={16} color={tc.text.primary} />
                    <RNText style={{ fontSize: 14, fontWeight: '500', color: tc.text.primary }}>Create New</RNText>
                  </View>
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 36, borderRadius: 8, backgroundColor: tc.background.canvas, borderWidth: 1, borderColor: tc.background.canvas }}>
                    <DownloadIcon size={16} color={tc.text.primary} />
                    <RNText style={{ fontSize: 14, fontWeight: '500', color: tc.text.primary }}>Import</RNText>
                  </View>
                </>
              ) : (
                <>
                  <Button
                    variant="secondary"
                    size="md"
                    shape="rounded"
                    style={{ flex: 1 }}
                    onPress={onCreateWallet}
                    iconLeft={<WalletIcon size={16} color={tc.text.primary} />}
                  >
                    Create New
                  </Button>
                  <Button
                    variant="secondary"
                    size="md"
                    shape="rounded"
                    style={{ flex: 1 }}
                    onPress={onImportWallet}
                    iconLeft={<DownloadIcon size={16} color={tc.text.primary} />}
                  >
                    Import
                  </Button>
                </>
              )}
            </HStack>

            <Text
              size="xs"
              align="center"
              style={{ color: mutedColor }}
            >
              Your private keys never leave your device
            </Text>
          </>
        ) : (
          /* ── Original layout: full Create + Import cards ──────────────── */
          <>
            {/* Create Account */}
            <Card
              variant="outlined"
              padding="lg"
              radius="md"
              style={{ width: '100%', ...invertedCardStyle }}
            >
              <VStack gap="md">
                <VStack gap="xs">
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text
                      size="lg"
                      weight="semibold"
                      style={{ color: textColor }}
                    >
                      Create Account
                    </Text>
                    {!inverted && (
                      <HelpIndicator
                        id="auth-create"
                        title="Creating an Account"
                        priority={85}
                        size={14}
                      >
                        <HelpText>
                          Generate a new account with a unique key pair. This becomes your identity on the Umbra network.
                        </HelpText>
                        <HelpHighlight icon={<KeyIcon size={22} color="#6366f1" />}>
                          You'll receive a 12-word recovery phrase. Write it down and keep it safe — it's the only way to restore your identity.
                        </HelpHighlight>
                        <HelpListItem>Your keys never leave your device</HelpListItem>
                        <HelpListItem>No email or phone number required</HelpListItem>
                        <HelpListItem>Fully self-sovereign identity</HelpListItem>
                      </HelpIndicator>
                    )}
                  </View>
                  <Text
                    size="sm"
                    style={{ color: mutedColor }}
                  >
                    Generate a new account to get started. Your keys, your messages.
                  </Text>
                </VStack>
                {inverted ? (
                  <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 40, borderRadius: 8, backgroundColor: tc.background.canvas, borderWidth: 1, borderColor: tc.background.canvas }}>
                    <WalletIcon size={18} color={tc.text.primary} />
                    <RNText style={{ fontSize: 16, fontWeight: '500', color: tc.text.primary }}>Create New Account</RNText>
                  </View>
                ) : (
                  <Button
                    variant="primary"
                    size="lg"
                    shape="rounded"
                    fullWidth
                    onPress={onCreateWallet}
                    iconLeft={<WalletIcon size={18} color={btnIconColor} />}
                  >
                    Create New Account
                  </Button>
                )}
              </VStack>
            </Card>

            {/* Divider */}
            <HStack gap="md" style={{ width: '100%', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Separator spacing="none" style={invertedSepStyle} />
              </View>
              <Text
                size="sm"
                style={{ color: mutedColor }}
              >
                or
              </Text>
              <View style={{ flex: 1 }}>
                <Separator spacing="none" style={invertedSepStyle} />
              </View>
            </HStack>

            {/* Import Account */}
            <Card
              variant="outlined"
              padding="lg"
              radius="md"
              style={{ width: '100%', ...invertedCardStyle }}
            >
              <VStack gap="md">
                <VStack gap="xs">
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text
                      size="lg"
                      weight="semibold"
                      style={{ color: textColor }}
                    >
                      Import Account
                    </Text>
                    {!inverted && (
                      <HelpIndicator
                        id="auth-import"
                        title="Importing an Account"
                        priority={90}
                        size={14}
                      >
                        <HelpText>
                          Restore your identity using a previously saved recovery phrase (12 or 24 words).
                        </HelpText>
                        <HelpHighlight icon={<DownloadIcon size={22} color="#6366f1" />}>
                          This recovers your exact DID, keys, and identity — your friends will recognize you automatically.
                        </HelpHighlight>
                        <HelpListItem>Use the same recovery phrase from account creation</HelpListItem>
                        <HelpListItem>Works across devices and platforms</HelpListItem>
                      </HelpIndicator>
                    )}
                  </View>
                  <Text
                    size="sm"
                    style={{ color: mutedColor }}
                  >
                    Already have an account? Import your existing account to continue.
                  </Text>
                </VStack>
                {inverted ? (
                  <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 40, borderRadius: 8, backgroundColor: tc.background.canvas, borderWidth: 1, borderColor: tc.background.canvas }}>
                    <DownloadIcon size={18} color={tc.text.primary} />
                    <RNText style={{ fontSize: 16, fontWeight: '500', color: tc.text.primary }}>Import Existing Account</RNText>
                  </View>
                ) : (
                  <Button
                    variant="primary"
                    size="lg"
                    shape="rounded"
                    fullWidth
                    onPress={onImportWallet}
                    iconLeft={<DownloadIcon size={18} color={btnIconColor} />}
                  >
                    Import Existing Account
                  </Button>
                )}
              </VStack>
            </Card>

            {/* Footer */}
            <Text
              size="xs"
              align="center"
              style={{ color: mutedColor, marginTop: 8 }}
            >
              Your private keys never leave your device
            </Text>
          </>
        )}
      </VStack>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Native inverted layer — uses MaskedView + SVG blob as mask
// ---------------------------------------------------------------------------

/**
 * Native-only inverted layer — uses MaskedView to clip content to the blob shape.
 * MaskedView uses the alpha channel of the mask element: black (opaque) regions
 * reveal the children, transparent regions hide them.
 */
function NativeInvertedLayer({
  pathData,
  children,
}: {
  pathData: string;
  children: React.ReactNode;
}) {
  // Lazy-require MaskedView so it's never bundled on web
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const MaskedViewComponent = require('@react-native-masked-view/masked-view').default;

  const [dims, setDims] = useState(() => Dimensions.get('window'));

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => {
      setDims(window);
    });
    return () => sub?.remove();
  }, []);

  if (!pathData || dims.width === 0) return null;

  return (
    <MaskedViewComponent
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
      pointerEvents="none"
      maskElement={
        <Svg
          width={dims.width}
          height={dims.height}
          viewBox={`0 0 ${dims.width} ${dims.height}`}
        >
          <Path d={pathData} fill="black" />
        </Svg>
      }
    >
      {children}
    </MaskedViewComponent>
  );
}

export default function AuthScreen() {
  const { pathData } = useBlobPath(); // single source of truth for blob shape
  const { height: windowHeight } = useWindowDimensions();
  const { theme, mode } = useTheme();
  const isDark = mode === 'dark';
  const tc = theme.colors;

  // Multi-account: stored accounts for re-login
  const { accounts, loginFromStoredAccount } = useAuth();

  // Flow visibility state
  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);

  // PIN verification full-screen overlay state for stored accounts
  const [pinDialogAccount, setPinDialogAccount] = useState<StoredAccount | null>(null);
  const [pinValue, setPinValue] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinAttempts, setPinAttempts] = useState(0);
  const [pinCooldown, setPinCooldown] = useState(0);
  const pinShakeAnim = useRef(new Animated.Value(0)).current;

  const PIN_MAX_ATTEMPTS = 5;
  const PIN_COOLDOWN_SECONDS = 30;

  // Cooldown timer for PIN attempts
  useEffect(() => {
    if (pinCooldown <= 0) return;
    const timer = setInterval(() => {
      setPinCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setPinAttempts(0);
          setPinError(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [pinCooldown]);

  const triggerPinShake = useCallback(() => {
    pinShakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(pinShakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(pinShakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(pinShakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(pinShakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(pinShakeAnim, { toValue: 4, duration: 50, useNativeDriver: true }),
      Animated.timing(pinShakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }, [pinShakeAnim]);

  const handleCreateWallet = () => setShowCreate(true);
  const handleImportWallet = () => setShowImport(true);

  const handleAccountPress = useCallback((account: StoredAccount) => {
    if (account.pin) {
      // Account has PIN protection — show full-screen PIN overlay
      setPinDialogAccount(account);
      setPinValue('');
      setPinError(null);
      setPinAttempts(0);
      setPinCooldown(0);
    } else {
      // No PIN — re-login immediately
      loginFromStoredAccount(account.did);
    }
  }, [loginFromStoredAccount]);

  const handlePinSubmit = useCallback((pin: string) => {
    if (!pinDialogAccount) return;
    if (pinCooldown > 0) return;

    if (pin === pinDialogAccount.pin) {
      setPinDialogAccount(null);
      loginFromStoredAccount(pinDialogAccount.did);
    } else {
      const newAttempts = pinAttempts + 1;
      setPinAttempts(newAttempts);
      setPinValue('');
      triggerPinShake();

      if (newAttempts >= PIN_MAX_ATTEMPTS) {
        setPinError(`Too many attempts. Try again in ${PIN_COOLDOWN_SECONDS}s.`);
        setPinCooldown(PIN_COOLDOWN_SECONDS);
      } else {
        setPinError(`Incorrect PIN. ${PIN_MAX_ATTEMPTS - newAttempts} attempts remaining.`);
      }
    }
  }, [pinDialogAccount, loginFromStoredAccount, pinAttempts, pinCooldown, triggerPinShake]);

  const handlePinDialogClose = useCallback(() => {
    setPinDialogAccount(null);
    setPinValue('');
    setPinError(null);
    setPinAttempts(0);
    setPinCooldown(0);
  }, []);

  // Tagline slot-machine rotation — shared across both AuthContent layers
  const taglineLineHeight = 24; // matches Text size="md" line height
  const [taglineIndex, setTaglineIndex] = useState(() => Math.floor(Math.random() * TAGLINES.length));
  const taglineSlideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      // Slide current tagline up and out
      Animated.timing(taglineSlideAnim, {
        toValue: -taglineLineHeight,
        duration: TAGLINE_ANIM_DURATION,
        useNativeDriver: true,
      }).start(() => {
        // Swap to next tagline, position it below
        setTaglineIndex((prev) => {
          let next;
          do { next = Math.floor(Math.random() * TAGLINES.length); } while (next === prev && TAGLINES.length > 1);
          return next;
        });
        taglineSlideAnim.setValue(taglineLineHeight);
        // Slide new tagline up into view
        Animated.timing(taglineSlideAnim, {
          toValue: 0,
          duration: TAGLINE_ANIM_DURATION,
          useNativeDriver: true,
        }).start();
      });
    }, TAGLINE_INTERVAL);

    return () => clearInterval(interval);
  }, [taglineSlideAnim]);

  const isNative = Platform.OS !== 'web';

  // CSS clip-path using the blob's SVG path data (web only)
  const clipStyle =
    !isNative
      ? ({ clipPath: `path('${pathData}')` } as any)
      : undefined;

  // -------------------------------------------------------------------------
  // Single-ScrollView architecture: all three layers live inside ONE
  // ScrollView so they scroll & bounce together on iOS.
  //
  //   ScrollView
  //     └─ contentWrapper (minHeight: screen, relative)
  //         ├─ Layer 1: AnimatedBlobs (absolute fill)
  //         ├─ Layer 2: AuthContent (normal, centered)
  //         └─ Layer 3: Inverted AuthContent (absolute fill, clipped to blob)
  // -------------------------------------------------------------------------

  // Inverted AuthContent props (no onAccountPress — pointerEvents="none" on wrapper)
  const invertedContentElement = (
    <AuthContent
      inverted
      onCreateWallet={handleCreateWallet}
      onImportWallet={handleImportWallet}
      taglineIndex={taglineIndex}
      taglineSlideAnim={taglineSlideAnim}
      taglineLineHeight={taglineLineHeight}
      isDark={isDark}
      tc={tc}
      accounts={accounts}
    />
  );

  return (
    <View style={{ flex: 1, backgroundColor: tc.background.canvas }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
        }}
        style={{ flex: 1 }}
        bounces={true}
        alwaysBounceVertical={true}
      >
        {/* All layers in one container — scrolls & bounces as a unit */}
        <View style={{ minHeight: windowHeight, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          {/* Layer 1: Blob fill — color inverts with theme */}
          <AnimatedBlobs pathData={pathData} color={tc.text.primary} />

          {/* Layers 2 & 3 share ONE relative container so the inverted
              overlay is pixel-identical to the normal content — no separate
              flex centering that could round differently. */}
          <View style={{ width: '100%', maxWidth: 420, position: 'relative' }}>
            {/* Layer 2: Normal content (themed text on canvas bg) */}
            <AuthContent
              onCreateWallet={handleCreateWallet}
              onImportWallet={handleImportWallet}
              taglineIndex={taglineIndex}
              taglineSlideAnim={taglineSlideAnim}
              taglineLineHeight={taglineLineHeight}
              isDark={isDark}
              tc={tc}
              accounts={accounts}
              onAccountPress={handleAccountPress}
            />

            {/* Layer 3: Inverted content — absolute overlay on the SAME
                container as Layer 2, then the full-screen clip-path wrapper
                is applied outside.  On native, MaskedView wraps the whole
                thing; on web, we put the absolute overlay inside a full-screen
                clip-path element but position it at the same scroll-relative
                location. */}
          </View>

          {/* Full-screen clip-path wrapper — clips to blob shape */}
          {isNative ? (
            <NativeInvertedLayer pathData={pathData}>
              <View
                style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0, bottom: 0,
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: 24,
                }}
                pointerEvents="none"
              >
                <View style={{ width: '100%', maxWidth: 420 }}>
                  {invertedContentElement}
                </View>
              </View>
            </NativeInvertedLayer>
          ) : (
            <View
              style={[
                {
                  position: 'absolute',
                  top: 0, left: 0, right: 0, bottom: 0,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: 24,
                },
                clipStyle,
              ]}
              pointerEvents="none"
            >
              <View style={{ width: '100%', maxWidth: 420 }}>
                {invertedContentElement}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Wallet flow modals — outside scroll so they overlay */}
      <CreateWalletFlow
        open={showCreate}
        onClose={() => setShowCreate(false)}
      />
      <ImportWalletFlow
        open={showImport}
        onClose={() => setShowImport(false)}
      />

      {/* Full-screen PIN verification overlay for stored accounts */}
      {!!pinDialogAccount && (
        <View style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: tc.background.canvas,
          zIndex: 9999,
        }}>
          {/* Back button */}
          <Pressable
            onPress={handlePinDialogClose}
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
            <ArrowLeftIcon size={24} color={tc.text.primary} />
          </Pressable>

          <Presence visible animation="scaleIn">
            <VStack gap="xl" style={{ alignItems: 'center', paddingHorizontal: 32 }}>
              <ShieldIcon size={48} color={tc.text.muted} />

              <VStack gap="xs" style={{ alignItems: 'center' }}>
                <Text size="display-sm" weight="bold">
                  Welcome Back
                </Text>
                <Text size="sm" color="secondary" align="center">
                  Enter your PIN to sign in as {pinDialogAccount.displayName}
                </Text>
              </VStack>

              <Animated.View style={{ transform: [{ translateX: pinShakeAnim }] }}>
                <GrowablePinInput
                  minLength={5}
                  maxLength={5}
                  value={pinValue}
                  onChange={setPinValue}
                  onComplete={handlePinSubmit}
                  mask
                  autoFocus
                  disabled={pinCooldown > 0}
                  error={!!pinError}
                />
              </Animated.View>

              {pinError && (
                <Presence visible animation="fadeIn">
                  <Text size="sm" color="danger" align="center">
                    {pinCooldown > 0
                      ? `Too many attempts. Try again in ${pinCooldown}s.`
                      : pinError}
                  </Text>
                </Presence>
              )}
            </VStack>
          </Presence>
        </View>
      )}
    </View>
  );
}
