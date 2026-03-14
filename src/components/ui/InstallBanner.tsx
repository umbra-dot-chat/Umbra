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

import React, { useState, useEffect, useRef } from 'react';
import { Platform, Pressable, Linking } from 'react-native';
import { Box, Text, useTheme } from '@coexist/wisp-react-native';
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
import { dbg } from '@/utils/debug';

export function InstallBanner({ topInset = 0, onVisibilityChange }: { topInset?: number; onVisibilityChange?: (visible: boolean) => void }) {
  if (__DEV__) dbg.trackRender('InstallBanner');
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
      const errorMsg = update.desktopUpdate.error;
      bannerContent = (
        <Box
          style={{
            backgroundColor: tc.status.danger,
            paddingTop: 8 + topInset,
            paddingBottom: 8,
            paddingHorizontal: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
          }}
        >
          <Text size="sm" weight="semibold" style={{ color: tc.text.onAccent }}>
            Update failed{errorMsg ? `: ${errorMsg}` : ''}
          </Text>
          <Pressable
            onPress={update.desktopUpdate.downloadAndInstall}
            style={({ pressed }) => ({
              backgroundColor: pressed ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.2)',
              paddingVertical: 4,
              paddingHorizontal: 12,
              borderRadius: 6,
            })}
          >
            <Text size="xs" weight="semibold" style={{ color: tc.text.onAccent }}>
              Retry
            </Text>
          </Pressable>
          <Pressable
            onPress={update.dismiss}
            style={{
              marginLeft: 4,
              padding: 2,
              borderRadius: 4,
            }}
          >
            <XIcon size={14} color={tc.text.onAccent} />
          </Pressable>
        </Box>
      );
    }

    // Desktop OTA: downloading phase
    else if (update.isDesktopUser && update.desktopUpdate.phase === 'downloading') {
      const progress = Math.round(update.desktopUpdate.progress);
      bannerContent = (
        <Box
          style={{
            backgroundColor: tc.accent.primary,
            paddingTop: 8 + topInset,
            paddingBottom: 8,
            paddingHorizontal: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
          }}
        >
          <DownloadIcon size={16} color={tc.text.onAccent} />
          <Text size="sm" weight="medium" style={{ color: tc.text.onAccent }}>
            Downloading v{update.latestVersion}...
          </Text>
          {/* Progress bar */}
          <Box
            style={{
              width: 120,
              height: 6,
              backgroundColor: 'rgba(255,255,255,0.3)',
              borderRadius: 3,
              overflow: 'hidden',
            }}
          >
            <Box
              style={{
                width: `${progress}%` as any,
                height: '100%',
                backgroundColor: tc.text.onAccent,
                borderRadius: 3,
              }}
            />
          </Box>
          <Text size="xs" style={{ color: tc.text.onAccent, opacity: 0.8 }}>
            {progress}%
          </Text>
        </Box>
      );
    }

    // Desktop OTA: ready to restart
    else if (update.isDesktopUser && update.desktopUpdate.phase === 'ready') {
      bannerContent = (
        <Box
          style={{
            backgroundColor: tc.status.success,
            paddingTop: 8 + topInset,
            paddingBottom: 8,
            paddingHorizontal: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
          }}
        >
          <Text size="sm" weight="semibold" style={{ color: tc.text.onAccent }}>
            Update ready!
          </Text>
          <Pressable
            onPress={() => setShowRestartDialog(true)}
            style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              paddingVertical: 4,
              paddingHorizontal: 12,
              borderRadius: 6,
            }}
          >
            <Text size="xs" weight="semibold" style={{ color: tc.text.onAccent }}>
              Restart Now
            </Text>
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
            <Text size="xs" style={{ color: tc.text.onAccent }}>Later</Text>
          </Pressable>
        </Box>
      );
    }

    // Desktop OTA: update available
    else if (update.isDesktopUser && update.desktopUpdate.available) {
      bannerContent = (
        <Box
          style={{
            backgroundColor: tc.accent.primary,
            paddingTop: 8 + topInset,
            paddingBottom: 8,
            paddingHorizontal: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
          }}
        >
          <Text size="sm" weight="medium" style={{ color: tc.text.onAccent }}>
            Umbra v{update.latestVersion} available
          </Text>
          <Pressable
            onPress={update.desktopUpdate.downloadAndInstall}
            style={({ pressed }) => ({
              backgroundColor: pressed ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.2)',
              paddingVertical: 4,
              paddingHorizontal: 12,
              borderRadius: 6,
            })}
          >
            <Text size="xs" weight="semibold" style={{ color: tc.text.onAccent }}>
              Update & Restart
            </Text>
          </Pressable>
          {update.releaseUrl && (
            <Pressable
              onPress={() => Linking.openURL(update.releaseUrl!)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <Text size="xs" style={{ color: tc.text.onAccent, opacity: 0.8 }}>
                Release Notes
              </Text>
              <ExternalLinkIcon size={12} color={tc.text.onAccent} />
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
            <XIcon size={14} color={tc.text.onAccent} />
          </Pressable>
        </Box>
      );
    }

    // Web user: update available — show OTA update banner (takes priority over install prompt)
    else if (update.isWebUser && update.webUpdate.available && !update.isDismissed) {
      // Error phase
      if (update.webUpdate.phase === 'error') {
        bannerContent = (
          <Box
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
            <Text size="sm" weight="semibold" style={{ color: tc.text.onAccent }}>
              Update failed
            </Text>
            <Pressable
              onPress={update.webUpdate.preloadAndReload}
              style={({ pressed }) => ({
                backgroundColor: pressed ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.2)',
                paddingVertical: 4,
                paddingHorizontal: 12,
                borderRadius: 6,
              })}
            >
              <Text size="xs" weight="semibold" style={{ color: tc.text.onAccent }}>
                Retry
              </Text>
            </Pressable>
            <Pressable
              onPress={update.dismiss}
              style={{ marginLeft: 4, padding: 2, borderRadius: 4 }}
            >
              <XIcon size={14} color={tc.text.onAccent} />
            </Pressable>
          </Box>
        );
      }

      // Preloading phase
      else if (update.webUpdate.phase === 'preloading') {
        const progress = Math.round(update.webUpdate.progress);
        bannerContent = (
          <Box
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
            <DownloadIcon size={16} color={tc.text.onAccent} />
            <Text size="sm" weight="medium" style={{ color: tc.text.onAccent }}>
              {update.webUpdate.statusText || `Updating to v${update.latestVersion}...`}
            </Text>
            <Box
              style={{
                width: 120,
                height: 6,
                backgroundColor: 'rgba(255,255,255,0.3)',
                borderRadius: 3,
                overflow: 'hidden',
              }}
            >
              <Box
                style={{
                  width: `${progress}%` as any,
                  height: '100%',
                  backgroundColor: tc.text.onAccent,
                  borderRadius: 3,
                }}
              />
            </Box>
            <Text size="xs" style={{ color: tc.text.onAccent, opacity: 0.8 }}>
              {progress}%
            </Text>
          </Box>
        );
      }

      // Ready phase — preload complete, confirm reload
      else if (update.webUpdate.phase === 'ready') {
        bannerContent = (
          <Box
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
            <Text size="sm" weight="semibold" style={{ color: tc.text.onAccent }}>
              Update ready!
            </Text>
            <Pressable
              onPress={update.webUpdate.preloadAndReload}
              style={({ pressed }) => ({
                backgroundColor: pressed ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.2)',
                paddingVertical: 4,
                paddingHorizontal: 12,
                borderRadius: 6,
              })}
            >
              <Text size="xs" weight="semibold" style={{ color: tc.text.onAccent }}>
                Reload Now
              </Text>
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
              <Text size="xs" style={{ color: tc.text.onAccent }}>Later</Text>
            </Pressable>
          </Box>
        );
      }

      // Idle — update available, offer to update
      else {
        bannerContent = (
          <Box
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
            <Text size="sm" weight="medium" style={{ color: tc.text.onAccent }}>
              Umbra v{update.latestVersion} available
            </Text>
            <Pressable
              onPress={update.webUpdate.preloadAndReload}
              style={({ pressed }) => ({
                backgroundColor: pressed ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.2)',
                paddingVertical: 4,
                paddingHorizontal: 12,
                borderRadius: 6,
              })}
            >
              <Text size="xs" weight="semibold" style={{ color: tc.text.onAccent }}>
                Update Now
              </Text>
            </Pressable>
            {update.releaseUrl && (
              <Pressable
                onPress={() => Linking.openURL(update.releaseUrl!)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
              >
                <Text size="xs" style={{ color: tc.text.onAccent, opacity: 0.8 }}>
                  Release Notes
                </Text>
                <ExternalLinkIcon size={12} color={tc.text.onAccent} />
              </Pressable>
            )}
            <Pressable
              onPress={update.dismiss}
              style={{ marginLeft: 4, padding: 2, borderRadius: 4 }}
            >
              <XIcon size={14} color={tc.text.onAccent} />
            </Pressable>
          </Box>
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
        <Box
          style={{
            backgroundColor: tc.accent.primary,
            paddingTop: 8 + topInset,
            paddingBottom: 8,
            paddingHorizontal: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
          }}
        >
          <DownloadIcon size={16} color={tc.text.onAccent} />
          <Text size="sm" weight="medium" style={{ color: tc.text.onAccent }}>
            Umbra is available as a native app!
          </Text>

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
              <Text size="xs" weight="semibold" style={{ color: tc.text.onAccent }}>
                {primaryLabel}
              </Text>
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
            <Text size="xs" style={{ color: tc.text.onAccent, opacity: 0.9 }}>
              More platforms
            </Text>
            <ChevronDownIcon size={12} color={tc.text.onAccent} />
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
            <XIcon size={14} color={tc.text.onAccent} />
          </Pressable>
        </Box>
      );
    }

    // Non-web, non-desktop with update available (e.g. future mobile with OTA)
    // Also reached by web users when both isDismissed and isInstallDismissed are true
    // but globallyHidden intentionally skips web dismiss — so guard here too.
    else if (update.hasUpdate && !update.isDismissed) {
      bannerContent = (
        <Box
          style={{
            backgroundColor: tc.accent.primary,
            paddingTop: 8 + topInset,
            paddingBottom: 8,
            paddingHorizontal: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
          }}
        >
          <Text size="sm" weight="medium" style={{ color: tc.text.onAccent }}>
            Umbra v{update.latestVersion} is available!
          </Text>
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
              <Text size="xs" weight="semibold" style={{ color: tc.text.onAccent }}>
                View Release
              </Text>
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
            <XIcon size={14} color={tc.text.onAccent} />
          </Pressable>
        </Box>
      );
    }
  }

  // Report visibility changes to parent
  const isVisible = !!bannerContent;
  const callbackRef = useRef(onVisibilityChange);
  callbackRef.current = onVisibilityChange;
  useEffect(() => {
    callbackRef.current?.(isVisible);
  }, [isVisible]);

  return (
    <>
      <AnimatedPresence visible={isVisible} preset="slideDown" slideDistance={20}>
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
