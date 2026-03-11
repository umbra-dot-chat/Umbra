import type { CSSStyleObject } from '../types';
import type { ListItemSize, ListItemSizeConfig } from '../types/ListItem.types';
import { listItemSizeMap } from '../types/ListItem.types';
import type { ThemeColors, WispTheme } from '../theme/types';
import { durations, easings } from '../tokens/motion';

/**
 * Builds the root `CSSProperties` for a {@link ListItem}.
 *
 * @remarks
 * Computes layout (flex, gap, padding, min-height) from the size preset and
 * applies interactive, active, and disabled visual treatments.
 *
 * @param opts - Merged component props and resolved theme colors.
 * @param opts.size - Size preset key used to look up {@link listItemSizeMap}.
 * @param opts.align - Cross-axis alignment of the three slots.
 * @param opts.interactive - Whether hover/cursor styles are applied.
 * @param opts.active - Whether the active/selected background is shown.
 * @param opts.disabled - Whether the item appears disabled.
 * @param opts.themeColors - Resolved theme color tokens.
 * @returns A `CSSStyleObject` object for the root element.
 */
export function buildListItemStyle(opts: {
  size: ListItemSize;
  align: 'start' | 'center' | 'end';
  interactive: boolean;
  active: boolean;
  disabled: boolean;
  theme: WispTheme;
}): CSSStyleObject {
  const { colors: themeColors, radii } = opts.theme;
  const config = listItemSizeMap[opts.size];
  const style: CSSStyleObject = {
    display: 'flex',
    alignItems: opts.align === 'start' ? 'flex-start' : opts.align === 'end' ? 'flex-end' : 'center',
    gap: config.gap,
    minHeight: config.minHeight,
    paddingLeft: config.paddingX,
    paddingRight: config.paddingX,
    paddingTop: config.paddingY,
    paddingBottom: config.paddingY,
    borderRadius: radii.md,
    transition: `background-color ${durations.fast}ms ${easings.easeOut.css}`,
  };

  if (opts.interactive) {
    style.cursor = opts.disabled ? 'not-allowed' : 'pointer';
    style.userSelect = 'none';
  }

  if (opts.active) {
    style.backgroundColor = themeColors.accent.highlight;
  }

  if (opts.disabled) {
    style.opacity = 0.5;
    style.pointerEvents = 'none';
  }

  return style;
}

/**
 * Builds the CSS for the leading slot container.
 *
 * @returns A `CSSStyleObject` object that flex-centers and prevents
 *   shrinking of the leading element.
 */
export function buildLeadingStyle(): CSSStyleObject {
  return {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };
}

/**
 * Builds the CSS for the content (center) slot container.
 *
 * @returns A `CSSStyleObject` object that fills remaining space,
 *   enables text truncation via `minWidth: 0`, and stacks children vertically.
 */
export function buildContentStyle(): CSSStyleObject {
  return {
    flex: 1,
    minWidth: 0, // Allow text truncation
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  };
}

/**
 * Builds the CSS for the trailing slot container.
 *
 * @returns A `CSSStyleObject` object that prevents shrinking and
 *   spaces multiple trailing elements with an 8 px gap.
 */
export function buildTrailingStyle(theme: WispTheme): CSSStyleObject {
  const { spacing } = theme;
  return {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
  };
}
