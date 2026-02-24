/**
 * emojiShortcodes — Maps standard shortcode names (e.g. "thumbsup", "fire")
 * to their Unicode emoji characters. Merged from GitHub + emojibase datasets
 * covering ~5 300 shortcodes.
 *
 * Usage:
 *   resolveShortcode('thumbsup')  → '👍️'
 *   resolveShortcode('fire')      → '🔥'
 *   resolveShortcode('unknown')   → undefined
 */

// The JSON is a flat { shortcode: unicode } map generated at build time
// from emojibase-data (github + emojibase shortcode sets).
import shortcodeMap from './emoji-shortcodes.json';

const map: Record<string, string> = shortcodeMap as Record<string, string>;

/**
 * Resolve a shortcode name to its Unicode emoji character.
 * Returns `undefined` if the shortcode is not recognized.
 */
export function resolveShortcode(name: string): string | undefined {
  return map[name];
}

/**
 * Check whether a shortcode name maps to a standard Unicode emoji.
 */
export function isStandardShortcode(name: string): boolean {
  return name in map;
}

/** Expose the raw map for batch lookups if needed. */
export { map as shortcodeMap };
