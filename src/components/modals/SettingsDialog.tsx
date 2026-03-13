import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Animated, Easing, View, Pressable, ScrollView, Platform, Image, Linking, Modal, useWindowDimensions } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Box,
  Spinner,
  ScrollArea,
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
  Progress,
  GradientText,
  AuraBurst,
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
  FileTextIcon,
  CodeIcon,
} from '@/components/ui';
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
import { ShortcutRegistry } from '@/services/ShortcutRegistry';
import { clearDatabaseExport, getSqlDatabase, getWasm } from '@umbra/wasm';
import * as ExpoClipboard from 'expo-clipboard';
import { useStorageManager } from '@/hooks/useStorageManager';
import { useAppUpdate } from '@/hooks/useAppUpdate';
import { useIsMobile } from '@/hooks/useIsMobile';
import { AllPlatformsDialog } from '@/components/modals/AllPlatformsDialog';
import { HelpIndicator } from '@/components/ui/HelpIndicator';
import { HelpPopoverHost } from '@/components/ui/HelpPopoverHost';
import { HelpText, HelpHighlight, HelpListItem } from '@/components/ui/HelpContent';
import { PRIMARY_RELAY_URL, DEFAULT_RELAY_SERVERS } from '@/config';
import { TEST_IDS } from '@/constants/test-ids';
import { LinkedAccountsPanel, FriendDiscoveryPanel } from '@/components/discovery';
import { IdentityCardDialog } from '@/components/modals/IdentityCardDialog';
import { useSync, markSyncDirty } from '@/contexts/SyncContext';
import { useDeveloperSettings } from '@/hooks/useDeveloperSettings';
import { dbg } from '@/utils/debug';

const SRC = 'SettingsDialog';

// Cast icons for Wisp Input compatibility (accepts strokeWidth prop)
type InputIcon = React.ComponentType<{ size?: number | string; color?: string; strokeWidth?: number }>;
const UserInputIcon = UserIcon as InputIcon;
const AtSignInputIcon = AtSignIcon as InputIcon;

// ---------------------------------------------------------------------------
// Image compression
// ---------------------------------------------------------------------------

/** Max base64 sizes matching umbra-core limits */
const MAX_AVATAR_BASE64 = 2 * 1024 * 1024; // 2 MB
const MAX_BANNER_BASE64 = 4 * 1024 * 1024; // 4 MB

/**
 * Compress an image file to fit within a base64 size budget.
 * Uses canvas to resize and convert to JPEG.
 */
function compressImage(
  file: File,
  maxBase64Bytes: number,
  maxWidth: number,
  maxHeight: number,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      // Scale down to fit within max dimensions while preserving aspect ratio
      let { width, height } = img;
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas not supported')); return; }
      ctx.drawImage(img, 0, 0, width, height);

      // Try decreasing quality until we fit the budget
      for (let q = 0.85; q >= 0.1; q -= 0.1) {
        const dataUrl = canvas.toDataURL('image/jpeg', q);
        if (dataUrl.length <= maxBase64Bytes) {
          resolve(dataUrl);
          return;
        }
      }
      // Final attempt: further halve dimensions
      const smallCanvas = document.createElement('canvas');
      smallCanvas.width = Math.round(width / 2);
      smallCanvas.height = Math.round(height / 2);
      const sctx = smallCanvas.getContext('2d');
      if (!sctx) { reject(new Error('Canvas not supported')); return; }
      sctx.drawImage(canvas, 0, 0, smallCanvas.width, smallCanvas.height);
      const finalUrl = smallCanvas.toDataURL('image/jpeg', 0.7);
      if (finalUrl.length <= maxBase64Bytes) {
        resolve(finalUrl);
      } else {
        reject(new Error('Image is too large even after compression. Please use a smaller image.'));
      }
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load image')); };
    img.src = url;
  });
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SettingsSection = 'account' | 'appearance' | 'messaging' | 'notifications' | 'sounds' | 'privacy' | 'audio-video' | 'network' | 'data' | 'plugins' | 'keyboard-shortcuts' | 'about' | 'developer';

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
  { id: 'appearance', label: 'Appearance', icon: PaletteIcon },
  { id: 'messaging', label: 'Messaging', icon: MessageIcon },
  { id: 'notifications', label: 'Notifications', icon: BellIcon },
  { id: 'sounds', label: 'Sounds', icon: VolumeIcon },
  { id: 'privacy', label: 'Privacy', icon: ShieldIcon },
  { id: 'audio-video', label: 'Audio & Video', icon: VideoIcon },
  { id: 'network', label: 'Network', icon: GlobeIcon },
  { id: 'data', label: 'Data', icon: DatabaseIcon },
  { id: 'plugins', label: 'Plugins', icon: ZapIcon },
  { id: 'keyboard-shortcuts', label: 'Shortcuts', icon: KeyIcon },
  { id: 'about', label: 'About', icon: BookOpenIcon },
  { id: 'developer', label: 'Developer', icon: CodeIcon },
];

const NAV_TEST_IDS: Record<SettingsSection, string> = {
  'account': TEST_IDS.SETTINGS.NAV_ACCOUNT,
  'appearance': TEST_IDS.SETTINGS.NAV_APPEARANCE,
  'messaging': TEST_IDS.SETTINGS.NAV_MESSAGING,
  'notifications': TEST_IDS.SETTINGS.NAV_NOTIFICATIONS,
  'sounds': TEST_IDS.SETTINGS.NAV_SOUNDS,
  'privacy': TEST_IDS.SETTINGS.NAV_PRIVACY,
  'audio-video': TEST_IDS.SETTINGS.NAV_AUDIO_VIDEO,
  'network': TEST_IDS.SETTINGS.NAV_NETWORK,
  'data': TEST_IDS.SETTINGS.NAV_DATA,
  'plugins': TEST_IDS.SETTINGS.NAV_PLUGINS,
  'keyboard-shortcuts': TEST_IDS.SETTINGS.NAV_SHORTCUTS,
  'about': TEST_IDS.SETTINGS.NAV_ABOUT,
  'developer': TEST_IDS.SETTINGS.NAV_DEVELOPER,
};

const SECTION_TEST_IDS: Record<SettingsSection, string> = {
  'account': TEST_IDS.SETTINGS.SECTION_ACCOUNT,
  'appearance': TEST_IDS.SETTINGS.SECTION_APPEARANCE,
  'messaging': TEST_IDS.SETTINGS.SECTION_MESSAGING,
  'notifications': TEST_IDS.SETTINGS.SECTION_NOTIFICATIONS,
  'sounds': TEST_IDS.SETTINGS.SECTION_SOUNDS,
  'privacy': TEST_IDS.SETTINGS.SECTION_PRIVACY,
  'audio-video': TEST_IDS.SETTINGS.SECTION_AUDIO_VIDEO,
  'network': TEST_IDS.SETTINGS.SECTION_NETWORK,
  'data': TEST_IDS.SETTINGS.SECTION_DATA,
  'plugins': TEST_IDS.SETTINGS.SECTION_PLUGINS,
  'keyboard-shortcuts': TEST_IDS.SETTINGS.SECTION_SHORTCUTS,
  'about': TEST_IDS.SETTINGS.SECTION_ABOUT,
  'developer': TEST_IDS.SETTINGS.SECTION_DEVELOPER,
};

interface SubNavItem { id: string; label: string; }

const SUBCATEGORIES: Partial<Record<SettingsSection, SubNavItem[]>> = {
  account: [
    { id: 'profile', label: 'Profile' },
    { id: 'identity', label: 'Identity' },
    { id: 'sharing', label: 'Sharing' },
    { id: 'sync', label: 'Sync' },
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
  developer: [
    { id: 'diagnostics', label: 'Call Diagnostics' },
    { id: 'capture', label: 'Media Capture' },
    { id: 'testing', label: 'Testing' },
  ],
};

const ACCENT_PRESETS: Array<{ color: string; name: string }> = [
  { color: '#6A5A8E', name: 'Amethyst' },
  { color: '#6B6B9E', name: 'Wisteria' },
  { color: '#9B6B7A', name: 'Antique Rose' },
  { color: '#C4A888', name: 'Desert Sand' },
  { color: '#6B8A6B', name: 'Sage' },
  { color: '#789B70', name: 'Eucalyptus' },
  { color: '#789B90', name: 'Celadon' },
  { color: '#6B8E82', name: 'Jade Gray' },
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
      <Box style={{ gap: 8 }}>
        <Box>
          <Box style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 14, fontWeight: '500', color: tc.text.primary }}>
              {label}
            </Text>
            {helpIndicator}
          </Box>
          {description && (
            <Text style={{ fontSize: 12, color: tc.text.secondary, marginTop: 2 }}>
              {description}
            </Text>
          )}
        </Box>
        {children}
      </Box>
    );
  }

  return (
    <Box style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 40 }}>
      <Box style={{ flex: 1, marginRight: 16 }}>
        <Box style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 14, fontWeight: '500', color: tc.text.primary }}>
            {label}
          </Text>
          {helpIndicator}
        </Box>
        {description && (
          <Text style={{ fontSize: 12, color: tc.text.secondary, marginTop: 2 }}>
            {description}
          </Text>
        )}
      </Box>
      <Box style={{ flexShrink: 0 }}>{children}</Box>
    </Box>
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
  testID,
}: {
  options: InlineDropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  testID?: string;
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
    <ScrollArea style={{ maxHeight: isNative ? 400 : 240 }}>
      {options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            testID={testID ? `${testID}.option.${opt.value}` : undefined}
            onPress={() => { onChange(opt.value); setOpen(false); }}
            accessibilityActions={[{ name: 'activate', label: opt.label }]}
            onAccessibilityAction={(e: { nativeEvent: { actionName: string } }) => {
              if (e.nativeEvent.actionName === 'activate') { onChange(opt.value); setOpen(false); }
            }}
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
            <Box style={{ flex: 1 }}>
              <Text style={{
                fontSize: 14,
                fontWeight: isActive ? '600' : '400',
                color: isActive ? tc.accent.primary : (isNative ? tc.text.onRaised : tc.text.primary),
              }}>
                {opt.label}
              </Text>
              {opt.description && (
                <Text style={{ fontSize: 12, color: isNative ? tc.text.onRaisedSecondary : tc.text.muted, marginTop: 2 }}>
                  {opt.description}
                </Text>
              )}
            </Box>
            {isActive && (
              <Text style={{ fontSize: 14, color: tc.accent.primary, fontWeight: '600' }}>✓</Text>
            )}
          </Pressable>
        );
      })}
    </ScrollArea>
  );

  // Web: portal-based positioned dropdown
  const webDropdownList = open && (
    <>
      <Pressable
        onPress={() => setOpen(false)}
        style={{ position: 'fixed' as any, top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999 }}
      />
      <Box
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
      </Box>
    </>
  );

  return (
    <Box>
      <Pressable
        ref={triggerRef}
        onPress={() => setOpen((p) => !p)}
        testID={testID}
        accessibilityValue={{ text: value }}
        accessibilityActions={[{ name: 'activate', label: 'Open dropdown' }]}
        onAccessibilityAction={(e: { nativeEvent: { actionName: string } }) => {
          if (e.nativeEvent.actionName === 'activate') setOpen((p) => !p);
        }}
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
        <Text style={{ flex: 1, fontSize: 14, color: selected ? tc.text.primary : tc.text.muted }} numberOfLines={1}>
          {selected?.label ?? placeholder}
        </Text>
        {selected?.description && (
          <Text style={{ fontSize: 11, color: tc.text.muted }}>
            {selected.description}
          </Text>
        )}
        <Box style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}>
          <ChevronDownIcon size={16} color={tc.text.secondary} />
        </Box>
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
              <Box
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
              </Box>
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Section Header
// ---------------------------------------------------------------------------

