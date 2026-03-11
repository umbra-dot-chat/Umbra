/**
 * @module spacing
 * @description Spacing scale for the Wisp UI kit.
 *
 * A numeric pixel-based scale used for padding, margin, gap, and any other
 * spatial property. Values intentionally skip certain numbers to enforce
 * visual consistency and discourage arbitrary spacing.
 *
 * The scale follows a loose 4-px grid with additional fine-grained stops
 * at the small end (1, 2, 6, 10) for optical alignment.
 *
 * @example
 * ```tsx
 * import { spacing } from '@/tokens';
 *
 * <View style={{ padding: spacing[16], gap: spacing[8] }}>
 *   <Text style={{ marginBottom: spacing[4] }}>Hello</Text>
 * </View>
 * ```
 */

/**
 * Spacing scale (in pixels).
 *
 * | Key | px  | Typical use                         |
 * |-----|-----|-------------------------------------|
 * |  0  |  0  | Reset / collapse                    |
 * |  1  |  1  | Hairline offsets                    |
 * |  2  |  2  | Tight inner padding                 |
 * |  4  |  4  | Compact spacing, icon gaps          |
 * |  6  |  6  | Small inner padding                 |
 * |  8  |  8  | Default inner padding               |
 * | 10  | 10  | Slightly larger inner padding       |
 * | 12  | 12  | Standard gap between elements       |
 * | 16  | 16  | Card padding, section gaps          |
 * | 20  | 20  | Comfortable section spacing         |
 * | 24  | 24  | Large card padding                  |
 * | 32  | 32  | Section dividers                    |
 * | 40  | 40  | Page margins (mobile)               |
 * | 48  | 48  | Large section spacing               |
 * | 64  | 64  | Hero padding                        |
 * | 80  | 80  | Extra-large section spacing          |
 * | 96  | 96  | Maximum section spacing             |
 *
 * @example
 * ```ts
 * spacing[0]  // 0
 * spacing[8]  // 8
 * spacing[16] // 16
 * spacing[96] // 96
 * ```
 */
export const spacing = {
  /** 0 px - reset / collapse */
  0: 0,
  /** 1 px - hairline offsets */
  1: 1,
  /** 2 px - tight inner padding */
  2: 2,
  /** 4 px - compact spacing, icon gaps */
  4: 4,
  /** 6 px - small inner padding */
  6: 6,
  /** 8 px - default inner padding */
  8: 8,
  /** 10 px - slightly larger inner padding */
  10: 10,
  /** 12 px - standard gap between elements */
  12: 12,
  /** 16 px - card padding, section gaps */
  16: 16,
  /** 20 px - comfortable section spacing */
  20: 20,
  /** 24 px - large card padding */
  24: 24,
  /** 32 px - section dividers */
  32: 32,
  /** 40 px - page margins (mobile) */
  40: 40,
  /** 48 px - large section spacing */
  48: 48,
  /** 64 px - hero padding */
  64: 64,
  /** 80 px - extra-large section spacing */
  80: 80,
  /** 96 px - maximum section spacing */
  96: 96,
} as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Union of all spacing scale keys */
export type SpacingKey = keyof typeof spacing;

/** Union of all spacing pixel values */
export type SpacingValue = (typeof spacing)[SpacingKey];
