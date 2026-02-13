import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, Pressable, ScrollView, Text as RNText } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import {
  Overlay,
  Toggle,
  Input,
  TextArea,
  Select,
  ColorPicker,
  Button,
  Card,
  QRCode,
  Separator,
  Dialog,
  PinInput,
  HStack,
  VStack,
  Text,
  useTheme,
} from '@coexist/wisp-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import {
  UserIcon,
  PaletteIcon,
  BellIcon,
  ShieldIcon,
  AtSignIcon,
  WalletIcon,
  LogOutIcon,
  CopyIcon,
  KeyIcon,
  GlobeIcon,
  LockIcon,
  AlertTriangleIcon,
  HandshakeIcon,
  DatabaseIcon,
  TrashIcon,
  PlusIcon,
  XIcon,
  ServerIcon,
  ExternalLinkIcon,
  DownloadIcon,
} from '@/components/icons';
import { useNetwork } from '@/hooks/useNetwork';
import { useUmbra } from '@/contexts/UmbraContext';
import { clearDatabaseExport, getSqlDatabase } from '@umbra/wasm';
import { HelpIndicator } from '@/components/ui/HelpIndicator';
import { HelpText, HelpHighlight, HelpListItem } from '@/components/ui/HelpContent';
import { PRIMARY_RELAY_URL, DEFAULT_RELAY_SERVERS } from '@/config';

// Cast icons for Wisp Input compatibility (accepts strokeWidth prop)
type InputIcon = React.ComponentType<{ size?: number | string; color?: string; strokeWidth?: number }>;
const UserInputIcon = UserIcon as InputIcon;
const AtSignInputIcon = AtSignIcon as InputIcon;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

type SettingsSection = 'account' | 'profile' | 'appearance' | 'notifications' | 'privacy' | 'network' | 'data';

interface NavItem {
  id: SettingsSection;
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'account', label: 'Account', icon: WalletIcon },
  { id: 'profile', label: 'Profile', icon: UserIcon },
  { id: 'appearance', label: 'Appearance', icon: PaletteIcon },
  { id: 'notifications', label: 'Notifications', icon: BellIcon },
  { id: 'privacy', label: 'Privacy', icon: ShieldIcon },
  { id: 'network', label: 'Network', icon: GlobeIcon },
  { id: 'data', label: 'Data', icon: DatabaseIcon },
];

const ACCENT_PRESETS = [
  '#000000', '#3B82F6', '#8B5CF6', '#EC4899', '#EF4444',
  '#F97316', '#EAB308', '#22C55E', '#06B6D4', '#6366F1', '#F43F5E',
];

const STATUS_OPTIONS = [
  { value: 'online', label: 'Online', description: 'You appear as available' },
  { value: 'idle', label: 'Idle', description: 'You appear as away' },
  { value: 'dnd', label: 'Do Not Disturb', description: 'Mute all notifications' },
  { value: 'offline', label: 'Invisible', description: 'You appear offline' },
];

const TEXT_SIZE_OPTIONS = [
  { value: 'sm', label: 'Small', description: 'Compact text for more content' },
  { value: 'md', label: 'Medium', description: 'Default text size' },
  { value: 'lg', label: 'Large', description: 'Easier to read' },
];

// ---------------------------------------------------------------------------
// SettingRow — consistent label + description on left, control on right
// ---------------------------------------------------------------------------

