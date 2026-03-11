/**
 * @module Toggle
 */
import type { CSSStyleObject } from '../types';
import type { ComponentSize } from '../tokens/shared';
import type { ThemeColors, WispTheme } from '../theme/types';
import type { ToggleSizeConfig } from '../types/Toggle.types';
import { toggleSizeMap, toggleSlimSizeMap } from '../types/Toggle.types';
import { relativeLuminance } from '../utils/contrast';
import { durations, easings } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Helper: detect hex color strings
// ---------------------------------------------------------------------------

/**
 * Returns `true` if the given string is a valid 3- or 6-digit hex color
 * (e.g. `#fff` or `#1a2b3c`).
 *
 * @param color - CSS color string to test.
 * @returns Whether the string matches a hex color pattern.
 */
function isHexColor(color: string): boolean {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(color);
}

// ---------------------------------------------------------------------------
// Resolve track colors
// ---------------------------------------------------------------------------

/**
 * Resolved color tokens for all visual parts of the toggle.
 *
 * @remarks
 * Produced by {@link resolveToggleColors} or {@link getDisabledToggleColors}
 * and consumed by the various style-builder functions to apply consistent
 * colors across the track, handle, content labels, and handle icon.
 */
export interface ToggleColors {
  /** Track background color at rest. */
  trackBg: string;
  /** Track background color on hover. */
  trackBgHover: string;
  /** Handle (thumb) background color. */
  handleBg: string;
  /** Handle border color (use `'transparent'` for no border). */
  handleBorder: string;
  /** Foreground color for text/icon content on the track surface. */
  contentColor: string;
  /** Foreground color for the icon inside the handle. */
  handleIconColor: string;
}

/**
 * Resolves the complete set of {@link ToggleColors} for the current toggle state.
 *
 * @remarks
 * Automatically picks handle and content colors that contrast with the track
 * background by comparing relative luminance of the resolved track color.
 * Custom `checkedColor` / `uncheckedColor` overrides are respected when provided.
 *
 * @param checked - Current toggle state (`true` = on).
 * @param themeColors - The current theme color tokens.
 * @param checkedColor - Optional custom track color when checked.
 * @param uncheckedColor - Optional custom track color when unchecked.
 * @returns A fully populated {@link ToggleColors} object.
 */
export function resolveToggleColors(
  checked: boolean,
  theme: WispTheme,
  checkedColor?: string,
  uncheckedColor?: string,
): ToggleColors {
  const { colors: themeColors } = theme;
  if (checked) {
    // Resolve the actual track color (custom or theme accent)
    const trackColor = checkedColor || themeColors.accent.primary;
    // Pick handle color that contrasts with the track — light track gets dark handle, dark track gets light handle
    const trackIsLight = isHexColor(trackColor) && relativeLuminance(trackColor) > 0.4;
    const handleColor = trackIsLight ? '#0A0E15' : '#F7F8FA';
    const contentColor = trackIsLight ? '#0A0E15' : '#F7F8FA';

    return {
      trackBg: trackColor,
      trackBgHover: checkedColor || themeColors.accent.primaryHover,
      handleBg: handleColor,
      handleBorder: 'transparent',
      contentColor,
      handleIconColor: trackIsLight ? '#F7F8FA' : '#0A0E15',
    };
  }

  // Unchecked: gray track — clearly reads as "off"
  // Use border.strong for a solid mid-gray that separates from both canvas and surface
  const uncheckedTrack = uncheckedColor || themeColors.border.strong;
  const uncheckedTrackIsLight = isHexColor(uncheckedTrack) && relativeLuminance(uncheckedTrack) > 0.4;

  // Barely-visible hover — just nudge the track color slightly.
  // We use border.subtle which is only a shade off from border.strong in both modes:
  //   Light: #D1D6E0 → #BFC6D4 (one neutral step)
  //   Dark:  #37404F → #202531 (one neutral step)
  // This gives a subtle "alive" feel without a jarring color shift.
  const hoverTrack = uncheckedColor || (uncheckedTrackIsLight ? '#BFC6D4' : '#2E3642');

  return {
    trackBg: uncheckedTrack,
    trackBgHover: hoverTrack,
    handleBg: uncheckedTrackIsLight ? '#0A0E15' : '#F7F8FA',
    handleBorder: 'transparent',
    contentColor: uncheckedTrackIsLight ? '#0A0E15' : '#F7F8FA',
    handleIconColor: uncheckedTrackIsLight ? '#F7F8FA' : '#0A0E15',
  };
}

