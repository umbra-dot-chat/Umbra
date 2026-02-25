import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { View, Pressable, ScrollView, Text as RNText, Platform, Image, Linking, Modal, SafeAreaView } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  Tag,
  Slider,
  SegmentedControl,
  useTheme,
} from '@coexist/wisp-react-native';
import { defaultRadii } from '@coexist/wisp-core/theme/create-theme';
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
  MapPinIcon,
  ActivityIcon,
  ZapIcon,
  NetworkIcon,
  UsersIcon,
  ChevronDownIcon,
  VideoIcon,
  CheckIcon,
  BookOpenIcon,
  MessageIcon,
  VolumeIcon,
  MusicIcon,
  ArrowLeftIcon,
} from '@/components/icons';
import { useNetwork } from '@/hooks/useNetwork';
import { useCall } from '@/hooks/useCall';
import { BACKGROUND_PRESETS, useVideoEffects } from '@/hooks/useVideoEffects';
import type { VideoEffect, BackgroundPreset } from '@/hooks/useVideoEffects';
import { VideoEffectsPreview } from 'expo-video-effects/src/ExpoVideoEffectsView';
import { useCallSettings } from '@/hooks/useCallSettings';
import { useMediaDevices } from '@/hooks/useMediaDevices';
import type { VideoQuality, AudioQuality, OpusConfig, OpusApplication, AudioBitrate } from '@/types/call';
import { VIDEO_QUALITY_PRESETS, AUDIO_QUALITY_PRESETS, DEFAULT_OPUS_CONFIG } from '@/types/call';
import { useUmbra } from '@/contexts/UmbraContext';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const umbraDeadImage = require('@/assets/emoji/umbra-dead.png');
import { usePlugins } from '@/contexts/PluginContext';
import { useFonts, FONT_REGISTRY } from '@/contexts/FontContext';
import { useAppTheme, type TextSize } from '@/contexts/ThemeContext';
import { useSound } from '@/contexts/SoundContext';
import {
  SOUND_THEMES,
  SOUND_CATEGORIES,
  CATEGORY_LABELS,
  SoundEngine,
  type SoundThemeId,
} from '@/services/SoundEngine';
import { useMessaging } from '@/contexts/MessagingContext';
import type { MessageDisplayMode } from '@/contexts/MessagingContext';
import { SlotRenderer } from '@/components/plugins/SlotRenderer';
import { clearDatabaseExport, getSqlDatabase } from '@umbra/wasm';
import { useAppUpdate } from '@/hooks/useAppUpdate';
import { useIsMobile } from '@/hooks/useIsMobile';
import { AllPlatformsDialog } from '@/components/modals/AllPlatformsDialog';
import { HelpIndicator } from '@/components/ui/HelpIndicator';
import { HelpPopoverHost } from '@/components/ui/HelpPopoverHost';
import { HelpText, HelpHighlight, HelpListItem } from '@/components/ui/HelpContent';
import { PRIMARY_RELAY_URL, DEFAULT_RELAY_SERVERS } from '@/config';
import { LinkedAccountsPanel, FriendDiscoveryPanel } from '@/components/discovery';

// Cast icons for Wisp Input compatibility (accepts strokeWidth prop)
type InputIcon = React.ComponentType<{ size?: number | string; color?: string; strokeWidth?: number }>;
const UserInputIcon = UserIcon as InputIcon;
const AtSignInputIcon = AtSignIcon as InputIcon;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SettingsSection = 'account' | 'profile' | 'appearance' | 'messaging' | 'notifications' | 'sounds' | 'privacy' | 'audio-video' | 'network' | 'data' | 'plugins' | 'about';

export interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
  onOpenMarketplace?: () => void;
  initialSection?: SettingsSection;
}

interface NavItem {
  id: SettingsSection;
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'account', label: 'Account', icon: WalletIcon },
  { id: 'profile', label: 'Profile', icon: UserIcon },
  { id: 'appearance', label: 'Appearance', icon: PaletteIcon },
  { id: 'messaging', label: 'Messaging', icon: MessageIcon },
  { id: 'notifications', label: 'Notifications', icon: BellIcon },
  { id: 'sounds', label: 'Sounds', icon: VolumeIcon },
  { id: 'privacy', label: 'Privacy', icon: ShieldIcon },
  { id: 'audio-video', label: 'Audio & Video', icon: VideoIcon },
  { id: 'network', label: 'Network', icon: GlobeIcon },
  { id: 'data', label: 'Data', icon: DatabaseIcon },
  { id: 'plugins', label: 'Plugins', icon: ZapIcon },
  { id: 'about', label: 'About', icon: BookOpenIcon },
];

interface SubNavItem { id: string; label: string; }

const SUBCATEGORIES: Partial<Record<SettingsSection, SubNavItem[]>> = {
  account: [
    { id: 'identity', label: 'Identity' },
    { id: 'sharing', label: 'Sharing' },
    { id: 'danger', label: 'Danger Zone' },
  ],
  appearance: [
    { id: 'theme', label: 'Theme' },
    { id: 'dark-mode', label: 'Dark Mode' },
    { id: 'colors', label: 'Colors' },
    { id: 'text-size', label: 'Text Size' },
    { id: 'font', label: 'Font' },
  ],
  privacy: [
    { id: 'discovery', label: 'Friend Discovery' },
    { id: 'visibility', label: 'Visibility' },
    { id: 'security', label: 'Security' },
  ],
  'audio-video': [
    { id: 'calling', label: 'Calling' },
    { id: 'video', label: 'Video' },
    { id: 'audio', label: 'Audio' },
    { id: 'devices', label: 'Devices' },
  ],
  network: [
    { id: 'connection', label: 'Connection' },
    { id: 'relays', label: 'Relays' },
    { id: 'peers', label: 'Peers' },
    { id: 'identity', label: 'Identity' },
  ],
};

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
// InlineDropdown — reusable positioned dropdown for Settings selects
// ---------------------------------------------------------------------------

interface InlineDropdownOption {
  value: string;
  label: string;
  description?: string;
}

// Lazy-load createPortal only on web
let _createPortal: ((children: React.ReactNode, container: Element) => React.ReactPortal) | null = null;
if (Platform.OS === 'web') {
  try { _createPortal = require('react-dom').createPortal; } catch {}
}

function InlineDropdown({
  options,
  value,
  onChange,
  placeholder = 'Select…',
}: {
  options: InlineDropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const { theme, mode } = useTheme();
  const tc = theme.colors;
  const isDark = mode === 'dark';
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  const triggerRef = useRef<View>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const isNative = Platform.OS !== 'web';

  // Measure trigger position when opening (web only)
  useEffect(() => {
    if (!open || Platform.OS !== 'web' || !triggerRef.current) return;
    const el = triggerRef.current as unknown as HTMLElement;
    const rect = el.getBoundingClientRect();
    setDropdownPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
  }, [open]);

  const optionsList = (
    <ScrollView style={{ maxHeight: isNative ? 400 : 240 }} showsVerticalScrollIndicator={false} nestedScrollEnabled>
      {options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => { onChange(opt.value); setOpen(false); }}
            style={({ pressed }) => ({
              flexDirection: 'row' as const,
              alignItems: 'center' as const,
              paddingVertical: 12,
              paddingHorizontal: 16,
              backgroundColor: isActive
                ? tc.accent.highlight
                : pressed
                  ? tc.background.sunken
                  : 'transparent',
            })}
          >
            <View style={{ flex: 1 }}>
              <RNText style={{
                fontSize: 14,
                fontWeight: isActive ? '600' : '400',
                color: isActive ? tc.accent.primary : (isNative ? tc.text.onRaised : tc.text.primary),
              }}>
                {opt.label}
              </RNText>
              {opt.description && (
                <RNText style={{ fontSize: 12, color: isNative ? tc.text.onRaisedSecondary : tc.text.muted, marginTop: 2 }}>
                  {opt.description}
                </RNText>
              )}
            </View>
            {isActive && (
              <RNText style={{ fontSize: 14, color: tc.accent.primary, fontWeight: '600' }}>✓</RNText>
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );

  // Web: portal-based positioned dropdown
  const webDropdownList = open && (
    <>
      <Pressable
        onPress={() => setOpen(false)}
        style={{ position: 'fixed' as any, top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999 }}
      />
      <View
        style={{
          position: 'fixed' as any,
          top: dropdownPos.top,
          left: dropdownPos.left,
          width: dropdownPos.width,
          zIndex: 100000,
          backgroundColor: isDark ? tc.background.raised : '#FFFFFF',
          borderRadius: 10,
          borderWidth: 1,
          borderColor: tc.border.subtle,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDark ? 0.3 : 0.12,
          shadowRadius: 16,
          elevation: 8,
          maxHeight: 240,
          overflow: 'hidden' as any,
        }}
      >
        {optionsList}
      </View>
    </>
  );

  return (
    <View>
      <Pressable
        ref={triggerRef}
        onPress={() => setOpen((p) => !p)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          height: 40,
          paddingHorizontal: 14,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: open ? tc.accent.primary : tc.border.strong,
          backgroundColor: 'transparent',
          gap: 8,
        }}
      >
        <RNText style={{ flex: 1, fontSize: 14, color: selected ? tc.text.primary : tc.text.muted }} numberOfLines={1}>
          {selected?.label ?? placeholder}
        </RNText>
        {selected?.description && (
          <RNText style={{ fontSize: 11, color: tc.text.muted }}>
            {selected.description}
          </RNText>
        )}
        <View style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}>
          <ChevronDownIcon size={16} color={tc.text.secondary} />
        </View>
      </Pressable>

      {/* Web: portal dropdown to document.body */}
      {!isNative && _createPortal
        ? _createPortal(webDropdownList, document.body)
        : !isNative && webDropdownList}

      {/* Native: Modal-based dropdown */}
      {isNative && (
        <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)} statusBarTranslucent>
          <Pressable
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}
            onPress={() => setOpen(false)}
          >
            <Pressable
              style={{ width: '85%', maxWidth: 400 }}
              onPress={(e) => e.stopPropagation()}
            >
              <View
                style={{
                  backgroundColor: tc.background.raised,
                  borderRadius: defaultRadii.md,
                  paddingVertical: 4,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.2,
                  shadowRadius: 24,
                  elevation: 8,
                }}
              >
                {optionsList}
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      )}
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

/**
 * Toggle wrapper that plays a sound on change.
 * Drop-in replacement for <Toggle> that adds audio feedback.
 */