function SectionHeader({ title, description }: { title: string; description: string }) {
  const { theme } = useTheme();
  const tc = theme.colors;

  return (
    <Box style={{ marginBottom: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: '700', color: tc.text.primary }}>
        {title}
      </Text>
      <GradientText animated speed={10000} style={{ fontSize: 13, marginTop: 4 }}>
        {description}
      </GradientText>
    </Box>
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
// Account Sync Subsection
// ---------------------------------------------------------------------------

function AccountSyncSubsection() {
  const { identity } = useAuth();
  const { theme } = useTheme();
  const tc = theme.colors;
  const {
    syncEnabled, syncStatus, lastSyncedAt, syncError,
    setSyncEnabled, triggerSync, deleteSyncData,
  } = useSync();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSyncNow = useCallback(async () => {
    setIsSyncing(true);
    try {
      // Cascade: ensure current identity state is in KV before syncing
      if (identity) {
        try {
          const w = getWasm();
          if (w) {
            if (identity.displayName) {
              (w as any).umbra_wasm_plugin_kv_set('__umbra_system__', '__display_name__', identity.displayName);
            }
          }
        } catch { /* ignore */ }
        markSyncDirty('preferences');
      }
      await triggerSync();
    } finally {
      setIsSyncing(false);
    }
  }, [triggerSync, identity]);

  const handleDelete = useCallback(async () => {
    setIsDeleting(true);
    try {
      await deleteSyncData();
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  }, [deleteSyncData]);

  const statusLabel = syncStatus === 'synced' ? 'Synced'
    : syncStatus === 'syncing' ? 'Syncing...'
    : syncStatus === 'error' ? 'Sync error'
    : syncStatus === 'disabled' ? 'Disabled'
    : 'Idle';

  const statusColor = syncStatus === 'synced' ? tc.status.success
    : syncStatus === 'error' ? tc.status.danger
    : tc.text.muted;

  const lastSyncLabel = lastSyncedAt
    ? `Last synced ${new Date(lastSyncedAt).toLocaleString()}`
    : 'Never synced';

  return (
    <Box style={{ gap: 12 }} testID={TEST_IDS.SYNC.SETTINGS_SECTION}>
      <Box>
        <Box style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: tc.text.primary }}>
            Cross-Device Sync
          </Text>
          <HelpIndicator
            id="settings-sync"
            title="Account Sync"
            priority={45}
            size={14}
          >
            <HelpText>
              Keep your friends, groups, preferences, and blocked users synced across all your devices.
            </HelpText>
            <HelpListItem>Data is encrypted with your recovery phrase</HelpListItem>
            <HelpListItem>Only you can decrypt your synced data</HelpListItem>
            <HelpListItem>Messages and files are NOT synced</HelpListItem>
          </HelpIndicator>
        </Box>
        <Text style={{ fontSize: 12, color: tc.text.secondary, marginTop: 2 }}>
          Encrypted sync of account data across devices.
        </Text>
      </Box>

      {/* Enable/disable toggle */}
      <Box style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, color: tc.text.primary }}>
            Enable sync
          </Text>
          <Text style={{ fontSize: 12, color: tc.text.muted }}>
            Automatically sync friends, groups, and preferences
          </Text>
        </Box>
        <Toggle checked={syncEnabled} onChange={setSyncEnabled} testID={TEST_IDS.SYNC.ENABLE_TOGGLE} />
      </Box>

      {/* Status indicator */}
      {syncEnabled && (
        <Card variant="outlined" padding="md">
          <Box style={{ gap: 8 }}>
            <Box style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }} testID={TEST_IDS.SYNC.STATUS_INDICATOR}>
                <Box style={{
                  width: 8, height: 8, borderRadius: 4,
                  backgroundColor: statusColor,
                }} />
                <Text style={{ fontSize: 13, fontWeight: '600', color: tc.text.primary }} testID={TEST_IDS.SYNC.STATUS_LABEL}>
                  {statusLabel}
                </Text>
              </Box>
              <Text style={{ fontSize: 11, color: tc.text.muted }} testID={TEST_IDS.SYNC.LAST_SYNCED}>
                {lastSyncLabel}
              </Text>
            </Box>

            {syncError && (
              <Text style={{ fontSize: 12, color: tc.status.danger }}>
                {syncError}
              </Text>
            )}

            {/* Sync now button */}
            <Button
              variant="secondary"
              onPress={handleSyncNow}
              testID={TEST_IDS.SYNC.SYNC_NOW_BUTTON}
              iconLeft={<ActivityIcon size={14} color={tc.text.primary} />}
              disabled={isSyncing || syncStatus === 'syncing'}
              accessibilityActions={[{ name: 'activate', label: 'Sync Now' }]}
              onAccessibilityAction={(e: { nativeEvent: { actionName: string } }) => {
                if (e.nativeEvent.actionName === 'activate') handleSyncNow();
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: tc.text.primary }}>
                {isSyncing ? 'Syncing...' : 'Sync Now'}
              </Text>
            </Button>

            {/* Delete synced data */}
            <Button
              variant="secondary"
              onPress={() => setShowDeleteConfirm(true)}
              testID={TEST_IDS.SYNC.DELETE_BUTTON}
              iconLeft={<TrashIcon size={14} color={tc.status.danger} />}
              style={{ borderColor: tc.status.dangerBorder, backgroundColor: tc.status.dangerSurface }}
              disabled={isDeleting}
              accessibilityActions={[{ name: 'activate', label: 'Delete Synced Data' }]}
              onAccessibilityAction={(e: { nativeEvent: { actionName: string } }) => {
                if (e.nativeEvent.actionName === 'activate') setShowDeleteConfirm(true);
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: tc.status.danger }}>
                Delete Synced Data
              </Text>
            </Button>
          </Box>
        </Card>
      )}

      {/* Delete confirmation dialog */}
      <Dialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Synced Data?"
        icon={<TrashIcon size={24} color={tc.status.danger} />}
        size="sm"
        footer={
          <HStack gap="sm" style={{ justifyContent: 'flex-end' }}>
            <Button variant="tertiary" onPress={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="secondary"
              onPress={handleDelete}
              testID={TEST_IDS.SYNC.DELETE_CONFIRM}
              style={{ borderColor: tc.status.dangerBorder, backgroundColor: tc.status.dangerSurface }}
              disabled={isDeleting}
              accessibilityActions={[{ name: 'activate', label: 'Delete' }]}
              onAccessibilityAction={(e: { nativeEvent: { actionName: string } }) => {
                if (e.nativeEvent.actionName === 'activate') handleDelete();
              }}
            >
              <Text style={{ color: tc.status.danger, fontWeight: '600', fontSize: 14 }}>
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Text>
            </Button>
          </HStack>
        }
      >
        <Text style={{ fontSize: 13, color: tc.text.secondary, textAlign: 'center', lineHeight: 18 }}>
          This will permanently delete your synced data from the relay server. Your local data will not be affected. This cannot be undone.
        </Text>
      </Dialog>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

function AccountSection() {
  const { identity, setIdentity, addAccount, recoveryPhrase, pin, rememberMe, logout } = useAuth();
  const { service } = useUmbra();
  const router = useRouter();
  const { theme, mode } = useTheme();
  const tc = theme.colors;
  const isDark = mode === 'dark';
  const [didCopied, setDidCopied] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showIdentityCard, setShowIdentityCard] = useState(false);
  const [showRotateKeyConfirm, setShowRotateKeyConfirm] = useState(false);
  const [rotateKeyResult, setRotateKeyResult] = useState<{ newEncryptionKey: string; friendCount: number } | null>(null);
  const [rotateKeyError, setRotateKeyError] = useState<string | null>(null);
  const [isRotatingKey, setIsRotatingKey] = useState(false);

  // ── Profile editing state ─────────────────────────────────────────────
  const [displayName, setDisplayName] = useState(identity?.displayName ?? '');
  const [status, setStatus] = useState(identity?.status ?? 'online');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(identity?.avatar ?? null);
  const [pendingAvatar, setPendingAvatar] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(identity?.banner ?? null);
  const [pendingBanner, setPendingBanner] = useState<string | null>(null);
  const [bannerRemoved, setBannerRemoved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [bannerError, setBannerError] = useState<string | null>(null);

  const hasProfileChanges =
    displayName !== (identity?.displayName ?? '') ||
    status !== (identity?.status ?? 'online') ||
    pendingAvatar !== null ||
    pendingBanner !== null ||
    bannerRemoved;

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const bannerInputRef = useRef<HTMLInputElement | null>(null);

  const handleAvatarPick = useCallback(() => {
    if (Platform.OS !== 'web') return;
    if (!fileInputRef.current) {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.style.display = 'none';
      input.addEventListener('change', async () => {
        const file = input.files?.[0];
        if (!file) return;
        setAvatarError(null);
        try {
          const compressed = await compressImage(file, MAX_AVATAR_BASE64, 512, 512);
          setAvatarPreview(compressed);
          setPendingAvatar(compressed);
        } catch (err) {
          setAvatarError(err instanceof Error ? err.message : 'Image too large');
        }
      });
      document.body.appendChild(input);
      fileInputRef.current = input;
    }
    fileInputRef.current.value = '';
    fileInputRef.current.click();
  }, []);

  const handleBannerPick = useCallback(() => {
    if (Platform.OS !== 'web') return;
    if (!bannerInputRef.current) {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.style.display = 'none';
      input.addEventListener('change', async () => {
        const file = input.files?.[0];
        if (!file) return;
        setBannerError(null);
        try {
          const compressed = await compressImage(file, MAX_BANNER_BASE64, 1200, 400);
          setBannerPreview(compressed);
          setPendingBanner(compressed);
        } catch (err) {
          setBannerError(err instanceof Error ? err.message : 'Image too large');
        }
      });
      document.body.appendChild(input);
      bannerInputRef.current = input;
    }
    bannerInputRef.current.value = '';
    bannerInputRef.current.click();
  }, []);

  useEffect(() => {
    return () => {
      if (fileInputRef.current) {
        document.body.removeChild(fileInputRef.current);
        fileInputRef.current = null;
      }
      if (bannerInputRef.current) {
        document.body.removeChild(bannerInputRef.current);
        bannerInputRef.current = null;
      }
    };
  }, []);

  const handleProfileSave = useCallback(async () => {
    if (!service || !identity) return;
    setSaving(true);
    setSaved(false);
    try {
      if (displayName !== identity.displayName) {
        await service.updateProfile({ type: 'displayName', value: displayName });
        try {
          const w = getWasm();
          if (w) {
            (w as any).umbra_wasm_plugin_kv_set('__umbra_system__', '__display_name__', displayName);
          }
        } catch { /* ignore */ }
        markSyncDirty('preferences');
      }
      if (status !== (identity.status ?? 'online')) {
        await service.updateProfile({ type: 'status', value: status });
      }
      if (pendingAvatar !== null) {
        await service.updateProfile({ type: 'avatar', value: pendingAvatar });
        try {
          const w = getWasm();
          if (w) {
            (w as any).umbra_wasm_plugin_kv_set('__umbra_system__', '__avatar__', pendingAvatar);
          }
        } catch { /* ignore */ }
        markSyncDirty('preferences');
      }
      if (pendingBanner !== null) {
        await service.updateProfile({ type: 'banner', value: pendingBanner });
        try {
          const w = getWasm();
          if (w) {
            (w as any).umbra_wasm_plugin_kv_set('__umbra_system__', '__banner__', pendingBanner);
          }
        } catch { /* ignore */ }
        markSyncDirty('preferences');
      } else if (bannerRemoved) {
        await service.updateProfile({ type: 'banner', value: null });
        try {
          const w = getWasm();
          if (w) {
            (w as any).umbra_wasm_plugin_kv_set('__umbra_system__', '__banner__', '');
          }
        } catch { /* ignore */ }
        markSyncDirty('preferences');
      }
      const updatedIdentity = {
        ...identity,
        displayName,
        status,
        ...(pendingAvatar !== null ? { avatar: pendingAvatar } : {}),
        ...(pendingBanner !== null ? { banner: pendingBanner } : bannerRemoved ? { banner: undefined } : {}),
      };
      setIdentity(updatedIdentity);

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
      setPendingBanner(null);
      setBannerRemoved(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      if (__DEV__) dbg.error('state', 'Failed to save profile', err, SRC);
    } finally {
      setSaving(false);
    }
  }, [service, identity, displayName, status, pendingAvatar, pendingBanner, bannerRemoved, setIdentity, addAccount, recoveryPhrase, pin, rememberMe]);

  // ── Auto-save profile changes with debounce ──────────────────────────
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!hasProfileChanges) return;
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(() => {
      handleProfileSave();
    }, 800);
    return () => { if (autoSaveRef.current) clearTimeout(autoSaveRef.current); };
  }, [hasProfileChanges, handleProfileSave]);

  const handleCopyDid = useCallback(async () => {
    if (!identity) return;
    try {
      if (Platform.OS === 'web') {
        await navigator.clipboard.writeText(identity.did);
      } else {
        await ExpoClipboard.setStringAsync(identity.did);
      }
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

  const { getRelayWs } = useNetwork();

  const handleRotateKey = useCallback(async () => {
    setShowRotateKeyConfirm(false);
    setIsRotatingKey(true);
    setRotateKeyError(null);
    setRotateKeyResult(null);
    try {
      const { UmbraService } = await import('@umbra/service');
      const svc = UmbraService.instance;
      const relayWs = getRelayWs();
      const result = await svc.rotateEncryptionKey(relayWs);
      setRotateKeyResult(result);
    } catch (err: any) {
      setRotateKeyError(err?.message ?? 'Key rotation failed');
    } finally {
      setIsRotatingKey(false);
    }
  }, [getRelayWs]);

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
    <Box style={{ gap: 24 }}>
      <SectionHeader
        title="Account"
        description="Your identity, profile, and connection details."
      />

      {/* ── Profile subsection ─────────────────────────────────────────── */}
      <Box nativeID="sub-profile" style={{ gap: 16 }}>
        <SettingRow label="Banner" description="A wide header image for your profile." vertical>
          <Pressable onPress={handleBannerPick}>
            <Box
              style={{
                width: '100%',
                height: 120,
                borderRadius: 12,
                backgroundColor: tc.background.surface,
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                borderWidth: 2,
                borderColor: tc.border.subtle,
                borderStyle: 'dashed',
              }}
            >
              {bannerPreview ? (
                <Image
                  source={{ uri: bannerPreview }}
                  style={{ width: '100%', height: 120, borderRadius: 10 }}
                  resizeMode="cover"
                />
              ) : (
                <Text style={{ color: tc.text.muted, fontSize: 13 }}>
                  Click to upload a banner image
                </Text>
              )}
            </Box>
          </Pressable>
          {bannerPreview && (
            <HStack gap="sm" style={{ marginTop: 4 }}>
              <Button variant="tertiary" size="sm" onPress={handleBannerPick}>
                Change Banner
              </Button>
              <Button
                variant="tertiary"
                size="sm"
                onPress={() => {
                  setBannerPreview(null);
                  setPendingBanner(null);
                  setBannerRemoved(true);
                }}
              >
                Remove Banner
              </Button>
            </HStack>
          )}
          {bannerError && (
            <HStack gap="xs" style={{ alignItems: 'center', marginTop: 4 }}>
              <AlertTriangleIcon size={14} color={tc.status.danger} />
              <Text style={{ color: tc.status.danger, fontSize: 12 }}>{bannerError}</Text>
            </HStack>
          )}
        </SettingRow>

        <SettingRow label="Avatar" description="Your profile picture. Click to upload a new image." vertical>
          <HStack gap="md" style={{ alignItems: 'center' }}>
            <Pressable onPress={handleAvatarPick}>
              <Box
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
              </Box>
            </Pressable>
            <Button variant="tertiary" size="sm" onPress={handleAvatarPick}>
              Upload Photo
            </Button>
          </HStack>
          {avatarError && (
            <HStack gap="xs" style={{ alignItems: 'center', marginTop: 4 }}>
              <AlertTriangleIcon size={14} color={tc.status.danger} />
              <Text style={{ color: tc.status.danger, fontSize: 12 }}>{avatarError}</Text>
            </HStack>
          )}
        </SettingRow>

        <SettingRow label="Display Name" description="How others see you in conversations." vertical>
          <Input
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Your display name"
            icon={UserInputIcon}
            size="md"
            fullWidth
            testID={TEST_IDS.SETTINGS.DISPLAY_NAME_INPUT}
            gradientBorder
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

        {(saving || saved) && (
          <HStack gap="xs" style={{ justifyContent: 'flex-end', alignItems: 'center' }}>
            {saved ? <CheckIcon size={14} color={tc.status.success} /> : null}
            <Text style={{ color: saved ? tc.status.success : tc.text.muted, fontSize: 12 }}>
              {saving ? 'Saving...' : 'Saved'}
            </Text>
          </HStack>
        )}
      </Box>

      {/* ── Identity subsection ────────────────────────────────────────── */}
      <Box nativeID="sub-identity">
          {/* Identity info card */}
          <Card variant="outlined" padding="lg" style={{ width: '100%' }}>
            <Box style={{ gap: 12 }}>
              <Box style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Box
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
                    <Text style={{ fontSize: 20, fontWeight: '700', color: tc.text.onAccent }}>
                      {identity.displayName.charAt(0).toUpperCase()}
                    </Text>
                  )}
                </Box>
                <Box style={{ flex: 1 }}>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: tc.text.primary }}>
                    {identity.displayName}
                  </Text>
                  <Text style={{ fontSize: 12, color: tc.text.muted, marginTop: 2 }}>
                    Member since {memberSince}
                  </Text>
                </Box>
              </Box>

              <Separator spacing="sm" />

              <Box>
                <Box style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: tc.text.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Decentralized ID
                  </Text>
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
                </Box>
                <Box style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text
                    testID={TEST_IDS.SETTINGS.DID_DISPLAY}
                    accessibilityValue={{ text: identity.did }}
                    style={{
                      fontSize: 12,
                      color: tc.text.secondary,
                      fontFamily: 'monospace',
                      flex: 1,
                    }}
                    numberOfLines={1}
                  >
                    {truncatedDid}
                  </Text>
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
                    <Text style={{ fontSize: 11, color: didCopied ? tc.status.success : tc.text.secondary, fontWeight: '500' }}>
                      {didCopied ? 'Copied' : 'Copy'}
                    </Text>
                  </Pressable>
                </Box>
              </Box>
            </Box>
          </Card>

          {/* Account Recovery Details PDF */}
          <Pressable
            onPress={() => setShowIdentityCard(true)}
            testID={TEST_IDS.SETTINGS.IDENTITY_CARD}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              marginTop: 12,
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderRadius: 10,
              backgroundColor: isDark ? '#18181B' : tc.background.sunken,
              borderWidth: 1,
              borderColor: isDark ? '#27272A' : tc.border.subtle,
            }}
          >
            <FileTextIcon size={18} color={tc.text.secondary} />
            <Box style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: tc.text.primary }}>
                Account Recovery Details
              </Text>
              <Text style={{ fontSize: 11, color: tc.text.secondary }}>
                Download a printable PDF with your DID, QR code, and recovery phrase
              </Text>
            </Box>
            <DownloadIcon size={16} color={tc.text.muted} />
          </Pressable>
          <IdentityCardDialog
            open={showIdentityCard}
            onClose={() => setShowIdentityCard(false)}
          />

          {/* Linked Accounts */}
          <Box style={{ marginTop: 20 }}>
            <Box style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: tc.text.primary }}>
                Linked Accounts
              </Text>
              <Text style={{ fontSize: 12, color: tc.text.secondary, marginTop: 2 }}>
                Connect accounts from other platforms.
              </Text>
            </Box>
            <LinkedAccountsPanel did={identity?.did ?? null} />
          </Box>
      </Box>

      <Box nativeID="sub-sharing">
          {/* QR Code sharing */}
          <Box style={{ gap: 12 }}>
            <Box>
              <Box style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: tc.text.primary }}>
                  Share Your Identity
                </Text>
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
              </Box>
              <Text style={{ fontSize: 12, color: tc.text.secondary, marginTop: 2 }}>
                Others can scan this code to connect with you.
              </Text>
            </Box>

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
              <Text style={{ fontSize: 11, color: tc.text.muted, marginTop: 12, textAlign: 'center' }}>
                {identity.displayName}
              </Text>
            </Card>
          </Box>
      </Box>

      <Box nativeID="sub-sync">
        <AccountSyncSubsection />
      </Box>

      <Box nativeID="sub-danger">
      {/* Danger zone */}
      <Box style={{ gap: 12 }}>
        <Box>
          <Box style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: tc.status.danger }}>
              Danger Zone
            </Text>
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
          </Box>
          <Text style={{ fontSize: 12, color: tc.text.secondary, marginTop: 2 }}>
            Logging out will clear your current session.
          </Text>
        </Box>

        <Button
          variant="secondary"
          onPress={() => setShowRotateKeyConfirm(true)}
          iconLeft={<KeyIcon size={16} color={tc.status.danger} />}
          style={{ borderColor: tc.status.dangerBorder, backgroundColor: tc.status.dangerSurface }}
          testID={TEST_IDS.SETTINGS.ROTATE_KEY_BUTTON}
          accessibilityActions={[{ name: 'activate', label: 'Rotate Encryption Key' }]}
          onAccessibilityAction={(e: any) => { if (e.nativeEvent.actionName === 'activate') setShowRotateKeyConfirm(true); }}
        >
          <Text style={{ color: tc.status.danger, fontWeight: '600', fontSize: 14 }}>
            Rotate Encryption Key
          </Text>
        </Button>

        <Button
          variant="secondary"
          onPress={() => setShowLogoutConfirm(true)}
          iconLeft={<LogOutIcon size={16} color={tc.status.danger} />}
          style={{ borderColor: tc.status.dangerBorder, backgroundColor: tc.status.dangerSurface }}
          testID={TEST_IDS.SETTINGS.LOGOUT_BUTTON}
          accessibilityActions={[{ name: 'activate', label: 'Log Out' }]}
          onAccessibilityAction={(e: any) => { if (e.nativeEvent.actionName === 'activate') setShowLogoutConfirm(true); }}
        >
          <Text style={{ color: tc.status.danger, fontWeight: '600', fontSize: 14 }}>
            Log Out
          </Text>
        </Button>
      </Box>

      {/* Key rotation confirmation dialog */}
      <Dialog
        open={showRotateKeyConfirm}
        onClose={() => setShowRotateKeyConfirm(false)}
        title="Rotate Encryption Key?"
        icon={<KeyIcon size={24} color={tc.status.danger} />}
        size="sm"
        testID={TEST_IDS.SETTINGS.ROTATE_KEY_DIALOG}
        footer={
          <HStack gap="sm" style={{ justifyContent: 'flex-end' }}>
            <Button variant="tertiary" onPress={() => setShowRotateKeyConfirm(false)} testID={TEST_IDS.SETTINGS.ROTATE_KEY_CANCEL}>
              Cancel
            </Button>
            <Button
              variant="secondary"
              onPress={handleRotateKey}
              style={{ borderColor: tc.status.dangerBorder, backgroundColor: tc.status.dangerSurface }}
              testID={TEST_IDS.SETTINGS.ROTATE_KEY_CONFIRM}
            >
              <Text style={{ color: tc.status.danger, fontWeight: '600', fontSize: 14 }}>
                {isRotatingKey ? 'Rotating...' : 'Rotate Key'}
              </Text>
            </Button>
          </HStack>
        }
      >
        <Box style={{ gap: 12 }}>
          <Text style={{ fontSize: 13, color: tc.text.secondary, lineHeight: 18 }} testID={TEST_IDS.SETTINGS.ROTATE_KEY_WARNING}>
            This will regenerate your encryption keys and notify all connected friends. Messages sent with your old key will no longer be decryptable by new sessions.
          </Text>
          <Box style={{ backgroundColor: tc.status.dangerSurface, borderRadius: 8, padding: 12, borderWidth: 1, borderColor: tc.status.dangerBorder }}>
            <Text style={{ fontSize: 12, color: tc.status.danger, fontWeight: '600' }}>
              Warning: This action cannot be undone. Your friends will need to re-establish encrypted sessions.
            </Text>
          </Box>
        </Box>
      </Dialog>

      {/* Key rotation success/error feedback */}
      {rotateKeyResult && (
        <Dialog
          open={!!rotateKeyResult}
          onClose={() => setRotateKeyResult(null)}
          title="Key Rotation Complete"
          icon={<KeyIcon size={24} color={tc.status.success} />}
          size="sm"
          testID={TEST_IDS.SETTINGS.ROTATE_KEY_SUCCESS}
          footer={
            <Button variant="primary" onPress={() => setRotateKeyResult(null)}>
              Done
            </Button>
          }
        >
          <Box style={{ gap: 8 }}>
            <Text style={{ fontSize: 13, color: tc.text.secondary, lineHeight: 18 }}>
              Your encryption key has been rotated successfully. {rotateKeyResult.friendCount} friend{rotateKeyResult.friendCount !== 1 ? 's were' : ' was'} notified.
            </Text>
          </Box>
        </Dialog>
      )}

      {rotateKeyError && (
        <Dialog
          open={!!rotateKeyError}
          onClose={() => setRotateKeyError(null)}
          title="Key Rotation Failed"
          icon={<AlertTriangleIcon size={24} color={tc.status.danger} />}
          size="sm"
          footer={
            <Button variant="primary" onPress={() => setRotateKeyError(null)}>
              OK
            </Button>
          }
        >
          <Text style={{ fontSize: 13, color: tc.text.secondary }}>
            {rotateKeyError}
          </Text>
        </Dialog>
      )}

      {/* Logout confirmation dialog */}
      <Dialog
        open={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        title="Log Out?"
        icon={<LogOutIcon size={24} color={tc.status.danger} />}
        size="sm"
        testID={TEST_IDS.COMMON.CONFIRM_DIALOG}
        footer={
          <HStack gap="sm" style={{ justifyContent: 'flex-end' }}>
            <Button variant="tertiary" onPress={() => setShowLogoutConfirm(false)} testID={TEST_IDS.COMMON.CONFIRM_NO}>
              Cancel
            </Button>
            <Button
              variant="secondary"
              onPress={handleLogout}
              style={{ borderColor: tc.status.dangerBorder, backgroundColor: tc.status.dangerSurface }}
              testID={TEST_IDS.COMMON.CONFIRM_YES}
            >
              <Text style={{ color: tc.status.danger, fontWeight: '600', fontSize: 14 }}>
                Log Out
              </Text>
            </Button>
          </HStack>
        }
      >
        <Box style={{ alignItems: 'center', gap: 12 }}>
          <Image source={umbraDeadImage} style={{ width: 160, height: 160 }} resizeMode="contain" />
          <Text style={{ fontSize: 13, color: tc.text.secondary, textAlign: 'center', lineHeight: 18 }}>
            You'll be signed out of this account. Your account data is saved and you can sign back in from the login screen.
          </Text>
        </Box>
      </Dialog>
      </Box>
    </Box>
  );
}

