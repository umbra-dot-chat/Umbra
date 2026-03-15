/**
 * agentAvatar — Deterministic SVG avatar generator for AI agents.
 *
 * Produces a unique geometric SVG from a seed string using a simple
 * hash function. Browser/RN compatible (no Node.js dependencies).
 * Based on the same approach as packages/umbra-wisps/src/avatar-generator.ts
 * but without the @noble/hashes or node:fs dependencies.
 */

const SIZE = 128;

/**
 * Simple deterministic hash — converts a string to an array of pseudo-random bytes.
 * Uses a basic FNV-1a-inspired approach, producing 32 bytes from any input.
 */
function simpleHash(input: string): number[] {
  const bytes: number[] = [];
  let h = 0x811c9dc5; // FNV offset basis

  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193); // FNV prime
  }

  // Generate 32 pseudo-random bytes by re-hashing
  for (let i = 0; i < 32; i++) {
    h ^= i;
    h = Math.imul(h, 0x01000193);
    bytes.push(((h >>> 0) % 256));
  }

  return bytes;
}

/** Generate a deterministic SVG avatar string from a seed. */
function generateAvatar(seed: string): string {
  const bytes = simpleHash(seed);

  // Derive two hues for a gradient background
  const hue1 = (bytes[0] * 360) / 256;
  const hue2 = (bytes[1] * 360) / 256;
  const sat = 55 + (bytes[2] % 35);
  const light1 = 25 + (bytes[3] % 20);
  const light2 = 35 + (bytes[4] % 20);

  const bg1 = `hsl(${hue1}, ${sat}%, ${light1}%)`;
  const bg2 = `hsl(${hue2}, ${sat}%, ${light2}%)`;

  // Generate 4 geometric shapes
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
        shapes.push(`  <circle cx="${cx}" cy="${cy}" r="${size}" fill="${fill}"/>`);
        break;
      case 1:
        shapes.push(
          `  <rect x="${cx - size / 2}" y="${cy - size / 2}" ` +
            `width="${size}" height="${size}" rx="${size / 4}" fill="${fill}"/>`,
        );
        break;
      case 2:
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

/**
 * Generate a data URI for a deterministic SVG avatar.
 * Uses btoa which is available in browser and React Native runtimes.
 */
export function getAgentAvatarUri(seed: string): string {
  const svg = generateAvatar(seed);
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}
