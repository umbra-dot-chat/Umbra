/**
 * @module styles/EmojiPicker
 * @description Pure style-builder functions for the EmojiPicker component.
 */

import type { CSSStyleObject } from '../types';
import type { ThemeColors, WispTheme } from '../theme/types';
import type { EmojiPickerSizeConfig } from '../types/EmojiPicker.types';
import { durations, easings } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Color resolution
// ---------------------------------------------------------------------------

export interface EmojiPickerColors {
  bg: string;
  border: string;
  tabText: string;
  tabTextActive: string;
  tabIndicator: string;
  tabHoverBg: string;
  cellHover: string;
  categoryLabel: string;
  scrollbar: string;
  skinToneBorder: string;
  skinToneActiveBorder: string;
}

export function resolveEmojiPickerColors(theme: WispTheme): EmojiPickerColors {
  const { colors: themeColors } = theme;
  return {
    bg: themeColors.background.canvas,
    border: themeColors.border.subtle,
    tabText: themeColors.text.secondary,
    tabTextActive: themeColors.accent.primary,
    tabIndicator: themeColors.accent.primary,
    tabHoverBg: themeColors.background.sunken,
    cellHover: themeColors.background.sunken,
    categoryLabel: themeColors.text.secondary,
    scrollbar: themeColors.border.subtle,
    skinToneBorder: themeColors.border.subtle,
    skinToneActiveBorder: themeColors.accent.primary,
  };
}

// ---------------------------------------------------------------------------
// Style builders
// ---------------------------------------------------------------------------

export function buildEmojiPickerContainerStyle(
  sizeConfig: EmojiPickerSizeConfig,
  colors: EmojiPickerColors,
  theme: WispTheme,
): CSSStyleObject {
  const { radii } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    width: sizeConfig.width,
    height: sizeConfig.height,
    borderRadius: radii[sizeConfig.borderRadius],
    border: `1px solid ${colors.border}`,
    backgroundColor: colors.bg,
    overflow: 'hidden',
  };
}

export function buildEmojiPickerHeaderStyle(
  sizeConfig: EmojiPickerSizeConfig,
  colors: EmojiPickerColors,
): CSSStyleObject {
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: sizeConfig.gap * 2,
    padding: `${sizeConfig.padding}px ${sizeConfig.padding}px ${sizeConfig.gap}px`,
    flexShrink: 0,
    backgroundColor: colors.bg,
  };
}

/**
 * Top-level row: `[slider area (flex:1)] [gap] [hand button (fixed)]`.
 * The hand button stays anchored on the right; only the content to its
 * left slides between search bar and skin-tone options.
 */
export function buildEmojiPickerSearchRowStyle(
  sizeConfig: EmojiPickerSizeConfig,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: sizeConfig.searchHeight,
  };
}

/**
 * Clip container for the sliding panels. Takes all remaining space
 * to the left of the hand button. Padding prevents border clipping.
 */
export function buildEmojiPickerSliderClipStyle(
  sizeConfig: EmojiPickerSizeConfig,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    flex: 1,
    overflow: 'hidden',
    height: sizeConfig.searchHeight + 4,
    padding: spacing['2xs'],
    margin: -2,
    position: 'relative',
  };
}

/**
 * Inner track that holds two panels side by side (search + skin tone options).
 * Slides left/right via translateX based on `open` state.
 */
export function buildEmojiPickerSliderTrackStyle(
  open: boolean,
): CSSStyleObject {
  return {
    display: 'flex',
    flexDirection: 'row',
    width: '200%',
    height: '100%',
    transition: `transform ${durations.normal}ms cubic-bezier(0.4, 0, 0.2, 1)`,
    transform: open ? 'translateX(-50%)' : 'translateX(0%)',
  };
}

/** Each panel inside the slider track occupies exactly half the track. */
export function buildEmojiPickerSliderPanelStyle(): CSSStyleObject {
  return {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    height: '100%',
    flexShrink: 0,
  };
}

/** The hand emoji button that toggles the skin tone panel. */
export function buildEmojiPickerSkinToneTriggerStyle(
  sizeConfig: EmojiPickerSizeConfig,
  colors: EmojiPickerColors,
  open: boolean,
  theme: WispTheme,
): CSSStyleObject {
  const { radii } = theme;
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: sizeConfig.searchHeight,
    height: sizeConfig.searchHeight,
    borderRadius: radii[sizeConfig.borderRadius] / 2,
    border: `1px solid ${open ? colors.skinToneActiveBorder : colors.border}`,
    backgroundColor: open ? colors.tabHoverBg : 'transparent',
    cursor: 'pointer',
    fontSize: Math.round(sizeConfig.searchHeight * 0.5),
    padding: 0,
    lineHeight: 1,
    flexShrink: 0,
    overflow: 'hidden',
    transition: `border-color ${durations.fast}ms ${easings.easeOut.css}, background-color ${durations.fast}ms ${easings.easeOut.css}`,
  };
}

