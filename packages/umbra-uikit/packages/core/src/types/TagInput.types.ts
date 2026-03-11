import type { ThemeRadii } from '../theme/types';
import type React from 'react';
import type { ComponentSize } from '../tokens/shared';
import { defaultSpacing, defaultTypography } from '../theme/create-theme';

// ---------------------------------------------------------------------------
// Size tokens
// ---------------------------------------------------------------------------

/**
 * Ordered tuple of valid tag-input size tokens, re-exported from the shared
 * {@link ComponentSize} definition for convenience.
 */
export { componentSizes as tagInputSizes } from '../tokens/shared';

/**
 * Union of valid tag-input size strings (`'xs' | 'sm' | 'md' | 'lg' | 'xl'`),
 * re-exported from the shared {@link ComponentSize} type.
 */
export type { ComponentSize as TagInputSize } from '../tokens/shared';

// ---------------------------------------------------------------------------
// Size -> dimensions map
// ---------------------------------------------------------------------------

/**
 * Dimension and typography tokens for a single tag-input size.
 *
 * @remarks
 * Each {@link ComponentSize} key in {@link tagInputSizeMap} maps to one of
 * these config objects, which the style builders in `TagInput.styles.ts`
 * consume to produce size-appropriate `CSSProperties`.
 */
export interface TagInputSizeConfig {
  /** Minimum height of the input container. */
  minHeight: number;
  /** Horizontal padding inside the container. */
  paddingX: number;
  /** Vertical padding inside the container. */
  paddingY: number;
  /** Font size for the text input. */
  fontSize: number;
  /** Line height multiplier. */
  lineHeight: number;
  /** Border radius of the outer container. */
  borderRadius: keyof ThemeRadii;
  /** Gap between tags and the input. */
  gap: number;
  /** Height of each tag chip. */
  tagHeight: number;
  /** Font size for tag text. */
  tagFontSize: number;
  /** Border radius of tag chips. */
  tagBorderRadius: number;
  /** Padding inside tags. */
  tagPaddingX: number;
  /** Size of the remove icon inside tags. */
  tagRemoveSize: number;
  /** Size of leading/trailing icons. */
  iconSize: number;
  /** Font size for the label text. */
  labelFontSize: number;
  /** Font size for the hint/error text. */
  hintFontSize: number;
}

/**
 * Lookup from {@link ComponentSize} to the corresponding {@link TagInputSizeConfig}.
 *
 * @remarks
 * Provides five pre-defined size configs (`xs` through `xl`) consumed by
 * the TagInput component and its style builders.
 */
export const tagInputSizeMap: Record<ComponentSize, TagInputSizeConfig> = {
  xs: {
    minHeight: 28,
    paddingX: defaultSpacing.sm,
    paddingY: defaultSpacing.xs,
    fontSize: defaultTypography.sizes.xs.fontSize,
    lineHeight: 1.33,
    borderRadius: 'md',
    gap: defaultSpacing.xs,
    tagHeight: 20,
    tagFontSize: 11,
    tagBorderRadius: 4,
    tagPaddingX: 6,
    tagRemoveSize: 10,
    iconSize: 14,
    labelFontSize: 12,
    hintFontSize: 11 },
  sm: {
    minHeight: 32,
    paddingX: defaultSpacing.sm,
    paddingY: defaultSpacing.xs,
    fontSize: defaultTypography.sizes.sm.fontSize,
    lineHeight: 1.38,
    borderRadius: 'md',
    gap: defaultSpacing.xs,
    tagHeight: 22,
    tagFontSize: 12,
    tagBorderRadius: 4,
    tagPaddingX: 8,
    tagRemoveSize: 12,
    iconSize: 16,
    labelFontSize: 13,
    hintFontSize: 12 },
  md: {
    minHeight: 38,
    paddingX: defaultSpacing.md,
    paddingY: defaultSpacing.sm,
    fontSize: defaultTypography.sizes.sm.fontSize,
    lineHeight: 1.43,
    borderRadius: 'md',
    gap: defaultSpacing.sm,
    tagHeight: 26,
    tagFontSize: 13,
    tagBorderRadius: 6,
    tagPaddingX: 10,
    tagRemoveSize: 14,
    iconSize: 18,
    labelFontSize: 14,
    hintFontSize: 13 },
  lg: {
    minHeight: 44,
    paddingX: defaultSpacing.md,
    paddingY: defaultSpacing.sm,
    fontSize: defaultTypography.sizes.base.fontSize,
    lineHeight: 1.47,
    borderRadius: 'md',
    gap: defaultSpacing.sm,
    tagHeight: 28,
    tagFontSize: 14,
    tagBorderRadius: 6,
    tagPaddingX: 12,
    tagRemoveSize: 14,
    iconSize: 20,
    labelFontSize: 15,
    hintFontSize: 14 },
  xl: {
    minHeight: 52,
    paddingX: defaultSpacing.lg,
    paddingY: defaultSpacing.sm,
    fontSize: defaultTypography.sizes.base.fontSize,
    lineHeight: 1.5,
    borderRadius: 'lg',
    gap: defaultSpacing.sm,
    tagHeight: 32,
    tagFontSize: 15,
    tagBorderRadius: 8,
    tagPaddingX: 14,
    tagRemoveSize: 16,
    iconSize: 22,
    labelFontSize: 16,
    hintFontSize: 15 } };

