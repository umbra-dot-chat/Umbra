import React, { useEffect, useState, useRef } from 'react';
import { View, ScrollView, Platform, type ViewStyle, Text as RNText, Dimensions, useWindowDimensions, Animated } from 'react-native';
import { Text, Button, Card, VStack, HStack, Separator, useTheme } from '@coexist/wisp-react-native';
import * as ExpoFont from 'expo-font';
import { useBlobPath, AnimatedBlobs } from '@/components/auth/AnimatedBlobs';
import { WalletIcon, DownloadIcon, KeyIcon } from '@/components/icons';
import { CreateWalletFlow } from '@/components/auth/CreateWalletFlow';
import { ImportWalletFlow } from '@/components/auth/ImportWalletFlow';
import { HelpIndicator } from '@/components/ui/HelpIndicator';
import { HelpText, HelpHighlight, HelpListItem } from '@/components/ui/HelpContent';
// react-native-svg is already used by AnimatedBlobs, safe to import on all platforms
import Svg, { Path } from 'react-native-svg';

// ---------------------------------------------------------------------------
// Load BBH Bartle from Google Fonts (web + native)
// Preloads the font and only renders the title once loaded to avoid FOUT
// ---------------------------------------------------------------------------

const FONT_FAMILY = 'BBH Bartle';
const FONT_URL = 'https://fonts.googleapis.com/css2?family=BBH+Bartle&display=swap';
/** Direct .ttf URL via fontsource CDN for native loading */
const FONT_TTF_URL = 'https://cdn.jsdelivr.net/fontsource/fonts/bbh-bartle@latest/latin-400-normal.ttf';

function useGoogleFont() {
  const [loaded, setLoaded] = useState(false);
  const isWeb = Platform.OS === 'web';

  useEffect(() => {
    if (isWeb) {
      // Web: inject <link> stylesheet
      if (!document.querySelector(`link[href="${FONT_URL}"]`)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = FONT_URL;
        document.head.appendChild(link);
      }

      if ('fonts' in document) {
        document.fonts.load(`400 72px "${FONT_FAMILY}"`).then(() => {
          setLoaded(true);
        }).catch(() => {
          setLoaded(true);
        });
      } else {
        const timer = setTimeout(() => setLoaded(true), 500);
        return () => clearTimeout(timer);
      }
    } else {
      // Native: load .ttf via expo-font
      ExpoFont.loadAsync({
        [FONT_FAMILY]: FONT_TTF_URL,
      }).then(() => {
        setLoaded(true);
      }).catch(() => {
        // Font failed to load — show with fallback
        setLoaded(true);
      });
    }
  }, []);

  return { loaded, isWeb };
}

// ---------------------------------------------------------------------------
// Shared content rendered twice: normal (black text) + inverted (white text
// clipped to blob shape). The inverted layer sits on top so text edges that
// overlap the blob appear white at the pixel level.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Responsive title sizing — scales the "Umbra" text down on narrow screens
// ---------------------------------------------------------------------------

function useResponsiveTitleSize() {
  const { width } = useWindowDimensions();
  // 72px fits comfortably on all modern phones (375px+).
  // Only scale down on very narrow screens (<340px) — clamp to min 48px.
  const fontSize = width < 340 ? Math.max(48, Math.round(width * 0.2)) : 72;
  const lineHeight = Math.round(fontSize * 1.25);
  return { fontSize, lineHeight };
}

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
  fontLoaded: boolean;
  /** Whether running on web (where Google Fonts work) */
  isWeb: boolean;
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
    background: { canvas: string };
    border: { subtle: string };
  };
}

