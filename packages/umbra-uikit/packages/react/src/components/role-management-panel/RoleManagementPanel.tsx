/**
 * @module RoleManagementPanel
 * @description Admin panel for creating, editing, and managing community roles
 * with a permission grid. Split-panel layout: role list on the left, permission
 * editor on the right.
 *
 * Uses Wisp design system primitives (Input, Toggle, ColorSwatch, Button) and
 * tri-state permission toggles (Allow / Inherit / Deny).
 */
import React, { forwardRef, useMemo, useCallback, useState, useRef } from 'react';
import type {
  RoleManagementPanelProps,
  ManagedRole,
  RolePermissionCategory,
  RolePermissionItem,
} from '@coexist/wisp-core/types/RoleManagementPanel.types';
import {
  resolveRoleManagementPanelColors,
  buildContainerStyle,
  buildRoleSidebarStyle,
  buildSidebarHeaderStyle,
  buildRoleItemStyle,
  buildRoleColorDotStyle,
  buildRoleMemberCountStyle,
  buildMainPanelStyle,
  buildRoleHeaderStyle,
  buildSectionLabelStyle,
  buildToggleRowStyle,
  buildPermissionGridStyle,
  buildPermissionCategoryStyle,
  buildPermissionItemStyle,
  buildPermissionInfoStyle,
  buildPermissionLabelStyle,
  buildPermissionDescriptionStyle,
  buildEmptyStateStyle,
  buildFooterStyle,
  buildColorPickerGridStyle,
  buildColorPresetStyle,
  buildDragHandleStyle,
  buildDragIndicatorStyle,
} from '@coexist/wisp-core/styles/RoleManagementPanel.styles';
import {
  resolvePermissionManagerColors,
  buildPermissionToggleGroupStyle,
  buildPermissionToggleButtonStyle,
} from '@coexist/wisp-core/styles/PermissionManager.styles';
import { useTheme } from '../../providers';
import { Input } from '../../primitives/input';
import { Toggle } from '../../primitives/toggle';
import { ColorSwatch } from '../../primitives/color-swatch';
import { Button } from '../../primitives/button';

// ---------------------------------------------------------------------------
// Inline SVG icons
// ---------------------------------------------------------------------------

function PlusIcon({ size = 14, color }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? 'currentColor'}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function ChevronDownIcon({ size = 14, color }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? 'currentColor'}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function TrashIcon({ size = 14, color }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? 'currentColor'}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function GripVerticalIcon({ size = 14, color }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? 'currentColor'}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="9" cy="5" r="1" fill={color ?? 'currentColor'} stroke="none" />
      <circle cx="15" cy="5" r="1" fill={color ?? 'currentColor'} stroke="none" />
      <circle cx="9" cy="12" r="1" fill={color ?? 'currentColor'} stroke="none" />
      <circle cx="15" cy="12" r="1" fill={color ?? 'currentColor'} stroke="none" />
      <circle cx="9" cy="19" r="1" fill={color ?? 'currentColor'} stroke="none" />
      <circle cx="15" cy="19" r="1" fill={color ?? 'currentColor'} stroke="none" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Tri-state toggle icons (Allow / Deny / Inherit)
// ---------------------------------------------------------------------------

function CheckIcon({ size = 12, color }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? 'currentColor'}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function XIcon({ size = 12, color }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? 'currentColor'}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function SlashIcon({ size = 12, color }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? 'currentColor'}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="4" x2="6" y2="20" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Default color presets (Discord-style palette)
// ---------------------------------------------------------------------------

const DEFAULT_COLOR_PRESETS = [
  '#e74c3c', '#e91e63', '#9b59b6', '#673ab7',
  '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4',
  '#009688', '#4caf50', '#8bc34a', '#cddc39',
  '#ffeb3b', '#ffc107', '#ff9800', '#ff5722',
  '#795548', '#607d8b', '#95a5a6', '#1abc9c',
];

// ---------------------------------------------------------------------------
// RoleManagementPanel
// ---------------------------------------------------------------------------

