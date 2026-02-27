/**
 * PluginMarketplace — Browse, search, install, and manage plugins, themes, and fonts.
 *
 * Sidebar-based layout (mirroring the Guide dialog) with sections:
 * - Plugins: browse, install, manage plugin extensions
 * - Themes: community colour themes (coming soon)
 * - Fonts: custom font packs (coming soon)
 */

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { View, Pressable, ScrollView, Text as RNText, ActivityIndicator, Platform, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Overlay,
  Button,
  Input,
  Separator,
  Toggle,
  Tag,
  useTheme,
} from '@coexist/wisp-react-native';
import { SearchInput } from '@coexist/wisp-react-native';
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
import type { MarketplaceListing } from '@umbra/plugin-runtime';
import type { PluginPermission, PluginInstance } from '@umbra/plugin-sdk';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface PluginMarketplaceProps {
  open: boolean;
  onClose: () => void;
}

type Section = 'plugins' | 'themes' | 'fonts';
type PluginTab = 'browse' | 'installed';

interface SectionItem {
  id: Section;
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  color: string;
}

const SECTIONS: SectionItem[] = [
  { id: 'plugins', label: 'Plugins', icon: PuzzleIcon, color: '#8B5CF6' },
  { id: 'themes', label: 'Themes', icon: PaletteIcon, color: '#EC4899' },
  { id: 'fonts', label: 'Fonts', icon: FontIcon, color: '#3B82F6' },
];