function AppearanceSection() {
  const { mode, theme } = useTheme();
  const { activeTheme, themes, installedThemeIds, setTheme, accentColor, setAccentColor, showModeToggle, textSize, setTextSize, motionPreferences, setMotionPreferences, switchMode } = useAppTheme();
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
    <Box style={{ gap: 20 }}>
      <SectionHeader title="Appearance" description="Customize the look and feel of the application." />

      <Box nativeID="sub-theme">
        <SettingRow label="Theme" description="Choose a color theme for the entire app." vertical>
          <InlineDropdown
            options={themeOptions}
            value={activeTheme?.id ?? 'default'}
            onChange={(id) => setTheme(id === 'default' ? null : id)}
            placeholder="Select theme"
            testID={TEST_IDS.SETTINGS.THEME_SELECTOR}
          />
          {activeTheme && (
            <Box style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
              {activeTheme.swatches.map((color, i) => (
                <Box
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
            </Box>
          )}
        </SettingRow>
      </Box>

      <Box nativeID="sub-dark-mode">
        {showModeToggle && (
        <SettingRow label="Dark Mode" description="Switch between light and dark themes.">
          <SoundToggle
            checked={mode === 'dark'}
            onChange={switchMode}
            testID={TEST_IDS.SETTINGS.DARK_MODE_TOGGLE}
            accessibilityActions={[{ name: 'activate', label: 'Toggle dark mode' }]}
            onAccessibilityAction={(e: { nativeEvent: { actionName: string } }) => {
              if (e.nativeEvent.actionName === 'activate') switchMode();
            }}
          />
        </SettingRow>
        )}
      </Box>

      <Box nativeID="sub-colors" testID={TEST_IDS.SETTINGS.ACCENT_COLOR} accessibilityValue={{ text: accentColor ?? '' }}>
        <SettingRow label="Accent Color" description="Choose a primary color for buttons, links, and highlights." vertical>
          <ColorPicker
            value={accentColor ?? theme.colors.accent.primary}
            onChange={handleAccentChange}
            presets={ACCENT_PRESETS}
            size="md"
            showInput
          />
          {accentColor && (
            <Button size="sm" variant="tertiary" onPress={() => setAccentColor(null)} style={{ alignSelf: 'flex-start', marginTop: 8 }}>
              Reset to theme default
            </Button>
          )}
        </SettingRow>
      </Box>

      <Box nativeID="sub-text-size">
        <TextSizeSettingRow value={textSize} onChange={setTextSize} />
      </Box>

      <Box nativeID="sub-font">
        <FontSettingRow />
      </Box>

      <Box nativeID="sub-motion">
        <SettingRow label="Animations" description="Enable or disable all UI animations.">
          <SoundToggle
            checked={motionPreferences.enableAnimations}
            onChange={() => setMotionPreferences({ enableAnimations: !motionPreferences.enableAnimations })}
          />
        </SettingRow>
        <SettingRow label="Shimmer Effects" description="Toggle shimmer sweeps and gradient shifts.">
          <SoundToggle
            checked={motionPreferences.enableShimmer}
            onChange={() => setMotionPreferences({ enableShimmer: !motionPreferences.enableShimmer })}
          />
        </SettingRow>
        <SettingRow label="Reduce Motion" description="Minimize motion for accessibility. Overrides all animation settings.">
          <SoundToggle
            checked={motionPreferences.reduceMotion}
            onChange={() => setMotionPreferences({ reduceMotion: !motionPreferences.reduceMotion })}
          />
        </SettingRow>
      </Box>
    </Box>
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
        testID={TEST_IDS.SETTINGS.FONT_SIZE}
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
        <Box style={{ marginTop: 8, padding: 12, borderRadius: 8, backgroundColor: 'rgba(99,102,241,0.06)', borderWidth: 1, borderColor: 'rgba(99,102,241,0.12)' }}>
          <Text style={{
            fontSize: 16, fontWeight: '600', color: tc.text.primary,
            fontFamily: activeFont.css.split(',')[0].replace(/"/g, ''),
          }} numberOfLines={1}>
            The quick brown fox jumps over the lazy dog
          </Text>
          <Text style={{
            fontSize: 12, color: tc.text.muted, marginTop: 4,
            fontFamily: activeFont.css.split(',')[0].replace(/"/g, ''),
          }}>
            ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789
          </Text>
        </Box>
      )}
    </SettingRow>
  );
}

function NotificationsSection() {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [messagePreview, setMessagePreview] = useState(true);

  return (
    <Box style={{ gap: 20 }}>
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
    </Box>
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
    <Box style={{ gap: 20 }}>
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
                <Text style={{ fontSize: 12, color: tc.text.muted, marginTop: 4 }}>
                  {meta.description}
                </Text>
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

          <Box style={{ gap: 16 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: tc.text.primary }}>
              Sound Categories
            </Text>

            {SOUND_CATEGORIES.map((cat) => {
              const enabled = categoryEnabled[cat] ?? true;
              const pct = Math.round((categoryVolumes[cat] ?? 1) * 100);
              return (
                <Box key={cat} style={{ gap: 8, opacity: enabled ? 1 : 0.5 }}>
                  <Box style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box style={{ flex: 1, marginRight: 12 }}>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: tc.text.primary }}>
                        {CATEGORY_LABELS[cat]}
                      </Text>
                      <Text style={{ fontSize: 12, color: tc.text.muted, marginTop: 2 }}>
                        {CATEGORY_DESCRIPTIONS[cat]}
                      </Text>
                    </Box>
                    <Box style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
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
                    </Box>
                  </Box>
                  {enabled && (
                    <Box style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Slider
                        value={pct}
                        min={0}
                        max={100}
                        step={5}
                        onChange={(v) => setCategoryVolume(cat, v / 100)}
                      />
                      <Text style={{ fontSize: 12, color: tc.text.muted, minWidth: 32, textAlign: 'right' }}>
                        {pct}%
                      </Text>
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>
        </>
      )}
    </Box>
  );
}

const KV_NS = '__umbra_system__';
const KV_READ_RECEIPTS = 'privacy_read_receipts';

function PrivacySection() {
  const { theme } = useTheme();
  const tc = theme.colors;
  const { identity, hasPin, setPin, verifyPin } = useAuth();
  const { preferencesReady } = useUmbra();
  const [readReceipts, setReadReceipts] = useState(true);
  const [typingIndicators, setTypingIndicators] = useState(true);
  const [showOnline, setShowOnline] = useState(true);

  // ── Persist read receipts preference via KV store ─────────────────
  useEffect(() => {
    if (!preferencesReady) return;
    (async () => {
      try {
        const wasm = getWasm();
        if (!wasm) return;
        const result = await (wasm as any).umbra_wasm_plugin_kv_get(KV_NS, KV_READ_RECEIPTS);
        const parsed = typeof result === 'string' ? JSON.parse(result) : result;
        if (parsed?.value === 'false') setReadReceipts(false);
      } catch { /* first run — default true */ }
    })();
  }, [preferencesReady]);

  const handleReadReceiptsToggle = useCallback(() => {
    setReadReceipts((prev) => {
      const next = !prev;
      try {
        const wasm = getWasm();
        if (wasm) (wasm as any).umbra_wasm_plugin_kv_set(KV_NS, KV_READ_RECEIPTS, String(next));
      } catch { /* best effort */ }
      return next;
    });
  }, []);

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
    <Box style={{ gap: 20 }}>
      <SectionHeader
        title="Privacy"
        description="Manage your visibility and control what others can see."
      />

      <Box nativeID="sub-discovery">
        <FriendDiscoveryPanel did={identity?.did ?? null} />
      </Box>

      <Box nativeID="sub-visibility">
          <Box style={{ gap: 20 }}>
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
              <SoundToggle checked={readReceipts} onChange={handleReadReceiptsToggle} />
            </SettingRow>

            <SettingRow label="Typing Indicators" description="Show when you are typing a message to others.">
              <SoundToggle checked={typingIndicators} onChange={() => setTypingIndicators((p) => !p)} />
            </SettingRow>
          </Box>

          <SettingRow label="Online Status" description="Show your online status to other users.">
            <SoundToggle checked={showOnline} onChange={() => setShowOnline((p) => !p)} />
          </SettingRow>
      </Box>

      <Box nativeID="sub-security">
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
        <Box style={{ alignItems: 'center', paddingVertical: 8 }}>
          {pinError && (
            <Text style={{ color: tc.status.danger, fontSize: 13, marginBottom: 12, textAlign: 'center' }}>
              {pinError}
            </Text>
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
        </Box>
      </Dialog>
      </Box>
    </Box>
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
      if (__DEV__) dbg.warn('state', 'Mic test failed', err, SRC);
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
    <Box style={{ gap: 20 }}>
      <SectionHeader title="Audio & Video" description="Configure your camera, microphone, and call quality settings." />

      <Box nativeID="sub-calling">
      {/* Calling */}
      <Box style={{ gap: 16 }}>
        <Box>
          <Text style={{ fontSize: 15, fontWeight: '600', color: tc.text.primary }}>
            Calling
          </Text>
          <Text style={{ fontSize: 12, color: tc.text.secondary, marginTop: 2 }}>
            Configure incoming call behavior and ring volume.
          </Text>
        </Box>

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
      </Box>
      </Box>

      <Box nativeID="sub-video">
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
      <Box style={{ gap: 16 }}>
        <Box>
          <Text style={{ fontSize: 15, fontWeight: '600', color: tc.text.primary }}>
            Test Video
          </Text>
          <Text style={{ fontSize: 12, color: tc.text.secondary, marginTop: 2 }}>
            Preview your camera with the current video effect applied.
          </Text>
        </Box>

        {Platform.OS === 'web' ? (
          /* Web: canvas-based preview */
          effectsPreviewStream ? (
            <Box style={{ gap: 12 }}>
              <Box style={{
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
                  <Box style={{
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
                    <Box style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: tc.status.success,
                    }} />
                    <Text style={{ fontSize: 10, color: '#fff', fontWeight: '500' }}>
                      {videoEffect === 'blur' ? 'Blur active' : 'Background active'}
                    </Text>
                  </Box>
                )}

                {videoEffect === 'none' && (
                  <Box style={{
                    position: 'absolute',
                    top: 8,
                    left: 8,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    paddingVertical: 3,
                    paddingHorizontal: 8,
                    borderRadius: 6,
                  }}>
                    <Text style={{ fontSize: 10, color: '#fff', opacity: 0.8 }}>
                      No effect
                    </Text>
                  </Box>
                )}
              </Box>

              <Button variant="secondary" size="sm" onPress={stopEffectsPreview}>
                Stop Preview
              </Button>
            </Box>
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
          <Box style={{ gap: 12 }}>
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
              <Box style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingVertical: 4,
                paddingHorizontal: 8,
              }}>
                <Box style={{
                  width: 6, height: 6, borderRadius: 3,
                  backgroundColor: tc.status.success,
                }} />
                <Text style={{ fontSize: 11, color: tc.text.muted }}>
                  {videoEffect === 'blur' ? 'Background blur active' : 'Virtual background active'}
                </Text>
              </Box>
            )}
          </Box>
        )}
      </Box>

      <Separator spacing="sm" />

      {/* Video Effects — available on all platforms */}
      <Box style={{ gap: 16 }}>
        <Box>
          <Text style={{ fontSize: 15, fontWeight: '600', color: tc.text.primary }}>
            Video Effects
          </Text>
          <Text style={{ fontSize: 12, color: tc.text.secondary, marginTop: 2 }}>
            Apply background effects to your camera during calls.
          </Text>
        </Box>

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
          <Box style={{ gap: 10 }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: tc.text.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Background Image
            </Text>

            {/* Preset grid */}
            <Box style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
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
                    <Box style={{ width: '100%', height: '100%', position: 'relative' }}>
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
                      <Box style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        paddingVertical: 1,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        alignItems: 'center',
                      }}>
                        <Text style={{ fontSize: 8, color: '#fff', fontWeight: '500' }}>
                          {preset.name}
                        </Text>
                      </Box>
                    </Box>
                    {isSelected && (
                      <Box style={{
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
                        <CheckIcon size={9} color={tc.text.onAccent} />
                      </Box>
                    )}
                  </Pressable>
                );
              })}
            </Box>

            {/* Custom URL input */}
            <Box style={{ gap: 4 }}>
              <Text style={{ fontSize: 11, color: tc.text.muted }}>
                Or use a custom image URL:
              </Text>
              <Input
                placeholder="https://example.com/background.jpg"
                value={customBackgroundUrl || ''}
                onChangeText={(url) => {
                  setCustomBackgroundUrl(url || null);
                  if (url) setBackgroundPresetId(null);
                }}
                size="sm"
                gradientBorder
              />
            </Box>
          </Box>
        )}
      </Box>
      </Box>

      <Box nativeID="sub-audio">
      {/* Audio Quality Preset */}
      <SettingRow label="Audio Quality" description="Choose an audio codec and quality preset." vertical>
        <InlineDropdown
          options={audioQualityOptions}
          value={audioQuality}
          onChange={(v) => handleAudioQualityChange(v as AudioQuality)}
          placeholder="Select quality"
        />
        {audioQuality === 'pcm' && (
          <Box style={{
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
            <Text style={{ fontSize: 12, color: tc.status.warning, flex: 1 }}>
              Lossless audio uses ~1.4 Mbps. Ensure you have a stable connection.
            </Text>
          </Box>
        )}
      </SettingRow>

      {/* Opus Configuration (only when not PCM) */}
      {audioQuality !== 'pcm' && (
        <>
          <Separator spacing="sm" />
          <Box style={{ gap: 16 }}>
            <Box>
              <Text style={{ fontSize: 15, fontWeight: '600', color: tc.text.primary }}>
                Opus Configuration
              </Text>
              <Text style={{ fontSize: 12, color: tc.text.secondary, marginTop: 2 }}>
                Fine-tune the Opus audio encoder for your needs.
              </Text>
            </Box>

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
              <Box style={{ gap: 8 }}>
                <Slider
                  value={opusConfig.bitrate}
                  min={16}
                  max={128}
                  step={8}
                  onChange={(val) => handleOpusConfigChange({ bitrate: val as AudioBitrate })}
                />
                <Box style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
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
                        <Text style={{
                          fontSize: 10,
                          fontWeight: '600',
                          color: isActive ? tc.text.onAccent : tc.text.secondary,
                        }}>
                          {preset.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </Box>
              </Box>
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
          </Box>
        </>
      )}

      <Separator spacing="sm" />

      {/* Volume Controls */}
      <Box style={{ gap: 16 }}>
        <Box>
          <Text style={{ fontSize: 15, fontWeight: '600', color: tc.text.primary }}>
            Volume Controls
          </Text>
          <Text style={{ fontSize: 12, color: tc.text.secondary, marginTop: 2 }}>
            Adjust input and output volume levels.
          </Text>
        </Box>

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
        <Box style={{ gap: 8 }}>
          <Box style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Text style={{ fontSize: 13, fontWeight: '600', color: tc.text.primary }}>
                Voice Meter
              </Text>
              <Text style={{ fontSize: 11, color: tc.text.secondary }}>
                Test your microphone levels and check for clipping.
              </Text>
            </Box>
            <Button
              variant="secondary"
              size="sm"
              onPress={micTestActive ? stopMicTest : startMicTest}
            >
              {micTestActive ? 'Stop' : 'Test Mic'}
            </Button>
          </Box>
          {micTestActive && (
            <Box style={{ gap: 6 }}>
              {/* Level bar */}
              <Box style={{ height: 12, borderRadius: 6, backgroundColor: tc.background.sunken, overflow: 'hidden', position: 'relative' }}>
                {/* Clipping threshold marker at 85% */}
                <Box style={{
                  position: 'absolute',
                  left: '85%',
                  top: 0,
                  bottom: 0,
                  width: 2,
                  backgroundColor: tc.status.danger,
                  opacity: 0.5,
                  zIndex: 1,
                }} />
                <Box style={{
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
              </Box>
              {/* Labels */}
              <Box style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 10, color: tc.text.muted }}>
                  {micTestLevel > 85 ? '⚠ Clipping — lower your mic volume' : micTestLevel > 50 ? 'Good level' : micTestLevel > 10 ? 'Low — speak louder or raise mic volume' : 'Waiting for input...'}
                </Text>
                <Text style={{ fontSize: 10, fontWeight: '600', fontVariant: ['tabular-nums'], color: micTestLevel > 85 ? tc.status.danger : tc.text.muted }}>
                  {micTestLevel}%
                </Text>
              </Box>
            </Box>
          )}
        </Box>
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
      </Box>
      </Box>

      <Box nativeID="sub-devices">
      {/* Devices section */}
      <Box style={{ gap: 16 }}>
        <Box>
          <Text style={{ fontSize: 15, fontWeight: '600', color: tc.text.primary }}>
            Devices
          </Text>
          <Text style={{ fontSize: 12, color: tc.text.secondary, marginTop: 2 }}>
            {Platform.OS === 'web'
              ? 'Your available audio and video input/output devices.'
              : 'Camera and microphone are managed by your device.'}
          </Text>
        </Box>

        {Platform.OS === 'web' ? (
          <>
            {/* Microphones */}
            <Box style={{ gap: 6 }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: tc.text.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Microphones
              </Text>
              {audioInputs.length === 0 ? (
                <Text style={{ fontSize: 13, color: tc.text.secondary }}>No microphones detected</Text>
              ) : (
                audioInputs.map((device) => (
                  <Box key={device.deviceId} style={{
                    flexDirection: 'row', alignItems: 'center', gap: 8,
                    paddingVertical: 6, paddingHorizontal: 10,
                    borderRadius: 6, backgroundColor: tc.background.sunken,
                  }}>
                    <Box style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: tc.status.success }} />
                    <Text style={{ fontSize: 13, color: tc.text.primary, flex: 1 }} numberOfLines={1}>
                      {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
                    </Text>
                  </Box>
                ))
              )}
            </Box>

            {/* Cameras */}
            <Box style={{ gap: 6 }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: tc.text.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Cameras
              </Text>
              {videoInputs.length === 0 ? (
                <Text style={{ fontSize: 13, color: tc.text.secondary }}>No cameras detected</Text>
              ) : (
                videoInputs.map((device) => (
                  <Box key={device.deviceId} style={{
                    flexDirection: 'row', alignItems: 'center', gap: 8,
                    paddingVertical: 6, paddingHorizontal: 10,
                    borderRadius: 6, backgroundColor: tc.background.sunken,
                  }}>
                    <Box style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: tc.status.success }} />
                    <Text style={{ fontSize: 13, color: tc.text.primary, flex: 1 }} numberOfLines={1}>
                      {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
                    </Text>
                  </Box>
                ))
              )}
            </Box>

            {/* Speakers */}
            <Box style={{ gap: 6 }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: tc.text.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Speakers
              </Text>
              {audioOutputs.length === 0 ? (
                <Text style={{ fontSize: 13, color: tc.text.secondary }}>No speakers detected</Text>
              ) : (
                audioOutputs.map((device) => (
                  <Box key={device.deviceId} style={{
                    flexDirection: 'row', alignItems: 'center', gap: 8,
                    paddingVertical: 6, paddingHorizontal: 10,
                    borderRadius: 6, backgroundColor: tc.background.sunken,
                  }}>
                    <Box style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: tc.status.success }} />
                    <Text style={{ fontSize: 13, color: tc.text.primary, flex: 1 }} numberOfLines={1}>
                      {device.label || `Speaker ${device.deviceId.slice(0, 8)}`}
                    </Text>
                  </Box>
                ))
              )}
            </Box>

            {!isSupported && (
              <Box style={{
                padding: 12, borderRadius: 8,
                backgroundColor: tc.status.warningSurface,
                borderWidth: 1, borderColor: tc.status.warningBorder,
              }}>
                <Text style={{ fontSize: 12, color: tc.status.warning }}>
                  Media devices are not available in this browser or environment.
                </Text>
              </Box>
            )}

            {/* Device Test — inline within Devices section */}
            <Separator spacing="sm" />
            <Box>
              <Text style={{ fontSize: 11, fontWeight: '600', color: tc.text.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Test Devices
              </Text>
            </Box>

            {cameraPreviewStream ? (
              <Box style={{ gap: 12 }}>
                {/* Camera preview */}
                <Box style={{
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
                </Box>

                {/* Mic level meter */}
                <Box style={{ gap: 4 }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: tc.text.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Microphone Level
                  </Text>
                  <Box style={{ height: 8, borderRadius: 4, backgroundColor: tc.background.sunken, overflow: 'hidden' }}>
                    <Box style={{
                      width: `${micLevel}%`,
                      height: '100%',
                      borderRadius: 4,
                      backgroundColor: micLevel > 70 ? tc.status.danger : micLevel > 30 ? tc.status.success : tc.accent.primary,
                    }} />
                  </Box>
                </Box>

                <Button variant="secondary" size="sm" onPress={stopTestPreview}>
                  Stop Test
                </Button>
              </Box>
            ) : (
              <Button variant="secondary" size="sm" onPress={startTestPreview}>
                Test Camera & Microphone
              </Button>
            )}
          </>
        ) : (
          <>
            {/* Mobile device display — simplified */}
            <Box style={{ gap: 6 }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: tc.text.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Camera
              </Text>
              <Box style={{
                flexDirection: 'row', alignItems: 'center', gap: 8,
                paddingVertical: 8, paddingHorizontal: 12,
                borderRadius: 8, backgroundColor: tc.background.sunken,
              }}>
                <Box style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: tc.status.success }} />
                <Text style={{ fontSize: 13, color: tc.text.primary, flex: 1 }}>
                  Front Camera
                </Text>
                <Text style={{ fontSize: 11, color: tc.text.muted }}>
                  Default
                </Text>
              </Box>
              <Box style={{
                flexDirection: 'row', alignItems: 'center', gap: 8,
                paddingVertical: 8, paddingHorizontal: 12,
                borderRadius: 8, backgroundColor: tc.background.sunken,
              }}>
                <Box style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: tc.status.success }} />
                <Text style={{ fontSize: 13, color: tc.text.primary, flex: 1 }}>
                  Back Camera
                </Text>
              </Box>
              <Text style={{ fontSize: 11, color: tc.text.muted, marginTop: 2 }}>
                Switch cameras during a call using the camera flip button.
              </Text>
            </Box>

            <Box style={{ gap: 6 }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: tc.text.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Microphone
              </Text>
              <Box style={{
                flexDirection: 'row', alignItems: 'center', gap: 8,
                paddingVertical: 8, paddingHorizontal: 12,
                borderRadius: 8, backgroundColor: tc.background.sunken,
              }}>
                <Box style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: tc.status.success }} />
                <Text style={{ fontSize: 13, color: tc.text.primary, flex: 1 }}>
                  Default Microphone
                </Text>
              </Box>
            </Box>

            <Box style={{
              padding: 12, borderRadius: 8,
              backgroundColor: tc.status.infoSurface,
              borderWidth: 1, borderColor: tc.status.infoBorder,
            }}>
              <Text style={{ fontSize: 12, color: tc.status.info }}>
                Device permissions are managed by your device settings. Camera and microphone
                access will be requested when you start a call.
              </Text>
            </Box>
          </>
        )}
      </Box>
      </Box>

      {/* Audio Processing */}
      <Box style={{ gap: 16 }}>
        <Box>
          <Text style={{ fontSize: 15, fontWeight: '600', color: tc.text.primary }}>
            Audio Processing
          </Text>
          <Text style={{ fontSize: 12, color: tc.text.secondary, marginTop: 2 }}>
            Enhance audio quality during calls.
          </Text>
        </Box>

        <SettingRow label="Noise Suppression" description="Reduce background noise from your microphone.">
          <SoundToggle checked={noiseSuppression} onChange={setNoiseSuppression} />
        </SettingRow>
        <SettingRow label="Echo Cancellation" description="Prevent audio feedback loops.">
          <SoundToggle checked={echoCancellation} onChange={setEchoCancellation} />
        </SettingRow>
        <SettingRow label="Auto Gain Control" description="Automatically adjust microphone volume.">
          <SoundToggle checked={autoGainControl} onChange={setAutoGainControl} />
        </SettingRow>
      </Box>

      <Separator spacing="sm" />

      {/* Encryption (web only — Insertable Streams / RTCRtpScriptTransform) */}
      {Platform.OS === 'web' && (
      <Box style={{ gap: 16 }}>
        <Box>
          <Text style={{ fontSize: 15, fontWeight: '600', color: tc.text.primary }}>
            Encryption
          </Text>
          <Text style={{ fontSize: 12, color: tc.text.secondary, marginTop: 2 }}>
            Call signaling is always end-to-end encrypted. Optionally encrypt media frames too.
          </Text>
        </Box>

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
          <Box style={{
            padding: 12, borderRadius: 8,
            backgroundColor: tc.status.infoSurface,
            borderWidth: 1, borderColor: tc.status.infoBorder,
          }}>
            <Text style={{ fontSize: 12, color: tc.status.info }}>
              Media E2EE is enabled. Both peers must have this setting enabled for encrypted media.
              Call signaling (SDP, ICE) is always encrypted regardless of this setting.
            </Text>
          </Box>
        )}
      </Box>
      )}

    </Box>
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

  const handleCopyPeerId = useCallback(async () => {
    const id = connectionInfo?.peerId || '';
    if (!id) return;
    try {
      if (Platform.OS === 'web') {
        await navigator.clipboard.writeText(id);
      } else {
        await ExpoClipboard.setStringAsync(id);
      }
      setPeerIdCopied(true);
      setTimeout(() => setPeerIdCopied(false), 2000);
    } catch { /* ignore */ }
  }, [connectionInfo]);

  const handleCopyOffer = useCallback(async () => {
    if (!offerData) return;
    try {
      if (Platform.OS === 'web') {
        await navigator.clipboard.writeText(offerData);
      } else {
        await ExpoClipboard.setStringAsync(offerData);
      }
      setOfferCopied(true);
      setTimeout(() => setOfferCopied(false), 2000);
    } catch { /* ignore */ }
  }, [offerData]);

  const handleCopyAnswer = useCallback(async () => {
    if (!answerData) return;
    try {
      if (Platform.OS === 'web') {
        await navigator.clipboard.writeText(answerData);
      } else {
        await ExpoClipboard.setStringAsync(answerData);
      }
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
    <Box style={{ gap: 20 }}>
      <SectionHeader title="Network" description="Manage your peer-to-peer network connection." />

      <Box nativeID="sub-connection">
      {/* Connection Status */}
      <Card variant="outlined" padding="lg" style={{ width: '100%' }}>
        <Box style={{ gap: 12 }}>
          <Box style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Box style={{
              width: 10, height: 10, borderRadius: 5,
              backgroundColor: isConnected ? tc.status.success : tc.status.danger,
            }} />
            <Text style={{ fontSize: 16, fontWeight: '600', color: tc.text.primary }}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Text>
          </Box>
          <Box style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 13, color: tc.text.secondary }}>
              Peers: {peerCount}
            </Text>
            <Text style={{ fontSize: 13, color: tc.text.secondary }}>
              Addresses: {listenAddresses?.length ?? 0}
            </Text>
          </Box>
        </Box>
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
      </Box>

      <Box nativeID="sub-relays">
      {/* Relay Servers */}
      <Box style={{ gap: 12 }} testID={TEST_IDS.SETTINGS.RELAY_STATUS}>
        <Box>
          <Text style={{ fontSize: 15, fontWeight: '600', color: tc.text.primary }}>
            Relay Servers
          </Text>
          <Text style={{ fontSize: 12, color: tc.text.secondary, marginTop: 2 }}>
            Relay servers store messages while you or your friends are offline.
          </Text>
        </Box>

        {relays.map((relay) => {
          const displayUrl = relay.url.replace('wss://', '').replace('ws://', '').replace(/\/ws\/?$/, '');
          const info = relayInfoMap[relay.url];
          const pingColor = !info?.ping ? tc.text.muted : info.ping < 100 ? tc.status.success : info.ping < 300 ? tc.status.warning : tc.status.danger;
          const locationLabel = info?.location && info?.region
            ? `${info.location}, ${info.region}`
            : info?.region || info?.location || null;

          return (
            <Box
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
              <Box style={{
                width: 8, height: 8, borderRadius: 4,
                backgroundColor: relay.enabled ? tc.status.success : tc.text.muted,
              }} />
              <Box style={{ flex: 1, gap: 3 }}>
                <Box style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  {relay.isDefault && (
                    <Box style={{
                      paddingHorizontal: 5,
                      paddingVertical: 1,
                      borderRadius: 4,
                      backgroundColor: `${tc.text.muted}20`,
                    }}>
                      <Text style={{ fontSize: 9, color: tc.text.muted, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '700' }}>
                        Default
                      </Text>
                    </Box>
                  )}
                  <Text style={{ fontSize: 13, color: tc.text.primary, fontFamily: 'monospace', flex: 1 }} numberOfLines={1}>
                    {displayUrl}
                  </Text>
                </Box>
                <Box style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  {locationLabel && (
                    <Box style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                      <MapPinIcon size={10} color={tc.text.secondary} />
                      <Text style={{ fontSize: 11, color: tc.text.secondary }}>
                        {locationLabel}
                      </Text>
                    </Box>
                  )}
                  {info?.ping != null && (
                    <Box style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                      <ActivityIcon size={10} color={pingColor} />
                      <Text style={{ fontSize: 11, color: pingColor, fontFamily: 'monospace' }}>
                        {info.ping}ms
                      </Text>
                    </Box>
                  )}
                  {info?.online != null && (
                    <Box style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                      <UsersIcon size={10} color={tc.text.muted} />
                      <Text style={{ fontSize: 11, color: tc.text.muted }}>
                        {info.online} online
                      </Text>
                    </Box>
                  )}
                  {info?.federationEnabled && info?.connectedPeers != null && info.connectedPeers > 0 && (
                    <Box style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                      <ZapIcon size={10} color={tc.accent.primary} />
                      <Text style={{ fontSize: 11, color: tc.accent.primary }}>
                        {info.connectedPeers} {info.connectedPeers === 1 ? 'peer' : 'peers'}
                      </Text>
                    </Box>
                  )}
                  {info?.federationEnabled && info?.meshOnline != null && info.meshOnline > (info?.online ?? 0) && (
                    <Box style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                      <NetworkIcon size={10} color={tc.text.muted} />
                      <Text style={{ fontSize: 11, color: tc.text.muted }}>
                        {info.meshOnline} mesh
                      </Text>
                    </Box>
                  )}
                </Box>
              </Box>
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
            </Box>
          );
        })}

        {/* Add relay input */}
        <Box style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Box style={{ flex: 1 }}>
            <Input
              value={newRelayUrl}
              onChangeText={(text: string) => {
                setNewRelayUrl(text);
                if (relayError) setRelayError(null);
              }}
              placeholder="wss://relay.example.com/ws"
              size="sm"
              fullWidth
              gradientBorder
            />
          </Box>
          <Button
            size="sm"
            variant="secondary"
            onPress={handleAddRelay}
            disabled={!newRelayUrl.trim()}
            iconLeft={<PlusIcon size={14} />}
          >
            Add
          </Button>
        </Box>
        {relayError && (
          <Text style={{ fontSize: 12, color: tc.status.danger, marginTop: -4 }}>
            {relayError}
          </Text>
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
          <Box style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            backgroundColor: tc.brand.surface,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <ServerIcon size={18} color={tc.accent.primary} />
          </Box>
          <Box style={{ flex: 1, gap: 2 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: tc.text.primary }}>
              Run Your Own Relay
            </Text>
            <Text style={{ fontSize: 12, color: tc.text.secondary }}>
              Download the relay binary and host your own server
            </Text>
          </Box>
          <ExternalLinkIcon size={16} color={tc.text.muted} />
        </Pressable>
      </Box>
      </Box>

      <Box nativeID="sub-peers">
      {/* Peer ID */}
      {connectionInfo?.peerId && (
        <Box style={{ gap: 8 }}>
          <Box style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: tc.text.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Peer ID
            </Text>
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
          </Box>
          <Box style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 12, color: tc.text.secondary, fontFamily: 'monospace', flex: 1 }} numberOfLines={1}>
              {connectionInfo.peerId}
            </Text>
            <Pressable
              onPress={handleCopyPeerId}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 4,
                paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6,
                backgroundColor: peerIdCopied ? '#22c55e20' : tc.background.sunken,
              }}
            >
              <CopyIcon size={14} color={peerIdCopied ? '#22c55e' : tc.text.secondary} />
              <Text style={{ fontSize: 11, color: peerIdCopied ? '#22c55e' : tc.text.secondary, fontWeight: '500' }}>
                {peerIdCopied ? 'Copied' : 'Copy'}
              </Text>
            </Pressable>
          </Box>
        </Box>
      )}

      <Separator spacing="sm" />

      {/* ── WebRTC Connection Flow ─────────────────────────────────── */}
      <Box style={{ gap: 12 }}>
        <Box>
          <Box style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: tc.text.primary }}>
              Connect to Peer
            </Text>
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
          </Box>
          <Text style={{ fontSize: 12, color: tc.text.secondary, marginTop: 2 }}>
            Exchange connection data with another user to establish a direct P2P link.
          </Text>
        </Box>

        {/* Connection State Indicator */}
        <Box style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Box style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: connectionStateColor }} />
          <Text style={{ fontSize: 12, color: connectionStateColor }}>
            {connectionStateLabel}
          </Text>
        </Box>

        {/* Step 1: Create Offer button */}
        {connectionState === 'idle' && (
          <Box style={{ flexDirection: 'row', gap: 8 }}>
            <Button size="sm" onPress={createOffer} style={{ flex: 1 }}>
              Create Offer (I invite)
            </Button>
          </Box>
        )}

        {/* Show offer data for copying */}
        {offerData && connectionState === 'waiting_for_answer' && (
          <Card variant="outlined" padding="md" style={{ width: '100%' }}>
            <Box style={{ gap: 8 }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: tc.text.muted, textTransform: 'uppercase' }}>
                Your Offer (share with peer)
              </Text>
              <Text style={{ fontSize: 10, color: tc.text.secondary, fontFamily: 'monospace' }} numberOfLines={3}>
                {offerData.slice(0, 200)}...
              </Text>
              <Button size="sm" variant={offerCopied ? 'tertiary' : 'secondary'} onPress={handleCopyOffer}>
                {offerCopied ? 'Copied!' : 'Copy Offer'}
              </Button>
            </Box>
          </Card>
        )}

        {/* Show answer data for copying (answerer side) */}
        {answerData && connectionState !== 'connected' && (
          <Card variant="outlined" padding="md" style={{ width: '100%' }}>
            <Box style={{ gap: 8 }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: tc.text.muted, textTransform: 'uppercase' }}>
                Your Answer (share with peer)
              </Text>
              <Text style={{ fontSize: 10, color: tc.text.secondary, fontFamily: 'monospace' }} numberOfLines={3}>
                {answerData.slice(0, 200)}...
              </Text>
              <Button size="sm" variant={answerCopied ? 'tertiary' : 'secondary'} onPress={handleCopyAnswer}>
                {answerCopied ? 'Copied!' : 'Copy Answer'}
              </Button>
            </Box>
          </Card>
        )}

        {/* Paste input for offer/answer */}
        {(connectionState === 'idle' || connectionState === 'waiting_for_answer') && (
          <Box style={{ gap: 8 }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: tc.text.muted, textTransform: 'uppercase' }}>
              {connectionState === 'waiting_for_answer'
                ? 'Paste Answer from Peer'
                : 'Paste Offer from Peer'}
            </Text>
            <TextArea
              value={pasteInput}
              onChangeText={setPasteInput}
              placeholder="Paste the connection data here..."
              numberOfLines={3}
              fullWidth
              gradientBorder
            />
            <Button
              size="sm"
              onPress={handlePasteSubmit}
              disabled={!pasteInput.trim()}
            >
              {connectionState === 'waiting_for_answer' ? 'Complete Connection' : 'Accept Offer'}
            </Button>
          </Box>
        )}

        {/* Connected state */}
        {connectionState === 'connected' && (
          <Card variant="outlined" padding="md" style={{ width: '100%', backgroundColor: tc.status.successSurface }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: tc.status.success, textAlign: 'center' }}>
              Peer connected successfully!
            </Text>
          </Card>
        )}

        {/* Error state */}
        {connectionState === 'error' && networkError && (
          <Card variant="outlined" padding="md" style={{ width: '100%', backgroundColor: tc.status.dangerSurface }}>
            <Box style={{ gap: 8 }}>
              <Text style={{ fontSize: 12, color: tc.status.danger }}>
                {networkError.message}
              </Text>
              <Button size="sm" variant="secondary" onPress={resetSignaling}>
                Try Again
              </Button>
            </Box>
          </Card>
        )}

        {/* Reset button for non-idle states */}
        {connectionState !== 'idle' && connectionState !== 'error' && (
          <Button size="sm" variant="tertiary" onPress={resetSignaling}>
            Reset
          </Button>
        )}
      </Box>
      </Box>

      <Box nativeID="sub-identity">
      {/* Connection Info QR (existing) */}
      {identity && (
        <Box style={{ gap: 12 }}>
          <Box>
            <Text style={{ fontSize: 15, fontWeight: '600', color: tc.text.primary }}>
              Your DID
            </Text>
            <Text style={{ fontSize: 12, color: tc.text.secondary, marginTop: 2 }}>
              Share your DID for others to add you as a friend.
            </Text>
          </Box>
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
            <Text style={{ fontSize: 11, color: tc.text.muted, marginTop: 12, textAlign: 'center' }}>
              {identity.displayName} • {identity.did.slice(0, 20)}...
            </Text>
          </Card>
        </Box>
      )}
      </Box>
    </Box>
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
  const { storageUsage, isLoading: storageLoading, formatBytes: fmtBytes } = useStorageManager();
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
      if (__DEV__) dbg.error('state', 'Failed to clear messages', err, SRC);
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
      if (__DEV__) dbg.error('state', 'Failed to clear all data', err, SRC);
      setClearStatus('Failed to clear data.');
      setTimeout(() => setClearStatus(null), 3000);
    }
  }, [identity, service]);

  return (
    <Box style={{ gap: 24 }}>
      <SectionHeader
        title="Data Management"
        description="Manage your locally stored data. All data is stored on this device only."
      />

      <Box nativeID="sub-storage">
          {/* Info card */}
          <Card variant="outlined" padding="lg" style={{ width: '100%' }}>
            <Box style={{ gap: 8 }}>
              <Box style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <DatabaseIcon size={18} color={tc.accent.primary} />
                <Text style={{ fontSize: 14, fontWeight: '600', color: tc.text.primary }}>
                  Local Storage
                </Text>
              </Box>
              <Text style={{ fontSize: 12, color: tc.text.secondary, lineHeight: 18 }}>
                Your messages, friends, and conversations are stored locally using IndexedDB.
                Data is isolated per identity and persists across page refreshes.
              </Text>
              {identity && (
                <Text style={{ fontSize: 11, color: tc.text.muted, fontFamily: 'monospace', marginTop: 4 }}>
                  DID: {identity.did.slice(0, 24)}...
                </Text>
              )}

              {/* Storage usage bar */}
              {storageUsage && storageUsage.total > 0 && (
                <Box style={{ marginTop: 12, gap: 6 }}>
                  <Progress
                    value={storageUsage.total}
                    max={storageUsage.total * 2}
                    label="Storage Used"
                    showValue
                    formatValue={() => fmtBytes(storageUsage.total)}
                    size="md"
                    thickness="medium"
                    gradient
                    glowEdge
                  />
                  <Box style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 2 }}>
                    {storageUsage.byContext.community > 0 && (
                      <Text style={{ fontSize: 11, color: tc.text.muted }}>
                        Communities: {fmtBytes(storageUsage.byContext.community)}
                      </Text>
                    )}
                    {storageUsage.byContext.dm > 0 && (
                      <Text style={{ fontSize: 11, color: tc.text.muted }}>
                        DMs: {fmtBytes(storageUsage.byContext.dm)}
                      </Text>
                    )}
                    {storageUsage.byContext.sharedFolders > 0 && (
                      <Text style={{ fontSize: 11, color: tc.text.muted }}>
                        Shared Folders: {fmtBytes(storageUsage.byContext.sharedFolders)}
                      </Text>
                    )}
                    {storageUsage.byContext.cache > 0 && (
                      <Text style={{ fontSize: 11, color: tc.text.muted }}>
                        Cache: {fmtBytes(storageUsage.byContext.cache)}
                      </Text>
                    )}
                  </Box>
                </Box>
              )}
              {storageLoading && (
                <Text style={{ fontSize: 11, color: tc.text.muted, marginTop: 8 }}>
                  Loading storage info...
                </Text>
              )}
            </Box>
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
              <Text style={{
                fontSize: 13,
                color: clearStatus.includes('Failed') ? tc.status.danger : tc.status.success,
                fontWeight: '500',
                textAlign: 'center',
              }}>
                {clearStatus}
              </Text>
            </Card>
          )}
      </Box>

      <Box nativeID="sub-danger-zone">
      {/* Selective wipe */}
      <Box style={{ gap: 12 }}>
        <Box>
          <Text style={{ fontSize: 15, fontWeight: '600', color: tc.text.primary }}>
            Clear Messages
          </Text>
          <Text style={{ fontSize: 12, color: tc.text.secondary, marginTop: 2 }}>
            Delete all messages, reactions, pins, and threads. Your friends, groups, and conversations will be kept.
          </Text>
        </Box>

        <Button
          variant="secondary"
          onPress={() => setShowClearMessagesConfirm(true)}
          iconLeft={<TrashIcon size={16} color={tc.status.warning} />}
          style={{ borderColor: tc.status.warningBorder, backgroundColor: tc.status.warningSurface }}
        >
          <Text style={{ color: tc.status.warning, fontWeight: '600', fontSize: 14 }}>
            Clear Messages
          </Text>
        </Button>
      </Box>

      <Separator spacing="sm" />

      {/* Full wipe */}
      <Box style={{ gap: 12 }}>
        <Box>
          <Box style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: tc.status.danger }}>
              Clear All Data
            </Text>
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
          </Box>
          <Text style={{ fontSize: 12, color: tc.text.secondary, marginTop: 2 }}>
            Delete everything: messages, friends, groups, and conversations. Your identity is preserved.
          </Text>
        </Box>

        <Button
          variant="secondary"
          onPress={() => setShowClearAllConfirm(true)}
          iconLeft={<AlertTriangleIcon size={16} color={tc.status.danger} />}
          style={{ borderColor: tc.status.dangerBorder, backgroundColor: tc.status.dangerSurface }}
        >
          <Text style={{ color: tc.status.danger, fontWeight: '600', fontSize: 14 }}>
            Clear All Data
          </Text>
        </Button>
      </Box>

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
              <Text style={{ color: tc.status.warning, fontWeight: '600', fontSize: 14 }}>
                Clear Messages
              </Text>
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
              <Text style={{ color: tc.status.danger, fontWeight: '600', fontSize: 14 }}>
                Clear All Data
              </Text>
            </Button>
          </HStack>
        }
      />
      </Box>
    </Box>
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
      if (__DEV__) dbg.error('plugins', 'Failed to toggle plugin', err, SRC);
    }
  }, [registry, enablePlugin, disablePlugin]);

  const handleUninstall = useCallback(async (pluginId: string) => {
    try {
      await uninstallPlugin(pluginId);
    } catch (err) {
      if (__DEV__) dbg.error('plugins', 'Failed to uninstall plugin', err, SRC);
    }
  }, [uninstallPlugin]);

  return (
    <Box style={{ gap: 16 }}>
      <Box style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: tc.text.primary, marginBottom: 4 }}>
            Plugins
          </Text>
          <Text style={{ fontSize: 13, color: tc.text.secondary }}>
            Extend Umbra with plugins. {enabledCount} plugin{enabledCount !== 1 ? 's' : ''} active.
          </Text>
        </Box>
        {onOpenMarketplace && (
          <Button
            size="sm"
            variant="primary"
            onPress={onOpenMarketplace}
            iconLeft={<DownloadIcon size={14} color={tc.text.onAccent} />}
          >
            Marketplace
          </Button>
        )}
      </Box>

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
          <Text style={{ fontSize: 14, fontWeight: '600', color: tc.text.primary }}>
            No plugins installed
          </Text>
          <Text style={{ fontSize: 12, color: tc.text.secondary, textAlign: 'center' }}>
            Browse the marketplace to discover and install plugins that extend Umbra's functionality.
          </Text>
          {onOpenMarketplace && (
            <Text style={{ fontSize: 12, color: tc.accent.primary, fontWeight: '600', marginTop: 4 }}>
              Open Marketplace
            </Text>
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

    </Box>
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
    <Box
      style={{
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: tc.border.subtle,
        backgroundColor: tc.background.sunken,
        gap: 8,
      }}
    >
      <Box style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Box
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
        </Box>
        <Box style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: tc.text.primary }}>
            {plugin.manifest.name}
          </Text>
          <Text style={{ fontSize: 12, color: tc.text.secondary }} numberOfLines={1}>
            {plugin.manifest.description}
          </Text>
          <Text style={{ fontSize: 11, color: tc.text.muted, marginTop: 1 }}>
            v{plugin.manifest.version} · {plugin.manifest.author.name}
          </Text>
          {plugin.state === 'error' && plugin.error && (
            <Text style={{ fontSize: 11, color: tc.status.danger, marginTop: 2 }} numberOfLines={1}>
              Error: {plugin.error}
            </Text>
          )}
        </Box>
        <Toggle
          checked={plugin.state === 'enabled'}
          onChange={onToggle}
          size="sm"
        />
      </Box>

      {/* Permissions badges */}
      {plugin.manifest.permissions && plugin.manifest.permissions.length > 0 && (
        <Box style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, paddingLeft: 44 }}>
          {plugin.manifest.permissions.slice(0, 4).map((perm: string) => (
            <Tag key={perm} size="sm" style={{ borderRadius: 6 }}>
              {perm}
            </Tag>
          ))}
          {plugin.manifest.permissions.length > 4 && (
            <Text style={{ fontSize: 9, color: tc.text.muted, alignSelf: 'center' }}>
              +{plugin.manifest.permissions.length - 4} more
            </Text>
          )}
        </Box>
      )}

      {/* Uninstall */}
      {showConfirm ? (
        <Box style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 44 }}>
          <Text style={{ fontSize: 11, color: tc.status.danger, flex: 1 }}>
            Remove plugin and data?
          </Text>
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
        </Box>
      ) : (
        <Box style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingLeft: 44 }}>
          <Button
            size="xs"
            variant="tertiary"
            onPress={() => setShowConfirm(true)}
            iconLeft={<TrashIcon size={11} color={tc.text.muted} />}
          >
            Uninstall
          </Button>
        </Box>
      )}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// About Section
