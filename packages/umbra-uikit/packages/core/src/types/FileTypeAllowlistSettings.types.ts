/**
 * @module FileTypeAllowlistSettings
 * @description Type definitions for the FileTypeAllowlistSettings component —
 * a settings panel for configuring accepted and blocked file types.
 */
import type React from 'react';

// ---------------------------------------------------------------------------
// Supporting types
// ---------------------------------------------------------------------------

/** A preset group of file types that can be toggled. */
export interface FileTypePreset {
  /** Display label for the preset. */
  label: string;
  /** MIME types or extensions included in the preset. */
  types: string[];
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props for the FileTypeAllowlistSettings component.
 */
export interface FileTypeAllowlistSettingsProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Currently allowed file types (MIME types or extensions). */
  allowedTypes: string[];
  /** Currently blocked file types (MIME types or extensions). */
  blockedTypes: string[];
  /** Called when the allowlist/blocklist is updated. */
  onUpdate: (allowed: string[], blocked: string[]) => void;
  /** Preset groups of file types. */
  presets?: FileTypePreset[];
  /** Show skeleton placeholder. @default false */
  skeleton?: boolean;
}
