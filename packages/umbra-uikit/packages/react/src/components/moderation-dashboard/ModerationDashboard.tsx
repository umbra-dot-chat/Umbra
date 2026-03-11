/**
 * ModerationDashboard -- Overview dashboard with moderation statistics
 * and recent activity.
 *
 * @remarks
 * Displays a stat-card grid at the top, then tabs for "Recent Actions"
 * (scrollable list of action rows) and "Ban Evasion" (alert cards with
 * confidence badges and investigate/dismiss buttons).
 *
 * @module components/moderation-dashboard
 * @example
 * ```tsx
 * <ModerationDashboard
 *   stats={stats}
 *   recentActions={actions}
 *   banEvasionAlerts={alerts}
 *   onActionClick={(id) => viewAction(id)}
 * />
 * ```
 */
import React, { forwardRef, useMemo, useState } from 'react';
import type { ModerationDashboardProps } from '@coexist/wisp-core/types/ModerationDashboard.types';
import {
  resolveModerationDashboardColors,
  buildContainerStyle,
  buildHeaderStyle,
  buildStatsGridStyle,
  buildStatCardStyle,
  buildStatLabelStyle,
  buildStatValueStyle,
  buildStatChangeStyle,
  buildTabBarStyle,
  buildTabStyle,
  buildActionRowStyle,
  buildTypeBadgeStyle,
  buildAlertCardStyle,
  buildConfidenceBadgeStyle,
  buildActionInfoStyle,
  buildActionTextStyle,
  buildTimestampStyle,
} from '@coexist/wisp-core/styles/ModerationDashboard.styles';
import { useTheme } from '../../providers';

/**
 * ModerationDashboard -- Overview dashboard for moderation stats and activity.
 */
