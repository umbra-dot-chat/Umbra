/**
 * AutoModSettings -- Configuration panel for automated moderation rules.
 *
 * @remarks
 * Displays two sections: "Filter Rules" (a list of auto-mod rules with
 * type, pattern, action, enable toggle, and delete) and "Escalation
 * Thresholds" (warning count to action mappings).
 *
 * @module components/auto-mod-settings
 * @example
 * ```tsx
 * <AutoModSettings
 *   rules={rules}
 *   escalationThresholds={thresholds}
 *   onRuleToggle={(id, enabled) => toggle(id, enabled)}
 *   onRuleDelete={(id) => deleteRule(id)}
 * />
 * ```
 */
import React, { forwardRef, useMemo } from 'react';
import type { AutoModSettingsProps } from '@coexist/wisp-core/types/AutoModSettings.types';
import {
  resolveAutoModColors,
  buildContainerStyle,
  buildHeaderStyle,
  buildSectionHeaderStyle,
  buildRuleRowStyle,
  buildRuleNameStyle,
  buildSelectStyle,
  buildInputStyle,
  buildEnabledBadgeStyle,
  buildEscalationRowStyle,
  buildLabelStyle,
} from '@coexist/wisp-core/styles/AutoModSettings.styles';
import { useTheme } from '../../providers';

/**
 * AutoModSettings -- Configuration panel for automated moderation rules.
 */
