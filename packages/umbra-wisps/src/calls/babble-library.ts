/**
 * BabbleLibrary -- Manages pre-generated babble audio clips for
 * wisp voice channel playback.
 *
 * Scans the babble directory, indexes clips by wisp name, categorizes
 * by duration (using file size as proxy), and provides random unplayed
 * clip selection with history tracking.
 */

import { readdir, stat } from 'fs/promises';
import { join } from 'path';

// ── Types ─────────────────────────────────────────────────────────────────────

export type BabbleDuration = 'short' | 'medium' | 'long';

export interface BabbleClip {
  path: string;
  duration: BabbleDuration;
  index: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

/**
 * File size thresholds for duration categorization.
 * MP3 at ~128kbps:
 *   short  (2-5s)   -> <80KB
 *   medium (5-15s)   -> <240KB
 *   long   (15-30s)  -> >=240KB
 */
const SHORT_MAX_BYTES = 80 * 1024;
const MEDIUM_MAX_BYTES = 240 * 1024;

// ── BabbleLibrary ─────────────────────────────────────────────────────────────

export class BabbleLibrary {
  private clips: Map<string, BabbleClip[]> = new Map();
  private playedHistory: Map<string, Set<number>> = new Map();

  constructor(private babbleDir: string) {}

  /** Scan babble directory and index all clips. */
  async load(): Promise<void> {
    this.clips.clear();
    this.playedHistory.clear();

    let entries: string[];
    try {
      entries = await readdir(this.babbleDir);
    } catch {
      // Directory doesn't exist yet -- nothing to load
      return;
    }

    for (const wispDir of entries) {
      const dirPath = join(this.babbleDir, wispDir);
      const dirStat = await stat(dirPath).catch(() => null);
      if (!dirStat?.isDirectory()) continue;

      const wispName = wispDir.toLowerCase();
      const clips: BabbleClip[] = [];

      let files: string[];
      try {
        files = await readdir(dirPath);
      } catch {
        continue;
      }

      for (const file of files) {
        if (!file.endsWith('.mp3')) continue;

        const filePath = join(dirPath, file);
        const fileStat = await stat(filePath).catch(() => null);
        if (!fileStat) continue;

        // Parse index from filename (e.g., "001.mp3" -> 1)
        const indexMatch = file.match(/^(\d+)\.mp3$/);
        if (!indexMatch) continue;
        const index = parseInt(indexMatch[1], 10);

        // Categorize duration by file size
        const duration = classifyDuration(fileStat.size);

        clips.push({ path: filePath, duration, index });
      }

      // Sort by index for deterministic ordering
      clips.sort((a, b) => a.index - b.index);

      if (clips.length > 0) {
        this.clips.set(wispName, clips);
        this.playedHistory.set(wispName, new Set());
      }
    }
  }

  /**
   * Get a random unplayed clip for a wisp.
   *
   * If preferDuration is specified, tries to find a clip of that duration
   * first, then falls back to any unplayed clip. Automatically resets
   * history when all clips have been played.
   */
  getClip(
    wispName: string,
    preferDuration?: BabbleDuration,
  ): BabbleClip | null {
    const key = wispName.toLowerCase();
    const allClips = this.clips.get(key);
    if (!allClips || allClips.length === 0) return null;

    const played = this.playedHistory.get(key);
    if (!played) return null;

    // Auto-reset if all clips have been played
    if (played.size >= allClips.length) {
      this.resetHistory(wispName);
    }

    const unplayed = allClips.filter((c) => !played.has(c.index));
    if (unplayed.length === 0) return null;

    // Try preferred duration first
    if (preferDuration) {
      const preferred = unplayed.filter((c) => c.duration === preferDuration);
      if (preferred.length > 0) {
        return preferred[Math.floor(Math.random() * preferred.length)];
      }
    }

    // Fall back to any unplayed clip
    return unplayed[Math.floor(Math.random() * unplayed.length)];
  }

  /** Mark a clip as played. */
  markPlayed(wispName: string, clipIndex: number): void {
    const key = wispName.toLowerCase();
    const played = this.playedHistory.get(key);
    if (played) {
      played.add(clipIndex);
    }
  }

  /** Reset play history for a wisp (called when all clips exhausted). */
  resetHistory(wispName: string): void {
    const key = wispName.toLowerCase();
    const played = this.playedHistory.get(key);
    if (played) {
      played.clear();
    }
  }

  /** Check if a wisp has any clips available. */
  hasClips(wispName: string): boolean {
    const key = wispName.toLowerCase();
    const clips = this.clips.get(key);
    return clips !== undefined && clips.length > 0;
  }

  /** Get clip count per wisp. */
  getStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    for (const [name, clips] of this.clips) {
      stats[name] = clips.length;
    }
    return stats;
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Classify clip duration based on file size (MP3 ~128kbps). */
function classifyDuration(sizeBytes: number): BabbleDuration {
  if (sizeBytes < SHORT_MAX_BYTES) return 'short';
  if (sizeBytes < MEDIUM_MAX_BYTES) return 'medium';
  return 'long';
}
