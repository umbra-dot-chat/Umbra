/**
 * Google Fonts catalog service — fetches font metadata at runtime.
 *
 * Uses CORS-friendly endpoints to fetch the full Google Fonts catalog.
 * Fonts are loaded on-demand from Google's CDN, so this only fetches metadata
 * (family names, categories, weights). No font files are bundled or downloaded
 * until the user selects one.
 *
 * Endpoint priority:
 * 1. fontsource CDN mirror (CORS-friendly, no API key, fast)
 * 2. fontsource GitHub raw (CORS-friendly, no API key, fallback)
 * 3. Google Fonts Developer API (requires API key env var)
 */

import type { FontEntry } from '@/contexts/FontContext';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface GoogleFontItem {
  family: string;
  variants: string[];
  subsets: string[];
  category: string;
}

interface GoogleFontsApiResponse {
  kind: string;
  items: GoogleFontItem[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Cache
// ─────────────────────────────────────────────────────────────────────────────

let cachedCatalog: FontEntry[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORY_MAP: Record<string, FontEntry['category']> = {
  'sans-serif': 'sans-serif',
  serif: 'serif',
  monospace: 'monospace',
  display: 'display',
  handwriting: 'handwriting',
};

/** Map common weights like "regular" to numeric values */
function parseWeight(variant: string): number | null {
  if (variant === 'regular') return 400;
  const num = parseInt(variant, 10);
  return !isNaN(num) && num >= 100 && num <= 900 ? num : null;
}

/** Convert a Google Fonts API item into our FontEntry format */
function apiItemToFontEntry(item: GoogleFontItem): FontEntry {
  const family = item.family.replace(/ /g, '+');

  // Extract numeric weights (skip italic variants)
  const weights = item.variants
    .filter((v) => !v.includes('italic'))
    .map(parseWeight)
    .filter((w): w is number => w !== null && [400, 500, 600, 700].includes(w));

  // Ensure at least weight 400
  if (weights.length === 0) weights.push(400);

  const category = CATEGORY_MAP[item.category] ?? 'sans-serif';
  const fallback = category === 'monospace' ? 'monospace' : category === 'serif' ? 'serif' : 'sans-serif';

  return {
    id: item.family.toLowerCase().replace(/\s+/g, '-'),
    name: item.family,
    family,
    category,
    css: `"${item.family}", ${fallback}`,
    weights: weights.sort((a, b) => a - b),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CORS-friendly endpoints
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Primary: fontsource CDN mirror via jsDelivr.
 * CORS-friendly, fast CDN, no API key required.
 * Returns the same format as Google Fonts Developer API `items` array.
 */
async function fetchFromFontsourceCDN(): Promise<FontEntry[]> {
  const url = 'https://cdn.jsdelivr.net/gh/fontsource/google-font-metadata@main/data/api-response.json';
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`fontsource CDN: ${response.status}`);
  }

  const data: GoogleFontItem[] = await response.json();
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('fontsource CDN: empty or invalid response');
  }

  return data.map(apiItemToFontEntry);
}

/**
 * Fallback: fontsource GitHub raw.
 * CORS-friendly, no API key required.
 */
async function fetchFromFontsourceRaw(): Promise<FontEntry[]> {
  const url = 'https://raw.githubusercontent.com/fontsource/google-font-metadata/main/data/api-response.json';
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`fontsource raw: ${response.status}`);
  }

  const data: GoogleFontItem[] = await response.json();
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('fontsource raw: empty or invalid response');
  }

  return data.map(apiItemToFontEntry);
}

/**
 * Last resort: Google Fonts Developer API with an API key.
 * The key can be provided via env var.
 */
async function fetchFromDeveloperApi(): Promise<FontEntry[]> {
  const apiKey =
    (typeof process !== 'undefined' &&
      (process.env as any)?.EXPO_PUBLIC_GOOGLE_FONTS_API_KEY) ||
    null;

  if (!apiKey) {
    throw new Error('No Google Fonts API key available');
  }

  const url = `https://www.googleapis.com/webfonts/v1/webfonts?key=${apiKey}&sort=popularity`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Google Fonts API: ${response.status} ${response.statusText}`);
  }

  const data: GoogleFontsApiResponse = await response.json();
  if (!data.items || !Array.isArray(data.items)) {
    throw new Error('Invalid Google Fonts API response');
  }

  return data.items.map(apiItemToFontEntry);
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch the full Google Fonts catalog.
 *
 * Tries multiple CORS-friendly sources in order:
 * 1. fontsource CDN mirror (jsDelivr — fast, CORS-friendly)
 * 2. fontsource GitHub raw (CORS-friendly fallback)
 * 3. Google Fonts Developer API (if API key env var is set)
 *
 * Results are cached in-memory for 24 hours.
 */
export async function fetchGoogleFontsCatalog(): Promise<FontEntry[]> {
  // Return cached if still fresh
  if (cachedCatalog && Date.now() - cacheTimestamp < CACHE_TTL) {
    return cachedCatalog;
  }

  const errors: string[] = [];

  // Try fontsource CDN first (CORS-friendly, fast)
  try {
    const catalog = await fetchFromFontsourceCDN();
    cachedCatalog = catalog;
    cacheTimestamp = Date.now();
    console.log(`[FontCatalog] Loaded ${catalog.length} fonts from fontsource CDN`);
    return catalog;
  } catch (err: any) {
    errors.push(`cdn: ${err.message}`);
  }

  // Try fontsource GitHub raw as fallback
  try {
    const catalog = await fetchFromFontsourceRaw();
    cachedCatalog = catalog;
    cacheTimestamp = Date.now();
    console.log(`[FontCatalog] Loaded ${catalog.length} fonts from fontsource raw`);
    return catalog;
  } catch (err: any) {
    errors.push(`raw: ${err.message}`);
  }

  // Try Developer API with key if available
  try {
    const catalog = await fetchFromDeveloperApi();
    cachedCatalog = catalog;
    cacheTimestamp = Date.now();
    console.log(`[FontCatalog] Loaded ${catalog.length} fonts from Developer API`);
    return catalog;
  } catch (err: any) {
    errors.push(`api: ${err.message}`);
  }

  console.warn(`[FontCatalog] All sources failed: ${errors.join('; ')}`);
  throw new Error(`Failed to fetch font catalog: ${errors.join('; ')}`);
}

/** Clear the in-memory cache (useful for testing or forced refresh). */
export function clearCatalogCache(): void {
  cachedCatalog = null;
  cacheTimestamp = 0;
}
