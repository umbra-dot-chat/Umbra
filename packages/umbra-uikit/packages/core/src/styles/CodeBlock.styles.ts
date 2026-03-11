/**
 * @module CodeBlock
 */
import type { CSSStyleObject } from '../types';
import type { ThemeColors, WispTheme } from '../theme/types';
import type { CodeBlockVariant } from '../types/CodeBlock.types';
import { fontFamilyStacks } from '../tokens/shared';
import { durations, easings } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Wrapper style (<div> around everything)
// ---------------------------------------------------------------------------

/**
 * Builds the outer wrapper style for the code block.
 */
export function buildCodeBlockWrapperStyle(
  variant: CodeBlockVariant,
  theme: WispTheme,
  maxHeight?: number | string,
): CSSStyleObject {
  const { colors: themeColors, radii, typography } = theme;
  const base: CSSStyleObject = {
    position: 'relative',
    borderRadius: radii.md,
    overflow: 'hidden',
    fontFamily: fontFamilyStacks.mono,
    fontSize: typography.sizes.sm.fontSize,
    lineHeight: 1.6,
  };

  if (variant === 'outlined') {
    return {
      ...base,
      backgroundColor: 'transparent',
      border: `1px solid ${themeColors.border.strong}`,
      color: themeColors.text.primary,
    };
  }

  // default
  return {
    ...base,
    backgroundColor: themeColors.background.raised,
    border: 'none',
    color: themeColors.text.onRaised,
  };
}

// ---------------------------------------------------------------------------
// Header style (language label row)
// ---------------------------------------------------------------------------

/**
 * Builds styles for the optional header row showing language label.
 */
export function buildCodeBlockHeaderStyle(
  variant: CodeBlockVariant,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, spacing, typography } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${spacing.sm}px ${spacing.md}px`,
    fontSize: typography.sizes.xs.fontSize,
    fontWeight: typography.weights.medium,
    fontFamily: fontFamilyStacks.sans,
    color: variant === 'outlined'
      ? themeColors.text.secondary
      : themeColors.text.onRaisedSecondary,
    borderBottom: variant === 'outlined'
      ? `1px solid ${themeColors.border.subtle}`
      : `1px solid ${themeColors.accent.dividerRaised}`,
    userSelect: 'none',
  };
}

// ---------------------------------------------------------------------------
// Pre / code area style
// ---------------------------------------------------------------------------

/**
 * Builds styles for the `<pre>` element containing the code.
 */
export function buildCodeBlockPreStyle(
  theme: WispTheme,
  maxHeight?: number | string,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    margin: 0,
    padding: `${spacing.md}px ${spacing.lg}px`,
    overflow: 'auto',
    maxHeight: maxHeight ?? undefined,
    tabSize: 2,
  };
}

// ---------------------------------------------------------------------------
// Line style
// ---------------------------------------------------------------------------

/**
 * Builds style for a single line of code.
 */
export function buildCodeBlockLineStyle(
  highlighted: boolean,
  variant: CodeBlockVariant,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, spacing } = theme;
  if (!highlighted) {
    return {
      display: 'flex',
      minHeight: '1.6em',
    };
  }

  return {
    display: 'flex',
    minHeight: '1.6em',
    backgroundColor: variant === 'outlined'
      ? themeColors.accent.highlight
      : themeColors.accent.highlightRaised,
    marginLeft: -16,
    marginRight: -16,
    paddingLeft: spacing.lg,
    paddingRight: spacing.lg,
    borderLeft: `2px solid ${variant === 'outlined' ? themeColors.accent.primary : themeColors.accent.primary}`,
  };
}

// ---------------------------------------------------------------------------
// Line number style
// ---------------------------------------------------------------------------

/**
 * Builds style for the line number gutter element.
 */
export function buildCodeBlockLineNumberStyle(
  variant: CodeBlockVariant,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, spacing } = theme;
  return {
    display: 'inline-block',
    width: '3ch',
    marginRight: spacing.lg,
    textAlign: 'right',
    userSelect: 'none',
    color: variant === 'outlined'
      ? themeColors.text.muted
      : themeColors.accent.mutedRaised,
    flexShrink: 0,
  };
}

// ---------------------------------------------------------------------------
// Copy button style
// ---------------------------------------------------------------------------

/**
 * Builds style for the copy-to-clipboard button.
 */
export function buildCodeBlockCopyButtonStyle(
  variant: CodeBlockVariant,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, radii, spacing, typography } = theme;
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: `${spacing.xs}px ${spacing.sm}px`,
    border: 'none',
    borderRadius: radii.sm,
    fontSize: typography.sizes.xs.fontSize,
    fontFamily: fontFamilyStacks.sans,
    fontWeight: typography.weights.medium,
    cursor: 'pointer',
    backgroundColor: variant === 'outlined'
      ? themeColors.accent.highlight
      : themeColors.accent.highlightRaised,
    color: variant === 'outlined'
      ? themeColors.text.secondary
      : themeColors.text.onRaisedSecondary,
    transition: `background-color ${durations.fast}ms ${easings.easeOut.css}, color ${durations.fast}ms ${easings.easeOut.css}`,
    outline: 'none',
    lineHeight: 1,
  };
}
