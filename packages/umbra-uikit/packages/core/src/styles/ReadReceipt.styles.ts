/**
 * @module styles/ReadReceipt
 * @description Pure style-builder functions for the ReadReceipt primitive.
 */

import type { CSSStyleObject } from '../types';
import type { ThemeColors, WispTheme } from '../theme/types';
import type { ReadReceiptStatus, ReadReceiptSizeConfig } from '../types/ReadReceipt.types';

// ---------------------------------------------------------------------------
// Color resolution
// ---------------------------------------------------------------------------

export interface ReadReceiptColors {
  icon: string;
  label: string;
  failedIcon: string;
}

export function resolveReadReceiptColors(
  status: ReadReceiptStatus,
  theme: WispTheme,
): ReadReceiptColors {
  const { colors: themeColors } = theme;
  const base: ReadReceiptColors = {
    icon: themeColors.text.muted,
    label: themeColors.text.muted,
    failedIcon: themeColors.status.danger,
  };

  switch (status) {
    case 'read':
      return { ...base, icon: themeColors.status.info };
    case 'failed':
      return { ...base, icon: themeColors.status.danger };
    default:
      return base;
  }
}

// ---------------------------------------------------------------------------
// Style builders
// ---------------------------------------------------------------------------

export function buildReadReceiptContainerStyle(
  sizeConfig: ReadReceiptSizeConfig,
): CSSStyleObject {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: sizeConfig.gap,
    flexShrink: 0,
    lineHeight: 1,
  };
}

export function buildReadReceiptIconStyle(
  sizeConfig: ReadReceiptSizeConfig,
  colors: ReadReceiptColors,
  status: ReadReceiptStatus,
): CSSStyleObject {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: sizeConfig.iconSize,
    height: sizeConfig.iconSize,
    color: status === 'failed' ? colors.failedIcon : colors.icon,
    flexShrink: 0,
  };
}

export function buildReadReceiptLabelStyle(
  sizeConfig: ReadReceiptSizeConfig,
  colors: ReadReceiptColors,
): CSSStyleObject {
  return {
    fontSize: sizeConfig.fontSize,
    color: colors.label,
    whiteSpace: 'nowrap',
    userSelect: 'none',
  };
}

export function buildReadReceiptSkeletonStyle(
  sizeConfig: ReadReceiptSizeConfig,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, radii } = theme;
  return {
    display: 'inline-block',
    width: sizeConfig.iconSize * 3,
    height: sizeConfig.iconSize,
    borderRadius: radii.sm,
    backgroundColor: themeColors.border.subtle,
    animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite',
  };
}