// ---------------------------------------------------------------------------
// Keyboard Shortcuts
// ---------------------------------------------------------------------------

function KeyboardShortcutsSection() {
  const { theme } = useTheme();
  const tc = theme.colors;
  const allShortcuts = ShortcutRegistry.getAllFlat();

  return (
    <Box style={{ gap: 16 }}>
      <Text size="lg" weight="bold" style={{ color: tc.text.primary }}>
        Keyboard Shortcuts
      </Text>
      <Text size="sm" style={{ color: tc.text.muted }}>
        Shortcuts registered by plugins and the app. Press the key combination to trigger the action.
      </Text>

      {allShortcuts.length === 0 ? (
        <Card style={{ padding: 24, alignItems: 'center' }}>
          <KeyIcon size={32} color={tc.text.muted} />
          <Text size="sm" style={{ color: tc.text.muted, marginTop: 8 }}>
            No keyboard shortcuts registered yet. Install plugins that register shortcuts to see them here.
          </Text>
        </Card>
      ) : (
        <Box style={{ gap: 8 }}>
          {allShortcuts.map(({ pluginId, shortcut }) => (
            <Box
              key={`${pluginId}:${shortcut.id}`}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 8,
                backgroundColor: tc.background.raised,
              }}
            >
              <Box style={{ flex: 1, gap: 2 }}>
                <Text size="sm" weight="semibold" style={{ color: tc.text.primary }}>
                  {shortcut.label}
                </Text>
                {shortcut.category && (
                  <Text size="xs" style={{ color: tc.text.muted }}>
                    {shortcut.category}
                  </Text>
                )}
              </Box>
              <Box
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 4,
                  backgroundColor: tc.background.sunken,
                  borderWidth: 1,
                  borderColor: tc.border.subtle,
                }}
              >
                <Text size="xs" family="mono" style={{ color: tc.text.secondary }}>
                  {shortcut.keys}
                </Text>
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Developer — Call diagnostics, media capture, and testing tools
// ---------------------------------------------------------------------------

function DeveloperSection() {
  const { theme } = useTheme();
  const tc = theme.colors;
  const { playSound } = useSound();
  const dev = useDeveloperSettings();

  const handleToggle = useCallback(
    (setter: (v: boolean) => void) => (v: boolean) => {
      playSound(v ? 'toggle_on' : 'toggle_off');
      setter(v);
    },
    [playSound],
  );

  return (
    <Box style={{ gap: 20 }}>
      <SectionHeader
        title="Developer"
        description="Diagnostic tools for debugging WebRTC calls, media quality, and performance."
      />

      {/* Warning banner */}
      <Card style={{ padding: 12, borderColor: tc.status.warning ?? '#ff9800', borderWidth: 1 }}>
        <Text style={{ fontSize: 12, color: tc.text.secondary, lineHeight: 18 }}>
          These settings are for debugging. Raw media capture uses significant disk space.
          Some options may affect call performance when enabled.
        </Text>
      </Card>

      {/* ── Call Diagnostics ─────────────────────────────────────────────── */}
      <Box nativeID="sub-diagnostics">
        <Text style={{ fontSize: 14, fontWeight: '600', color: tc.text.primary, marginBottom: 12 }}>
          Call Diagnostics
        </Text>

        <SettingRow
          label="Enable Call Diagnostics"
          description="Master switch for all diagnostic features"
        >
          <Toggle
            checked={dev.diagnosticsEnabled}
            onChange={handleToggle(dev.setDiagnosticsEnabled)}
          />
        </SettingRow>

        <SettingRow
          label="Show Stats Overlay"
          description="Real-time stats overlay during active calls"
        >
          <Toggle
            checked={dev.statsOverlay}
            onChange={handleToggle(dev.setStatsOverlay)}
          />
        </SettingRow>

        {dev.diagnosticsEnabled && (
          <>
            <SettingRow
              label="Frame Timing Alerts"
              description="Log alerts when frame intervals drift >5ms from target"
            >
              <Toggle
                checked={dev.frameTimingAlerts}
                onChange={handleToggle(dev.setFrameTimingAlerts)}
              />
            </SettingRow>

            <SettingRow
              label="Ring Buffer Logging"
              description="Log audio ring buffer state per frame for garble detection"
            >
              <Toggle
                checked={dev.ringBufferLogging}
                onChange={handleToggle(dev.setRingBufferLogging)}
              />
            </SettingRow>

            <SettingRow
              label="Codec Negotiation Log"
              description="Log SDP codec negotiation on both sides and diff for mismatches"
            >
              <Toggle
                checked={dev.codecNegotiationLog}
                onChange={handleToggle(dev.setCodecNegotiationLog)}
              />
            </SettingRow>

            <SettingRow
              label="Degradation Detection"
              description="Auto-capture state snapshots when quality metrics degrade"
            >
              <Toggle
                checked={dev.degradationDetection}
                onChange={handleToggle(dev.setDegradationDetection)}
              />
            </SettingRow>
          </>
        )}
      </Box>

      {/* ── Media Capture ────────────────────────────────────────────────── */}
      <Box nativeID="sub-capture">
        <Text style={{ fontSize: 14, fontWeight: '600', color: tc.text.primary, marginBottom: 12 }}>
          Media Capture
        </Text>

        <SettingRow
          label="Raw Media Capture"
          description="Dump raw PCM audio (.wav) and I420 video (.yuv) to disk before encoding"
        >
          <Toggle
            checked={dev.rawMediaCapture}
            onChange={handleToggle(dev.setRawMediaCapture)}
            disabled={!dev.diagnosticsEnabled}
          />
        </SettingRow>

        <SettingRow
          label="A/V Sync Validation"
          description="Enable frame counter, click track, and timestamp sync checks"
        >
          <Toggle
            checked={dev.avSyncValidation}
            onChange={handleToggle(dev.setAvSyncValidation)}
            disabled={!dev.diagnosticsEnabled}
          />
        </SettingRow>
      </Box>

      {/* ── Testing ──────────────────────────────────────────────────────── */}
      <Box nativeID="sub-testing">
        <Text style={{ fontSize: 14, fontWeight: '600', color: tc.text.primary, marginBottom: 12 }}>
          Testing
        </Text>

        <SettingRow
          label="Reference Signal Mode"
          description="Replace all media with a 440Hz sine wave test tone for quality validation"
        >
          <Toggle
            checked={dev.referenceSignalMode}
            onChange={handleToggle(dev.setReferenceSignalMode)}
            disabled={!dev.diagnosticsEnabled}
          />
        </SettingRow>
      </Box>

      {/* ── Danger Zone ────────────────────────────────────────────────── */}
      <DangerZoneSubsection />
    </Box>
  );
}

function DangerZoneSubsection() {
  const { theme } = useTheme();
  const tc = theme.colors;
  const [showConfirm, setShowConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = useCallback(async () => {
    setIsResetting(true);
    try {
      // 1. Clear all localStorage
      localStorage.clear();

      // 2. Clear all sessionStorage
      sessionStorage.clear();

      // 3. Delete all IndexedDB databases
      if ('databases' in indexedDB) {
        const dbs = await indexedDB.databases();
        await Promise.all(
          dbs.map((db) => {
            if (db.name) {
              return new Promise<void>((resolve) => {
                const req = indexedDB.deleteDatabase(db.name!);
                req.onsuccess = () => resolve();
                req.onerror = () => resolve();
                req.onblocked = () => resolve();
              });
            }
            return Promise.resolve();
          }),
        );
      }

      // 4. Clear all caches (Cache API)
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      }

      // 5. Unregister all service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((r) => r.unregister()));
      }

      // Hard reload to start fresh
      window.location.href = '/';
    } catch (err) {
      if (__DEV__) dbg.error('state', 'Browser reset failed', err, SRC);
      // Reload anyway — partial reset is better than none
      window.location.href = '/';
    }
  }, []);

  return (
    <Box nativeID="sub-danger">
      <Text style={{ fontSize: 14, fontWeight: '600', color: tc.status.danger, marginBottom: 12 }}>
        Danger Zone
      </Text>

      <Card style={{ padding: 16, borderColor: tc.status.danger, borderWidth: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: tc.text.primary, marginBottom: 4 }}>
          Full Browser Reset
        </Text>
        <Text style={{ fontSize: 12, color: tc.text.secondary, lineHeight: 18, marginBottom: 12 }}>
          Wipe all local data: databases, localStorage, sessionStorage, caches, and service workers.
          You will be logged out and all local data will be permanently deleted.
        </Text>
        <Button variant="destructive" onPress={() => setShowConfirm(true)}>
          Reset All Browser Data
        </Button>
      </Card>

      <Dialog
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="Confirm Full Reset"
        icon={<TrashIcon size={24} color={tc.status.danger} />}
        size="sm"
        footer={
          <HStack gap="sm" style={{ justifyContent: 'flex-end' }}>
            <Button variant="tertiary" onPress={() => setShowConfirm(false)} disabled={isResetting}>
              Cancel
            </Button>
            <Button
              variant="secondary"
              onPress={handleReset}
              style={{ borderColor: tc.status.dangerBorder, backgroundColor: tc.status.dangerSurface }}
              disabled={isResetting}
            >
              <Text style={{ color: tc.status.danger, fontWeight: '600', fontSize: 14 }}>
                {isResetting ? 'Resetting...' : 'Yes, Delete Everything'}
              </Text>
            </Button>
          </HStack>
        }
      >
        <Box style={{ gap: 12 }}>
          <Text style={{ fontSize: 13, color: tc.text.secondary, lineHeight: 18 }}>
            This will permanently delete ALL local data including your wallet, messages,
            contacts, and settings. You will need to re-import your wallet to use Umbra again.
          </Text>
          <Box style={{ backgroundColor: tc.status.dangerSurface, borderRadius: 8, padding: 12, borderWidth: 1, borderColor: tc.status.dangerBorder }}>
            <Text style={{ fontSize: 12, color: tc.status.danger, fontWeight: '600' }}>
              Warning: This action cannot be undone.
            </Text>
          </Box>
        </Box>
      </Dialog>
    </Box>
  );
}

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
    <Box>
      <Text style={{ fontSize: 20, fontWeight: '700', color: tc.text.primary, marginBottom: 20 }}>About</Text>

      <Card style={{ padding: 16, marginBottom: 16 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: tc.text.primary, marginBottom: 12 }}>
          Umbra
        </Text>

        <Text style={labelStyle}>App Version</Text>
        <Text style={valueStyle}>{update.currentVersion}</Text>

        {coreVersion ? (
          <>
            <Text style={labelStyle}>Core Version</Text>
            <Text style={valueStyle}>{coreVersion}</Text>
          </>
        ) : null}

        <Text style={labelStyle}>Latest Available</Text>
        <Text style={valueStyle}>
          {update.isLoading ? 'Checking...' : update.latestVersion || update.currentVersion}
          {update.hasUpdate && !update.isWebUser && (
            <Text style={{ color: tc.status.success, fontSize: 12 }}> (update available)</Text>
          )}
        </Text>

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
        <Text style={{ fontSize: 14, fontWeight: '600', color: tc.text.primary, marginBottom: 10 }}>Links</Text>

        <Pressable
          onPress={() => {
            Linking.openURL('https://github.com/InfamousVague/Umbra');
          }}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 }}
        >
          <ExternalLinkIcon size={14} color={tc.text.link} />
          <Text style={{ fontSize: 13, color: tc.text.link }}>GitHub Repository</Text>
        </Pressable>

        {update.releaseUrl && (
          <Pressable
            onPress={() => Linking.openURL(update.releaseUrl!)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 }}
          >
            <ExternalLinkIcon size={14} color={tc.text.link} />
            <Text style={{ fontSize: 13, color: tc.text.link }}>Release Notes</Text>
          </Pressable>
        )}

        <Pressable
          onPress={() => Linking.openURL('https://umbra.chat')}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 }}
        >
          <GlobeIcon size={14} color={tc.text.link} />
          <Text style={{ fontSize: 13, color: tc.text.link }}>Web App</Text>
        </Pressable>
      </Card>

      <Card style={{ padding: 16 }}>
        <Text style={{ fontSize: 12, color: tc.text.muted, lineHeight: 18 }}>
          Umbra is a private, peer-to-peer messaging application with end-to-end encryption.
          Built with Ed25519/X25519/AES-256-GCM cryptography and WebRTC for direct communication.
        </Text>
      </Card>

      <AllPlatformsDialog
        open={showAllPlatforms}
        onClose={() => setShowAllPlatforms(false)}
        downloads={update.downloads}
        version={update.latestVersion || update.currentVersion}
        releaseUrl={update.releaseUrl}
      />
    </Box>
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
      <Box
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
        <Text
          style={{
            fontSize: 12,
            fontWeight: '600',
            color: selected ? tc.accent.primary : tc.text.primary,
          }}
        >
          {mode === 'bubble' ? 'Bubbles' : 'Inline'}
        </Text>
        {selected && (
          <Box
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
          </Box>
        )}
      </Box>

      {/* Preview message area */}
      <Box
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
              <Box
                key={i}
                style={{
                  flexDirection: msg.isOwn ? 'row-reverse' : 'row',
                  alignItems: 'flex-end',
                  gap: 4,
                }}
              >
                {!msg.isOwn && (
                  <Box
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 9,
                      backgroundColor: tc.accent.primary,
                      opacity: 0.6,
                    }}
                  />
                )}
                <Box
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
                  <Text
                    style={{
                      fontSize: 10,
                      color: msg.isOwn
                        ? (tc.text.onAccent || '#fff')
                        : tc.text.primary,
                    }}
                  >
                    {msg.text}
                  </Text>
                </Box>
              </Box>
            ))}
          </>
        ) : (
          /* ── Inline preview (Slack/Discord style) ── */
          <>
            {SAMPLE_MESSAGES.map((msg, i) => {
              const showHeader = i === 0 || SAMPLE_MESSAGES[i - 1].sender !== msg.sender;
              return (
                <Box
                  key={i}
                  style={{
                    flexDirection: 'row',
                    gap: 6,
                    alignItems: 'flex-start',
                  }}
                >
                  <Box style={{ width: 18 }}>
                    {showHeader && (
                      <Box
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 9,
                          backgroundColor: tc.accent.primary,
                          opacity: 0.6,
                        }}
                      />
                    )}
                  </Box>
                  <Box style={{ flex: 1 }}>
                    {showHeader && (
                      <Box
                        style={{
                          flexDirection: 'row',
                          alignItems: 'baseline',
                          gap: 4,
                          marginBottom: 1,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 10,
                            fontWeight: '700',
                            color: tc.text.primary,
                          }}
                        >
                          {msg.sender}
                        </Text>
                        <Text
                          style={{
                            fontSize: 8,
                            color: tc.text.muted,
                          }}
                        >
                          2:34 PM
                        </Text>
                      </Box>
                    )}
                    <Text
                      style={{
                        fontSize: 10,
                        color: tc.text.secondary,
                        lineHeight: 14,
                      }}
                    >
                      {msg.text}
                    </Text>
                  </Box>
                </Box>
              );
            })}
          </>
        )}
      </Box>
    </Pressable>
  );
}