function SoundToggle({ checked, onChange, ...rest }: React.ComponentProps<typeof Toggle>) {
  const { playSound } = useSound();
  const handleChange = useCallback(
    (v: boolean) => {
      playSound(v ? 'toggle_on' : 'toggle_off');
      onChange?.(v);
    },
    [onChange, playSound],
  );
  return <Toggle checked={checked} onChange={handleChange} {...rest} />;
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

  const handleLogout = useCallback(async () => {
    setShowLogoutConfirm(false);
    // Graceful shutdown: flush DB → shutdown service → reset WASM
    try {
      const { flushAndCloseSqlBridge } = await import('@umbra/wasm');
      await flushAndCloseSqlBridge();
    } catch { /* ignore */ }
    try {
      const { UmbraService } = await import('@umbra/service');
      if (UmbraService.isInitialized) await UmbraService.shutdown();
    } catch { /* ignore */ }
    try {
      const { resetWasm } = await import('@umbra/wasm');
      resetWasm();
    } catch { /* ignore */ }
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

      <View nativeID="sub-identity">
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
                    overflow: 'hidden',
                  }}
                >
                  {identity.avatar ? (
                    <Image
                      source={{ uri: identity.avatar }}
                      style={{ width: 48, height: 48 }}
                    />
                  ) : (
                    <RNText style={{ fontSize: 20, fontWeight: '700', color: tc.text.inverse }}>
                      {identity.displayName.charAt(0).toUpperCase()}
                    </RNText>
                  )}
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
                    <HelpHighlight icon={<KeyIcon size={22} color={tc.accent.primary} />}>
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
                      backgroundColor: didCopied ? tc.status.successSurface : tc.background.sunken,
                    }}
                  >
                    <CopyIcon size={14} color={didCopied ? tc.status.success : tc.text.secondary} />
                    <RNText style={{ fontSize: 11, color: didCopied ? tc.status.success : tc.text.secondary, fontWeight: '500' }}>
                      {didCopied ? 'Copied' : 'Copy'}
                    </RNText>
                  </Pressable>
                </View>
              </View>
            </View>
          </Card>

          {/* Linked Accounts */}
          <View style={{ marginTop: 20 }}>
            <View style={{ marginBottom: 12 }}>
              <RNText style={{ fontSize: 15, fontWeight: '600', color: tc.text.primary }}>
                Linked Accounts
              </RNText>
              <RNText style={{ fontSize: 12, color: tc.text.secondary, marginTop: 2 }}>
                Connect accounts from other platforms.
              </RNText>
            </View>
            <LinkedAccountsPanel did={identity?.did ?? null} />
          </View>
      </View>

      <View nativeID="sub-sharing">
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
      </View>

      <View nativeID="sub-danger">
      {/* Danger zone */}
      <View style={{ gap: 12 }}>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <RNText style={{ fontSize: 15, fontWeight: '600', color: tc.status.danger }}>
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
              <HelpHighlight icon={<AlertTriangleIcon size={22} color={tc.status.danger} />} color={tc.status.danger}>
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
          iconLeft={<LogOutIcon size={16} color={tc.status.danger} />}
          style={{ borderColor: tc.status.dangerBorder, backgroundColor: tc.status.dangerSurface }}
        >
          <RNText style={{ color: tc.status.danger, fontWeight: '600', fontSize: 14 }}>
            Log Out
          </RNText>
        </Button>
      </View>

      {/* Logout confirmation dialog */}
      <Dialog
        open={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        title="Log Out?"
        icon={<LogOutIcon size={24} color={tc.status.danger} />}
        size="sm"
        footer={
          <HStack gap="sm" style={{ justifyContent: 'flex-end' }}>
            <Button variant="tertiary" onPress={() => setShowLogoutConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="secondary"
              onPress={handleLogout}
              style={{ borderColor: tc.status.dangerBorder, backgroundColor: tc.status.dangerSurface }}
            >
              <RNText style={{ color: tc.status.danger, fontWeight: '600', fontSize: 14 }}>
                Log Out
              </RNText>
            </Button>
          </HStack>
        }
      >
        <View style={{ alignItems: 'center', gap: 12 }}>
          <Image source={umbraDeadImage} style={{ width: 160, height: 160 }} resizeMode="contain" />
          <RNText style={{ fontSize: 13, color: tc.text.secondary, textAlign: 'center', lineHeight: 18 }}>
            You'll be signed out of this account. Your account data is saved and you can sign back in from the login screen.
          </RNText>
        </View>
      </Dialog>
      </View>
    </View>
  );
}

function ProfileSection() {
  const { identity, setIdentity, addAccount, recoveryPhrase, pin, rememberMe } = useAuth();
  const { service } = useUmbra();
  const { theme } = useTheme();
  const tc = theme.colors;

  const [displayName, setDisplayName] = useState(identity?.displayName ?? '');
  const [status, setStatus] = useState(identity?.status ?? 'online');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(identity?.avatar ?? null);
  const [pendingAvatar, setPendingAvatar] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Track whether the user has changed anything
  const hasChanges =
    displayName !== (identity?.displayName ?? '') ||
    status !== (identity?.status ?? 'online') ||
    pendingAvatar !== null;

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleAvatarPick = useCallback(() => {
    if (Platform.OS !== 'web') return;
    // Create a hidden file input and trigger it
    if (!fileInputRef.current) {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.style.display = 'none';
      input.addEventListener('change', () => {
        const file = input.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result as string;
          setAvatarPreview(base64);
          setPendingAvatar(base64);
        };
        reader.readAsDataURL(file);
      });
      document.body.appendChild(input);
      fileInputRef.current = input;
    }
    fileInputRef.current.value = '';
    fileInputRef.current.click();
  }, []);

  // Cleanup hidden file input on unmount
  useEffect(() => {
    return () => {
      if (fileInputRef.current) {
        document.body.removeChild(fileInputRef.current);
        fileInputRef.current = null;
      }
    };
  }, []);

  const handleSave = useCallback(async () => {
    if (!service || !identity) return;
    setSaving(true);
    setSaved(false);
    try {
      // Update display name if changed
      if (displayName !== identity.displayName) {
        await service.updateProfile({ type: 'displayName', value: displayName });
      }
      // Update status if changed
      if (status !== (identity.status ?? 'online')) {
        await service.updateProfile({ type: 'status', value: status });
      }
      // Update avatar if changed
      if (pendingAvatar !== null) {
        await service.updateProfile({ type: 'avatar', value: pendingAvatar });
      }
      // Update identity in AuthContext so the rest of the app reflects changes
      const updatedIdentity = {
        ...identity,
        displayName,
        status,
        ...(pendingAvatar !== null ? { avatar: pendingAvatar } : {}),
      };
      setIdentity(updatedIdentity);

      // Keep stored account in sync for account switcher
      if (recoveryPhrase) {
        addAccount({
          did: identity.did,
          displayName: updatedIdentity.displayName,
          avatar: updatedIdentity.avatar,
          recoveryPhrase,
          pin: pin ?? undefined,
          rememberMe,
          addedAt: identity.createdAt ?? Date.now(),
        });
      }

      setPendingAvatar(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('[ProfileSection] Failed to save profile:', err);
    } finally {
      setSaving(false);
    }
  }, [service, identity, displayName, status, pendingAvatar, setIdentity, addAccount, recoveryPhrase, pin, rememberMe]);

  return (
    <View style={{ gap: 20 }}>
      <SectionHeader
        title="Profile"
        description="Manage your public profile information visible to other users."
      />

      <View nativeID="sub-avatar">
        <SettingRow label="Avatar" description="Your profile picture. Click to upload a new image." vertical>
          <HStack gap="md" style={{ alignItems: 'center' }}>
            <Pressable onPress={handleAvatarPick}>
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: tc.background.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  borderWidth: 2,
                  borderColor: tc.border.subtle,
                }}
              >
                {avatarPreview ? (
                  <Image
                    source={{ uri: avatarPreview }}
                    style={{ width: 64, height: 64, borderRadius: 32 }}
                  />
                ) : (
                  <UserIcon size={28} color={tc.text.muted} />
                )}
              </View>
            </Pressable>
            <Button variant="tertiary" size="sm" onPress={handleAvatarPick}>
              Upload Photo
            </Button>
          </HStack>
        </SettingRow>
      </View>

      <View nativeID="sub-display-name">
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
      </View>

      <View nativeID="sub-status">
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

      {hasChanges && (
        <HStack gap="sm" style={{ justifyContent: 'flex-end' }}>
          <Button
            variant="secondary"
            size="sm"
            onPress={handleSave}
            disabled={saving}
          >
            <HStack gap="xs" style={{ alignItems: 'center' }}>
              {saved ? <CheckIcon size={14} color={tc.text.primary} /> : null}
              <RNText style={{ color: tc.text.primary, fontWeight: '600', fontSize: 14 }}>
                {saving ? 'Saving...' : saved ? 'Saved' : 'Save Changes'}
              </RNText>
            </HStack>
          </Button>
        </HStack>
      )}
    </View>
  );
}

function AppearanceSection() {
  const { mode, toggleMode, theme } = useTheme();
  const { activeTheme, themes, installedThemeIds, setTheme, accentColor, setAccentColor, showModeToggle, textSize, setTextSize } = useAppTheme();
  const tc = theme.colors;

  // Build theme dropdown options (only installed themes)
  const themeOptions = useMemo<InlineDropdownOption[]>(() => {
    const installed = themes.filter((t) => installedThemeIds.has(t.id));
    return [
      { value: 'default', label: 'Default', description: 'Umbra default theme' },
      ...installed.map((t) => ({
        value: t.id,
        label: t.name,
        description: t.description,
      })),
    ];
  }, [themes, installedThemeIds]);

  const handleAccentChange = useCallback(
    (color: string) => {
      setAccentColor(color);
    },
    [setAccentColor],
  );

  return (
    <View style={{ gap: 20 }}>
      <SectionHeader title="Appearance" description="Customize the look and feel of the application." />

      <View nativeID="sub-theme">
        <SettingRow label="Theme" description="Choose a color theme for the entire app." vertical>
          <InlineDropdown
            options={themeOptions}
            value={activeTheme?.id ?? 'default'}
            onChange={(id) => setTheme(id === 'default' ? null : id)}
            placeholder="Select theme"
          />
          {activeTheme && (
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
              {activeTheme.swatches.map((color, i) => (
                <View
                  key={i}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: color,
                    borderWidth: 1,
                    borderColor: tc.border.subtle,
                  }}
                />
              ))}
            </View>
          )}
        </SettingRow>
      </View>

      <View nativeID="sub-dark-mode">
        {showModeToggle && (
        <SettingRow label="Dark Mode" description="Switch between light and dark themes.">
          <SoundToggle checked={mode === 'dark'} onChange={toggleMode} />
        </SettingRow>
        )}
      </View>

      <View nativeID="sub-colors">
        <SettingRow label="Accent Color" description="Choose a primary color for buttons, links, and highlights." vertical>
          <ColorPicker
            value={accentColor ?? theme.colors.accent.primary}
            onChange={handleAccentChange}
            presets={ACCENT_PRESETS}
            size="md"
            showInput
          />
        </SettingRow>
      </View>

      <View nativeID="sub-text-size">
        <TextSizeSettingRow value={textSize} onChange={setTextSize} />
      </View>

      <View nativeID="sub-font">
        <FontSettingRow />
      </View>
    </View>
  );
}

function TextSizeSettingRow({ value, onChange }: { value: string; onChange: (v: TextSize) => void }) {
  return (
    <SettingRow label="Text Size" description="Adjust the base text size across the app." vertical>
      <InlineDropdown
        options={TEXT_SIZE_OPTIONS}
        value={value}
        onChange={(v) => onChange(v as TextSize)}
        placeholder="Select size"
      />
    </SettingRow>
  );
}

