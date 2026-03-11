import type React from 'react';

// ---------------------------------------------------------------------------
// Storage Bar
// ---------------------------------------------------------------------------

/**
 * Data model for a single bar in the storage usage visualization.
 */
export interface StorageBar {
  /** Display label for the bar. */
  label: string;
  /** Number of bytes currently used. */
  usedBytes: number;
  /** Total number of bytes available. */
  totalBytes: number;
  /** Optional override color for the bar fill. */
  color?: string;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props accepted by the {@link StorageUsageViz} component.
 *
 * @remarks
 * Extends the native `HTMLDivElement` attributes so standard DOM props such as
 * `className`, `id`, and event handlers are forwarded to the root element.
 */
export interface StorageUsageVizProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Array of storage bars to visualize. */
  bars: StorageBar[];
  /** Chart title. @default 'Storage Usage' */
  title?: string;
  /** Whether to show the color legend. @default true */
  showLegend?: boolean;
  /** Height of the chart area in pixels. @default 200 */
  height?: number;
  /** Show skeleton placeholder. */
  skeleton?: boolean;
}