function MessagingSection() {
  const { theme } = useTheme();
  const tc = theme.colors;
  const { displayMode, setDisplayMode } = useMessaging();

  return (
    <Box style={{ gap: 20 }}>
      <SectionHeader
        title="Messaging"
        description="Choose how messages are displayed in conversations."
      />

      <Box nativeID="sub-display">
        <Text
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
        </Text>

        <Box style={{ flexDirection: 'row', gap: 12 }}>
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
        </Box>

        <Text
          style={{
            fontSize: 12,
            color: tc.text.muted,
            marginTop: 8,
          }}
        >
          {displayMode === 'bubble'
            ? 'Messages appear in colored bubbles. Your messages are on the right, theirs on the left.'
            : 'All messages are left-aligned with sender name and timestamp. Similar to Slack or Discord.'}
        </Text>
      </Box>
    </Box>
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

  // Settings content crossfade animation
  const contentOpacity = useRef(new Animated.Value(1)).current;
  const isFadingRef = useRef(false);

  // Mobile sidebar ↔ content slide animation
  const { width: settingsScreenWidth } = useWindowDimensions();
  const mobileSidebarX = useRef(new Animated.Value(0)).current;
  const mobileContentX = useRef(new Animated.Value(settingsScreenWidth)).current;
  const prevMobileSidebarRef = useRef(true);

  // Drive mobile sidebar/content slide when mobileShowSidebar changes
  useEffect(() => {
    if (!isMobile || !open) return;
    if (prevMobileSidebarRef.current === mobileShowSidebar) return;
    prevMobileSidebarRef.current = mobileShowSidebar;

    if (mobileShowSidebar) {
      // Slide sidebar in from left, content out to right
      Animated.parallel([
        Animated.timing(mobileSidebarX, { toValue: 0, duration: 250, easing: Easing.bezier(0, 0, 0.2, 1), useNativeDriver: true }),
        Animated.timing(mobileContentX, { toValue: settingsScreenWidth, duration: 250, easing: Easing.bezier(0, 0, 0.2, 1), useNativeDriver: true }),
      ]).start();
    } else {
      // Slide sidebar out to left, content in from right
      Animated.parallel([
        Animated.timing(mobileSidebarX, { toValue: -settingsScreenWidth, duration: 250, easing: Easing.bezier(0, 0, 0.2, 1), useNativeDriver: true }),
        Animated.timing(mobileContentX, { toValue: 0, duration: 250, easing: Easing.bezier(0, 0, 0.2, 1), useNativeDriver: true }),
      ]).start();
    }
  }, [isMobile, open, mobileShowSidebar, settingsScreenWidth]);

  // Reset mobile animation positions when dialog opens
  useEffect(() => {
    if (open && isMobile) {
      prevMobileSidebarRef.current = true;
      mobileSidebarX.setValue(0);
      mobileContentX.setValue(settingsScreenWidth);
    }
  }, [open, isMobile]);

  const handleSectionChange = useCallback((sectionId: SettingsSection) => {
    // On desktop: crossfade content when switching sections
    if (!isMobile && !isFadingRef.current) {
      isFadingRef.current = true;
      Animated.timing(contentOpacity, {
        toValue: 0,
        duration: 100,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start(() => {
        setActiveSection(sectionId);
        const subs = SUBCATEGORIES[sectionId];
        setActiveSubsection(subs ? subs[0].id : null);
        // Scroll to top on section change
        contentScrollRef.current?.scrollTo?.({ y: 0, animated: false });
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 150,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }).start(() => {
          isFadingRef.current = false;
        });
      });
    } else {
      setActiveSection(sectionId);
      const subs = SUBCATEGORIES[sectionId];
      setActiveSubsection(subs ? subs[0].id : null);
    }
    if (isMobile) setMobileShowSidebar(false);
  }, [isMobile, contentOpacity]);

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
      // Glassmorphism: translucent background with blur
      backgroundColor: isDark ? 'rgba(30, 30, 34, 0.94)' : 'rgba(255, 255, 255, 0.92)',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.6)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: isDark ? 0.7 : 0.2,
      shadowRadius: 48,
      elevation: 12,
      ...(Platform.OS === 'web' ? {
        backdropFilter: 'blur(16px) saturate(1.3)',
        WebkitBackdropFilter: 'blur(16px) saturate(1.3)',
      } as any : {}),
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
      // Glass sidebar: subtle tint to differentiate from content
      backgroundColor: isDark
        ? 'rgba(255, 255, 255, 0.04)'
        : 'rgba(0, 0, 0, 0.03)',
      borderRightWidth: 1,
      borderRightColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
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
      case 'keyboard-shortcuts':
        return <KeyboardShortcutsSection />;
      case 'about':
        return <AboutSection />;
      case 'developer':
        return <DeveloperSection />;
    }
  };

  const sidebarContent = (
    <ScrollArea style={sidebarStyle}>
      <Box style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: isMobile ? 8 : 0 }}>
        <Text style={sidebarTitleStyle}>Settings</Text>
        {isMobile && (
          <Pressable
            onPress={onClose}
            style={{ padding: 8 }}
            testID={TEST_IDS.SETTINGS.CLOSE_BUTTON}
            accessibilityActions={[{ name: 'activate', label: 'Close' }]}
            onAccessibilityAction={(e: any) => { if (e.nativeEvent.actionName === 'activate') onClose(); }}
          >
            <XIcon size={20} color={tc.text.secondary} />
          </Pressable>
        )}
      </Box>

      {NAV_ITEMS.map((item) => {
        const isActive = activeSection === item.id;
        const Icon = item.icon;
        const subs = SUBCATEGORIES[item.id];
        const hasSubs = subs && subs.length > 1;

        return (
          <Box key={item.id}>
            {/* Top-level nav item */}
            <Pressable
              onPress={() => handleSectionChange(item.id)}
              testID={NAV_TEST_IDS[item.id]}
              accessibilityActions={[{ name: 'activate', label: item.label }]}
              onAccessibilityAction={(e: any) => { if (e.nativeEvent.actionName === 'activate') handleSectionChange(item.id); }}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                paddingVertical: 8,
                paddingHorizontal: 10,
                borderRadius: 8,
                backgroundColor: isActive
                  ? (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.6)')
                  : pressed
                    ? (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.4)')
                    : 'transparent',
                borderWidth: isActive ? 1 : 0,
                borderColor: isActive
                  ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.5)')
                  : 'transparent',
                marginBottom: 2,
              })}
            >
              <Icon
                size={18}
                color={isActive ? tc.text.primary : tc.text.secondary}
              />
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: isActive ? '600' : '400',
                  color: isActive ? tc.text.primary : tc.text.secondary,
                }}
              >
                {item.label}
              </Text>
            </Pressable>

            {/* Sub-items: show when section is active and has subcategories */}
            {isActive && hasSubs && (
              <Box style={{ marginTop: 4, marginBottom: 4 }}>
                {subs.map((sub) => {
                  const isSubActive = activeSubsection === sub.id;
                  return (
                    <Box
                      key={sub.id}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'stretch',
                        marginBottom: 1,
                      }}
                    >
                      <Box
                        style={{
                          width: 2,
                          borderRadius: 1,
                          backgroundColor: isSubActive
                            ? tc.text.primary
                            : tc.border.strong,
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
                            ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.5)')
                            : pressed
                              ? (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.3)')
                              : 'transparent',
                        })}
                      >
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: isSubActive ? '600' : '400',
                            color: isSubActive
                              ? tc.text.primary
                              : tc.text.secondary,
                          }}
                        >
                          {sub.label}
                        </Text>
                      </Pressable>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>
        );
      })}
    </ScrollArea>
  );

  const contentArea = (
    <Box style={{ flex: 1, paddingTop: isMobile ? insets.top : 0, paddingBottom: isMobile ? insets.bottom : 0, paddingLeft: isMobile ? insets.left : 0, paddingRight: isMobile ? insets.right : 0 }}>
      {/* Mobile: back button + section title header */}
      {isMobile && (
        <Box style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: tc.border.subtle }}>
          <Pressable
            onPress={() => setMobileShowSidebar(true)}
            style={{ padding: 4, marginRight: 8 }}
            testID="settings.back.button"
            accessibilityActions={[{ name: 'activate', label: 'Back' }]}
            onAccessibilityAction={(e: any) => { if (e.nativeEvent.actionName === 'activate') setMobileShowSidebar(true); }}
          >
            <ArrowLeftIcon size={20} color={tc.text.secondary} />
          </Pressable>
          <Text style={{ fontSize: 16, fontWeight: '600', color: tc.text.primary }}>
            {NAV_ITEMS.find((n) => n.id === activeSection)?.label ?? 'Settings'}
          </Text>
        </Box>
      )}
      <ScrollView
        ref={contentScrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: isMobile ? 16 : 28 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: contentOpacity }} testID={SECTION_TEST_IDS[activeSection]}>
          {renderSection()}
        </Animated.View>
      </ScrollView>
    </Box>
  );

  return (
    <Overlay
      open={open}
      backdrop={isMobile ? undefined : 'dim'}
      center={!isMobile}
      onBackdropPress={isMobile ? undefined : onClose}
      animationType={!isMobile && Platform.OS === 'web' ? 'none' : 'fade'}
      useModal={!isMobile}
      style={!isMobile && Platform.OS === 'web' ? {
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(2px)',
        WebkitBackdropFilter: 'blur(2px)',
      } as any : undefined}
    >

      <HelpPopoverHost />
      <AuraBurst active={open && !isMobile} radius={16}>
        <Box style={modalStyle} testID={TEST_IDS.SETTINGS.DIALOG}>
          {/* Glass inner highlight — top edge shine */}
          {!isMobile && Platform.OS === 'web' && (
            <Box
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 1,
                backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.8)',
                zIndex: 10,
              }}
              pointerEvents="none"
            />
          )}
          {isMobile ? (
            // Mobile: both views always mounted, slide via translateX
            <Box style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
              <Animated.View style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                transform: [{ translateX: mobileSidebarX }],
              }}>
                {sidebarContent}
              </Animated.View>
              <Animated.View style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                transform: [{ translateX: mobileContentX }],
              }}>
                {contentArea}
              </Animated.View>
            </Box>
          ) : (
            // Desktop: side-by-side
            <>
              {sidebarContent}
              {contentArea}
            </>
          )}
        </Box>
      </AuraBurst>
    </Overlay>
  );
}
