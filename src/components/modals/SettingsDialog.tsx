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
  MemberStatusDisplay,
  MemberStatusPicker,
  Collapse,
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
  ChevronRightIcon,
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
import { useSettingsNavigation } from '@/contexts/SettingsNavigationContext';
import { useTranslation } from 'react-i18next';
import { supportedLanguages, languageLabels } from '@/i18n';

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
  /** When true, renders content pane only (no modal wrapper). Used by /settings route. */
  inline?: boolean;
}

export interface NavItem {
  id: SettingsSection;
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
}

export const NAV_ITEMS: NavItem[] = [
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

export interface SubNavItem { id: string; label: string; }

export const SUBCATEGORIES: Partial<Record<SettingsSection, SubNavItem[]>> = {
  account: [
    { id: 'profile', label: 'Profile' },
    { id: 'identity', label: 'Identity' },
    { id: 'sync', label: 'Sync' },
    { id: 'danger', label: 'Danger Zone' },
  ],
  appearance: [
    { id: 'theme', label: 'Theme' },
    { id: 'dark-mode', label: 'Dark Mode' },
    { id: 'colors', label: 'Colors' },
    { id: 'text-size', label: 'Text Size' },
    { id: 'font', label: 'Font' },
    { id: 'language', label: 'Language' },
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

/**
 * Subsection header with improved visual prominence.
 * Renders a bold title with optional description and a subtle bottom border.
 */
function SubsectionHeader({ title, description }: { title: string; description?: string }) {
  const { theme } = useTheme();
  const tc = theme.colors;

  return (
    <Box style={{ marginTop: 24, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: tc.border.subtle }}>
      <Text style={{ fontSize: 15, fontWeight: '700', color: tc.text.primary }}>
        {title}
      </Text>
      {description && (
        <Text style={{ fontSize: 12, color: tc.text.secondary, marginTop: 2 }}>
          {description}
        </Text>
      )}
    </Box>
  );
}

/**
 * Collapsible disclosure section using Wisp's Collapse component.
 * Used to hide advanced settings behind a toggle.
 */
function CollapsibleSection({ title, children, defaultOpen = false }: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const { theme } = useTheme();
  const tc = theme.colors;

  return (
    <Box>
      <Pressable
        onPress={() => setOpen(!open)}
        accessibilityRole="button"
        accessibilityLabel={`${open ? 'Collapse' : 'Expand'} ${title}`}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 }}
      >
        <Box style={{
          transform: [{ rotate: open ? '90deg' : '0deg' }],
        }}>
          <ChevronRightIcon size={12} color={tc.text.muted} />
        </Box>
        <Text style={{
          fontSize: 11,
          fontWeight: '600',
          color: tc.text.secondary,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}>
          {title}
        </Text>
      </Pressable>
      <Collapse open={open}>
        <Box style={{ gap: 16, paddingTop: 8 }}>
          {children}
        </Box>
      </Collapse>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Account Sync Subsection
// ---------------------------------------------------------------------------

function AccountSyncSubsection() {
  const { identity } = useAuth();
  const { theme } = useTheme();
  const tc = theme.colors;
  const { t } = useTranslation('settings');
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

  const statusLabel = syncStatus === 'synced' ? t('syncStatusSynced')
    : syncStatus === 'syncing' ? t('syncStatusSyncing')
    : syncStatus === 'error' ? t('syncStatusError')
    : syncStatus === 'disabled' ? t('syncStatusDisabled')
    : t('syncStatusIdle');

  const statusColor = syncStatus === 'synced' ? tc.status.success
    : syncStatus === 'error' ? tc.status.danger
    : tc.text.muted;

  const lastSyncLabel = lastSyncedAt
    ? t('syncLastSynced', { date: new Date(lastSyncedAt).toLocaleString() })
    : t('syncNeverSynced');

  return (
    <Box style={{ gap: 12 }} testID={TEST_IDS.SYNC.SETTINGS_SECTION}>
      <Box>
        <Box style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: tc.text.primary }}>
            {t('syncCrossDevice')}
          </Text>
          <HelpIndicator
            id="settings-sync"
            title={t('syncTitle')}
            priority={45}
            size={14}
          >
            <HelpText>
              {t('syncHelp')}
            </HelpText>
            <HelpListItem>{t('syncHelpEncrypted')}</HelpListItem>
            <HelpListItem>{t('syncHelpOnlyYou')}</HelpListItem>
            <HelpListItem>{t('syncHelpNoMessages')}</HelpListItem>
          </HelpIndicator>
        </Box>
        <Text style={{ fontSize: 12, color: tc.text.secondary, marginTop: 2 }}>
          {t('syncDescription')}
        </Text>
      </Box>

      {/* Enable/disable toggle */}
      <Box style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, color: tc.text.primary }}>
            {t('syncEnable')}
          </Text>
          <Text style={{ fontSize: 12, color: tc.text.muted }}>
            {t('syncAutoDesc')}
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
                {isSyncing ? t('syncing') : t('syncNow')}
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
              accessibilityActions={[{ name: 'activate', label: t('syncDeleteData') }]}
              onAccessibilityAction={(e: { nativeEvent: { actionName: string } }) => {
                if (e.nativeEvent.actionName === 'activate') setShowDeleteConfirm(true);
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: tc.status.danger }}>
                {t('syncDeleteData')}
              </Text>
            </Button>
          </Box>
        </Card>
      )}

      {/* Delete confirmation dialog */}
      <Dialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title={t('syncDeleteTitle')}
        icon={<TrashIcon size={24} color={tc.status.danger} />}
        size="sm"
        footer={
          <HStack gap="sm" style={{ justifyContent: 'flex-end' }}>
            <Button variant="tertiary" onPress={() => setShowDeleteConfirm(false)}>
              {t('cancel')}
            </Button>
            <Button
              variant="secondary"
              onPress={handleDelete}
              testID={TEST_IDS.SYNC.DELETE_CONFIRM}
              style={{ borderColor: tc.status.dangerBorder, backgroundColor: tc.status.dangerSurface }}
              disabled={isDeleting}
              accessibilityActions={[{ name: 'activate', label: t('delete') }]}
              onAccessibilityAction={(e: { nativeEvent: { actionName: string } }) => {
                if (e.nativeEvent.actionName === 'activate') handleDelete();
              }}
            >
              <Text style={{ color: tc.status.danger, fontWeight: '600', fontSize: 14 }}>
                {isDeleting ? t('deleting') : t('delete')}
              </Text>
            </Button>
          </HStack>
        }
      >
        <Text style={{ fontSize: 13, color: tc.text.secondary, textAlign: 'center', lineHeight: 18 }}>
          {t('syncDeleteWarning')}
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
  const { t } = useTranslation('settings');
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

  // ── Custom status state ──────────────────────────────────────────────
  const [statusPickerOpen, setStatusPickerOpen] = useState(false);
  const [customStatusText, setCustomStatusText] = useState('');
  const [customStatusEmoji, setCustomStatusEmoji] = useState('');

  const handleStatusSubmit = useCallback((data: { text?: string; emoji?: string }) => {
    setCustomStatusText(data.text ?? '');
    setCustomStatusEmoji(data.emoji ?? '');
    setStatusPickerOpen(false);
    // TODO: Persist via updateProfile when backend adds a dedicated statusEmoji field.
    // For now custom status is local-only (lost on reload).
  }, []);

  const handleStatusClear = useCallback(() => {
    setCustomStatusText('');
    setCustomStatusEmoji('');
    setStatusPickerOpen(false);
  }, []);

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
        title={t('sectionAccount')}
        description={t('sectionAccountDesc')}
      />

      {/* ── Profile subsection ─────────────────────────────────────────── */}
      <Box nativeID="sub-profile" style={{ gap: 16 }}>
        <Card variant="elevated" padding="none" radius="lg" style={{ overflow: 'hidden' }}>
          {/* Banner area */}
          <Pressable onPress={handleBannerPick}>
            <Box style={{ width: '100%', height: 140, backgroundColor: tc.background.sunken, position: 'relative' }}>
              {bannerPreview ? (
                <Image source={{ uri: bannerPreview }} style={{ width: '100%', height: 140 }} resizeMode="cover" />
              ) : (
                <Box style={{ flex: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: tc.border.subtle, borderStyle: 'dashed', margin: 0 }}>
                  <Text style={{ color: tc.text.muted, fontSize: 13 }}>{t('profileBannerUpload')}</Text>
                </Box>
              )}
              {/* Hover overlay with change/remove buttons */}
              {bannerPreview && (
                <Box style={{ position: 'absolute', bottom: 8, right: 8, flexDirection: 'row', gap: 6 }}>
                  <Pressable onPress={handleBannerPick} style={{ backgroundColor: 'rgba(0,0,0,0.6)', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 6 }}>
                    <Text style={{ color: tc.text.inverse, fontSize: 11, fontWeight: '600' }}>{t('profileChangeBanner')}</Text>
                  </Pressable>
                  <Pressable onPress={() => { setBannerPreview(null); setPendingBanner(null); setBannerRemoved(true); }} style={{ backgroundColor: 'rgba(0,0,0,0.6)', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 6 }}>
                    <Text style={{ color: tc.text.inverse, fontSize: 11, fontWeight: '600' }}>{t('profileRemoveBanner')}</Text>
                  </Pressable>
                </Box>
              )}
            </Box>
          </Pressable>
          {bannerError && (
            <HStack gap="xs" style={{ alignItems: 'center', paddingHorizontal: 20, paddingTop: 8 }}>
              <AlertTriangleIcon size={14} color={tc.status.danger} />
              <Text style={{ color: tc.status.danger, fontSize: 12 }}>{bannerError}</Text>
            </HStack>
          )}

          {/* Avatar overlapping banner */}
          <Box style={{ paddingHorizontal: 20, marginTop: -48 }}>
            <Pressable onPress={handleAvatarPick}>
              <Box style={{
                width: 96, height: 96, borderRadius: 48,
                borderWidth: 4, borderColor: tc.background.surface,
                backgroundColor: tc.background.surface,
                alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
              }}>
                {avatarPreview ? (
                  <Image source={{ uri: avatarPreview }} style={{ width: 88, height: 88, borderRadius: 44 }} />
                ) : (
                  <UserIcon size={36} color={tc.text.muted} />
                )}
              </Box>
            </Pressable>
          </Box>
          {avatarError && (
            <HStack gap="xs" style={{ alignItems: 'center', paddingHorizontal: 20, marginTop: 4 }}>
              <AlertTriangleIcon size={14} color={tc.status.danger} />
              <Text style={{ color: tc.status.danger, fontSize: 12 }}>{avatarError}</Text>
            </HStack>
          )}

          {/* Profile fields */}
          <Box style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20, gap: 16 }}>
            {/* Display name */}
            <Box style={{ gap: 4 }}>
              <Input
                value={displayName}
                onChangeText={setDisplayName}
                placeholder={t('profileDisplayNamePlaceholder')}
                size="md"
                fullWidth
                testID={TEST_IDS.SETTINGS.DISPLAY_NAME_INPUT}
                gradientBorder
              />
              <Text style={{ fontSize: 11, color: tc.text.muted }}>
                {t('identityMemberSince', { date: memberSince })}
              </Text>
            </Box>

            {/* Status */}
            <Box style={{ gap: 4 }}>
              <Text style={{ fontSize: 12, fontWeight: '500', color: tc.text.secondary }}>{t('profileStatus')}</Text>
              <Select
                options={STATUS_OPTIONS}
                value={status}
                onChange={setStatus}
                placeholder={t('profileSelectStatus')}
                size="md"
                fullWidth
              />
            </Box>

            {/* Custom Status */}
            <Box style={{ gap: 8 }}>
              <Text style={{ fontSize: 12, fontWeight: '500', color: tc.text.secondary }}>{t('profileCustomStatus')}</Text>
              {(customStatusText || customStatusEmoji) ? (
                <HStack gap="sm" style={{ alignItems: 'center' }}>
                  <MemberStatusDisplay text={customStatusText} emoji={customStatusEmoji} size="sm" />
                  <Box style={{ flex: 1 }} />
                  <Button variant="tertiary" size="sm" onPress={() => setStatusPickerOpen(true)}>
                    {t('profileEditStatus')}
                  </Button>
                </HStack>
              ) : (
                <Button variant="secondary" size="sm" onPress={() => setStatusPickerOpen(true)}>
                  {t('profileSetStatus')}
                </Button>
              )}
            </Box>

            {(saving || saved) && (
              <HStack gap="xs" style={{ justifyContent: 'flex-end', alignItems: 'center' }}>
                {saved ? <CheckIcon size={14} color={tc.status.success} /> : null}
                <Text style={{ color: saved ? tc.status.success : tc.text.muted, fontSize: 12 }}>
                  {saving ? t('saving') : t('saved')}
                </Text>
              </HStack>
            )}
          </Box>
        </Card>

        <MemberStatusPicker
          open={statusPickerOpen}
          onClose={() => setStatusPickerOpen(false)}
          onSubmit={handleStatusSubmit}
          onClear={handleStatusClear}
          currentStatus={{ text: customStatusText, emoji: customStatusEmoji }}
        />
      </Box>

      {/* ── Identity subsection ────────────────────────────────────────── */}
      <Box nativeID="sub-identity" style={{ gap: 16 }}>
        <SubsectionHeader title={t('subIdentity')} description={t('subIdentityDesc')} />

        {/* DID Card */}
        <Card variant="outlined" padding="lg">
          <Box style={{ gap: 12 }}>
            <Box>
              <Box style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Text style={{ fontSize: 11, fontWeight: '600', color: tc.text.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {t('identityDecentralizedId')}
                </Text>
                <HelpIndicator id="settings-did" title={t('identityDidTitle')} priority={40} size={14}>
                  <HelpText>{t('identityDidHelp')}</HelpText>
                  <HelpHighlight icon={<KeyIcon size={22} color={tc.accent.primary} />}>{t('identityDidHighlight')}</HelpHighlight>
                  <HelpListItem>{t('identityShareHelp')}</HelpListItem>
                  <HelpListItem>{t('identityNeverChanges')}</HelpListItem>
                </HelpIndicator>
              </Box>
              <Box style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text testID={TEST_IDS.SETTINGS.DID_DISPLAY} accessibilityValue={{ text: identity.did }}
                  style={{ fontSize: 12, color: tc.text.secondary, fontFamily: 'monospace', flex: 1 }} numberOfLines={1}>
                  {truncatedDid}
                </Text>
                <Pressable onPress={handleCopyDid} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, backgroundColor: didCopied ? tc.status.successSurface : tc.background.sunken }}>
                  <CopyIcon size={14} color={didCopied ? tc.status.success : tc.text.secondary} />
                  <Text style={{ fontSize: 11, color: didCopied ? tc.status.success : tc.text.secondary, fontWeight: '500' }}>
                    {didCopied ? 'Copied' : 'Copy'}
                  </Text>
                </Pressable>
              </Box>
            </Box>

            <Separator spacing="sm" />

            {/* Account Recovery PDF */}
            <Pressable onPress={() => setShowIdentityCard(true)} testID={TEST_IDS.SETTINGS.IDENTITY_CARD}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 }}>
              <FileTextIcon size={18} color={tc.text.secondary} />
              <Box style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: tc.text.primary }}>Account Recovery Details</Text>
                <Text style={{ fontSize: 11, color: tc.text.secondary }}>Download a printable PDF with your DID, QR code, and recovery phrase</Text>
              </Box>
              <DownloadIcon size={16} color={tc.text.muted} />
            </Pressable>
          </Box>
        </Card>
        <IdentityCardDialog open={showIdentityCard} onClose={() => setShowIdentityCard(false)} />

        {/* Linked Accounts */}
        <SubsectionHeader title={t('subLinkedAccounts')} description={t('subLinkedAccountsDesc')} />
        <LinkedAccountsPanel did={identity?.did ?? null} />

        {/* QR Code Sharing (folded in from former sub-sharing) */}
        <Box style={{ gap: 12, marginTop: 8 }}>
          <Box style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: tc.text.primary }}>{t('sharingShareIdentity')}</Text>
            <HelpIndicator id="settings-qr" title={t('sharingQrTitle')} priority={45} size={14}>
              <HelpText>{t('sharingQrHelp')}</HelpText>
              <HelpListItem>{t('sharingQrContains')}</HelpListItem>
              <HelpListItem>{t('sharingQrSafe')}</HelpListItem>
              <HelpListItem>{t('sharingQrScan')}</HelpListItem>
            </HelpIndicator>
          </Box>
          <Text style={{ fontSize: 12, color: tc.text.secondary }}>{t('sharingScanDesc')}</Text>
          <Card variant="outlined" padding="lg" style={{ alignItems: 'center' }}>
            <QRCode value={identity.did} size="md" dotStyle="rounded" eyeFrameStyle="rounded" eyePupilStyle="rounded" darkColor={tc.text.primary} lightColor="transparent" eyeColor={tc.accent.primary} />
            <Text style={{ fontSize: 11, color: tc.text.muted, marginTop: 12, textAlign: 'center' }}>{identity.displayName}</Text>
          </Card>
        </Box>
      </Box>

      <Box nativeID="sub-sync">
        <AccountSyncSubsection />
      </Box>

      <Box nativeID="sub-danger" style={{ gap: 12 }}>
        {/* Custom danger header (not using SubsectionHeader due to color) */}
        <Box>
          <Box style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: tc.status.danger }}>{t('dangerZone')}</Text>
            <HelpIndicator id="settings-danger" title={t('dangerLogoutHelpTitle')} icon="!" priority={50} size={14}>
              <HelpText>{t('dangerLogoutHelp')}</HelpText>
              <HelpHighlight icon={<AlertTriangleIcon size={22} color={tc.status.danger} />} color={tc.status.danger}>{t('dangerLogoutHighlight')}</HelpHighlight>
            </HelpIndicator>
          </Box>
          <Text style={{ fontSize: 12, color: tc.text.secondary, marginTop: 2 }}>{t('dangerLogoutDesc')}</Text>
        </Box>

        <Card variant="outlined" padding="md" style={{ borderColor: tc.status.dangerBorder, gap: 8 }}>
          <Button
            variant="secondary"
            onPress={() => setShowRotateKeyConfirm(true)}
            iconLeft={<KeyIcon size={16} color={tc.status.danger} />}
            style={{ borderColor: tc.status.dangerBorder, backgroundColor: tc.status.dangerSurface }}
            testID={TEST_IDS.SETTINGS.ROTATE_KEY_BUTTON}
            accessibilityActions={[{ name: 'activate', label: t('dangerRotateKey') }]}
            onAccessibilityAction={(e: any) => { if (e.nativeEvent.actionName === 'activate') setShowRotateKeyConfirm(true); }}
          >
            <Text style={{ color: tc.status.danger, fontWeight: '600', fontSize: 14 }}>{t('dangerRotateKey')}</Text>
          </Button>

          <Button
            variant="secondary"
            onPress={() => setShowLogoutConfirm(true)}
            iconLeft={<LogOutIcon size={16} color={tc.status.danger} />}
            style={{ borderColor: tc.status.dangerBorder, backgroundColor: tc.status.dangerSurface }}
            testID={TEST_IDS.SETTINGS.LOGOUT_BUTTON}
            accessibilityActions={[{ name: 'activate', label: t('dangerLogOut') }]}
            onAccessibilityAction={(e: any) => { if (e.nativeEvent.actionName === 'activate') setShowLogoutConfirm(true); }}
          >
            <Text style={{ color: tc.status.danger, fontWeight: '600', fontSize: 14 }}>{t('dangerLogOut')}</Text>
          </Button>
        </Card>

      {/* Key rotation confirmation dialog */}
      <Dialog
        open={showRotateKeyConfirm}
        onClose={() => setShowRotateKeyConfirm(false)}
        title={t('dangerRotateKeyTitle')}
        icon={<KeyIcon size={24} color={tc.status.danger} />}
        size="sm"
        testID={TEST_IDS.SETTINGS.ROTATE_KEY_DIALOG}
        footer={
          <HStack gap="sm" style={{ justifyContent: 'flex-end' }}>
            <Button variant="tertiary" onPress={() => setShowRotateKeyConfirm(false)} testID={TEST_IDS.SETTINGS.ROTATE_KEY_CANCEL}>
              {t('cancel')}
            </Button>
            <Button
              variant="secondary"
              onPress={handleRotateKey}
              style={{ borderColor: tc.status.dangerBorder, backgroundColor: tc.status.dangerSurface }}
              testID={TEST_IDS.SETTINGS.ROTATE_KEY_CONFIRM}
            >
              <Text style={{ color: tc.status.danger, fontWeight: '600', fontSize: 14 }}>
                {isRotatingKey ? t('rotating') : t('rotateKey')}
              </Text>
            </Button>
          </HStack>
        }
      >
        <Box style={{ gap: 12 }}>
          <Text style={{ fontSize: 13, color: tc.text.secondary, lineHeight: 18 }} testID={TEST_IDS.SETTINGS.ROTATE_KEY_WARNING}>
            {t('dangerRotateKeyWarning')}
          </Text>
          <Box style={{ backgroundColor: tc.status.dangerSurface, borderRadius: 8, padding: 12, borderWidth: 1, borderColor: tc.status.dangerBorder }}>
            <Text style={{ fontSize: 12, color: tc.status.danger, fontWeight: '600' }}>
              {t('resetWarningMessage')} {t('dangerRotateKeyReestablish')}
            </Text>
          </Box>
        </Box>
      </Dialog>

      {/* Key rotation success/error feedback */}
      {rotateKeyResult && (
        <Dialog
          open={!!rotateKeyResult}
          onClose={() => setRotateKeyResult(null)}
          title={t('dangerRotateComplete')}
          icon={<KeyIcon size={24} color={tc.status.success} />}
          size="sm"
          testID={TEST_IDS.SETTINGS.ROTATE_KEY_SUCCESS}
          footer={
            <Button variant="primary" onPress={() => setRotateKeyResult(null)}>
              {t('done')}
            </Button>
          }
        >
          <Box style={{ gap: 8 }}>
            <Text style={{ fontSize: 13, color: tc.text.secondary, lineHeight: 18 }}>
              {t('keyRotationSuccess', { count: rotateKeyResult.friendCount })}
            </Text>
          </Box>
        </Dialog>
      )}

      {rotateKeyError && (
        <Dialog
          open={!!rotateKeyError}
          onClose={() => setRotateKeyError(null)}
          title={t('keyRotationFailed')}
          icon={<AlertTriangleIcon size={24} color={tc.status.danger} />}
          size="sm"
          footer={
            <Button variant="primary" onPress={() => setRotateKeyError(null)}>
              {t('ok')}
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
        title={t('logoutTitle')}
        icon={<LogOutIcon size={24} color={tc.status.danger} />}
        size="sm"
        testID={TEST_IDS.COMMON.CONFIRM_DIALOG}
        footer={
          <HStack gap="sm" style={{ justifyContent: 'flex-end' }}>
            <Button variant="tertiary" onPress={() => setShowLogoutConfirm(false)} testID={TEST_IDS.COMMON.CONFIRM_NO}>
              {t('cancel')}
            </Button>
            <Button
              variant="secondary"
              onPress={handleLogout}
              style={{ borderColor: tc.status.dangerBorder, backgroundColor: tc.status.dangerSurface }}
              testID={TEST_IDS.COMMON.CONFIRM_YES}
            >
              <Text style={{ color: tc.status.danger, fontWeight: '600', fontSize: 14 }}>
                {t('logoutButton')}
              </Text>
            </Button>
          </HStack>
        }
      >
        <Box style={{ alignItems: 'center', gap: 12 }}>
          <Image source={umbraDeadImage} style={{ width: 160, height: 160 }} resizeMode="contain" />
          <Text style={{ fontSize: 13, color: tc.text.secondary, textAlign: 'center', lineHeight: 18 }}>
            {t('logoutMessage')}
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
  const { t } = useTranslation('settings');
  const tc = theme.colors;

  // Build theme dropdown options (only installed themes)
  const themeOptions = useMemo<InlineDropdownOption[]>(() => {
    const installed = themes.filter((th) => installedThemeIds.has(th.id));
    return [
      { value: 'default', label: t('defaultThemeOption'), description: t('defaultThemeDesc') },
      ...installed.map((th) => ({
        value: th.id,
        label: th.name,
        description: th.description,
      })),
    ];
  }, [themes, installedThemeIds, t]);

  const handleAccentChange = useCallback(
    (color: string) => {
      setAccentColor(color);
    },
    [setAccentColor],
  );

  return (
    <Box style={{ gap: 20 }}>
      <SectionHeader title={t('sectionAppearance')} description={t('sectionAppearanceDesc')} />

      <Box nativeID="sub-theme">
        <SettingRow label={t('subTheme')} description={t('themeDesc')} vertical>
          <InlineDropdown
            options={themeOptions}
            value={activeTheme?.id ?? 'default'}
            onChange={(id) => setTheme(id === 'default' ? null : id)}
            placeholder={t('selectTheme')}
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
        <SettingRow label={t('subDarkMode')} description={t('darkModeDesc')}>
          <SoundToggle
            checked={mode === 'dark'}
            onChange={switchMode}
            testID={TEST_IDS.SETTINGS.DARK_MODE_TOGGLE}
            accessibilityActions={[{ name: 'activate', label: t('subDarkMode') }]}
            onAccessibilityAction={(e: { nativeEvent: { actionName: string } }) => {
              if (e.nativeEvent.actionName === 'activate') switchMode();
            }}
          />
        </SettingRow>
        )}
      </Box>

      <Box nativeID="sub-colors" testID={TEST_IDS.SETTINGS.ACCENT_COLOR} accessibilityValue={{ text: accentColor ?? '' }}>
        <SettingRow label={t('subColors')} description={t('accentColorDesc')} vertical>
          <ColorPicker
            value={accentColor ?? theme.colors.accent.primary}
            onChange={handleAccentChange}
            presets={ACCENT_PRESETS}
            size="md"
            showInput
          />
          {accentColor && (
            <Button size="sm" variant="tertiary" onPress={() => setAccentColor(null)} style={{ alignSelf: 'flex-start', marginTop: 8 }}>
              {t('resetToDefault')}
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

      <Box nativeID="sub-language">
        <LanguageSettingRow />
      </Box>

      <Box nativeID="sub-motion">
        <SettingRow label={t('animationsLabel')} description={t('animationsDesc')}>
          <SoundToggle
            checked={motionPreferences.enableAnimations}
            onChange={() => setMotionPreferences({ enableAnimations: !motionPreferences.enableAnimations })}
          />
        </SettingRow>
        <SettingRow label={t('shimmerLabel')} description={t('shimmerDesc')}>
          <SoundToggle
            checked={motionPreferences.enableShimmer}
            onChange={() => setMotionPreferences({ enableShimmer: !motionPreferences.enableShimmer })}
          />
        </SettingRow>
        <SettingRow label={t('reduceMotionLabel')} description={t('reduceMotionDesc')}>
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
  const { t } = useTranslation('settings');
  return (
    <SettingRow label={t('subTextSize')} description={t('textSizeDesc')} vertical>
      <InlineDropdown
        options={TEXT_SIZE_OPTIONS}
        value={value}
        onChange={(v) => onChange(v as TextSize)}
        placeholder={t('selectSize')}
        testID={TEST_IDS.SETTINGS.FONT_SIZE}
      />
    </SettingRow>
  );
}

function FontSettingRow() {
  const { activeFont, fonts, installedFontIds, setActiveFont } = useFonts();
  const { theme } = useTheme();
  const { t } = useTranslation('settings');
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
    <SettingRow label={t('subFont')} description={t('fontDesc')} vertical>
      <InlineDropdown
        options={fontOptions}
        value={activeFont.id}
        onChange={handleFontChange}
        placeholder={t('selectFont')}
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

function LanguageSettingRow() {
  const { i18n, t } = useTranslation('settings');
  const { service } = useUmbra();

  const languageOptions = useMemo<InlineDropdownOption[]>(() =>
    supportedLanguages.map((lang) => ({
      value: lang,
      label: languageLabels[lang],
      description: lang === 'en' ? 'Default' : undefined,
    })),
  []);

  const handleLanguageChange = useCallback(async (lang: string) => {
    i18n.changeLanguage(lang);
    // Persist language preference to profile (synced via relay)
    try {
      await service?.updateProfile({ type: 'language', value: lang });
    } catch { /* best-effort persist */ }
  }, [i18n, service]);

  return (
    <SettingRow label={t('subLanguage')} description={t('languageDesc')} vertical>
      <InlineDropdown
        options={languageOptions}
        value={i18n.language?.split('-')[0] || 'en'}
        onChange={handleLanguageChange}
        placeholder={t('selectLanguage')}
      />
    </SettingRow>
  );
}

function NotificationsSection() {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [messagePreview, setMessagePreview] = useState(true);
  const { t } = useTranslation('settings');

  return (
    <Box style={{ gap: 20 }}>
      <SectionHeader
        title={t('sectionNotifications')}
        description={t('notificationsDesc')}
      />

      <SettingRow label={t('notifPush')} description={t('notifPushDesc')}>
        <SoundToggle checked={pushEnabled} onChange={() => setPushEnabled((p) => !p)} />
      </SettingRow>

      <SettingRow label={t('notifPreview')} description={t('notifPreviewDesc')}>
        <SoundToggle checked={messagePreview} onChange={() => setMessagePreview((p) => !p)} />
      </SettingRow>
    </Box>
  );
}

function SoundsSection() {
  const { theme } = useTheme();
  const tc = theme.colors;
  const { t } = useTranslation('settings');
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
    () => SOUND_THEMES.map((t) => ({ value: t.id, label: t.name })),
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
        title={t('sectionSounds')}
        description={t('soundsDesc')}
      />

      <SettingRow label={t('soundsEnable')} description={t('soundsEnableDesc')}>
        <SoundToggle checked={!muted} onChange={() => setMuted(!muted)} />
      </SettingRow>

      {!muted && (
        <>
          <SettingRow label={t('soundsTheme')} description={t('soundsThemeDesc')} vertical>
            <Select
              options={themeOptions}
              value={activeTheme}
              onChange={(v) => setActiveTheme(v as SoundThemeId)}
              placeholder={t('soundsSelectTheme')}
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

          <SettingRow label={t('soundsMasterVolume')} description={`${masterPct}%`} vertical>
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
  const { t } = useTranslation('settings');
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
        title={t('sectionPrivacy')}
        description={t('privacyDesc')}
      />

      <Box nativeID="sub-discovery">
        <FriendDiscoveryPanel did={identity?.did ?? null} />
      </Box>

      <Box nativeID="sub-visibility">
          <Box style={{ gap: 20 }}>
            <SettingRow
              label={t('privacyReadReceipts')}
              description={t('privacyReadReceiptsDesc')}
              helpIndicator={
                <HelpIndicator
                  id="settings-read-receipts"
                  title={t('privacyReadReceiptsHelpTitle')}
                  priority={60}
                  size={14}
                >
                  <HelpText>
                    When enabled, others can see when you've read their messages (shown as a double checkmark).
                  </HelpText>
                  <HelpListItem>{t('privacyReadReceiptsHelp1')}</HelpListItem>
                  <HelpListItem>{t('privacyReadReceiptsHelp2')}</HelpListItem>
                </HelpIndicator>
              }
            >
              <SoundToggle checked={readReceipts} onChange={handleReadReceiptsToggle} />
            </SettingRow>

            <SettingRow label={t('privacyTypingIndicators')} description={t('privacyTypingIndicatorsDesc')}>
              <SoundToggle checked={typingIndicators} onChange={() => setTypingIndicators((p) => !p)} />
            </SettingRow>
          </Box>

          <SettingRow label={t('privacyOnlineStatus')} description={t('privacyOnlineStatusDesc')}>
            <SoundToggle checked={showOnline} onChange={() => setShowOnline((p) => !p)} />
          </SettingRow>
      </Box>

      <Box nativeID="sub-security">
          <SettingRow
            label={t('privacyPinLock')}
            description={t('privacyPinLockDesc')}
            helpIndicator={
              <HelpIndicator
                id="settings-pin"
                title={t('privacyPinLockHelpTitle')}
                priority={55}
                size={14}
              >
                <HelpText>
                  Set a 6-digit PIN to prevent unauthorized access to your messages and keys.
                </HelpText>
                <HelpHighlight icon={<LockIcon size={22} color={tc.accent.primary} />}>
                  The PIN is stored locally on your device and required every time you open the app.
                </HelpHighlight>
                <HelpListItem>{t('privacyPinLockHelp1')}</HelpListItem>
                <HelpListItem>{t('privacyPinLockHelp2')}</HelpListItem>
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
  const { t } = useTranslation('settings');
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
    { value: 'auto', label: t('qualityAuto'), description: t('qualityAutoDesc') },
    { value: '720p', label: t('quality720p'), description: t('quality720pDesc') },
    { value: '1080p', label: t('quality1080p'), description: t('quality1080pDesc') },
    { value: '1440p', label: t('quality1440p'), description: t('quality1440pDesc') },
    { value: '4k', label: t('quality4k'), description: t('quality4kDesc') },
  ];

  const audioQualityOptions: InlineDropdownOption[] = [
    { value: 'opus-voice', label: t('audioVoice'), description: t('audioVoiceDesc') },
    { value: 'opus-music', label: t('audioMusic'), description: t('audioMusicDesc') },
    { value: 'opus-low', label: t('audioLowLatency'), description: t('audioLowLatencyDesc') },
    { value: 'pcm', label: t('audioPCM'), description: t('audioPCMDesc') },
  ];

  const opusApplicationOptions: InlineDropdownOption[] = [
    { value: 'voip', label: t('opusVoip'), description: t('opusVoipDesc') },
    { value: 'audio', label: t('opusMusic'), description: t('opusMusicDesc') },
    { value: 'lowdelay', label: t('opusLowDelay'), description: t('opusLowDelayDesc') },
  ];

  const bitratePresets = [
    { value: 24, label: t('bitrateLow') },
    { value: 48, label: t('bitrateMedium') },
    { value: 96, label: t('bitrateHigh') },
    { value: 128, label: t('bitrateMax') },
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
      <SectionHeader title={t('sectionAudioVideo')} description={t('sectionAudioVideoDesc')} />

      <Box nativeID="sub-calling">
      {/* Calling */}
      <Box style={{ gap: 16 }}>
        <SubsectionHeader title={t('subCalling')} description={t('callingDesc')} />

        <SettingRow label={t('incomingCallDisplayLabel')} description={t('incomingCallDisplayDesc')} vertical>
          <SegmentedControl
            options={[
              { value: 'fullscreen', label: t('fullscreen') },
              { value: 'toast', label: t('toast') },
            ]}
            value={incomingCallDisplay}
            onChange={(v) => setIncomingCallDisplay(v as 'fullscreen' | 'toast')}
          />
        </SettingRow>

        <SettingRow label={t('ringVolumeLabel')} description={`Volume: ${ringVolume}%`} vertical>
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
      <SettingRow label={t('videoQualityLabel')} description={t('videoQualityDesc')} vertical>
        <InlineDropdown
          options={videoQualityOptions}
          value={videoQuality}
          onChange={(v) => setVideoQuality(v as VideoQuality)}
          placeholder={t('selectQuality')}
        />
      </SettingRow>

      <Separator spacing="sm" />

      {/* Test Video — live preview with effects applied */}
      <Box style={{ gap: 16 }}>
        <SubsectionHeader title={t('testVideoTitle')} description={t('testVideoDesc')} />

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
                      {videoEffect === 'blur' ? t('blurActive') : t('backgroundActive')}
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
                      {t('noEffect')}
                    </Text>
                  </Box>
                )}
              </Box>

              <Button variant="secondary" size="sm" onPress={stopEffectsPreview}>
                {t('stopPreview')}
              </Button>
            </Box>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onPress={startEffectsPreview}
              iconLeft={<VideoIcon size={14} color={tc.text.secondary} />}
            >
              {t('startCameraPreview')}
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
                  {videoEffect === 'blur' ? t('backgroundBlurActive') : t('virtualBackgroundActive')}
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
            {t('videoEffects')}
          </Text>
          <Text style={{ fontSize: 12, color: tc.text.secondary, marginTop: 2 }}>
            {t('videoEffectsDesc')}
          </Text>
        </Box>

        <SettingRow label={t('backgroundEffect')} description={t('backgroundEffectDesc')} vertical>
          <SegmentedControl
            options={[
              { value: 'none', label: t('effectNone') },
              { value: 'blur', label: t('effectBlur') },
              { value: 'virtual-background', label: t('effectImage') },
            ]}
            value={videoEffect}
            onChange={(v) => setVideoEffect(v as VideoEffect)}
          />
        </SettingRow>

        {videoEffect === 'blur' && (
          <SettingRow label={t('blurIntensity')} description={`${blurIntensity}px`} vertical>
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
              {t('backgroundImage')}
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
                {t('customImageUrl')}
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
      <SettingRow label={t('audioQualityLabel')} description={t('audioQualityDesc')} vertical>
        <InlineDropdown
          options={audioQualityOptions}
          value={audioQuality}
          onChange={(v) => handleAudioQualityChange(v as AudioQuality)}
          placeholder={t('selectAudioQuality')}
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
              {t('pcmWarning')}
            </Text>
          </Box>
        )}
      </SettingRow>

      {/* Opus Configuration (only when not PCM) */}
      {audioQuality !== 'pcm' && (
        <>
          <Separator spacing="sm" />
          <CollapsibleSection title={t('opusConfigTitle')}>

            {/* Application Mode */}
            <SettingRow label={t('applicationMode')} description={t('applicationModeDesc')} vertical>
              <InlineDropdown
                options={opusApplicationOptions}
                value={opusConfig.application}
                onChange={(v) => handleOpusConfigChange({ application: v as OpusApplication })}
                placeholder={t('selectMode')}
              />
            </SettingRow>

            {/* Bitrate Slider */}
            <SettingRow label={t('bitrateLabel')} description={`${opusConfig.bitrate} kbps`} vertical>
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
            <SettingRow label={t('complexityLabel')} description={`${t('complexityLevel', { level: opusConfig.complexity })} — ${opusConfig.complexity >= 8 ? t('complexityHigh') : opusConfig.complexity >= 4 ? t('complexityBalanced') : t('complexityLow')}`} vertical>
              <Slider
                value={opusConfig.complexity}
                min={0}
                max={10}
                step={1}
                onChange={(val) => handleOpusConfigChange({ complexity: val })}
              />
            </SettingRow>

            {/* Forward Error Correction */}
            <SettingRow label={t('fecLabel')} description={t('fecDesc')}>
              <Toggle
                checked={opusConfig.fec}
                onChange={(val) => handleOpusConfigChange({ fec: val })}
              />
            </SettingRow>

            {/* DTX */}
            <SettingRow label={t('dtxLabel')} description={t('dtxDesc')}>
              <Toggle
                checked={opusConfig.dtx}
                onChange={(val) => handleOpusConfigChange({ dtx: val })}
              />
            </SettingRow>
          </CollapsibleSection>
        </>
      )}

      <Separator spacing="sm" />

      {/* Volume Controls */}
      <Box style={{ gap: 16 }}>
        <SubsectionHeader title={t('volumeControls')} description={t('volumeControlsDesc')} />

        <SettingRow label={t('microphoneVolume')} description={`${inputVolume}%`} vertical>
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
                {t('voiceMeter')}
              </Text>
              <Text style={{ fontSize: 11, color: tc.text.secondary }}>
                {t('voiceMeterDesc')}
              </Text>
            </Box>
            <Button
              variant="secondary"
              size="sm"
              onPress={micTestActive ? stopMicTest : startMicTest}
            >
              {micTestActive ? t('stop') : t('testMic')}
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
                  {micTestLevel > 85 ? t('clippingWarning') : micTestLevel > 50 ? t('goodLevel') : micTestLevel > 10 ? t('lowLevel') : t('waitingForInput')}
                </Text>
                <Text style={{ fontSize: 10, fontWeight: '600', fontVariant: ['tabular-nums'], color: micTestLevel > 85 ? tc.status.danger : tc.text.muted }}>
                  {micTestLevel}%
                </Text>
              </Box>
            </Box>
          )}
        </Box>
        )}

        <SettingRow label={t('outputVolume')} description={`${volume}%`} vertical>
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
        <SubsectionHeader
          title={t('subDevices')}
          description={Platform.OS === 'web'
            ? t('devicesDesc')
            : t('devicesDescMobile')}
        />

        {Platform.OS === 'web' ? (
          <>
            {/* Microphones */}
            <Box style={{ gap: 6 }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: tc.text.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {t('microphonesLabel')}
              </Text>
              {audioInputs.length === 0 ? (
                <Text style={{ fontSize: 13, color: tc.text.secondary }}>{t('noMicrophonesDetected')}</Text>
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
                {t('camerasLabel')}
              </Text>
              {videoInputs.length === 0 ? (
                <Text style={{ fontSize: 13, color: tc.text.secondary }}>{t('noCamerasDetected')}</Text>
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
                {t('speakersLabel')}
              </Text>
              {audioOutputs.length === 0 ? (
                <Text style={{ fontSize: 13, color: tc.text.secondary }}>{t('noSpeakersDetected')}</Text>
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
                  {t('mediaDevicesUnavailable')}
                </Text>
              </Box>
            )}

            {/* Device Test — inline within Devices section */}
            <Separator spacing="sm" />
            <Box>
              <Text style={{ fontSize: 11, fontWeight: '600', color: tc.text.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {t('testDevicesLabel')}
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
                    {t('microphoneLevel')}
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
                  {t('stopTest')}
                </Button>
              </Box>
            ) : (
              <Button variant="secondary" size="sm" onPress={startTestPreview}>
                {t('testCameraAndMic')}
              </Button>
            )}
          </>
        ) : (
          <>
            {/* Mobile device display — simplified */}
            <Box style={{ gap: 6 }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: tc.text.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {t('cameraSection')}
              </Text>
              <Box style={{
                flexDirection: 'row', alignItems: 'center', gap: 8,
                paddingVertical: 8, paddingHorizontal: 12,
                borderRadius: 8, backgroundColor: tc.background.sunken,
              }}>
                <Box style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: tc.status.success }} />
                <Text style={{ fontSize: 13, color: tc.text.primary, flex: 1 }}>
                  {t('frontCamera')}
                </Text>
                <Text style={{ fontSize: 11, color: tc.text.muted }}>
                  {t('default')}
                </Text>
              </Box>
              <Box style={{
                flexDirection: 'row', alignItems: 'center', gap: 8,
                paddingVertical: 8, paddingHorizontal: 12,
                borderRadius: 8, backgroundColor: tc.background.sunken,
              }}>
                <Box style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: tc.status.success }} />
                <Text style={{ fontSize: 13, color: tc.text.primary, flex: 1 }}>
                  {t('backCamera')}
                </Text>
              </Box>
              <Text style={{ fontSize: 11, color: tc.text.muted, marginTop: 2 }}>
                {t('switchCameraHint')}
              </Text>
            </Box>

            <Box style={{ gap: 6 }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: tc.text.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {t('microphoneSection')}
              </Text>
              <Box style={{
                flexDirection: 'row', alignItems: 'center', gap: 8,
                paddingVertical: 8, paddingHorizontal: 12,
                borderRadius: 8, backgroundColor: tc.background.sunken,
              }}>
                <Box style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: tc.status.success }} />
                <Text style={{ fontSize: 13, color: tc.text.primary, flex: 1 }}>
                  {t('defaultMicrophone')}
                </Text>
              </Box>
            </Box>

            <Box style={{
              padding: 12, borderRadius: 8,
              backgroundColor: tc.status.infoSurface,
              borderWidth: 1, borderColor: tc.status.infoBorder,
            }}>
              <Text style={{ fontSize: 12, color: tc.status.info }}>
                {t('devicePermissionsHint')}
              </Text>
            </Box>
          </>
        )}
      </Box>
      </Box>

      {/* Audio Processing */}
      <Box style={{ gap: 16 }}>
        <SubsectionHeader title={t('audioProcessing')} description={t('audioProcessingDesc')} />

        <SettingRow label={t('noiseSuppression')} description={t('noiseSuppressionDesc')}>
          <SoundToggle checked={noiseSuppression} onChange={setNoiseSuppression} />
        </SettingRow>
        <SettingRow label={t('echoCancellation')} description={t('echoCancellationDesc')}>
          <SoundToggle checked={echoCancellation} onChange={setEchoCancellation} />
        </SettingRow>
        <SettingRow label={t('autoGainControl')} description={t('autoGainControlDesc')}>
          <SoundToggle checked={autoGainControl} onChange={setAutoGainControl} />
        </SettingRow>
      </Box>

      <Separator spacing="sm" />

      {/* Encryption (web only — Insertable Streams / RTCRtpScriptTransform) */}
      {Platform.OS === 'web' && (
      <Box style={{ gap: 16 }}>
        <SubsectionHeader title={t('encryption')} description={t('encryptionDesc')} />

        <SettingRow
          label={t('mediaE2EELabel')}
          description={
            typeof window !== 'undefined' && 'RTCRtpScriptTransform' in window
              ? t('mediaE2EEAvailable')
              : t('mediaE2EEUnavailable')
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
              {t('mediaE2EEWarning')}
            </Text>
          </Box>
        )}
      </Box>
      )}

    </Box>
  );
}