/**
 * Returns the muted {@link ToggleColors} used when the toggle is disabled.
 *
 * @param themeColors - The current theme color tokens.
 * @returns A {@link ToggleColors} object with subdued track, handle, and content values.
 */
export function getDisabledToggleColors(theme: WispTheme): ToggleColors {
  const { colors: themeColors } = theme;
  return {
    trackBg: themeColors.border.subtle,
    trackBgHover: themeColors.border.subtle,
    handleBg: themeColors.text.muted,
    handleBorder: 'transparent',
    contentColor: themeColors.text.muted,
    handleIconColor: themeColors.border.strong,
  };
}

// ---------------------------------------------------------------------------
// Helper: resolve the size config
// ---------------------------------------------------------------------------

/**
 * Selects the appropriate {@link ToggleSizeConfig} based on the size step
 * and whether the slim variant is active.
 *
 * @param size - The {@link ComponentSize} step.
 * @param slim - When `true`, returns dimensions from {@link toggleSlimSizeMap}.
 * @returns The resolved {@link ToggleSizeConfig} for the given size and variant.
 */
export function resolveSizeConfig(size: ComponentSize, slim: boolean): ToggleSizeConfig {
  return slim ? toggleSlimSizeMap[size] : toggleSizeMap[size];
}

// ---------------------------------------------------------------------------
// Track (outer button) style
// ---------------------------------------------------------------------------

/**
 * Builds the `CSSStyleObject` for the toggle track (the outer `<button>`).
 *
 * @remarks
 * When `hasContent` is `true` the track uses `minWidth` so it can grow to
 * accommodate text/icon content; otherwise a fixed `width` is applied.
 *
 * @param opts - Configuration bag:
 *   - `sizeConfig` -- Resolved {@link ToggleSizeConfig}.
 *   - `colors` -- Resolved {@link ToggleColors}.
 *   - `disabled` -- Whether the toggle is non-interactive.
 *   - `hasContent` -- Whether track-surface content is present.
 * @returns A `CSSStyleObject` object for the track element.
 */
export function buildTrackStyle(opts: {
  sizeConfig: ToggleSizeConfig;
  colors: ToggleColors;
  disabled: boolean;
  hasContent: boolean;
}): CSSStyleObject {
  return {
    // Reset button defaults
    margin: 0,
    border: 'none',
    outline: 'none',
    padding: 0,
    background: 'none',

    // Track shape — use minWidth when content is present so the track can grow
    display: 'inline-flex',
    alignItems: 'center',
    position: 'relative',
    ...(opts.hasContent
      ? { minWidth: opts.sizeConfig.trackWidth }
      : { width: opts.sizeConfig.trackWidth }),
    height: opts.sizeConfig.trackHeight,
    borderRadius: opts.sizeConfig.trackHeight / 2,
    backgroundColor: opts.colors.trackBg,
    boxSizing: 'border-box',
    flexShrink: 0,

    // Interaction
    cursor: opts.disabled ? 'not-allowed' : 'pointer',
    opacity: opts.disabled ? 0.5 : 1,
    userSelect: 'none',

    // Transition
    transition: `background-color ${durations.normal}ms ${easings.easeOut.css}`,
  };
}

// ---------------------------------------------------------------------------
// Handle (thumb circle) style
// ---------------------------------------------------------------------------

/**
 * Builds the `CSSStyleObject` for the toggle handle (thumb circle).
 *
 * @remarks
 * Positioning strategy differs based on `hasContent`:
 * - **With content** -- uses `left` / `right` absolute positioning so the
 *   handle stays at the correct edge regardless of dynamic track width.
 * - **Without content** -- uses `translateX` for a smooth slide animation.
 *
 * @param opts - Configuration bag:
 *   - `sizeConfig` -- Resolved {@link ToggleSizeConfig}.
 *   - `colors` -- Resolved {@link ToggleColors}.
 *   - `checked` -- Current toggle state.
 *   - `hasContent` -- Whether track-surface content is present.
 * @returns A `CSSStyleObject` object for the handle element.
 */