function FontSettingRow() {
  const { activeFont, fonts, installedFontIds, setActiveFont } = useFonts();
  const { theme } = useTheme();
  const tc = theme.colors;

  // Build options from installed fonts + system default
  const fontOptions = useMemo(() => {
    const categoryLabel = (cat: string) =>
      cat === 'sans-serif' ? 'Sans Serif' : cat.charAt(0).toUpperCase() + cat.slice(1);
    const installed = fonts.filter((f) => f.id === 'system' || installedFontIds.has(f.id));
    return installed.map((f) => ({
      value: f.id,
      label: f.name,
      description: categoryLabel(f.category),
    }));
  }, [fonts, installedFontIds]);

  const handleFontChange = useCallback((fontId: string) => {
    setActiveFont(fontId);
  }, [setActiveFont]);

  return (
    <SettingRow label="Font Family" description="Choose a typeface for the entire app. Install more fonts from the Marketplace." vertical>
      <InlineDropdown
        options={fontOptions}
        value={activeFont.id}
        onChange={handleFontChange}
        placeholder="Select font"
      />

      {/* Preview of active font */}
      {activeFont.id !== 'system' && (
        <View style={{ marginTop: 8, padding: 12, borderRadius: 8, backgroundColor: 'rgba(99,102,241,0.06)', borderWidth: 1, borderColor: 'rgba(99,102,241,0.12)' }}>
          <RNText style={{
            fontSize: 16, fontWeight: '600', color: tc.text.primary,
            fontFamily: activeFont.css.split(',')[0].replace(/"/g, ''),
          }} numberOfLines={1}>
            The quick brown fox jumps over the lazy dog
          </RNText>
          <RNText style={{
            fontSize: 12, color: tc.text.muted, marginTop: 4,
            fontFamily: activeFont.css.split(',')[0].replace(/"/g, ''),
          }}>
            ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789
          </RNText>
        </View>
      )}
    </SettingRow>
  );
}

function NotificationsSection() {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [messagePreview, setMessagePreview] = useState(true);

  return (
    <View style={{ gap: 20 }}>
      <SectionHeader
        title="Notifications"
        description="Control how and when you receive alerts and updates."
      />

      <SettingRow label="Push Notifications" description="Receive push notifications for new messages and mentions.">
        <SoundToggle checked={pushEnabled} onChange={() => setPushEnabled((p) => !p)} />
      </SettingRow>

      <SettingRow label="Message Preview" description="Show message content in notification banners.">
        <SoundToggle checked={messagePreview} onChange={() => setMessagePreview((p) => !p)} />
      </SettingRow>
    </View>
  );
}

function SoundsSection() {
  const { theme } = useTheme();
  const tc = theme.colors;
  const {
    playSound,
    masterVolume,
    setMasterVolume,
    muted,
    setMuted,
    categoryVolumes,
    setCategoryVolume,
    categoryEnabled,
    setCategoryEnabled,
    activeTheme,
    setActiveTheme,
  } = useSound();

  const themeOptions = useMemo(
    () => SOUND_THEMES.map((t) => ({ value: t.id, label: `${t.name}${t.type === 'audio' ? ' (Pack)' : ''}` })),
    [],
  );

  const masterPct = Math.round(masterVolume * 100);

  const CATEGORY_DESCRIPTIONS: Record<string, string> = {
    message: 'Sending, receiving, and deleting messages',
    call: 'Joining, leaving, muting, and ringing',
    navigation: 'Tab switches, dialog open/close',
    social: 'Friend requests, accepts, notifications',
    system: 'Toggles, errors, success confirmations',
  };

  return (
    <View style={{ gap: 20 }}>
      <SectionHeader
        title="Sounds"
        description="Choose a sound theme and control which sounds play."
      />

      <SettingRow label="Enable Sounds" description="Master toggle for all UI sounds.">
        <SoundToggle checked={!muted} onChange={() => setMuted(!muted)} />
      </SettingRow>

      {!muted && (
        <>
          <SettingRow label="Sound Theme" description="Choose the style of sounds." vertical>
            <Select
              options={themeOptions}
              value={activeTheme}
              onChange={(v) => setActiveTheme(v as SoundThemeId)}
              placeholder="Select theme"
              size="md"
              fullWidth
            />
            {(() => {
              const meta = SOUND_THEMES.find((t) => t.id === activeTheme);
              return meta ? (
                <RNText style={{ fontSize: 12, color: tc.text.muted, marginTop: 4 }}>
                  {meta.description}
                </RNText>
              ) : null;
            })()}
          </SettingRow>

          <SettingRow label="Master Volume" description={`${masterPct}%`} vertical>
            <Slider
              value={masterPct}
              min={0}
              max={100}
              step={5}
              onChange={(v) => setMasterVolume(v / 100)}
            />
          </SettingRow>

          <Separator />

          {/* ── Per-category enabled toggles + volumes ──────────────── */}

          <View style={{ gap: 16 }}>
            <RNText style={{ fontSize: 13, fontWeight: '600', color: tc.text.primary }}>
              Sound Categories
            </RNText>

            {SOUND_CATEGORIES.map((cat) => {
              const enabled = categoryEnabled[cat] ?? true;
              const pct = Math.round((categoryVolumes[cat] ?? 1) * 100);
              return (
                <View key={cat} style={{ gap: 8, opacity: enabled ? 1 : 0.5 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flex: 1, marginRight: 12 }}>
                      <RNText style={{ fontSize: 13, fontWeight: '600', color: tc.text.primary }}>
                        {CATEGORY_LABELS[cat]}
                      </RNText>
                      <RNText style={{ fontSize: 12, color: tc.text.muted, marginTop: 2 }}>
                        {CATEGORY_DESCRIPTIONS[cat]}
                      </RNText>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      {enabled && (
                        <Pressable
                          onPress={() => playSound(SoundEngine.getSampleSound(cat))}
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 6,
                            backgroundColor: tc.background.surface,
                          }}
                        >
                          <VolumeIcon size={14} color={tc.accent.primary} />
                        </Pressable>
                      )}
                      <Toggle checked={enabled} onChange={(v) => setCategoryEnabled(cat, v)} />
                    </View>
                  </View>
                  {enabled && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Slider
                        value={pct}
                        min={0}
                        max={100}
                        step={5}
                        onChange={(v) => setCategoryVolume(cat, v / 100)}
                      />
                      <RNText style={{ fontSize: 12, color: tc.text.muted, minWidth: 32, textAlign: 'right' }}>
                        {pct}%
                      </RNText>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </>
      )}
    </View>
  );
}

function PrivacySection() {
  const { theme } = useTheme();
  const tc = theme.colors;
  const { identity, hasPin, setPin, verifyPin } = useAuth();
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

      <View nativeID="sub-discovery">
        <FriendDiscoveryPanel did={identity?.did ?? null} />
      </View>

      <View nativeID="sub-visibility">
          <View style={{ gap: 20 }}>
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
              <SoundToggle checked={readReceipts} onChange={() => setReadReceipts((p) => !p)} />
            </SettingRow>

            <SettingRow label="Typing Indicators" description="Show when you are typing a message to others.">
              <SoundToggle checked={typingIndicators} onChange={() => setTypingIndicators((p) => !p)} />
            </SettingRow>
          </View>

          <SettingRow label="Online Status" description="Show your online status to other users.">
            <SoundToggle checked={showOnline} onChange={() => setShowOnline((p) => !p)} />
          </SettingRow>
      </View>

      <View nativeID="sub-security">
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
                <HelpHighlight icon={<LockIcon size={22} color={tc.accent.primary} />}>
                  The PIN is stored locally on your device and required every time you open the app.
                </HelpHighlight>
                <HelpListItem>Your private keys stay encrypted behind the PIN</HelpListItem>
                <HelpListItem>You can change or remove the PIN anytime</HelpListItem>
              </HelpIndicator>
            }
          >
            <SoundToggle checked={hasPin} onChange={handlePinToggle} />
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
        icon={<KeyIcon size={24} color={tc.accent.primary} />}
        size="sm"
      >
        <View style={{ alignItems: 'center', paddingVertical: 8 }}>
          {pinError && (
            <RNText style={{ color: tc.status.danger, fontSize: 13, marginBottom: 12, textAlign: 'center' }}>
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
    </View>
  );
}

function AudioVideoSection() {
  const { theme } = useTheme();
  const tc = theme.colors;
  const {
    videoQuality, audioQuality, setVideoQuality, setAudioQuality, isScreenSharing,
    noiseSuppression, echoCancellation, autoGainControl,
    setNoiseSuppression, setEchoCancellation, setAutoGainControl,
    volume, setVolume, inputVolume, setInputVolume,
    opusConfig, setOpusConfig,
  } = useCall();
  const {
    incomingCallDisplay, setIncomingCallDisplay,
    ringVolume, setRingVolume,
    opusConfig: savedOpusConfig, setOpusConfig: setSavedOpusConfig,
    inputVolume: savedInputVolume, setInputVolume: setSavedInputVolume,
    outputVolume: savedOutputVolume, setOutputVolume: setSavedOutputVolume,
    mediaE2EE, setMediaE2EE,
    videoEffect, setVideoEffect,
    blurIntensity, setBlurIntensity,
    backgroundPresetId, setBackgroundPresetId,
    customBackgroundUrl, setCustomBackgroundUrl,
  } = useCallSettings();
  const { audioInputs, videoInputs, audioOutputs, isSupported } = useMediaDevices();
  const [cameraPreviewStream, setCameraPreviewStream] = useState<MediaStream | null>(null);
  const [micLevel, setMicLevel] = useState(0);
  const micAnalyserRef = useRef<{ stop: () => void } | null>(null);
  const [micTestActive, setMicTestActive] = useState(false);
  const [micTestLevel, setMicTestLevel] = useState(0);

  // Effects preview state
  const [effectsPreviewStream, setEffectsPreviewStream] = useState<MediaStream | null>(null);
  const effectsPreviewRef = useRef<{ stop: () => void } | null>(null);
  const effectsVideoElRef = useRef<HTMLVideoElement | null>(null);

  // Resolve the active background image URL from preset or custom
  const activeBackgroundUrl = useMemo(() => {
    if (customBackgroundUrl) return customBackgroundUrl;
    if (backgroundPresetId) {
      const preset = BACKGROUND_PRESETS.find((p) => p.id === backgroundPresetId);
      return preset?.url || null;
    }
    return null;
  }, [backgroundPresetId, customBackgroundUrl]);

  // Pipe preview stream through useVideoEffects
  const { outputStream: effectsOutputStream, isProcessing: effectsProcessing } = useVideoEffects({
    sourceStream: effectsPreviewStream,
    effect: videoEffect,
    blurIntensity,
    backgroundImage: activeBackgroundUrl,
    enabled: !!effectsPreviewStream,
  });

  // Sync the processed (or raw) stream to the preview <video> element.
  // Using a useEffect instead of an inline ref callback prevents the video
  // from resetting srcObject on every React re-render.
  const effectsDisplayStream = effectsOutputStream || effectsPreviewStream;
  useEffect(() => {
    const el = effectsVideoElRef.current;
    if (el && effectsDisplayStream) {
      if (el.srcObject !== effectsDisplayStream) {
        el.srcObject = effectsDisplayStream;
      }
    } else if (el) {
      el.srcObject = null;
    }
  }, [effectsDisplayStream]);

  const startEffectsPreview = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setEffectsPreviewStream(stream);
      effectsPreviewRef.current = {
        stop: () => {
          for (const track of stream.getTracks()) track.stop();
          setEffectsPreviewStream(null);
        },
      };
    } catch {
      // Permission denied or not available
    }
  }, []);

  const stopEffectsPreview = useCallback(() => {
    effectsPreviewRef.current?.stop();
    effectsPreviewRef.current = null;
  }, []);

  // Clean up effects preview on unmount
  useEffect(() => {
    return () => {
      effectsPreviewRef.current?.stop();
    };
  }, []);
  const micTestRef = useRef<{ stop: () => void } | null>(null);

  const startTestPreview = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setCameraPreviewStream(stream);

      // Mic level meter via Web Audio API
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      let rafId: number;
      const tick = () => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setMicLevel(Math.min(100, Math.round((avg / 128) * 100)));
        rafId = requestAnimationFrame(tick);
      };
      tick();

      micAnalyserRef.current = {
        stop: () => {
          cancelAnimationFrame(rafId);
          ctx.close();
          for (const track of stream.getTracks()) track.stop();
          setCameraPreviewStream(null);
          setMicLevel(0);
        },
      };
    } catch {
      // Permission denied or not available
    }
  }, []);

  const stopTestPreview = useCallback(() => {
    micAnalyserRef.current?.stop();
    micAnalyserRef.current = null;
  }, []);

  const startMicTest = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      let rafId: number;
      const tick = () => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setMicTestLevel(Math.min(100, Math.round((avg / 128) * 100)));
        rafId = requestAnimationFrame(tick);
      };
      tick();

      setMicTestActive(true);
      micTestRef.current = {
        stop: () => {
          cancelAnimationFrame(rafId);
          ctx.close();
          stream.getTracks().forEach((t) => t.stop());
          setMicTestActive(false);
          setMicTestLevel(0);
        },
      };
    } catch (err) {
      console.warn('Mic test failed:', err);
    }
  }, []);

  const stopMicTest = useCallback(() => {
    micTestRef.current?.stop();
    micTestRef.current = null;
  }, []);

  // Clean up mic test on unmount
  useEffect(() => {
    return () => {
      micTestRef.current?.stop();
    };
  }, []);

  const videoQualityOptions: InlineDropdownOption[] = [
    { value: 'auto', label: 'Auto', description: 'Adapts to network conditions' },
    { value: '720p', label: '720p HD', description: '~2.5 Mbps' },
    { value: '1080p', label: '1080p Full HD', description: '~5 Mbps' },
    { value: '1440p', label: '1440p QHD', description: '~8 Mbps' },
    { value: '4k', label: '4K Ultra HD', description: '~16 Mbps' },
  ];

  const audioQualityOptions: InlineDropdownOption[] = [
    { value: 'opus-voice', label: 'Voice (VoIP)', description: 'Optimized for speech, lower bandwidth' },
    { value: 'opus-music', label: 'Music (Full Band)', description: 'Full-band audio, higher quality' },
    { value: 'opus-low', label: 'Low Latency', description: 'Minimum delay, real-time interaction' },
    { value: 'pcm', label: 'PCM Lossless', description: '~1.4 Mbps, uncompressed audio' },
  ];

  const opusApplicationOptions: InlineDropdownOption[] = [
    { value: 'voip', label: 'Voice (VoIP)', description: 'Best for speech and calls' },
    { value: 'audio', label: 'Music (Full Band)', description: 'Best for music and high-fidelity' },
    { value: 'lowdelay', label: 'Low Latency', description: 'Minimum encoding delay' },
  ];

  const bitratePresets = [
    { value: 24, label: 'Low (24 kbps)' },
    { value: 48, label: 'Medium (48 kbps)' },
    { value: 96, label: 'High (96 kbps)' },
    { value: 128, label: 'Max (128 kbps)' },
  ];

  // Handlers that sync both context and persisted settings
  const handleOpusConfigChange = useCallback((patch: Partial<OpusConfig>) => {
    const newConfig = { ...opusConfig, ...patch };
    setOpusConfig(newConfig);
    setSavedOpusConfig(newConfig);
  }, [opusConfig, setOpusConfig, setSavedOpusConfig]);

  const handleInputVolumeChange = useCallback((val: number) => {
    setInputVolume(val);
    setSavedInputVolume(val);
  }, [setInputVolume, setSavedInputVolume]);

  const handleOutputVolumeChange = useCallback((val: number) => {
    setVolume(val);
    setSavedOutputVolume(val);
  }, [setVolume, setSavedOutputVolume]);

  const handleAudioQualityChange = useCallback((quality: AudioQuality) => {
    setAudioQuality(quality);
    // When selecting a preset, apply its Opus config too
    if (quality !== 'pcm') {
      const preset = AUDIO_QUALITY_PRESETS[quality];
      if (preset) {
        handleOpusConfigChange(preset.config);
      }
    }
  }, [setAudioQuality, handleOpusConfigChange]);

  return (
    <View style={{ gap: 20 }}>
      <SectionHeader title="Audio & Video" description="Configure your camera, microphone, and call quality settings." />

      <View nativeID="sub-calling">
      {/* Calling */}
      <View style={{ gap: 16 }}>
        <View>
          <RNText style={{ fontSize: 15, fontWeight: '600', color: tc.text.primary }}>
            Calling
          </RNText>
          <RNText style={{ fontSize: 12, color: tc.text.secondary, marginTop: 2 }}>
            Configure incoming call behavior and ring volume.
          </RNText>
        </View>

        <SettingRow label="Incoming Call Display" description="How incoming calls appear when the app is open." vertical>
          <SegmentedControl
            options={[
              { value: 'fullscreen', label: 'Fullscreen' },
              { value: 'toast', label: 'Toast' },
            ]}
            value={incomingCallDisplay}
            onChange={(v) => setIncomingCallDisplay(v as 'fullscreen' | 'toast')}
          />
        </SettingRow>

        <SettingRow label="Ring Volume" description={`Volume: ${ringVolume}%`} vertical>
          <Slider
            value={ringVolume}
            min={0}
            max={100}
            step={5}
            onChange={setRingVolume}
          />
        </SettingRow>
      </View>
      </View>

      <View nativeID="sub-video">
      {/* Video Quality */}
      <SettingRow label="Video Quality" description="Set the default video quality for calls." vertical>
        <InlineDropdown
          options={videoQualityOptions}
          value={videoQuality}
          onChange={(v) => setVideoQuality(v as VideoQuality)}
          placeholder="Select quality"
        />
      </SettingRow>

      <Separator spacing="sm" />

      {/* Test Video — live preview with effects applied */}
      <View style={{ gap: 16 }}>
        <View>
          <RNText style={{ fontSize: 15, fontWeight: '600', color: tc.text.primary }}>
            Test Video
          </RNText>
          <RNText style={{ fontSize: 12, color: tc.text.secondary, marginTop: 2 }}>
            Preview your camera with the current video effect applied.
          </RNText>
        </View>

        {Platform.OS === 'web' ? (
          /* Web: canvas-based preview */
          effectsPreviewStream ? (
            <View style={{ gap: 12 }}>
              <View style={{
                width: '100%',
                height: 220,
                borderRadius: 10,
                overflow: 'hidden',
                backgroundColor: tc.background.sunken,
                position: 'relative',
              }}>
                <video
                  ref={effectsVideoElRef as any}
                  autoPlay
                  muted
                  playsInline
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' } as any}
                />

                {effectsProcessing && videoEffect !== 'none' && (
                  <View style={{
                    position: 'absolute',
                    top: 8,
                    left: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    paddingVertical: 3,
                    paddingHorizontal: 8,
                    borderRadius: 6,
                  }}>
                    <View style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: tc.status.success,
                    }} />
                    <RNText style={{ fontSize: 10, color: '#fff', fontWeight: '500' }}>
                      {videoEffect === 'blur' ? 'Blur active' : 'Background active'}
                    </RNText>
                  </View>
                )}

                {videoEffect === 'none' && (
                  <View style={{
                    position: 'absolute',
                    top: 8,
                    left: 8,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    paddingVertical: 3,
                    paddingHorizontal: 8,
                    borderRadius: 6,
                  }}>
                    <RNText style={{ fontSize: 10, color: '#fff', opacity: 0.8 }}>
                      No effect
                    </RNText>
                  </View>
                )}
              </View>

              <Button variant="secondary" size="sm" onPress={stopEffectsPreview}>
                Stop Preview
              </Button>
            </View>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onPress={startEffectsPreview}
              iconLeft={<VideoIcon size={14} color={tc.text.secondary} />}
            >
              Start Camera Preview
            </Button>
          )
        ) : (
          /* Mobile: native Metal-backed preview */
          <View style={{ gap: 12 }}>
            <VideoEffectsPreview
              effect={videoEffect}
              blurIntensity={blurIntensity}
              backgroundImage={activeBackgroundUrl}
              cameraPosition="front"
              enabled={true}
              style={{
                width: '100%' as any,
                height: 220,
                borderRadius: 10,
                overflow: 'hidden',
                backgroundColor: tc.background.sunken,
              }}
            />

            {videoEffect !== 'none' && (
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingVertical: 4,
                paddingHorizontal: 8,
              }}>
                <View style={{
                  width: 6, height: 6, borderRadius: 3,
                  backgroundColor: tc.status.success,
                }} />
                <RNText style={{ fontSize: 11, color: tc.text.muted }}>
                  {videoEffect === 'blur' ? 'Background blur active' : 'Virtual background active'}
                </RNText>
              </View>
            )}
          </View>
        )}
      </View>

      <Separator spacing="sm" />

      {/* Video Effects — available on all platforms */}
      <View style={{ gap: 16 }}>
        <View>
          <RNText style={{ fontSize: 15, fontWeight: '600', color: tc.text.primary }}>
            Video Effects
          </RNText>
          <RNText style={{ fontSize: 12, color: tc.text.secondary, marginTop: 2 }}>
            Apply background effects to your camera during calls.
          </RNText>
        </View>

        <SettingRow label="Background Effect" description="Choose how your background appears on video calls." vertical>
          <SegmentedControl
            options={[
              { value: 'none', label: 'None' },
              { value: 'blur', label: 'Blur' },
              { value: 'virtual-background', label: 'Image' },
            ]}
            value={videoEffect}
            onChange={(v) => setVideoEffect(v as VideoEffect)}
          />
        </SettingRow>

        {videoEffect === 'blur' && (
          <SettingRow label="Blur Intensity" description={`${blurIntensity}px`} vertical>
            <Slider
              value={blurIntensity}
              min={1}
              max={30}
              step={1}
              onChange={setBlurIntensity}
            />
          </SettingRow>
        )}

        {videoEffect === 'virtual-background' && (
          <View style={{ gap: 10 }}>
            <RNText style={{ fontSize: 11, fontWeight: '600', color: tc.text.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Background Image
            </RNText>

            {/* Preset grid */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {BACKGROUND_PRESETS.map((preset) => {
                const isSelected = backgroundPresetId === preset.id;
                return (
                  <Pressable
                    key={preset.id}
                    onPress={() => {
                      setBackgroundPresetId(preset.id);
                      setCustomBackgroundUrl(null);
                    }}
                    style={({ pressed }) => ({
                      width: 72,
                      height: 48,
                      borderRadius: 8,
                      overflow: 'hidden',
                      borderWidth: 2,
                      borderColor: isSelected ? tc.accent.primary : pressed ? tc.border.subtle : 'transparent',
                      backgroundColor: tc.background.sunken,
                    })}
                  >
                    {/* Thumbnail preview */}
                    <View style={{ width: '100%', height: '100%', position: 'relative' }}>
                      {Platform.OS === 'web' ? (
                        <img
                          src={preset.thumbnail}
                          alt={preset.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' } as any}
                        />
                      ) : (
                        <Image
                          source={{ uri: preset.thumbnail }}
                          style={{ width: '100%', height: '100%' }}
                          resizeMode="cover"
                        />
                      )}
                      <View style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        paddingVertical: 1,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        alignItems: 'center',
                      }}>
                        <RNText style={{ fontSize: 8, color: '#fff', fontWeight: '500' }}>
                          {preset.name}
                        </RNText>
                      </View>
                    </View>
                    {isSelected && (
                      <View style={{
                        position: 'absolute',
                        top: 2,
                        right: 2,
                        width: 14,
                        height: 14,
                        borderRadius: 7,
                        backgroundColor: tc.accent.primary,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}>
                        <CheckIcon size={9} color={tc.text.inverse} />
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>

            {/* Custom URL input */}
            <View style={{ gap: 4 }}>
              <RNText style={{ fontSize: 11, color: tc.text.muted }}>
                Or use a custom image URL:
              </RNText>
              <Input
                placeholder="https://example.com/background.jpg"
                value={customBackgroundUrl || ''}
                onChangeText={(url) => {
                  setCustomBackgroundUrl(url || null);
                  if (url) setBackgroundPresetId(null);
                }}
                size="sm"
              />
            </View>
          </View>
        )}
      </View>
      </View>

      <View nativeID="sub-audio">
      {/* Audio Quality Preset */}
      <SettingRow label="Audio Quality" description="Choose an audio codec and quality preset." vertical>
        <InlineDropdown
          options={audioQualityOptions}
          value={audioQuality}
          onChange={(v) => handleAudioQualityChange(v as AudioQuality)}
          placeholder="Select quality"
        />
        {audioQuality === 'pcm' && (
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            padding: 10,
            borderRadius: 8,
            backgroundColor: tc.status.warningSurface,
            borderWidth: 1,
            borderColor: tc.status.warningBorder,
            marginTop: 8,
          }}>
            <AlertTriangleIcon size={16} color={tc.status.warning} />
            <RNText style={{ fontSize: 12, color: tc.status.warning, flex: 1 }}>
              Lossless audio uses ~1.4 Mbps. Ensure you have a stable connection.
            </RNText>
          </View>
        )}
      </SettingRow>

      {/* Opus Configuration (only when not PCM) */}
      {audioQuality !== 'pcm' && (
        <>
          <Separator spacing="sm" />
          <View style={{ gap: 16 }}>
            <View>
              <RNText style={{ fontSize: 15, fontWeight: '600', color: tc.text.primary }}>
                Opus Configuration
              </RNText>
              <RNText style={{ fontSize: 12, color: tc.text.secondary, marginTop: 2 }}>
                Fine-tune the Opus audio encoder for your needs.
              </RNText>
            </View>

            {/* Application Mode */}
            <SettingRow label="Application Mode" description="Optimize encoding for voice, music, or low latency." vertical>
              <InlineDropdown
                options={opusApplicationOptions}
                value={opusConfig.application}
                onChange={(v) => handleOpusConfigChange({ application: v as OpusApplication })}
                placeholder="Select mode"
              />
            </SettingRow>

            {/* Bitrate Slider */}
            <SettingRow label="Bitrate" description={`${opusConfig.bitrate} kbps`} vertical>
              <View style={{ gap: 8 }}>
                <Slider
                  value={opusConfig.bitrate}
                  min={16}
                  max={128}
                  step={8}
                  onChange={(val) => handleOpusConfigChange({ bitrate: val as AudioBitrate })}
                />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  {bitratePresets.map((preset) => {
                    const isActive = opusConfig.bitrate >= preset.value;
                    return (
                      <Pressable
                        key={preset.value}
                        onPress={() => handleOpusConfigChange({ bitrate: preset.value as AudioBitrate })}
                        style={{
                          paddingVertical: 4,
                          paddingHorizontal: 8,
                          borderRadius: 6,
                          backgroundColor: isActive ? tc.accent.primary : tc.background.sunken,
                        }}
                      >
                        <RNText style={{
                          fontSize: 10,
                          fontWeight: '600',
                          color: isActive ? tc.text.inverse : tc.text.secondary,
                        }}>
                          {preset.label}
                        </RNText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </SettingRow>

            {/* Complexity Slider */}
            <SettingRow label="Complexity" description={`Level ${opusConfig.complexity} — ${opusConfig.complexity >= 8 ? 'High quality, more CPU' : opusConfig.complexity >= 4 ? 'Balanced' : 'Low CPU usage'}`} vertical>
              <Slider
                value={opusConfig.complexity}
                min={0}
                max={10}
                step={1}
                onChange={(val) => handleOpusConfigChange({ complexity: val })}
              />
            </SettingRow>

            {/* Forward Error Correction */}
            <SettingRow label="Forward Error Correction" description="Adds redundancy to resist packet loss.">
              <Toggle
                checked={opusConfig.fec}
                onChange={(val) => handleOpusConfigChange({ fec: val })}
              />
            </SettingRow>

            {/* DTX */}
            <SettingRow label="Discontinuous Transmission" description="Save bandwidth during silence.">
              <Toggle
                checked={opusConfig.dtx}
                onChange={(val) => handleOpusConfigChange({ dtx: val })}
              />
            </SettingRow>
          </View>
        </>
      )}

      <Separator spacing="sm" />

      {/* Volume Controls */}
      <View style={{ gap: 16 }}>
        <View>
          <RNText style={{ fontSize: 15, fontWeight: '600', color: tc.text.primary }}>
            Volume Controls
          </RNText>
          <RNText style={{ fontSize: 12, color: tc.text.secondary, marginTop: 2 }}>
            Adjust input and output volume levels.
          </RNText>
        </View>

        <SettingRow label="Microphone Volume" description={`${inputVolume}%`} vertical>
          <Slider
            value={inputVolume}
            min={0}
            max={100}
            step={5}
            onChange={handleInputVolumeChange}
          />
        </SettingRow>

        {/* Voice Meter (web only — uses AudioContext) */}
        {Platform.OS === 'web' && (
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <RNText style={{ fontSize: 13, fontWeight: '600', color: tc.text.primary }}>
                Voice Meter
              </RNText>
              <RNText style={{ fontSize: 11, color: tc.text.secondary }}>
                Test your microphone levels and check for clipping.
              </RNText>
            </View>
            <Button
              variant="secondary"
              size="sm"
              onPress={micTestActive ? stopMicTest : startMicTest}
            >
              {micTestActive ? 'Stop' : 'Test Mic'}
            </Button>
          </View>
          {micTestActive && (
            <View style={{ gap: 6 }}>
              {/* Level bar */}
              <View style={{ height: 12, borderRadius: 6, backgroundColor: tc.background.sunken, overflow: 'hidden', position: 'relative' }}>
                {/* Clipping threshold marker at 85% */}
                <View style={{
                  position: 'absolute',
                  left: '85%',
                  top: 0,
                  bottom: 0,
                  width: 2,
                  backgroundColor: tc.status.danger,
                  opacity: 0.5,
                  zIndex: 1,
                }} />
                <View style={{
                  width: `${micTestLevel}%`,
                  height: '100%',
                  borderRadius: 6,
                  backgroundColor: micTestLevel > 85
                    ? tc.status.danger
                    : micTestLevel > 50
                    ? tc.status.success
                    : tc.accent.primary,
                  transition: 'width 0.05s ease-out',
                } as any} />
              </View>
              {/* Labels */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <RNText style={{ fontSize: 10, color: tc.text.muted }}>
                  {micTestLevel > 85 ? '⚠ Clipping — lower your mic volume' : micTestLevel > 50 ? 'Good level' : micTestLevel > 10 ? 'Low — speak louder or raise mic volume' : 'Waiting for input...'}
                </RNText>
                <RNText style={{ fontSize: 10, fontWeight: '600', fontVariant: ['tabular-nums'], color: micTestLevel > 85 ? tc.status.danger : tc.text.muted }}>
                  {micTestLevel}%
                </RNText>
              </View>
            </View>
          )}
        </View>
        )}

        <SettingRow label="Output Volume" description={`${volume}%`} vertical>
          <Slider
            value={volume}
            min={0}
            max={100}
            step={5}
            onChange={handleOutputVolumeChange}
          />
        </SettingRow>
      </View>
      </View>

      <View nativeID="sub-devices">
      {/* Devices section */}
      <View style={{ gap: 16 }}>
        <View>
          <RNText style={{ fontSize: 15, fontWeight: '600', color: tc.text.primary }}>
            Devices
          </RNText>
          <RNText style={{ fontSize: 12, color: tc.text.secondary, marginTop: 2 }}>
            {Platform.OS === 'web'
              ? 'Your available audio and video input/output devices.'
              : 'Camera and microphone are managed by your device.'}
          </RNText>
        </View>

        {Platform.OS === 'web' ? (
          <>
            {/* Microphones */}
            <View style={{ gap: 6 }}>
              <RNText style={{ fontSize: 11, fontWeight: '600', color: tc.text.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Microphones
              </RNText>
              {audioInputs.length === 0 ? (
                <RNText style={{ fontSize: 13, color: tc.text.secondary }}>No microphones detected</RNText>
              ) : (
                audioInputs.map((device) => (
                  <View key={device.deviceId} style={{
                    flexDirection: 'row', alignItems: 'center', gap: 8,
                    paddingVertical: 6, paddingHorizontal: 10,
                    borderRadius: 6, backgroundColor: tc.background.sunken,
                  }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: tc.status.success }} />
                    <RNText style={{ fontSize: 13, color: tc.text.primary, flex: 1 }} numberOfLines={1}>
                      {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
                    </RNText>
                  </View>
                ))
              )}
            </View>

            {/* Cameras */}
            <View style={{ gap: 6 }}>
              <RNText style={{ fontSize: 11, fontWeight: '600', color: tc.text.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Cameras
              </RNText>
              {videoInputs.length === 0 ? (
                <RNText style={{ fontSize: 13, color: tc.text.secondary }}>No cameras detected</RNText>
              ) : (
                videoInputs.map((device) => (
                  <View key={device.deviceId} style={{
                    flexDirection: 'row', alignItems: 'center', gap: 8,
                    paddingVertical: 6, paddingHorizontal: 10,
                    borderRadius: 6, backgroundColor: tc.background.sunken,
                  }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: tc.status.success }} />
                    <RNText style={{ fontSize: 13, color: tc.text.primary, flex: 1 }} numberOfLines={1}>
                      {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
                    </RNText>
                  </View>
                ))
              )}
            </View>

            {/* Speakers */}
            <View style={{ gap: 6 }}>
              <RNText style={{ fontSize: 11, fontWeight: '600', color: tc.text.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Speakers
              </RNText>
              {audioOutputs.length === 0 ? (
                <RNText style={{ fontSize: 13, color: tc.text.secondary }}>No speakers detected</RNText>
              ) : (
                audioOutputs.map((device) => (
                  <View key={device.deviceId} style={{
                    flexDirection: 'row', alignItems: 'center', gap: 8,
                    paddingVertical: 6, paddingHorizontal: 10,
                    borderRadius: 6, backgroundColor: tc.background.sunken,
                  }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: tc.status.success }} />
                    <RNText style={{ fontSize: 13, color: tc.text.primary, flex: 1 }} numberOfLines={1}>
                      {device.label || `Speaker ${device.deviceId.slice(0, 8)}`}
                    </RNText>
                  </View>
                ))
              )}
            </View>

            {!isSupported && (
              <View style={{
                padding: 12, borderRadius: 8,
                backgroundColor: tc.status.warningSurface,
                borderWidth: 1, borderColor: tc.status.warningBorder,
              }}>
                <RNText style={{ fontSize: 12, color: tc.status.warning }}>
                  Media devices are not available in this browser or environment.
                </RNText>
              </View>
            )}

            {/* Device Test — inline within Devices section */}
            <Separator spacing="sm" />
            <View>
              <RNText style={{ fontSize: 11, fontWeight: '600', color: tc.text.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Test Devices
              </RNText>
            </View>

            {cameraPreviewStream ? (
              <View style={{ gap: 12 }}>
                {/* Camera preview */}
                <View style={{
                  width: '100%', height: 180, borderRadius: 10, overflow: 'hidden',
                  backgroundColor: tc.background.sunken,
                }}>
                  <video
                    ref={(el) => { if (el && cameraPreviewStream) el.srcObject = cameraPreviewStream; }}
                    autoPlay
                    muted
                    playsInline
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' } as any}
                  />
                </View>

                {/* Mic level meter */}
                <View style={{ gap: 4 }}>
                  <RNText style={{ fontSize: 11, fontWeight: '600', color: tc.text.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Microphone Level
                  </RNText>
                  <View style={{ height: 8, borderRadius: 4, backgroundColor: tc.background.sunken, overflow: 'hidden' }}>
                    <View style={{
                      width: `${micLevel}%`,
                      height: '100%',
                      borderRadius: 4,
                      backgroundColor: micLevel > 70 ? tc.status.danger : micLevel > 30 ? tc.status.success : tc.accent.primary,
                    }} />
                  </View>
                </View>

                <Button variant="secondary" size="sm" onPress={stopTestPreview}>
                  Stop Test
                </Button>
              </View>
            ) : (
              <Button variant="secondary" size="sm" onPress={startTestPreview}>
                Test Camera & Microphone
              </Button>
            )}
          </>
        ) : (
          <>
            {/* Mobile device display — simplified */}
            <View style={{ gap: 6 }}>
              <RNText style={{ fontSize: 11, fontWeight: '600', color: tc.text.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Camera
              </RNText>
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 8,
                paddingVertical: 8, paddingHorizontal: 12,
                borderRadius: 8, backgroundColor: tc.background.sunken,
              }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: tc.status.success }} />
                <RNText style={{ fontSize: 13, color: tc.text.primary, flex: 1 }}>
                  Front Camera
                </RNText>
                <RNText style={{ fontSize: 11, color: tc.text.muted }}>
                  Default
                </RNText>
              </View>
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 8,
                paddingVertical: 8, paddingHorizontal: 12,
                borderRadius: 8, backgroundColor: tc.background.sunken,
              }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: tc.status.success }} />
                <RNText style={{ fontSize: 13, color: tc.text.primary, flex: 1 }}>
                  Back Camera
                </RNText>
              </View>
              <RNText style={{ fontSize: 11, color: tc.text.muted, marginTop: 2 }}>
                Switch cameras during a call using the camera flip button.
              </RNText>
            </View>

            <View style={{ gap: 6 }}>
              <RNText style={{ fontSize: 11, fontWeight: '600', color: tc.text.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Microphone
              </RNText>
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 8,
                paddingVertical: 8, paddingHorizontal: 12,
                borderRadius: 8, backgroundColor: tc.background.sunken,
              }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: tc.status.success }} />
                <RNText style={{ fontSize: 13, color: tc.text.primary, flex: 1 }}>
                  Default Microphone
                </RNText>
              </View>
            </View>

            <View style={{
              padding: 12, borderRadius: 8,
              backgroundColor: tc.status.infoSurface,
              borderWidth: 1, borderColor: tc.status.infoBorder,
            }}>
              <RNText style={{ fontSize: 12, color: tc.status.info }}>
                Device permissions are managed by your device settings. Camera and microphone
                access will be requested when you start a call.
              </RNText>
            </View>
          </>
        )}
      </View>
      </View>

      {/* Audio Processing */}
      <View style={{ gap: 16 }}>
        <View>
          <RNText style={{ fontSize: 15, fontWeight: '600', color: tc.text.primary }}>
            Audio Processing
          </RNText>
          <RNText style={{ fontSize: 12, color: tc.text.secondary, marginTop: 2 }}>
            Enhance audio quality during calls.
          </RNText>
        </View>

        <SettingRow label="Noise Suppression" description="Reduce background noise from your microphone.">
          <SoundToggle checked={noiseSuppression} onChange={setNoiseSuppression} />
        </SettingRow>
        <SettingRow label="Echo Cancellation" description="Prevent audio feedback loops.">
          <SoundToggle checked={echoCancellation} onChange={setEchoCancellation} />
        </SettingRow>
        <SettingRow label="Auto Gain Control" description="Automatically adjust microphone volume.">
          <SoundToggle checked={autoGainControl} onChange={setAutoGainControl} />
        </SettingRow>
      </View>

      <Separator spacing="sm" />

      {/* Encryption (web only — Insertable Streams / RTCRtpScriptTransform) */}
      {Platform.OS === 'web' && (
      <View style={{ gap: 16 }}>
        <View>
          <RNText style={{ fontSize: 15, fontWeight: '600', color: tc.text.primary }}>
            Encryption
          </RNText>
          <RNText style={{ fontSize: 12, color: tc.text.secondary, marginTop: 2 }}>
            Call signaling is always end-to-end encrypted. Optionally encrypt media frames too.
          </RNText>
        </View>

        <SettingRow
          label="End-to-End Media Encryption"
          description={
            typeof window !== 'undefined' && 'RTCRtpScriptTransform' in window
              ? 'Encrypts audio and video frames with AES-256-GCM. May increase CPU usage.'
              : 'Not available in this browser. Supported in Chrome and Edge.'
          }
        >
          <Toggle
            checked={mediaE2EE}
            onChange={setMediaE2EE}
            disabled={typeof window === 'undefined' || !('RTCRtpScriptTransform' in window)}
          />
        </SettingRow>

        {mediaE2EE && (
          <View style={{
            padding: 12, borderRadius: 8,
            backgroundColor: tc.status.infoSurface,
            borderWidth: 1, borderColor: tc.status.infoBorder,
          }}>
            <RNText style={{ fontSize: 12, color: tc.status.info }}>
              Media E2EE is enabled. Both peers must have this setting enabled for encrypted media.
              Call signaling (SDP, ICE) is always encrypted regardless of this setting.
            </RNText>
          </View>
        )}
      </View>
      )}

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
    creating_offer: tc.status.warning,
    waiting_for_answer: tc.status.info,
    accepting_offer: tc.status.warning,
    completing_handshake: tc.status.warning,
    connected: tc.status.success,
    error: tc.status.danger,
  }[connectionState];

  return (
    <View style={{ gap: 20 }}>
      <SectionHeader title="Network" description="Manage your peer-to-peer network connection." />

      <View nativeID="sub-connection">
      {/* Connection Status */}
      <Card variant="outlined" padding="lg" style={{ width: '100%' }}>
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{
              width: 10, height: 10, borderRadius: 5,
              backgroundColor: isConnected ? tc.status.success : tc.status.danger,
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
              Addresses: {listenAddresses?.length ?? 0}
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
            <HelpHighlight icon={<GlobeIcon size={22} color={tc.accent.primary} />}>
              When enabled, your device participates in the decentralized network and can exchange messages in real-time.
            </HelpHighlight>
            <HelpListItem>Uses WebRTC for browser-to-browser connections</HelpListItem>
            <HelpListItem>Falls back to relay server for offline message delivery</HelpListItem>
          </HelpIndicator>
        }
      >
        <SoundToggle checked={isConnected} onChange={() => isConnected ? stopNetwork() : startNetwork()} />
      </SettingRow>
      </View>

      <View nativeID="sub-relays">
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
          const pingColor = !info?.ping ? tc.text.muted : info.ping < 100 ? tc.status.success : info.ping < 300 ? tc.status.warning : tc.status.danger;
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
                backgroundColor: relay.enabled ? tc.status.success : tc.text.muted,
              }} />
              <View style={{ flex: 1, gap: 3 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  {relay.isDefault && (
                    <View style={{
                      paddingHorizontal: 5,
                      paddingVertical: 1,
                      borderRadius: 4,
                      backgroundColor: `${tc.text.muted}20`,
                    }}>
                      <RNText style={{ fontSize: 9, color: tc.text.muted, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '700' }}>
                        Default
                      </RNText>
                    </View>
                  )}
                  <RNText style={{ fontSize: 13, color: tc.text.primary, fontFamily: 'monospace', flex: 1 }} numberOfLines={1}>
                    {displayUrl}
                  </RNText>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  {locationLabel && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                      <MapPinIcon size={10} color={tc.text.secondary} />
                      <RNText style={{ fontSize: 11, color: tc.text.secondary }}>
                        {locationLabel}
                      </RNText>
                    </View>
                  )}
                  {info?.ping != null && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                      <ActivityIcon size={10} color={pingColor} />
                      <RNText style={{ fontSize: 11, color: pingColor, fontFamily: 'monospace' }}>
                        {info.ping}ms
                      </RNText>
                    </View>
                  )}
                  {info?.online != null && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                      <UsersIcon size={10} color={tc.text.muted} />
                      <RNText style={{ fontSize: 11, color: tc.text.muted }}>
                        {info.online} online
                      </RNText>
                    </View>
                  )}
                  {info?.federationEnabled && info?.connectedPeers != null && info.connectedPeers > 0 && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                      <ZapIcon size={10} color={tc.accent.primary} />
                      <RNText style={{ fontSize: 11, color: tc.accent.primary }}>
                        {info.connectedPeers} {info.connectedPeers === 1 ? 'peer' : 'peers'}
                      </RNText>
                    </View>
                  )}
                  {info?.federationEnabled && info?.meshOnline != null && info.meshOnline > (info?.online ?? 0) && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                      <NetworkIcon size={10} color={tc.text.muted} />
                      <RNText style={{ fontSize: 11, color: tc.text.muted }}>
                        {info.meshOnline} mesh
                      </RNText>
                    </View>
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
            variant="secondary"
            onPress={handleAddRelay}
            disabled={!newRelayUrl.trim()}
            iconLeft={<PlusIcon size={14} />}
          >
            Add
          </Button>
        </View>
        {relayError && (
          <RNText style={{ fontSize: 12, color: tc.status.danger, marginTop: -4 }}>
            {relayError}
          </RNText>
        )}

        {/* Run Your Own Relay */}
        <Pressable
          onPress={() => {
            if (typeof window !== 'undefined') {
              window.open('https://github.com/InfamousVague/Umbra/releases?q=relay', '_blank');
            }
          }}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            paddingVertical: 12,
            paddingHorizontal: 14,
            borderRadius: 8,
            backgroundColor: pressed ? tc.accent.highlight : tc.background.sunken,
            borderWidth: 1,
            borderColor: tc.border.subtle,
            marginTop: 4,
          })}
        >
          <View style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            backgroundColor: tc.brand.surface,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <ServerIcon size={18} color={tc.accent.primary} />
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
      </View>

      <View nativeID="sub-peers">
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
              <HelpHighlight icon={<HandshakeIcon size={22} color={tc.accent.primary} />}>
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
              <Button size="sm" variant={offerCopied ? 'tertiary' : 'secondary'} onPress={handleCopyOffer}>
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
              <Button size="sm" variant={answerCopied ? 'tertiary' : 'secondary'} onPress={handleCopyAnswer}>
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
          <Card variant="outlined" padding="md" style={{ width: '100%', backgroundColor: tc.status.successSurface }}>
            <RNText style={{ fontSize: 14, fontWeight: '600', color: tc.status.success, textAlign: 'center' }}>
              Peer connected successfully!
            </RNText>
          </Card>
        )}

        {/* Error state */}
        {connectionState === 'error' && networkError && (
          <Card variant="outlined" padding="md" style={{ width: '100%', backgroundColor: tc.status.dangerSurface }}>
            <View style={{ gap: 8 }}>
              <RNText style={{ fontSize: 12, color: tc.status.danger }}>
                {networkError.message}
              </RNText>
              <Button size="sm" variant="secondary" onPress={resetSignaling}>
                Try Again
              </Button>
            </View>
          </Card>
        )}

        {/* Reset button for non-idle states */}
        {connectionState !== 'idle' && connectionState !== 'error' && (
          <Button size="sm" variant="tertiary" onPress={resetSignaling}>
            Reset
          </Button>
        )}
      </View>
      </View>

      <View nativeID="sub-identity">
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

      <View nativeID="sub-storage">
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
                backgroundColor: clearStatus.includes('Failed') ? tc.status.dangerSurface : tc.status.successSurface,
              }}
            >
              <RNText style={{
                fontSize: 13,
                color: clearStatus.includes('Failed') ? tc.status.danger : tc.status.success,
                fontWeight: '500',
                textAlign: 'center',
              }}>
                {clearStatus}
              </RNText>
            </Card>
          )}
      </View>

      <View nativeID="sub-danger-zone">
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
          iconLeft={<TrashIcon size={16} color={tc.status.warning} />}
          style={{ borderColor: tc.status.warningBorder, backgroundColor: tc.status.warningSurface }}
        >
          <RNText style={{ color: tc.status.warning, fontWeight: '600', fontSize: 14 }}>
            Clear Messages
          </RNText>
        </Button>
      </View>

      <Separator spacing="sm" />

      {/* Full wipe */}
      <View style={{ gap: 12 }}>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <RNText style={{ fontSize: 15, fontWeight: '600', color: tc.status.danger }}>
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
              <HelpHighlight icon={<AlertTriangleIcon size={22} color={tc.status.danger} />} color={tc.status.danger}>
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
          iconLeft={<AlertTriangleIcon size={16} color={tc.status.danger} />}
          style={{ borderColor: tc.status.dangerBorder, backgroundColor: tc.status.dangerSurface }}
        >
          <RNText style={{ color: tc.status.danger, fontWeight: '600', fontSize: 14 }}>
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
        icon={<TrashIcon size={24} color={tc.status.warning} />}
        size="sm"
        footer={
          <HStack gap="sm" style={{ justifyContent: 'flex-end' }}>
            <Button variant="tertiary" onPress={() => setShowClearMessagesConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="secondary"
              onPress={handleClearMessages}
              style={{ borderColor: tc.status.warningBorder, backgroundColor: tc.status.warningSurface }}
            >
              <RNText style={{ color: tc.status.warning, fontWeight: '600', fontSize: 14 }}>
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
        icon={<AlertTriangleIcon size={24} color={tc.status.danger} />}
        size="sm"
        footer={
          <HStack gap="sm" style={{ justifyContent: 'flex-end' }}>
            <Button variant="tertiary" onPress={() => setShowClearAllConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="secondary"
              onPress={handleClearAllData}
              style={{ borderColor: tc.status.dangerBorder, backgroundColor: tc.status.dangerSurface }}
            >
              <RNText style={{ color: tc.status.danger, fontWeight: '600', fontSize: 14 }}>
                Clear All Data
              </RNText>
            </Button>
          </HStack>
        }
      />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Plugins
// ---------------------------------------------------------------------------

function PluginsSection({ onOpenMarketplace }: { onOpenMarketplace?: () => void }) {
  const { theme, mode } = useTheme();
  const tc = theme.colors;
  const isDark = mode === 'dark';
  const { registry, enabledCount, enablePlugin, disablePlugin, uninstallPlugin } = usePlugins();

  const allPlugins = registry.getAllPlugins();
  const hasPlugins = allPlugins.length > 0;

  const handleToggle = useCallback(async (pluginId: string) => {
    const plugin = registry.getPlugin(pluginId);
    if (!plugin) return;
    try {
      if (plugin.state === 'enabled') {
        await disablePlugin(pluginId);
      } else {
        await enablePlugin(pluginId);
      }
    } catch (err) {
      console.error('Failed to toggle plugin:', err);
    }
  }, [registry, enablePlugin, disablePlugin]);

  const handleUninstall = useCallback(async (pluginId: string) => {
    try {
      await uninstallPlugin(pluginId);
    } catch (err) {
      console.error('Failed to uninstall plugin:', err);
    }
  }, [uninstallPlugin]);

  return (
    <View style={{ gap: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <RNText style={{ fontSize: 18, fontWeight: '700', color: tc.text.primary, marginBottom: 4 }}>
            Plugins
          </RNText>
          <RNText style={{ fontSize: 13, color: tc.text.secondary }}>
            Extend Umbra with plugins. {enabledCount} plugin{enabledCount !== 1 ? 's' : ''} active.
          </RNText>
        </View>
        {onOpenMarketplace && (
          <Button
            size="sm"
            variant="primary"
            onPress={onOpenMarketplace}
            iconLeft={<DownloadIcon size={14} color={tc.text.inverse} />}
          >
            Marketplace
          </Button>
        )}
      </View>

      {!hasPlugins && (
        <Pressable
          onPress={onOpenMarketplace}
          style={({ pressed }) => ({
            padding: 24,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: tc.border.subtle,
            backgroundColor: pressed
              ? tc.accent.highlight
              : tc.background.sunken,
            alignItems: 'center',
            gap: 8,
          })}
        >
          <ZapIcon size={24} color={tc.text.muted} />
          <RNText style={{ fontSize: 14, fontWeight: '600', color: tc.text.primary }}>
            No plugins installed
          </RNText>
          <RNText style={{ fontSize: 12, color: tc.text.secondary, textAlign: 'center' }}>
            Browse the marketplace to discover and install plugins that extend Umbra's functionality.
          </RNText>
          {onOpenMarketplace && (
            <RNText style={{ fontSize: 12, color: tc.accent.primary, fontWeight: '600', marginTop: 4 }}>
              Open Marketplace
            </RNText>
          )}
        </Pressable>
      )}

      {hasPlugins && allPlugins.map((plugin) => (
        <PluginSettingsCard
          key={plugin.manifest.id}
          plugin={plugin}
          isDark={isDark}
          tc={tc}
          onToggle={() => handleToggle(plugin.manifest.id)}
          onUninstall={() => handleUninstall(plugin.manifest.id)}
        />
      ))}

    </View>
  );
}

/** Individual plugin card in the Settings → Plugins section */
function PluginSettingsCard({
  plugin,
  isDark,
  tc,
  onToggle,
  onUninstall,
}: {
  plugin: { manifest: any; state: string; error?: string };
  isDark: boolean;
  tc: any;
  onToggle: () => void;
  onUninstall: () => void;
}) {
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <View
      style={{
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: tc.border.subtle,
        backgroundColor: tc.background.sunken,
        gap: 8,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            backgroundColor: isDark ? tc.background.raised : tc.background.sunken,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ZapIcon size={16} color={plugin.state === 'enabled' ? tc.status.success : tc.text.muted} />
        </View>
        <View style={{ flex: 1 }}>
          <RNText style={{ fontSize: 14, fontWeight: '600', color: tc.text.primary }}>
            {plugin.manifest.name}
          </RNText>
          <RNText style={{ fontSize: 12, color: tc.text.secondary }} numberOfLines={1}>
            {plugin.manifest.description}
          </RNText>
          <RNText style={{ fontSize: 11, color: tc.text.muted, marginTop: 1 }}>
            v{plugin.manifest.version} · {plugin.manifest.author.name}
          </RNText>
          {plugin.state === 'error' && plugin.error && (
            <RNText style={{ fontSize: 11, color: tc.status.danger, marginTop: 2 }} numberOfLines={1}>
              Error: {plugin.error}
            </RNText>
          )}
        </View>
        <Toggle
          checked={plugin.state === 'enabled'}
          onChange={onToggle}
          size="sm"
        />
      </View>

      {/* Permissions badges */}
      {plugin.manifest.permissions && plugin.manifest.permissions.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, paddingLeft: 44 }}>
          {plugin.manifest.permissions.slice(0, 4).map((perm: string) => (
            <Tag key={perm} size="sm" style={{ borderRadius: 6 }}>
              {perm}
            </Tag>
          ))}
          {plugin.manifest.permissions.length > 4 && (
            <RNText style={{ fontSize: 9, color: tc.text.muted, alignSelf: 'center' }}>
              +{plugin.manifest.permissions.length - 4} more
            </RNText>
          )}
        </View>
      )}

      {/* Uninstall */}
      {showConfirm ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 44 }}>
          <RNText style={{ fontSize: 11, color: tc.status.danger, flex: 1 }}>
            Remove plugin and data?
          </RNText>
          <Button
            size="xs"
            variant="destructive"
            onPress={() => { onUninstall(); setShowConfirm(false); }}
          >
            Remove
          </Button>
          <Button size="xs" variant="tertiary" onPress={() => setShowConfirm(false)}>
            Cancel
          </Button>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingLeft: 44 }}>
          <Button
            size="xs"
            variant="tertiary"
            onPress={() => setShowConfirm(true)}
            iconLeft={<TrashIcon size={11} color={tc.text.muted} />}
          >
            Uninstall
          </Button>
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// About Section
// ---------------------------------------------------------------------------

function AboutSection() {
  const { theme } = useTheme();
  const tc = theme.colors;
  const update = useAppUpdate();
  const [showAllPlatforms, setShowAllPlatforms] = useState(false);

  // Get core version — it's a synchronous static method
  let coreVersion = '';
  try {
    const { UmbraService } = require('@umbra/service');
    coreVersion = UmbraService.getVersion();
  } catch {
    // Service not available (e.g. web without WASM)
  }

  const labelStyle = {
    fontSize: 12,
    color: tc.text.muted,
    marginBottom: 2,
  };

  const valueStyle = {
    fontSize: 14,
    color: tc.text.primary,
    fontWeight: '500' as const,
    marginBottom: 12,
  };

  return (
    <View>
      <RNText style={{ fontSize: 20, fontWeight: '700', color: tc.text.primary, marginBottom: 20 }}>About</RNText>

      <Card style={{ padding: 16, marginBottom: 16 }}>
        <RNText style={{ fontSize: 16, fontWeight: '600', color: tc.text.primary, marginBottom: 12 }}>
          Umbra
        </RNText>

        <RNText style={labelStyle}>App Version</RNText>
        <RNText style={valueStyle}>{update.currentVersion}</RNText>

        {coreVersion ? (
          <>
            <RNText style={labelStyle}>Core Version</RNText>
            <RNText style={valueStyle}>{coreVersion}</RNText>
          </>
        ) : null}

        <RNText style={labelStyle}>Latest Available</RNText>
        <RNText style={valueStyle}>
          {update.isLoading ? 'Checking...' : update.latestVersion || update.currentVersion}
          {update.hasUpdate && !update.isWebUser && (
            <RNText style={{ color: tc.status.success, fontSize: 12 }}> (update available)</RNText>
          )}
        </RNText>

        <HStack gap={8} style={{ marginTop: 4 }}>
          <Button
            variant="secondary"
            size="sm"
            onPress={update.checkForUpdate}
          >
            Check for Updates
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onPress={() => setShowAllPlatforms(true)}
            iconLeft={<DownloadIcon size={14} color={tc.text.secondary} />}
          >
            All Downloads
          </Button>
        </HStack>
      </Card>

      <Card style={{ padding: 16, marginBottom: 16 }}>
        <RNText style={{ fontSize: 14, fontWeight: '600', color: tc.text.primary, marginBottom: 10 }}>Links</RNText>

        <Pressable
          onPress={() => {
            Linking.openURL('https://github.com/InfamousVague/Umbra');
          }}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 }}
        >
          <ExternalLinkIcon size={14} color={tc.text.link} />
          <RNText style={{ fontSize: 13, color: tc.text.link }}>GitHub Repository</RNText>
        </Pressable>

        {update.releaseUrl && (
          <Pressable
            onPress={() => Linking.openURL(update.releaseUrl!)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 }}
          >
            <ExternalLinkIcon size={14} color={tc.text.link} />
            <RNText style={{ fontSize: 13, color: tc.text.link }}>Release Notes</RNText>
          </Pressable>
        )}

        <Pressable
          onPress={() => Linking.openURL('https://umbra.chat')}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 }}
        >
          <GlobeIcon size={14} color={tc.text.link} />
          <RNText style={{ fontSize: 13, color: tc.text.link }}>Web App</RNText>
        </Pressable>
      </Card>

      <Card style={{ padding: 16 }}>
        <RNText style={{ fontSize: 12, color: tc.text.muted, lineHeight: 18 }}>
          Umbra is a private, peer-to-peer messaging application with end-to-end encryption.
          Built with Ed25519/X25519/AES-256-GCM cryptography and WebRTC for direct communication.
        </RNText>
      </Card>

      <AllPlatformsDialog
        open={showAllPlatforms}
        onClose={() => setShowAllPlatforms(false)}
        downloads={update.downloads}
        version={update.latestVersion || update.currentVersion}
        releaseUrl={update.releaseUrl}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// MessagingSection
// ---------------------------------------------------------------------------

const SAMPLE_MESSAGES = [
  { sender: 'Alice', text: 'Hey, how\'s it going?', isOwn: false },
  { sender: 'You', text: 'Pretty good!', isOwn: true },
  { sender: 'Alice', text: 'Great to hear 😊', isOwn: false },
];

function MessageDisplayPreview({
  mode,
  selected,
  onSelect,
}: {
  mode: MessageDisplayMode;
  selected: boolean;
  onSelect: () => void;
}) {
  const { theme } = useTheme();
  const tc = theme.colors;
  const isDark = theme.mode === 'dark';

  return (
    <Pressable
      onPress={onSelect}
      style={({ pressed }) => ({
        flex: 1,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: selected ? tc.accent.primary : tc.border.subtle,
        backgroundColor: selected
          ? (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)')
          : 'transparent',
        overflow: 'hidden',
        opacity: pressed && !selected ? 0.85 : 1,
      })}
    >
      {/* Preview card header */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 12,
          paddingVertical: 8,
          backgroundColor: isDark ? tc.background.surface : tc.background.sunken,
          borderBottomWidth: 1,
          borderBottomColor: tc.border.subtle,
        }}
      >
        <RNText
          style={{
            fontSize: 12,
            fontWeight: '600',
            color: selected ? tc.accent.primary : tc.text.primary,
          }}
        >
          {mode === 'bubble' ? 'Bubbles' : 'Inline'}
        </RNText>
        {selected && (
          <View
            style={{
              width: 18,
              height: 18,
              borderRadius: 9,
              backgroundColor: tc.accent.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CheckIcon size={11} color="#fff" />
          </View>
        )}
      </View>

      {/* Preview message area */}
      <View
        style={{
          padding: 10,
          gap: 8,
          minHeight: 130,
          backgroundColor: isDark ? tc.background.canvas : tc.background.canvas,
        }}
      >
        {mode === 'bubble' ? (
          /* ── Bubble preview ── */
          <>
            {SAMPLE_MESSAGES.map((msg, i) => (
              <View
                key={i}
                style={{
                  flexDirection: msg.isOwn ? 'row-reverse' : 'row',
                  alignItems: 'flex-end',
                  gap: 4,
                }}
              >
                {!msg.isOwn && (
                  <View
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 9,
                      backgroundColor: tc.accent.primary,
                      opacity: 0.6,
                    }}
                  />
                )}
                <View
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 5,
                    borderRadius: 10,
                    borderBottomLeftRadius: msg.isOwn ? 10 : 2,
                    borderBottomRightRadius: msg.isOwn ? 2 : 10,
                    backgroundColor: msg.isOwn
                      ? tc.accent.primary
                      : (isDark ? tc.background.raised : tc.background.sunken),
                    maxWidth: '75%',
                  }}
                >
                  <RNText
                    style={{
                      fontSize: 10,
                      color: msg.isOwn
                        ? (tc.text.inverse || '#fff')
                        : tc.text.primary,
                    }}
                  >
                    {msg.text}
                  </RNText>
                </View>
              </View>
            ))}
          </>
        ) : (
          /* ── Inline preview (Slack/Discord style) ── */
          <>
            {SAMPLE_MESSAGES.map((msg, i) => {
              const showHeader = i === 0 || SAMPLE_MESSAGES[i - 1].sender !== msg.sender;
              return (
                <View
                  key={i}
                  style={{
                    flexDirection: 'row',
                    gap: 6,
                    alignItems: 'flex-start',
                  }}
                >
                  <View style={{ width: 18 }}>
                    {showHeader && (
                      <View
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 9,
                          backgroundColor: tc.accent.primary,
                          opacity: 0.6,
                        }}
                      />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    {showHeader && (
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'baseline',
                          gap: 4,
                          marginBottom: 1,
                        }}
                      >
                        <RNText
                          style={{
                            fontSize: 10,
                            fontWeight: '700',
                            color: tc.text.primary,
                          }}
                        >
                          {msg.sender}
                        </RNText>
                        <RNText
                          style={{
                            fontSize: 8,
                            color: tc.text.muted,
                          }}
                        >
                          2:34 PM
                        </RNText>
                      </View>
                    )}
                    <RNText
                      style={{
                        fontSize: 10,
                        color: tc.text.secondary,
                        lineHeight: 14,
                      }}
                    >
                      {msg.text}
                    </RNText>
                  </View>
                </View>
              );
            })}
          </>
        )}
      </View>
    </Pressable>
  );
}

