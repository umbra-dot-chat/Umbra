/**
 * @module styles/StickerPicker
 * @description Pure style-builder functions for the StickerPicker component.
 */

import type { CSSStyleObject } from '../types';
import type { WispTheme } from '../theme/types';
import type { StickerPickerSizeConfig } from '../types/StickerPicker.types';
import { durations, easings } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Color resolution
// ---------------------------------------------------------------------------

export interface StickerPickerColors {
  bg: string;
  border: string;
  tabText: string;
  tabTextActive: string;
  tabIndicator: string;
  tabHoverBg: string;
  cellHover: string;
  text: string;
  textMuted: string;
}

export function resolveStickerPickerColors(theme: WispTheme): StickerPickerColors {
  const { colors } = theme;
  return {
    bg: colors.background.canvas,
    border: colors.border.subtle,
    tabText: colors.text.secondary,
    tabTextActive: colors.accent.primary,
    tabIndicator: colors.accent.primary,
    tabHoverBg: colors.background.sunken,
    cellHover: colors.background.sunken,
    text: colors.text.primary,
    textMuted: colors.text.muted,
  };
}

// ---------------------------------------------------------------------------
// Style builders
// ---------------------------------------------------------------------------

export function buildStickerPickerContainerStyle(
  sizeConfig: StickerPickerSizeConfig,
  colors: StickerPickerColors,
  theme: WispTheme,
): CSSStyleObject {
  const { radii } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    width: sizeConfig.width,
    height: sizeConfig.height,
    borderRadius: radii.lg,
    border: `1px solid ${colors.border}`,
    backgroundColor: colors.bg,
    overflow: 'hidden',
  };
}

export function buildStickerPickerGridStyle(
  sizeConfig: StickerPickerSizeConfig,
): CSSStyleObject {
  return {
    flex: 1,
    overflowY: 'auto',
    padding: sizeConfig.padding,
    display: 'grid',
    gridTemplateColumns: `repeat(${sizeConfig.columns}, 1fr)`,
    gap: sizeConfig.gap,
    alignContent: 'start',
  };
}

export function buildStickerPickerCellStyle(
  sizeConfig: StickerPickerSizeConfig,
  theme: WispTheme,
): CSSStyleObject {
  const { radii } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: sizeConfig.cellSize,
    height: sizeConfig.cellSize,
    borderRadius: radii.md,
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    padding: 4,
    transition: `background-color ${durations.fast}ms ${easings.easeOut.css}, transform ${durations.fast}ms ${easings.easeOut.css}`,
    overflow: 'hidden',
  };
}

export function buildStickerPickerCellImageStyle(
  sizeConfig: StickerPickerSizeConfig,
): CSSStyleObject {
  return {
    width: sizeConfig.cellSize - 8,
    height: sizeConfig.cellSize - 8,
    objectFit: 'contain',
  };
}

export function buildStickerPickerTabBarStyle(
  sizeConfig: StickerPickerSizeConfig,
  colors: StickerPickerColors,
): CSSStyleObject {
  return {
    display: 'flex',
    alignItems: 'center',
    height: sizeConfig.tabHeight,
    borderTop: `1px solid ${colors.border}`,
    flexShrink: 0,
    overflow: 'hidden',
    padding: `0 ${sizeConfig.padding}px`,
  };
}

export function buildStickerPickerTabStyle(
  sizeConfig: StickerPickerSizeConfig,
  colors: StickerPickerColors,
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
    borderTop: active ? `2px solid ${colors.tabIndicator}` : '2px solid transparent',
    transition: `all ${durations.fast}ms ${easings.easeOut.css}`,
  };
}

export function buildStickerPickerTabIconStyle(
  sizeConfig: StickerPickerSizeConfig,
): CSSStyleObject {
  return {
    width: sizeConfig.tabIconSize,
    height: sizeConfig.tabIconSize,
    objectFit: 'contain',
    borderRadius: 4,
  };
}

export function buildStickerPickerEmptyStyle(
  colors: StickerPickerColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography, spacing } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    color: colors.textMuted,
    fontSize: typography.sizes.sm.fontSize,
    padding: spacing.xl,
    textAlign: 'center',
  };
}

export function buildStickerPickerSkeletonStyle(
  sizeConfig: StickerPickerSizeConfig,
  theme: WispTheme,
): CSSStyleObject {
  const { colors, radii } = theme;
  return {
    display: 'block',
    width: sizeConfig.width,
    height: sizeConfig.height,
    borderRadius: radii.lg,
    backgroundColor: colors.border.subtle,
    animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite',
  };
}
