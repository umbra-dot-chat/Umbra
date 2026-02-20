import React, { useEffect, useState, useRef } from 'react';
import { View, ScrollView, Platform, type ViewStyle, Text as RNText, Dimensions, useWindowDimensions, Animated } from 'react-native';
import { Text, Button, Card, VStack, HStack, Separator } from '@coexist/wisp-react-native';
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

const TAGLINES = [
  'Private by math, not by promise.',
  'Messaging that forgets you exist.',
  'The chat app that can\u2019t read your chats.',
  'Zero-trust messaging for everyone.',
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
}

function AuthContent({ inverted, onCreateWallet, onImportWallet, fontLoaded, isWeb, taglineIndex, taglineSlideAnim, taglineLineHeight }: AuthContentProps) {
  const textColor = inverted ? '#FFFFFF' : undefined;
  const mutedColor = inverted ? 'rgba(255,255,255,0.6)' : undefined;

  // Inverted buttons: white bg + black text (visible on black blob)
  // Include borderRadius to ensure it renders on React Native
  const invertedBtnStyle: ViewStyle | undefined = inverted
    ? { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF', borderRadius: 8, overflow: 'hidden' }
    : undefined;

  const iconColor = inverted ? '#000000' : '#FFFFFF';

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
              color: textColor ?? '#000000',
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
                style={mutedColor ? { color: mutedColor } : undefined}
                color={mutedColor ? undefined : 'secondary'}
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
            ...(inverted ? { backgroundColor: 'transparent', borderColor: 'rgba(255,255,255,0.3)' } : {}),
          }}
        >
          <VStack gap="md">
            <VStack gap="xs">
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text
                  size="lg"
                  weight="semibold"
                  style={textColor ? { color: textColor } : undefined}
                  color={textColor ? undefined : 'primary'}
                >
                  Create Account
                </Text>
                {!inverted && (
                  <HelpIndicator
                    id="auth-create"
                    title="Creating a Wallet"
                    priority={85}
                    size={14}
                  >
                    <HelpText>
                      Generate a new Ethereum wallet with a unique key pair. This becomes your identity on the Umbra network.
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
                style={mutedColor ? { color: mutedColor } : undefined}
                color={mutedColor ? undefined : 'secondary'}
              >
                Generate a new Ethereum wallet to get started. Your keys, your messages.
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
              Create New Wallet
            </Button>
          </VStack>
        </Card>

        {/* Divider */}
        <HStack gap="md" style={{ width: '100%', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Separator
              spacing="none"
              style={inverted ? { backgroundColor: 'rgba(255,255,255,0.2)' } : undefined}
            />
          </View>
          <Text
            size="sm"
            style={mutedColor ? { color: mutedColor } : undefined}
            color={mutedColor ? undefined : 'muted'}
          >
            or
          </Text>
          <View style={{ flex: 1 }}>
            <Separator
              spacing="none"
              style={inverted ? { backgroundColor: 'rgba(255,255,255,0.2)' } : undefined}
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
            ...(inverted ? { backgroundColor: 'transparent', borderColor: 'rgba(255,255,255,0.3)' } : {}),
          }}
        >
          <VStack gap="md">
            <VStack gap="xs">
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text
                  size="lg"
                  weight="semibold"
                  style={textColor ? { color: textColor } : undefined}
                  color={textColor ? undefined : 'primary'}
                >
                  Import Account
                </Text>
                {!inverted && (
                  <HelpIndicator
                    id="auth-import"
                    title="Importing a Wallet"
                    priority={90}
                    size={14}
                  >
                    <HelpText>
                      Restore your identity using a previously saved recovery phrase (12 or 24 words).
                    </HelpText>
                    <HelpHighlight icon={<DownloadIcon size={22} color="#6366f1" />}>
                      This recovers your exact DID, keys, and identity — your friends will recognize you automatically.
                    </HelpHighlight>
                    <HelpListItem>Use the same recovery phrase from wallet creation</HelpListItem>
                    <HelpListItem>Works across devices and platforms</HelpListItem>
                  </HelpIndicator>
                )}
              </View>
              <Text
                size="sm"
                style={mutedColor ? { color: mutedColor } : undefined}
                color={mutedColor ? undefined : 'secondary'}
              >
                Already have a wallet? Import your existing account to continue.
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
              Import Existing Wallet
            </Button>
          </VStack>
        </Card>

        {/* Footer */}
        <Text
          size="xs"
          align="center"
          style={mutedColor ? { color: mutedColor, marginTop: 8 } : { marginTop: 8 }}
          color={mutedColor ? undefined : 'muted'}
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

  // Flow visibility state
  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const handleCreateWallet = () => setShowCreate(true);
  const handleImportWallet = () => setShowImport(true);

  // Tagline slot-machine rotation — shared across both AuthContent layers
  const taglineLineHeight = 24; // matches Text size="md" line height
  const [taglineIndex, setTaglineIndex] = useState(0);
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
        setTaglineIndex((prev) => (prev + 1) % TAGLINES.length);
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
      />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
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
          {/* Layer 1: Black blobs — absolute within the scrollable area */}
          <AnimatedBlobs pathData={pathData} />

          {/* Layer 2: Normal content (black text on white) */}
          <AuthContent
            onCreateWallet={handleCreateWallet}
            onImportWallet={handleImportWallet}
            fontLoaded={fontLoaded}
            isWeb={isWeb}
            taglineIndex={taglineIndex}
            taglineSlideAnim={taglineSlideAnim}
            taglineLineHeight={taglineLineHeight}
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
