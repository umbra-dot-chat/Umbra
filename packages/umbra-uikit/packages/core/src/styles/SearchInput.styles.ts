/**
 * @module SearchInput
 */
import type { CSSStyleObject } from '../types';
import type { ThemeColors, ThemeRadii, WispTheme } from '../theme/types';
import type { ComponentSize } from '../tokens/shared';
import { fontFamilyStacks } from '../tokens/shared';
import { durations, easings } from '../tokens/motion';
import { defaultTypography} from '../theme/create-theme';

// ---------------------------------------------------------------------------
// Size map (reuse Input dimensions)
// ---------------------------------------------------------------------------

export interface SearchInputSizeConfig {
  height: number;
  paddingX: number;
  fontSize: number;
  lineHeight: number;
  borderRadius: keyof ThemeRadii;
  iconSize: number;
}

export const searchInputSizeMap: Record<ComponentSize, SearchInputSizeConfig> = {
  xs: { height: 28, paddingX: 8, fontSize: defaultTypography.sizes.xs.fontSize, lineHeight: 1.33, borderRadius: 'md', iconSize: 14 },
  sm: { height: 32, paddingX: 10, fontSize: defaultTypography.sizes.sm.fontSize, lineHeight: 1.38, borderRadius: 'md', iconSize: 16 },
  md: { height: 38, paddingX: 12, fontSize: defaultTypography.sizes.sm.fontSize, lineHeight: 1.43, borderRadius: 'md', iconSize: 18 },
  lg: { height: 44, paddingX: 14, fontSize: defaultTypography.sizes.base.fontSize, lineHeight: 1.47, borderRadius: 'md', iconSize: 20 },
  xl: { height: 52, paddingX: 16, fontSize: defaultTypography.sizes.base.fontSize, lineHeight: 1.5, borderRadius: 'lg', iconSize: 22 } };

// ---------------------------------------------------------------------------
// Container style
// ---------------------------------------------------------------------------

export function buildSearchInputContainerStyle(
  sizeConfig: SearchInputSizeConfig,
  focused: boolean,
  disabled: boolean,
  theme: WispTheme,
  fullWidth: boolean,
): CSSStyleObject {
  const { colors: themeColors, radii } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    gap: sizeConfig.paddingX > 10 ? 8 : 6,
    height: sizeConfig.height,
    paddingLeft: sizeConfig.paddingX - 2,
    paddingRight: sizeConfig.paddingX - 2,
    backgroundColor: 'transparent',
    borderRadius: radii[sizeConfig.borderRadius as keyof ThemeRadii],
    boxSizing: 'border-box',
    border: `1px solid ${focused ? themeColors.accent.primary : themeColors.border.strong}`,
    boxShadow: focused ? `0 0 0 2px ${themeColors.accent.primary}25` : 'none',
    cursor: disabled ? 'not-allowed' : 'text',
    transition: `border-color ${durations.fast}ms ${easings.easeOut.css}, box-shadow ${durations.fast}ms ${easings.easeOut.css}`,
    width: fullWidth ? '100%' : undefined,
    opacity: disabled ? 0.5 : 1 };
}

// ---------------------------------------------------------------------------
// Input element style
// ---------------------------------------------------------------------------

export function buildSearchInputFieldStyle(
  sizeConfig: SearchInputSizeConfig,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors } = theme;
  return {
    margin: 0,
    padding: 0,
    border: 'none',
    outline: 'none',
    background: 'transparent',
    appearance: 'none',
    flex: 1,
    minWidth: 0,
    width: '100%',
    height: '100%',
    fontFamily: fontFamilyStacks.sans,
    fontSize: sizeConfig.fontSize,
    lineHeight: sizeConfig.lineHeight,
    color: themeColors.text.primary,
    cursor: 'inherit' };
}

// ---------------------------------------------------------------------------
// Clear button style
// ---------------------------------------------------------------------------

export function buildSearchInputClearButtonStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, radii, spacing } = theme;
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['2xs'],
    margin: 0,
    border: 'none',
    borderRadius: radii.sm,
    background: 'transparent',
    color: themeColors.text.muted,
    cursor: 'pointer',
    flexShrink: 0,
    outline: 'none',
    transition: `color ${durations.fast}ms ${easings.easeOut.css}` };
}