function MessagingSection() {
  const { theme } = useTheme();
  const tc = theme.colors;
  const { displayMode, setDisplayMode } = useMessaging();

  return (
    <View style={{ gap: 20 }}>
      <SectionHeader
        title="Messaging"
        description="Choose how messages are displayed in conversations."
      />

      <View nativeID="sub-display">
        <RNText
          style={{
            fontSize: 13,
            fontWeight: '600',
            color: tc.text.secondary,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: 10,
          }}
        >
          Display Style
        </RNText>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <MessageDisplayPreview
            mode="bubble"
            selected={displayMode === 'bubble'}
            onSelect={() => setDisplayMode('bubble')}
          />
          <MessageDisplayPreview
            mode="inline"
            selected={displayMode === 'inline'}
            onSelect={() => setDisplayMode('inline')}
          />
        </View>

        <RNText
          style={{
            fontSize: 12,
            color: tc.text.muted,
            marginTop: 8,
          }}
        >
          {displayMode === 'bubble'
            ? 'Messages appear in colored bubbles. Your messages are on the right, theirs on the left.'
            : 'All messages are left-aligned with sender name and timestamp. Similar to Slack or Discord.'}
        </RNText>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// SettingsDialog
// ---------------------------------------------------------------------------

export function SettingsDialog({ open, onClose, onOpenMarketplace, initialSection }: SettingsDialogProps) {
  const { theme, mode } = useTheme();
  const tc = theme.colors;
  const isDark = mode === 'dark';
  const isMobile = useIsMobile();
  const insets = Platform.OS !== 'web' ? useSafeAreaInsets() : { top: 0, bottom: 0, left: 0, right: 0 };
  const [mobileShowSidebar, setMobileShowSidebar] = useState(true);
  const [activeSection, setActiveSection] = useState<SettingsSection>('account');
  const [activeSubsection, setActiveSubsection] = useState<string | null>(
    SUBCATEGORIES.account ? SUBCATEGORIES.account[0].id : null,
  );

  const contentScrollRef = useRef<ScrollView>(null);

  const handleSectionChange = useCallback((sectionId: SettingsSection) => {
    setActiveSection(sectionId);
    const subs = SUBCATEGORIES[sectionId];
    setActiveSubsection(subs ? subs[0].id : null);
    if (isMobile) setMobileShowSidebar(false);
  }, [isMobile]);

  const handleSubsectionClick = useCallback((subId: string) => {
    setActiveSubsection(subId);
    // On mobile, navigate from sidebar to content view
    if (isMobile) setMobileShowSidebar(false);
    // On web, scroll the content area to the nativeID element
    if (Platform.OS === 'web') {
      requestAnimationFrame(() => {
        const el = document.querySelector(`[id="sub-${subId}"]`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }
  }, [isMobile]);

  // Jump to requested section when dialog opens with initialSection
  useEffect(() => {
    if (open && initialSection) {
      handleSectionChange(initialSection);
    }
  }, [open, initialSection, handleSectionChange]);

  // Reset to sidebar view on mobile when dialog opens
  useEffect(() => {
    if (open && isMobile) {
      setMobileShowSidebar(true);
    }
  }, [open, isMobile]);

  // -- Styles ----------------------------------------------------------------

  const modalStyle = useMemo<ViewStyle>(
    () => (isMobile ? {
      width: '100%',
      height: '100%',
      flexDirection: 'row',
      backgroundColor: isDark ? tc.background.raised : tc.background.canvas,
    } : {
      width: 760,
      maxWidth: '95%',
      height: 520,
      maxHeight: '85%',
      flexDirection: 'row',
      borderRadius: 16,
      overflow: 'hidden',
      backgroundColor: isDark ? tc.background.raised : tc.background.canvas,
      borderWidth: isDark ? 1 : 0,
      borderColor: isDark ? tc.border.subtle : 'transparent',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: isDark ? 0.6 : 0.25,
      shadowRadius: 32,
      elevation: 12,
    }),
    [tc, isDark, isMobile, insets],
  );

  const sidebarStyle = useMemo<ViewStyle>(
    () => (isMobile ? {
      flex: 1,
      backgroundColor: isDark ? tc.background.surface : tc.background.sunken,
      paddingTop: insets.top + 16,
      paddingBottom: insets.bottom + 16,
      paddingLeft: insets.left + 10,
      paddingRight: insets.right + 10,
    } : {
      width: 180,
      flexGrow: 0,
      flexShrink: 0,
      backgroundColor: isDark ? tc.background.surface : tc.background.sunken,
      borderRightWidth: 1,
      borderRightColor: tc.border.subtle,
      paddingVertical: 16,
      paddingHorizontal: 10,
    }),
    [tc, isDark, isMobile, insets],
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
      case 'messaging':
        return <MessagingSection />;
      case 'notifications':
        return <NotificationsSection />;
      case 'sounds':
        return <SoundsSection />;
      case 'privacy':
        return <PrivacySection />;
      case 'audio-video':
        return <AudioVideoSection />;
      case 'network':
        return <NetworkSection />;
      case 'data':
        return <DataManagementSection />;
      case 'plugins':
        return <PluginsSection onOpenMarketplace={onOpenMarketplace} />;
      case 'about':
        return <AboutSection />;
    }
  };

  const sidebarContent = (
    <ScrollView style={sidebarStyle} showsVerticalScrollIndicator={false}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: isMobile ? 8 : 0 }}>
        <RNText style={sidebarTitleStyle}>Settings</RNText>
        {isMobile && (
          <Pressable onPress={onClose} style={{ padding: 8 }}>
            <XIcon size={20} color={tc.text.secondary} />
          </Pressable>
        )}
      </View>

      {NAV_ITEMS.map((item) => {
        const isActive = activeSection === item.id;
        const Icon = item.icon;
        const subs = SUBCATEGORIES[item.id];
        const hasSubs = subs && subs.length > 1;

        return (
          <View key={item.id}>
            {/* Top-level nav item */}
            <Pressable
              onPress={() => handleSectionChange(item.id)}
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
                    ? tc.accent.highlight
                    : 'transparent',
                marginBottom: 2,
              })}
            >
              <Icon
                size={18}
                color={isActive ? tc.text.inverse : tc.text.secondary}
              />
              <RNText
                style={{
                  fontSize: 14,
                  fontWeight: isActive ? '600' : '400',
                  color: isActive ? tc.text.inverse : tc.text.secondary,
                }}
              >
                {item.label}
              </RNText>
            </Pressable>

            {/* Sub-items: show when section is active and has subcategories */}
            {isActive && hasSubs && (
              <View style={{ marginLeft: 20, marginBottom: 4 }}>
                {subs.map((sub) => {
                  const isSubActive = activeSubsection === sub.id;
                  return (
                    <View
                      key={sub.id}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'stretch',
                        marginBottom: 1,
                      }}
                    >
                      <View
                        style={{
                          width: 2,
                          borderRadius: 1,
                          backgroundColor: isSubActive
                            ? tc.accent.primary
                            : 'rgba(255,255,255,0.18)',
                        }}
                      />
                      <Pressable
                        onPress={() => handleSubsectionClick(sub.id)}
                        style={({ pressed }) => ({
                          flex: 1,
                          paddingVertical: 5,
                          paddingHorizontal: 10,
                          borderTopRightRadius: 4,
                          borderBottomRightRadius: 4,
                          backgroundColor: isSubActive
                            ? 'rgba(255,255,255,0.06)'
                            : pressed
                              ? 'rgba(255,255,255,0.04)'
                              : 'transparent',
                        })}
                      >
                        <RNText
                          style={{
                            fontSize: 13,
                            fontWeight: isSubActive ? '600' : '400',
                            color: isSubActive
                              ? tc.accent.primary
                              : tc.text.secondary,
                          }}
                        >
                          {sub.label}
                        </RNText>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );

  const contentArea = (
    <View style={{ flex: 1, paddingTop: isMobile ? insets.top : 0, paddingBottom: isMobile ? insets.bottom : 0, paddingLeft: isMobile ? insets.left : 0, paddingRight: isMobile ? insets.right : 0 }}>
      {/* Mobile: back button + section title header */}
      {isMobile && (
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: tc.border.subtle }}>
          <Pressable onPress={() => setMobileShowSidebar(true)} style={{ padding: 4, marginRight: 8 }}>
            <ArrowLeftIcon size={20} color={tc.text.secondary} />
          </Pressable>
          <RNText style={{ fontSize: 16, fontWeight: '600', color: tc.text.primary }}>
            {NAV_ITEMS.find((n) => n.id === activeSection)?.label ?? 'Settings'}
          </RNText>
        </View>
      )}
      <ScrollView
        ref={contentScrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: isMobile ? 16 : 28 }}
        showsVerticalScrollIndicator={false}
      >
        {renderSection()}
      </ScrollView>
    </View>
  );

  return (
    <Overlay
      open={open}
      backdrop={isMobile ? undefined : 'dim'}
      center={!isMobile}
      onBackdropPress={isMobile ? undefined : onClose}
      animationType="fade"
      useModal={!isMobile}
    >

      <HelpPopoverHost />
      <View style={modalStyle}>
        {isMobile ? (
          // Mobile: exclusive sidebar / content views
          mobileShowSidebar ? sidebarContent : contentArea
        ) : (
          // Desktop: side-by-side
          <>
            {sidebarContent}
            {contentArea}
          </>
        )}
      </View>
    </Overlay>
  );
}
