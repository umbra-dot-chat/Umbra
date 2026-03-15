/**
 * PluginMarketplace — Browse, search, install, and manage plugins, themes, and fonts.
 *
 * Sidebar-based layout (mirroring the Guide dialog) with sections:
 * - Plugins: browse, install, manage plugin extensions
 * - Themes: community colour themes (coming soon)
 * - Fonts: custom font packs (coming soon)
 */

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Text as RNText, Pressable, ScrollView, Platform, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Box,
  Text,
  Spinner,
  ScrollArea,
  Overlay,
  Button,
  Input,
  Separator,
  Toggle,
  Tag,
  useTheme,
  SearchInput,
} from '@coexist/wisp-react-native';
import { usePlugins } from '@/contexts/PluginContext';
import { useFonts, FONT_REGISTRY, loadGoogleFont, getFontFamily } from '@/contexts/FontContext';
import { useAppTheme } from '@/contexts/ThemeContext';
import type { FontEntry } from '@/contexts/FontContext';
import {
  SearchIcon,
  ZapIcon,
  DownloadIcon,
  TrashIcon,
  XIcon,
  ArrowLeftIcon,
  ShieldIcon,
  GlobeIcon,
  DatabaseIcon,
  BellIcon,
  MessageIcon,
  UsersIcon,
  ExternalLinkIcon,
  AlertTriangleIcon,
  PuzzleIcon,
  PaletteIcon,
  ShoppingBagIcon,
  CheckIcon,
} from '@/components/ui';
import type { MarketplaceListing, PluginBranding } from '@umbra/plugin-runtime';
import type { PluginPermission, PluginInstance } from '@umbra/plugin-sdk';
import { TEST_IDS } from '@/constants/test-ids';
import { LinearGradient } from 'expo-linear-gradient';
import { dbg } from '@/utils/debug';
import { useMarketplaceNavigation } from '@/contexts/MarketplaceNavigationContext';

const SRC = 'PluginMarketplace';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface PluginMarketplaceProps {
  open: boolean;
  onClose: () => void;
  /** When true, renders content directly without Overlay wrapper (for inline route use). */
  inline?: boolean;
}

type Section = 'plugins' | 'themes' | 'fonts';
type PluginTab = 'browse' | 'installed';

interface SectionItem {
  id: Section;
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  color: string;
  secondaryColor: string;
}

const SECTIONS: SectionItem[] = [
  { id: 'plugins', label: 'Plugins', icon: PuzzleIcon, color: '#8B5CF6', secondaryColor: '#a78bfa' },
  { id: 'themes', label: 'Themes', icon: PaletteIcon, color: '#EC4899', secondaryColor: '#f472b6' },
  { id: 'fonts', label: 'Fonts', icon: FontIcon, color: '#3B82F6', secondaryColor: '#60a5fa' },
];

