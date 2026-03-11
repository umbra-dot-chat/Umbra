/**
 * @module components/node-pairing-flow
 *
 * Style-building utilities for the {@link NodePairingFlow} component.
 */

import type { CSSStyleObject } from '../types';
import type { WispTheme } from '../theme/types';
import type { PairingStatus } from '../types/NodePairingFlow.types';

// ---------------------------------------------------------------------------
// Container
// ---------------------------------------------------------------------------

export function buildPairingContainerStyle(theme: WispTheme): CSSStyleObject {
  return {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: theme.spacing.xl,
    padding: theme.spacing.xl,
    minWidth: 380,
  };
}

// ---------------------------------------------------------------------------
// QR code wrapper
// ---------------------------------------------------------------------------

export function buildQRWrapperStyle(theme: WispTheme): CSSStyleObject {
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
    borderRadius: theme.radii.lg,
    backgroundColor: '#ffffff',
  };
}

// ---------------------------------------------------------------------------
// Token display
// ---------------------------------------------------------------------------

export function buildTokenDisplayStyle(theme: WispTheme): CSSStyleObject {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.background.sunken,
    fontFamily: 'monospace',
    fontSize: 13,
    color: theme.colors.text.secondary,
    wordBreak: 'break-all',
    width: '100%',
    boxSizing: 'border-box',
  };
}

// ---------------------------------------------------------------------------
// Status badge colors
// ---------------------------------------------------------------------------

export function resolvePairingStatusColor(status: PairingStatus, theme: WispTheme): string {
  switch (status) {
    case 'idle':
      return theme.colors.text.muted;
    case 'waiting':
      return theme.colors.status.warning;
    case 'connected':
      return theme.colors.status.success;
    case 'failed':
      return theme.colors.status.danger;
    default:
      return theme.colors.text.muted;
  }
}

// ---------------------------------------------------------------------------
// Manual input section
// ---------------------------------------------------------------------------

export function buildManualSectionStyle(theme: WispTheme): CSSStyleObject {
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.md,
    width: '100%',
    paddingTop: theme.spacing.lg,
    borderTop: `1px solid ${theme.colors.border.subtle}`,
  };
}

// ---------------------------------------------------------------------------
// Error
// ---------------------------------------------------------------------------

export function buildPairingErrorStyle(theme: WispTheme): CSSStyleObject {
  return {
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.status.dangerSurface,
    color: theme.colors.status.danger,
    fontSize: 14,
    width: '100%',
    boxSizing: 'border-box',
    textAlign: 'center',
  };
}
