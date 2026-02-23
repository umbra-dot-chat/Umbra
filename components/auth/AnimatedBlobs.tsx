import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Dimensions, View } from 'react-native';
import type { ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

// ---------------------------------------------------------------------------
// Multiple morphing ink blobs — one large (bottom-left) + two smaller accent
// ---------------------------------------------------------------------------

const TWO_PI = Math.PI * 2;
const NUM_POINTS = 10;

interface PointConfig {
  angle: number;
  baseRadius: number;
  amplitude: number;
  speed: number;
  phaseOffset: number;
}

interface BlobConfig {
  cx: number;
  cy: number;
  points: PointConfig[];
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function createPointConfigs(baseRadius: number): PointConfig[] {
  const configs: PointConfig[] = [];
  for (let i = 0; i < NUM_POINTS; i++) {
    const angle = (TWO_PI * i) / NUM_POINTS;
    configs.push({
      angle,
      baseRadius: baseRadius + rand(-baseRadius * 0.12, baseRadius * 0.12),
      amplitude: baseRadius * rand(0.06, 0.15),
      speed: rand(0.15, 0.45),
      phaseOffset: rand(0, TWO_PI),
    });
  }
  return configs;
}

function getPoints(
  configs: PointConfig[],
  cx: number,
  cy: number,
  t: number,
): { x: number; y: number }[] {
  return configs.map((c) => {
    const r = c.baseRadius + Math.sin(t * c.speed + c.phaseOffset) * c.amplitude;
    return {
      x: cx + Math.cos(c.angle) * r,
      y: cy + Math.sin(c.angle) * r,
    };
  });
}

function buildSmoothPath(pts: { x: number; y: number }[]): string {
  const n = pts.length;
  if (n < 3) return '';

  const parts: string[] = [];
  parts.push(`M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`);

  const tension = 0.33;

  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];

    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;

    parts.push(
      `C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`
    );
  }

  parts.push('Z');
  return parts.join(' ');
}

// ---------------------------------------------------------------------------
// Hook: returns animated blob path data for all blobs combined
// ---------------------------------------------------------------------------

function createBlobConfigs(width: number, height: number): BlobConfig[] {
  const minDim = Math.min(width, height);

  return [
    // Single large blob — offset left of center, overlapping form area
    {
      cx: width * 0.32,
      cy: height * 0.55,
      points: createPointConfigs(minDim * 0.38),
    },
  ];
}

export function useBlobPath() {
  const [dimensions, setDimensions] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
  });

  // Re-measure on mount (handles SSR where initial dimensions are 0)
  useEffect(() => {
    const { width, height } = Dimensions.get('window');
    if (width > 0 && height > 0) {
      setDimensions({ width, height });
    }

    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({ width: window.width, height: window.height });
    });

    return () => subscription?.remove();
  }, []);

  const { width, height } = dimensions;

  const blobsRef = useRef<BlobConfig[] | null>(null);
  const lastDimsRef = useRef({ width: 0, height: 0 });

  // Reinitialize blobs when dimensions change from 0 or significantly change
  if (
    !blobsRef.current ||
    (lastDimsRef.current.width === 0 && width > 0) ||
    (lastDimsRef.current.height === 0 && height > 0)
  ) {
    if (width > 0 && height > 0) {
      blobsRef.current = createBlobConfigs(width, height);
      lastDimsRef.current = { width, height };
    }
  }

  const [pathData, setPathData] = useState(() => {
    if (!blobsRef.current) return '';
    return blobsRef.current
      .map((blob) => {
        const pts = getPoints(blob.points, blob.cx, blob.cy, 0);
        return buildSmoothPath(pts);
      })
      .join(' ');
  });

  const animRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  const tick = useCallback(() => {
    if (!blobsRef.current) {
      animRef.current = requestAnimationFrame(tick);
      return;
    }
    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    const combined = blobsRef.current
      .map((blob) => {
        const pts = getPoints(blob.points, blob.cx, blob.cy, elapsed);
        return buildSmoothPath(pts);
      })
      .join(' ');
    setPathData(combined);
    animRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    startTimeRef.current = Date.now();
    animRef.current = requestAnimationFrame(tick);
    return () => {
      if (animRef.current !== null) {
        cancelAnimationFrame(animRef.current);
      }
    };
  }, [tick]);

  return { pathData, width, height };
}

// ---------------------------------------------------------------------------
// Blob renderer — draws all blobs as a single combined path
// ---------------------------------------------------------------------------

export interface AnimatedBlobsProps {
  style?: ViewStyle;
  /** Pass shared pathData from useBlobPath() so blob + clip-path stay in sync */
  pathData: string;
  /** Fill color for the blob shape (default: '#000000') */
  color?: string;
}

export function AnimatedBlobs({ style, pathData, color = '#000000' }: AnimatedBlobsProps) {
  const [dimensions, setDimensions] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
  });

  useEffect(() => {
    const { width, height } = Dimensions.get('window');
    if (width > 0 && height > 0) {
      setDimensions({ width, height });
    }

    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({ width: window.width, height: window.height });
    });

    return () => subscription?.remove();
  }, []);

  const { width, height } = dimensions;

  // Don't render until we have valid dimensions
  if (width === 0 || height === 0 || !pathData) {
    return null;
  }

  return (
    <View
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'hidden',
        },
        style,
      ]}
      pointerEvents="none"
    >
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <Path d={pathData} fill={color} fillRule="nonzero" />
      </Svg>
    </View>
  );
}