// Simple "A" icon for Fonts section
function FontIcon({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <Text style={{ fontSize: size, color: color ?? '#FFF', textAlign: 'center', lineHeight: size }} weight="bold">
      A
    </Text>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Plugin Branding Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Default branding when plugin has none specified. */
const DEFAULT_BRANDING: PluginBranding = {
  primaryColor: '#8B5CF6',
  secondaryColor: '#a78bfa',
};

/** Get resolved branding for a listing (with defaults). */
function getBranding(listing: MarketplaceListing): PluginBranding {
  return listing.branding ?? DEFAULT_BRANDING;
}

/** Get the display icon content — emoji or 2-letter monogram. */
function getPluginIconContent(branding: PluginBranding, name: string): string {
  if (branding.emoji) return branding.emoji;
  // Generate 2-letter monogram from first 2 words or first 2 chars
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

/** Map a tag to a category emoji for the dot badge. */
const CATEGORY_EMOJIS: Record<string, string> = {
  utility: '\u{1F527}',
  translation: '\u{1F310}',
  language: '\u{1F310}',
  system: '\u{2699}\u{FE0F}',
  monitor: '\u{1F4C8}',
  media: '\u{1F3AC}',
  customization: '\u{1F3A8}',
  security: '\u{1F512}',
  messages: '\u{1F4AC}',
  social: '\u{1F465}',
  productivity: '\u{26A1}',
  fun: '\u{1F389}',
  music: '\u{1F3B5}',
  gaming: '\u{1F3AE}',
};

function getCategoryEmoji(tags: string[]): string {
  for (const tag of tags) {
    const emoji = CATEGORY_EMOJIS[tag.toLowerCase()];
    if (emoji) return emoji;
  }
  return '\u{1F9E9}'; // puzzle piece fallback
}

/** Adjust a hex color's brightness for light/dark mode. */
function adjustColorForMode(hex: string, isDark: boolean): string {
  if (isDark) return hex; // Keep vibrant in dark mode
  // In light mode, darken slightly for readability
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const factor = 0.85;
  return `#${Math.round(r * factor).toString(16).padStart(2, '0')}${Math.round(g * factor).toString(16).padStart(2, '0')}${Math.round(b * factor).toString(16).padStart(2, '0')}`;
}

/** Plugin icon component — emoji/monogram on gradient rounded square. */
function PluginIcon({ branding, name, size = 44 }: { branding: PluginBranding; name: string; size?: number }) {
  const content = getPluginIconContent(branding, name);
  const isEmoji = branding.emoji != null;
  return (
    <LinearGradient
      colors={[branding.primaryColor, branding.secondaryColor]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ width: size, height: size, borderRadius: size * 0.25, alignItems: 'center', justifyContent: 'center' }}
    >
      <Text style={{ fontSize: isEmoji ? size * 0.5 : size * 0.4, color: '#FFF', textAlign: 'center', lineHeight: size * 0.65 }} weight={isEmoji ? undefined : 'bold'}>
        {content}
      </Text>
    </LinearGradient>
  );
}

/** Category dot badge overlapping the icon corner. */
function CategoryDot({ tags, primaryColor }: { tags: string[]; primaryColor: string }) {
  const emoji = getCategoryEmoji(tags);
  return (
    <Box style={{
      position: 'absolute', bottom: -3, right: -3,
      width: 16, height: 16, borderRadius: 8,
      backgroundColor: primaryColor,
      borderWidth: 2, borderColor: '#18181b',
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{ fontSize: 7, lineHeight: 10 }}>{emoji}</Text>
    </Box>
  );
}

/** Featured badge ribbon. */
function FeaturedBadge() {
  return (
    <LinearGradient
      colors={['#f59e0b', '#f97316']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, flexDirection: 'row', alignItems: 'center', gap: 3 }}
    >
      <Text style={{ fontSize: 8, lineHeight: 10 }}>{'\u{2B50}'}</Text>
      <Text style={{ fontSize: 9, color: '#FFF' }} weight="bold">Featured</Text>
    </LinearGradient>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Permission display helpers
// ─────────────────────────────────────────────────────────────────────────────

const PERMISSION_LABELS: Record<PluginPermission, { label: string; description: string }> = {
  'messages:read': { label: 'Read Messages', description: 'Read message content in conversations' },
  'messages:write': { label: 'Send Messages', description: 'Send messages on your behalf' },
  'friends:read': { label: 'Read Friends', description: 'Access your friends list' },
  'conversations:read': { label: 'Read Conversations', description: 'Access your conversation list' },
  'storage:kv': { label: 'Key-Value Storage', description: 'Store persistent data locally' },
  'storage:sql': { label: 'SQL Storage', description: 'Create and query local database tables' },
  'network:local': { label: 'Network Access', description: 'Make requests to external APIs' },
  'notifications': { label: 'Notifications', description: 'Show toast notifications' },
  'commands': { label: 'Commands', description: 'Register command palette entries' },
  'voice:read': { label: 'Voice Access', description: 'Access voice channel participants and audio streams' },
  'shortcuts': { label: 'Shortcuts', description: 'Register keyboard shortcuts' },
};

function getPermissionIcon(perm: PluginPermission, color: string) {
  switch (perm) {
    case 'messages:read':
    case 'messages:write':
      return <MessageIcon size={12} color={color} />;
    case 'friends:read':
      return <UsersIcon size={12} color={color} />;
    case 'conversations:read':
      return <MessageIcon size={12} color={color} />;
    case 'storage:kv':
    case 'storage:sql':
      return <DatabaseIcon size={12} color={color} />;
    case 'network:local':
      return <GlobeIcon size={12} color={color} />;
    case 'notifications':
      return <BellIcon size={12} color={color} />;
    case 'commands':
      return <ZapIcon size={12} color={color} />;
    default:
      return <ShieldIcon size={12} color={color} />;
  }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Font Preview Text — renders with its own font, immune to global override
// ─────────────────────────────────────────────────────────────────────────────

/**
 * On web, the global `* { font-family: ... !important }` override prevents
 * inline fontFamily styles from taking effect. This component uses a ref to
 * set the style directly with `!important` via `setProperty`, which wins over
 * the CSS `!important` rule because it applies at the element level.
 *
 * Accepts an optional `fontReady` flag so the parent can signal when the
 * Google Font file has finished loading, triggering a re-apply to ensure
 * the browser renders with the correct typeface.
 */
function FontPreviewText({ fontFamily, nativeFontName, fontReady, style, children }: {
  /** CSS font-family value for web (e.g. '"Inter", sans-serif') */
  fontFamily?: string;
  /** Native font name registered via expo-font (e.g. 'Inter') */
  nativeFontName?: string;
  fontReady?: boolean;
  style?: Record<string, any>;
  children: React.ReactNode;
}) {
  const ref = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS !== 'web' || !ref.current || !fontFamily) return;
    const el = ref.current as unknown as HTMLElement;
    // setProperty with !important priority beats the global CSS * rule
    el.style.setProperty('font-family', fontFamily, 'important');
  }, [fontFamily, fontReady]);

  // On native, use the registered font name directly; on web, the ref effect handles it
  const resolvedFamily = Platform.OS !== 'web' ? nativeFontName : undefined;

  return (
    <RNText
      ref={ref}
      style={[style, resolvedFamily ? { fontFamily: resolvedFamily } : undefined]}
      numberOfLines={1}
    >
      {children}
    </RNText>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Browse Tab — Listing Card
// ─────────────────────────────────────────────────────────────────────────────

function ListingCard({
  listing, isInstalled, isEnabled, installing, onInstall, onUninstall, onViewDetail,
}: {
  listing: MarketplaceListing; isInstalled: boolean; isEnabled: boolean;
  installing: boolean; onInstall: () => void; onUninstall: () => void; onViewDetail: () => void;
}) {
  const { theme, mode } = useTheme();
  const tc = theme.colors;
  const isDark = mode === 'dark';
  const branding = getBranding(listing);
  const pc = adjustColorForMode(branding.primaryColor, isDark);
  const sc = adjustColorForMode(branding.secondaryColor, isDark);

  return (
    <Pressable
      onPress={onViewDetail}
      style={({ pressed, hovered }: any) => ({
        borderRadius: 12, borderWidth: 1,
        borderColor: tc.border.subtle,
        backgroundColor: pressed ? tc.background.surface : tc.background.sunken,
        overflow: 'hidden',
        ...(Platform.OS === 'web' && hovered ? {
          transform: [{ translateY: -2 }],
          shadowColor: pc,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 12,
        } : {}),
      })}
    >
      {/* Top accent gradient stripe */}
      <LinearGradient
        colors={[pc, sc]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ height: 3, width: '100%' }}
      />
      <Box style={{ padding: 14, gap: 10 }}>
        <Box style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
          {/* Plugin icon with category dot */}
          <Box style={{ position: 'relative' }}>
            <PluginIcon branding={{ ...branding, primaryColor: pc, secondaryColor: sc }} name={listing.name} size={44} />
            <CategoryDot tags={listing.tags} primaryColor={pc} />
          </Box>
          <Box style={{ flex: 1 }}>
            <Box style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <Text size="sm" weight="semibold" style={{ color: tc.text.primary }}>{listing.name}</Text>
              <Text size="xs" style={{ color: tc.text.muted }}>v{listing.version}</Text>
              {branding.featured && <FeaturedBadge />}
            </Box>
            {branding.tagline ? (
              <Text size="xs" weight="medium" style={{ color: pc, marginTop: 1 }} numberOfLines={1}>{branding.tagline}</Text>
            ) : null}
            <Text size="xs" style={{ color: tc.text.secondary, marginTop: 2 }} numberOfLines={2}>{listing.description}</Text>
            <Box style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <Text size="xs" style={{ color: tc.text.muted }}>{listing.author.name}</Text>
              {listing.downloads > 0 && (
                <>
                  <Text size="xs" style={{ color: tc.text.muted }}>{'\u00B7'}</Text>
                  <Box style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                    <DownloadIcon size={10} color={tc.text.muted} />
                    <Text size="xs" style={{ color: tc.text.muted }}>{listing.downloads.toLocaleString()}</Text>
                  </Box>
                </>
              )}
              {listing.size > 0 && (
                <>
                  <Text size="xs" style={{ color: tc.text.muted }}>{'\u00B7'}</Text>
                  <Text size="xs" style={{ color: tc.text.muted }}>{formatSize(listing.size)}</Text>
                </>
              )}
            </Box>
          </Box>
          <Box style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
            {isInstalled ? (
              <Box style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, backgroundColor: isEnabled ? `${tc.status.success}20` : `${tc.text.muted}20` }}>
                <Text size="xs" weight="semibold" style={{ color: isEnabled ? tc.status.success : tc.text.muted }}>
                  {isEnabled ? 'Installed' : 'Disabled'}
                </Text>
              </Box>
            ) : (
              <Pressable
                onPress={(e) => { e?.stopPropagation?.(); onInstall(); }}
                disabled={installing}
                style={{ overflow: 'hidden', borderRadius: 6 }}
              >
                <LinearGradient
                  colors={installing ? [tc.text.muted, tc.text.muted] : [pc, sc]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6 }}
                >
                  {!installing && <DownloadIcon size={12} color="#FFF" />}
                  <Text size="xs" weight="semibold" style={{ color: '#FFF' }}>
                    {installing ? 'Installing...' : 'Install'}
                  </Text>
                </LinearGradient>
              </Pressable>
            )}
          </Box>
        </Box>
        <Box style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
          {/* Platform badges */}
          {listing.platforms && listing.platforms.length > 0 && (
            <PlatformBadges platforms={listing.platforms} />
          )}
          {listing.tags.length > 0 && listing.tags.slice(0, 4).map((tag) => {
            const isCategoryTag = CATEGORY_EMOJIS[tag.toLowerCase()] != null;
            return (
              <Tag key={tag} size="sm" style={{
                borderRadius: 6,
                ...(isCategoryTag ? { backgroundColor: `${pc}18` } : {}),
              }}>
                <Text style={{ fontSize: 10, color: isCategoryTag ? pc : tc.text.muted }}>{tag}</Text>
              </Tag>
            );
          })}
        </Box>
      </Box>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Platform Badges — visual indicator for supported platforms
// ─────────────────────────────────────────────────────────────────────────────

const PLATFORM_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  web: { label: 'Web', color: '#3B82F6', icon: '\u{1F310}' },
  desktop: { label: 'Desktop', color: '#8B5CF6', icon: '\u{1F5A5}' },
  mobile: { label: 'Mobile', color: '#10B981', icon: '\u{1F4F1}' },
};

function PlatformBadges({ platforms }: { platforms: string[] }) {
  const { theme } = useTheme();
  const tc = theme.colors;

  // If all three platforms, show a single "Cross-platform" badge
  if (platforms.length >= 3 && platforms.includes('web') && platforms.includes('desktop') && platforms.includes('mobile')) {
    return (
      <Box style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: 'rgba(16,185,129,0.15)' }}>
        <Text style={{ fontSize: 9 }}>{'\u{2728}'}</Text>
        <Text style={{ fontSize: 10, color: '#10B981' }} weight="semibold">Cross-platform</Text>
      </Box>
    );
  }

  return (
    <>
      {platforms.map((p) => {
        const config = PLATFORM_CONFIG[p];
        if (!config) return null;
        return (
          <Box key={p} style={{ flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4, backgroundColor: `${config.color}15` }}>
            <Text style={{ fontSize: 9 }}>{config.icon}</Text>
            <Text style={{ fontSize: 10, color: config.color }} weight="medium">{config.label}</Text>
          </Box>
        );
      })}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Installed Plugin Card
// ─────────────────────────────────────────────────────────────────────────────

function InstalledPluginCard({
  plugin, listing, onToggle, onUninstall, onViewDetail,
}: {
  plugin: PluginInstance; listing?: MarketplaceListing; onToggle: () => void; onUninstall: () => void; onViewDetail: () => void;
}) {
  const { theme, mode } = useTheme();
  const tc = theme.colors;
  const isDark = mode === 'dark';
  const [confirmUninstall, setConfirmUninstall] = useState(false);
  const branding = listing ? getBranding(listing) : DEFAULT_BRANDING;
  const pc = adjustColorForMode(branding.primaryColor, isDark);
  const sc = adjustColorForMode(branding.secondaryColor, isDark);
  const isEnabled = plugin.state === 'enabled';

  return (
    <Box style={{ borderRadius: 12, borderWidth: 1, borderColor: tc.border.subtle, backgroundColor: tc.background.sunken, overflow: 'hidden' }}>
      {/* Accent stripe — vibrant when enabled, muted when disabled */}
      <LinearGradient
        colors={isEnabled ? [pc, sc] : [tc.text.muted, tc.text.muted]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ height: 3, width: '100%', opacity: isEnabled ? 1 : 0.3 }}
      />
      <Box style={{ padding: 14, gap: 10 }}>
        <Box style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Box style={{ opacity: isEnabled ? 1 : 0.5 }}>
            <PluginIcon branding={{ ...branding, primaryColor: pc, secondaryColor: sc }} name={plugin.manifest.name} size={36} />
          </Box>
          <Pressable onPress={onViewDetail} style={{ flex: 1 }}>
            <Text size="sm" weight="semibold" style={{ color: tc.text.primary }}>{plugin.manifest.name}</Text>
            <Text size="xs" style={{ color: tc.text.secondary }} numberOfLines={1}>v{plugin.manifest.version} · {plugin.manifest.author.name}</Text>
            {plugin.state === 'error' && plugin.error && (
              <Text size="xs" style={{ color: tc.status.danger, marginTop: 2 }} numberOfLines={1}>Error: {plugin.error}</Text>
            )}
          </Pressable>
          <Toggle checked={isEnabled} onChange={onToggle} size="sm" />
        </Box>
        {confirmUninstall ? (
          <Box style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 4 }}>
            <Text size="xs" style={{ color: tc.status.danger, flex: 1 }}>Remove this plugin and its data?</Text>
            <Button size="xs" variant="destructive" onPress={() => { onUninstall(); setConfirmUninstall(false); }}>
              Remove
            </Button>
            <Button size="xs" variant="tertiary" onPress={() => setConfirmUninstall(false)}>Cancel</Button>
          </Box>
        ) : (
          <Box style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
            <Button size="xs" variant="tertiary" onPress={() => setConfirmUninstall(true)} iconLeft={<TrashIcon size={12} color={tc.text.muted} />}>
              Uninstall
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Detail View
// ─────────────────────────────────────────────────────────────────────────────

function PluginDetailView({
  listing, plugin, installing, onInstall, onUninstall, onToggle, onBack,
}: {
  listing: MarketplaceListing; plugin?: PluginInstance; installing: boolean;
  onInstall: () => void; onUninstall: () => void; onToggle: () => void; onBack: () => void;
}) {
  const { theme, mode } = useTheme();
  const tc = theme.colors;
  const isDark = mode === 'dark';
  const isInstalled = !!plugin;
  const branding = getBranding(listing);
  const pc = adjustColorForMode(branding.primaryColor, isDark);
  const sc = adjustColorForMode(branding.secondaryColor, isDark);
  const iconContent = getPluginIconContent(branding, listing.name);

  return (
    <ScrollArea style={{ flex: 1 }} contentContainerStyle={{ gap: 20 }}>
      {/* Back button */}
      <Button variant="tertiary" onPress={onBack} iconLeft={<ArrowLeftIcon size={16} color={tc.text.secondary} />} style={{ alignSelf: 'flex-start', marginLeft: 24, marginTop: 16 }}>
        Back
      </Button>

      {/* Gradient banner header */}
      <Box style={{ marginHorizontal: 16, borderRadius: 16, overflow: 'hidden' }}>
        <LinearGradient
          colors={[pc, sc]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ height: 140, justifyContent: 'flex-end', padding: 16, position: 'relative' }}
        >
          {/* Faded emoji watermark */}
          <Text style={{ position: 'absolute', top: 16, right: 20, fontSize: 56, opacity: 0.2 }}>
            {iconContent}
          </Text>
          {branding.featured && (
            <Box style={{ position: 'absolute', top: 12, left: 12 }}>
              <FeaturedBadge />
            </Box>
          )}
          <Box style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 14 }}>
            <Box style={{ borderWidth: 3, borderColor: isDark ? '#1e1e22' : '#fff', borderRadius: 16, overflow: 'hidden' }}>
              <PluginIcon branding={branding} name={listing.name} size={56} />
            </Box>
            <Box style={{ flex: 1, paddingBottom: 2 }}>
              <Text size="lg" weight="bold" style={{ color: '#FFF' }}>{listing.name}</Text>
              <Text size="sm" style={{ color: 'rgba(255,255,255,0.8)', marginTop: 1 }}>by {listing.author.name} · v{listing.version}</Text>
            </Box>
          </Box>
        </LinearGradient>
      </Box>

      <Box style={{ paddingHorizontal: 24, gap: 20 }}>
        {/* Tagline */}
        {branding.tagline && (
          <Text size="sm" weight="medium" style={{ color: pc, fontStyle: 'italic' }}>{branding.tagline}</Text>
        )}

        {/* Stats row */}
        <Box style={{ flexDirection: 'row', gap: 0 }}>
          {listing.downloads > 0 && (
            <Box style={{ flex: 1, alignItems: 'center', gap: 2 }}>
              <Text style={{ fontSize: 10, color: tc.text.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Downloads</Text>
              <Text size="md" weight="bold" style={{ color: tc.text.primary }}>{listing.downloads.toLocaleString()}</Text>
            </Box>
          )}
          {listing.rating != null && (
            <Box style={{ flex: 1, alignItems: 'center', gap: 2 }}>
              <Text style={{ fontSize: 10, color: tc.text.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Rating</Text>
              <Box style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text size="sm">{'\u2B50'}</Text>
                <Text size="md" weight="bold" style={{ color: tc.text.primary }}>{listing.rating.toFixed(1)}</Text>
              </Box>
            </Box>
          )}
          {listing.size > 0 && (
            <Box style={{ flex: 1, alignItems: 'center', gap: 2 }}>
              <Text style={{ fontSize: 10, color: tc.text.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Size</Text>
              <Text size="md" weight="bold" style={{ color: tc.text.primary }}>{formatSize(listing.size)}</Text>
            </Box>
          )}
        </Box>

        {/* Actions */}
        <Box style={{ flexDirection: 'row', gap: 8 }}>
          {isInstalled ? (
            <>
              <Button size="sm" variant={plugin.state === 'enabled' ? 'secondary' : 'primary'} onPress={onToggle} style={{ flex: 1 }}>
                {plugin.state === 'enabled' ? 'Disable' : 'Enable'}
              </Button>
              <Button size="sm" variant="destructive" onPress={onUninstall} iconLeft={<TrashIcon size={14} color={tc.text.onAccent} />}>
                Uninstall
              </Button>
            </>
          ) : (
            <Pressable onPress={onInstall} disabled={installing} style={{ flex: 1, borderRadius: 8, overflow: 'hidden' }}>
              <LinearGradient
                colors={installing ? [tc.text.muted, tc.text.muted] : [pc, sc]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10 }}
              >
                {!installing && <DownloadIcon size={14} color="#FFF" />}
                <Text size="sm" weight="semibold" style={{ color: '#FFF' }}>
                  {installing ? 'Installing...' : 'Install Plugin'}
                </Text>
              </LinearGradient>
            </Pressable>
          )}
        </Box>
      {listing.author.url && (
        <Box style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <ExternalLinkIcon size={11} color={pc} />
          <Text size="xs" style={{ color: pc }}>{listing.author.url}</Text>
        </Box>
      )}

      <Separator spacing="sm" />
      <Box style={{ gap: 6 }}>
        <Text size="sm" weight="semibold" style={{ color: tc.text.primary }}>Description</Text>
        <Text size="sm" style={{ color: tc.text.secondary, lineHeight: 20 }}>{listing.description}</Text>
      </Box>
      <Box style={{ gap: 4 }}>
        <Text size="xs" style={{ color: tc.text.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Platforms</Text>
        <Box style={{ flexDirection: 'row', gap: 4, flexWrap: 'wrap' }}>
          <PlatformBadges platforms={listing.platforms} />
        </Box>
      </Box>
      {listing.permissions && listing.permissions.length > 0 && (
        <Box style={{ gap: 8 }}>
          <Box style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <ShieldIcon size={14} color={tc.text.secondary} />
            <Text size="sm" weight="semibold" style={{ color: tc.text.primary }}>Permissions</Text>
          </Box>
          <Box style={{ gap: 6 }}>
            {listing.permissions.map((perm) => {
              const info = PERMISSION_LABELS[perm];
              return (
                <Box key={perm} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, backgroundColor: tc.background.sunken }}>
                  {getPermissionIcon(perm, tc.text.muted)}
                  <Box style={{ flex: 1 }}>
                    <Text size="xs" weight="medium" style={{ color: tc.text.primary }}>{info?.label ?? perm}</Text>
                    {info?.description && <Text size="xs" style={{ color: tc.text.muted }}>{info.description}</Text>}
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>
      )}
      {listing.tags.length > 0 && (
        <Box style={{ gap: 6 }}>
          <Text size="sm" weight="semibold" style={{ color: tc.text.primary }}>Tags</Text>
          <Box style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {listing.tags.map((tag) => {
              const isCategoryTag = CATEGORY_EMOJIS[tag.toLowerCase()] != null;
              return (
                <Tag key={tag} size="sm" style={{
                  borderRadius: 6,
                  ...(isCategoryTag ? { backgroundColor: `${pc}18` } : {}),
                }}>
                  <Text size="xs" style={{ color: isCategoryTag ? pc : tc.text.muted }}>{tag}</Text>
                </Tag>
              );
            })}
          </Box>
        </Box>
      )}
      </Box>
    </ScrollArea>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Coming Soon Placeholder
// ─────────────────────────────────────────────────────────────────────────────
// Fonts Content
// ─────────────────────────────────────────────────────────────────────────────

function FontCard({ font, isInstalled, isActive, isLoading, onInstall, onActivate }: {
  font: FontEntry; isInstalled: boolean; isActive: boolean; isLoading: boolean;
  onInstall: () => void; onActivate: () => void;
}) {
  const { theme, mode } = useTheme();
  const tc = theme.colors;
  const isDark = mode === 'dark';
  const [previewLoaded, setPreviewLoaded] = useState(false);

  // Load preview font on mount — works on both web and native.
  // Web: injects a <link> stylesheet and waits via Font Loading API.
  // Native: downloads .ttf via expo-font (reuses loadGoogleFont from FontContext).
  useEffect(() => {
    if (font.id === 'system') { setPreviewLoaded(true); return; }

    if (Platform.OS === 'web') {
      if (typeof document === 'undefined') return;
      const previewText = 'The quick brown fox jumps over the lazy dog 0123456789';
      const url = `https://fonts.googleapis.com/css2?family=${font.family}:wght@400;700&display=swap&text=${encodeURIComponent(previewText)}`;
      const linkId = `font-preview-${font.id}`;
      if (document.getElementById(linkId)) {
        if ('fonts' in document) {
          const familyName = font.css.split(',')[0].trim();
          document.fonts.load(`400 16px ${familyName}`).then(() => setPreviewLoaded(true)).catch(() => setPreviewLoaded(true));
        } else {
          setPreviewLoaded(true);
        }
        return;
      }
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href = url;
      link.onload = () => {
        if ('fonts' in document) {
          const familyName = font.css.split(',')[0].trim();
          document.fonts.load(`400 16px ${familyName}`)
            .then(() => setPreviewLoaded(true))
            .catch(() => setPreviewLoaded(true));
        } else {
          setPreviewLoaded(true);
        }
      };
      link.onerror = () => setPreviewLoaded(true);
      document.head.appendChild(link);
    } else {
      // Native: load via expo-font (handles caching internally)
      loadGoogleFont(font)
        .then(() => setPreviewLoaded(true))
        .catch(() => setPreviewLoaded(true));
    }
  }, [font]);

  return (
    <Box style={{
      borderRadius: 10, borderWidth: 1,
      borderColor: isActive ? tc.accent.primary : tc.border.subtle,
      backgroundColor: isActive ? tc.accent.highlight : tc.background.sunken,
      padding: 14, gap: 10,
    }}>
      {/* Font preview — uses FontPreviewText to bypass global font override */}
      <Box style={{ minHeight: 48, justifyContent: 'center' }}>
        <FontPreviewText
          fontFamily={font.id === 'system' ? undefined : font.css}
          nativeFontName={font.id === 'system' ? undefined : font.name}
          fontReady={previewLoaded}
          style={{ fontSize: 22, fontWeight: '700' as const, color: tc.text.primary, opacity: previewLoaded ? 1 : 0.3 }}
        >
          The quick brown fox
        </FontPreviewText>
        <FontPreviewText
          fontFamily={font.id === 'system' ? undefined : font.css}
          nativeFontName={font.id === 'system' ? undefined : font.name}
          fontReady={previewLoaded}
          style={{ fontSize: 14, color: tc.text.secondary, marginTop: 2, opacity: previewLoaded ? 1 : 0.3 }}
        >
          jumps over the lazy dog — 0123456789
        </FontPreviewText>
      </Box>

      {/* Font info + action */}
      <Box style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box style={{ flex: 1 }}>
          <Text size="sm" weight="semibold" style={{ color: tc.text.primary }}>{font.name}</Text>
          <Text size="xs" style={{ color: tc.text.muted, textTransform: 'capitalize' }}>{font.category}</Text>
        </Box>
        {isActive ? (
          <Box style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, backgroundColor: `${tc.status.success}20` }}>
            <Text size="xs" weight="semibold" style={{ color: tc.status.success }}>Active</Text>
          </Box>
        ) : isInstalled ? (
          <Button size="xs" variant="secondary" onPress={onActivate}>
            Use Font
          </Button>
        ) : (
          <Button size="xs" variant="primary" onPress={onInstall} disabled={isLoading} iconLeft={isLoading ? undefined : <DownloadIcon size={12} color={tc.text.onAccent} />}>
            {isLoading ? 'Loading...' : 'Install'}
          </Button>
        )}
      </Box>
    </Box>
  );
}

const FONTS_PAGE_SIZE = 50;

function FontsContent() {
  const { theme, mode } = useTheme();
  const tc = theme.colors;
  const isDark = mode === 'dark';
  const { activeFont, fonts, featuredFonts, installedFontIds, loadingFontId, installFont, setActiveFont, catalogLoaded } = useFonts();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [visibleCount, setVisibleCount] = useState(FONTS_PAGE_SIZE);

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(FONTS_PAGE_SIZE);
  }, [search, categoryFilter]);

  const isSearching = search.trim().length > 0;

  const filteredFonts = useMemo(() => {
    let list = fonts;
    if (categoryFilter !== 'all') {
      list = list.filter((f) => f.category === categoryFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter((f) => f.name.toLowerCase().includes(q) || f.category.toLowerCase().includes(q));
    }
    return list;
  }, [fonts, categoryFilter, search]);

  const filteredFeatured = useMemo(() => {
    let list = featuredFonts;
    if (categoryFilter !== 'all') {
      list = list.filter((f) => f.category === categoryFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter((f) => f.name.toLowerCase().includes(q) || f.category.toLowerCase().includes(q));
    }
    return list;
  }, [featuredFonts, categoryFilter, search]);

  // For "All Google Fonts" — exclude featured, then paginate
  const catalogFonts = useMemo(() => {
    const featuredIds = new Set(featuredFonts.map((f) => f.id));
    return filteredFonts.filter((f) => !featuredIds.has(f.id));
  }, [filteredFonts, featuredFonts]);

  const visibleCatalog = catalogFonts.slice(0, visibleCount);
  const hasMore = visibleCount < catalogFonts.length;

  const categories = ['all', 'sans-serif', 'serif', 'monospace', 'display', 'handwriting'];

  const totalCount = fonts.length;

  return (
    <Box style={{ flex: 1, padding: 20 }}>
      {/* Header */}
      <Box style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: tc.text.primary, marginBottom: 4 }}>Fonts</Text>
        <Text style={{ fontSize: 13, color: tc.text.secondary }}>
          {catalogLoaded
            ? `Choose from ${totalCount.toLocaleString()} Google Fonts to personalize your Umbra experience.`
            : `Choose from ${featuredFonts.length} curated typefaces. Loading full catalog...`}
        </Text>
      </Box>

      {/* Search */}
      <Box style={{ marginBottom: 12 }}>
        <SearchInput value={search} onValueChange={setSearch} placeholder="Search fonts..." size="sm" fullWidth onClear={() => setSearch('')} gradientBorder />
      </Box>

      {/* Category filter */}
      <Box style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
        {categories.map((cat) => (
          <Pressable
            key={cat}
            onPress={() => setCategoryFilter(cat)}
            style={{
              paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6,
              backgroundColor: categoryFilter === cat ? tc.accent.primary : (isDark ? tc.background.raised : tc.background.sunken),
              borderWidth: categoryFilter === cat ? 0 : (isDark ? 0 : 1),
              borderColor: tc.border.subtle,
            }}
          >
            <Text style={{
              fontSize: 12,
              color: categoryFilter === cat ? tc.text.onAccent : tc.text.secondary,
              textTransform: 'capitalize',
            }} weight={categoryFilter === cat ? 'semibold' : undefined}>
              {cat === 'all' ? 'All' : cat}
            </Text>
          </Pressable>
        ))}
      </Box>

      {/* Font list */}
      <ScrollArea style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 20 }}>
        {/* Featured section */}
        {filteredFeatured.length > 0 && (
          <>
            <Text style={{ fontSize: 13, fontWeight: '600', color: tc.text.secondary, marginBottom: 4, marginTop: 2 }}>
              {isSearching ? `Featured (${filteredFeatured.length})` : `Featured (${featuredFonts.length})`}
            </Text>
            {filteredFeatured.map((font) => (
              <FontCard
                key={font.id}
                font={font}
                isInstalled={installedFontIds.has(font.id)}
                isActive={activeFont.id === font.id}
                isLoading={loadingFontId === font.id}
                onInstall={() => installFont(font.id)}
                onActivate={() => setActiveFont(font.id)}
              />
            ))}
          </>
        )}

        {/* All Google Fonts section */}
        {catalogLoaded && catalogFonts.length > 0 && (
          <>
            <Box style={{ marginTop: 16, marginBottom: 4 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: tc.text.secondary }}>
                All Google Fonts ({catalogFonts.length.toLocaleString()})
              </Text>
            </Box>
            {visibleCatalog.map((font) => (
              <FontCard
                key={font.id}
                font={font}
                isInstalled={installedFontIds.has(font.id)}
                isActive={activeFont.id === font.id}
                isLoading={loadingFontId === font.id}
                onInstall={() => installFont(font.id)}
                onActivate={() => setActiveFont(font.id)}
              />
            ))}
            {hasMore && (
              <Pressable
                onPress={() => setVisibleCount((prev) => prev + FONTS_PAGE_SIZE)}
                style={{
                  paddingVertical: 12,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: tc.border.subtle,
                  alignItems: 'center',
                  marginTop: 4,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: tc.accent.primary }}>
                  Load More ({(catalogFonts.length - visibleCount).toLocaleString()} remaining)
                </Text>
              </Pressable>
            )}
          </>
        )}

        {/* Loading indicator for catalog */}
        {!catalogLoaded && (
          <Box style={{ alignItems: 'center', paddingVertical: 20, gap: 8 }}>
            <Spinner size="sm" />
            <Text style={{ fontSize: 12, color: tc.text.muted }}>Loading full Google Fonts catalog...</Text>
          </Box>
        )}

        {/* Empty state */}
        {filteredFeatured.length === 0 && (catalogLoaded ? catalogFonts.length === 0 : true) && (
          <Box style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Text style={{ fontSize: 14, color: tc.text.muted }}>No fonts match your search.</Text>
          </Box>
        )}
      </ScrollArea>
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Themes Content
// ─────────────────────────────────────────────────────────────────────────────

function ThemeCard({
  theme,
  isInstalled,
  isActive,
  onInstall,
  onActivate,
  onUninstall,
}: {
  theme: { id: string; name: string; description: string; author: string; swatches: string[] };
  isInstalled: boolean;
  isActive: boolean;
  onInstall: () => void;
  onActivate: () => void;
  onUninstall: () => void;
}) {
  const { theme: wispTheme, mode } = useTheme();
  const tc = wispTheme.colors;
  const isDark = mode === 'dark';
  const [showUninstallConfirm, setShowUninstallConfirm] = useState(false);

  return (
    <Box
      style={{
        borderRadius: 10,
        borderWidth: 1,
        borderColor: isActive ? tc.accent.primary : tc.border.subtle,
        backgroundColor: isActive ? tc.accent.highlight : tc.background.sunken,
        padding: 14,
        gap: 12,
      }}
    >
      {/* Swatch preview row */}
      <Box style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
        {theme.swatches.map((color, i) => (
          <Box
            key={i}
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: color,
              borderWidth: 1,
              borderColor: tc.border.subtle,
            }}
          />
        ))}
      </Box>

      {/* Theme info + action */}
      <Box style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <Box style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: tc.text.primary }}>{theme.name}</Text>
          <Text style={{ fontSize: 12, color: tc.text.secondary, marginTop: 2 }} numberOfLines={2}>
            {theme.description}
          </Text>
          <Text style={{ fontSize: 11, color: tc.text.muted, marginTop: 4 }}>by {theme.author}</Text>
        </Box>
        <Box style={{ alignItems: 'flex-end', gap: 6 }}>
          {isActive ? (
            <Box style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, backgroundColor: `${tc.status.success}20` }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: tc.status.success }}>Active</Text>
            </Box>
          ) : isInstalled ? (
            <Button size="xs" variant="secondary" onPress={onActivate}>
              Use Theme
            </Button>
          ) : (
            <Button
              size="xs"
              variant="primary"
              onPress={onInstall}
              iconLeft={<DownloadIcon size={12} color={tc.text.onAccent} />}
            >
              Install
            </Button>
          )}
        </Box>
      </Box>

      {/* Uninstall option for installed themes */}
      {isInstalled && !isActive && (
        showUninstallConfirm ? (
          <Box style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 11, color: tc.status.danger, flex: 1 }}>Remove this theme?</Text>
            <Button
              size="xs"
              variant="destructive"
              onPress={() => {
                onUninstall();
                setShowUninstallConfirm(false);
              }}
            >
              Remove
            </Button>
            <Button size="xs" variant="tertiary" onPress={() => setShowUninstallConfirm(false)}>
              Cancel
            </Button>
          </Box>
        ) : (
          <Box style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
            <Button
              size="xs"
              variant="tertiary"
              onPress={() => setShowUninstallConfirm(true)}
              iconLeft={<TrashIcon size={11} color={tc.text.muted} />}
            >
              Uninstall
            </Button>
          </Box>
        )
      )}
    </Box>
  );
}