function AuthContent({ inverted, onCreateWallet, onImportWallet, fontLoaded, isWeb, taglineIndex, taglineSlideAnim, taglineLineHeight, isDark, tc }: AuthContentProps) {
  // Normal layer: use theme text colors. Inverted layer: flip — bg color on blob.
  const textColor = inverted ? tc.background.canvas : tc.text.primary;
  const mutedColor = inverted
    ? (isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)')
    : tc.text.secondary;

  // Inverted buttons: canvas bg + text color (visible on blob)
  const invertedBtnStyle: ViewStyle | undefined = inverted
    ? { backgroundColor: tc.background.canvas, borderColor: tc.background.canvas, borderRadius: 8, overflow: 'hidden' }
    : undefined;

  // Icon on primary button: canvas color. On inverted button: text color.
  const iconColor = inverted ? tc.text.primary : tc.background.canvas;

  // Font family for the title — works on both web and native now
  const titleFontFamily = isWeb
    ? (fontLoaded ? `"${FONT_FAMILY}", sans-serif` : 'sans-serif')
    : (fontLoaded ? FONT_FAMILY : Platform.OS === 'ios' ? 'Georgia' : 'serif');

  const { fontSize: titleFontSize, lineHeight: titleLineHeight } = useResponsiveTitleSize();

  return (
    <View style={{ width: '100%', maxWidth: 420, alignSelf: 'center' }}>
      <VStack gap="xl" style={{ alignItems: 'center' }}>
        {/* Branding */}
        <VStack gap="sm" style={{ alignItems: 'center', marginBottom: 16 }}>
          <RNText
            adjustsFontSizeToFit
            numberOfLines={1}
            style={{
              fontFamily: titleFontFamily,
              fontSize: titleFontSize,
              lineHeight: titleLineHeight,
              letterSpacing: 2,
              color: textColor,
              textAlign: 'center',
              opacity: fontLoaded ? 1 : 0,
            }}
          >
            Umbra
          </RNText>
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

        {/* Create Account */}
        <Card
          variant="outlined"
          padding="lg"
          radius="md"
          style={{
            width: '100%',
            ...(inverted ? { backgroundColor: 'transparent', borderColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)' } : {}),
          }}
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
            <Button
              variant={inverted ? 'secondary' : 'primary'}
              size="lg"
              shape="rounded"
              fullWidth
              onPress={onCreateWallet}
              style={invertedBtnStyle}
              iconLeft={<WalletIcon size={18} color={iconColor} />}
            >
              Create New Account
            </Button>
          </VStack>
        </Card>

        {/* Divider */}
        <HStack gap="md" style={{ width: '100%', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Separator
              spacing="none"
              style={inverted ? { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)' } : undefined}
            />
          </View>
          <Text
            size="sm"
            style={{ color: mutedColor }}
          >
            or
          </Text>
          <View style={{ flex: 1 }}>
            <Separator
              spacing="none"
              style={inverted ? { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)' } : undefined}
            />
          </View>
        </HStack>

        {/* Import Account */}
        <Card
          variant="outlined"
          padding="lg"
          radius="md"
          style={{
            width: '100%',
            ...(inverted ? { backgroundColor: 'transparent', borderColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)' } : {}),
          }}
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
            <Button
              variant={inverted ? 'secondary' : 'primary'}
              size="lg"
              shape="rounded"
              fullWidth
              onPress={onImportWallet}
              style={invertedBtnStyle}
              iconLeft={<DownloadIcon size={18} color={iconColor} />}
            >
              Import Existing Account
            </Button>
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
  const { loaded: fontLoaded, isWeb } = useGoogleFont();
  const { pathData } = useBlobPath(); // single source of truth for blob shape
  const { height: windowHeight } = useWindowDimensions();
  const { theme, mode } = useTheme();
  const isDark = mode === 'dark';
  const tc = theme.colors;

  // Flow visibility state
  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const handleCreateWallet = () => setShowCreate(true);
  const handleImportWallet = () => setShowImport(true);

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

  // Inverted content — no ScrollView wrapper needed anymore since it's in the
  // single outer ScrollView
  const invertedContent = (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
      }}
      pointerEvents="none"
    >
      <AuthContent
        inverted
        onCreateWallet={handleCreateWallet}
        onImportWallet={handleImportWallet}
        fontLoaded={fontLoaded}
        isWeb={isWeb}
        taglineIndex={taglineIndex}
        taglineSlideAnim={taglineSlideAnim}
        taglineLineHeight={taglineLineHeight}
        isDark={isDark}
        tc={tc}
      />
    </View>
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

          {/* Layer 2: Normal content (themed text on canvas bg) */}
          <AuthContent
            onCreateWallet={handleCreateWallet}
            onImportWallet={handleImportWallet}
            fontLoaded={fontLoaded}
            isWeb={isWeb}
            taglineIndex={taglineIndex}
            taglineSlideAnim={taglineSlideAnim}
            taglineLineHeight={taglineLineHeight}
            isDark={isDark}
            tc={tc}
          />

          {/* Layer 3: Inverted content (white text, clipped to blob shape) */}
          {isNative ? (
            <NativeInvertedLayer pathData={pathData}>
              {invertedContent}
            </NativeInvertedLayer>
          ) : (
            <View
              style={[
                {
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                },
                clipStyle,
              ]}
              pointerEvents="none"
            >
              {invertedContent}
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
    </View>
  );
}
