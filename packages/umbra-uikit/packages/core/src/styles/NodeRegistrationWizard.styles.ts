/**
 * @module components/node-registration-wizard
 *
 * Style-building utilities for the {@link NodeRegistrationWizard} component.
 */

import type { CSSStyleObject } from '../types';
import type { WispTheme } from '../theme/types';

// ---------------------------------------------------------------------------
// Container
// ---------------------------------------------------------------------------

export function buildWizardContainerStyle(theme: WispTheme): CSSStyleObject {
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.xl,
    padding: theme.spacing.xl,
    minWidth: 420,
  };
}

// ---------------------------------------------------------------------------
// Step content
// ---------------------------------------------------------------------------

export function buildStepContentStyle(theme: WispTheme): CSSStyleObject {
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.lg,
  };
}

// ---------------------------------------------------------------------------
// Type card
// ---------------------------------------------------------------------------

export function buildTypeCardStyle(selected: boolean, theme: WispTheme): CSSStyleObject {
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.sm,
    padding: theme.spacing.lg,
    borderRadius: theme.radii.lg,
    backgroundColor: selected ? theme.colors.accent.highlight : theme.colors.background.surface,
    border: `2px solid ${selected ? theme.colors.accent.primary : theme.colors.border.subtle}`,
    cursor: 'pointer',
    transition: 'border-color 150ms ease, background-color 150ms ease',
  };
}

// ---------------------------------------------------------------------------
// Form field group
// ---------------------------------------------------------------------------

export function buildFieldGroupStyle(theme: WispTheme): CSSStyleObject {
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.xs,
  };
}

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

export function buildFooterStyle(theme: WispTheme): CSSStyleObject {
  return {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTop: `1px solid ${theme.colors.border.subtle}`,
  };
}

// ---------------------------------------------------------------------------
// Review row
// ---------------------------------------------------------------------------

export function buildReviewRowStyle(theme: WispTheme): CSSStyleObject {
  return {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: `${theme.spacing.sm}px 0`,
    borderBottom: `1px solid ${theme.colors.border.subtle}`,
  };
}

// ---------------------------------------------------------------------------
// Key display
// ---------------------------------------------------------------------------

export function buildKeyDisplayStyle(theme: WispTheme): CSSStyleObject {
  return {
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.background.sunken,
    fontFamily: 'monospace',
    fontSize: 12,
    color: theme.colors.text.secondary,
    wordBreak: 'break-all',
    userSelect: 'all',
  };
}

// ---------------------------------------------------------------------------
// Error
// ---------------------------------------------------------------------------

export function buildErrorStyle(theme: WispTheme): CSSStyleObject {
  return {
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.status.dangerSurface,
    color: theme.colors.status.danger,
    fontSize: 14,
  };
}
