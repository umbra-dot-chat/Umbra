import type { CSSStyleObject } from '../types';
import type { ThemeColors, WispTheme } from '../theme/types';
import type { SegmentedControlSize, SegmentedControlSizeConfig } from '../types/SegmentedControl.types';
import { segmentedControlSizeMap } from '../types/SegmentedControl.types';
import { fontFamilyStacks } from '../tokens/shared';
import { durations, easings } from '../tokens/motion';

/**
 * Builds the inline style for the {@link SegmentedControl} root container.
 *
 * @param opts - Configuration object.
 * @param opts.fullWidth   - Whether the control fills its parent width.
 * @param opts.themeColors - Resolved theme colour tokens.
 * @param opts.userStyle   - Optional consumer-supplied style overrides.
 * @returns A `CSSStyleObject` object for the container `div`.
 */
export function buildContainerStyle(opts: {
  fullWidth: boolean;
  theme: WispTheme;
  userStyle?: CSSStyleObject;
}): CSSStyleObject {
  const { colors: themeColors, radii, spacing } = opts.theme;
  return {
    display: opts.fullWidth ? 'flex' : 'inline-flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    position: 'relative',
    backgroundColor: themeColors.border.subtle,
    borderRadius: radii.lg,
    padding: spacing.xs,
    boxSizing: 'border-box' as const,
    width: opts.fullWidth ? '100%' : undefined,
    gap: 0,
    ...opts.userStyle,
  };
}

/**
 * Builds the inline style for the sliding active-segment indicator.
 *
 * @param opts - Configuration object.
 * @param opts.offsetX     - Horizontal pixel offset from the container start.
 * @param opts.width       - Width of the active segment in pixels.
 * @param opts.height      - Height of the indicator in pixels.
 * @param opts.animate     - Whether to apply a CSS transition (disabled on first render).
 * @param opts.themeColors - Resolved theme colour tokens.
 * @returns A `CSSStyleObject` object for the indicator element.
 */
export function buildIndicatorStyle(opts: {
  offsetX: number;
  width: number;
  height: number;
  animate: boolean;
  theme: WispTheme;
}): CSSStyleObject {
  const { colors: themeColors, radii } = opts.theme;
  return {
    position: 'absolute',
    top: 3,
    left: 0,
    height: opts.height,
    width: opts.width,
    borderRadius: radii.md,
    backgroundColor: themeColors.accent.primary,
    transform: `translateX(${opts.offsetX}px)`,
    transition: opts.animate
      ? 'transform 250ms cubic-bezier(0.4, 0, 0.2, 1), width 250ms cubic-bezier(0.4, 0, 0.2, 1)'
      : 'none',
    pointerEvents: 'none',
    zIndex: 0,
  };
}

/**
 * Builds the inline style for an individual segment button.
 *
 * @param opts - Configuration object.
 * @param opts.size        - Size preset key (`'sm'` | `'md'` | `'lg'`).
 * @param opts.isActive    - Whether this segment is currently selected.
 * @param opts.isDisabled  - Whether this segment is disabled.
 * @param opts.isHovered   - Whether the pointer is over this segment.
 * @param opts.fullWidth   - Whether segments should stretch equally.
 * @param opts.themeColors - Resolved theme colour tokens.
 * @returns A `CSSStyleObject` object for the segment `button`.
 */
export function buildSegmentStyle(opts: {
  size: SegmentedControlSize;
  isActive: boolean;
  isDisabled: boolean;
  isHovered: boolean;
  fullWidth: boolean;
  theme: WispTheme;
}): CSSStyleObject {
  const { colors: themeColors, radii, spacing, typography } = opts.theme;
  const sizeConfig: SegmentedControlSizeConfig = segmentedControlSizeMap[opts.size];

  return {
    margin: 0,
    border: 'none',
    outline: 'none',
    background: 'none',
    padding: 0,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: sizeConfig.height,
    paddingLeft: sizeConfig.paddingX,
    paddingRight: sizeConfig.paddingX,
    flex: opts.fullWidth ? 1 : undefined,
    boxSizing: 'border-box' as const,
    borderRadius: radii.md,
    backgroundColor: 'transparent',
    color: opts.isActive
      ? themeColors.text.inverse
      : opts.isHovered && !opts.isDisabled
        ? themeColors.text.primary
        : themeColors.text.secondary,
    fontFamily: fontFamilyStacks.sans,
    fontSize: sizeConfig.fontSize,
    fontWeight: typography.weights.medium,
    lineHeight: 1,
    whiteSpace: 'nowrap' as const,
    cursor: opts.isDisabled ? 'not-allowed' : 'pointer',
    opacity: opts.isDisabled ? 0.4 : 1,
    userSelect: 'none' as const,
    position: 'relative',
    zIndex: 1,
    transition: `color ${durations.normal}ms ${easings.easeOut.css}`,
  };
}
