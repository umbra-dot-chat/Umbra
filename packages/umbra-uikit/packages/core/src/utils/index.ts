/**
 * @module utils
 * @description Barrel export for Wisp utility functions.
 *
 * Re-exports style helpers, platform detection, accessibility prop
 * generators, and WCAG contrast utilities.
 *
 * @example
 * ```ts
 * import {
 *   getAppearanceColors,
 *   isWeb,
 *   getButtonA11yProps,
 *   contrastRatio,
 * } from '@wisp-ui/core/utils';
 * ```
 */

export { type AppearanceColors, type SizeValues, getSizeValues, getShapeRadius } from './style-helpers';
export * from './platform';
export * from './accessibility';
export { relativeLuminance, contrastRatio, type WcagLevel, wcagLevel, passesAA, passesAALarge, passesAAA, bestTextColor, type ContrastPair, type ContrastAuditResult, auditContrast } from './contrast';