export const ModerationDashboard = forwardRef<HTMLDivElement, ModerationDashboardProps>(
  function ModerationDashboard(
    {
      stats,
      recentActions,
      banEvasionAlerts = [],
      onActionClick,
      onAlertDismiss,
      onAlertInvestigate,
      title = 'Moderation',
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
    // State
    // -----------------------------------------------------------------------
    const [activeTab, setActiveTab] = useState<'actions' | 'evasion'>('actions');

    // -----------------------------------------------------------------------
    // Colors
    // -----------------------------------------------------------------------
    const colors = useMemo(() => resolveModerationDashboardColors(theme), [theme]);

    // -----------------------------------------------------------------------
    // Styles
    // -----------------------------------------------------------------------
    const containerSt = useMemo(
      () => buildContainerStyle(colors, theme, userStyle as Record<string, string | number | undefined> | undefined),
      [colors, theme, userStyle],
    );
    const headerSt = useMemo(() => buildHeaderStyle(colors, theme), [colors, theme]);
    const statsGridSt = useMemo(() => buildStatsGridStyle(theme), [theme]);
    const statCardSt = useMemo(() => buildStatCardStyle(colors, theme), [colors, theme]);
    const statLabelSt = useMemo(() => buildStatLabelStyle(colors, theme), [colors, theme]);
    const statValueSt = useMemo(() => buildStatValueStyle(colors, theme), [colors, theme]);
    const tabBarSt = useMemo(() => buildTabBarStyle(colors, theme), [colors, theme]);
    const actionRowSt = useMemo(() => buildActionRowStyle(colors, theme), [colors, theme]);
    const actionInfoSt = useMemo(() => buildActionInfoStyle(colors, theme), [colors, theme]);
    const actionTextSt = useMemo(() => buildActionTextStyle(colors, theme), [colors, theme]);
    const timestampSt = useMemo(() => buildTimestampStyle(colors, theme), [colors, theme]);
    const alertCardSt = useMemo(() => buildAlertCardStyle(colors, theme), [colors, theme]);

    const actionsTabSt = useMemo(
      () => buildTabStyle(colors, theme, activeTab === 'actions'),
      [colors, theme, activeTab],
    );
    const evasionTabSt = useMemo(
      () => buildTabStyle(colors, theme, activeTab === 'evasion'),
      [colors, theme, activeTab],
    );

    const alertButtonStyle = useMemo(
      () => ({
        margin: 0,
        padding: `0 ${theme.spacing.sm}px`,
        border: 'none' as const,
        outline: 'none' as const,
        height: 26,
        borderRadius: theme.radii.md,
        fontSize: theme.typography.sizes.xs.fontSize,
        fontWeight: theme.typography.weights.medium,
        cursor: 'pointer' as const,
        display: 'inline-flex' as const,
        alignItems: 'center' as const,
      }),
      [theme],
    );

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------
    return (
      <div ref={ref} style={containerSt} className={className} {...rest}>
        {/* Header */}
        <div style={headerSt}>
          <span>{title}</span>
        </div>

        {/* Stats grid */}
        <div style={statsGridSt}>
          {stats.map((stat, idx) => {
            const changeSt = stat.change != null
              ? buildStatChangeStyle(colors, theme, stat.change >= 0)
              : undefined;
            return (
              <div key={idx} style={statCardSt}>
                <span style={statLabelSt}>{stat.label}</span>
                <span style={statValueSt}>{stat.value}</span>
                {stat.change != null && changeSt && (
                  <span style={changeSt}>
                    {stat.change >= 0 ? '+' : ''}{stat.change}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Tab bar */}
        <div style={tabBarSt}>
          <button type="button" style={actionsTabSt} onClick={() => setActiveTab('actions')}>
            Recent Actions
          </button>
          <button type="button" style={evasionTabSt} onClick={() => setActiveTab('evasion')}>
            Ban Evasion {banEvasionAlerts.length > 0 ? `(${banEvasionAlerts.length})` : ''}
          </button>
        </div>

        {/* Tab content */}
        {activeTab === 'actions' && (
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {recentActions.length === 0 ? (
              <div
                style={{
                  padding: `${theme.spacing.xl}px ${theme.spacing.lg}px`,
                  textAlign: 'center',
                  color: colors.textMuted,
                  fontSize: theme.typography.sizes.sm.fontSize,
                }}
              >
                No recent actions.
              </div>
            ) : (
              recentActions.map((action) => {
                const typeBadgeSt = buildTypeBadgeStyle(colors, theme, action.type);
                return (
                  <div
                    key={action.id}
                    style={actionRowSt}
                    data-testid={`action-${action.id}`}
                    onClick={() => onActionClick?.(action.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') onActionClick?.(action.id);
                    }}
                  >
                    <span style={typeBadgeSt}>{action.type}</span>
                    <div style={actionInfoSt}>
                      <span style={actionTextSt}>
                        {action.actorAvatar}
                        <strong>{action.actorName}</strong>
                        {' \u2192 '}
                        {action.targetAvatar}
                        <strong>{action.targetName}</strong>
                      </span>
                      {action.reason && (
                        <span style={{ ...actionTextSt, color: colors.textSecondary }}>
                          {action.reason}
                        </span>
                      )}
                    </div>
                    <span style={timestampSt}>{action.timestamp}</span>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'evasion' && (
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {banEvasionAlerts.length === 0 ? (
              <div
                style={{
                  padding: `${theme.spacing.xl}px ${theme.spacing.lg}px`,
                  textAlign: 'center',
                  color: colors.textMuted,
                  fontSize: theme.typography.sizes.sm.fontSize,
                }}
              >
                No ban evasion alerts.
              </div>
            ) : (
              banEvasionAlerts.map((alert) => {
                const confBadgeSt = buildConfidenceBadgeStyle(colors, theme, alert.confidence);
                return (
                  <div key={alert.id} style={alertCardSt} data-testid={`alert-${alert.id}`}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                      {alert.suspectedMemberAvatar}
                      <span style={{ fontWeight: theme.typography.weights.semibold, color: colors.textPrimary }}>
                        {alert.suspectedMemberName}
                      </span>
                      <span style={confBadgeSt}>{alert.confidence}</span>
                    </div>
                    <div style={{ fontSize: theme.typography.sizes.xs.fontSize, color: colors.textSecondary }}>
                      Matches banned user: <strong>{alert.matchedBanName}</strong>
                      {' \u2022 '}
                      {alert.matchType === 'device_fingerprint' ? 'Device Fingerprint' : 'IP Pattern'}
                      {' \u2022 '}
                      {alert.timestamp}
                    </div>
                    <div style={{ display: 'flex', gap: theme.spacing.xs, marginTop: theme.spacing.xs }}>
                      {onAlertInvestigate && (
                        <button
                          type="button"
                          style={{ ...alertButtonStyle, backgroundColor: colors.tabActiveBg, color: colors.textPrimary }}
                          onClick={() => onAlertInvestigate(alert.id)}
                        >
                          Investigate
                        </button>
                      )}
                      {onAlertDismiss && (
                        <button
                          type="button"
                          style={{ ...alertButtonStyle, backgroundColor: 'transparent', color: colors.textSecondary }}
                          onClick={() => onAlertDismiss(alert.id)}
                        >
                          Dismiss
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    );
  },
);

ModerationDashboard.displayName = 'ModerationDashboard';
