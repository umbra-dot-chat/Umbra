import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import type { PlatformDownload, AppUpdateState } from '@/types/version';
import appJson from '@/app.json';

const APP_VERSION = appJson.expo.version;

const GITHUB_REPO = 'InfamousVague/Umbra';
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;

// Check interval: 6 hours
const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;

// Storage key prefix for dismiss state
const DISMISS_KEY_PREFIX = 'umbra_update_dismissed_';
const INSTALL_DISMISS_KEY = 'umbra_install_prompt_dismissed';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Detect if running inside Tauri (desktop) */
function isTauri(): boolean {
  return typeof window !== 'undefined' && !!(window as any).__TAURI_INTERNALS__;
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
    { platform: 'web', label: 'Web App', url: 'https://umbra.chat', icon: 'globe' },
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

  // Web OTA state
  const [webPhase, setWebPhase] = useState<'idle' | 'preloading' | 'ready' | 'error'>('idle');
  const [webProgress, setWebProgress] = useState(0);
  const [webStatusText, setWebStatusText] = useState('');

  // Web install prompt dismiss state (separate from version update dismiss)
  const [isInstallDismissed, setIsInstallDismissed] = useState(() => {
    return getStorageItem(INSTALL_DISMISS_KEY) === 'true';
  });

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
      // eslint-disable-next-line no-new-func
      const dynamicImport = new Function('m', 'return import(m)') as (m: string) => Promise<any>;
      const { check } = await dynamicImport('@tauri-apps/plugin-updater');
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

      let totalBytes = 0;
      let downloadedBytes = 0;

      await update.downloadAndInstall((event: any) => {
        if (event.event === 'Started') {
          totalBytes = event.data?.contentLength || 0;
          downloadedBytes = 0;
        } else if (event.event === 'Progress') {
          downloadedBytes += event.data?.chunkLength || 0;
          if (totalBytes > 0) {
            setDesktopProgress(Math.min(100, (downloadedBytes / totalBytes) * 100));
          }
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
      // eslint-disable-next-line no-new-func
      const dynamicImport = new Function('m', 'return import(m)') as (m: string) => Promise<any>;
      const { relaunch } = await dynamicImport('@tauri-apps/plugin-process');
      await relaunch();
    } catch (err) {
      console.error('[useAppUpdate] Restart failed:', err);
    }
  }, []);

  // Web OTA: preload new assets then reload without cache
  const preloadAndReload = useCallback(async () => {
    if (!isWeb) return;

    try {
      setWebPhase('preloading');
      setWebProgress(0);
      setWebStatusText('Checking for updates...');

      // Step 1: Fetch the fresh index.html (cache-busted) to discover new asset URLs
      setWebProgress(10);
      setWebStatusText('Fetching latest version...');
      const indexRes = await fetch('/', { cache: 'no-store' });
      if (!indexRes.ok) throw new Error(`Failed to fetch index: ${indexRes.status}`);
      const html = await indexRes.text();

      // Step 2: Parse out JS and CSS asset URLs from the HTML
      const assetUrls: string[] = [];
      const scriptMatches = html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi);
      for (const m of scriptMatches) assetUrls.push(m[1]);
      const linkMatches = html.matchAll(/<link[^>]+href=["']([^"']+\.css[^"']*)["']/gi);
      for (const m of linkMatches) assetUrls.push(m[1]);

      setWebProgress(20);
      setWebStatusText(`Preloading ${assetUrls.length} assets...`);

      // Step 3: Preload each asset so the browser caches them before reload
      const total = assetUrls.length || 1;
      let loaded = 0;

      await Promise.allSettled(
        assetUrls.map(async (url) => {
          try {
            const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url.startsWith('/') ? '' : '/'}${url}`;
            await fetch(fullUrl, { cache: 'reload' });
          } catch {
            // Non-critical — the browser will fetch on reload anyway
          } finally {
            loaded++;
            setWebProgress(20 + Math.round((loaded / total) * 70));
            setWebStatusText(`Preloading assets (${loaded}/${total})...`);
          }
        }),
      );

      // Step 4: Clear any service worker caches
      setWebProgress(95);
      setWebStatusText('Finalizing...');
      if ('caches' in window) {
        try {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map((name) => caches.delete(name)));
        } catch {
          // Not critical
        }
      }

      // Step 5: Ready — user sees "Update ready" and can confirm
      setWebProgress(100);
      setWebStatusText('Ready to update!');
      setWebPhase('ready');
    } catch (err) {
      console.error('[useAppUpdate] Web preload failed:', err);
      setWebPhase('error');
      setWebStatusText('Preload failed');
    }
  }, [isWeb]);

  // Web OTA: perform the actual reload (called after preload completes)
  const webReload = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.location.reload();
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

  // Determine if there's an actual version update available
  const hasUpdate = latestVersion ? isNewerVersion(latestVersion, APP_VERSION) : false;

  // Show the banner if there's a real update OR if web user hasn't dismissed the install prompt
  const shouldShow = hasUpdate || isWeb;

  // Find the best download for the current platform
  const userPlatform = detectPlatform();
  const primaryDownload = userPlatform
    ? downloads.find((d) => d.platform === userPlatform) || null
    : null;

  // Dismiss handler (for version update banners)
  const dismiss = useCallback(() => {
    const version = latestVersion || APP_VERSION;
    setStorageItem(`${DISMISS_KEY_PREFIX}${version}`, 'true');
    setIsDismissed(true);
  }, [latestVersion]);

  // Dismiss handler for web install-as-app prompt
  const dismissInstall = useCallback(() => {
    setStorageItem(INSTALL_DISMISS_KEY, 'true');
    setIsInstallDismissed(true);
  }, []);

  return {
    hasUpdate: shouldShow,
    hasVersionUpdate: hasUpdate,
    isWebUser: isWeb,
    isDesktopUser: isDesktop,
    currentVersion: APP_VERSION,
    latestVersion,
    downloads,
    primaryDownload,
    dismiss,
    dismissInstall,
    isDismissed,
    isInstallDismissed,
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
    webUpdate: {
      available: isWeb && hasUpdate,
      phase: webPhase,
      progress: webProgress,
      statusText: webStatusText,
      preloadAndReload: webPhase === 'ready' ? webReload : preloadAndReload,
    },
  };
}
