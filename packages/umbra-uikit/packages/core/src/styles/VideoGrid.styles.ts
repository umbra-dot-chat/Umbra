/**
 * @module components/video-grid
 * @description Style builders for the VideoGrid component.
 */

import type { CSSStyleObject } from '../types';
import type { WispTheme } from '../theme/types';
import { fontFamilyStacks } from '../tokens/shared';

// ---------------------------------------------------------------------------
// Grid column resolution
// ---------------------------------------------------------------------------

/**
 * Resolves the optimal number of CSS grid columns based on participant count.
 *
 * @param count - Number of visible participants.
 * @returns Column count for the grid.
 */
export function resolveGridColumns(count: number): number {
  if (count <= 1) return 1;
  if (count <= 2) return 2;
  if (count <= 4) return 2;
  if (count <= 9) return 3;
  return 4;
}

// ---------------------------------------------------------------------------
// Container style
// ---------------------------------------------------------------------------

/**
 * Builds the root container style for the video grid.
 */
export function buildVideoGridContainerStyle(
  cols: number,
  theme: WispTheme,
): CSSStyleObject {
  return {
    display: 'grid',
    gridTemplateColumns: `repeat(${cols}, 1fr)`,
    gap: 4,
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.background.sunken,
    borderRadius: theme.radii.lg,
    padding: 4,
    boxSizing: 'border-box',
    overflow: 'hidden',
  };
}

// ---------------------------------------------------------------------------
// Spotlight layout styles
// ---------------------------------------------------------------------------

/**
 * Builds the root container style for spotlight layout.
 */
export function buildSpotlightContainerStyle(
  theme: WispTheme,
): CSSStyleObject {
  return {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.background.sunken,
    borderRadius: theme.radii.lg,
    padding: 4,
    boxSizing: 'border-box',
    overflow: 'hidden',
    gap: 4,
  };
}

/**
 * Builds the style for the main spotlight area.
 */
export function buildSpotlightMainStyle(): CSSStyleObject {
  return {
    flex: 1,
    minHeight: 0,
    position: 'relative',
  };
}

/**
 * Builds the style for the spotlight strip (other participants).
 */
export function buildSpotlightStripStyle(): CSSStyleObject {
  return {
    display: 'flex',
    flexDirection: 'row',
    gap: 4,
    overflowX: 'auto',
    flexShrink: 0,
    height: 100,
  };
}

/**
 * Builds the style for a tile in the spotlight strip.
 */
export function buildSpotlightStripTileStyle(): CSSStyleObject {
  return {
    width: 150,
    height: '100%',
    flexShrink: 0,
    position: 'relative',
  };
}

// ---------------------------------------------------------------------------
// Tile style
// ---------------------------------------------------------------------------

/**
 * Builds the style for an individual participant tile.
 */
export function buildVideoTileStyle(
  isSpeaking: boolean,
  theme: WispTheme,
): CSSStyleObject {
  return {
    position: 'relative',
    width: '100%',
    height: '100%',
    borderRadius: theme.radii.md,
    overflow: 'hidden',
    backgroundColor: theme.colors.background.raised,
    border: isSpeaking ? `2px solid ${theme.colors.status.success}` : '2px solid transparent',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box',
    transition: 'border-color 150ms ease',
  };
}

// ---------------------------------------------------------------------------
// Tile content styles
// ---------------------------------------------------------------------------

/**
 * Builds the style for the video stream wrapper inside a tile.
 */
export function buildVideoStreamStyle(): CSSStyleObject {
  return {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };
}

/**
 * Builds the style for the avatar/name fallback inside a tile.
 */
export function buildTileFallbackStyle(theme: WispTheme): CSSStyleObject {
  return {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    color: theme.colors.text.secondary,
    zIndex: 1,
  };
}

/**
 * Builds the style for the participant name label.
 */
export function buildTileNameStyle(theme: WispTheme): CSSStyleObject {
  return {
    position: 'absolute',
    bottom: 6,
    left: 6,
    right: 6,
    fontFamily: fontFamilyStacks.sans,
    fontSize: 11,
    fontWeight: theme.typography.weights.medium,
    color: '#ffffff',
    textShadow: '0 1px 2px rgba(0,0,0,0.6)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    zIndex: 2,
  };
}

/**
 * Builds the style for the status indicators row.
 */
export function buildTileIndicatorsStyle(): CSSStyleObject {
  return {
    position: 'absolute',
    top: 6,
    right: 6,
    display: 'flex',
    gap: 4,
    zIndex: 2,
  };
}

/**
 * Builds the style for a single status indicator icon.
 */
export function buildIndicatorIconStyle(theme: WispTheme): CSSStyleObject {
  return {
    width: 18,
    height: 18,
    borderRadius: theme.radii.sm,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    fontSize: 10,
  };
}

// ---------------------------------------------------------------------------
// Overflow badge style
// ---------------------------------------------------------------------------

/**
 * Builds the style for the overflow count badge.
 */
export function buildOverflowBadgeStyle(theme: WispTheme): CSSStyleObject {
  return {
    position: 'relative',
    width: '100%',
    height: '100%',
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.background.raised,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: fontFamilyStacks.sans,
    fontSize: 16,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.secondary,
    boxSizing: 'border-box',
  };
}

// ---------------------------------------------------------------------------
// Skeleton style
// ---------------------------------------------------------------------------

/**
 * Builds the skeleton style for the video grid.
 */
export function buildVideoGridSkeletonStyle(theme: WispTheme): CSSStyleObject {
  return {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 4,
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.background.sunken,
    borderRadius: theme.radii.lg,
    padding: 4,
    boxSizing: 'border-box',
  };
}

/**
 * Builds the skeleton style for a single tile.
 */
export function buildTileSkeletonStyle(theme: WispTheme): CSSStyleObject {
  return {
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.border.subtle,
    animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite',
  };
}
