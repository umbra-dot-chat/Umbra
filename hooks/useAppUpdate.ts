import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import type { PlatformDownload, AppUpdateState } from '@/types/version';

// Current app version from package.json / app.json
const APP_VERSION = '1.0.0';

const GITHUB_REPO = 'InfamousVague/Umbra';
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;

// Check interval: 6 hours
const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;

// Storage key prefix for dismiss state
const DISMISS_KEY_PREFIX = 'umbra_update_dismissed_';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Detect if running inside Tauri (desktop) */
function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}

/** Detect the user's OS for download recommendation */
function detectPlatform(): PlatformDownload['platform'] | null {
  if (Platform.OS === 'ios') return 'ios';
  if (Platform.OS === 'android') return 'android';
  if (Platform.OS !== 'web') return null;

  // Web — detect OS from user agent
  if (typeof navigator === 'undefined') return null;
  const ua = navigator.userAgent.toLowerCase();

  if (ua.includes('mac')) {
    // Detect Apple Silicon vs Intel via platform or navigator hints
    // @ts-expect-error - userAgentData is not in all TS types
    const arch = navigator.userAgentData?.architecture;
    if (arch === 'arm') return 'macos-arm';
    return 'macos-arm'; // Default to ARM for modern Macs
  }
  if (ua.includes('win')) return 'windows';
  if (ua.includes('linux')) return 'linux-appimage';

  return null;
}

const GITHUB_RELEASES_URL = `https://github.com/${GITHUB_REPO}/releases`;

/** All platform fallback entries — shown even before the first release */
function getDefaultDownloads(releaseUrl?: string): PlatformDownload[] {
  const url = releaseUrl || GITHUB_RELEASES_URL;
  return [
    { platform: 'macos-arm', label: 'macOS (Apple Silicon)', url, icon: 'apple' },
    { platform: 'macos-intel', label: 'macOS (Intel)', url, icon: 'apple' },
    { platform: 'windows', label: 'Windows', url, icon: 'windows' },
    { platform: 'linux-deb', label: 'Linux (.deb)', url, icon: 'linux' },
    { platform: 'linux-appimage', label: 'Linux (AppImage)', url, icon: 'linux' },
    { platform: 'ios', label: 'iOS (.ipa)', url, icon: 'apple' },
    { platform: 'android', label: 'Android (.apk)', url, icon: 'android' },
    { platform: 'web', label: 'Web App', url: 'https://chat.deepspaceshipping.co', icon: 'globe' },
  ];
}

/** Parse GitHub release assets into PlatformDownload[], with fallbacks for every platform */
function parseReleaseAssets(
  assets: Array<{ name: string; browser_download_url: string; size: number }>,
  releaseUrl?: string,
): PlatformDownload[] {
  // Map of platformId → download (filled from actual assets)
  const found = new Map<string, PlatformDownload>();

  for (const asset of assets) {
    const name = asset.name.toLowerCase();
    const sizeStr = `${Math.round(asset.size / 1024 / 1024)} MB`;

    // Skip signature files and manifests
    if (name.endsWith('.sig') || name === 'latest.json' || name.endsWith('.zip')) continue;

    if (name.endsWith('.dmg') && (name.includes('aarch64') || name.includes('arm'))) {
      found.set('macos-arm', {
        platform: 'macos-arm',
        label: 'macOS (Apple Silicon)',
        url: asset.browser_download_url,
        size: sizeStr,
        icon: 'apple',
      });
    } else if (name.endsWith('.dmg') && (name.includes('x86_64') || name.includes('x64') || name.includes('intel'))) {
      found.set('macos-intel', {
        platform: 'macos-intel',
        label: 'macOS (Intel)',
        url: asset.browser_download_url,
        size: sizeStr,
        icon: 'apple',
      });
    } else if (name.endsWith('.dmg')) {
      // Generic DMG — use as macOS ARM if not already set
      if (!found.has('macos-arm')) {
        found.set('macos-arm', {
          platform: 'macos-arm',
          label: 'macOS',
          url: asset.browser_download_url,
          size: sizeStr,
          icon: 'apple',
        });
      }
    } else if (name.endsWith('.msi') || name.endsWith('.exe')) {
      found.set('windows', {
        platform: 'windows',
        label: 'Windows',
        url: asset.browser_download_url,
        size: sizeStr,
        icon: 'windows',
      });
    } else if (name.endsWith('.deb')) {
      found.set('linux-deb', {
        platform: 'linux-deb',
        label: 'Linux (.deb)',
        url: asset.browser_download_url,
        size: sizeStr,
        icon: 'linux',
      });
    } else if (name.endsWith('.appimage')) {
      found.set('linux-appimage', {
        platform: 'linux-appimage',
        label: 'Linux (AppImage)',
        url: asset.browser_download_url,
        size: sizeStr,
        icon: 'linux',
      });
    } else if (name.endsWith('.ipa')) {
      found.set('ios', {
        platform: 'ios',
        label: 'iOS (.ipa)',
        url: asset.browser_download_url,
        size: sizeStr,
        icon: 'apple',
      });
    } else if (name.endsWith('.apk')) {
      found.set('android', {
        platform: 'android',
        label: 'Android (.apk)',
        url: asset.browser_download_url,
        size: sizeStr,
        icon: 'android',
      });
    }
  }

  // Merge: use real assets where available, fallbacks for the rest
  const defaults = getDefaultDownloads(releaseUrl);
  const downloads: PlatformDownload[] = [];

  for (const fallback of defaults) {
    const real = found.get(fallback.platform);
    downloads.push(real || fallback);
  }

  return downloads;
}

