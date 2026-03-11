/**
 * @module components/screen-share-picker
 * @description Style builders for the ScreenSharePicker component.
 */

import type { CSSStyleObject } from '../types';
import type { WispTheme } from '../theme/types';
import { fontFamilyStacks } from '../tokens/shared';

// ---------------------------------------------------------------------------
// Overlay
// ---------------------------------------------------------------------------

/**
 * Builds the backdrop overlay style.
 */
export function buildOverlayStyle(): CSSStyleObject {
  return {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  };
}

// ---------------------------------------------------------------------------
// Dialog
// ---------------------------------------------------------------------------

/**
 * Builds the dialog container style.
 */
export function buildDialogStyle(theme: WispTheme): CSSStyleObject {
  return {
    backgroundColor: theme.colors.background.raised,
    borderRadius: theme.radii.xl,
    border: `1px solid ${theme.colors.border.subtle}`,
    width: '100%',
    maxWidth: 640,
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 16px 48px rgba(0,0,0,0.2)',
    fontFamily: fontFamilyStacks.sans,
  };
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

/**
 * Builds the header style.
 */
export function buildHeaderStyle(theme: WispTheme): CSSStyleObject {
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: `1px solid ${theme.colors.border.subtle}`,
    flexShrink: 0,
  };
}

/**
 * Builds the title style.
 */
export function buildTitleStyle(theme: WispTheme): CSSStyleObject {
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: 16,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary,
    margin: 0,
  };
}

/**
 * Builds the close button style.
 */
export function buildCloseButtonStyle(theme: WispTheme): CSSStyleObject {
  return {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 4,
    borderRadius: theme.radii.sm,
    color: theme.colors.text.muted,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
  };
}

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

/**
 * Builds the tab bar style.
 */
export function buildTabBarStyle(theme: WispTheme): CSSStyleObject {
  return {
    display: 'flex',
    gap: 0,
    padding: '0 20px',
    borderBottom: `1px solid ${theme.colors.border.subtle}`,
    flexShrink: 0,
  };
}

/**
 * Builds the individual tab button style.
 */
export function buildTabStyle(
  isActive: boolean,
  theme: WispTheme,
): CSSStyleObject {
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: 13,
    fontWeight: theme.typography.weights.medium,
    color: isActive ? theme.colors.text.primary : theme.colors.text.muted,
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: isActive ? `2px solid ${theme.colors.text.primary}` : '2px solid transparent',
    padding: '10px 16px',
    cursor: 'pointer',
    transition: 'color 150ms ease, border-color 150ms ease',
  };
}

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

/**
 * Builds the content area style.
 */
export function buildContentStyle(theme: WispTheme): CSSStyleObject {
  return {
    padding: 20,
    overflowY: 'auto',
    flex: 1,
  };
}

/**
 * Builds the source grid style.
 */
export function buildSourceGridStyle(): CSSStyleObject {
  return {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: 12,
  };
}

// ---------------------------------------------------------------------------
// Source card
// ---------------------------------------------------------------------------

/**
 * Builds the source card style.
 */
export function buildSourceCardStyle(
  isSelected: boolean,
  theme: WispTheme,
): CSSStyleObject {
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    padding: 8,
    borderRadius: theme.radii.lg,
    border: isSelected
      ? `2px solid ${theme.colors.text.primary}`
      : `1px solid ${theme.colors.border.subtle}`,
    backgroundColor: isSelected
      ? theme.colors.background.sunken
      : 'transparent',
    cursor: 'pointer',
    transition: 'border-color 150ms ease, background-color 150ms ease',
    boxSizing: 'border-box',
  };
}

/**
 * Builds the source thumbnail container style.
 */
export function buildThumbnailStyle(theme: WispTheme): CSSStyleObject {
  return {
    width: '100%',
    aspectRatio: '16/9',
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.background.sunken,
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };
}

/**
 * Builds the source name label style.
 */
export function buildSourceNameStyle(theme: WispTheme): CSSStyleObject {
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: 12,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text.secondary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    textAlign: 'center',
  };
}

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------

/**
 * Builds the loading container style.
 */
export function buildLoadingStyle(theme: WispTheme): CSSStyleObject {
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    color: theme.colors.text.muted,
    fontFamily: fontFamilyStacks.sans,
    fontSize: 14,
  };
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

/**
 * Builds the skeleton card style.
 */
export function buildSkeletonCardStyle(theme: WispTheme): CSSStyleObject {
  return {
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.border.subtle,
    animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite',
    height: 120,
  };
}
