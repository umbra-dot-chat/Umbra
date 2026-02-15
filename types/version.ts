/**
 * Types for the version manifest and in-app install/update banner.
 */

export type PlatformId =
  | 'web'
  | 'macos-arm'
  | 'macos-intel'
  | 'windows'
  | 'linux-deb'
  | 'linux-appimage'
  | 'ios'
  | 'android';

export interface PlatformDownload {
  /** Platform identifier */
  platform: PlatformId;
  /** Human-readable label (e.g. "macOS (Apple Silicon)") */
  label: string;
  /** Download or store URL */
  url: string;
  /** File size (e.g. "45 MB") */
  size?: string;
  /** Icon name from the icons system */
  icon: string;
}

export interface VersionManifest {
  /** Semver version string (e.g. "1.2.0") */
  version: string;
  /** ISO 8601 release date */
  releasedAt: string;
  /** GitHub release page URL */
  releaseUrl: string;
  /** Available downloads for all platforms */
  downloads: PlatformDownload[];
}

/** State returned by the useAppUpdate hook */
export interface AppUpdateState {
  /** Whether a newer version is available (always true for web users) */
  hasUpdate: boolean;
  /** Whether the current user is on the web platform */
  isWebUser: boolean;
  /** Whether the current user is on a desktop (Tauri) platform */
  isDesktopUser: boolean;
  /** Current app version */
  currentVersion: string;
  /** Latest available version */
  latestVersion: string | null;
  /** All available downloads */
  downloads: PlatformDownload[];
  /** Best download for the user's current platform */
  primaryDownload: PlatformDownload | null;
  /** Dismiss the banner for this version */
  dismiss: () => void;
  /** Whether the user has dismissed the banner */
  isDismissed: boolean;
  /** Whether the hook is still fetching */
  isLoading: boolean;
  /** Release notes URL */
  releaseUrl: string | null;
  /** Trigger a manual check */
  checkForUpdate: () => void;
  /** Desktop OTA update state */
  desktopUpdate: {
    /** Whether a Tauri OTA update is available */
    available: boolean;
    /** Download progress (0-100) */
    progress: number;
    /** Current phase: idle | downloading | ready | error */
    phase: 'idle' | 'downloading' | 'ready' | 'error';
    /** Start the download + install process */
    downloadAndInstall: () => void;
    /** Restart the app after install */
    restart: () => void;
  };
}
