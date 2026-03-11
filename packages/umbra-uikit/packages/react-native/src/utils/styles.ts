/**
 * @module utils/styles
 * @description Style translation utilities for converting core CSSStyleObject
 * values into React Native compatible ViewStyle / TextStyle objects.
 *
 * Core style builders return web-oriented CSS. Rather than polluting core with
 * platform conditionals, these thin helpers strip unsupported properties and
 * translate web-specific shorthands (e.g. `boxShadow`) into their RN equivalents.
 */

import type { CSSStyleObject } from '@coexist/wisp-core';
import type { ViewStyle, TextStyle } from 'react-native';

// ---------------------------------------------------------------------------
// Web-only CSS properties that have no RN equivalent
// ---------------------------------------------------------------------------

const WEB_ONLY_PROPS = new Set([
  'cursor',
  'outline',
  'outlineOffset',
  'boxSizing',
  'userSelect',
  'whiteSpace',
  'WebkitLineClamp',
  'WebkitBoxOrient',
  'appearance',
  'WebkitAppearance',
  'transition',
  'animation',
  'caretColor',
  'textDecoration',
  'backdropFilter',
  'WebkitBackdropFilter',
  'textOverflow',
  'pointerEvents',
  'display',
  'boxShadow',
]);

// ---------------------------------------------------------------------------
// stripWebProps
// ---------------------------------------------------------------------------

/**
 * Remove CSS properties that are unsupported in React Native.
 *
 * @param style - A CSSStyleObject from any core style builder.
 * @returns A cleaned object safe to spread into RN `style` props.
 */
export function stripWebProps(style: CSSStyleObject): ViewStyle & TextStyle {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(style)) {
    if (value === undefined) continue;
    if (WEB_ONLY_PROPS.has(key)) continue;
    result[key] = value;
  }

  return result as ViewStyle & TextStyle;
}

// ---------------------------------------------------------------------------
// toRNShadow
// ---------------------------------------------------------------------------

/**
 * Parse a CSS `box-shadow` string into React Native shadow props.
 *
 * @remarks
 * Only handles the first shadow value (RN only supports one shadow).
 * Returns iOS shadow properties + Android `elevation`.
 *
 * @param boxShadow - CSS box-shadow string, e.g. `"0 2px 8px rgba(0,0,0,0.12)"`.
 * @returns An object with `shadowColor`, `shadowOffset`, `shadowOpacity`,
 *   `shadowRadius`, and `elevation`.
 */
export function toRNShadow(boxShadow: string | undefined): ViewStyle {
  if (!boxShadow || boxShadow === 'none') {
    return {};
  }

  // Handle "inset" shadows — RN has no inset concept, skip them
  if (boxShadow.startsWith('inset')) {
    return {};
  }

  // Parse "offsetX offsetY blurRadius color"
  // e.g. "0 1px 2px rgba(0,0,0,0.15)" or "0 2px 8px #00000020"
  const rgbaMatch = boxShadow.match(
    /(-?\d+)(?:px)?\s+(-?\d+)(?:px)?\s+(-?\d+)(?:px)?\s+(rgba?\([^)]+\)|#[0-9a-fA-F]+)/,
  );

  if (!rgbaMatch) {
    return {};
  }

  const offsetX = parseInt(rgbaMatch[1], 10);
  const offsetY = parseInt(rgbaMatch[2], 10);
  const blurRadius = parseInt(rgbaMatch[3], 10);
  const color = rgbaMatch[4];

  // Extract opacity from rgba
  let opacity = 1;
  const opacityMatch = color.match(/,\s*([\d.]+)\s*\)$/);
  if (opacityMatch) {
    opacity = parseFloat(opacityMatch[1]);
  }

  return {
    shadowColor: color,
    shadowOffset: { width: offsetX, height: offsetY },
    shadowOpacity: opacity,
    shadowRadius: blurRadius / 2,
    elevation: Math.max(1, Math.round(blurRadius / 2)),
  };
}