export function buildHandleStyle(opts: {
  sizeConfig: ToggleSizeConfig;
  colors: ToggleColors;
  checked: boolean;
  hasContent: boolean;
},
  theme: WispTheme,
): CSSStyleObject {
  const { radii } = theme;
  // Vertically center the handle within the track
  const topOffset = (opts.sizeConfig.trackHeight - opts.sizeConfig.handleSize) / 2;

  // When content is present, the track width is dynamic — use left/right positioning
  // instead of translateX so the handle sits at the correct edge regardless of width
  const positionStyle: CSSStyleObject = opts.hasContent
    ? opts.checked
      ? { left: 'auto', right: opts.sizeConfig.padding }
      : { left: opts.sizeConfig.padding, right: 'auto' }
    : {
        left: opts.sizeConfig.padding,
        transform: opts.checked
          ? `translateX(${opts.sizeConfig.translateX}px)`
          : 'translateX(0)',
      };

  return {
    position: 'absolute',
    top: topOffset,
    width: opts.sizeConfig.handleSize,
    height: opts.sizeConfig.handleSize,
    borderRadius: radii.full,
    backgroundColor: opts.colors.handleBg,
    boxSizing: 'border-box',
    boxShadow: '0 1px 2px rgba(0,0,0,0.15)',

    // Centering icon inside handle
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',

    // Position / slide
    ...positionStyle,
    transition: opts.hasContent
      ? 'left 200ms cubic-bezier(0.4, 0, 0.2, 1), right 200ms cubic-bezier(0.4, 0, 0.2, 1)'
      : 'transform 200ms cubic-bezier(0.4, 0, 0.2, 1)',

    // Ensure handle is above track content
    zIndex: 1,
  };
}

// ---------------------------------------------------------------------------
// Track content (checked / unchecked side labels)
// ---------------------------------------------------------------------------

/**
 * Builds the absolutely-positioned `CSSStyleObject` for a track-surface
 * content label (icon or text).
 *
 * @remarks
 * - `'checked'` content is anchored to the left (visible when the handle is
 *   on the right).
 * - `'unchecked'` content is anchored to the right (visible when the handle
 *   is on the left).
 *
 * @param opts - Configuration bag:
 *   - `sizeConfig` -- Resolved {@link ToggleSizeConfig}.
 *   - `side` -- Which side of the track to position (`'checked'` or `'unchecked'`).
 *   - `colors` -- Resolved {@link ToggleColors}.
 * @returns A `CSSStyleObject` object for the content wrapper span.
 */
export function buildTrackContentStyle(opts: {
  sizeConfig: ToggleSizeConfig;
  side: 'checked' | 'unchecked';
  colors: ToggleColors;
},
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  const isChecked = opts.side === 'checked';
  const contentPadding = opts.sizeConfig.padding + 6;

  return {
    position: 'absolute',
    top: 0,
    bottom: 0,
    // Checked content sits on the left (visible when handle is on the right)
    // Unchecked content sits on the right (visible when handle is on the left)
    ...(isChecked
      ? { left: contentPadding, right: 'auto' }
      : { right: contentPadding, left: 'auto' }),

    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing['2xs'],
    whiteSpace: 'nowrap',
    color: opts.colors.contentColor,
    fontSize: opts.sizeConfig.trackFontSize,
    lineHeight: 1,
    pointerEvents: 'none',
    zIndex: 0,
  };
}

// ---------------------------------------------------------------------------
// Skeleton style
// ---------------------------------------------------------------------------

/**
 * Generates the inline style for a toggle skeleton shimmer placeholder.
 *
 * @param sizeConfig - The resolved {@link ToggleSizeConfig} (determines width, height, and radius).
 * @param themeColors - The current theme color tokens.
 * @returns A `CSSStyleObject` object with dimensions, radius, background, and pulse animation.
 */
export function getToggleSkeletonStyle(
  sizeConfig: ToggleSizeConfig,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors } = theme;
  return {
    display: 'inline-block',
    width: sizeConfig.trackWidth,
    height: sizeConfig.trackHeight,
    borderRadius: sizeConfig.trackHeight / 2,
    backgroundColor: themeColors.border.subtle,
    animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite',
  };
}
