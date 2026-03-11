/**
 * @module types/GifPicker
 * @description Type definitions for the GifPicker component.
 */

// ---------------------------------------------------------------------------
// GIF Item
// ---------------------------------------------------------------------------

/** Represents a single GIF result from Tenor. */
export interface GifItem {
  /** Tenor GIF ID. */
  id: string;

  /** GIF title / description. */
  title: string;

  /** Full-size GIF URL (gif media format). */
  url: string;

  /** Small preview GIF URL (tinygif media format). */
  previewUrl: string;

  /** Preview image width in pixels. */
  width: number;

  /** Preview image height in pixels. */
  height: number;
}
