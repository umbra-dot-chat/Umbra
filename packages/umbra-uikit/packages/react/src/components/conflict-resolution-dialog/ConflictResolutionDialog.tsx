/**
 * @module ConflictResolutionDialog
 */
import React, { forwardRef, useMemo, useState } from 'react';
import type { ConflictResolutionDialogProps } from '@coexist/wisp-core/types/ConflictResolutionDialog.types';
import {
  buildConflictDialogBodyStyle,
  buildConflictDialogWarningStyle,
  buildConflictDialogCompareStyle,
  buildConflictDialogVersionCardStyle,
  buildConflictDialogVersionTitleStyle,
  buildConflictDialogVersionMetaStyle,
  buildConflictDialogFooterStyle,
} from '@coexist/wisp-core/styles/ConflictResolutionDialog.styles';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

// ---------------------------------------------------------------------------
// ConflictResolutionDialog
// ---------------------------------------------------------------------------

/**
 * ConflictResolutionDialog — modal content for resolving file sync conflicts.
 *
 * @remarks
 * This component renders the body content meant to be placed inside a Dialog/Sheet.
 * It does NOT render its own modal wrapper.
 *
 * @example
 * ```tsx
 * <Dialog open={conflictOpen} onClose={onClose}>
 *   <ConflictResolutionDialog
 *     open={conflictOpen}
 *     filename="report.pdf"
 *     localVersion={{ modifiedAt: '...', modifiedBy: 'Alice', size: 1024 }}
 *     remoteVersion={{ modifiedAt: '...', modifiedBy: 'Bob', size: 2048 }}
 *     onKeepLocal={keepLocal}
 *     onKeepRemote={keepRemote}
 *     onKeepBoth={keepBoth}
 *   />
 * </Dialog>
 * ```
 */
export const ConflictResolutionDialog = forwardRef<HTMLDivElement, ConflictResolutionDialogProps>(
  function ConflictResolutionDialog(
    {
      open,
      filename,
      localVersion,
      remoteVersion,
      onKeepLocal,
      onKeepRemote,
      onKeepBoth,
      onClose,
      skeleton = false,
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();
    const [selected, setSelected] = useState<'local' | 'remote' | null>(null);

    const bodyStyle = useMemo(() => buildConflictDialogBodyStyle(theme), [theme]);
    const warningStyle = useMemo(() => buildConflictDialogWarningStyle(theme), [theme]);
    const compareStyle = useMemo(() => buildConflictDialogCompareStyle(theme), [theme]);
    const localCardStyle = useMemo(() => buildConflictDialogVersionCardStyle(theme, selected === 'local'), [theme, selected]);
    const remoteCardStyle = useMemo(() => buildConflictDialogVersionCardStyle(theme, selected === 'remote'), [theme, selected]);
    const versionTitleStyle = useMemo(() => buildConflictDialogVersionTitleStyle(theme), [theme]);
    const versionMetaStyle = useMemo(() => buildConflictDialogVersionMetaStyle(theme), [theme]);
    const footerStyle = useMemo(() => buildConflictDialogFooterStyle(theme), [theme]);

    if (!open) return null;

    const buttonBase = {
      border: 'none',
      borderRadius: theme.radii.md,
      padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
      fontSize: theme.typography.sizes.sm.fontSize,
      fontWeight: theme.typography.weights.medium as number,
      cursor: 'pointer',
    };

    return (
      <div ref={ref} className={className} style={{ ...bodyStyle, ...userStyle }} data-testid="conflict-resolution-dialog" {...rest}>
        {/* Warning */}
        <div style={warningStyle}>
          {'\u26A0'} Conflict detected for <strong>{filename}</strong>
        </div>

        {/* Comparison */}
        <div style={compareStyle}>
          <div
            style={localCardStyle}
            onClick={() => setSelected('local')}
            role="button"
            tabIndex={0}
            aria-label="Local version"
          >
            <div style={versionTitleStyle}>Local</div>
            <div style={versionMetaStyle}>
              <span>Modified: {formatDate(localVersion.modifiedAt)}</span>
              <span>By: {localVersion.modifiedBy}</span>
              <span>Size: {formatSize(localVersion.size)}</span>
            </div>
          </div>
          <div
            style={remoteCardStyle}
            onClick={() => setSelected('remote')}
            role="button"
            tabIndex={0}
            aria-label="Remote version"
          >
            <div style={versionTitleStyle}>Remote</div>
            <div style={versionMetaStyle}>
              <span>Modified: {formatDate(remoteVersion.modifiedAt)}</span>
              <span>By: {remoteVersion.modifiedBy}</span>
              <span>Size: {formatSize(remoteVersion.size)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={footerStyle}>
          <button type="button" onClick={onKeepBoth} style={{ ...buttonBase, backgroundColor: 'transparent', color: theme.colors.text.secondary, border: `1px solid ${theme.colors.border.subtle}` }}>
            Keep Both
          </button>
          <button type="button" onClick={onKeepLocal} style={{ ...buttonBase, backgroundColor: theme.colors.accent.primary, color: theme.colors.text.onAccent }}>
            Keep Local
          </button>
          <button type="button" onClick={onKeepRemote} style={{ ...buttonBase, backgroundColor: theme.colors.accent.primary, color: theme.colors.text.onAccent }}>
            Keep Remote
          </button>
        </div>
      </div>
    );
  },
);

ConflictResolutionDialog.displayName = 'ConflictResolutionDialog';