function NetworkSection() {
  const { t } = useTranslation('settings');
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
      setRelayError(t('invalidRelayUrl'));
      return;
    }

    // Check for duplicates
    if (relays.some((r) => r.url === trimmed)) {
      setRelayError(t('duplicateRelay'));
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
    idle: t('connectionStateIdle'),
    creating_offer: t('connectionStateCreatingOffer'),
    waiting_for_answer: t('connectionStateWaitingForAnswer'),
    accepting_offer: t('connectionStateAcceptingOffer'),
    completing_handshake: t('connectionStateCompletingHandshake'),
    connected: t('connectionStateConnected'),
    error: networkError?.message || t('connectionStateFailed'),
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
      <SectionHeader title={t('sectionNetwork')} description={t('sectionNetworkDesc')} />

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
              {isConnected ? t('connectedStatus') : t('disconnectedStatus')}
            </Text>
          </Box>
          <Box style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 13, color: tc.text.secondary }}>
              {t('peersCount', { count: peerCount })}
            </Text>
            <Text style={{ fontSize: 13, color: tc.text.secondary }}>
              {t('addressesCount', { count: listenAddresses?.length ?? 0 })}
            </Text>
          </Box>
        </Box>
      </Card>

      {/* Network Toggle */}
      <SettingRow
        label={t('p2pNetworkLabel')}
        description={t('p2pNetworkDesc')}
        helpIndicator={
          <HelpIndicator
            id="settings-p2p"
            title={t('helpP2pNetworkTitle')}
            priority={65}
            size={14}
          >
            <HelpText>
              {t('helpP2pNetworkText')}
            </HelpText>
            <HelpHighlight icon={<GlobeIcon size={22} color={tc.accent.primary} />}>
              {t('helpP2pNetworkHighlight')}
            </HelpHighlight>
            <HelpListItem>{t('helpP2pWebrtc')}</HelpListItem>
            <HelpListItem>{t('helpP2pFallback')}</HelpListItem>
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
            {t('relayServersTitle')}
          </Text>
          <Text style={{ fontSize: 12, color: tc.text.secondary, marginTop: 2 }}>
            {t('relayServersDesc')}
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
                        {t('defaultLabel')}
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
                        {t('onlineCount', { count: info.online })}
                      </Text>
                    </Box>
                  )}
                  {info?.federationEnabled && info?.connectedPeers != null && info.connectedPeers > 0 && (
                    <Box style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                      <ZapIcon size={10} color={tc.accent.primary} />
                      <Text style={{ fontSize: 11, color: tc.accent.primary }}>
                        {t('peerCount', { count: info.connectedPeers })}
                      </Text>
                    </Box>
                  )}
                  {info?.federationEnabled && info?.meshOnline != null && info.meshOnline > (info?.online ?? 0) && (
                    <Box style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                      <NetworkIcon size={10} color={tc.text.muted} />
                      <Text style={{ fontSize: 11, color: tc.text.muted }}>
                        {t('meshCount', { count: info.meshOnline })}
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
              placeholder={t('relayUrlPlaceholder')}
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
            {t('addButton')}
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
              {t('runOwnRelay')}
            </Text>
            <Text style={{ fontSize: 12, color: tc.text.secondary }}>
              {t('runOwnRelayDesc')}
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
              {t('peerIdLabel')}
            </Text>
            <HelpIndicator
              id="settings-peer-id"
              title={t('helpPeerIdTitle')}
              priority={70}
              size={14}
            >
              <HelpText>
                {t('helpPeerIdText')}
              </HelpText>
              <HelpListItem>{t('helpPeerIdDid')}</HelpListItem>
              <HelpListItem>{t('helpPeerIdDevice')}</HelpListItem>
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
                {peerIdCopied ? t('copied') : t('copy')}
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
              {t('connectToPeer')}
            </Text>
            <HelpIndicator
              id="settings-connect-peer"
              title={t('helpDirectP2pTitle')}
              priority={75}
              size={14}
            >
              <HelpText>
                {t('helpDirectP2pText')}
              </HelpText>
              <HelpHighlight icon={<HandshakeIcon size={22} color={tc.accent.primary} />}>
                {t('helpDirectP2pHighlight')}
              </HelpHighlight>
              <HelpListItem>{t('helpDirectP2pStep1')}</HelpListItem>
              <HelpListItem>{t('helpDirectP2pStep2')}</HelpListItem>
              <HelpListItem>{t('helpDirectP2pStep3')}</HelpListItem>
            </HelpIndicator>
          </Box>
          <Text style={{ fontSize: 12, color: tc.text.secondary, marginTop: 2 }}>
            {t('connectToPeerDesc')}
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
              {t('createOffer')}
            </Button>
          </Box>
        )}

        {/* Show offer data for copying */}
        {offerData && connectionState === 'waiting_for_answer' && (
          <Card variant="outlined" padding="md" style={{ width: '100%' }}>
            <Box style={{ gap: 8 }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: tc.text.muted, textTransform: 'uppercase' }}>
                {t('offerShareLabel')}
              </Text>
              <Text style={{ fontSize: 10, color: tc.text.secondary, fontFamily: 'monospace' }} numberOfLines={3}>
                {offerData.slice(0, 200)}...
              </Text>
              <Button size="sm" variant={offerCopied ? 'tertiary' : 'secondary'} onPress={handleCopyOffer}>
                {offerCopied ? t('copiedOffer') : t('copyOffer')}
              </Button>
            </Box>
          </Card>
        )}

        {/* Show answer data for copying (answerer side) */}
        {answerData && connectionState !== 'connected' && (
          <Card variant="outlined" padding="md" style={{ width: '100%' }}>
            <Box style={{ gap: 8 }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: tc.text.muted, textTransform: 'uppercase' }}>
                {t('answerShareLabel')}
              </Text>
              <Text style={{ fontSize: 10, color: tc.text.secondary, fontFamily: 'monospace' }} numberOfLines={3}>
                {answerData.slice(0, 200)}...
              </Text>
              <Button size="sm" variant={answerCopied ? 'tertiary' : 'secondary'} onPress={handleCopyAnswer}>
                {answerCopied ? t('copiedAnswer') : t('copyAnswer')}
              </Button>
            </Box>
          </Card>
        )}

        {/* Paste input for offer/answer */}
        {(connectionState === 'idle' || connectionState === 'waiting_for_answer') && (
          <Box style={{ gap: 8 }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: tc.text.muted, textTransform: 'uppercase' }}>
              {connectionState === 'waiting_for_answer'
                ? t('pasteAnswer')
                : t('pasteOffer')}
            </Text>
            <TextArea
              value={pasteInput}
              onChangeText={setPasteInput}
              placeholder={t('pasteInputPlaceholder')}
              numberOfLines={3}
              fullWidth
              gradientBorder
            />
            <Button
              size="sm"
              onPress={handlePasteSubmit}
              disabled={!pasteInput.trim()}
            >
              {connectionState === 'waiting_for_answer' ? t('completeConnection') : t('acceptOffer')}
            </Button>
          </Box>
        )}

        {/* Connected state */}
        {connectionState === 'connected' && (
          <Card variant="outlined" padding="md" style={{ width: '100%', backgroundColor: tc.status.successSurface }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: tc.status.success, textAlign: 'center' }}>
              {t('connectedSuccess')}
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
                {t('tryAgain')}
              </Button>
            </Box>
          </Card>
        )}

        {/* Reset button for non-idle states */}
        {connectionState !== 'idle' && connectionState !== 'error' && (
          <Button size="sm" variant="tertiary" onPress={resetSignaling}>
            {t('reset')}
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
              {t('yourDid')}
            </Text>
            <Text style={{ fontSize: 12, color: tc.text.secondary, marginTop: 2 }}>
              {t('didShareDesc')}
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
  const { t } = useTranslation('settings');
  const { storageUsage, isLoading: storageLoading, formatBytes: fmtBytes } = useStorageManager();
  const [showClearMessagesConfirm, setShowClearMessagesConfirm] = useState(false);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);
  const [clearStatus, setClearStatus] = useState<string | null>(null);
  const [clearError, setClearError] = useState(false);

  // Selective wipe: delete specific tables from the in-memory sql.js database
  // and then re-persist to IndexedDB
  const handleClearMessages = useCallback(async () => {
    setShowClearMessagesConfirm(false);
    setClearStatus(t('clearingMessages'));
    setClearError(false);

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
      setClearStatus(t('messagesCleared'));
      setClearError(false);
      setTimeout(() => setClearStatus(null), 3000);
    } catch (err) {
      if (__DEV__) dbg.error('state', 'Failed to clear messages', err, SRC);
      setClearStatus(t('failedClearMessages'));
      setClearError(true);
      setTimeout(() => setClearStatus(null), 3000);
    }
  }, [service]);

  // Full wipe: clear the entire IndexedDB database for the current DID
  const handleClearAllData = useCallback(async () => {
    setShowClearAllConfirm(false);
    setClearStatus(t('clearingAllData'));
    setClearError(false);

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
      setClearStatus(t('allDataCleared'));
      setClearError(false);
      setTimeout(() => setClearStatus(null), 5000);
    } catch (err) {
      if (__DEV__) dbg.error('state', 'Failed to clear all data', err, SRC);
      setClearStatus(t('failedClearData'));
      setClearError(true);
      setTimeout(() => setClearStatus(null), 3000);
    }
  }, [identity, service]);

  return (
    <Box style={{ gap: 24 }}>
      <SectionHeader
        title={t('sectionData')}
        description={t('sectionDataDesc')}
      />

      <Box nativeID="sub-storage">
          {/* Info card */}
          <Card variant="outlined" padding="lg" style={{ width: '100%' }}>
            <Box style={{ gap: 8 }}>
              <Box style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <DatabaseIcon size={18} color={tc.accent.primary} />
                <Text style={{ fontSize: 14, fontWeight: '600', color: tc.text.primary }}>
                  {t('localStorage')}
                </Text>
              </Box>
              <Text style={{ fontSize: 12, color: tc.text.secondary, lineHeight: 18 }}>
                {t('localStorageDesc')}
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
                    label={t('storageUsed')}
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
                        {t('communitiesStorage')} {fmtBytes(storageUsage.byContext.community)}
                      </Text>
                    )}
                    {storageUsage.byContext.dm > 0 && (
                      <Text style={{ fontSize: 11, color: tc.text.muted }}>
                        {t('dmStorage')} {fmtBytes(storageUsage.byContext.dm)}
                      </Text>
                    )}
                    {storageUsage.byContext.sharedFolders > 0 && (
                      <Text style={{ fontSize: 11, color: tc.text.muted }}>
                        {t('sharedFoldersStorage')} {fmtBytes(storageUsage.byContext.sharedFolders)}
                      </Text>
                    )}
                    {storageUsage.byContext.cache > 0 && (
                      <Text style={{ fontSize: 11, color: tc.text.muted }}>
                        {t('cacheStorage')} {fmtBytes(storageUsage.byContext.cache)}
                      </Text>
                    )}
                  </Box>
                </Box>
              )}
              {storageLoading && (
                <Text style={{ fontSize: 11, color: tc.text.muted, marginTop: 8 }}>
                  {t('loadingStorageInfo')}
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
                backgroundColor: clearError ? tc.status.dangerSurface : tc.status.successSurface,
              }}
            >
              <Text style={{
                fontSize: 13,
                color: clearError ? tc.status.danger : tc.status.success,
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
            {t('clearMessages')}
          </Text>
          <Text style={{ fontSize: 12, color: tc.text.secondary, marginTop: 2 }}>
            {t('clearMessagesDesc')}
          </Text>
        </Box>

        <Button
          variant="secondary"
          onPress={() => setShowClearMessagesConfirm(true)}
          iconLeft={<TrashIcon size={16} color={tc.status.warning} />}
          style={{ borderColor: tc.status.warningBorder, backgroundColor: tc.status.warningSurface }}
        >
          <Text style={{ color: tc.status.warning, fontWeight: '600', fontSize: 14 }}>
            {t('clearMessages')}
          </Text>
        </Button>
      </Box>

      <Separator spacing="sm" />

      {/* Full wipe */}
      <Box style={{ gap: 12 }}>
        <Box>
          <Box style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: tc.status.danger }}>
              {t('clearAllData')}
            </Text>
            <HelpIndicator
              id="settings-clear-all"
              title={t('helpClearAllDataTitle')}
              icon="!"
              priority={80}
              size={14}
            >
              <HelpText>
                {t('helpClearAllDataText')}
              </HelpText>
              <HelpHighlight icon={<AlertTriangleIcon size={22} color={tc.status.danger} />} color={tc.status.danger}>
                {t('helpClearAllDataHighlight')}
              </HelpHighlight>
            </HelpIndicator>
          </Box>
          <Text style={{ fontSize: 12, color: tc.text.secondary, marginTop: 2 }}>
            {t('clearAllDataDesc')}
          </Text>
        </Box>

        <Button
          variant="secondary"
          onPress={() => setShowClearAllConfirm(true)}
          iconLeft={<AlertTriangleIcon size={16} color={tc.status.danger} />}
          style={{ borderColor: tc.status.dangerBorder, backgroundColor: tc.status.dangerSurface }}
        >
          <Text style={{ color: tc.status.danger, fontWeight: '600', fontSize: 14 }}>
            {t('clearAllData')}
          </Text>
        </Button>
      </Box>

      {/* Clear messages confirmation */}
      <Dialog
        open={showClearMessagesConfirm}
        onClose={() => setShowClearMessagesConfirm(false)}
        title={t('clearMessagesTitle')}
        description={t('clearMessagesDialogDesc')}
        icon={<TrashIcon size={24} color={tc.status.warning} />}
        size="sm"
        footer={
          <HStack gap="sm" style={{ justifyContent: 'flex-end' }}>
            <Button variant="tertiary" onPress={() => setShowClearMessagesConfirm(false)}>
              {t('cancel')}
            </Button>
            <Button
              variant="secondary"
              onPress={handleClearMessages}
              style={{ borderColor: tc.status.warningBorder, backgroundColor: tc.status.warningSurface }}
            >
              <Text style={{ color: tc.status.warning, fontWeight: '600', fontSize: 14 }}>
                {t('clearMessages')}
              </Text>
            </Button>
          </HStack>
        }
      />

      {/* Clear all data confirmation */}
      <Dialog
        open={showClearAllConfirm}
        onClose={() => setShowClearAllConfirm(false)}
        title={t('clearAllDataTitle')}
        description={t('clearAllDataDialogDesc')}
        icon={<AlertTriangleIcon size={24} color={tc.status.danger} />}
        size="sm"
        footer={
          <HStack gap="sm" style={{ justifyContent: 'flex-end' }}>
            <Button variant="tertiary" onPress={() => setShowClearAllConfirm(false)}>
              {t('cancel')}
            </Button>
            <Button
              variant="secondary"
              onPress={handleClearAllData}
              style={{ borderColor: tc.status.dangerBorder, backgroundColor: tc.status.dangerSurface }}
            >
              <Text style={{ color: tc.status.danger, fontWeight: '600', fontSize: 14 }}>
                {t('clearAllData')}
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
  const { t } = useTranslation('settings');
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
            {t('sectionPlugins')}
          </Text>
          <Text style={{ fontSize: 13, color: tc.text.secondary }}>
            {t('pluginsDesc', { count: enabledCount })}
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
            {t('noPluginsInstalled')}
          </Text>
          <Text style={{ fontSize: 12, color: tc.text.secondary, textAlign: 'center' }}>
            {t('browseMarketplace')}
          </Text>
          {onOpenMarketplace && (
            <Text style={{ fontSize: 12, color: tc.accent.primary, fontWeight: '600', marginTop: 4 }}>
              {t('openMarketplace')}
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
  const { t } = useTranslation('settings');
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
              {t('permissionsMore', { count: plugin.manifest.permissions.length - 4 })}
            </Text>
          )}
        </Box>
      )}

      {/* Uninstall */}
      {showConfirm ? (
        <Box style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 44 }}>
          <Text style={{ fontSize: 11, color: tc.status.danger, flex: 1 }}>
            {t('removePluginConfirm')}
          </Text>
          <Button
            size="xs"
            variant="destructive"
            onPress={() => { onUninstall(); setShowConfirm(false); }}
          >
            {t('removeButton')}
          </Button>
          <Button size="xs" variant="tertiary" onPress={() => setShowConfirm(false)}>
            {t('cancel')}
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
            {t('uninstall')}
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
  const { t } = useTranslation('settings');
  const allShortcuts = ShortcutRegistry.getAllFlat();

  return (
    <Box style={{ gap: 16 }}>
      <Text size="lg" weight="bold" style={{ color: tc.text.primary }}>
        {t('sectionShortcuts')}
      </Text>
      <Text size="sm" style={{ color: tc.text.muted }}>
        {t('shortcutsDesc')}
      </Text>

      {allShortcuts.length === 0 ? (
        <Card style={{ padding: 24, alignItems: 'center' }}>
          <KeyIcon size={32} color={tc.text.muted} />
          <Text size="sm" style={{ color: tc.text.muted, marginTop: 8 }}>
            {t('noShortcuts')}
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
  const { t } = useTranslation('settings');
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
        title={t('sectionDeveloper')}
        description={t('sectionDeveloperDesc')}
      />

      {/* Warning banner */}
      <Card style={{ padding: 12, borderColor: tc.status.warning ?? '#ff9800', borderWidth: 1 }}>
        <Text style={{ fontSize: 12, color: tc.text.secondary, lineHeight: 18 }}>
          {t('devToolsWarning')}
        </Text>
      </Card>

      {/* ── Call Diagnostics ─────────────────────────────────────────────── */}
      <Box nativeID="sub-diagnostics">
        <Text style={{ fontSize: 14, fontWeight: '600', color: tc.text.primary, marginBottom: 12 }}>
          {t('callDiagnostics')}
        </Text>

        <SettingRow
          label={t('enableDiagnostics')}
          description={t('enableDiagnosticsDesc')}
        >
          <Toggle
            checked={dev.diagnosticsEnabled}
            onChange={handleToggle(dev.setDiagnosticsEnabled)}
          />
        </SettingRow>

        <SettingRow
          label={t('statsOverlay')}
          description={t('statsOverlayDesc')}
        >
          <Toggle
            checked={dev.statsOverlay}
            onChange={handleToggle(dev.setStatsOverlay)}
          />
        </SettingRow>

        {dev.diagnosticsEnabled && (
          <>
            <SettingRow
              label={t('frameTimingAlerts')}
              description={t('frameTimingAlertsDesc')}
            >
              <Toggle
                checked={dev.frameTimingAlerts}
                onChange={handleToggle(dev.setFrameTimingAlerts)}
              />
            </SettingRow>

            <SettingRow
              label={t('ringBufferLogging')}
              description={t('ringBufferLoggingDesc')}
            >
              <Toggle
                checked={dev.ringBufferLogging}
                onChange={handleToggle(dev.setRingBufferLogging)}
              />
            </SettingRow>

            <SettingRow
              label={t('codecNegotiationLog')}
              description={t('codecNegotiationLogDesc')}
            >
              <Toggle
                checked={dev.codecNegotiationLog}
                onChange={handleToggle(dev.setCodecNegotiationLog)}
              />
            </SettingRow>

            <SettingRow
              label={t('degradationDetection')}
              description={t('degradationDetectionDesc')}
            >
              <Toggle
                checked={dev.degradationDetection}
                onChange={handleToggle(dev.setDegradationDetection)}
              />
            </SettingRow>
          </>
        )}
      </Box>

      {/* ── Media Capture & Testing ────────────────────────────────────── */}
      <Box nativeID="sub-capture">
        <CollapsibleSection title={t('mediaCapture')}>
          <SettingRow
            label={t('rawMediaCapture')}
            description={t('rawMediaCaptureDesc')}
          >
            <Toggle
              checked={dev.rawMediaCapture}
              onChange={handleToggle(dev.setRawMediaCapture)}
              disabled={!dev.diagnosticsEnabled}
            />
          </SettingRow>

          <SettingRow
            label={t('avSyncValidation')}
            description={t('avSyncValidationDesc')}
          >
            <Toggle
              checked={dev.avSyncValidation}
              onChange={handleToggle(dev.setAvSyncValidation)}
              disabled={!dev.diagnosticsEnabled}
            />
          </SettingRow>
        </CollapsibleSection>
      </Box>

      <Box nativeID="sub-testing">
        <CollapsibleSection title={t('testing')}>
          <SettingRow
            label={t('referenceSignalMode')}
            description={t('referenceSignalModeDesc')}
          >
            <Toggle
              checked={dev.referenceSignalMode}
              onChange={handleToggle(dev.setReferenceSignalMode)}
              disabled={!dev.diagnosticsEnabled}
            />
          </SettingRow>
        </CollapsibleSection>
      </Box>

      {/* ── Danger Zone ────────────────────────────────────────────────── */}
      <DangerZoneSubsection />
    </Box>
  );
}

function DangerZoneSubsection() {
  const { theme } = useTheme();
  const tc = theme.colors;
  const { t } = useTranslation('settings');
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
        {t('dangerZone')}
      </Text>

      <Card style={{ padding: 16, borderColor: tc.status.danger, borderWidth: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: tc.text.primary, marginBottom: 4 }}>
          {t('fullBrowserReset')}
        </Text>
        <Text style={{ fontSize: 12, color: tc.text.secondary, lineHeight: 18, marginBottom: 12 }}>
          {t('fullBrowserResetDesc')}
        </Text>
        <Button variant="destructive" onPress={() => setShowConfirm(true)}>
          {t('resetAllBrowserData')}
        </Button>
      </Card>

      <Dialog
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        title={t('confirmFullReset')}
        icon={<TrashIcon size={24} color={tc.status.danger} />}
        size="sm"
        footer={
          <HStack gap="sm" style={{ justifyContent: 'flex-end' }}>
            <Button variant="tertiary" onPress={() => setShowConfirm(false)} disabled={isResetting}>
              {t('cancel')}
            </Button>
            <Button
              variant="secondary"
              onPress={handleReset}
              style={{ borderColor: tc.status.dangerBorder, backgroundColor: tc.status.dangerSurface }}
              disabled={isResetting}
            >
              <Text style={{ color: tc.status.danger, fontWeight: '600', fontSize: 14 }}>
                {isResetting ? t('resettingButton') : t('confirmResetButton')}
              </Text>
            </Button>
          </HStack>
        }
      >
        <Box style={{ gap: 12 }}>
          <Text style={{ fontSize: 13, color: tc.text.secondary, lineHeight: 18 }}>
            {t('resetConfirmWarning')}
          </Text>
          <Box style={{ backgroundColor: tc.status.dangerSurface, borderRadius: 8, padding: 12, borderWidth: 1, borderColor: tc.status.dangerBorder }}>
            <Text style={{ fontSize: 12, color: tc.status.danger, fontWeight: '600' }}>
              {t('resetWarningMessage')}
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
  const { t } = useTranslation('settings');
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
      <Text style={{ fontSize: 20, fontWeight: '700', color: tc.text.primary, marginBottom: 20 }}>{t('sectionAbout')}</Text>

      <Card style={{ padding: 16, marginBottom: 16 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: tc.text.primary, marginBottom: 12 }}>
          {t('appName')}
        </Text>

        <Text style={labelStyle}>{t('appVersionLabel')}</Text>
        <Text style={valueStyle}>{update.currentVersion}</Text>

        {coreVersion ? (
          <>
            <Text style={labelStyle}>{t('coreVersionLabel')}</Text>
            <Text style={valueStyle}>{coreVersion}</Text>
          </>
        ) : null}

        <Text style={labelStyle}>{t('latestAvailableLabel')}</Text>
        <Text style={valueStyle}>
          {update.isLoading ? t('checkingVersion') : update.latestVersion || update.currentVersion}
          {update.hasUpdate && !update.isWebUser && (
            <Text style={{ color: tc.status.success, fontSize: 12 }}> {t('updateAvailable')}</Text>
          )}
        </Text>

        <HStack gap={8} style={{ marginTop: 4 }}>
          <Button
            variant="secondary"
            size="sm"
            onPress={update.checkForUpdate}
          >
            {t('checkForUpdates')}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onPress={() => setShowAllPlatforms(true)}
            iconLeft={<DownloadIcon size={14} color={tc.text.secondary} />}
          >
            {t('allDownloads')}
          </Button>
        </HStack>
      </Card>

      <Card style={{ padding: 16, marginBottom: 16 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: tc.text.primary, marginBottom: 10 }}>{t('links')}</Text>

        <Pressable
          onPress={() => {
            Linking.openURL('https://github.com/InfamousVague/Umbra');
          }}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 }}
        >
          <ExternalLinkIcon size={14} color={tc.text.link} />
          <Text style={{ fontSize: 13, color: tc.text.link }}>{t('githubRepository')}</Text>
        </Pressable>

        {update.releaseUrl && (
          <Pressable
            onPress={() => Linking.openURL(update.releaseUrl!)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 }}
          >
            <ExternalLinkIcon size={14} color={tc.text.link} />
            <Text style={{ fontSize: 13, color: tc.text.link }}>{t('releaseNotes')}</Text>
          </Pressable>
        )}

        <Pressable
          onPress={() => Linking.openURL('https://umbra.chat')}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 }}
        >
          <GlobeIcon size={14} color={tc.text.link} />
          <Text style={{ fontSize: 13, color: tc.text.link }}>{t('webApp')}</Text>
        </Pressable>
      </Card>

      <Card style={{ padding: 16 }}>
        <Text style={{ fontSize: 12, color: tc.text.muted, lineHeight: 18 }}>
          {t('aboutDescription')}
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
  const { t } = useTranslation('settings');

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
          {mode === 'bubble' ? t('bubbles') : t('inline')}
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
  const { t } = useTranslation('settings');
  const { displayMode, setDisplayMode } = useMessaging();

  return (
    <Box style={{ gap: 20 }}>
      <SectionHeader
        title={t('sectionMessaging')}
        description={t('sectionMessagingDesc')}
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
          {t('displayStyle')}
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
            ? t('bubbleDisplayDesc')
            : t('inlineDisplayDesc')}
        </Text>
      </Box>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// SettingsDialog