function ThemesContent() {
  const { theme, mode } = useTheme();
  const tc = theme.colors;
  const isDark = mode === 'dark';
  const {
    activeTheme,
    themes,
    installedThemeIds,
    installTheme,
    uninstallTheme,
    setTheme,
  } = useAppTheme();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'browse' | 'installed'>('browse');

  const filteredThemes = useMemo(() => {
    let list = themes;
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.author.toLowerCase().includes(q)
      );
    }
    return list;
  }, [themes, search]);

  const installedThemes = useMemo(() => {
    return themes.filter((t) => installedThemeIds.has(t.id));
  }, [themes, installedThemeIds]);

  const handleInstall = useCallback(
    (id: string) => {
      installTheme(id);
    },
    [installTheme]
  );

  const handleActivate = useCallback(
    (id: string) => {
      setTheme(id);
    },
    [setTheme]
  );

  const handleUninstall = useCallback(
    (id: string) => {
      uninstallTheme(id);
    },
    [uninstallTheme]
  );

  return (
    <Box style={{ flex: 1, padding: 20 }}>
      {/* Header */}
      <Box style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: tc.text.primary, marginBottom: 4 }}>
          Themes
        </Text>
        <Text style={{ fontSize: 13, color: tc.text.secondary }}>
          Customize Umbra with {themes.length} community colour themes. Install your favorites and switch between them anytime.
        </Text>
      </Box>

      {/* Tabs */}
      <Box style={{ flexDirection: 'row', gap: 4, marginBottom: 12 }}>
        {(['browse', 'installed'] as const).map((t) => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 7,
              borderRadius: 6,
              backgroundColor: tab === t ? tc.accent.primary : 'transparent',
            }}
          >
            <Text
              style={{
                fontSize: 13,
                color: tab === t ? tc.text.onAccent : tc.text.secondary,
              }}
              weight={tab === t ? 'semibold' : undefined}
            >
              {t === 'browse' ? 'Browse' : `Installed (${installedThemeIds.size})`}
            </Text>
          </Pressable>
        ))}
      </Box>

      {tab === 'browse' ? (
        <>
          {/* Search */}
          <Box style={{ marginBottom: 12 }}>
            <SearchInput
              value={search}
              onValueChange={setSearch}
              placeholder="Search themes..."
              size="sm"
              fullWidth
              onClear={() => setSearch('')}
              gradientBorder
            />
          </Box>

          {/* Theme list */}
          <ScrollArea
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ gap: 10, paddingBottom: 20 }}
          >
            {filteredThemes.map((t) => (
              <ThemeCard
                key={t.id}
                theme={t}
                isInstalled={installedThemeIds.has(t.id)}
                isActive={activeTheme?.id === t.id}
                onInstall={() => handleInstall(t.id)}
                onActivate={() => handleActivate(t.id)}
                onUninstall={() => handleUninstall(t.id)}
              />
            ))}
            {filteredThemes.length === 0 && (
              <Box style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Text style={{ fontSize: 14, color: tc.text.muted }}>
                  No themes match your search.
                </Text>
              </Box>
            )}
          </ScrollArea>
        </>
      ) : (
        <ScrollArea
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ gap: 10, paddingBottom: 20 }}
        >
          {installedThemes.length === 0 ? (
            <Pressable
              onPress={() => setTab('browse')}
              style={({ pressed }) => ({
                padding: 24,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: tc.border.subtle,
                backgroundColor: pressed
                  ? tc.background.surface
                  : tc.background.sunken,
                alignItems: 'center',
                gap: 8,
              })}
            >
              <PaletteIcon size={24} color={tc.text.muted} />
              <Text style={{ fontSize: 14, fontWeight: '600', color: tc.text.primary }}>
                No themes installed
              </Text>
              <Text style={{ fontSize: 12, color: tc.text.secondary, textAlign: 'center' }}>
                Browse the marketplace to discover and install colour themes.
              </Text>
              <Text style={{ fontSize: 12, color: tc.accent.primary, fontWeight: '600', marginTop: 4 }}>
                Browse Themes
              </Text>
            </Pressable>
          ) : (
            <>
              {/* Reset to default option */}
              <Pressable
                onPress={() => setTheme(null)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  padding: 14,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: !activeTheme
                    ? tc.accent.primary
                    : tc.border.subtle,
                  backgroundColor: !activeTheme
                    ? tc.accent.highlight
                    : pressed
                      ? tc.background.surface
                      : tc.background.sunken,
                })}
              >
                <Box style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: tc.text.primary }}>
                    Default Theme
                  </Text>
                  <Text style={{ fontSize: 12, color: tc.text.secondary }}>
                    Use the standard Umbra colour palette
                  </Text>
                </Box>
                {!activeTheme && (
                  <Box style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, backgroundColor: `${tc.status.success}20` }}>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: tc.status.success }}>Active</Text>
                  </Box>
                )}
              </Pressable>

              {installedThemes.map((t) => (
                <ThemeCard
                  key={t.id}
                  theme={t}
                  isInstalled={true}
                  isActive={activeTheme?.id === t.id}
                  onInstall={() => {}}
                  onActivate={() => handleActivate(t.id)}
                  onUninstall={() => handleUninstall(t.id)}
                />
              ))}
            </>
          )}
        </ScrollArea>
      )}
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function ComingSoonContent({ title, description, icon: Icon, color }: { title: string; description: string; icon: React.ComponentType<{ size?: number; color?: string }>; color: string }) {
  const { theme, mode } = useTheme();
  const tc = theme.colors;
  const isDark = mode === 'dark';

  return (
    <Box style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 16 }}>
      <Box style={{ width: 64, height: 64, borderRadius: 16, backgroundColor: color + '15', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={32} color={color} />
      </Box>
      <Text style={{ fontSize: 18, fontWeight: '700', color: tc.text.primary, textAlign: 'center' }}>
        {title}
      </Text>
      <Text style={{ fontSize: 13, color: tc.text.secondary, textAlign: 'center', maxWidth: 320, lineHeight: 20 }}>
        {description}
      </Text>
      <Box style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: isDark ? tc.background.raised : tc.background.sunken, borderWidth: isDark ? 0 : 1, borderColor: tc.border.subtle }}>
        <Text style={{ fontSize: 12, fontWeight: '600', color: tc.text.muted }}>Coming Soon</Text>
      </Box>
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

