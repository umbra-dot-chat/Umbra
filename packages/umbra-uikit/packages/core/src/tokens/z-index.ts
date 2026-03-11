/**
 * @module z-index
 * @description Z-index stacking tokens for the Wisp UI kit.
 *
 * Defines a well-spaced numeric scale so that layered UI elements
 * (dropdowns, modals, toasts, tooltips, etc.) stack in a predictable
 * order without ad-hoc magic numbers.
 *
 * Gaps of 100 between levels leave room for intermediate layers
 * without requiring a refactor of the entire scale.
 *
 * @example
 * ```tsx
 * import { zIndex } from '@/tokens';
 *
 * // Overlay behind a modal
 * <View style={{ ...StyleSheet.absoluteFillObject, zIndex: zIndex.overlay }} />
 *
 * // Modal on top of the overlay
 * <View style={{ zIndex: zIndex.modal }}>
 *   <ModalContent />
 * </View>
 *
 * // Toast notification above everything
 * <View style={{ zIndex: zIndex.toast }}>
 *   <Toast message="Saved!" />
 * </View>
 * ```
 */

/**
 * Z-index stacking scale.
 *
 * | Token    | Value | Typical use                             |
 * |----------|-------|-----------------------------------------|
 * | base     |     0 | Default document flow                   |
 * | dropdown |  1000 | Dropdown menus, select popovers         |
 * | sticky   |  1100 | Sticky headers, floating action buttons |
 * | overlay  |  1200 | Backdrops, screen overlays              |
 * | modal    |  1300 | Modal dialogs, bottom sheets            |
 * | popover  |  1400 | Popovers, context menus over modals     |
 * | toast    |  1500 | Toast notifications, snackbars          |
 * | tooltip  |  1600 | Tooltips (highest persistent layer)     |
 *
 * @example
 * ```ts
 * zIndex.base     // 0
 * zIndex.modal    // 1300
 * zIndex.tooltip  // 1600
 * ```
 */
export const zIndex = {
  /** 0 - default document flow */
  base: 0,
  /** 1000 - dropdown menus, select popovers */
  dropdown: 1000,
  /** 1100 - sticky headers, floating action buttons */
  sticky: 1100,
  /** 1200 - backdrops, screen overlays */
  overlay: 1200,
  /** 1300 - modal dialogs, bottom sheets */
  modal: 1300,
  /** 1400 - popovers, context menus over modals */
  popover: 1400,
  /** 1500 - toast notifications, snackbars */
  toast: 1500,
  /** 1600 - tooltips (highest persistent layer) */
  tooltip: 1600,
} as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Union of all z-index keys */
export type ZIndexKey = keyof typeof zIndex;

/** Union of all z-index values */
export type ZIndexValue = (typeof zIndex)[ZIndexKey];