// ---------------------------------------------------------------------------

export function SettingsDialog({ open, onClose, onOpenMarketplace, initialSection, inline }: SettingsDialogProps) {
  if (__DEV__) dbg.trackRender('SettingsDialog');
  const { theme, mode } = useTheme();
  const tc = theme.colors;
  const isDark = mode === 'dark';
  const isMobile = useIsMobile();
  const { t } = useTranslation('settings');
  const insets = Platform.OS !== 'web' ? useSafeAreaInsets() : { top: 0, bottom: 0, left: 0, right: 0 };
  const [mobileShowSidebar, setMobileShowSidebar] = useState(true);

  // Translated labels for NAV_ITEMS (module-level constant can't use hooks)
  const navLabels: Record<SettingsSection, string> = useMemo(() => ({
    account: t('sectionAccount'),
    appearance: t('sectionAppearance'),
    messaging: t('sectionMessaging'),
    notifications: t('sectionNotifications'),
    sounds: t('sectionSounds'),
    privacy: t('sectionPrivacy'),
    'audio-video': t('sectionAudioVideo'),
    network: t('sectionNetwork'),
    data: t('sectionData'),
    plugins: t('sectionPlugins'),
    'keyboard-shortcuts': t('sectionShortcuts'),
    about: t('sectionAbout'),
    developer: t('sectionDeveloper'),
  }), [t]);

  // Translated labels for SUBCATEGORIES (module-level constant can't use hooks)
  const subLabels: Record<string, string> = useMemo(() => ({
    profile: t('subProfile'),
    identity: t('subIdentity'),
    sharing: t('subSharing'),
    sync: t('subSync'),
    danger: t('subDangerZone'),
    theme: t('subTheme'),
    'dark-mode': t('subDarkMode'),
    colors: t('subColors'),
    'text-size': t('subTextSize'),
    font: t('subFont'),
    language: t('subLanguage'),
    discovery: t('subFriendDiscovery'),
    visibility: t('subVisibility'),
    security: t('subSecurity'),
    calling: t('subCalling'),
    video: t('subVideo'),
    audio: t('subAudio'),
    devices: t('subDevices'),
    connection: t('subConnection'),
    relays: t('subRelays'),
    peers: t('subPeers'),
    diagnostics: t('subCallDiagnostics'),
    capture: t('subMediaCapture'),
    testing: t('subTesting'),
  }), [t]);

  // Always call useSettingsNavigation (can't call hooks conditionally),
  // but only use its values when inline is true.
  const settingsNav = useSettingsNavigation();

  const [localSection, setLocalSection] = useState<SettingsSection>('account');
  const [localSubsection, setLocalSubsection] = useState<string | null>(
    SUBCATEGORIES.account ? SUBCATEGORIES.account[0].id : null,
  );

  const activeSection = inline ? settingsNav.activeSection : localSection;
  const activeSubsection = inline ? settingsNav.activeSubsection : localSubsection;
  const setActiveSection = inline
    ? (s: SettingsSection) => settingsNav.setActiveSection(s)
    : setLocalSection;
  const setActiveSubsection = inline
    ? (s: string | null) => settingsNav.setActiveSection(settingsNav.activeSection, s)
    : setLocalSubsection;

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

  // Helper to set both section + subsection atomically (avoids stale closure in inline mode)
  const setSectionAndSub = useCallback((sectionId: SettingsSection, subId: string | null) => {
    if (inline) {
      settingsNav.setActiveSection(sectionId, subId);
    } else {
      setLocalSection(sectionId);
      setLocalSubsection(subId);
    }
  }, [inline, settingsNav]);

  const handleSectionChange = useCallback((sectionId: SettingsSection) => {
    const subs = SUBCATEGORIES[sectionId];
    const firstSub = subs ? subs[0].id : null;
    // On desktop: crossfade content when switching sections
    if (!isMobile && !isFadingRef.current) {
      isFadingRef.current = true;
      Animated.timing(contentOpacity, {
        toValue: 0,
        duration: 100,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start(() => {
        setSectionAndSub(sectionId, firstSub);
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
      setSectionAndSub(sectionId, firstSub);
    }
    if (isMobile) setMobileShowSidebar(false);
  }, [isMobile, contentOpacity, setSectionAndSub]);

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
      backgroundColor: isDark ? 'rgba(30, 30, 34, 0.98)' : 'rgba(255, 255, 255, 0.97)',
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
      fontSize: 11,
      fontWeight: '600',
      color: tc.text.onRaisedSecondary ?? tc.text.secondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      paddingHorizontal: 12,
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
      <Box style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: isMobile ? 8 : 0, paddingTop: 4 }}>
        <Text style={sidebarTitleStyle}>{t('title')}</Text>
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
              accessibilityActions={[{ name: 'activate', label: navLabels[item.id] }]}
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
                {navLabels[item.id]}
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
                          {subLabels[sub.id] ?? sub.label}
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
            {navLabels[activeSection] ?? t('title')}
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

  // Inline mode: render content pane only (no modal wrapper).
  // The sidebar navigation is handled by SettingsNavSidebar.
  if (inline) {
    return (
      <Box style={{ flex: 1 }}>
        <ScrollView
          ref={contentScrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 28 }}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: contentOpacity }} testID={SECTION_TEST_IDS[activeSection]}>
            {renderSection()}
          </Animated.View>
        </ScrollView>
      </Box>
    );
  }

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