/** Breakpoint below which we use the compact mobile layout. */
const MOBILE_BREAKPOINT = 600;

export function PluginMarketplace({ open, onClose, inline }: PluginMarketplaceProps) {
  if (__DEV__) dbg.trackRender('PluginMarketplace');
  const { theme, mode } = useTheme();
  const tc = theme.colors;
  const isDark = mode === 'dark';
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isMobile = windowWidth < MOBILE_BREAKPOINT;
  const safeInsets = Platform.OS !== 'web' ? useSafeAreaInsets() : { top: 0, bottom: 0, left: 0, right: 0 };
  const {
    registry, marketplace, installPlugin, uninstallPlugin, enablePlugin, disablePlugin, enabledCount,
  } = usePlugins();

  // When inline, use shared context so the sidebar nav stays in sync
  const ctx = useMarketplaceNavigation();
  const [localSection, setLocalSection] = useState<Section>('plugins');
  const [localTab, setLocalTab] = useState<PluginTab>('browse');
  const activeSection: Section = inline ? ctx.activeSection : localSection;
  const setActiveSection = inline ? ctx.setActiveSection as (s: Section) => void : setLocalSection;
  const pluginTab: PluginTab = inline ? ctx.activeTab : localTab;
  const setPluginTab = inline ? ctx.setActiveTab as (t: PluginTab) => void : setLocalTab;
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [selectedListing, setSelectedListing] = useState<MarketplaceListing | null>(null);
  const [devUrl, setDevUrl] = useState('');
  const [devLoading, setDevLoading] = useState(false);

  // Fetch marketplace data when opened
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const [allListings, allCategories] = await Promise.all([
          marketplace.getListings(),
          marketplace.getCategories(),
        ]);
        if (!cancelled) { setListings(allListings); setCategories(allCategories); }
      } catch (err: any) {
        if (!cancelled) setError(err?.message ?? 'Failed to load marketplace');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, marketplace]);

  const currentPlatform = Platform.OS === 'web' ? 'web' : Platform.OS === 'ios' || Platform.OS === 'android' ? 'mobile' : 'desktop';

  const filteredListings = useMemo(() => {
    let result = listings;
    // Filter by current platform — only show plugins that support this platform
    result = result.filter((p) => !p.platforms || p.platforms.length === 0 || p.platforms.includes(currentPlatform as any));
    const q = search.toLowerCase().trim();
    if (q) {
      result = result.filter((p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.tags.some((t) => t.toLowerCase().includes(q)) || p.author.name.toLowerCase().includes(q));
    }
    if (selectedCategory) {
      const cat = selectedCategory.toLowerCase();
      result = result.filter((p) => p.tags.some((t) => t.toLowerCase() === cat));
    }
    return result;
  }, [listings, search, selectedCategory, currentPlatform]);

  const allPlugins = registry.getAllPlugins();

  const handleInstall = useCallback(async (listing: MarketplaceListing) => {
    setInstallingId(listing.id);
    try { await installPlugin(listing.downloadUrl, listing); }
    catch (err: any) { if (__DEV__) dbg.error('plugins', 'Install failed', err, SRC); setError(`Failed to install "${listing.name}": ${err?.message}`); }
    finally { setInstallingId(null); }
  }, [installPlugin]);

  const handleUninstall = useCallback(async (pluginId: string) => {
    try { await uninstallPlugin(pluginId); setSelectedListing(null); }
    catch (err: any) { if (__DEV__) dbg.error('plugins', 'Uninstall failed', err, SRC); setError(`Failed to uninstall: ${err?.message}`); }
  }, [uninstallPlugin]);

  const handleToggle = useCallback(async (pluginId: string) => {
    const plugin = registry.getPlugin(pluginId);
    if (!plugin) return;
    try { if (plugin.state === 'enabled') await disablePlugin(pluginId); else await enablePlugin(pluginId); }
    catch (err: any) { if (__DEV__) dbg.error('plugins', 'Toggle failed', err, SRC); }
  }, [registry, enablePlugin, disablePlugin]);

  const handleLoadDevPlugin = useCallback(async () => {
    const url = devUrl.trim();
    if (!url) return;
    setDevLoading(true); setError(null);
    try { await installPlugin(url); setDevUrl(''); }
    catch (err: any) { setError(`Failed to load dev plugin: ${err?.message}`); }
    finally { setDevLoading(false); }
  }, [devUrl, installPlugin]);

  const handleClose = useCallback(() => {
    setSelectedListing(null); setSearch(''); setSelectedCategory(null); setError(null); onClose();
  }, [onClose]);

  const activeSectionInfo = SECTIONS.find((s) => s.id === activeSection)!;

  // ── Shared Content Renderer ────────────────────────────────────────────

  const renderSectionContent = () => (
    <>
      {/* Error banner */}
      {error && (
        <Box style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: isMobile ? 12 : 20, marginTop: 10, padding: 10, borderRadius: 8, backgroundColor: `${tc.status.danger}15` }}>
          <AlertTriangleIcon size={14} color={tc.status.danger} />
          <Text style={{ fontSize: 12, color: tc.status.danger, flex: 1 }}>{error}</Text>
          <Pressable onPress={() => setError(null)} style={{ padding: 2 }}><XIcon size={12} color={tc.status.danger} /></Pressable>
        </Box>
      )}

      {/* Section Content */}
      {activeSection === 'plugins' ? (
            selectedListing ? (
              <PluginDetailView
                listing={selectedListing}
                plugin={registry.getPlugin(selectedListing.id)}
                installing={installingId === selectedListing.id}
                onInstall={() => handleInstall(selectedListing)}
                onUninstall={() => handleUninstall(selectedListing.id)}
                onToggle={() => handleToggle(selectedListing.id)}
                onBack={() => setSelectedListing(null)}
              />
            ) : (
              <Box style={{ flex: 1 }}>
                {/* Plugin sub-tabs */}
                <Box style={{ flexDirection: 'row', paddingHorizontal: 20, paddingTop: 12, gap: 4 }}>
                  {(['browse', 'installed'] as PluginTab[]).map((tab) => (
                    <Pressable
                      key={tab}
                      onPress={() => setPluginTab(tab)}
                      testID={tab === 'browse' ? TEST_IDS.PLUGINS.TAB_BROWSE : TEST_IDS.PLUGINS.TAB_INSTALLED}
                      style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 6, backgroundColor: pluginTab === tab ? tc.accent.primary : 'transparent' }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: pluginTab === tab ? '600' : '400', color: pluginTab === tab ? tc.text.onAccent : tc.text.secondary }}>
                        {tab === 'browse' ? 'Browse' : `Installed (${allPlugins.length})`}
                      </Text>
                    </Pressable>
                  ))}
                </Box>

                {pluginTab === 'browse' ? (
                  <Box style={{ flex: 1 }}>
                    <Box style={{ paddingHorizontal: 20, paddingTop: 12, gap: 10 }}>
                      <SearchInput value={search} onValueChange={setSearch} placeholder="Search plugins..." size="md" fullWidth onClear={() => setSearch('')} testID={TEST_IDS.PLUGINS.SEARCH_INPUT} gradientBorder />
                      {categories.length > 0 && (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                          <Box style={{ flexDirection: 'row', gap: 6 }}>
                            <Pressable onPress={() => setSelectedCategory(null)} style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, backgroundColor: !selectedCategory ? tc.accent.primary : (isDark ? tc.background.raised : tc.background.sunken), borderWidth: !selectedCategory ? 0 : (isDark ? 0 : 1), borderColor: tc.border.subtle }}>
                              <Text style={{ fontSize: 12, color: !selectedCategory ? tc.text.onAccent : tc.text.secondary }} weight={!selectedCategory ? 'semibold' : undefined}>All</Text>
                            </Pressable>
                            {categories.map((cat) => (
                              <Pressable key={cat} onPress={() => setSelectedCategory(selectedCategory === cat ? null : cat)} style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, backgroundColor: selectedCategory === cat ? tc.accent.primary : (isDark ? tc.background.raised : tc.background.sunken), borderWidth: selectedCategory === cat ? 0 : (isDark ? 0 : 1), borderColor: tc.border.subtle }}>
                                <Text style={{ fontSize: 12, color: selectedCategory === cat ? tc.text.onAccent : tc.text.secondary }} weight={selectedCategory === cat ? 'semibold' : undefined}>{cat}</Text>
                              </Pressable>
                            ))}
                          </Box>
                        </ScrollView>
                      )}
                    </Box>
                    <ScrollArea style={{ flex: 1 }} contentContainerStyle={{ padding: 20, gap: 10 }} showsVerticalScrollIndicator={false}>
                      {loading ? (
                        <Box style={{ padding: 40, alignItems: 'center' }}>
                          <Spinner size="sm" />
                          <Text style={{ fontSize: 13, color: tc.text.muted, marginTop: 8 }}>Loading marketplace...</Text>
                        </Box>
                      ) : filteredListings.length === 0 ? (
                        <Box style={{ padding: 40, alignItems: 'center' }}>
                          <SearchIcon size={24} color={tc.text.muted} />
                          <Text style={{ fontSize: 14, fontWeight: '600', color: tc.text.primary, marginTop: 8 }}>{search || selectedCategory ? 'No plugins found' : 'Marketplace is empty'}</Text>
                          <Text style={{ fontSize: 12, color: tc.text.muted, textAlign: 'center', marginTop: 4 }}>{search || selectedCategory ? 'Try a different search or category.' : 'Check back later for new plugins.'}</Text>
                        </Box>
                      ) : (
                        filteredListings.map((listing) => {
                          const plugin = registry.getPlugin(listing.id);
                          return (
                            <ListingCard
                              key={listing.id} listing={listing} isInstalled={!!plugin}
                              isEnabled={plugin?.state === 'enabled'} installing={installingId === listing.id}
                              onInstall={() => handleInstall(listing)} onUninstall={() => handleUninstall(listing.id)}
                              onViewDetail={() => setSelectedListing(listing)}
                            />
                          );
                        })
                      )}
                    </ScrollArea>
                  </Box>
                ) : (
                  <ScrollArea style={{ flex: 1 }} contentContainerStyle={{ padding: 20, gap: 10 }} showsVerticalScrollIndicator={false}>
                    {allPlugins.length === 0 ? (
                      <Box style={{ padding: 40, alignItems: 'center' }}>
                        <ZapIcon size={24} color={tc.text.muted} />
                        <Text style={{ fontSize: 14, fontWeight: '600', color: tc.text.primary, marginTop: 8 }}>No plugins installed</Text>
                        <Text style={{ fontSize: 12, color: tc.text.muted, textAlign: 'center', marginTop: 4 }}>Browse the marketplace to discover and install plugins.</Text>
                        <Button size="sm" variant="secondary" onPress={() => setPluginTab('browse')} style={{ marginTop: 12 }}>Browse Marketplace</Button>
                      </Box>
                    ) : (
                      allPlugins.map((plugin) => {
                        const listing = listings.find((l) => l.id === plugin.manifest.id);
                        return (
                          <InstalledPluginCard
                            key={plugin.manifest.id} plugin={plugin} listing={listing}
                            onToggle={() => handleToggle(plugin.manifest.id)}
                            onUninstall={() => handleUninstall(plugin.manifest.id)}
                            onViewDetail={() => { if (listing) setSelectedListing(listing); }}
                          />
                        );
                      })
                    )}
                    {/* Dev mode: Load from URL */}
                    <Box style={{ marginTop: 12, padding: 14, borderRadius: 10, borderWidth: 1, borderStyle: 'dashed', borderColor: tc.border.subtle, backgroundColor: tc.background.sunken, gap: 10 }}>
                      <Box style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <ZapIcon size={14} color={tc.accent.primary} />
                        <Text style={{ fontSize: 13, fontWeight: '600', color: tc.text.primary }}>Load Dev Plugin</Text>
                      </Box>
                      <Text style={{ fontSize: 12, color: tc.text.muted }}>Enter a URL to a local plugin bundle for development and testing.</Text>
                      <Box style={{ flexDirection: 'row', gap: 8 }}>
                        <Box style={{ flex: 1 }}>
                          <Input value={devUrl} onChangeText={setDevUrl} placeholder="http://localhost:3099/bundle.js" size="sm" fullWidth gradientBorder />
                        </Box>
                        <Button size="sm" variant="secondary" onPress={handleLoadDevPlugin} disabled={!devUrl.trim() || devLoading}>
                          {devLoading ? 'Loading...' : 'Load'}
                        </Button>
                      </Box>
                    </Box>
                  </ScrollArea>
                )}
              </Box>
            )
          ) : activeSection === 'themes' ? (
            <ThemesContent />
          ) : (
            <FontsContent />
          )}
    </>
  );

  // ── Render ──────────────────────────────────────────────────────────────

  // Inline mode: render content pane only (sidebar is external in MarketplaceNavSidebar)
  if (inline) {
    return (
      <Box
        testID={TEST_IDS.PLUGINS.MARKETPLACE}
        style={{
          flex: 1,
          backgroundColor: isDark ? tc.background.raised : tc.background.canvas,
        }}
      >
        {isMobile && (
          /* Horizontal Section Picker (mobile only — sidebar hidden on mobile) */
          <Box
            style={{
              flexDirection: 'row',
              borderBottomWidth: 1,
              borderBottomColor: tc.border.subtle,
              paddingHorizontal: 12,
              paddingVertical: 8,
              gap: 6,
            }}
          >
            {SECTIONS.map((sec) => {
              const isActive = activeSection === sec.id;
              const Icon = sec.icon;
              return (
                <Pressable
                  key={sec.id}
                  onPress={() => { setActiveSection(sec.id); setSelectedListing(null); }}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    paddingVertical: 8,
                    borderRadius: 8,
                    backgroundColor: isActive ? tc.accent.primary : tc.accent.highlight,
                  }}
                >
                  <LinearGradient
                    colors={[sec.color, sec.secondaryColor]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 5,
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: isActive ? 1 : 0.6,
                    }}
                  >
                    <Icon size={11} color="#FFF" />
                  </LinearGradient>
                  <Text
                    style={{
                      fontSize: 12,
                      color: isActive ? tc.text.onAccent : tc.text.secondary,
                    }}
                    weight={isActive ? 'semibold' : undefined}
                    numberOfLines={1}
                  >
                    {sec.label}
                  </Text>
                </Pressable>
              );
            })}
          </Box>
        )}
        {/* Section header (desktop only) */}
        {!isMobile && (
          <Box
            style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              paddingHorizontal: 28, paddingVertical: 16,
              borderBottomWidth: 1,
              borderBottomColor: tc.border.subtle,
            }}
          >
            <Box style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <LinearGradient
                colors={[activeSectionInfo.color, activeSectionInfo.secondaryColor]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}
              >
                <activeSectionInfo.icon size={18} color="#FFF" />
              </LinearGradient>
              <Text style={{ fontSize: 18, fontWeight: '700', color: tc.text.primary }}>{activeSectionInfo.label}</Text>
            </Box>
          </Box>
        )}
        {renderSectionContent()}
      </Box>
    );
  }

  if (isMobile) {
    return (
      <Overlay open={open} backdrop="dim" center onBackdropPress={handleClose} animationType="fade">
        <Box
          testID={TEST_IDS.PLUGINS.MARKETPLACE}
          style={{
            width: windowWidth,
            height: windowHeight,
            flexDirection: 'column',
            backgroundColor: isDark ? tc.background.raised : tc.background.canvas,
          }}
        >
          {/* ── Mobile Header ── */}
          <Box
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 16,
              paddingTop: 12 + safeInsets.top,
              paddingBottom: 12,
              borderBottomWidth: 1,
              borderBottomColor: tc.border.subtle,
              backgroundColor: isDark ? tc.background.surface : tc.background.sunken,
            }}
          >
            <Box style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Box style={{ width: 28, height: 28, borderRadius: 7, backgroundColor: '#F59E0B', alignItems: 'center', justifyContent: 'center' }}>
                <ShoppingBagIcon size={14} color={tc.text.onAccent} />
              </Box>
              <Text style={{ fontSize: 16, fontWeight: '700', color: tc.text.primary }}>Marketplace</Text>
            </Box>
            <Pressable
              onPress={handleClose}
              style={{ width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}
              accessibilityLabel="Close marketplace"
            >
              <XIcon size={18} color={tc.text.secondary} />
            </Pressable>
          </Box>

          {/* ── Horizontal Section Picker ── */}
          <Box
            style={{
              flexDirection: 'row',
              borderBottomWidth: 1,
              borderBottomColor: tc.border.subtle,
              paddingHorizontal: 12,
              paddingVertical: 8,
              gap: 6,
            }}
          >
            {SECTIONS.map((sec) => {
              const isActive = activeSection === sec.id;
              const Icon = sec.icon;
              return (
                <Pressable
                  key={sec.id}
                  onPress={() => { setActiveSection(sec.id); setSelectedListing(null); }}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    paddingVertical: 8,
                    borderRadius: 8,
                    backgroundColor: isActive ? tc.accent.primary : tc.accent.highlight,
                  }}
                >
                  <LinearGradient
                    colors={[sec.color, sec.secondaryColor]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 5,
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: isActive ? 1 : 0.6,
                    }}
                  >
                    <Icon size={11} color="#FFF" />
                  </LinearGradient>
                  <Text
                    style={{
                      fontSize: 12,
                      color: isActive ? tc.text.onAccent : tc.text.secondary,
                    }}
                    weight={isActive ? 'semibold' : undefined}
                    numberOfLines={1}
                  >
                    {sec.label}
                  </Text>
                </Pressable>
              );
            })}
          </Box>

          {/* ── Content ── */}
          <Box style={{ flex: 1, paddingBottom: safeInsets.bottom }}>
            {renderSectionContent()}
          </Box>
        </Box>
      </Overlay>
    );
  }

  // ── Desktop layout (unchanged) ──────────────────────────────────────────

  return (
    <Overlay
      open={open}
      backdrop="dim"
      center
      onBackdropPress={handleClose}
      animationType={Platform.OS === 'web' ? 'none' : 'fade'}
      style={Platform.OS === 'web' ? {
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(2px)',
        WebkitBackdropFilter: 'blur(2px)',
      } as any : undefined}
    >
      <Box
        testID={TEST_IDS.PLUGINS.MARKETPLACE}
        style={{
          width: 860, maxWidth: '95%', height: 600, maxHeight: '90%',
          flexDirection: 'row', borderRadius: 16, overflow: 'hidden',
          backgroundColor: isDark ? 'rgba(30, 30, 34, 0.94)' : 'rgba(255, 255, 255, 0.92)',
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.6)',
          shadowColor: '#000', shadowOffset: { width: 0, height: 16 },
          shadowOpacity: isDark ? 0.7 : 0.2, shadowRadius: 48, elevation: 12,
          ...(Platform.OS === 'web' ? {
            backdropFilter: 'blur(16px) saturate(1.3)',
            WebkitBackdropFilter: 'blur(16px) saturate(1.3)',
          } as any : {}),
        }}
      >
        {/* ── Left Sidebar ── */}
        <Box
          style={{
            width: 210,
            backgroundColor: isDark
              ? 'rgba(255, 255, 255, 0.04)'
              : 'rgba(0, 0, 0, 0.03)',
            borderRightWidth: 1,
            borderRightColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            paddingVertical: 16, paddingHorizontal: 10,
          }}
        >
          {/* Title */}
          <Box style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 8, marginBottom: 16 }}>
            <Box style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: '#F59E0B', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingBagIcon size={16} color={tc.text.onAccent} />
            </Box>
            <Text style={{ fontSize: 15, fontWeight: '700', color: tc.text.primary }}>Marketplace</Text>
          </Box>

          {/* Section List */}
          <ScrollArea showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
            {SECTIONS.map((sec) => {
              const isActive = activeSection === sec.id;
              const Icon = sec.icon;
              return (
                <Pressable
                  key={sec.id}
                  onPress={() => { setActiveSection(sec.id); setSelectedListing(null); }}
                  style={({ pressed }) => ({
                    flexDirection: 'row', alignItems: 'center', gap: 10,
                    paddingVertical: 9, paddingHorizontal: 10, borderRadius: 8,
                    backgroundColor: isActive ? tc.accent.primary : pressed ? tc.accent.highlight : 'transparent',
                    marginBottom: 2,
                  })}
                >
                  <LinearGradient
                    colors={isActive ? [sec.color, sec.secondaryColor] : [sec.color, sec.secondaryColor]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ width: 24, height: 24, borderRadius: 6, alignItems: 'center', justifyContent: 'center', opacity: isActive ? 1 : 0.7 }}
                  >
                    <Icon size={13} color="#FFF" />
                  </LinearGradient>
                  <Text style={{ fontSize: 13, fontWeight: isActive ? '600' : '400', color: isActive ? tc.text.onAccent : tc.text.secondary, flex: 1 }} numberOfLines={1}>
                    {sec.label}
                  </Text>
                  {sec.id === 'plugins' && allPlugins.length > 0 && (
                    <Box style={{ paddingHorizontal: 6, paddingVertical: 1, borderRadius: 8, backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : tc.accent.highlight }}>
                      <Text style={{ fontSize: 10, fontWeight: '600', color: isActive ? tc.text.onAccent : tc.text.muted }}>{allPlugins.length}</Text>
                    </Box>
                  )}
                </Pressable>
              );
            })}
          </ScrollArea>

          {/* Footer */}
          <Text style={{ fontSize: 11, color: tc.text.muted, textAlign: 'center', marginTop: 12 }}>
            Umbra Marketplace
          </Text>
        </Box>

        {/* ── Right Content ── */}
        <Box style={{ flex: 1 }}>
          {/* Section Header */}
          <Box
            style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              paddingHorizontal: 28, paddingVertical: 16,
              borderBottomWidth: 1,
              borderBottomColor: tc.border.subtle,
            }}
          >
            <Box style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <LinearGradient
                colors={[activeSectionInfo.color, activeSectionInfo.secondaryColor]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}
              >
                <activeSectionInfo.icon size={18} color="#FFF" />
              </LinearGradient>
              <Text style={{ fontSize: 18, fontWeight: '700', color: tc.text.primary }}>{activeSectionInfo.label}</Text>
            </Box>
            <Pressable onPress={handleClose} style={{ width: 28, height: 28, borderRadius: 6, alignItems: 'center', justifyContent: 'center' }} accessibilityLabel="Close marketplace">
              <XIcon size={16} color={tc.text.secondary} />
            </Pressable>
          </Box>

          {renderSectionContent()}
        </Box>
      </Box>
    </Overlay>
  );
}
