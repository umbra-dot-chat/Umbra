/**
 * ChannelPermissionEditor -- Per-channel permission override editor for
 * roles/members.
 *
 * @remarks
 * Composes a two-column layout: a sidebar listing roles/members (with add/remove
 * actions) and a main panel showing permissions grouped by category. Each
 * permission has a tri-state Allow/Deny/Inherit segmented control. Dangerous
 * permissions are visually highlighted.
 *
 * @module components/channel-permission-editor
 * @example
 * ```tsx
 * <ChannelPermissionEditor
 *   channelName="#general"
 *   targets={targets}
 *   selectedTargetId="role-1"
 *   onTargetSelect={(id) => setSelectedTarget(id)}
 *   permissions={permissions}
 *   onPermissionChange={(tid, key, val) => updatePerm(tid, key, val)}
 *   onSave={() => save()}
 * />
 * ```
 */
import React, { forwardRef, useMemo, useCallback } from 'react';
import type {
  ChannelPermissionEditorProps,
  PermissionOverride,
  OverrideValue,
} from '@coexist/wisp-core/types/ChannelPermissionEditor.types';
import {
  resolveChannelPermissionEditorColors,
  buildContainerStyle,
  buildHeaderStyle,
  buildTitleStyle,
  buildSubtitleStyle,
  buildLayoutStyle,
  buildTargetListStyle,
  buildTargetItemStyle,
  buildAddTargetStyle,
  buildPermMainStyle,
  buildCategoryHeaderStyle,
  buildPermRowStyle,
  buildPermLabelBlockStyle,
  buildPermLabelStyle,
  buildPermDescStyle,
  buildSegmentedWrapperStyle,
  buildSegmentStyle,
  buildFooterStyle,
} from '@coexist/wisp-core/styles/ChannelPermissionEditor.styles';
import { useTheme } from '../../providers';
import { Button } from '../../primitives/button';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function groupByCategory(permissions: PermissionOverride[]): Record<string, PermissionOverride[]> {
  const groups: Record<string, PermissionOverride[]> = {};
  for (const perm of permissions) {
    if (!groups[perm.category]) groups[perm.category] = [];
    groups[perm.category].push(perm);
  }
  return groups;
}

// ---------------------------------------------------------------------------
// ChannelPermissionEditor
// ---------------------------------------------------------------------------

/**
 * ChannelPermissionEditor -- Two-column editor with target sidebar and
 * permission list grouped by category.
 *
 * @remarks
 * All state is controlled externally. The component only renders UI and
 * invokes callbacks on user interaction.
 */