// Simple "A" icon for Fonts section
function FontIcon({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <RNText style={{ fontSize: size, fontWeight: '700', color: color ?? '#FFF', textAlign: 'center', lineHeight: size }}>
      A
    </RNText>
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

  return (
    <Pressable
      onPress={onViewDetail}
      style={({ pressed }) => ({
        padding: 14, borderRadius: 10, borderWidth: 1,
        borderColor: tc.border.subtle,
        backgroundColor: pressed ? tc.background.surface : tc.background.sunken,
        gap: 10,
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
        <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: isDark ? tc.background.raised : tc.background.sunken, alignItems: 'center', justifyContent: 'center' }}>
          <ZapIcon size={20} color={tc.accent.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <RNText style={{ fontSize: 14, fontWeight: '600', color: tc.text.primary }}>{listing.name}</RNText>
            <RNText style={{ fontSize: 11, color: tc.text.muted }}>v{listing.version}</RNText>
          </View>
          <RNText style={{ fontSize: 12, color: tc.text.secondary, marginTop: 2 }} numberOfLines={2}>{listing.description}</RNText>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <RNText style={{ fontSize: 11, color: tc.text.muted }}>{listing.author.name}</RNText>
            {listing.downloads > 0 && (
              <>
                <RNText style={{ fontSize: 11, color: tc.text.muted }}>·</RNText>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <DownloadIcon size={10} color={tc.text.muted} />
                  <RNText style={{ fontSize: 11, color: tc.text.muted }}>{listing.downloads.toLocaleString()}</RNText>
                </View>
              </>
            )}
            {listing.size > 0 && (
              <>
                <RNText style={{ fontSize: 11, color: tc.text.muted }}>·</RNText>
                <RNText style={{ fontSize: 11, color: tc.text.muted }}>{formatSize(listing.size)}</RNText>
              </>
            )}
          </View>
        </View>
        <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
          {isInstalled ? (
            <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, backgroundColor: isEnabled ? `${tc.status.success}20` : `${tc.text.muted}20` }}>
              <RNText style={{ fontSize: 11, fontWeight: '600', color: isEnabled ? tc.status.success : tc.text.muted }}>
                {isEnabled ? 'Installed' : 'Disabled'}
              </RNText>
            </View>
          ) : (
            <Button size="xs" variant="primary" onPress={(e) => { e?.stopPropagation?.(); onInstall(); }} disabled={installing} iconLeft={installing ? undefined : <DownloadIcon size={12} color={tc.text.inverse} />}>
              {installing ? 'Installing...' : 'Install'}
            </Button>
          )}
        </View>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
        {/* Platform badges */}
        {listing.platforms && listing.platforms.length > 0 && (
          <PlatformBadges platforms={listing.platforms} />
        )}
        {listing.tags.length > 0 && listing.tags.slice(0, 4).map((tag) => (
          <Tag key={tag} size="sm" style={{ borderRadius: 6 }}>
            {tag}
          </Tag>
        ))}
      </View>
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
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: 'rgba(16,185,129,0.15)' }}>
        <RNText style={{ fontSize: 9 }}>{'\u{2728}'}</RNText>
        <RNText style={{ fontSize: 10, fontWeight: '600', color: '#10B981' }}>Cross-platform</RNText>
      </View>
    );
  }

  return (
    <>
      {platforms.map((p) => {
        const config = PLATFORM_CONFIG[p];
        if (!config) return null;
        return (
          <View key={p} style={{ flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4, backgroundColor: `${config.color}15` }}>
            <RNText style={{ fontSize: 9 }}>{config.icon}</RNText>
            <RNText style={{ fontSize: 10, fontWeight: '500', color: config.color }}>{config.label}</RNText>
          </View>
        );
      })}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Installed Plugin Card
// ─────────────────────────────────────────────────────────────────────────────

function InstalledPluginCard({
  plugin, onToggle, onUninstall, onViewDetail,
}: {
  plugin: PluginInstance; onToggle: () => void; onUninstall: () => void; onViewDetail: () => void;
}) {
  const { theme, mode } = useTheme();
  const tc = theme.colors;
  const isDark = mode === 'dark';
  const [confirmUninstall, setConfirmUninstall] = useState(false);

  return (
    <View style={{ padding: 14, borderRadius: 10, borderWidth: 1, borderColor: tc.border.subtle, backgroundColor: tc.background.sunken, gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: isDark ? tc.background.raised : tc.background.sunken, alignItems: 'center', justifyContent: 'center' }}>
          <ZapIcon size={18} color={plugin.state === 'enabled' ? tc.status.success : tc.text.muted} />
        </View>
        <Pressable onPress={onViewDetail} style={{ flex: 1 }}>
          <RNText style={{ fontSize: 14, fontWeight: '600', color: tc.text.primary }}>{plugin.manifest.name}</RNText>
          <RNText style={{ fontSize: 12, color: tc.text.secondary }} numberOfLines={1}>v{plugin.manifest.version} · {plugin.manifest.author.name}</RNText>
          {plugin.state === 'error' && plugin.error && (
            <RNText style={{ fontSize: 11, color: tc.status.danger, marginTop: 2 }} numberOfLines={1}>Error: {plugin.error}</RNText>
          )}
        </Pressable>
        <Toggle checked={plugin.state === 'enabled'} onChange={onToggle} size="sm" />
      </View>
      {confirmUninstall ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 4 }}>
          <RNText style={{ fontSize: 12, color: tc.status.danger, flex: 1 }}>Remove this plugin and its data?</RNText>
          <Button size="xs" variant="destructive" onPress={() => { onUninstall(); setConfirmUninstall(false); }}>
            Remove
          </Button>
          <Button size="xs" variant="tertiary" onPress={() => setConfirmUninstall(false)}>Cancel</Button>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
          <Button size="xs" variant="tertiary" onPress={() => setConfirmUninstall(true)} iconLeft={<TrashIcon size={12} color={tc.text.muted} />}>
            Uninstall
          </Button>
        </View>
      )}
    </View>
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

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24, gap: 20 }}>
      <Pressable onPress={onBack} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <ArrowLeftIcon size={16} color={tc.text.secondary} />
        <RNText style={{ fontSize: 13, color: tc.text.secondary }}>Back</RNText>
      </Pressable>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 16 }}>
        <View style={{ width: 56, height: 56, borderRadius: 14, backgroundColor: isDark ? tc.background.raised : tc.background.sunken, alignItems: 'center', justifyContent: 'center' }}>
          <ZapIcon size={28} color={tc.accent.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <RNText style={{ fontSize: 20, fontWeight: '700', color: tc.text.primary }}>{listing.name}</RNText>
          <RNText style={{ fontSize: 13, color: tc.text.secondary, marginTop: 2 }}>by {listing.author.name} · v{listing.version}</RNText>
          {listing.author.url && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
              <ExternalLinkIcon size={11} color={tc.accent.primary} />
              <RNText style={{ fontSize: 11, color: tc.accent.primary }}>{listing.author.url}</RNText>
            </View>
          )}
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {isInstalled ? (
          <>
            <Button size="sm" variant={plugin.state === 'enabled' ? 'secondary' : 'primary'} onPress={onToggle} style={{ flex: 1 }}>
              {plugin.state === 'enabled' ? 'Disable' : 'Enable'}
            </Button>
            <Button size="sm" variant="destructive" onPress={onUninstall} iconLeft={<TrashIcon size={14} color={tc.text.inverse} />}>
              Uninstall
            </Button>
          </>
        ) : (
          <Button size="sm" variant="primary" onPress={onInstall} disabled={installing} iconLeft={<DownloadIcon size={14} color={tc.text.inverse} />} style={{ flex: 1 }}>
            {installing ? 'Installing...' : 'Install Plugin'}
          </Button>
        )}
      </View>
      <Separator spacing="sm" />
      <View style={{ gap: 6 }}>
        <RNText style={{ fontSize: 14, fontWeight: '600', color: tc.text.primary }}>Description</RNText>
        <RNText style={{ fontSize: 13, color: tc.text.secondary, lineHeight: 20 }}>{listing.description}</RNText>
      </View>
      <View style={{ flexDirection: 'row', gap: 16, flexWrap: 'wrap' }}>
        {listing.downloads > 0 && (
          <View style={{ gap: 2 }}>
            <RNText style={{ fontSize: 11, color: tc.text.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Downloads</RNText>
            <RNText style={{ fontSize: 14, fontWeight: '600', color: tc.text.primary }}>{listing.downloads.toLocaleString()}</RNText>
          </View>
        )}
        {listing.size > 0 && (
          <View style={{ gap: 2 }}>
            <RNText style={{ fontSize: 11, color: tc.text.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Size</RNText>
            <RNText style={{ fontSize: 14, fontWeight: '600', color: tc.text.primary }}>{formatSize(listing.size)}</RNText>
          </View>
        )}
        <View style={{ gap: 4 }}>
          <RNText style={{ fontSize: 11, color: tc.text.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Platforms</RNText>
          <View style={{ flexDirection: 'row', gap: 4, flexWrap: 'wrap' }}>
            <PlatformBadges platforms={listing.platforms} />
          </View>
        </View>
      </View>
      {listing.permissions && listing.permissions.length > 0 && (
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <ShieldIcon size={14} color={tc.text.secondary} />
            <RNText style={{ fontSize: 14, fontWeight: '600', color: tc.text.primary }}>Permissions</RNText>
          </View>
          <View style={{ gap: 6 }}>
            {listing.permissions.map((perm) => {
              const info = PERMISSION_LABELS[perm];
              return (
                <View key={perm} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, backgroundColor: tc.background.sunken }}>
                  {getPermissionIcon(perm, tc.text.muted)}
                  <View style={{ flex: 1 }}>
                    <RNText style={{ fontSize: 12, fontWeight: '500', color: tc.text.primary }}>{info?.label ?? perm}</RNText>
                    {info?.description && <RNText style={{ fontSize: 11, color: tc.text.muted }}>{info.description}</RNText>}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}
      {listing.tags.length > 0 && (
        <View style={{ gap: 6 }}>
          <RNText style={{ fontSize: 14, fontWeight: '600', color: tc.text.primary }}>Tags</RNText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {listing.tags.map((tag) => (
              <Tag key={tag} size="sm" style={{ borderRadius: 6 }}>
                {tag}
              </Tag>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
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
    <View style={{
      borderRadius: 10, borderWidth: 1,
      borderColor: isActive ? tc.accent.primary : tc.border.subtle,
      backgroundColor: isActive ? tc.accent.highlight : tc.background.sunken,
      padding: 14, gap: 10,
    }}>
      {/* Font preview — uses FontPreviewText to bypass global font override */}
      <View style={{ minHeight: 48, justifyContent: 'center' }}>
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
      </View>

      {/* Font info + action */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <RNText style={{ fontSize: 13, fontWeight: '600', color: tc.text.primary }}>{font.name}</RNText>
          <RNText style={{ fontSize: 11, color: tc.text.muted, textTransform: 'capitalize' }}>{font.category}</RNText>
        </View>
        {isActive ? (
          <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, backgroundColor: `${tc.status.success}20` }}>
            <RNText style={{ fontSize: 11, fontWeight: '600', color: tc.status.success }}>Active</RNText>
          </View>
        ) : isInstalled ? (
          <Button size="xs" variant="secondary" onPress={onActivate}>
            Use Font
          </Button>
        ) : (
          <Button size="xs" variant="primary" onPress={onInstall} disabled={isLoading} iconLeft={isLoading ? undefined : <DownloadIcon size={12} color={tc.text.inverse} />}>
            {isLoading ? 'Loading...' : 'Install'}
          </Button>
        )}
      </View>
    </View>
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
    <View style={{ flex: 1, padding: 20 }}>
      {/* Header */}
      <View style={{ marginBottom: 16 }}>
        <RNText style={{ fontSize: 18, fontWeight: '700', color: tc.text.primary, marginBottom: 4 }}>Fonts</RNText>
        <RNText style={{ fontSize: 13, color: tc.text.secondary }}>
          {catalogLoaded
            ? `Choose from ${totalCount.toLocaleString()} Google Fonts to personalize your Umbra experience.`
            : `Choose from ${featuredFonts.length} curated typefaces. Loading full catalog...`}
        </RNText>
      </View>

      {/* Search */}
      <View style={{ marginBottom: 12 }}>
        <SearchInput value={search} onValueChange={setSearch} placeholder="Search fonts..." size="sm" fullWidth onClear={() => setSearch('')} />
      </View>

      {/* Category filter */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
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
            <RNText style={{
              fontSize: 12, fontWeight: categoryFilter === cat ? '600' : '400',
              color: categoryFilter === cat ? tc.text.inverse : tc.text.secondary,
              textTransform: 'capitalize',
            }}>
              {cat === 'all' ? 'All' : cat}
            </RNText>
          </Pressable>
        ))}
      </View>

      {/* Font list */}
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 20 }}>
        {/* Featured section */}
        {filteredFeatured.length > 0 && (
          <>
            <RNText style={{ fontSize: 13, fontWeight: '600', color: tc.text.secondary, marginBottom: 4, marginTop: 2 }}>
              {isSearching ? `Featured (${filteredFeatured.length})` : `Featured (${featuredFonts.length})`}
            </RNText>
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
            <View style={{ marginTop: 16, marginBottom: 4 }}>
              <RNText style={{ fontSize: 13, fontWeight: '600', color: tc.text.secondary }}>
                All Google Fonts ({catalogFonts.length.toLocaleString()})
              </RNText>
            </View>
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
                <RNText style={{ fontSize: 13, fontWeight: '600', color: tc.accent.primary }}>
                  Load More ({(catalogFonts.length - visibleCount).toLocaleString()} remaining)
                </RNText>
              </Pressable>
            )}
          </>
        )}

        {/* Loading indicator for catalog */}
        {!catalogLoaded && (
          <View style={{ alignItems: 'center', paddingVertical: 20, gap: 8 }}>
            <ActivityIndicator size="small" color={tc.text.muted} />
            <RNText style={{ fontSize: 12, color: tc.text.muted }}>Loading full Google Fonts catalog...</RNText>
          </View>
        )}

        {/* Empty state */}
        {filteredFeatured.length === 0 && (catalogLoaded ? catalogFonts.length === 0 : true) && (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <RNText style={{ fontSize: 14, color: tc.text.muted }}>No fonts match your search.</RNText>
          </View>
        )}
      </ScrollView>
    </View>
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
    <View
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
      <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
        {theme.swatches.map((color, i) => (
          <View
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
      </View>

      {/* Theme info + action */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <RNText style={{ fontSize: 14, fontWeight: '600', color: tc.text.primary }}>{theme.name}</RNText>
          <RNText style={{ fontSize: 12, color: tc.text.secondary, marginTop: 2 }} numberOfLines={2}>
            {theme.description}
          </RNText>
          <RNText style={{ fontSize: 11, color: tc.text.muted, marginTop: 4 }}>by {theme.author}</RNText>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 6 }}>
          {isActive ? (
            <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, backgroundColor: `${tc.status.success}20` }}>
              <RNText style={{ fontSize: 11, fontWeight: '600', color: tc.status.success }}>Active</RNText>
            </View>
          ) : isInstalled ? (
            <Button size="xs" variant="secondary" onPress={onActivate}>
              Use Theme
            </Button>
          ) : (
            <Button
              size="xs"
              variant="primary"
              onPress={onInstall}
              iconLeft={<DownloadIcon size={12} color={tc.text.inverse} />}
            >
              Install
            </Button>
          )}
        </View>
      </View>

      {/* Uninstall option for installed themes */}
      {isInstalled && !isActive && (
        showUninstallConfirm ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <RNText style={{ fontSize: 11, color: tc.status.danger, flex: 1 }}>Remove this theme?</RNText>
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
          </View>
        ) : (
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
            <Button
              size="xs"
              variant="tertiary"
              onPress={() => setShowUninstallConfirm(true)}
              iconLeft={<TrashIcon size={11} color={tc.text.muted} />}
            >
              Uninstall
            </Button>
          </View>
        )
      )}
    </View>
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
    <View style={{ flex: 1, padding: 20 }}>
      {/* Header */}
      <View style={{ marginBottom: 16 }}>
        <RNText style={{ fontSize: 18, fontWeight: '700', color: tc.text.primary, marginBottom: 4 }}>
          Themes
        </RNText>
        <RNText style={{ fontSize: 13, color: tc.text.secondary }}>
          Customize Umbra with {themes.length} community colour themes. Install your favorites and switch between them anytime.
        </RNText>
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: 'row', gap: 4, marginBottom: 12 }}>
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
            <RNText
              style={{
                fontSize: 13,
                fontWeight: tab === t ? '600' : '400',
                color: tab === t ? tc.text.inverse : tc.text.secondary,
              }}
            >
              {t === 'browse' ? 'Browse' : `Installed (${installedThemeIds.size})`}
            </RNText>
          </Pressable>
        ))}
      </View>

      {tab === 'browse' ? (
        <>
          {/* Search */}
          <View style={{ marginBottom: 12 }}>
            <SearchInput
              value={search}
              onValueChange={setSearch}
              placeholder="Search themes..."
              size="sm"
              fullWidth
              onClear={() => setSearch('')}
            />
          </View>

          {/* Theme list */}
          <ScrollView
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
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <RNText style={{ fontSize: 14, color: tc.text.muted }}>
                  No themes match your search.
                </RNText>
              </View>
            )}
          </ScrollView>
        </>
      ) : (
        <ScrollView
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
              <RNText style={{ fontSize: 14, fontWeight: '600', color: tc.text.primary }}>
                No themes installed
              </RNText>
              <RNText style={{ fontSize: 12, color: tc.text.secondary, textAlign: 'center' }}>
                Browse the marketplace to discover and install colour themes.
              </RNText>
              <RNText style={{ fontSize: 12, color: tc.accent.primary, fontWeight: '600', marginTop: 4 }}>
                Browse Themes
              </RNText>
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
                <View style={{ flex: 1 }}>
                  <RNText style={{ fontSize: 14, fontWeight: '600', color: tc.text.primary }}>
                    Default Theme
                  </RNText>
                  <RNText style={{ fontSize: 12, color: tc.text.secondary }}>
                    Use the standard Umbra colour palette
                  </RNText>
                </View>
                {!activeTheme && (
                  <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, backgroundColor: `${tc.status.success}20` }}>
                    <RNText style={{ fontSize: 11, fontWeight: '600', color: tc.status.success }}>Active</RNText>
                  </View>
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
        </ScrollView>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function ComingSoonContent({ title, description, icon: Icon, color }: { title: string; description: string; icon: React.ComponentType<{ size?: number; color?: string }>; color: string }) {
  const { theme, mode } = useTheme();
  const tc = theme.colors;
  const isDark = mode === 'dark';

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 16 }}>
      <View style={{ width: 64, height: 64, borderRadius: 16, backgroundColor: color + '15', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={32} color={color} />
      </View>
      <RNText style={{ fontSize: 18, fontWeight: '700', color: tc.text.primary, textAlign: 'center' }}>
        {title}
      </RNText>
      <RNText style={{ fontSize: 13, color: tc.text.secondary, textAlign: 'center', maxWidth: 320, lineHeight: 20 }}>
        {description}
      </RNText>
      <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: isDark ? tc.background.raised : tc.background.sunken, borderWidth: isDark ? 0 : 1, borderColor: tc.border.subtle }}>
        <RNText style={{ fontSize: 12, fontWeight: '600', color: tc.text.muted }}>Coming Soon</RNText>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

