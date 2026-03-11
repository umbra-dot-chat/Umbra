/**
 * NotificationSettingsPanel -- Per-community/space/channel notification controls.
 *
 * @remarks
 * Composes Card-style container, tab bar, select, toggle, and text to provide
 * granular notification settings grouped by target type (community, space, channel).
 *
 * @module components/notification-settings-panel
 * @example
 * ```tsx
 * <NotificationSettingsPanel
 *   targets={targets}
 *   settings={settings}
 *   onSettingChange={(id, updates) => updateSetting(id, updates)}
 * />
 * ```
 */
import React, { forwardRef, useMemo, useState, useCallback } from 'react';
import type {
  NotificationSettingsPanelProps,
  NotificationTarget,
  NotificationSetting,
  NotificationLevel,
} from '@coexist/wisp-core/types/NotificationSettingsPanel.types';
import {
  resolveNotificationSettingsPanelColors,
  buildContainerStyle,
  buildHeaderStyle,
  buildTitleStyle,
  buildTabBarStyle,
  buildTabStyle,
  buildTargetRowStyle,
  buildTargetNameStyle,
  buildControlsRowStyle,
  buildControlGroupStyle,
  buildControlLabelStyle,
  buildTargetListStyle,
} from '@coexist/wisp-core/styles/NotificationSettingsPanel.styles';
import { useTheme } from '../../providers';
import { Button } from '../../primitives/button';
import { Toggle } from '../../primitives/toggle';

// ---------------------------------------------------------------------------
// Tab types
// ---------------------------------------------------------------------------

type TabKey = 'community' | 'space' | 'channel';

const TAB_LABELS: Record<TabKey, string> = {
  community: 'Communities',
  space: 'Spaces',
  channel: 'Channels',
};

// ---------------------------------------------------------------------------
// NotificationSettingsPanel
// ---------------------------------------------------------------------------

/**
 * NotificationSettingsPanel -- Grouped notification settings for communities,
 * spaces, and channels.
 *
 * @remarks
 * All settings are controlled externally via `settings` / `onSettingChange`.
 */
