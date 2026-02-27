/**
 * AllPlatformsDialog — Modal showing download links for all platforms.
 */

import React from 'react';
import { View, Pressable, ScrollView, Text as RNText, Linking } from 'react-native';
import { Overlay, useTheme } from '@coexist/wisp-react-native';
import type { PlatformDownload } from '@/types/version';
import {
  XIcon,
  DownloadIcon,
  ExternalLinkIcon,
  GlobeIcon,
} from '@/components/ui';

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
  const { theme } = useTheme();
  const tc = theme.colors;

  if (!open) return null;

  const { desktop, mobile, web } = groupDownloads(downloads);

  const sectionTitleStyle = {
    fontSize: 12,
    fontWeight: '600' as const,
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
      <View
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
        <View
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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <DownloadIcon size={20} color={tc.accent.primary} />
            <RNText style={{ fontSize: 17, fontWeight: '700', color: tc.text.primary }}>
              Download Umbra v{version}
            </RNText>
          </View>
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
        </View>

        {/* Content */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, paddingTop: 0 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Desktop */}
          {desktop.length > 0 && (
            <>
              <RNText style={sectionTitleStyle}>Desktop</RNText>
              {desktop.map((d) => (
                <Pressable
                  key={d.platform}
                  onPress={() => Linking.openURL(d.url)}
                  style={({ pressed }) => ({
                    ...rowStyle,
                    backgroundColor: pressed ? tc.accent.highlight : tc.background.raised,
                  })}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <RNText style={{ fontSize: 18 }}>{getPlatformIcon(d.icon)}</RNText>
                    <View>
                      <RNText style={{ fontSize: 14, fontWeight: '500', color: tc.text.primary }}>
                        {d.label}
                      </RNText>
                      {d.size && (
                        <RNText style={{ fontSize: 11, color: tc.text.muted, marginTop: 1 }}>
                          {d.size}
                        </RNText>
                      )}
                    </View>
                  </View>
                  <DownloadIcon size={16} color={tc.text.muted} />
                </Pressable>
              ))}
            </>
          )}

          {/* Mobile */}
          {mobile.length > 0 && (
            <>
              <RNText style={sectionTitleStyle}>Mobile</RNText>
              {mobile.map((d) => (
                <Pressable
                  key={d.platform}
                  onPress={() => Linking.openURL(d.url)}
                  style={({ pressed }) => ({
                    ...rowStyle,
                    backgroundColor: pressed ? tc.accent.highlight : tc.background.raised,
                  })}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <RNText style={{ fontSize: 18 }}>{getPlatformIcon(d.icon)}</RNText>
                    <RNText style={{ fontSize: 14, fontWeight: '500', color: tc.text.primary }}>
                      {d.label}
                    </RNText>
                  </View>
                  <ExternalLinkIcon size={16} color={tc.text.muted} />
                </Pressable>
              ))}
            </>
          )}

          {/* Web */}
          {web.length > 0 && (
            <>
              <RNText style={sectionTitleStyle}>Web</RNText>
              {web.map((d) => (
                <Pressable
                  key={d.platform}
                  onPress={() => Linking.openURL(d.url)}
                  style={({ pressed }) => ({
                    ...rowStyle,
                    backgroundColor: pressed ? tc.accent.highlight : tc.background.raised,
                  })}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <GlobeIcon size={18} color={tc.text.secondary} />
                    <RNText style={{ fontSize: 14, fontWeight: '500', color: tc.text.primary }}>
                      {d.label}
                    </RNText>
                  </View>
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
              <RNText style={{ fontSize: 13, color: tc.text.link, fontWeight: '500' }}>
                View on GitHub
              </RNText>
              <ExternalLinkIcon size={14} color={tc.text.link} />
            </Pressable>
          )}
        </ScrollView>
      </View>
    </Overlay>
  );
}
