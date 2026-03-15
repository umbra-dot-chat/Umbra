/**
 * AllPlatformsDialog — Modal showing download links for all platforms.
 */

import React from 'react';
import { Pressable, Linking } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Overlay, Box, Text, ScrollArea, useTheme } from '@coexist/wisp-react-native';
import type { PlatformDownload } from '@/types/version';
import {
  XIcon,
  DownloadIcon,
  ExternalLinkIcon,
  GlobeIcon,
} from '@/components/ui';
import { dbg } from '@/utils/debug';

interface AllPlatformsDialogProps {
  open: boolean;
  onClose: () => void;
  downloads: PlatformDownload[];
  version: string;
  releaseUrl: string | null;
}

/** Group downloads by category */
function groupDownloads(downloads: PlatformDownload[]) {
  const desktop: PlatformDownload[] = [];
  const mobile: PlatformDownload[] = [];
  const web: PlatformDownload[] = [];

  for (const d of downloads) {
    switch (d.platform) {
      case 'macos-arm':
      case 'macos-intel':
      case 'windows':
      case 'linux-deb':
      case 'linux-appimage':
        desktop.push(d);
        break;
      case 'ios':
      case 'android':
        mobile.push(d);
        break;
      case 'web':
        web.push(d);
        break;
    }
  }

  return { desktop, mobile, web };
}

/** Map platform icon name to a display icon character */
function getPlatformIcon(icon: string): string {
  switch (icon) {
    case 'apple': return '\u{F8FF}'; // Apple logo (fallback to emoji)
    case 'windows': return '\u{1FA9F}'; // Window emoji
    case 'linux': return '\u{1F427}'; // Penguin
    case 'globe': return '\u{1F310}'; // Globe
    case 'android': return '\u{1F4F1}'; // Phone
    default: return '\u{1F4E6}'; // Package
  }
}

export function AllPlatformsDialog({ open, onClose, downloads, version, releaseUrl }: AllPlatformsDialogProps) {
  if (__DEV__) dbg.trackRender('AllPlatformsDialog');
  const { theme } = useTheme();
  const tc = theme.colors;
  const { t } = useTranslation('common');

  if (!open) return null;

  const { desktop, mobile, web } = groupDownloads(downloads);

  const sectionTitleStyle = {
    color: tc.text.muted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 16,
  };

  const rowStyle = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  };

  return (
    <Overlay
      open={open}
      backdrop="dim"
      center
      onBackdropPress={onClose}
      animationType="fade"
    >
      <Box
        style={{
          backgroundColor: tc.background.surface,
          borderRadius: 16,
          width: 420,
          maxHeight: 560,
          borderWidth: 1,
          borderColor: tc.border.subtle,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <Box
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 20,
            paddingBottom: 12,
            borderBottomWidth: 1,
            borderBottomColor: tc.border.subtle,
          }}
        >
          <Box style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <DownloadIcon size={20} color={tc.accent.primary} />
            <Text size="md" weight="bold" style={{ color: tc.text.primary }}>
              {t('downloadUmbraVersion', { version })}
            </Text>
          </Box>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => ({
              padding: 6,
              borderRadius: 8,
              backgroundColor: pressed ? tc.accent.highlight : 'transparent',
            })}
          >
            <XIcon size={18} color={tc.text.muted} />
          </Pressable>
        </Box>

        {/* Content */}
        <ScrollArea
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, paddingTop: 0 }}
        >
          {/* Desktop */}
          {desktop.length > 0 && (
            <>
              <Text size="xs" weight="semibold" style={sectionTitleStyle}>{t('desktop')}</Text>
              {desktop.map((d) => (
                <Pressable
                  key={d.platform}
                  onPress={() => Linking.openURL(d.url)}
                  style={({ pressed }) => ({
                    ...rowStyle,
                    backgroundColor: pressed ? tc.accent.highlight : tc.background.raised,
                  })}
                >
                  <Box style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Text size="md" style={{ fontSize: 18 }}>{getPlatformIcon(d.icon)}</Text>
                    <Box>
                      <Text size="sm" weight="medium" style={{ color: tc.text.primary }}>
                        {d.label}
                      </Text>
                      {d.size && (
                        <Text size="xs" style={{ color: tc.text.muted, marginTop: 1 }}>
                          {d.size}
                        </Text>
                      )}
                    </Box>
                  </Box>
                  <DownloadIcon size={16} color={tc.text.muted} />
                </Pressable>
              ))}
            </>
          )}

          {/* Mobile */}
          {mobile.length > 0 && (
            <>
              <Text size="xs" weight="semibold" style={sectionTitleStyle}>{t('mobile')}</Text>
              {mobile.map((d) => (
                <Pressable
                  key={d.platform}
                  onPress={() => Linking.openURL(d.url)}
                  style={({ pressed }) => ({
                    ...rowStyle,
                    backgroundColor: pressed ? tc.accent.highlight : tc.background.raised,
                  })}
                >
                  <Box style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Text size="md" style={{ fontSize: 18 }}>{getPlatformIcon(d.icon)}</Text>
                    <Text size="sm" weight="medium" style={{ color: tc.text.primary }}>
                      {d.label}
                    </Text>
                  </Box>
                  <ExternalLinkIcon size={16} color={tc.text.muted} />
                </Pressable>
              ))}
            </>
          )}

          {/* Web */}
          {web.length > 0 && (
            <>
              <Text size="xs" weight="semibold" style={sectionTitleStyle}>{t('web')}</Text>
              {web.map((d) => (
                <Pressable
                  key={d.platform}
                  onPress={() => Linking.openURL(d.url)}
                  style={({ pressed }) => ({
                    ...rowStyle,
                    backgroundColor: pressed ? tc.accent.highlight : tc.background.raised,
                  })}
                >
                  <Box style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <GlobeIcon size={18} color={tc.text.secondary} />
                    <Text size="sm" weight="medium" style={{ color: tc.text.primary }}>
                      {d.label}
                    </Text>
                  </Box>
                  <ExternalLinkIcon size={16} color={tc.text.muted} />
                </Pressable>
              ))}
            </>
          )}

          {/* GitHub link */}
          {releaseUrl && (
            <Pressable
              onPress={() => Linking.openURL(releaseUrl)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                marginTop: 16,
                paddingVertical: 10,
                borderRadius: 8,
                backgroundColor: pressed ? tc.accent.highlight : 'transparent',
              })}
            >
              <Text size="sm" weight="medium" style={{ color: tc.text.link }}>
                {t('viewOnGithub')}
              </Text>
              <ExternalLinkIcon size={14} color={tc.text.link} />
            </Pressable>
          )}
        </ScrollArea>
      </Box>
    </Overlay>
  );
}