export const NotificationSettingsPanel = forwardRef<HTMLDivElement, NotificationSettingsPanelProps>(
  function NotificationSettingsPanel(
    {
      targets,
      settings,
      onSettingChange,
      title = 'Notification Settings',
      onClose,
      loading = false,
      skeleton = false,
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();
    const [activeTab, setActiveTab] = useState<TabKey>('community');

    // -----------------------------------------------------------------------
    // Colors
    // -----------------------------------------------------------------------
    const panelColors = useMemo(
      () => resolveNotificationSettingsPanelColors(theme),
      [theme],
    );

    // -----------------------------------------------------------------------
    // Styles
    // -----------------------------------------------------------------------
    const containerStyle = useMemo(
      () => buildContainerStyle(theme, panelColors),
      [theme, panelColors],
    );
    const headerStyle = useMemo(() => buildHeaderStyle(theme), [theme]);
    const titleStyle = useMemo(
      () => buildTitleStyle(theme, panelColors),
      [theme, panelColors],
    );
    const tabBarStyle = useMemo(() => buildTabBarStyle(theme), [theme]);
    const targetListStyle = useMemo(() => buildTargetListStyle(theme), [theme]);

    // -----------------------------------------------------------------------
    // Derived data
    // -----------------------------------------------------------------------
    const filteredTargets = useMemo(
      () => targets.filter((t) => t.type === activeTab),
      [targets, activeTab],
    );

    const getSettingFor = useCallback(
      (targetId: string): NotificationSetting => {
        return (
          settings.find((s) => s.targetId === targetId) ?? {
            targetId,
            level: 'all' as NotificationLevel,
            muteUntil: null,
            suppressEveryone: false,
            suppressRoles: false,
          }
        );
      },
      [settings],
    );

    // -----------------------------------------------------------------------
    // Handlers
    // -----------------------------------------------------------------------
    const handleSettingChange = useCallback(
      (targetId: string, updates: Partial<NotificationSetting>) => {
        onSettingChange?.(targetId, updates);
      },
      [onSettingChange],
    );

    // -----------------------------------------------------------------------
    // Render helpers
    // -----------------------------------------------------------------------
    const targetRowStyleMemo = useMemo(
      () => buildTargetRowStyle(theme, panelColors),
      [theme, panelColors],
    );
    const targetNameStyleMemo = useMemo(
      () => buildTargetNameStyle(theme, panelColors),
      [theme, panelColors],
    );
    const controlsRowStyleMemo = useMemo(
      () => buildControlsRowStyle(theme),
      [theme],
    );
    const controlGroupStyleMemo = useMemo(
      () => buildControlGroupStyle(theme),
      [theme],
    );
    const controlLabelStyleMemo = useMemo(
      () => buildControlLabelStyle(theme, panelColors),
      [theme, panelColors],
    );

    function renderTarget(target: NotificationTarget) {
      const setting = getSettingFor(target.id);

      return (
        <div key={target.id} style={targetRowStyleMemo as React.CSSProperties}>
          {/* Target name */}
          <div style={targetNameStyleMemo as React.CSSProperties}>
            {target.icon}
            <span>{target.name}</span>
          </div>

          {/* Controls row */}
          <div style={controlsRowStyleMemo as React.CSSProperties}>
            {/* Level selector */}
            <div style={controlGroupStyleMemo as React.CSSProperties}>
              <span style={controlLabelStyleMemo as React.CSSProperties}>Level</span>
              <select
                value={setting.level}
                onChange={(e) =>
                  handleSettingChange(target.id, {
                    level: e.target.value as NotificationLevel,
                  })
                }
                disabled={loading}
                style={{
                  padding: '4px 8px',
                  borderRadius: theme.radii.md,
                  border: `1px solid ${panelColors.border}`,
                  backgroundColor: theme.colors.background.sunken,
                  color: theme.colors.text.primary,
                  fontSize: theme.typography.sizes.xs.fontSize,
                } as React.CSSProperties}
                aria-label={`Notification level for ${target.name}`}
              >
                <option value="all">All</option>
                <option value="mentions">Mentions</option>
                <option value="none">None</option>
              </select>
            </div>

            {/* Suppress @everyone */}
            <div style={controlGroupStyleMemo as React.CSSProperties}>
              <Toggle
                checked={setting.suppressEveryone}
                onChange={(checked: boolean) =>
                  handleSettingChange(target.id, { suppressEveryone: checked })
                }
                disabled={loading}
                size="sm"
              />
              <span style={controlLabelStyleMemo as React.CSSProperties}>
                Suppress @everyone
              </span>
            </div>

            {/* Suppress @roles */}
            <div style={controlGroupStyleMemo as React.CSSProperties}>
              <Toggle
                checked={setting.suppressRoles}
                onChange={(checked: boolean) =>
                  handleSettingChange(target.id, { suppressRoles: checked })
                }
                disabled={loading}
                size="sm"
              />
              <span style={controlLabelStyleMemo as React.CSSProperties}>
                Suppress @roles
              </span>
            </div>
          </div>
        </div>
      );
    }

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------
    return (
      <div
        ref={ref}
        className={className}
        style={{ ...containerStyle, ...userStyle } as React.CSSProperties}
        {...rest}
      >
        {/* Header */}
        <div style={headerStyle as React.CSSProperties}>
          <h3 style={titleStyle as React.CSSProperties}>{title}</h3>
          {onClose && (
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
          )}
        </div>

        {/* Tabs */}
        <div style={tabBarStyle as React.CSSProperties} role="tablist">
          {(Object.keys(TAB_LABELS) as TabKey[]).map((tab) => (
            <button
              key={tab}
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              style={
                buildTabStyle(theme, panelColors, activeTab === tab) as React.CSSProperties
              }
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>

        {/* Target list */}
        <div style={targetListStyle as React.CSSProperties} role="tabpanel">
          {loading && (
            <p
              style={{
                color: panelColors.secondaryText,
                fontSize: theme.typography.sizes.sm.fontSize,
                textAlign: 'center',
                padding: theme.spacing.lg,
              } as React.CSSProperties}
            >
              Loading settings...
            </p>
          )}

          {!loading && filteredTargets.length === 0 && (
            <p
              style={{
                color: panelColors.secondaryText,
                fontSize: theme.typography.sizes.sm.fontSize,
                textAlign: 'center',
                padding: theme.spacing.lg,
              } as React.CSSProperties}
            >
              No {TAB_LABELS[activeTab].toLowerCase()} found.
            </p>
          )}

          {!loading && filteredTargets.map(renderTarget)}
        </div>
      </div>
    );
  },
);

NotificationSettingsPanel.displayName = 'NotificationSettingsPanel';