export const AutoModSettings = forwardRef<HTMLDivElement, AutoModSettingsProps>(
  function AutoModSettings(
    {
      rules,
      escalationThresholds,
      onRuleCreate,
      onRuleUpdate,
      onRuleDelete,
      onRuleToggle,
      onEscalationUpdate,
      title = 'AutoMod Settings',
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
    const colors = useMemo(() => resolveAutoModColors(theme), [theme]);

    // -----------------------------------------------------------------------
    // Styles
    // -----------------------------------------------------------------------
    const containerSt = useMemo(
      () => buildContainerStyle(colors, theme, userStyle as Record<string, string | number | undefined> | undefined),
      [colors, theme, userStyle],
    );
    const headerSt = useMemo(() => buildHeaderStyle(colors, theme), [colors, theme]);
    const sectionHeaderSt = useMemo(() => buildSectionHeaderStyle(colors, theme), [colors, theme]);
    const ruleRowSt = useMemo(() => buildRuleRowStyle(colors, theme), [colors, theme]);
    const ruleNameSt = useMemo(() => buildRuleNameStyle(colors, theme), [colors, theme]);
    const selectSt = useMemo(() => buildSelectStyle(colors, theme), [colors, theme]);
    const inputSt = useMemo(() => buildInputStyle(colors, theme), [colors, theme]);
    const escalationRowSt = useMemo(() => buildEscalationRowStyle(colors, theme), [colors, theme]);
    const labelSt = useMemo(() => buildLabelStyle(colors, theme), [colors, theme]);

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

    const addButtonStyle = useMemo(
      () => ({
        margin: 0,
        padding: `0 ${theme.spacing.md}px`,
        border: 'none' as const,
        outline: 'none' as const,
        height: 30,
        borderRadius: theme.radii.md,
        backgroundColor: colors.accentBg,
        color: colors.accentText,
        fontSize: theme.typography.sizes.xs.fontSize,
        fontWeight: theme.typography.weights.semibold,
        cursor: 'pointer' as const,
        display: 'inline-flex' as const,
        alignItems: 'center' as const,
      }),
      [colors, theme],
    );

    const toggleStyle = useMemo(
      () => ({
        margin: 0,
        padding: `0 ${theme.spacing.xs}px`,
        border: 'none' as const,
        outline: 'none' as const,
        background: 'transparent',
        cursor: 'pointer' as const,
        height: 24,
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

        {/* Filter Rules section */}
        <div style={sectionHeaderSt}>
          <span>Filter Rules</span>
          {onRuleCreate && (
            <button type="button" style={addButtonStyle} onClick={onRuleCreate}>
              Add Rule
            </button>
          )}
        </div>

        {rules.length === 0 ? (
          <div
            style={{
              padding: `${theme.spacing.xl}px ${theme.spacing.lg}px`,
              textAlign: 'center',
              color: colors.textMuted,
              fontSize: theme.typography.sizes.sm.fontSize,
            }}
          >
            No rules configured.
          </div>
        ) : (
          rules.map((rule) => {
            const enabledBadgeSt = buildEnabledBadgeStyle(colors, theme, rule.enabled);
            return (
              <div key={rule.id} style={ruleRowSt} data-testid={`rule-${rule.id}`}>
                <span style={ruleNameSt}>{rule.name}</span>

                {/* Type select */}
                <select
                  style={selectSt}
                  value={rule.type}
                  onChange={(e) =>
                    onRuleUpdate?.(rule.id, { type: e.target.value as typeof rule.type })
                  }
                  aria-label={`Type for ${rule.name}`}
                >
                  <option value="keyword">Keyword</option>
                  <option value="spam">Spam</option>
                  <option value="link">Link</option>
                  <option value="caps">Caps</option>
                </select>

                {/* Pattern input */}
                {rule.type === 'keyword' && (
                  <input
                    style={inputSt}
                    type="text"
                    value={rule.pattern ?? ''}
                    placeholder="Pattern"
                    onChange={(e) => onRuleUpdate?.(rule.id, { pattern: e.target.value })}
                    aria-label={`Pattern for ${rule.name}`}
                  />
                )}

                {/* Action select */}
                <select
                  style={selectSt}
                  value={rule.action}
                  onChange={(e) =>
                    onRuleUpdate?.(rule.id, { action: e.target.value as typeof rule.action })
                  }
                  aria-label={`Action for ${rule.name}`}
                >
                  <option value="delete">Delete</option>
                  <option value="warn">Warn</option>
                  <option value="timeout">Timeout</option>
                </select>

                {/* Enable toggle */}
                <button
                  type="button"
                  style={toggleStyle}
                  onClick={() => onRuleToggle?.(rule.id, !rule.enabled)}
                  aria-label={`Toggle ${rule.name}`}
                >
                  <span style={enabledBadgeSt}>
                    {rule.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </button>

                {/* Delete */}
                {onRuleDelete && (
                  <button
                    type="button"
                    style={deleteButtonStyle}
                    onClick={() => onRuleDelete(rule.id)}
                    aria-label={`Delete ${rule.name}`}
                  >
                    Delete
                  </button>
                )}
              </div>
            );
          })
        )}

        {/* Escalation Thresholds section */}
        <div style={sectionHeaderSt}>
          <span>Escalation Thresholds</span>
        </div>

        {escalationThresholds.length === 0 ? (
          <div
            style={{
              padding: `${theme.spacing.xl}px ${theme.spacing.lg}px`,
              textAlign: 'center',
              color: colors.textMuted,
              fontSize: theme.typography.sizes.sm.fontSize,
            }}
          >
            No escalation thresholds configured.
          </div>
        ) : (
          escalationThresholds.map((threshold, idx) => (
            <div key={idx} style={escalationRowSt} data-testid={`escalation-${idx}`}>
              <span style={labelSt}>After</span>
              <span style={{ fontWeight: theme.typography.weights.semibold }}>
                {threshold.warningCount}
              </span>
              <span style={labelSt}>warnings</span>
              <span style={{ margin: `0 ${theme.spacing['2xs']}px`, color: colors.textMuted }}>
                {'\u2192'}
              </span>
              <span
                style={{
                  fontWeight: theme.typography.weights.semibold,
                  textTransform: 'capitalize',
                }}
              >
                {threshold.action}
              </span>
              {threshold.duration != null && (
                <span style={labelSt}>
                  ({threshold.duration >= 3600
                    ? `${Math.floor(threshold.duration / 3600)}h`
                    : `${Math.floor(threshold.duration / 60)}m`})
                </span>
              )}
            </div>
          ))
        )}
      </div>
    );
  },
);

AutoModSettings.displayName = 'AutoModSettings';