/** Individual skin tone option in the sliding panel. */
export function buildEmojiPickerSkinToneOptionStyle(
  sizeConfig: EmojiPickerSizeConfig,
  colors: EmojiPickerColors,
  active: boolean,
  theme: WispTheme,
): CSSStyleObject {
  const { radii } = theme;
  const optionSize = Math.round(sizeConfig.cellSize * 0.9);
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: optionSize,
    height: optionSize,
    borderRadius: radii.full,
    border: active ? `2px solid ${colors.skinToneActiveBorder}` : '2px solid transparent',
    backgroundColor: active ? colors.bg : 'transparent',
    cursor: 'pointer',
    fontSize: Math.round(optionSize * 0.55),
    padding: 0,
    lineHeight: 1,
    overflow: 'hidden',
    transition: `border-color ${durations.fast}ms ${easings.easeOut.css}`,
  };
}

// Legacy — kept for backward compat
export function buildEmojiPickerSkinToneRowStyle(
  sizeConfig: EmojiPickerSizeConfig,
  colors: EmojiPickerColors,
): CSSStyleObject {
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    height: '100%',
    flex: 1,
  };
}

export function buildEmojiPickerSkinToneBarStyle(
  sizeConfig: EmojiPickerSizeConfig,
  colors: EmojiPickerColors,
): CSSStyleObject {
  return buildEmojiPickerSkinToneRowStyle(sizeConfig, colors);
}

export function buildEmojiPickerSkinToneDotStyle(
  sizeConfig: EmojiPickerSizeConfig,
  colors: EmojiPickerColors,
  active: boolean,
  theme: WispTheme,
): CSSStyleObject {
  return buildEmojiPickerSkinToneOptionStyle(sizeConfig, colors, active, theme);
}

export function buildEmojiPickerTabBarStyle(
  sizeConfig: EmojiPickerSizeConfig,
  colors: EmojiPickerColors,
): CSSStyleObject {
  return {
    display: 'flex',
    alignItems: 'center',
    height: sizeConfig.tabHeight,
    padding: `0 ${sizeConfig.padding}px`,
    gap: 0,
    borderBottom: `1px solid ${colors.border}`,
    flexShrink: 0,
    overflow: 'hidden',
  };
}

export function buildEmojiPickerTabStyle(
  sizeConfig: EmojiPickerSizeConfig,
  colors: EmojiPickerColors,
  active: boolean,
): CSSStyleObject {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    height: '100%',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    padding: 0,
    color: active ? colors.tabTextActive : colors.tabText,
    borderBottom: active ? `2px solid ${colors.tabIndicator}` : '2px solid transparent',
    transition: `all ${durations.fast}ms ${easings.easeOut.css}`,
  };
}

export function buildEmojiPickerGridStyle(
  sizeConfig: EmojiPickerSizeConfig,
): CSSStyleObject {
  return {
    flex: 1,
    overflowY: 'auto',
    // No top padding — sticky category labels pin at the very top of the
    // scroll container so emoji cannot peek above them.
    padding: `0 ${sizeConfig.padding}px ${sizeConfig.padding}px`,
    display: 'flex',
    flexDirection: 'column',
    gap: sizeConfig.gap * 2,
    scrollbarWidth: 'thin' as any,
  };
}

export function buildEmojiPickerCategoryLabelStyle(
  sizeConfig: EmojiPickerSizeConfig,
  colors: EmojiPickerColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontSize: sizeConfig.fontSize,
    fontWeight: typography.weights.semibold,
    color: colors.categoryLabel,
    textTransform: 'capitalize',
    padding: `${sizeConfig.gap + 2}px 0 ${sizeConfig.gap}px`,
    userSelect: 'none',
    position: 'sticky',
    top: 0,
    backgroundColor: colors.bg,
    zIndex: 2,
  };
}

export function buildEmojiPickerCellStyle(
  sizeConfig: EmojiPickerSizeConfig,
  theme: WispTheme,
): CSSStyleObject {
  const { radii } = theme;
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: sizeConfig.cellSize,
    height: sizeConfig.cellSize,
    borderRadius: radii.md,
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    fontSize: sizeConfig.emojiSize,
    padding: 0,
    transition: `background-color ${durations.fast}ms ${easings.easeOut.css}, transform ${durations.fast}ms ${easings.easeOut.css}`,
    lineHeight: 1,
    fontFamily: 'inherit',
  };
}

export function buildEmojiPickerCellRowStyle(
  sizeConfig: EmojiPickerSizeConfig,
): CSSStyleObject {
  return {
    display: 'grid',
    gridTemplateColumns: `repeat(${sizeConfig.columnsCount}, 1fr)`,
    gap: sizeConfig.gap,
    justifyItems: 'center',
  };
}

export function buildEmojiPickerSkeletonStyle(
  sizeConfig: EmojiPickerSizeConfig,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, radii } = theme;
  return {
    display: 'block',
    width: sizeConfig.width,
    height: sizeConfig.height,
    borderRadius: radii[sizeConfig.borderRadius],
    backgroundColor: themeColors.border.subtle,
    animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite',
  };
}

export function buildEmojiPickerNoResultsStyle(
  colors: EmojiPickerColors,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing, typography } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    color: colors.categoryLabel,
    fontSize: typography.sizes.sm.fontSize,
    padding: spacing.xl,
    textAlign: 'center',
  };
}
