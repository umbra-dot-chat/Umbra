import { defaultTypography } from '../theme/create-theme';
import type React from 'react';

// ---------------------------------------------------------------------------
// Size
// ---------------------------------------------------------------------------

/**
 * Tuple of valid QR code size literals.
 *
 * @remarks
 * Controls the overall dimension of the QR code SVG.
 */
export const qrCodeSizes = ['sm', 'md', 'lg', 'xl'] as const;

/** Union type derived from {@link qrCodeSizes}. */
export type QRCodeSize = (typeof qrCodeSizes)[number];

// ---------------------------------------------------------------------------
// Dot style
// ---------------------------------------------------------------------------

/**
 * Tuple of valid dot-style variants for QR code data modules.
 */
export const qrCodeDotStyles = [
  'square',
  'circle',
  'rounded',
  'diamond',
  'star',
  'classy',
  'classy-rounded',
] as const;

/** Union type derived from {@link qrCodeDotStyles}. */
export type QRCodeDotStyle = (typeof qrCodeDotStyles)[number];

// ---------------------------------------------------------------------------
// Eye style (finder pattern)
// ---------------------------------------------------------------------------

/**
 * Tuple of valid eye (finder pattern) outer frame styles.
 */
export const qrCodeEyeFrameStyles = ['square', 'circle', 'rounded'] as const;

/** Union type derived from {@link qrCodeEyeFrameStyles}. */
export type QRCodeEyeFrameStyle = (typeof qrCodeEyeFrameStyles)[number];

/**
 * Tuple of valid eye (finder pattern) inner pupil styles.
 */
export const qrCodeEyePupilStyles = ['square', 'circle', 'rounded', 'diamond'] as const;

/** Union type derived from {@link qrCodeEyePupilStyles}. */
export type QRCodeEyePupilStyle = (typeof qrCodeEyePupilStyles)[number];

// ---------------------------------------------------------------------------
// Gradient
// ---------------------------------------------------------------------------

/**
 * A colour stop within a QR code gradient.
 */
export interface QRCodeGradientStop {
  /** Offset from 0 to 1. */
  offset: number;
  /** CSS colour value. */
  color: string;
}

/**
 * Configuration for a linear or radial gradient applied to QR modules.
 */
export interface QRCodeGradient {
  /** Type of gradient. */
  type: 'linear' | 'radial';
  /** Colour stops. Must include at least 2. */
  stops: QRCodeGradientStop[];
  /**
   * Rotation angle in degrees (linear only).
   * @default 0
   */
  rotation?: number;
}

// ---------------------------------------------------------------------------
// Error correction level
// ---------------------------------------------------------------------------

/**
 * Tuple of valid error-correction levels (per QR spec).
 *
 * - `'L'` — ~7 % recovery
 * - `'M'` — ~15 % recovery
 * - `'Q'` — ~25 % recovery
 * - `'H'` — ~30 % recovery
 */
export const qrCodeErrorLevels = ['L', 'M', 'Q', 'H'] as const;

/** Union type derived from {@link qrCodeErrorLevels}. */
export type QRCodeErrorLevel = (typeof qrCodeErrorLevels)[number];

// ---------------------------------------------------------------------------
// Size -> dimensions map
// ---------------------------------------------------------------------------

/**
 * Resolved dimension values for a single {@link QRCodeSize}.
 */
export interface QRCodeSizeConfig {
  /** Width / height of the SVG in pixels. */
  dimension: number;
  /** Number of quiet-zone modules around the QR code. */
  quietZone: number;
  /** Font size for optional metadata text below the code. */
  fontSize: number;
}

/**
 * Maps each {@link QRCodeSize} to its {@link QRCodeSizeConfig}.
 */
export const qrCodeSizeMap: Record<QRCodeSize, QRCodeSizeConfig> = {
  sm: { dimension: 128, quietZone: 4, fontSize: defaultTypography.sizes['2xs'].fontSize },
  md: { dimension: 200, quietZone: 4, fontSize: defaultTypography.sizes.xs.fontSize },
  lg: { dimension: 300, quietZone: 4, fontSize: defaultTypography.sizes.sm.fontSize },
  xl: { dimension: 400, quietZone: 4, fontSize: defaultTypography.sizes.base.fontSize },
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props accepted by the {@link QRCode} component.
 *
 * @remarks
 * Renders a stylised QR code using raw SVG. Supports custom dot shapes,
 * finder-pattern (eye) customisation, gradient fills, theme-aware colours,
 * and an optional centre logo or content overlay.
 *
 * - Uses `qrcode-generator` internally to compute the module matrix.
 * - Eye styling can be customised independently from data dots.
 * - When a logo is used, prefer error-correction level `'Q'` or `'H'`.
 *
 * @example
 * ```tsx
 * <QRCode
 *   value="https://example.com"
 *   size="lg"
 *   dotStyle="classy-rounded"
 *   eyeFrameStyle="rounded"
 *   eyeColor="#6366F1"
 *   gradient={{ type: 'linear', rotation: 45, stops: [
 *     { offset: 0, color: '#6366F1' },
 *     { offset: 1, color: '#EC4899' },
 *   ]}}
 * />
 * ```
 */
export interface QRCodeProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  /**
   * The data to encode into the QR code.
   */
  value: string;

  /**
   * Size variant controlling dimension and quiet zone.
   *
   * @default 'md'
   */
  size?: QRCodeSize;

  /**
   * Visual style for data modules (not finder patterns).
   *
   * @default 'square'
   */
  dotStyle?: QRCodeDotStyle;

  /**
   * Error correction level.
   *
   * @default 'M'
   */
  errorLevel?: QRCodeErrorLevel;

  /**
   * Override colour for dark (active) modules.
   * When omitted, defaults to the current theme's `text.primary`.
   * Ignored when `gradient` is provided.
   */
  darkColor?: string;

  /**
   * Override colour for the QR code background.
   * When omitted, defaults to the current theme's `background.surface`.
   */
  lightColor?: string;

  /**
   * Gradient fill applied to data modules.
   * When provided, `darkColor` is used only as a fallback.
   */
  gradient?: QRCodeGradient;

  /**
   * Style for the outer frame of the finder-pattern eyes.
   * When omitted, eyes render as standard squares.
   *
   * @default 'square'
   */
  eyeFrameStyle?: QRCodeEyeFrameStyle;

  /**
   * Style for the inner pupil of the finder-pattern eyes.
   * When omitted, pupils render as standard squares.
   *
   * @default 'square'
   */
  eyePupilStyle?: QRCodeEyePupilStyle;

  /**
   * Override colour for the finder-pattern eyes.
   * When omitted, falls back to `darkColor` or the gradient.
   */
  eyeColor?: string;

  /**
   * Custom content rendered in the centre of the QR code (e.g. a logo).
   * Alias for `children`.
   */
  logo?: React.ReactNode;

  /**
   * Diameter of the cleared logo area as a fraction of the QR code width.
   * Only applies when `logo` or `children` is provided.
   *
   * @default 0.2
   */
  logoSize?: number;

  /**
   * Background colour behind the logo.
   * When omitted, defaults to the `lightColor` (or theme surface).
   */
  logoBgColor?: string;

  /**
   * Whether to include a quiet-zone margin around the code.
   *
   * @default true
   */
  showQuietZone?: boolean;

  /**
   * Arbitrary content rendered in the centre of the QR code.
   */
  children?: React.ReactNode;
}
