/**
 * @module types/ThemeEditor
 * @description Type definitions for the ThemeEditor component.
 */

import type React from 'react';
import type { ThemeEditorTab } from '../theme/editor-fields';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props accepted by the {@link ThemeEditor} component.
 *
 * @remarks
 * The ThemeEditor reads and writes theme overrides via the `useTheme()` context.
 * It must be rendered inside a `<WispProvider>` tree.
 */
export interface ThemeEditorProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /**
   * Initially active tab when uncontrolled.
   * @default 'colors'
   */
  defaultTab?: ThemeEditorTab;

  /** Controlled active tab. */
  activeTab?: ThemeEditorTab;

  /** Callback fired when the active tab changes. */
  onTabChange?: (tab: ThemeEditorTab) => void;

  /**
   * Whether to show the dark/light mode toggle at the top.
   * @default true
   */
  showModeToggle?: boolean;

  /**
   * Whether to show the reset-to-defaults button.
   * @default true
   */
  showReset?: boolean;

  /**
   * Maximum height for the scrollable content area.
   * @default 480
   */
  maxHeight?: number | string;
}

export type { ThemeEditorTab } from '../theme/editor-fields';
export type {
  ThemeEditorFieldDescriptor,
  ThemeEditorControlType,
  ThemeEditorFieldMeta,
  ThemeEditorFieldGroup,
  ThemeEditorTabDef,
} from '../theme/editor-fields';