export const ChannelPermissionEditor = forwardRef<HTMLDivElement, ChannelPermissionEditorProps>(
  function ChannelPermissionEditor(
    {
      channelName,
      targets,
      selectedTargetId,
      onTargetSelect,
      onAddTarget,
      onRemoveTarget,
      permissions,
      onPermissionChange,
      onSave,
      onReset,
      saving = false,
      title = 'Channel Permissions',
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
    const edColors = useMemo(
      () => resolveChannelPermissionEditorColors(theme),
      [theme],
    );

    // -----------------------------------------------------------------------
    // Styles
    // -----------------------------------------------------------------------
    const containerStyle = useMemo(
      () => buildContainerStyle(theme, edColors),
      [theme, edColors],
    );
    const headerStyle = useMemo(() => buildHeaderStyle(theme), [theme]);
    const titleStyle = useMemo(
      () => buildTitleStyle(theme, edColors),
      [theme, edColors],
    );
    const subtitleStyle = useMemo(
      () => buildSubtitleStyle(theme, edColors),
      [theme, edColors],
    );
    const layoutStyle = useMemo(() => buildLayoutStyle(theme), [theme]);
    const targetListStyle = useMemo(
      () => buildTargetListStyle(theme, edColors),
      [theme, edColors],
    );
    const addTargetStyle = useMemo(
      () => buildAddTargetStyle(theme, edColors),
      [theme, edColors],
    );
    const permMainStyle = useMemo(() => buildPermMainStyle(), []);
    const categoryHeaderStyle = useMemo(
      () => buildCategoryHeaderStyle(theme, edColors),
      [theme, edColors],
    );
    const segmentedWrapperStyle = useMemo(
      () => buildSegmentedWrapperStyle(theme),
      [theme],
    );
    const footerStyle = useMemo(() => buildFooterStyle(theme), [theme]);

    // -----------------------------------------------------------------------
    // Derived
    // -----------------------------------------------------------------------
    const grouped = useMemo(() => groupByCategory(permissions), [permissions]);

    // -----------------------------------------------------------------------
    // Handlers
    // -----------------------------------------------------------------------
    const handlePermChange = useCallback(
      (permKey: string, value: OverrideValue) => {
        if (selectedTargetId && onPermissionChange) {
          onPermissionChange(selectedTargetId, permKey, value);
        }
      },
      [selectedTargetId, onPermissionChange],
    );

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
        <div>
          <div style={headerStyle as React.CSSProperties}>
            <h3 style={titleStyle as React.CSSProperties}>{title}</h3>
          </div>
          <p style={subtitleStyle as React.CSSProperties}>{channelName}</p>
        </div>

        {/* Two-column layout */}
        <div style={layoutStyle as React.CSSProperties}>
          {/* Left: target list */}
          <div style={targetListStyle as React.CSSProperties}>
            {targets.map((target) => {
              const isActive = target.id === selectedTargetId;
              return (
                <div
                  key={target.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  } as React.CSSProperties}
                >
                  <button
                    type="button"
                    onClick={() => onTargetSelect?.(target.id)}
                    style={
                      buildTargetItemStyle(theme, edColors, isActive) as React.CSSProperties
                    }
                    aria-pressed={isActive}
                  >
                    {target.avatar}
                    <span
                      style={{
                        color: target.color ?? edColors.targetItemText,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      } as React.CSSProperties}
                    >
                      {target.name}
                    </span>
                    <span
                      style={{
                        fontSize: theme.typography.sizes['2xs'].fontSize,
                        color: edColors.secondaryText,
                        marginLeft: 'auto',
                      } as React.CSSProperties}
                    >
                      {target.type === 'role' ? 'Role' : 'Member'}
                    </span>
                  </button>
                  {onRemoveTarget && (
                    <button
                      type="button"
                      onClick={() => onRemoveTarget(target.id)}
                      aria-label={`Remove ${target.name}`}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: edColors.dangerText,
                        cursor: 'pointer',
                        fontSize: 14,
                        padding: 2,
                        lineHeight: 1,
                      } as React.CSSProperties}
                    >
                      x
                    </button>
                  )}
                </div>
              );
            })}

            {onAddTarget && (
              <button
                type="button"
                onClick={onAddTarget}
                style={addTargetStyle as React.CSSProperties}
              >
                + Add
              </button>
            )}
          </div>

          {/* Right: permission list */}
          <div style={permMainStyle as React.CSSProperties}>
            {!selectedTargetId && (
              <p
                style={{
                  color: edColors.secondaryText,
                  fontSize: theme.typography.sizes.sm.fontSize,
                  textAlign: 'center',
                  padding: theme.spacing.xl,
                } as React.CSSProperties}
              >
                Select a role or member to edit permissions.
              </p>
            )}

            {selectedTargetId &&
              Object.entries(grouped).map(([category, perms]) => (
                <div key={category}>
                  <p style={categoryHeaderStyle as React.CSSProperties}>{category}</p>
                  {perms.map((perm) => {
                    const isDangerous = perm.dangerous ?? false;
                    return (
                      <div
                        key={perm.key}
                        style={
                          buildPermRowStyle(theme, edColors, isDangerous) as React.CSSProperties
                        }
                      >
                        {/* Label */}
                        <div style={buildPermLabelBlockStyle() as React.CSSProperties}>
                          <p
                            style={
                              buildPermLabelStyle(theme, edColors, isDangerous) as React.CSSProperties
                            }
                          >
                            {perm.label}
                          </p>
                          {perm.description && (
                            <p
                              style={
                                buildPermDescStyle(theme, edColors) as React.CSSProperties
                              }
                            >
                              {perm.description}
                            </p>
                          )}
                        </div>

                        {/* Segmented control */}
                        <div
                          style={segmentedWrapperStyle as React.CSSProperties}
                          role="radiogroup"
                          aria-label={`${perm.label} permission`}
                        >
                          {(['allow', 'deny', 'inherit'] as OverrideValue[]).map((seg) => (
                            <button
                              key={seg}
                              type="button"
                              role="radio"
                              aria-checked={perm.value === seg}
                              onClick={() => handlePermChange(perm.key, seg)}
                              disabled={saving}
                              style={
                                buildSegmentStyle(
                                  theme,
                                  edColors,
                                  seg as 'allow' | 'deny' | 'inherit',
                                  perm.value === seg,
                                ) as React.CSSProperties
                              }
                            >
                              {seg.charAt(0).toUpperCase() + seg.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
          </div>
        </div>

        {/* Footer */}
        <div style={footerStyle as React.CSSProperties}>
          {onReset && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onReset}
              disabled={saving}
            >
              Reset
            </Button>
          )}
          {onSave && (
            <Button
              variant="primary"
              size="sm"
              onClick={onSave}
              disabled={saving}
              isLoading={saving}
            >
              Save
            </Button>
          )}
        </div>
      </div>
    );
  },
);

ChannelPermissionEditor.displayName = 'ChannelPermissionEditor';
