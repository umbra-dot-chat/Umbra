/**
 * InstallBanner — A top banner prompting users to install or update Umbra.
 *
 * - Web users: always shows "Umbra is available as a native app!"
 * - Desktop users (Tauri): shows OTA update progress when available
 * - Mobile users: shows "A new version is available" when applicable
 */

import React, { useState } from 'react';
import { Platform, View, Pressable, Text as RNText, Linking } from 'react-native';
import { useTheme } from '@coexist/wisp-react-native';
import { useAppUpdate } from '@/hooks/useAppUpdate';
import { AllPlatformsDialog } from '@/components/modals/AllPlatformsDialog';
import {
  XIcon,
  DownloadIcon,
  ExternalLinkIcon,
  ChevronDownIcon,
} from '@/components/icons';

export function InstallBanner() {
  const { theme } = useTheme();
  const tc = theme.colors;
  const update = useAppUpdate();
  const [showAllPlatforms, setShowAllPlatforms] = useState(false);

  // Hide on mobile — the user is already running the native app
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    return null;
  }

  // Don't show if dismissed, loading, or no update/install prompt needed
  if (update.isDismissed || update.isLoading || !update.hasUpdate) {
    return (
      <AllPlatformsDialog
        open={showAllPlatforms}
        onClose={() => setShowAllPlatforms(false)}
        downloads={update.downloads}
        version={update.latestVersion || update.currentVersion}
        releaseUrl={update.releaseUrl}
      />
    );
  }

  // Desktop OTA: downloading phase
  if (update.isDesktopUser && update.desktopUpdate.phase === 'downloading') {
    const progress = Math.round(update.desktopUpdate.progress);
    return (
      <View
        style={{
          backgroundColor: tc.accent.primary,
          paddingVertical: 8,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
        }}
      >
        <DownloadIcon size={16} color={tc.text.inverse} />
        <RNText style={{ color: tc.text.inverse, fontSize: 13, fontWeight: '500' }}>
          Downloading v{update.latestVersion}...
        </RNText>
        {/* Progress bar */}
        <View
          style={{
            width: 120,
            height: 6,
            backgroundColor: 'rgba(255,255,255,0.3)',
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              width: `${progress}%` as any,
              height: '100%',
              backgroundColor: tc.text.inverse,
              borderRadius: 3,
            }}
          />
        </View>
        <RNText style={{ color: tc.text.inverse, fontSize: 12, opacity: 0.8 }}>
          {progress}%
        </RNText>
      </View>
    );
  }

  // Desktop OTA: ready to restart
  if (update.isDesktopUser && update.desktopUpdate.phase === 'ready') {
    return (
      <View
        style={{
          backgroundColor: tc.status.success,
          paddingVertical: 8,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
        }}
      >
        <RNText style={{ color: tc.text.inverse, fontSize: 13, fontWeight: '600' }}>
          Update ready!
        </RNText>
        <Pressable
          onPress={update.desktopUpdate.restart}
          style={{
            backgroundColor: 'rgba(255,255,255,0.2)',
            paddingVertical: 4,
            paddingHorizontal: 12,
            borderRadius: 6,
          }}
        >
          <RNText style={{ color: tc.text.inverse, fontSize: 12, fontWeight: '600' }}>
            Restart Now
          </RNText>
        </Pressable>
        <Pressable
          onPress={update.dismiss}
          style={{
            backgroundColor: 'rgba(255,255,255,0.1)',
            paddingVertical: 4,
            paddingHorizontal: 12,
            borderRadius: 6,
          }}
        >
          <RNText style={{ color: tc.text.inverse, fontSize: 12 }}>Later</RNText>
        </Pressable>
      </View>
    );
  }

  // Desktop OTA: update available
  if (update.isDesktopUser && update.desktopUpdate.available) {
    return (
      <>
        <View
          style={{
            backgroundColor: tc.accent.primary,
            paddingVertical: 8,
            paddingHorizontal: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
          }}
        >
          <RNText style={{ color: tc.text.inverse, fontSize: 13, fontWeight: '500' }}>
            Umbra v{update.latestVersion} available
          </RNText>
          <Pressable
            onPress={update.desktopUpdate.downloadAndInstall}
            style={({ pressed }) => ({
              backgroundColor: pressed ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.2)',
              paddingVertical: 4,
              paddingHorizontal: 12,
              borderRadius: 6,
            })}
          >
            <RNText style={{ color: tc.text.inverse, fontSize: 12, fontWeight: '600' }}>
              Update & Restart
            </RNText>
          </Pressable>
          {update.releaseUrl && (
            <Pressable
              onPress={() => Linking.openURL(update.releaseUrl!)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <RNText style={{ color: tc.text.inverse, fontSize: 12, opacity: 0.8 }}>
                Release Notes
              </RNText>
              <ExternalLinkIcon size={12} color={tc.text.inverse} />
            </Pressable>
          )}
          <Pressable
            onPress={update.dismiss}
            style={{
              marginLeft: 4,
              padding: 2,
              borderRadius: 4,
            }}
          >
            <XIcon size={14} color={tc.text.inverse} />
          </Pressable>
        </View>
        <AllPlatformsDialog
          open={showAllPlatforms}
          onClose={() => setShowAllPlatforms(false)}
          downloads={update.downloads}
          version={update.latestVersion || update.currentVersion}
          releaseUrl={update.releaseUrl}
        />
      </>
    );
  }

  // Web user: always show install prompt
  if (update.isWebUser) {
    const version = update.latestVersion || update.currentVersion;
    const primaryLabel = update.primaryDownload
      ? `Install v${version} for ${update.primaryDownload.label.split(' ')[0]}`
      : `Download v${version}`;

    return (
      <>
        <View
          style={{
            backgroundColor: tc.accent.primary,
            paddingVertical: 8,
            paddingHorizontal: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
          }}
        >
          <DownloadIcon size={16} color={tc.text.inverse} />
          <RNText style={{ color: tc.text.inverse, fontSize: 13, fontWeight: '500' }}>
            Umbra is available as a native app!
          </RNText>

          {/* Primary download button */}
          {update.primaryDownload && (
            <Pressable
              onPress={() => Linking.openURL(update.primaryDownload!.url)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                backgroundColor: pressed ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.2)',
                paddingVertical: 4,
                paddingHorizontal: 12,
                borderRadius: 6,
              })}
            >
              <RNText style={{ color: tc.text.inverse, fontSize: 12, fontWeight: '600' }}>
                {primaryLabel}
              </RNText>
            </Pressable>
          )}

          {/* More platforms button */}
          <Pressable
            onPress={() => setShowAllPlatforms(true)}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 3,
              opacity: pressed ? 0.7 : 0.9,
            })}
          >
            <RNText style={{ color: tc.text.inverse, fontSize: 12, opacity: 0.9 }}>
              More platforms
            </RNText>
            <ChevronDownIcon size={12} color={tc.text.inverse} />
          </Pressable>

          {/* Dismiss */}
          <Pressable
            onPress={update.dismiss}
            style={{
              marginLeft: 4,
              padding: 2,
              borderRadius: 4,
            }}
          >
            <XIcon size={14} color={tc.text.inverse} />
          </Pressable>
        </View>

        <AllPlatformsDialog
          open={showAllPlatforms}
          onClose={() => setShowAllPlatforms(false)}
          downloads={update.downloads}
          version={update.latestVersion || update.currentVersion}
          releaseUrl={update.releaseUrl}
        />
      </>
    );
  }

  // Non-web, non-desktop with update available (e.g. future mobile with OTA)
  if (update.hasUpdate) {
    return (
      <>
        <View
          style={{
            backgroundColor: tc.accent.primary,
            paddingVertical: 8,
            paddingHorizontal: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
          }}
        >
          <RNText style={{ color: tc.text.inverse, fontSize: 13, fontWeight: '500' }}>
            Umbra v{update.latestVersion} is available!
          </RNText>
          {update.releaseUrl && (
            <Pressable
              onPress={() => Linking.openURL(update.releaseUrl!)}
              style={({ pressed }) => ({
                backgroundColor: pressed ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.2)',
                paddingVertical: 4,
                paddingHorizontal: 12,
                borderRadius: 6,
              })}
            >
              <RNText style={{ color: tc.text.inverse, fontSize: 12, fontWeight: '600' }}>
                View Release
              </RNText>
            </Pressable>
          )}
          <Pressable
            onPress={update.dismiss}
            style={{
              marginLeft: 4,
              padding: 2,
              borderRadius: 4,
            }}
          >
            <XIcon size={14} color={tc.text.inverse} />
          </Pressable>
        </View>
        <AllPlatformsDialog
          open={showAllPlatforms}
          onClose={() => setShowAllPlatforms(false)}
          downloads={update.downloads}
          version={update.latestVersion || update.currentVersion}
          releaseUrl={update.releaseUrl}
        />
      </>
    );
  }

  return null;
}
