import React, { useEffect, useState } from 'react';
import { View, ScrollView, Platform, type ViewStyle, Text as RNText } from 'react-native';
import { Text, Button, Card, VStack, HStack, Separator } from '@coexist/wisp-react-native';
import { useBlobPath, AnimatedBlobs } from '@/components/auth/AnimatedBlobs';
import { WalletIcon, DownloadIcon, KeyIcon } from '@/components/icons';
import { CreateWalletFlow } from '@/components/auth/CreateWalletFlow';
import { ImportWalletFlow } from '@/components/auth/ImportWalletFlow';
import { HelpIndicator } from '@/components/ui/HelpIndicator';
import { HelpText, HelpHighlight, HelpListItem } from '@/components/ui/HelpContent';

// ---------------------------------------------------------------------------
// Load BBH Bartle from Google Fonts (web only)
// Preloads the font and only renders the title once loaded to avoid FOUT
// ---------------------------------------------------------------------------

const FONT_FAMILY = 'BBH Bartle';
const FONT_URL = 'https://fonts.googleapis.com/css2?family=BBH+Bartle&display=swap';

function useGoogleFont() {
  const [loaded, setLoaded] = useState(false);
  const isWeb = Platform.OS === 'web';

  useEffect(() => {
    if (!isWeb) {
      // On native, Google Fonts aren't available — use system font fallback
      setLoaded(true);
      return;
    }

    // Inject the stylesheet if not already present
    if (!document.querySelector(`link[href="${FONT_URL}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = FONT_URL;
      document.head.appendChild(link);
    }

    // Use the Font Loading API to detect when the font is ready
    if ('fonts' in document) {
      document.fonts.load(`400 72px "${FONT_FAMILY}"`).then(() => {
        setLoaded(true);
      }).catch(() => {
        // Font failed to load, show fallback
        setLoaded(true);
      });
    } else {
      // Fallback: wait a bit for font to load
      const timer = setTimeout(() => setLoaded(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  return { loaded, isWeb };
}

// ---------------------------------------------------------------------------
// Shared content rendered twice: normal (black text) + inverted (white text
// clipped to blob shape). The inverted layer sits on top so text edges that
// overlap the blob appear white at the pixel level.
// ---------------------------------------------------------------------------

interface AuthContentProps {
  inverted?: boolean;
  onCreateWallet: () => void;
  onImportWallet: () => void;
  fontLoaded: boolean;
  /** Whether running on web (where Google Fonts work) */
  isWeb: boolean;
}

function AuthContent({ inverted, onCreateWallet, onImportWallet, fontLoaded, isWeb }: AuthContentProps) {
  const textColor = inverted ? '#FFFFFF' : undefined;
  const mutedColor = inverted ? 'rgba(255,255,255,0.6)' : undefined;

  // Inverted buttons: white bg + black text (visible on black blob)
  // Include borderRadius to ensure it renders on React Native
  const invertedBtnStyle: ViewStyle | undefined = inverted
    ? { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF', borderRadius: 8, overflow: 'hidden' }
    : undefined;

  const iconColor = inverted ? '#000000' : '#FFFFFF';

  // On native, use system font; on web, use Google Fonts
  const titleFontFamily = isWeb
    ? (fontLoaded ? `"${FONT_FAMILY}", sans-serif` : 'sans-serif')
    : Platform.OS === 'ios' ? 'Georgia' : 'serif';

  return (
    <View style={{ width: '100%', maxWidth: 420, alignSelf: 'center' }}>
      <VStack gap="xl" style={{ alignItems: 'center' }}>
        {/* Branding */}
        <VStack gap="sm" style={{ alignItems: 'center', marginBottom: 16 }}>
          <RNText
            style={{
              fontFamily: titleFontFamily,
              fontSize: 72,
              lineHeight: 90,
              letterSpacing: 2,
              color: textColor ?? '#000000',
              textAlign: 'center',
              opacity: fontLoaded ? 1 : 0,
            }}
          >
            Umbra
          </RNText>
          <Text
            size="md"
            align="center"
            style={mutedColor ? { color: mutedColor } : undefined}
            color={mutedColor ? undefined : 'secondary'}
          >
            Encrypted messaging, powered by your keys
          </Text>
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
              shape="pill"
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
              shape="pill"
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
// Auth screen
// ---------------------------------------------------------------------------

export default function AuthScreen() {
  const { loaded: fontLoaded, isWeb } = useGoogleFont();
  const { pathData } = useBlobPath(); // single source of truth for blob shape

  // Flow visibility state
  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const handleCreateWallet = () => setShowCreate(true);
  const handleImportWallet = () => setShowImport(true);

  // CSS clip-path using the blob's SVG path data (web only)
  const clipStyle =
    Platform.OS === 'web'
      ? ({ clipPath: `path('${pathData}')` } as any)
      : { display: 'none' as const };

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {/* Layer 1: Black blobs — shares same pathData so it stays in sync */}
      <AnimatedBlobs pathData={pathData} />

      {/* Layer 2: Normal content (black text on white) */}
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 24,
        }}
        style={{ flex: 1 }}
      >
        <AuthContent
          onCreateWallet={handleCreateWallet}
          onImportWallet={handleImportWallet}
          fontLoaded={fontLoaded}
          isWeb={isWeb}
        />
      </ScrollView>

      {/* Layer 3: Inverted content (white text, clipped to blob shape) */}
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
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24,
          }}
          style={{ flex: 1 }}
          scrollEnabled={false}
        >
          <AuthContent
            inverted
            onCreateWallet={handleCreateWallet}
            onImportWallet={handleImportWallet}
            fontLoaded={fontLoaded}
            isWeb={isWeb}
          />
        </ScrollView>
      </View>

      {/* Wallet flow modals */}
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