/** Simple semver comparison: returns true if a > b */
function isNewerVersion(a: string, b: string): boolean {
  const pa = a.replace(/^v/, '').split('.').map(Number);
  const pb = b.replace(/^v/, '').split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const va = pa[i] || 0;
    const vb = pb[i] || 0;
    if (va > vb) return true;
    if (va < vb) return false;
  }
  return false;
}

/** Safely read from localStorage */
function getStorageItem(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
  } catch {
    // SSR or restricted environment
  }
  return null;
}

/** Safely write to localStorage */
function setStorageItem(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch {
    // SSR or restricted environment
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAppUpdate(): AppUpdateState {
  const isWeb = Platform.OS === 'web' && !isTauri();
  const isDesktop = isTauri();

  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [downloads, setDownloads] = useState<PlatformDownload[]>(getDefaultDownloads);
  const [releaseUrl, setReleaseUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  // Desktop OTA state
  const [desktopPhase, setDesktopPhase] = useState<'idle' | 'downloading' | 'ready' | 'error'>('idle');
  const [desktopProgress, setDesktopProgress] = useState(0);
  const tauriUpdateRef = useRef<any>(null);

  // Check for dismissed state on mount
  useEffect(() => {
    if (latestVersion) {
      const dismissed = getStorageItem(`${DISMISS_KEY_PREFIX}${latestVersion}`);
      setIsDismissed(dismissed === 'true');
    }
  }, [latestVersion]);

  // Fetch latest release from GitHub
  const fetchLatestRelease = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(GITHUB_API_URL, {
        headers: { Accept: 'application/vnd.github.v3+json' },
      });

      if (!response.ok) {
        console.warn('[useAppUpdate] GitHub API returned', response.status);
        return;
      }

      const release = await response.json();
      const version = (release.tag_name as string)?.replace(/^v/, '') || null;

      setLatestVersion(version);
      setReleaseUrl(release.html_url || null);

      setDownloads(parseReleaseAssets(release.assets || [], release.html_url));
    } catch (err) {
      console.warn('[useAppUpdate] Failed to fetch latest release:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check for Tauri desktop OTA updates
  const checkTauriUpdate = useCallback(async () => {
    if (!isDesktop) return;

    try {
      // Dynamic import to avoid errors on non-Tauri platforms
      const { check } = await import('@tauri-apps/plugin-updater');
      const update = await check();

      if (update) {
        tauriUpdateRef.current = update;
        const version = update.version?.replace(/^v/, '');
        if (version) {
          setLatestVersion(version);
        }
      }
    } catch (err) {
      console.warn('[useAppUpdate] Tauri update check failed:', err);
    }
  }, [isDesktop]);

  // Download and install Tauri update
  const downloadAndInstall = useCallback(async () => {
    const update = tauriUpdateRef.current;
    if (!update) return;

    try {
      setDesktopPhase('downloading');
      setDesktopProgress(0);

      await update.downloadAndInstall((event: any) => {
        if (event.event === 'Started' && event.data?.contentLength) {
          // Total size known
        } else if (event.event === 'Progress') {
          const chunkLength = event.data?.chunkLength || 0;
          const contentLength = event.data?.contentLength || 1;
          setDesktopProgress((prev) => Math.min(100, prev + (chunkLength / contentLength) * 100));
        } else if (event.event === 'Finished') {
          setDesktopProgress(100);
          setDesktopPhase('ready');
        }
      });

      setDesktopPhase('ready');
    } catch (err) {
      console.error('[useAppUpdate] Download failed:', err);
      setDesktopPhase('error');
    }
  }, []);

  // Restart the app after Tauri update
  const restart = useCallback(async () => {
    try {
      const { relaunch } = await import('@tauri-apps/plugin-process');
      await relaunch();
    } catch (err) {
      console.error('[useAppUpdate] Restart failed:', err);
    }
  }, []);

  // Initial fetch + periodic check
  useEffect(() => {
    fetchLatestRelease();

    if (isDesktop) {
      checkTauriUpdate();
    }

    const interval = setInterval(() => {
      fetchLatestRelease();
      if (isDesktop) {
        checkTauriUpdate();
      }
    }, CHECK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [fetchLatestRelease, checkTauriUpdate, isDesktop]);

  // Determine if there's an update
  const hasUpdate = latestVersion ? isNewerVersion(latestVersion, APP_VERSION) : false;

  // For web users, always show the install prompt (even if same version)
  const shouldShow = isWeb || hasUpdate;

  // Find the best download for the current platform
  const userPlatform = detectPlatform();
  const primaryDownload = userPlatform
    ? downloads.find((d) => d.platform === userPlatform) || null
    : null;

  // Dismiss handler
  const dismiss = useCallback(() => {
    const version = latestVersion || APP_VERSION;
    setStorageItem(`${DISMISS_KEY_PREFIX}${version}`, 'true');
    setIsDismissed(true);
  }, [latestVersion]);

  return {
    hasUpdate: shouldShow,
    isWebUser: isWeb,
    isDesktopUser: isDesktop,
    currentVersion: APP_VERSION,
    latestVersion,
    downloads,
    primaryDownload,
    dismiss,
    isDismissed,
    isLoading,
    releaseUrl,
    checkForUpdate: fetchLatestRelease,
    desktopUpdate: {
      available: isDesktop && (hasUpdate || !!tauriUpdateRef.current),
      progress: desktopProgress,
      phase: desktopPhase,
      downloadAndInstall,
      restart,
    },
  };
}
