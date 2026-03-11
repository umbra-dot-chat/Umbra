/**
 * @module MessageContextMenu
 * @description Minimal styles for the MessageContextMenu component.
 * Most visual styling is delegated to the underlying ContextMenu primitives.
 */
import type { CSSStyleObject } from '../types';
import type { WispTheme } from '../theme/types';

// ---------------------------------------------------------------------------
// Container — wraps the context menu trigger
// ---------------------------------------------------------------------------

export function buildMessageContextMenuContainerStyle(): CSSStyleObject {
  return {
    display: 'inline-block',
  };
}

// ---------------------------------------------------------------------------
// Destructive item text color override
// ---------------------------------------------------------------------------

export function buildMessageContextMenuDestructiveColor(
  theme: WispTheme,
): string {
  return theme.colors.status.danger;
}
