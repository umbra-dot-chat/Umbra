/**
 * VideoTile — Displays a video stream with avatar fallback, mute/speaking indicators.
 */

export const videoTileSizes = ['sm', 'md', 'lg', 'full'] as const;
export type VideoTileSize = (typeof videoTileSizes)[number];

export const videoTileFits = ['cover', 'contain'] as const;
export type VideoTileFit = (typeof videoTileFits)[number];

export interface VideoTileSizeConfig {
  minWidth: number;
  minHeight: number;
  avatarSize: number;
  nameFontSize: number;
  badgeSize: number;
  borderRadius: number;
}

export const videoTileSizeMap: Record<VideoTileSize, VideoTileSizeConfig> = {
  sm: {
    minWidth: 120,
    minHeight: 90,
    avatarSize: 32,
    nameFontSize: 11,
    badgeSize: 16,
    borderRadius: 8,
  },
  md: {
    minWidth: 240,
    minHeight: 180,
    avatarSize: 56,
    nameFontSize: 13,
    badgeSize: 20,
    borderRadius: 12,
  },
  lg: {
    minWidth: 480,
    minHeight: 360,
    avatarSize: 80,
    nameFontSize: 15,
    badgeSize: 24,
    borderRadius: 12,
  },
  full: {
    minWidth: 0,
    minHeight: 0,
    avatarSize: 96,
    nameFontSize: 16,
    badgeSize: 28,
    borderRadius: 0,
  },
};

export interface VideoTileProps {
  /** The media stream to render */
  stream: any | null;
  /** Display name overlay */
  displayName?: string;
  /** Whether the user's mic is muted */
  isMuted?: boolean;
  /** Whether the camera is off (shows avatar fallback) */
  isCameraOff?: boolean;
  /** Whether this user is currently speaking */
  isSpeaking?: boolean;
  /** Mirror the video (for local preview) */
  mirror?: boolean;
  /** How the video fills the tile */
  fit?: VideoTileFit;
  /** Show name/mute overlay */
  showOverlay?: boolean;
  /** Avatar image URI for camera-off fallback */
  avatarUri?: string;
  /** Tile size */
  size?: VideoTileSize;
  /** Custom style */
  style?: object;
}