// ---------------------------------------------------------------------------
// Tag item
// ---------------------------------------------------------------------------

/**
 * A single tag item in the tag input.
 *
 * @remarks
 * Tags can be simple strings or objects with a `label` and optional `icon`.
 * When using string values, the string is used as both the value and the label.
 */
export interface TagItem {
  /** Unique value identifying the tag. */
  value: string;
  /** Display label for the tag. Falls back to `value` when omitted. */
  label?: string;
  /** Optional leading icon rendered before the label inside the tag. */
  icon?: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props accepted by the {@link TagInput} component.
 *
 * @remarks
 * Supports controlled (`value` + `onChange`) and uncontrolled (`defaultValue`)
 * patterns via the shared `useControllable` hook. Tags can be added via
 * Enter/Comma and removed via Backspace or the X button.
 */
export interface TagInputProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
  /**
   * Tag-input size token controlling height, padding, font size, and tag size.
   * @default 'md'
   */
  size?: ComponentSize;

  /** Controlled array of tag values. */
  value?: string[];

  /** Initial tag values for uncontrolled mode. */
  defaultValue?: string[];

  /** Callback fired when the tag list changes. */
  onChange?: (tags: string[]) => void;

  /** Callback fired when a tag is added. */
  onTagAdd?: (tag: string) => void;

  /** Callback fired when a tag is removed. */
  onTagRemove?: (tag: string) => void;

  /** Label text rendered above the input. */
  label?: string;

  /** Hint text rendered below the input. */
  hint?: string;

  /**
   * Error state. A string is shown as an error message; `true` shows the
   * red border only.
   */
  error?: string | boolean;

  /**
   * Warning state. A string is shown as a warning message; `true` shows the
   * yellow border only.
   */
  warning?: string | boolean;

  /** Placeholder text for the inner text input. */
  placeholder?: string;

  /**
   * Leading icon rendered inside the container (left side).
   * Pass a Lucide icon component reference.
   */
  icon?: React.ComponentType<{ size?: number | string; color?: string; strokeWidth?: number }>;

  /**
   * Maximum number of tags allowed. When reached, the input is disabled.
   * @default Infinity
   */
  max?: number;

  /**
   * When `true`, duplicate tag values are rejected.
   * @default true
   */
  allowDuplicates?: boolean;

  /**
   * Characters that trigger tag creation in addition to Enter.
   * @default [',']
   */
  separators?: string[];

  /**
   * When `true`, the input stretches to 100% of its container width.
   * @default false
   */
  fullWidth?: boolean;

  /**
   * When `true`, the input is non-interactive.
   * @default false
   */
  disabled?: boolean;

  /**
   * When `true`, renders a skeleton shimmer placeholder.
   * @default false
   */
  skeleton?: boolean;

  /**
   * Custom render function for tags. Receives the tag value, its index,
   * and a remove callback. Return a React node to replace the default chip.
   */
  renderTag?: (value: string, index: number, onRemove: () => void) => React.ReactNode;
}
