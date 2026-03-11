/**
 * @module styles/chart-utils
 * @description Shared geometry utilities for Wisp chart components.
 *
 * Pure math functions consumed by both the React and React Native
 * renderers so that SVG geometry is calculated identically on every
 * platform.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Computed geometry for a single activity ring. */
export interface RingGeometry {
  /** Ring index (0 = outermost). */
  index: number;
  /** Centre-to-middle-of-stroke radius. */
  radius: number;
  /** Full circumference of this ring. */
  circumference: number;
  /** Stroke-dashoffset representing the unfilled portion. */
  dashOffset: number;
  /** Clamped progress fraction (0–1). */
  percent: number;
}

/** A Cartesian point. */
export interface Point {
  x: number;
  y: number;
}

// ---------------------------------------------------------------------------
// Ring geometry (ActivityCircles)
// ---------------------------------------------------------------------------

/**
 * Computes the SVG geometry for each concentric activity ring.
 *
 * @param ringValues - Array of `{ value, max }` pairs (outer → inner).
 * @param diameter - Overall SVG width/height in px.
 * @param strokeWidth - Stroke width of each ring in px.
 * @param gap - Gap between concentric rings in px.
 * @returns An array of {@link RingGeometry} objects, one per ring.
 */
export function computeRingGeometry(
  ringValues: ReadonlyArray<{ value: number; max: number }>,
  diameter: number,
  strokeWidth: number,
  gap: number,
): RingGeometry[] {
  return ringValues.map((ring, index) => {
    const radius =
      (diameter - strokeWidth) / 2 - index * (strokeWidth + gap);
    const circumference = 2 * Math.PI * radius;
    const percent = ring.max > 0
      ? Math.min(Math.max(ring.value / ring.max, 0), 1)
      : 0;
    const dashOffset = circumference * (1 - percent);

    return { index, radius, circumference, dashOffset, percent };
  });
}

// ---------------------------------------------------------------------------
// Polar / Cartesian (RadarChart)
// ---------------------------------------------------------------------------

/**
 * Converts a polar coordinate to a Cartesian point.
 *
 * @param cx - Centre X.
 * @param cy - Centre Y.
 * @param r - Radius.
 * @param angle - Angle in **radians**.
 * @returns A {@link Point} `{ x, y }`.
 */
export function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  angle: number,
): Point {
  return {
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  };
}

/**
 * Computes the angle (in radians) for a given axis index.
 * Axes are evenly distributed starting from -π/2 (12 o'clock).
 *
 * @param index - Zero-based axis index.
 * @param totalAxes - Total number of axes.
 * @returns Angle in radians.
 */
export function axisAngle(index: number, totalAxes: number): number {
  return (2 * Math.PI * index) / totalAxes - Math.PI / 2;
}

/**
 * Computes the polygon points string for a set of data values.
 *
 * @param values - Data values for each axis.
 * @param max - Maximum scale value.
 * @param radius - Chart radius in px.
 * @param cx - Centre X.
 * @param cy - Centre Y.
 * @returns An array of {@link Point} objects forming the polygon.
 */
export function computePolygonPoints(
  values: readonly number[],
  max: number,
  radius: number,
  cx: number,
  cy: number,
): Point[] {
  return values.map((value, i) => {
    const fraction = max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0;
    const angle = axisAngle(i, values.length);
    return polarToCartesian(cx, cy, radius * fraction, angle);
  });
}

/**
 * Converts an array of points to an SVG `points` attribute string.
 *
 * @param pts - Array of {@link Point} objects.
 * @returns A space-separated string of `"x,y"` pairs.
 */
export function pointsToString(pts: readonly Point[]): string {
  return pts.map((p) => `${p.x},${p.y}`).join(' ');
}

/**
 * Computes the vertices of a regular polygon (used for grid levels).
 *
 * @param sides - Number of sides.
 * @param radius - Polygon radius.
 * @param cx - Centre X.
 * @param cy - Centre Y.
 * @returns An array of {@link Point} objects.
 */
export function regularPolygonPoints(
  sides: number,
  radius: number,
  cx: number,
  cy: number,
): Point[] {
  return Array.from({ length: sides }, (_, i) => {
    const angle = axisAngle(i, sides);
    return polarToCartesian(cx, cy, radius, angle);
  });
}