function SettingRow({
  label,
  description,
  children,
  vertical = false,
  helpIndicator,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
  vertical?: boolean;
  helpIndicator?: React.ReactNode;
}) {
  const { theme } = useTheme();
  const tc = theme.colors;

  if (vertical) {
    return (
      <View style={{ gap: 8 }}>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <RNText style={{ fontSize: 14, fontWeight: '500', color: tc.text.primary }}>
              {label}
            </RNText>
            {helpIndicator}
          </View>
          {description && (
            <RNText style={{ fontSize: 12, color: tc.text.secondary, marginTop: 2 }}>
              {description}
            </RNText>
          )}
        </View>
        {children}
      </View>
    );
  }

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 40 }}>
      <View style={{ flex: 1, marginRight: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <RNText style={{ fontSize: 14, fontWeight: '500', color: tc.text.primary }}>
            {label}
          </RNText>
          {helpIndicator}
        </View>
        {description && (
          <RNText style={{ fontSize: 12, color: tc.text.secondary, marginTop: 2 }}>
            {description}
          </RNText>
        )}
      </View>
      <View style={{ flexShrink: 0 }}>{children}</View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Section Header
// ---------------------------------------------------------------------------

function SectionHeader({ title, description }: { title: string; description: string }) {
  const { theme } = useTheme();
  const tc = theme.colors;

  return (
    <View style={{ marginBottom: 20 }}>
      <RNText style={{ fontSize: 18, fontWeight: '700', color: tc.text.primary }}>
        {title}
      </RNText>
      <RNText style={{ fontSize: 13, color: tc.text.secondary, marginTop: 4 }}>
        {description}
      </RNText>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

function AccountSection() {
  const { identity, logout } = useAuth();
  const router = useRouter();
  const { theme } = useTheme();
  const tc = theme.colors;
  const [didCopied, setDidCopied] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleCopyDid = useCallback(() => {
    if (!identity) return;
    try {
      navigator.clipboard.writeText(identity.did);
      setDidCopied(true);
      setTimeout(() => setDidCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  }, [identity]);

  const handleLogout = useCallback(() => {
    setShowLogoutConfirm(false);
    logout();
    router.replace('/(auth)');
  }, [logout, router]);

  if (!identity) return null;

  // Convert Unix timestamp (seconds) to milliseconds for Date constructor
  const createdAtMs = identity.createdAt < 1000000000000 ? identity.createdAt * 1000 : identity.createdAt;
  const memberSince = new Date(createdAtMs).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const truncatedDid =
    identity.did.length > 40
      ? `${identity.did.slice(0, 20)}...${identity.did.slice(-20)}`
      : identity.did;

  return (
    <View style={{ gap: 24 }}>
      <SectionHeader
        title="Account"
        description="Your identity and connection details."
      />

      {/* Identity info card */}
      <Card variant="outlined" padding="lg" style={{ width: '100%' }}>
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: tc.accent.primary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <RNText style={{ fontSize: 20, fontWeight: '700', color: '#FFFFFF' }}>
                {identity.displayName.charAt(0).toUpperCase()}
              </RNText>
            </View>
            <View style={{ flex: 1 }}>
              <RNText style={{ fontSize: 18, fontWeight: '700', color: tc.text.primary }}>
                {identity.displayName}
              </RNText>
              <RNText style={{ fontSize: 12, color: tc.text.muted, marginTop: 2 }}>
                Member since {memberSince}
              </RNText>
            </View>
          </View>

          <Separator spacing="sm" />

          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <RNText style={{ fontSize: 11, fontWeight: '600', color: tc.text.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Decentralized ID
              </RNText>
              <HelpIndicator
                id="settings-did"
                title="Your Decentralized ID"
                priority={40}
                size={14}
              >
                <HelpText>
                  Your DID is derived from your cryptographic keys. It's your permanent, verifiable identity on the network.
                </HelpText>
                <HelpHighlight icon={<KeyIcon size={22} color="#6366f1" />}>
                  Unlike usernames, a DID can't be impersonated — it's mathematically tied to your private keys.
                </HelpHighlight>
                <HelpListItem>Share it with friends to connect</HelpListItem>
                <HelpListItem>It never changes unless you create a new wallet</HelpListItem>
              </HelpIndicator>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <RNText
                style={{
                  fontSize: 12,
                  color: tc.text.secondary,
                  fontFamily: 'monospace',
                  flex: 1,
                }}
                numberOfLines={1}
              >
                {truncatedDid}
              </RNText>
              <Pressable
                onPress={handleCopyDid}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  paddingVertical: 4,
                  paddingHorizontal: 8,
                  borderRadius: 6,
                  backgroundColor: didCopied ? '#22c55e20' : tc.background.sunken,
                }}
              >
                <CopyIcon size={14} color={didCopied ? '#22c55e' : tc.text.secondary} />
                <RNText style={{ fontSize: 11, color: didCopied ? '#22c55e' : tc.text.secondary, fontWeight: '500' }}>
                  {didCopied ? 'Copied' : 'Copy'}
                </RNText>
              </Pressable>
            </View>
          </View>
        </View>
      </Card>

      {/* QR Code sharing */}
      <View style={{ gap: 12 }}>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <RNText style={{ fontSize: 15, fontWeight: '600', color: tc.text.primary }}>
              Share Your Identity
            </RNText>
            <HelpIndicator
              id="settings-qr"
              title="QR Code Sharing"
              priority={45}
              size={14}
            >
              <HelpText>
                Others can scan this QR code with Umbra to instantly add you as a friend.
              </HelpText>
              <HelpListItem>The QR code contains your DID</HelpListItem>
              <HelpListItem>It's safe to share — it only contains your public identity</HelpListItem>
              <HelpListItem>Scanning initiates a friend request automatically</HelpListItem>
            </HelpIndicator>
          </View>
          <RNText style={{ fontSize: 12, color: tc.text.secondary, marginTop: 2 }}>
            Others can scan this code to connect with you.
          </RNText>
        </View>

        <Card variant="outlined" padding="lg" style={{ alignItems: 'center' }}>
          <QRCode
            value={identity.did}
            size="md"
            dotStyle="rounded"
            eyeFrameStyle="rounded"
            eyePupilStyle="rounded"
            darkColor={tc.text.primary}
            lightColor="transparent"
            eyeColor={tc.accent.primary}
          />
          <RNText style={{ fontSize: 11, color: tc.text.muted, marginTop: 12, textAlign: 'center' }}>
            {identity.displayName}
          </RNText>
        </Card>
      </View>

      <Separator spacing="sm" />

      {/* Danger zone */}
      <View style={{ gap: 12 }}>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <RNText style={{ fontSize: 15, fontWeight: '600', color: '#EF4444' }}>
              Danger Zone
            </RNText>
            <HelpIndicator
              id="settings-danger"
              title="Before You Log Out"
              icon="!"
              priority={50}
              size={14}
            >
              <HelpText>
                Logging out removes your identity from this device. Make sure you've saved your recovery phrase first!
              </HelpText>
              <HelpHighlight icon={<AlertTriangleIcon size={22} color="#EF4444" />} color="#EF4444">
                Without your recovery phrase, you'll lose access to your identity, friends, and message history permanently.
              </HelpHighlight>
            </HelpIndicator>
          </View>
          <RNText style={{ fontSize: 12, color: tc.text.secondary, marginTop: 2 }}>
            Logging out will clear your current session.
          </RNText>
        </View>

        <Button
          variant="secondary"
          onPress={() => setShowLogoutConfirm(true)}
          iconLeft={<LogOutIcon size={16} color="#EF4444" />}
          style={{ borderColor: '#EF444440', backgroundColor: '#EF444410' }}
        >
          <RNText style={{ color: '#EF4444', fontWeight: '600', fontSize: 14 }}>
            Log Out
          </RNText>
        </Button>
      </View>

      {/* Logout confirmation dialog */}
      <Dialog
        open={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        title="Log Out?"
        description="Logging out will permanently clear your identity from this device. This action cannot be undone. Make sure you have backed up your recovery phrase before proceeding."
        icon={<LogOutIcon size={24} color="#EF4444" />}
        size="sm"
        footer={
          <HStack gap="sm" style={{ justifyContent: 'flex-end' }}>
            <Button variant="tertiary" onPress={() => setShowLogoutConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="secondary"
              onPress={handleLogout}
              style={{ borderColor: '#EF444440', backgroundColor: '#EF444410' }}
            >
              <RNText style={{ color: '#EF4444', fontWeight: '600', fontSize: 14 }}>
                Log Out
              </RNText>
            </Button>
          </HStack>
        }
      />
    </View>
  );
}

function ProfileSection() {
  const [displayName, setDisplayName] = useState('Alice Chen');
  const [username, setUsername] = useState('alice');
  const [bio, setBio] = useState('');
  const [status, setStatus] = useState('online');

  return (
    <View style={{ gap: 20 }}>
      <SectionHeader
        title="Profile"
        description="Manage your public profile information visible to other users."
      />

      <SettingRow label="Display Name" description="How others see you in conversations." vertical>
        <Input
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Your display name"
          icon={UserInputIcon}
          size="md"
          fullWidth
        />
      </SettingRow>

      <SettingRow label="Username" description="Your unique identifier. Others can add you with this." vertical>
        <Input
          value={username}
          onChangeText={setUsername}
          placeholder="username"
          icon={AtSignInputIcon}
          size="md"
          fullWidth
        />
      </SettingRow>

      <SettingRow label="Bio" description="A short description about yourself." vertical>
        <TextArea
          value={bio}
          onChangeText={setBio}
          placeholder="Tell us about yourself..."
          numberOfLines={3}
          fullWidth
        />
      </SettingRow>

      <SettingRow label="Status" description="Set your availability status." vertical>
        <Select
          options={STATUS_OPTIONS}
          value={status}
          onChange={setStatus}
          placeholder="Select status"
          size="md"
          fullWidth
        />
      </SettingRow>
    </View>
  );
}

function AppearanceSection() {
  const { mode, toggleMode, setOverrides, theme } = useTheme();
  const [accentColor, setAccentColor] = useState(theme.colors.accent.primary);
  const [textSize, setTextSize] = useState('md');

  const handleAccentChange = useCallback(
    (color: string) => {
      setAccentColor(color);
      setOverrides({ colors: { accent: { primary: color } } });
    },
    [setOverrides],
  );

  return (
    <View style={{ gap: 20 }}>
      <SectionHeader
        title="Appearance"
        description="Customize the look and feel of the application."
      />

      <SettingRow label="Dark Mode" description="Switch between light and dark themes.">
        <Toggle checked={mode === 'dark'} onChange={toggleMode} />
      </SettingRow>

      <SettingRow label="Accent Color" description="Choose a primary color for buttons, links, and highlights." vertical>
        <ColorPicker
          value={accentColor}
          onChange={handleAccentChange}
          presets={ACCENT_PRESETS}
          size="md"
          showInput
        />
      </SettingRow>

      <SettingRow label="Text Size" description="Adjust the base text size across the app." vertical>
        <Select
          options={TEXT_SIZE_OPTIONS}
          value={textSize}
          onChange={setTextSize}
          placeholder="Select size"
          size="md"
          fullWidth
        />
      </SettingRow>
    </View>
  );
}

function NotificationsSection() {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [messagePreview, setMessagePreview] = useState(true);

  return (
    <View style={{ gap: 20 }}>
      <SectionHeader
        title="Notifications"
        description="Control how and when you receive alerts and updates."
      />

      <SettingRow label="Push Notifications" description="Receive push notifications for new messages and mentions.">
        <Toggle checked={pushEnabled} onChange={() => setPushEnabled((p) => !p)} />
      </SettingRow>

      <SettingRow label="Sound Effects" description="Play sounds for incoming messages and notifications.">
        <Toggle checked={soundEnabled} onChange={() => setSoundEnabled((p) => !p)} />
      </SettingRow>

      <SettingRow label="Message Preview" description="Show message content in notification banners.">
        <Toggle checked={messagePreview} onChange={() => setMessagePreview((p) => !p)} />
      </SettingRow>
    </View>
  );
}

function PrivacySection() {
  const { hasPin, setPin, verifyPin } = useAuth();
  const [readReceipts, setReadReceipts] = useState(true);
  const [typingIndicators, setTypingIndicators] = useState(true);
  const [showOnline, setShowOnline] = useState(true);

  // PIN setup / removal dialog state
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [pinDialogMode, setPinDialogMode] = useState<'setup' | 'remove'>('setup');
  const [pinStage, setPinStage] = useState<'enter' | 'confirm'>('enter');
  const [enteredPin, setEnteredPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [removePin, setRemovePin] = useState('');

  const resetPinDialog = useCallback(() => {
    setShowPinDialog(false);
    setPinStage('enter');
    setEnteredPin('');
    setConfirmPin('');
    setPinError(null);
    setRemovePin('');
  }, []);

  const handlePinToggle = useCallback(() => {
    if (hasPin) {
      // Turning off — need to verify current PIN first
      setPinDialogMode('remove');
      setShowPinDialog(true);
    } else {
      // Turning on — set up a new PIN
      setPinDialogMode('setup');
      setPinStage('enter');
      setShowPinDialog(true);
    }
  }, [hasPin]);

  const handleSetupEnterComplete = useCallback((value: string) => {
    setEnteredPin(value);
    setConfirmPin('');
    setPinError(null);
    setPinStage('confirm');
  }, []);

  const handleSetupConfirmComplete = useCallback(
    (value: string) => {
      if (value === enteredPin) {
        setPin(value);
        resetPinDialog();
      } else {
        setPinError('PINs do not match. Please try again.');
        setConfirmPin('');
      }
    },
    [enteredPin, setPin, resetPinDialog],
  );

  const handleRemoveComplete = useCallback(
    (value: string) => {
      const success = verifyPin(value);
      if (success) {
        setPin(null);
        resetPinDialog();
      } else {
        setPinError('Incorrect PIN. Please try again.');
        setRemovePin('');
      }
    },
    [verifyPin, setPin, resetPinDialog],
  );

  return (
    <View style={{ gap: 20 }}>
      <SectionHeader
        title="Privacy"
        description="Manage your visibility and control what others can see."
      />

      <View style={{ gap: 20 }}>
        <SettingRow
          label="PIN Lock"
          description="Require a PIN to unlock the app and access your keys."
          helpIndicator={
            <HelpIndicator
              id="settings-pin"
              title="PIN Lock"
              priority={55}
              size={14}
            >
              <HelpText>
                Set a 6-digit PIN to prevent unauthorized access to your messages and keys.
              </HelpText>
              <HelpHighlight icon={<LockIcon size={22} color="#6366f1" />}>
                The PIN is stored locally on your device and required every time you open the app.
              </HelpHighlight>
              <HelpListItem>Your private keys stay encrypted behind the PIN</HelpListItem>
              <HelpListItem>You can change or remove the PIN anytime</HelpListItem>
            </HelpIndicator>
          }
        >
          <Toggle checked={hasPin} onChange={handlePinToggle} />
        </SettingRow>

        <SettingRow
          label="Read Receipts"
          description="Let others know when you've seen their messages."
          helpIndicator={
            <HelpIndicator
              id="settings-read-receipts"
              title="Read Receipts"
              priority={60}
              size={14}
            >
              <HelpText>
                When enabled, others can see when you've read their messages (shown as a double checkmark).
              </HelpText>
              <HelpListItem>This is a two-way setting — you also see when they've read yours</HelpListItem>
              <HelpListItem>Disable for more privacy</HelpListItem>
            </HelpIndicator>
          }
        >
          <Toggle checked={readReceipts} onChange={() => setReadReceipts((p) => !p)} />
        </SettingRow>

        <SettingRow label="Typing Indicators" description="Show when you are typing a message to others.">
          <Toggle checked={typingIndicators} onChange={() => setTypingIndicators((p) => !p)} />
        </SettingRow>
      </View>

      <SettingRow label="Online Status" description="Show your online status to other users.">
        <Toggle checked={showOnline} onChange={() => setShowOnline((p) => !p)} />
      </SettingRow>

      {/* PIN setup / removal dialog */}
      <Dialog
        open={showPinDialog}
        onClose={resetPinDialog}
        title={
          pinDialogMode === 'remove'
            ? 'Remove PIN'
            : pinStage === 'confirm'
              ? 'Confirm PIN'
              : 'Set Up PIN'
        }
        description={
          pinDialogMode === 'remove'
            ? 'Enter your current PIN to remove it.'
            : pinStage === 'confirm'
              ? 'Re-enter your PIN to confirm.'
              : 'Choose a 6-digit PIN to lock the app.'
        }
        icon={<KeyIcon size={24} color="#6366f1" />}
        size="sm"
      >
        <View style={{ alignItems: 'center', paddingVertical: 8 }}>
          {pinError && (
            <RNText style={{ color: '#EF4444', fontSize: 13, marginBottom: 12, textAlign: 'center' }}>
              {pinError}
            </RNText>
          )}

          {pinDialogMode === 'remove' ? (
            <PinInput
              length={6}
              value={removePin}
              onChange={setRemovePin}
              onComplete={handleRemoveComplete}
              mask
              autoFocus
              type="number"
              error={pinError ? true : undefined}
            />
          ) : pinStage === 'confirm' ? (
            <PinInput
              key="confirm"
              length={6}
              value={confirmPin}
              onChange={setConfirmPin}
              onComplete={handleSetupConfirmComplete}
              mask
              autoFocus
              type="number"
              error={pinError ? true : undefined}
            />
          ) : (
            <PinInput
              key="enter"
              length={6}
              onComplete={handleSetupEnterComplete}
              mask
              autoFocus
              type="number"
            />
          )}
        </View>
      </Dialog>
    </View>
  );
}

function NetworkSection() {
  const {
    isConnected, peerCount, listenAddresses,
    startNetwork, stopNetwork,
    connectionState, offerData, answerData,
    createOffer, acceptOffer, completeHandshake,
    resetSignaling, error: networkError,
  } = useNetwork();
  const { service } = useUmbra();
  const { identity } = useAuth();
  const { theme } = useTheme();
  const tc = theme.colors;
  const [connectionInfo, setConnectionInfo] = useState<{ did: string; peerId: string; link?: string } | null>(null);
  const [peerIdCopied, setPeerIdCopied] = useState(false);
  const [offerCopied, setOfferCopied] = useState(false);
  const [answerCopied, setAnswerCopied] = useState(false);
  const [pasteInput, setPasteInput] = useState('');

  // Relay management
  interface RelayEntry { url: string; enabled: boolean; isDefault: boolean }
  interface RelayInfo { ping: number | null; region: string | null; location: string | null; online: number | null; meshOnline: number | null; connectedPeers: number | null; federationEnabled: boolean }
  const [relays, setRelays] = useState<RelayEntry[]>(
    DEFAULT_RELAY_SERVERS.map((url) => ({ url, enabled: true, isDefault: true }))
  );
  const [relayInfoMap, setRelayInfoMap] = useState<Record<string, RelayInfo>>({});
  const [newRelayUrl, setNewRelayUrl] = useState('');
  const [relayError, setRelayError] = useState<string | null>(null);

  // Fetch relay info (ping + location) for each relay
  const fetchRelayInfo = useCallback(async (wsUrl: string) => {
    // Convert wss://host/ws → https://host/info
    const httpUrl = wsUrl
      .replace('wss://', 'https://')
      .replace('ws://', 'http://')
      .replace(/\/ws\/?$/, '/info');

    try {
      const start = performance.now();
      const response = await fetch(httpUrl);
      const ping = Math.round(performance.now() - start);

      if (response.ok) {
        const data = await response.json();
        setRelayInfoMap((prev) => ({
          ...prev,
          [wsUrl]: {
            ping,
            region: data.region || null,
            location: data.location || null,
            online: data.online_clients ?? null,
            meshOnline: data.mesh_online_clients ?? null,
            connectedPeers: data.connected_peers ?? null,
            federationEnabled: data.federation_enabled ?? false,
          },
        }));
      } else {
        // Server responded but no /info — just record ping
        setRelayInfoMap((prev) => ({
          ...prev,
          [wsUrl]: { ping, region: null, location: null, online: null, meshOnline: null, connectedPeers: null, federationEnabled: false },
        }));
      }
    } catch {
      setRelayInfoMap((prev) => ({
        ...prev,
        [wsUrl]: { ping: null, region: null, location: null, online: null, meshOnline: null, connectedPeers: null, federationEnabled: false },
      }));
    }
  }, []);

  // Ping all relays on mount and refresh every 500ms
  useEffect(() => {
    // Fetch immediately
    for (const relay of relays) {
      fetchRelayInfo(relay.url);
    }

    const interval = setInterval(() => {
      for (const relay of relays) {
        fetchRelayInfo(relay.url);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [relays.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggleRelay = useCallback((url: string) => {
    setRelays((prev) => prev.map((r) => r.url === url ? { ...r, enabled: !r.enabled } : r));
  }, []);

  const handleAddRelay = useCallback(() => {
    const trimmed = newRelayUrl.trim();
    if (!trimmed) return;

    // Validate URL format
    if (!trimmed.startsWith('wss://') && !trimmed.startsWith('ws://')) {
      setRelayError('URL must start with wss:// or ws://');
      return;
    }

    // Check for duplicates
    if (relays.some((r) => r.url === trimmed)) {
      setRelayError('This relay is already in the list.');
      return;
    }

    setRelays((prev) => [...prev, { url: trimmed, enabled: true, isDefault: false }]);
    setNewRelayUrl('');
    setRelayError(null);
  }, [newRelayUrl, relays]);

  const handleRemoveRelay = useCallback((url: string) => {
    setRelays((prev) => prev.filter((r) => r.url !== url));
    setRelayInfoMap((prev) => {
      const next = { ...prev };
      delete next[url];
      return next;
    });
  }, []);

  useEffect(() => {
    async function fetchInfo() {
      if (!service) return;
      try {
        const info = await service.getConnectionInfo();
        setConnectionInfo(info);
      } catch { /* ignore */ }
    }
    fetchInfo();
  }, [service]);

  const handleCopyPeerId = useCallback(() => {
    const id = connectionInfo?.peerId || '';
    if (!id) return;
    try {
      navigator.clipboard.writeText(id);
      setPeerIdCopied(true);
      setTimeout(() => setPeerIdCopied(false), 2000);
    } catch { /* ignore */ }
  }, [connectionInfo]);

  const handleCopyOffer = useCallback(() => {
    if (!offerData) return;
    try {
      navigator.clipboard.writeText(offerData);
      setOfferCopied(true);
      setTimeout(() => setOfferCopied(false), 2000);
    } catch { /* ignore */ }
  }, [offerData]);

  const handleCopyAnswer = useCallback(() => {
    if (!answerData) return;
    try {
      navigator.clipboard.writeText(answerData);
      setAnswerCopied(true);
      setTimeout(() => setAnswerCopied(false), 2000);
    } catch { /* ignore */ }
  }, [answerData]);

  const handlePasteSubmit = useCallback(() => {
    const input = pasteInput.trim();
    if (!input) return;

    try {
      const data = JSON.parse(input);
      if (data.sdp_type === 'offer') {
        // We're the answerer — accept the offer
        acceptOffer(input);
      } else if (data.sdp_type === 'answer') {
        // We're the offerer — complete the handshake
        completeHandshake(input);
      }
      setPasteInput('');
    } catch {
      // Not JSON or invalid format
    }
  }, [pasteInput, acceptOffer, completeHandshake]);

  const connectionStateLabel = {
    idle: 'Ready to connect',
    creating_offer: 'Creating offer...',
    waiting_for_answer: 'Waiting for answer — share the offer below',
    accepting_offer: 'Accepting offer...',
    completing_handshake: 'Completing handshake...',
    connected: 'Connected!',
    error: networkError?.message || 'Connection failed',
  }[connectionState];

  const connectionStateColor = {
    idle: tc.text.secondary,
    creating_offer: '#f59e0b',
    waiting_for_answer: '#3b82f6',
    accepting_offer: '#f59e0b',
    completing_handshake: '#f59e0b',
    connected: '#22c55e',
    error: '#ef4444',
  }[connectionState];

  return (
    <View style={{ gap: 20 }}>
      <SectionHeader
        title="Network"
        description="Manage your peer-to-peer network connection."
      />

      {/* Connection Status */}
      <Card variant="outlined" padding="lg" style={{ width: '100%' }}>
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{
              width: 10, height: 10, borderRadius: 5,
              backgroundColor: isConnected ? '#22c55e' : '#ef4444',
            }} />
            <RNText style={{ fontSize: 16, fontWeight: '600', color: tc.text.primary }}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </RNText>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <RNText style={{ fontSize: 13, color: tc.text.secondary }}>
              Peers: {peerCount}
            </RNText>
            <RNText style={{ fontSize: 13, color: tc.text.secondary }}>
              Addresses: {listenAddresses.length}
            </RNText>
          </View>
        </View>
      </Card>

      {/* Network Toggle */}
      <SettingRow
        label="P2P Network"
        description="Start or stop the peer-to-peer network."
        helpIndicator={
          <HelpIndicator
            id="settings-p2p"
            title="Peer-to-Peer Network"
            priority={65}
            size={14}
          >
            <HelpText>
              The P2P network connects you directly to friends without any central server. Messages travel directly between devices.
            </HelpText>
            <HelpHighlight icon={<GlobeIcon size={22} color="#6366f1" />}>
              When enabled, your device participates in the decentralized network and can exchange messages in real-time.
            </HelpHighlight>
            <HelpListItem>Uses WebRTC for browser-to-browser connections</HelpListItem>
            <HelpListItem>Falls back to relay server for offline message delivery</HelpListItem>
          </HelpIndicator>
        }
      >
        <Toggle checked={isConnected} onChange={() => isConnected ? stopNetwork() : startNetwork()} />
      </SettingRow>

      {/* Relay Servers */}
      <View style={{ gap: 12 }}>
        <View>
          <RNText style={{ fontSize: 15, fontWeight: '600', color: tc.text.primary }}>
            Relay Servers
          </RNText>
          <RNText style={{ fontSize: 12, color: tc.text.secondary, marginTop: 2 }}>
            Relay servers store messages while you or your friends are offline.
          </RNText>
        </View>

        {relays.map((relay) => {
          const displayUrl = relay.url.replace('wss://', '').replace('ws://', '').replace(/\/ws\/?$/, '');
          const info = relayInfoMap[relay.url];
          const pingColor = !info?.ping ? tc.text.muted : info.ping < 100 ? '#22c55e' : info.ping < 300 ? '#f59e0b' : '#ef4444';
          const locationLabel = info?.location && info?.region
            ? `${info.location}, ${info.region}`
            : info?.region || info?.location || null;

          return (
            <View
              key={relay.url}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderRadius: 8,
                backgroundColor: tc.background.sunken,
                borderWidth: 1,
                borderColor: tc.border.subtle,
              }}
            >
              <View style={{
                width: 8, height: 8, borderRadius: 4,
                backgroundColor: relay.enabled ? '#22c55e' : tc.text.muted,
              }} />
              <View style={{ flex: 1, gap: 3 }}>
                <RNText style={{ fontSize: 13, color: tc.text.primary, fontFamily: 'monospace' }} numberOfLines={1}>
                  {displayUrl}
                </RNText>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  {relay.isDefault && (
                    <RNText style={{ fontSize: 10, color: tc.text.muted, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '600' }}>
                      Default
                    </RNText>
                  )}
                  {locationLabel && (
                    <RNText style={{ fontSize: 11, color: tc.text.secondary }}>
                      {locationLabel}
                    </RNText>
                  )}
                  {info?.ping != null && (
                    <RNText style={{ fontSize: 11, color: pingColor, fontFamily: 'monospace' }}>
                      {info.ping}ms
                    </RNText>
                  )}
                  {info?.online != null && (
                    <RNText style={{ fontSize: 11, color: tc.text.muted }}>
                      {info.online} online
                    </RNText>
                  )}
                  {info?.federationEnabled && info?.connectedPeers != null && info.connectedPeers > 0 && (
                    <RNText style={{ fontSize: 11, color: '#8b5cf6' }}>
                      ⚡ {info.connectedPeers} {info.connectedPeers === 1 ? 'peer' : 'peers'}
                    </RNText>
                  )}
                  {info?.federationEnabled && info?.meshOnline != null && info.meshOnline > (info?.online ?? 0) && (
                    <RNText style={{ fontSize: 11, color: tc.text.muted }}>
                      ({info.meshOnline} mesh)
                    </RNText>
                  )}
                </View>
              </View>
              <Toggle
                checked={relay.enabled}
                onChange={() => handleToggleRelay(relay.url)}
                size="sm"
              />
              {!relay.isDefault && (
                <Pressable
                  onPress={() => handleRemoveRelay(relay.url)}
                  style={{ padding: 4 }}
                  accessibilityLabel="Remove relay"
                >
                  <XIcon size={14} color={tc.text.muted} />
                </Pressable>
              )}
            </View>
          );
        })}

        {/* Add relay input */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <Input
              value={newRelayUrl}
              onChangeText={(text: string) => {
                setNewRelayUrl(text);
                if (relayError) setRelayError(null);
              }}
              placeholder="wss://relay.example.com/ws"
              size="sm"
              fullWidth
            />
          </View>
          <Button
            size="sm"
            variant="outline"
            onPress={handleAddRelay}
            disabled={!newRelayUrl.trim()}
            iconLeft={<PlusIcon size={14} />}
          >
            Add
          </Button>
        </View>
        {relayError && (
          <RNText style={{ fontSize: 12, color: '#ef4444', marginTop: -4 }}>
            {relayError}
          </RNText>
        )}

        {/* Run Your Own Relay */}
        <Pressable
          onPress={() => {
            if (typeof window !== 'undefined') {
              window.open('https://github.com/umbra-chat/relay/releases', '_blank');
            }
          }}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            paddingVertical: 12,
            paddingHorizontal: 14,
            borderRadius: 8,
            backgroundColor: pressed ? tc.background.hover : tc.background.sunken,
            borderWidth: 1,
            borderColor: tc.border.subtle,
            marginTop: 4,
          })}
        >
          <View style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            backgroundColor: '#6366f120',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <ServerIcon size={18} color="#6366f1" />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <RNText style={{ fontSize: 14, fontWeight: '600', color: tc.text.primary }}>
              Run Your Own Relay
            </RNText>
            <RNText style={{ fontSize: 12, color: tc.text.secondary }}>
              Download the relay binary and host your own server
            </RNText>
          </View>
          <ExternalLinkIcon size={16} color={tc.text.muted} />
        </Pressable>
      </View>

      {/* Peer ID */}
      {connectionInfo?.peerId && (
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <RNText style={{ fontSize: 11, fontWeight: '600', color: tc.text.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Peer ID
            </RNText>
            <HelpIndicator
              id="settings-peer-id"
              title="Peer ID"
              priority={70}
              size={14}
            >
              <HelpText>
                Your Peer ID is used by the P2P network to identify your device. It's different from your DID.
              </HelpText>
              <HelpListItem>DID = your identity (persists across devices)</HelpListItem>
              <HelpListItem>Peer ID = this device's network address (changes per session)</HelpListItem>
            </HelpIndicator>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <RNText style={{ fontSize: 12, color: tc.text.secondary, fontFamily: 'monospace', flex: 1 }} numberOfLines={1}>
              {connectionInfo.peerId}
            </RNText>
            <Pressable
              onPress={handleCopyPeerId}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 4,
                paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6,
                backgroundColor: peerIdCopied ? '#22c55e20' : tc.background.sunken,
              }}
            >
              <CopyIcon size={14} color={peerIdCopied ? '#22c55e' : tc.text.secondary} />
              <RNText style={{ fontSize: 11, color: peerIdCopied ? '#22c55e' : tc.text.secondary, fontWeight: '500' }}>
                {peerIdCopied ? 'Copied' : 'Copy'}
              </RNText>
            </Pressable>
          </View>
        </View>
      )}

      <Separator spacing="sm" />

      {/* ── WebRTC Connection Flow ─────────────────────────────────── */}
      <View style={{ gap: 12 }}>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <RNText style={{ fontSize: 15, fontWeight: '600', color: tc.text.primary }}>
              Connect to Peer
            </RNText>
            <HelpIndicator
              id="settings-connect-peer"
              title="Direct P2P Connection"
              priority={75}
              size={14}
            >
              <HelpText>
                Exchange offer/answer data to establish a direct encrypted connection with another Umbra user.
              </HelpText>
              <HelpHighlight icon={<HandshakeIcon size={22} color="#6366f1" />}>
                This creates a WebRTC data channel — messages travel directly between browsers with no server in between.
              </HelpHighlight>
              <HelpListItem>Step 1: Create an offer and share it</HelpListItem>
              <HelpListItem>Step 2: Your peer pastes your offer and generates an answer</HelpListItem>
              <HelpListItem>Step 3: Paste their answer to complete the connection</HelpListItem>
            </HelpIndicator>
          </View>
          <RNText style={{ fontSize: 12, color: tc.text.secondary, marginTop: 2 }}>
            Exchange connection data with another user to establish a direct P2P link.
          </RNText>
        </View>

        {/* Connection State Indicator */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: connectionStateColor }} />
          <RNText style={{ fontSize: 12, color: connectionStateColor }}>
            {connectionStateLabel}
          </RNText>
        </View>

        {/* Step 1: Create Offer button */}
        {connectionState === 'idle' && (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button size="sm" onPress={createOffer} style={{ flex: 1 }}>
              Create Offer (I invite)
            </Button>
          </View>
        )}

        {/* Show offer data for copying */}
        {offerData && connectionState === 'waiting_for_answer' && (
          <Card variant="outlined" padding="md" style={{ width: '100%' }}>
            <View style={{ gap: 8 }}>
              <RNText style={{ fontSize: 11, fontWeight: '600', color: tc.text.muted, textTransform: 'uppercase' }}>
                Your Offer (share with peer)
              </RNText>
              <RNText style={{ fontSize: 10, color: tc.text.secondary, fontFamily: 'monospace' }} numberOfLines={3}>
                {offerData.slice(0, 200)}...
              </RNText>
              <Button size="sm" variant={offerCopied ? 'ghost' : 'outline'} onPress={handleCopyOffer}>
                {offerCopied ? 'Copied!' : 'Copy Offer'}
              </Button>
            </View>
          </Card>
        )}

        {/* Show answer data for copying (answerer side) */}
        {answerData && connectionState !== 'connected' && (
          <Card variant="outlined" padding="md" style={{ width: '100%' }}>
            <View style={{ gap: 8 }}>
              <RNText style={{ fontSize: 11, fontWeight: '600', color: tc.text.muted, textTransform: 'uppercase' }}>
                Your Answer (share with peer)
              </RNText>
              <RNText style={{ fontSize: 10, color: tc.text.secondary, fontFamily: 'monospace' }} numberOfLines={3}>
                {answerData.slice(0, 200)}...
              </RNText>
              <Button size="sm" variant={answerCopied ? 'ghost' : 'outline'} onPress={handleCopyAnswer}>
                {answerCopied ? 'Copied!' : 'Copy Answer'}
              </Button>
            </View>
          </Card>
        )}

        {/* Paste input for offer/answer */}
        {(connectionState === 'idle' || connectionState === 'waiting_for_answer') && (
          <View style={{ gap: 8 }}>
            <RNText style={{ fontSize: 11, fontWeight: '600', color: tc.text.muted, textTransform: 'uppercase' }}>
              {connectionState === 'waiting_for_answer'
                ? 'Paste Answer from Peer'
                : 'Paste Offer from Peer'}
            </RNText>
            <TextArea
              value={pasteInput}
              onChangeText={setPasteInput}
              placeholder="Paste the connection data here..."
              numberOfLines={3}
              fullWidth
            />
            <Button
              size="sm"
              onPress={handlePasteSubmit}
              disabled={!pasteInput.trim()}
            >
              {connectionState === 'waiting_for_answer' ? 'Complete Connection' : 'Accept Offer'}
            </Button>
          </View>
        )}

        {/* Connected state */}
        {connectionState === 'connected' && (
          <Card variant="outlined" padding="md" style={{ width: '100%', backgroundColor: '#22c55e10' }}>
            <RNText style={{ fontSize: 14, fontWeight: '600', color: '#22c55e', textAlign: 'center' }}>
              Peer connected successfully!
            </RNText>
          </Card>
        )}

        {/* Error state */}
        {connectionState === 'error' && networkError && (
          <Card variant="outlined" padding="md" style={{ width: '100%', backgroundColor: '#ef444410' }}>
            <View style={{ gap: 8 }}>
              <RNText style={{ fontSize: 12, color: '#ef4444' }}>
                {networkError.message}
              </RNText>
              <Button size="sm" variant="outline" onPress={resetSignaling}>
                Try Again
              </Button>
            </View>
          </Card>
        )}

        {/* Reset button for non-idle states */}
        {connectionState !== 'idle' && connectionState !== 'error' && (
          <Button size="sm" variant="ghost" onPress={resetSignaling}>
            Reset
          </Button>
        )}
      </View>

      <Separator spacing="sm" />

      {/* Connection Info QR (existing) */}
      {identity && (
        <View style={{ gap: 12 }}>
          <View>
            <RNText style={{ fontSize: 15, fontWeight: '600', color: tc.text.primary }}>
              Your DID
            </RNText>
            <RNText style={{ fontSize: 12, color: tc.text.secondary, marginTop: 2 }}>
              Share your DID for others to add you as a friend.
            </RNText>
          </View>
          <Card variant="outlined" padding="lg" style={{ alignItems: 'center' }}>
            <QRCode
              value={identity.did}
              size="md"
              dotStyle="rounded"
              eyeFrameStyle="rounded"
              eyePupilStyle="rounded"
              darkColor={tc.text.primary}
              lightColor="transparent"
              eyeColor={tc.accent.primary}
            />
            <RNText style={{ fontSize: 11, color: tc.text.muted, marginTop: 12, textAlign: 'center' }}>
              {identity.displayName} • {identity.did.slice(0, 20)}...
            </RNText>
          </Card>
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Data Management Section
// ---------------------------------------------------------------------------

function DataManagementSection() {
  const { identity } = useAuth();
  const { service } = useUmbra();
  const { theme } = useTheme();
  const tc = theme.colors;
  const [showClearMessagesConfirm, setShowClearMessagesConfirm] = useState(false);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);
  const [clearStatus, setClearStatus] = useState<string | null>(null);

  // Selective wipe: delete specific tables from the in-memory sql.js database
  // and then re-persist to IndexedDB
  const handleClearMessages = useCallback(async () => {
    setShowClearMessagesConfirm(false);
    setClearStatus('Clearing messages...');

    try {
      const db = getSqlDatabase();
      if (db) {
        // Clear message-related tables while keeping friends, groups, conversations
        const tables = ['messages', 'reactions', 'pinned_messages', 'thread_messages'];
        for (const table of tables) {
          try {
            (db as any).run(`DELETE FROM ${table}`);
          } catch {
            // Table may not exist — skip silently
          }
        }
        // Reset unread counts on conversations
        try {
          (db as any).run(`UPDATE conversations SET unread_count = 0, last_message_at = NULL`);
        } catch {
          // Ignore if table doesn't exist
        }
      }
      // Dispatch events to refresh all hooks that depend on message data
      if (service) {
        service.dispatchMessageEvent({ type: 'messagesCleared' } as any);
        service.dispatchGroupEvent({ type: 'dataCleared' } as any);
      }
      setClearStatus('Messages cleared successfully.');
      setTimeout(() => setClearStatus(null), 3000);
    } catch (err) {
      console.error('[DataManagement] Failed to clear messages:', err);
      setClearStatus('Failed to clear messages.');
      setTimeout(() => setClearStatus(null), 3000);
    }
  }, [service]);

  // Full wipe: clear the entire IndexedDB database for the current DID
  const handleClearAllData = useCallback(async () => {
    setShowClearAllConfirm(false);
    setClearStatus('Clearing all data...');

    try {
      if (identity?.did) {
        await clearDatabaseExport(identity.did);
      }
      // Also clear the in-memory database tables
      const db = getSqlDatabase();
      if (db) {
        const tables = [
          'messages', 'reactions', 'pinned_messages', 'thread_messages',
          'conversations', 'friends', 'friend_requests', 'blocked_users',
          'groups', 'group_members',
        ];
        for (const table of tables) {
          try {
            (db as any).run(`DELETE FROM ${table}`);
          } catch {
            // Table may not exist — skip silently
          }
        }
      }
      // Dispatch events to refresh ALL hooks (friends, conversations, messages, groups)
      if (service) {
        service.dispatchFriendEvent({ type: 'dataCleared' } as any);
        service.dispatchMessageEvent({ type: 'messagesCleared' } as any);
        service.dispatchGroupEvent({ type: 'dataCleared' } as any);
      }
      setClearStatus('All data cleared.');
      setTimeout(() => setClearStatus(null), 5000);
    } catch (err) {
      console.error('[DataManagement] Failed to clear all data:', err);
      setClearStatus('Failed to clear data.');
      setTimeout(() => setClearStatus(null), 3000);
    }
  }, [identity, service]);

  return (
    <View style={{ gap: 24 }}>
      <SectionHeader
        title="Data Management"
        description="Manage your locally stored data. All data is stored on this device only."
      />

      {/* Info card */}
      <Card variant="outlined" padding="lg" style={{ width: '100%' }}>
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <DatabaseIcon size={18} color={tc.accent.primary} />
            <RNText style={{ fontSize: 14, fontWeight: '600', color: tc.text.primary }}>
              Local Storage
            </RNText>
          </View>
          <RNText style={{ fontSize: 12, color: tc.text.secondary, lineHeight: 18 }}>
            Your messages, friends, and conversations are stored locally using IndexedDB.
            Data is isolated per identity and persists across page refreshes.
          </RNText>
          {identity && (
            <RNText style={{ fontSize: 11, color: tc.text.muted, fontFamily: 'monospace', marginTop: 4 }}>
              DID: {identity.did.slice(0, 24)}...
            </RNText>
          )}
        </View>
      </Card>

      {/* Status message */}
      {clearStatus && (
        <Card
          variant="outlined"
          padding="md"
          style={{
            width: '100%',
            backgroundColor: clearStatus.includes('Failed') ? '#ef444410' : '#22c55e10',
          }}
        >
          <RNText style={{
            fontSize: 13,
            color: clearStatus.includes('Failed') ? '#ef4444' : '#22c55e',
            fontWeight: '500',
            textAlign: 'center',
          }}>
            {clearStatus}
          </RNText>
        </Card>
      )}

      <Separator spacing="sm" />

      {/* Selective wipe */}
      <View style={{ gap: 12 }}>
        <View>
          <RNText style={{ fontSize: 15, fontWeight: '600', color: tc.text.primary }}>
            Clear Messages
          </RNText>
          <RNText style={{ fontSize: 12, color: tc.text.secondary, marginTop: 2 }}>
            Delete all messages, reactions, pins, and threads. Your friends, groups, and conversations will be kept.
          </RNText>
        </View>

        <Button
          variant="secondary"
          onPress={() => setShowClearMessagesConfirm(true)}
          iconLeft={<TrashIcon size={16} color="#F97316" />}
          style={{ borderColor: '#F9731640', backgroundColor: '#F9731610' }}
        >
          <RNText style={{ color: '#F97316', fontWeight: '600', fontSize: 14 }}>
            Clear Messages
          </RNText>
        </Button>
      </View>

      <Separator spacing="sm" />

      {/* Full wipe */}
      <View style={{ gap: 12 }}>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <RNText style={{ fontSize: 15, fontWeight: '600', color: '#EF4444' }}>
              Clear All Data
            </RNText>
            <HelpIndicator
              id="settings-clear-all"
              title="Clear All Data"
              icon="!"
              priority={80}
              size={14}
            >
              <HelpText>
                This removes all locally stored data including messages, friends, groups, and conversations.
              </HelpText>
              <HelpHighlight icon={<AlertTriangleIcon size={22} color="#EF4444" />} color="#EF4444">
                Your identity and recovery phrase are NOT affected. You can still log back in, but you'll need to re-add friends and start new conversations.
              </HelpHighlight>
            </HelpIndicator>
          </View>
          <RNText style={{ fontSize: 12, color: tc.text.secondary, marginTop: 2 }}>
            Delete everything: messages, friends, groups, and conversations. Your identity is preserved.
          </RNText>
        </View>

        <Button
          variant="secondary"
          onPress={() => setShowClearAllConfirm(true)}
          iconLeft={<AlertTriangleIcon size={16} color="#EF4444" />}
          style={{ borderColor: '#EF444440', backgroundColor: '#EF444410' }}
        >
          <RNText style={{ color: '#EF4444', fontWeight: '600', fontSize: 14 }}>
            Clear All Data
          </RNText>
        </Button>
      </View>

      {/* Clear messages confirmation */}
      <Dialog
        open={showClearMessagesConfirm}
        onClose={() => setShowClearMessagesConfirm(false)}
        title="Clear Messages?"
        description="This will permanently delete all messages, reactions, pins, and threads from this device. Your friends and groups will be kept. This action cannot be undone."
        icon={<TrashIcon size={24} color="#F97316" />}
        size="sm"
        footer={
          <HStack gap="sm" style={{ justifyContent: 'flex-end' }}>
            <Button variant="tertiary" onPress={() => setShowClearMessagesConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="secondary"
              onPress={handleClearMessages}
              style={{ borderColor: '#F9731640', backgroundColor: '#F9731610' }}
            >
              <RNText style={{ color: '#F97316', fontWeight: '600', fontSize: 14 }}>
                Clear Messages
              </RNText>
            </Button>
          </HStack>
        }
      />

      {/* Clear all data confirmation */}
      <Dialog
        open={showClearAllConfirm}
        onClose={() => setShowClearAllConfirm(false)}
        title="Clear All Data?"
        description="This will permanently delete ALL locally stored data including messages, friends, groups, and conversations. Your identity and recovery phrase are NOT affected. This action cannot be undone."
        icon={<AlertTriangleIcon size={24} color="#EF4444" />}
        size="sm"
        footer={
          <HStack gap="sm" style={{ justifyContent: 'flex-end' }}>
            <Button variant="tertiary" onPress={() => setShowClearAllConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="secondary"
              onPress={handleClearAllData}
              style={{ borderColor: '#EF444440', backgroundColor: '#EF444410' }}
            >
              <RNText style={{ color: '#EF4444', fontWeight: '600', fontSize: 14 }}>
                Clear All Data
              </RNText>
            </Button>
          </HStack>
        }
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// SettingsDialog
// ---------------------------------------------------------------------------

export function SettingsDialog({ open, onClose }: SettingsDialogProps) {
  const { theme, mode } = useTheme();
  const tc = theme.colors;
  const isDark = mode === 'dark';
  const [activeSection, setActiveSection] = useState<SettingsSection>('account');

  // -- Styles ----------------------------------------------------------------

  const modalStyle = useMemo<ViewStyle>(
    () => ({
      width: 760,
      maxWidth: '95%',
      height: 520,
      maxHeight: '85%',
      flexDirection: 'row',
      borderRadius: 16,
      overflow: 'hidden',
      backgroundColor: isDark ? '#1E1E22' : tc.background.canvas,
      borderWidth: isDark ? 1 : 0,
      borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'transparent',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: isDark ? 0.6 : 0.25,
      shadowRadius: 32,
      elevation: 12,
    }),
    [tc, isDark],
  );

  const sidebarStyle = useMemo<ViewStyle>(
    () => ({
      width: 200,
      backgroundColor: isDark ? '#161618' : tc.background.sunken,
      borderRightWidth: 1,
      borderRightColor: isDark ? 'rgba(255,255,255,0.08)' : tc.border.subtle,
      paddingVertical: 16,
      paddingHorizontal: 12,
    }),
    [tc, isDark],
  );

  const sidebarTitleStyle = useMemo<TextStyle>(
    () => ({
      fontSize: 13,
      fontWeight: '700',
      color: tc.text.secondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      paddingHorizontal: 8,
      marginBottom: 8,
    }),
    [tc],
  );

  // -- Render ----------------------------------------------------------------

  const renderSection = () => {
    switch (activeSection) {
      case 'account':
        return <AccountSection />;
      case 'profile':
        return <ProfileSection />;
      case 'appearance':
        return <AppearanceSection />;
      case 'notifications':
        return <NotificationsSection />;
      case 'privacy':
        return <PrivacySection />;
      case 'network':
        return <NetworkSection />;
      case 'data':
        return <DataManagementSection />;
    }
  };

  return (
    <Overlay
      open={open}
      backdrop="dim"
      center
      onBackdropPress={onClose}
      animationType="fade"
    >
      <View style={modalStyle}>
        {/* ── Left Sidebar ── */}
        <View style={sidebarStyle}>
          <RNText style={sidebarTitleStyle}>Settings</RNText>

          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            const Icon = item.icon;

            return (
              <Pressable
                key={item.id}
                onPress={() => setActiveSection(item.id)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  paddingVertical: 8,
                  paddingHorizontal: 10,
                  borderRadius: 8,
                  backgroundColor: isActive
                    ? tc.accent.primary
                    : pressed
                      ? (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)')
                      : 'transparent',
                  marginBottom: 2,
                })}
              >
                <Icon
                  size={18}
                  color={isActive ? '#FFFFFF' : tc.text.secondary}
                />
                <RNText
                  style={{
                    fontSize: 14,
                    fontWeight: isActive ? '600' : '400',
                    color: isActive ? '#FFFFFF' : tc.text.secondary,
                  }}
                >
                  {item.label}
                </RNText>
              </Pressable>
            );
          })}
        </View>

        {/* ── Right Content Area ── */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 28 }}
          showsVerticalScrollIndicator={false}
        >
          {renderSection()}
        </ScrollView>
      </View>
    </Overlay>
  );
}