/**
 * RoleManagementPanel -- Admin panel for managing community roles and permissions.
 *
 * @remarks
 * Renders a split-panel layout:
 * - Left sidebar: ordered list of roles with drag handles, color dots, names,
 *   and member counts. "Create Role" button at the bottom.
 * - Right panel (when a role is selected): name input, color picker with preset
 *   swatches, hoisted/mentionable toggles, and an accordion-based permission grid
 *   with tri-state toggles (Allow / Inherit / Deny). Delete button at the
 *   bottom (hidden for default roles).
 *
 * Uses Wisp Input, Toggle, ColorSwatch, and Button primitives. Permission
 * toggles reuse styles from the PermissionManager component.
 *
 * @example
 * ```tsx
 * <RoleManagementPanel
 *   roles={roles}
 *   permissionCategories={categories}
 *   selectedRoleId="role-1"
 *   onRoleSelect={(id) => setSelected(id)}
 *   onRoleUpdate={(id, updates) => updateRole(id, updates)}
 *   onRoleCreate={() => createRole()}
 *   onRoleDelete={(id) => deleteRole(id)}
 *   onPermissionToggle={(roleId, key, value) => togglePerm(roleId, key, value)}
 *   onRoleReorder={(roleId, newPos) => reorder(roleId, newPos)}
 * />
 * ```
 */
