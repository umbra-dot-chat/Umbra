/**
 * InstallBanner — A top banner prompting users to install or update Umbra.
 *
 * - Web users with update: shows OTA update banner (preload → reload)
 * - Web users without update: shows "Umbra is available as a native app!"
 * - Desktop users (Tauri): shows OTA update progress when available
 * - Mobile users: shows "A new version is available" when applicable
 *
 * The web OTA update and install-as-app banners have independent dismiss state.
 * Uses AnimatedPresence for a smooth slide-down entrance/exit.
 */

import React, { useState } from 'react';
import { Platform, View, Pressable, Text as RNText, Linking } from 'react-native';
import { useTheme } from '@coexist/wisp-react-native';
import { useAppUpdate } from '@/hooks/useAppUpdate';
import { AllPlatformsDialog } from '@/components/modals/AllPlatformsDialog';
import { RestartUpdateDialog } from '@/components/modals/RestartUpdateDialog';
import { AnimatedPresence } from '@/components/ui/AnimatedPresence';
import {
  XIcon,
  DownloadIcon,
  ExternalLinkIcon,
  ChevronDownIcon,
} from '@/components/ui';

export function InstallBanner() {
  const { theme } = useTheme();
  const tc = theme.colors;
  const update = useAppUpdate();
  const [showAllPlatforms, setShowAllPlatforms] = useState(false);
  const [showRestartDialog, setShowRestartDialog] = useState(false);

  // Hide on mobile — the user is already running the native app
  const isMobile = Platform.OS === 'ios' || Platform.OS === 'android';

  // Don't show if loading or nothing to show.
  // For web users: skip the global dismiss check — the web update banner and
  // install-as-app banner have independent dismiss semantics handled below.
  const globallyHidden = isMobile || update.isLoading || !update.hasUpdate || (!update.isWebUser && update.isDismissed);

  // --- Compute banner content ---
  let bannerContent: React.ReactNode = null;

  if (!globallyHidden) {
    // Desktop OTA: error phase
    if (update.isDesktopUser && update.desktopUpdate.phase === 'error') {
      bannerContent = (
        <View
          style={{
            backgroundColor: tc.status.danger,
            paddingVertical: 8,
            paddingHorizontal: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
          }}
        >
          <RNText style={{ color: tc.text.inverse, fontSize: 13, fontWeight: '600' }}>
            Update failed
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
              Retry
            </RNText>
          </Pressable>
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
      );
    }

    // Desktop OTA: downloading phase
    else if (update.isDesktopUser && update.desktopUpdate.phase === 'downloading') {
      const progress = Math.round(update.desktopUpdate.progress);
      bannerContent = (
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
    else if (update.isDesktopUser && update.desktopUpdate.phase === 'ready') {
      bannerContent = (
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
            onPress={() => setShowRestartDialog(true)}
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
    else if (update.isDesktopUser && update.desktopUpdate.available) {
      bannerContent = (
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
      );
    }

    // Web user: update available — show OTA update banner (takes priority over install prompt)
    else if (update.isWebUser && update.webUpdate.available && !update.isDismissed) {
      // Error phase
      if (update.webUpdate.phase === 'error') {
        bannerContent = (
          <View
            style={{
              backgroundColor: tc.status.danger,
              paddingVertical: 8,
              paddingHorizontal: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
            }}
          >
            <RNText style={{ color: tc.text.inverse, fontSize: 13, fontWeight: '600' }}>
              Update failed
            </RNText>
            <Pressable
              onPress={update.webUpdate.preloadAndReload}
              style={({ pressed }) => ({
                backgroundColor: pressed ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.2)',
                paddingVertical: 4,
                paddingHorizontal: 12,
                borderRadius: 6,
              })}
            >
              <RNText style={{ color: tc.text.inverse, fontSize: 12, fontWeight: '600' }}>
                Retry
              </RNText>
            </Pressable>
            <Pressable
              onPress={update.dismiss}
              style={{ marginLeft: 4, padding: 2, borderRadius: 4 }}
            >
              <XIcon size={14} color={tc.text.inverse} />
            </Pressable>
          </View>
        );
      }

      // Preloading phase
      else if (update.webUpdate.phase === 'preloading') {
        const progress = Math.round(update.webUpdate.progress);
        bannerContent = (
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
              {update.webUpdate.statusText || `Updating to v${update.latestVersion}...`}
            </RNText>
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

      // Ready phase — preload complete, confirm reload
      else if (update.webUpdate.phase === 'ready') {
        bannerContent = (
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
              onPress={update.webUpdate.preloadAndReload}
              style={({ pressed }) => ({
                backgroundColor: pressed ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.2)',
                paddingVertical: 4,
                paddingHorizontal: 12,
                borderRadius: 6,
              })}
            >
              <RNText style={{ color: tc.text.inverse, fontSize: 12, fontWeight: '600' }}>
                Reload Now
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

      // Idle — update available, offer to update
      else {
        bannerContent = (
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
              onPress={update.webUpdate.preloadAndReload}
              style={({ pressed }) => ({
                backgroundColor: pressed ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.2)',
                paddingVertical: 4,
                paddingHorizontal: 12,
                borderRadius: 6,
              })}
            >
              <RNText style={{ color: tc.text.inverse, fontSize: 12, fontWeight: '600' }}>
                Update Now
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
              style={{ marginLeft: 4, padding: 2, borderRadius: 4 }}
            >
              <XIcon size={14} color={tc.text.inverse} />
            </Pressable>
          </View>
        );
      }
    }

    // Web user: no version update — show install-as-app prompt (unless dismissed)
    else if (update.isWebUser && !update.isInstallDismissed) {
      const version = update.latestVersion || update.currentVersion;
      const primaryLabel = update.primaryDownload
        ? `Install v${version} for ${update.primaryDownload.label.split(' ')[0]}`
        : `Download v${version}`;

      bannerContent = (
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
            onPress={update.dismissInstall}
            style={{
              marginLeft: 4,
              padding: 2,
              borderRadius: 4,
            }}
          >
            <XIcon size={14} color={tc.text.inverse} />
          </Pressable>
        </View>
      );
    }

    // Non-web, non-desktop with update available (e.g. future mobile with OTA)
    else if (update.hasUpdate) {
      bannerContent = (
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
      );
    }
  }

  return (
    <>
      <AnimatedPresence visible={!!bannerContent} preset="slideDown" slideDistance={20}>
        {bannerContent}
      </AnimatedPresence>

      {/* Dialogs render outside animation wrapper */}
      <AllPlatformsDialog
        open={showAllPlatforms}
        onClose={() => setShowAllPlatforms(false)}
        downloads={update.downloads}
        version={update.latestVersion || update.currentVersion}
        releaseUrl={update.releaseUrl}
      />
      <RestartUpdateDialog
        open={showRestartDialog}
        onClose={() => setShowRestartDialog(false)}
        version={update.latestVersion || update.currentVersion}
        onRestart={update.desktopUpdate.restart}
      />
    </>
  );
}
