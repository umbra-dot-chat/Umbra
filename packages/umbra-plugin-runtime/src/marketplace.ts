/**
 * MarketplaceClient — Fetch and search the plugin registry.
 *
 * The registry is a static JSON file hosted on a CDN.
 * Updated manually or via CI when new plugins are published.
 */

import type { PluginPermission, PluginPlatform, SlotRegistration } from '@umbra/plugin-sdk';

// =============================================================================
// TYPES
// =============================================================================

/** A plugin listing in the marketplace registry. */
export interface MarketplaceListing {
  /** Unique plugin ID (reverse-domain) */
  id: string;
  /** Human-readable name */
  name: string;
  /** Short description */
  description: string;
  /** Author info */
  author: { name: string; url?: string };
  /** Current version */
  version: string;
  /** Icon URL */
  icon?: string;
  /** Download URL for the plugin bundle */
  downloadUrl: string;
  /** Bundle size in bytes */
  size: number;
  /** Total download count */
  downloads: number;
  /** Rating (0-5) */
  rating?: number;
  /** Searchable tags */
  tags: string[];
  /** Supported platforms */
  platforms: PluginPlatform[];
  /** Required permissions (for display in marketplace) */
  permissions?: PluginPermission[];
  /** Slot registrations (for display in marketplace) */
  slots?: SlotRegistration[];
  /** Storage requirements */
  storage?: {
    kv?: boolean;
    sql?: { tables: string[] };
  };
}

/** The full registry JSON structure. */
export interface PluginRegistry {
  /** Schema version */
  version: number;
  /** Last updated timestamp */
  updatedAt: string;
  /** All available plugins */
  plugins: MarketplaceListing[];
  /** Available categories/tags */
  categories: string[];
}

// =============================================================================
// DEFAULT REGISTRY URL
// =============================================================================

/**
 * Default registry URL. Points to the local /plugins.json served by Expo's
 * dev server (from the `public/` directory). In production, this would be
 * replaced with a CDN-hosted registry URL.
 */
const DEFAULT_REGISTRY_URL = '/plugins.json';

// =============================================================================
// CLIENT
// =============================================================================

export class MarketplaceClient {
  private registryUrl: string;
  private cache: PluginRegistry | null = null;
  private cacheExpiry: number = 0;
  private cacheTTL: number = 5 * 60 * 1000; // 5 minutes

  constructor(registryUrl?: string) {
    this.registryUrl = registryUrl ?? DEFAULT_REGISTRY_URL;
  }

  /**
   * Fetch the full plugin registry.
   * Results are cached for 5 minutes.
   */
  async getRegistry(): Promise<PluginRegistry> {
    if (this.cache && Date.now() < this.cacheExpiry) {
      return this.cache;
    }

    try {
      const response = await fetch(this.registryUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const registry = (await response.json()) as PluginRegistry;
      this.cache = registry;
      this.cacheExpiry = Date.now() + this.cacheTTL;
      return registry;
    } catch (err: any) {
      // If we have stale cache, use it
      if (this.cache) {
        console.warn('Failed to refresh plugin registry, using stale cache:', err.message);
        return this.cache;
      }

      // Return empty registry on first failure
      console.error('Failed to fetch plugin registry:', err.message);
      return {
        version: 0,
        updatedAt: new Date().toISOString(),
        plugins: [],
        categories: [],
      };
    }
  }

  /**
   * Get all available plugin listings.
   */
  async getListings(): Promise<MarketplaceListing[]> {
    const registry = await this.getRegistry();
    return registry.plugins;
  }

  /**
   * Search plugins by query string.
   * Searches name, description, tags, and author name.
   */
  async search(query: string): Promise<MarketplaceListing[]> {
    const listings = await this.getListings();
    const q = query.toLowerCase().trim();

    if (!q) return listings;

    return listings.filter((p) => {
      return (
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)) ||
        p.author.name.toLowerCase().includes(q)
      );
    });
  }

  /**
   * Filter plugins by category/tag.
   */
  async getByCategory(category: string): Promise<MarketplaceListing[]> {
    const listings = await this.getListings();
    const cat = category.toLowerCase();
    return listings.filter((p) => p.tags.some((t) => t.toLowerCase() === cat));
  }

  /**
   * Get available categories.
   */
  async getCategories(): Promise<string[]> {
    const registry = await this.getRegistry();
    return registry.categories;
  }

  /**
   * Get a single listing by ID.
   */
  async getListing(id: string): Promise<MarketplaceListing | null> {
    const listings = await this.getListings();
    return listings.find((p) => p.id === id) ?? null;
  }

  /**
   * Set a custom registry URL (for development / testing).
   */
  setRegistryUrl(url: string): void {
    this.registryUrl = url;
    this.cache = null;
    this.cacheExpiry = 0;
  }

  /**
   * Invalidate the cache.
   */
  invalidateCache(): void {
    this.cache = null;
    this.cacheExpiry = 0;
  }
}