export const RoleManagementPanel = forwardRef<HTMLDivElement, RoleManagementPanelProps>(
  function RoleManagementPanel(
    {
      roles,
      permissionCategories,
      selectedRoleId,
      onRoleSelect,
      onRoleUpdate,
      onRoleCreate,
      onRoleDelete,
      onPermissionToggle,
      onRoleReorder,
      colorPresets,
      title = 'Roles',
      loading = false,
      skeleton = false,
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();

    // Track which permission categories are expanded
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(() => {
      return new Set(permissionCategories.map((c: RolePermissionCategory) => c.name));
    });

    // Drag-and-drop state
    const [draggedRoleId, setDraggedRoleId] = useState<string | null>(null);
    const [dragOverRoleId, setDragOverRoleId] = useState<string | null>(null);
    const dragCounter = useRef(0);

    const presets = colorPresets ?? DEFAULT_COLOR_PRESETS;

    const colors = useMemo(
      () => resolveRoleManagementPanelColors(theme),
      [theme],
    );

    // Sort roles by position
    const sortedRoles = useMemo(
      () => [...roles].sort((a: ManagedRole, b: ManagedRole) => a.position - b.position),
      [roles],
    );

    // Find selected role
    const selectedRole = useMemo(
      () => roles.find((r: ManagedRole) => r.id === selectedRoleId),
      [roles, selectedRoleId],
    );

    // -----------------------------------------------------------------------
    // Styles (all memoised)
    // -----------------------------------------------------------------------

    const containerStyle = useMemo(
      () => buildContainerStyle(theme, userStyle as any),
      [theme, userStyle],
    );

    const sidebarStyle = useMemo(
      () => buildRoleSidebarStyle(theme),
      [theme],
    );

    const sidebarHeaderStyle = useMemo(
      () => buildSidebarHeaderStyle(theme),
      [theme],
    );

    const mainPanelStyle = useMemo(
      () => buildMainPanelStyle(theme),
      [theme],
    );

    const roleHeaderStyle = useMemo(
      () => buildRoleHeaderStyle(theme),
      [theme],
    );

    const sectionLabelStyle = useMemo(
      () => buildSectionLabelStyle(theme),
      [theme],
    );

    const toggleRowStyle = useMemo(
      () => buildToggleRowStyle(theme),
      [theme],
    );

    const permissionGridStyle = useMemo(
      () => buildPermissionGridStyle(),
      [],
    );

    const memberCountStyle = useMemo(
      () => buildRoleMemberCountStyle(theme),
      [theme],
    );

    const emptyStateStyle = useMemo(
      () => buildEmptyStateStyle(theme),
      [theme],
    );

    const footerStyle = useMemo(
      () => buildFooterStyle(theme),
      [theme],
    );

    const permInfoStyle = useMemo(
      () => buildPermissionInfoStyle(theme),
      [theme],
    );

    const permLabelStyle = useMemo(
      () => buildPermissionLabelStyle(theme),
      [theme],
    );

    const permDescStyle = useMemo(
      () => buildPermissionDescriptionStyle(theme),
      [theme],
    );

    const colorPickerGridStyle = useMemo(
      () => buildColorPickerGridStyle(theme),
      [theme],
    );

    const dragHandleStyle = useMemo(
      () => buildDragHandleStyle(theme),
      [theme],
    );

    const dragIndicatorStyle = useMemo(
      () => buildDragIndicatorStyle(theme),
      [theme],
    );

    // Permission toggle colors & styles (reused from PermissionManager)
    const pmColors = useMemo(
      () => resolvePermissionManagerColors(theme),
      [theme],
    );

    const toggleGroupStyle = useMemo(
      () => buildPermissionToggleGroupStyle(theme),
      [theme],
    );

    // -----------------------------------------------------------------------
    // Handlers
    // -----------------------------------------------------------------------

    const handleRoleSelect = useCallback(
      (roleId: string) => {
        onRoleSelect?.(roleId);
      },
      [onRoleSelect],
    );

    const handleNameChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        if (selectedRoleId) {
          onRoleUpdate?.(selectedRoleId, { name: e.target.value });
        }
      },
      [selectedRoleId, onRoleUpdate],
    );

    const handleToggleCategory = useCallback(
      (categoryName: string) => {
        setExpandedCategories((prev) => {
          const next = new Set(prev);
          if (next.has(categoryName)) {
            next.delete(categoryName);
          } else {
            next.add(categoryName);
          }
          return next;
        });
      },
      [],
    );

    const handlePermissionToggle = useCallback(
      (permKey: string, value: boolean | null) => {
        if (selectedRoleId) {
          onPermissionToggle?.(selectedRoleId, permKey, value);
        }
      },
      [selectedRoleId, onPermissionToggle],
    );

    const handleHoistedToggle = useCallback(
      (val: boolean) => {
        if (selectedRoleId) {
          onRoleUpdate?.(selectedRoleId, { hoisted: val });
        }
      },
      [selectedRoleId, onRoleUpdate],
    );

    const handleMentionableToggle = useCallback(
      (val: boolean) => {
        if (selectedRoleId) {
          onRoleUpdate?.(selectedRoleId, { mentionable: val });
        }
      },
      [selectedRoleId, onRoleUpdate],
    );

    const handleColorChange = useCallback(
      (newColor: string) => {
        if (selectedRoleId) {
          onRoleUpdate?.(selectedRoleId, { color: newColor });
        }
      },
      [selectedRoleId, onRoleUpdate],
    );

    const handleDelete = useCallback(() => {
      if (selectedRoleId) {
        onRoleDelete?.(selectedRoleId);
      }
    }, [selectedRoleId, onRoleDelete]);

    // -----------------------------------------------------------------------
    // Drag-and-drop handlers
    // -----------------------------------------------------------------------

    const handleDragStart = useCallback(
      (e: React.DragEvent, roleId: string) => {
        setDraggedRoleId(roleId);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', roleId);
      },
      [],
    );

    const handleDragEnter = useCallback(
      (roleId: string) => {
        dragCounter.current++;
        setDragOverRoleId(roleId);
      },
      [],
    );

    const handleDragLeave = useCallback(() => {
      dragCounter.current--;
      if (dragCounter.current === 0) {
        setDragOverRoleId(null);
      }
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    }, []);

    const handleDrop = useCallback(
      (e: React.DragEvent, targetRoleId: string) => {
        e.preventDefault();
        dragCounter.current = 0;
        setDraggedRoleId(null);
        setDragOverRoleId(null);

        if (!draggedRoleId || draggedRoleId === targetRoleId) return;

        const targetRole = sortedRoles.find((r) => r.id === targetRoleId);
        if (targetRole && onRoleReorder) {
          onRoleReorder(draggedRoleId, targetRole.position);
        }
      },
      [draggedRoleId, sortedRoles, onRoleReorder],
    );

    const handleDragEnd = useCallback(() => {
      dragCounter.current = 0;
      setDraggedRoleId(null);
      setDragOverRoleId(null);
    }, []);

    // -----------------------------------------------------------------------
    // Skeleton
    // -----------------------------------------------------------------------

    if (skeleton) {
      return (
        <div
          ref={ref}
          className={className}
          style={containerStyle}
          aria-hidden="true"
          {...rest}
        >
          <div style={sidebarStyle}>
            <div style={sidebarHeaderStyle}>{title}</div>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 16px',
                }}
              >
                <span
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: colors.skeletonBlock,
                    animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite',
                  }}
                />
                <span
                  style={{
                    width: 80 + i * 20,
                    height: 14,
                    borderRadius: 4,
                    backgroundColor: colors.skeletonBlock,
                    animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite',
                  }}
                />
              </div>
            ))}
          </div>
          <div style={mainPanelStyle}>
            <div style={emptyStateStyle}>Select a role to edit</div>
          </div>
        </div>
      );
    }

    // -----------------------------------------------------------------------
    // Loading
    // -----------------------------------------------------------------------

    if (loading) {
      return (
        <div
          ref={ref}
          className={className}
          style={containerStyle}
          role="region"
          aria-label={title}
          aria-busy="true"
          {...rest}
        >
          <div style={sidebarStyle}>
            <div style={sidebarHeaderStyle}>{title}</div>
            <div style={emptyStateStyle}>Loading roles...</div>
          </div>
          <div style={mainPanelStyle}>
            <div style={emptyStateStyle}>Loading...</div>
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
        style={containerStyle}
        role="region"
        aria-label={title}
        {...rest}
      >
        {/* ---- Left sidebar: Role list ---- */}
        <div style={sidebarStyle} role="list" aria-label="Role list">
          <div style={sidebarHeaderStyle}>
            <span>{title}</span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
            {sortedRoles.map((role) => {
              const selected = role.id === selectedRoleId;
              const itemStyle = buildRoleItemStyle(theme, selected, role.color);
              const dotStyle = buildRoleColorDotStyle(role.color);
              const canDrag = !role.isDefault && !!onRoleReorder;
              const isDragOver = dragOverRoleId === role.id && draggedRoleId !== role.id;

              return (
                <React.Fragment key={role.id}>
                  {isDragOver && <div style={dragIndicatorStyle} />}
                  <button
                    type="button"
                    role="listitem"
                    style={{
                      ...itemStyle,
                      opacity: draggedRoleId === role.id ? 0.4 : 1,
                    }}
                    aria-selected={selected}
                    aria-label={`${role.name} role`}
                    onClick={() => handleRoleSelect(role.id)}
                    draggable={canDrag}
                    onDragStart={canDrag ? (e) => handleDragStart(e, role.id) : undefined}
                    onDragEnter={canDrag ? () => handleDragEnter(role.id) : undefined}
                    onDragLeave={canDrag ? handleDragLeave : undefined}
                    onDragOver={canDrag ? handleDragOver : undefined}
                    onDrop={canDrag ? (e) => handleDrop(e, role.id) : undefined}
                    onDragEnd={canDrag ? handleDragEnd : undefined}
                  >
                    {canDrag && (
                      <span style={dragHandleStyle} aria-hidden>
                        <GripVerticalIcon size={12} />
                      </span>
                    )}
                    <span style={dotStyle} aria-hidden />
                    <span
                      style={{
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {role.name}
                    </span>
                    <span style={memberCountStyle}>{role.memberCount}</span>
                  </button>
                </React.Fragment>
              );
            })}
          </div>

          {/* Create Role button */}
          {onRoleCreate && (
            <div style={{ padding: theme.spacing.sm, borderTop: `1px solid ${colors.sidebarBorder}` }}>
              <button
                type="button"
                onClick={onRoleCreate}
                aria-label="Create role"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  width: '100%',
                  padding: '6px 12px',
                  borderRadius: theme.radii.md,
                  border: `1px solid ${colors.sidebarBorder}`,
                  backgroundColor: 'transparent',
                  color: colors.sidebarText,
                  fontSize: theme.typography.sizes.sm.fontSize,
                  fontWeight: theme.typography.weights.medium,
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  boxSizing: 'border-box',
                }}
              >
                <PlusIcon size={14} color={colors.sidebarText} />
                Create Role
              </button>
            </div>
          )}
        </div>

        {/* ---- Right panel: Role editor ---- */}
        <div style={mainPanelStyle}>
          {selectedRole ? (
            <>
              {/* Role header: Name + Color + Toggles */}
              <div style={roleHeaderStyle}>
                {/* Name input */}
                <Input
                  value={selectedRole.name}
                  onChange={handleNameChange}
                  label="Role Name"
                  size="sm"
                  disabled={selectedRole.isDefault}
                  aria-label="Role name"
                />

                {/* Color picker */}
                <div>
                  <div style={sectionLabelStyle}>Role Color</div>
                  <div style={colorPickerGridStyle}>
                    {presets.map((preset) => {
                      const isSelected = selectedRole.color === preset;
                      const presetBtnStyle = buildColorPresetStyle(isSelected, theme);

                      return (
                        <button
                          key={preset}
                          type="button"
                          style={presetBtnStyle}
                          onClick={() => handleColorChange(preset)}
                          aria-label={`Set color ${preset}`}
                          aria-pressed={isSelected}
                        >
                          <ColorSwatch
                            color={preset}
                            size="sm"
                            shape="circle"
                            bordered={false}
                          />
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ marginTop: 4, color: colors.mutedText, fontSize: 12 }}>
                    {selectedRole.color}
                  </div>
                </div>

                {/* Hoisted toggle */}
                <div style={toggleRowStyle}>
                  <span style={{ color: colors.primaryText, fontSize: 14 }}>
                    Display role separately
                  </span>
                  <Toggle
                    checked={!!selectedRole.hoisted}
                    onChange={handleHoistedToggle}
                    size="sm"
                    aria-label="Display role separately"
                  />
                </div>

                {/* Mentionable toggle */}
                <div style={toggleRowStyle}>
                  <span style={{ color: colors.primaryText, fontSize: 14 }}>
                    Allow anyone to mention this role
                  </span>
                  <Toggle
                    checked={!!selectedRole.mentionable}
                    onChange={handleMentionableToggle}
                    size="sm"
                    aria-label="Allow mentioning"
                  />
                </div>
              </div>

              {/* Permissions section label */}
              <div
                style={{
                  ...sectionLabelStyle,
                  padding: `${theme.spacing.md}px ${theme.spacing.lg}px`,
                  paddingBottom: 0,
                }}
              >
                Permissions
              </div>

              {/* Permission grid */}
              <div style={permissionGridStyle}>
                {permissionCategories.map((category: RolePermissionCategory) => {
                  const isExpanded = expandedCategories.has(category.name);
                  const categoryHeaderStyle = buildPermissionCategoryStyle(theme);

                  return (
                    <div key={category.name}>
                      {/* Category header (accordion trigger) */}
                      <button
                        type="button"
                        style={categoryHeaderStyle}
                        onClick={() => handleToggleCategory(category.name)}
                        aria-expanded={isExpanded}
                        aria-label={`${category.name} permissions`}
                      >
                        <span>{category.name}</span>
                        <span
                          style={{
                            display: 'inline-flex',
                            transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                            transition: 'transform 150ms ease',
                          }}
                        >
                          <ChevronDownIcon size={14} />
                        </span>
                      </button>

                      {/* Permission items */}
                      {isExpanded && category.permissions.map((perm: RolePermissionItem) => {
                        const currentValue = selectedRole.permissions[perm.key] ?? null;
                        const itemStyle = buildPermissionItemStyle(theme, !!perm.dangerous);

                        const allowActive = currentValue === true;
                        const denyActive = currentValue === false;
                        const inheritActive = currentValue === null;

                        const allowBtnStyle = buildPermissionToggleButtonStyle(
                          allowActive, pmColors.toggleAllowBg, pmColors.toggleAllowIcon, pmColors, theme,
                        );
                        const inheritBtnStyle = buildPermissionToggleButtonStyle(
                          inheritActive, pmColors.toggleInheritBg, pmColors.toggleInheritIcon, pmColors, theme,
                        );
                        const denyBtnStyle = buildPermissionToggleButtonStyle(
                          denyActive, pmColors.toggleDenyBg, pmColors.toggleDenyIcon, pmColors, theme,
                        );

                        return (
                          <div key={perm.key} style={itemStyle}>
                            <div style={permInfoStyle}>
                              <span style={permLabelStyle}>{perm.label}</span>
                              {perm.description && (
                                <span style={permDescStyle}>{perm.description}</span>
                              )}
                            </div>
                            <div style={toggleGroupStyle} role="radiogroup" aria-label={`${perm.label} permission`}>
                              <button
                                type="button"
                                style={allowBtnStyle}
                                onClick={() => handlePermissionToggle(perm.key, true)}
                                aria-pressed={allowActive}
                                aria-label="Allow"
                              >
                                <CheckIcon size={12} />
                              </button>
                              <button
                                type="button"
                                style={inheritBtnStyle}
                                onClick={() => handlePermissionToggle(perm.key, null)}
                                aria-pressed={inheritActive}
                                aria-label="Inherit"
                              >
                                <SlashIcon size={12} />
                              </button>
                              <button
                                type="button"
                                style={denyBtnStyle}
                                onClick={() => handlePermissionToggle(perm.key, false)}
                                aria-pressed={denyActive}
                                aria-label="Deny"
                              >
                                <XIcon size={12} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>

              {/* Footer with delete button (not for default role) */}
              {!selectedRole.isDefault && onRoleDelete && (
                <div style={footerStyle}>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                    aria-label={`Delete ${selectedRole.name} role`}
                    iconLeft={<TrashIcon size={14} />}
                  >
                    Delete Role
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div style={emptyStateStyle}>
              Select a role to edit
            </div>
          )}
        </div>
      </div>
    );
  },
);

RoleManagementPanel.displayName = 'RoleManagementPanel';