/** Breakpoint below which we use the compact mobile layout. */
const MOBILE_BREAKPOINT = 600;

export function PluginMarketplace({ open, onClose }: PluginMarketplaceProps) {
  const { theme, mode } = useTheme();
  const tc = theme.colors;
  const isDark = mode === 'dark';
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isMobile = windowWidth < MOBILE_BREAKPOINT;
  const safeInsets = Platform.OS !== 'web' ? useSafeAreaInsets() : { top: 0, bottom: 0, left: 0, right: 0 };
  const {
    registry, marketplace, installPlugin, uninstallPlugin, enablePlugin, disablePlugin, enabledCount,
  } = usePlugins();

  const [activeSection, setActiveSection] = useState<Section>('plugins');
  const [pluginTab, setPluginTab] = useState<PluginTab>('browse');
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
    catch (err: any) { console.error('Install failed:', err); setError(`Failed to install "${listing.name}": ${err?.message}`); }
    finally { setInstallingId(null); }
  }, [installPlugin]);

  const handleUninstall = useCallback(async (pluginId: string) => {
    try { await uninstallPlugin(pluginId); setSelectedListing(null); }
    catch (err: any) { console.error('Uninstall failed:', err); setError(`Failed to uninstall: ${err?.message}`); }
  }, [uninstallPlugin]);

  const handleToggle = useCallback(async (pluginId: string) => {
    const plugin = registry.getPlugin(pluginId);
    if (!plugin) return;
    try { if (plugin.state === 'enabled') await disablePlugin(pluginId); else await enablePlugin(pluginId); }
    catch (err: any) { console.error('Toggle failed:', err); }
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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: isMobile ? 12 : 20, marginTop: 10, padding: 10, borderRadius: 8, backgroundColor: `${tc.status.danger}15` }}>
          <AlertTriangleIcon size={14} color={tc.status.danger} />
          <RNText style={{ fontSize: 12, color: tc.status.danger, flex: 1 }}>{error}</RNText>
          <Pressable onPress={() => setError(null)} style={{ padding: 2 }}><XIcon size={12} color={tc.status.danger} /></Pressable>
        </View>
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
              <View style={{ flex: 1 }}>
                {/* Plugin sub-tabs */}
                <View style={{ flexDirection: 'row', paddingHorizontal: 20, paddingTop: 12, gap: 4 }}>
                  {(['browse', 'installed'] as PluginTab[]).map((tab) => (
                    <Pressable
                      key={tab}
                      onPress={() => setPluginTab(tab)}
                      style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 6, backgroundColor: pluginTab === tab ? tc.accent.primary : 'transparent' }}
                    >
                      <RNText style={{ fontSize: 13, fontWeight: pluginTab === tab ? '600' : '400', color: pluginTab === tab ? tc.text.inverse : tc.text.secondary }}>
                        {tab === 'browse' ? 'Browse' : `Installed (${allPlugins.length})`}
                      </RNText>
                    </Pressable>
                  ))}
                </View>

                {pluginTab === 'browse' ? (
                  <View style={{ flex: 1 }}>
                    <View style={{ paddingHorizontal: 20, paddingTop: 12, gap: 10 }}>
                      <SearchInput value={search} onValueChange={setSearch} placeholder="Search plugins..." size="md" fullWidth onClear={() => setSearch('')} />
                      {categories.length > 0 && (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                          <View style={{ flexDirection: 'row', gap: 6 }}>
                            <Pressable onPress={() => setSelectedCategory(null)} style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, backgroundColor: !selectedCategory ? tc.accent.primary : (isDark ? tc.background.raised : tc.background.sunken), borderWidth: !selectedCategory ? 0 : (isDark ? 0 : 1), borderColor: tc.border.subtle }}>
                              <RNText style={{ fontSize: 12, fontWeight: !selectedCategory ? '600' : '400', color: !selectedCategory ? tc.text.inverse : tc.text.secondary }}>All</RNText>
                            </Pressable>
                            {categories.map((cat) => (
                              <Pressable key={cat} onPress={() => setSelectedCategory(selectedCategory === cat ? null : cat)} style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, backgroundColor: selectedCategory === cat ? tc.accent.primary : (isDark ? tc.background.raised : tc.background.sunken), borderWidth: selectedCategory === cat ? 0 : (isDark ? 0 : 1), borderColor: tc.border.subtle }}>
                                <RNText style={{ fontSize: 12, fontWeight: selectedCategory === cat ? '600' : '400', color: selectedCategory === cat ? tc.text.inverse : tc.text.secondary }}>{cat}</RNText>
                              </Pressable>
                            ))}
                          </View>
                        </ScrollView>
                      )}
                    </View>
                    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, gap: 10 }} showsVerticalScrollIndicator={false}>
                      {loading ? (
                        <View style={{ padding: 40, alignItems: 'center' }}>
                          <ActivityIndicator size="small" color={tc.text.muted} />
                          <RNText style={{ fontSize: 13, color: tc.text.muted, marginTop: 8 }}>Loading marketplace...</RNText>
                        </View>
                      ) : filteredListings.length === 0 ? (
                        <View style={{ padding: 40, alignItems: 'center' }}>
                          <SearchIcon size={24} color={tc.text.muted} />
                          <RNText style={{ fontSize: 14, fontWeight: '600', color: tc.text.primary, marginTop: 8 }}>{search || selectedCategory ? 'No plugins found' : 'Marketplace is empty'}</RNText>
                          <RNText style={{ fontSize: 12, color: tc.text.muted, textAlign: 'center', marginTop: 4 }}>{search || selectedCategory ? 'Try a different search or category.' : 'Check back later for new plugins.'}</RNText>
                        </View>
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
                    </ScrollView>
                  </View>
                ) : (
                  <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, gap: 10 }} showsVerticalScrollIndicator={false}>
                    {allPlugins.length === 0 ? (
                      <View style={{ padding: 40, alignItems: 'center' }}>
                        <ZapIcon size={24} color={tc.text.muted} />
                        <RNText style={{ fontSize: 14, fontWeight: '600', color: tc.text.primary, marginTop: 8 }}>No plugins installed</RNText>
                        <RNText style={{ fontSize: 12, color: tc.text.muted, textAlign: 'center', marginTop: 4 }}>Browse the marketplace to discover and install plugins.</RNText>
                        <Button size="sm" variant="secondary" onPress={() => setPluginTab('browse')} style={{ marginTop: 12 }}>Browse Marketplace</Button>
                      </View>
                    ) : (
                      allPlugins.map((plugin) => {
                        const listing = listings.find((l) => l.id === plugin.manifest.id);
                        return (
                          <InstalledPluginCard
                            key={plugin.manifest.id} plugin={plugin}
                            onToggle={() => handleToggle(plugin.manifest.id)}
                            onUninstall={() => handleUninstall(plugin.manifest.id)}
                            onViewDetail={() => { if (listing) setSelectedListing(listing); }}
                          />
                        );
                      })
                    )}
                    {/* Dev mode: Load from URL */}
                    <View style={{ marginTop: 12, padding: 14, borderRadius: 10, borderWidth: 1, borderStyle: 'dashed', borderColor: tc.border.subtle, backgroundColor: tc.background.sunken, gap: 10 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <ZapIcon size={14} color={tc.accent.primary} />
                        <RNText style={{ fontSize: 13, fontWeight: '600', color: tc.text.primary }}>Load Dev Plugin</RNText>
                      </View>
                      <RNText style={{ fontSize: 12, color: tc.text.muted }}>Enter a URL to a local plugin bundle for development and testing.</RNText>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <View style={{ flex: 1 }}>
                          <Input value={devUrl} onChangeText={setDevUrl} placeholder="http://localhost:3099/bundle.js" size="sm" fullWidth />
                        </View>
                        <Button size="sm" variant="secondary" onPress={handleLoadDevPlugin} disabled={!devUrl.trim() || devLoading}>
                          {devLoading ? 'Loading...' : 'Load'}
                        </Button>
                      </View>
                    </View>
                  </ScrollView>
                )}
              </View>
            )
          ) : activeSection === 'themes' ? (
            <ThemesContent />
          ) : (
            <FontsContent />
          )}
    </>
  );

  // ── Render ──────────────────────────────────────────────────────────────

  if (isMobile) {
    return (
      <Overlay open={open} backdrop="dim" center onBackdropPress={handleClose} animationType="fade">
        <View
          style={{
            width: windowWidth,
            height: windowHeight,
            flexDirection: 'column',
            backgroundColor: isDark ? tc.background.raised : tc.background.canvas,
          }}
        >
          {/* ── Mobile Header ── */}
          <View
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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 28, height: 28, borderRadius: 7, backgroundColor: '#F59E0B', alignItems: 'center', justifyContent: 'center' }}>
                <ShoppingBagIcon size={14} color={tc.text.inverse} />
              </View>
              <RNText style={{ fontSize: 16, fontWeight: '700', color: tc.text.primary }}>Marketplace</RNText>
            </View>
            <Pressable
              onPress={handleClose}
              style={{ width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}
              accessibilityLabel="Close marketplace"
            >
              <XIcon size={18} color={tc.text.secondary} />
            </Pressable>
          </View>

          {/* ── Horizontal Section Picker ── */}
          <View
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
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 5,
                      backgroundColor: isActive ? sec.color : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={11} color={isActive ? tc.text.inverse : tc.text.secondary} />
                  </View>
                  <RNText
                    style={{
                      fontSize: 12,
                      fontWeight: isActive ? '600' : '400',
                      color: isActive ? tc.text.inverse : tc.text.secondary,
                    }}
                    numberOfLines={1}
                  >
                    {sec.label}
                  </RNText>
                </Pressable>
              );
            })}
          </View>

          {/* ── Content ── */}
          <View style={{ flex: 1, paddingBottom: safeInsets.bottom }}>
            {renderSectionContent()}
          </View>
        </View>
      </Overlay>
    );
  }

  // ── Desktop layout (unchanged) ──────────────────────────────────────────

  return (
    <Overlay open={open} backdrop="dim" center onBackdropPress={handleClose} animationType="fade">
      <View
        style={{
          width: 860, maxWidth: '95%', height: 600, maxHeight: '90%',
          flexDirection: 'row', borderRadius: 16, overflow: 'hidden',
          backgroundColor: isDark ? tc.background.raised : tc.background.canvas,
          borderWidth: 1,
          borderColor: tc.border.subtle,
          shadowColor: '#000', shadowOffset: { width: 0, height: 12 },
          shadowOpacity: isDark ? 0.6 : 0.25, shadowRadius: 32, elevation: 12,
        }}
      >
        {/* ── Left Sidebar ── */}
        <View
          style={{
            width: 210,
            backgroundColor: isDark ? tc.background.surface : tc.background.sunken,
            borderRightWidth: 1,
            borderRightColor: tc.border.subtle,
            paddingVertical: 16, paddingHorizontal: 10,
          }}
        >
          {/* Title */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 8, marginBottom: 16 }}>
            <View style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: '#F59E0B', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingBagIcon size={16} color={tc.text.inverse} />
            </View>
            <RNText style={{ fontSize: 15, fontWeight: '700', color: tc.text.primary }}>Marketplace</RNText>
          </View>

          {/* Section List */}
          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
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
                  <View style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: isActive ? sec.color : tc.accent.highlight, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={13} color={isActive ? tc.text.inverse : tc.text.secondary} />
                  </View>
                  <RNText style={{ fontSize: 13, fontWeight: isActive ? '600' : '400', color: isActive ? tc.text.inverse : tc.text.secondary, flex: 1 }} numberOfLines={1}>
                    {sec.label}
                  </RNText>
                  {sec.id === 'plugins' && allPlugins.length > 0 && (
                    <View style={{ paddingHorizontal: 6, paddingVertical: 1, borderRadius: 8, backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : tc.accent.highlight }}>
                      <RNText style={{ fontSize: 10, fontWeight: '600', color: isActive ? tc.text.inverse : tc.text.muted }}>{allPlugins.length}</RNText>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Footer */}
          <RNText style={{ fontSize: 11, color: tc.text.muted, textAlign: 'center', marginTop: 12 }}>
            Umbra Marketplace
          </RNText>
        </View>

        {/* ── Right Content ── */}
        <View style={{ flex: 1 }}>
          {/* Section Header */}
          <View
            style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              paddingHorizontal: 28, paddingVertical: 16,
              borderBottomWidth: 1,
              borderBottomColor: tc.border.subtle,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: activeSectionInfo.color, alignItems: 'center', justifyContent: 'center' }}>
                <activeSectionInfo.icon size={18} color={tc.text.inverse} />
              </View>
              <RNText style={{ fontSize: 18, fontWeight: '700', color: tc.text.primary }}>{activeSectionInfo.label}</RNText>
            </View>
            <Pressable onPress={handleClose} style={{ width: 28, height: 28, borderRadius: 6, alignItems: 'center', justifyContent: 'center' }} accessibilityLabel="Close marketplace">
              <XIcon size={16} color={tc.text.secondary} />
            </Pressable>
          </View>

          {renderSectionContent()}
        </View>
      </View>
    </Overlay>
  );
}
