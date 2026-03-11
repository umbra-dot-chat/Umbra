/**
 * Deterministic avatar generator for wisps.
 *
 * Produces a unique SVG avatar from a seed string by hashing
 * it with SHA-256 and using the resulting bytes to derive
 * colors, shape positions, and sizes. Every wisp gets a
 * visually distinct abstract geometric avatar.
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex } from '@noble/hashes/utils';

const SIZE = 128;

/** Generate a deterministic SVG avatar from a seed string. */
export function generateWispAvatar(seed: string): string {
  const hash = bytesToHex(sha256(new TextEncoder().encode(seed)));
  const bytes = hexToNumbers(hash);

  // Derive two hues for a gradient background
  const hue1 = (bytes[0] * 360) / 256;
  const hue2 = (bytes[1] * 360) / 256;
  const sat = 55 + (bytes[2] % 35);
  const light1 = 25 + (bytes[3] % 20);
  const light2 = 35 + (bytes[4] % 20);

  const bg1 = `hsl(${hue1}, ${sat}%, ${light1}%)`;
  const bg2 = `hsl(${hue2}, ${sat}%, ${light2}%)`;

  // Generate 4 geometric shapes from hash bytes
  const shapes = buildShapes(bytes.slice(5));

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${bg1}"/>
      <stop offset="100%" stop-color="${bg2}"/>
    </linearGradient>
  </defs>
  <rect width="${SIZE}" height="${SIZE}" fill="url(#bg)" rx="16"/>
${shapes}
</svg>`;
}

/** Save an SVG avatar to the wisp's data directory. */
export function saveAvatar(
  dataDir: string,
  name: string,
  svgContent: string,
): void {
  const dir = join(dataDir, name);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'avatar.svg'), svgContent, 'utf-8');
}

// ── Internal helpers ────────────────────────────────────────────────

/** Build 4 deterministic shapes from hash-derived byte values. */
function buildShapes(bytes: number[]): string {
  const shapes: string[] = [];

  for (let i = 0; i < 4; i++) {
    const offset = i * 6;
    const shapeType = bytes[offset] % 3;
    const cx = 20 + (bytes[offset + 1] % 88);
    const cy = 20 + (bytes[offset + 2] % 88);
    const size = 12 + (bytes[offset + 3] % 24);
    const hue = (bytes[offset + 4] * 360) / 256;
    const opacity = 0.3 + (bytes[offset + 5] % 50) / 100;

    const fill = `hsla(${hue}, 70%, 65%, ${opacity.toFixed(2)})`;

    switch (shapeType) {
      case 0:
        // Circle
        shapes.push(
          `  <circle cx="${cx}" cy="${cy}" r="${size}" fill="${fill}"/>`,
        );
        break;
      case 1:
        // Rounded rectangle
        shapes.push(
          `  <rect x="${cx - size / 2}" y="${cy - size / 2}" ` +
            `width="${size}" height="${size}" rx="${size / 4}" fill="${fill}"/>`,
        );
        break;
      case 2:
        // Small dots cluster (3 dots)
        shapes.push(buildDotCluster(cx, cy, size, fill, bytes[offset]));
        break;
    }
  }

  return shapes.join('\n');
}

/** Build a cluster of 3 small dots around a center point. */
function buildDotCluster(
  cx: number,
  cy: number,
  size: number,
  fill: string,
  seed: number,
): string {
  const r = size / 4;
  const spread = size / 2;
  const angle = ((seed % 6) * Math.PI) / 3;
  const dots: string[] = [];

  for (let i = 0; i < 3; i++) {
    const a = angle + (i * 2 * Math.PI) / 3;
    const dx = cx + Math.round(Math.cos(a) * spread);
    const dy = cy + Math.round(Math.sin(a) * spread);
    dots.push(`  <circle cx="${dx}" cy="${dy}" r="${r}" fill="${fill}"/>`);
  }

  return dots.join('\n');
}

/** Convert a hex string to an array of byte values. */
function hexToNumbers(hex: string): number[] {
  const result: number[] = [];
  for (let i = 0; i < hex.length; i += 2) {
    result.push(parseInt(hex.slice(i, i + 2), 16));
  }
  return result;
}
