/**
 * WarningHistoryPanel -- Per-member panel showing their warning history.
 *
 * @remarks
 * Composes Card, Badge, Button, and ScrollArea-like layout to display
 * a scrollable list of warnings with metadata, active status, and
 * delete capabilities.
 *
 * @module components/warning-history-panel
 * @example
 * ```tsx
 * <WarningHistoryPanel
 *   memberName="JaneDoe"
 *   warnings={warnings}
 *   onDeleteWarning={(id) => deleteWarning(id)}
 * />
 * ```
 */
import React, { forwardRef, useMemo } from 'react';
import type { WarningHistoryPanelProps } from '@coexist/wisp-core/types/WarningHistoryPanel.types';
import {
  resolveWarningHistoryColors,
  buildContainerStyle,
  buildHeaderStyle,
  buildMemberInfoStyle,
  buildWarningCardStyle,
  buildWarningMetaStyle,
  buildReasonStyle,
  buildCountBadgeStyle,
  buildEmptyStyle,
} from '@coexist/wisp-core/styles/WarningHistoryPanel.styles';
import { useTheme } from '../../providers';

/**
 * WarningHistoryPanel -- Displays warning history for a specific member.
 */
export const WarningHistoryPanel = forwardRef<HTMLDivElement, WarningHistoryPanelProps>(
  function WarningHistoryPanel(
    {
      memberName,
      memberAvatar,
      warnings,
      onDeleteWarning,
      onClose,
      title = 'Warning History',
      loading = false,
      skeleton = false,
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();

    // -----------------------------------------------------------------------
    // Colors
    // -----------------------------------------------------------------------
    const colors = useMemo(() => resolveWarningHistoryColors(theme), [theme]);

    // -----------------------------------------------------------------------
    // Styles
    // -----------------------------------------------------------------------
    const containerStyle = useMemo(
      () => buildContainerStyle(colors, theme, userStyle as Record<string, string | number | undefined> | undefined),
      [colors, theme, userStyle],
    );
    const headerStyle = useMemo(() => buildHeaderStyle(colors, theme), [colors, theme]);
    const memberInfoSt = useMemo(() => buildMemberInfoStyle(colors, theme), [colors, theme]);
    const warningCardSt = useMemo(() => buildWarningCardStyle(colors, theme), [colors, theme]);
    const warningMetaSt = useMemo(() => buildWarningMetaStyle(colors, theme), [colors, theme]);
    const reasonSt = useMemo(() => buildReasonStyle(colors, theme), [colors, theme]);
    const countBadgeSt = useMemo(() => buildCountBadgeStyle(colors, theme), [colors, theme]);
    const emptySt = useMemo(() => buildEmptyStyle(colors, theme), [colors, theme]);

    const activeBadgeStyle = useMemo(
      () => ({
        display: 'inline-flex' as const,
        alignItems: 'center' as const,
        height: 20,
        padding: `0 ${theme.spacing.xs}px`,
        borderRadius: theme.radii.full,
        backgroundColor: colors.activeBadgeBg,
        color: colors.activeBadgeText,
        fontSize: theme.typography.sizes['2xs'].fontSize,
        fontWeight: theme.typography.weights.medium,
        lineHeight: 1,
      }),
      [colors, theme],
    );

    const expiredBadgeStyle = useMemo(
      () => ({
        display: 'inline-flex' as const,
        alignItems: 'center' as const,
        height: 20,
        padding: `0 ${theme.spacing.xs}px`,
        borderRadius: theme.radii.full,
        backgroundColor: colors.expiredBadgeBg,
        color: colors.expiredBadgeText,
        fontSize: theme.typography.sizes['2xs'].fontSize,
        fontWeight: theme.typography.weights.medium,
        lineHeight: 1,
      }),
      [colors, theme],
    );

    const deleteButtonStyle = useMemo(
      () => ({
        margin: 0,
        padding: `0 ${theme.spacing.xs}px`,
        border: 'none' as const,
        outline: 'none' as const,
        background: 'transparent',
        color: colors.deleteText,
        fontSize: theme.typography.sizes.xs.fontSize,
        fontWeight: theme.typography.weights.medium,
        cursor: 'pointer' as const,
        borderRadius: theme.radii.md,
        height: 24,
        display: 'inline-flex' as const,
        alignItems: 'center' as const,
      }),
      [colors, theme],
    );

    const closeButtonStyle = useMemo(
      () => ({
        margin: 0,
        padding: 0,
        border: 'none' as const,
        outline: 'none' as const,
        background: 'transparent',
        color: colors.textSecondary,
        cursor: 'pointer' as const,
        width: 28,
        height: 28,
        display: 'inline-flex' as const,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        borderRadius: theme.radii.md,
        fontSize: 16,
      }),
      [colors, theme],
    );

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------
    return (
      <div ref={ref} style={containerStyle} className={className} {...rest}>
        {/* Header */}
        <div style={headerStyle}>
          <span>{title}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
            <span style={countBadgeSt}>{warnings.length}</span>
            {onClose && (
              <button type="button" style={closeButtonStyle} onClick={onClose} aria-label="Close">
                {'\u2715'}
              </button>
            )}
          </div>
        </div>

        {/* Member info */}
        <div style={memberInfoSt}>
          {memberAvatar}
          <span>{memberName}</span>
        </div>

        {/* Warning list */}
        {warnings.length === 0 ? (
          <div style={emptySt}>No warnings on record.</div>
        ) : (
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {warnings.map((w) => (
              <div key={w.id} style={warningCardSt} data-testid={`warning-${w.id}`}>
                <p style={reasonSt}>{w.reason}</p>
                <div style={warningMetaSt}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: theme.spacing['2xs'] }}>
                    {w.issuedByAvatar}
                    <span>{w.issuedBy}</span>
                    <span style={{ color: colors.textMuted }}>{w.issuedAt}</span>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: theme.spacing['2xs'] }}>
                    {w.active !== false ? (
                      <span style={activeBadgeStyle}>Active</span>
                    ) : (
                      <span style={expiredBadgeStyle}>Expired</span>
                    )}
                    {w.expiresAt && (
                      <span style={{ color: colors.textMuted }}>Exp: {w.expiresAt}</span>
                    )}
                    {onDeleteWarning && (
                      <button
                        type="button"
                        style={deleteButtonStyle}
                        onClick={() => onDeleteWarning(w.id)}
                        aria-label={`Delete warning ${w.id}`}
                      >
                        Delete
                      </button>
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  },
);

WarningHistoryPanel.displayName = 'WarningHistoryPanel';
