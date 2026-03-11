import type { ThemeRadii } from '../theme/types';
import type { HTMLAttributes } from 'react';
import { defaultSpacing, defaultTypography } from '../theme/create-theme';

// ---------------------------------------------------------------------------
// Locale Picker Size
// ---------------------------------------------------------------------------

/**
 * Supported size variants for the {@link LocalePicker} component.
 *
 * @remarks
 * Three sizes (`sm`, `md`, `lg`) cover the common layout needs for
 * language / locale selection controls.
 */
export const localePickerSizes = ['sm', 'md', 'lg'] as const;

/**
 * Union of valid locale-picker size token strings.
 *
 * @remarks
 * Derived from the {@link localePickerSizes} tuple.
 */
export type LocalePickerSize = (typeof localePickerSizes)[number];

// ---------------------------------------------------------------------------
// Size Configuration
// ---------------------------------------------------------------------------

/**
 * Size configuration values used to derive dimensions and typography for a
 * specific {@link LocalePicker} size variant.
 */
export interface LocalePickerSizeConfig {
  /** Total height of the trigger button in pixels. */
  inputHeight: number;
  /** Font size for the trigger and option text in pixels. */
  fontSize: number;
  /** Size of the globe and checkmark icons in pixels. */
  iconSize: number;
  /** Border radius of the trigger button in pixels. */
  borderRadius: keyof ThemeRadii;
  /** Horizontal padding inside the trigger in pixels. */
  paddingX: number;
  /** Height of each option row in pixels. */
  optionHeight: number;
  /** Height of the search input inside the dropdown in pixels. */
  searchHeight: number;
}

/**
 * Pre-defined size configurations keyed by {@link LocalePickerSize}.
 *
 * @remarks
 * Maps each size token (`sm`, `md`, `lg`) to a complete
 * {@link LocalePickerSizeConfig} used for layout and typography calculations.
 */
export const localePickerSizeMap: Record<LocalePickerSize, LocalePickerSizeConfig> = {
  sm: { inputHeight: 28, fontSize: defaultTypography.sizes.xs.fontSize, iconSize: 14, borderRadius: 'md', paddingX: defaultSpacing.md, optionHeight: 32, searchHeight: 28 },
  md: { inputHeight: 34, fontSize: defaultTypography.sizes.sm.fontSize, iconSize: 16, borderRadius: 'md', paddingX: defaultSpacing.md, optionHeight: 36, searchHeight: 34 },
  lg: { inputHeight: 40, fontSize: defaultTypography.sizes.sm.fontSize, iconSize: 18, borderRadius: 'md', paddingX: defaultSpacing.lg, optionHeight: 40, searchHeight: 40 } };

// ---------------------------------------------------------------------------
// Locale Option
// ---------------------------------------------------------------------------

/**
 * Describes a single locale option rendered inside the {@link LocalePicker} dropdown.
 *
 * @remarks
 * Each option must have a unique `code` (BCP 47 language tag like `'en-US'`).
 * The `nativeLabel` shows the language name in its own script, and `region`
 * enables grouping options by geographic area.
 */
export interface LocaleOption {
  /** BCP 47 language code (e.g. `'en-US'`, `'fr-FR'`). */
  code: string;
  /** English display label (e.g. `'English (US)'`). */
  label: string;
  /** Label in the language's own script (e.g. `'English'`, `'Español'`). */
  nativeLabel?: string;
  /** Geographic region for grouping (e.g. `'Americas'`, `'Europe'`). */
  region?: string;
}

// ---------------------------------------------------------------------------
// Component Props
// ---------------------------------------------------------------------------

/**
 * Props accepted by the {@link LocalePicker} component.
 *
 * @remarks
 * Supports both controlled (`value` + `onChange`) and uncontrolled
 * (`defaultValue`) patterns. When `options` is omitted a built-in set of
 * 15+ common locales is used. Options can be grouped by region or displayed
 * as a flat list.
 */
export interface LocalePickerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** Controlled selected locale code. When provided the component is fully controlled. */
  value?: string;
  /**
   * Initial locale code for uncontrolled usage.
   *
   * @remarks
   * Ignored when {@link LocalePickerProps.value} is provided.
   */
  defaultValue?: string;
  /** Callback fired when the user selects a locale. Receives the locale `code`. */
  onChange?: (code: string) => void;
  /**
   * Array of {@link LocaleOption} items to display in the dropdown.
   *
   * @remarks
   * When omitted a built-in set of 15+ common locales is used.
   */
  options?: LocaleOption[];
  /**
   * Visual size variant controlling height, padding, and typography.
   *
   * @default 'md'
   */
  size?: LocalePickerSize;
  /**
   * Placeholder text shown when no locale is selected.
   *
   * @default 'Select language'
   */
  placeholder?: string;
  /**
   * Whether to display a search input inside the dropdown for filtering.
   *
   * @default true
   */
  searchable?: boolean;
  /**
   * Whether the locale picker is disabled.
   *
   * @default false
   */
  disabled?: boolean;
  /**
   * When `true` a pulsing skeleton placeholder is rendered instead of the component.
   *
   * @default false
   */
  skeleton?: boolean;
  /** Label text rendered above the trigger. */
  label?: string;
  /**
   * Whether to group options by their `region` field.
   *
   * @default true
   */
  groupByRegion?: boolean;
}
