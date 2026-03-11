/**
 * @module PermissionManager
 * @description Grouped permission list with tri-state toggles (allow/deny/inherit).
 */
import React, { forwardRef, useMemo, useCallback } from 'react';
import type {
  PermissionManagerProps,
  Permission,
  PermissionCategory,
  permissionCategories,
} from '@coexist/wisp-core/types/PermissionManager.types';
import {
  resolvePermissionManagerColors,
  buildPermissionManagerContainerStyle,
  buildPermissionCategoryHeaderStyle,
  buildPermissionRowStyle,
  buildPermissionNameStyle,
  buildPermissionDescStyle,
  buildPermissionInfoColumnStyle,
  buildPermissionToggleGroupStyle,
  buildPermissionToggleButtonStyle,
  buildPermissionDividerStyle,
} from '@coexist/wisp-core/styles/PermissionManager.styles';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Inline SVG icons for toggle states
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
// Category label helpers
// ---------------------------------------------------------------------------

const categoryLabels: Record<PermissionCategory, string> = {
  general: 'General',
  text: 'Text',
  voice: 'Voice',
  management: 'Management',
};

/** Default ordering when no categories prop is provided. */
const defaultCategoryOrder: PermissionCategory[] = [
  'general',
  'text',
  'voice',
  'management',
];

// ---------------------------------------------------------------------------
// PermissionManager
// ---------------------------------------------------------------------------

/**
 * PermissionManager -- A categorized list of permissions with tri-state toggles.
 *
 * @remarks
 * Renders permissions grouped by category with Allow / Deny / Inherit toggle
 * buttons. Dangerous permissions are highlighted with a tinted background.
 * Supports read-only mode and category filtering.
 *
 * @example
 * ```tsx
 * <PermissionManager
 *   permissions={allPermissions}
 *   state={rolePermissions}
 *   onChange={(permId, value) => updatePermission(permId, value)}
 * />
 * ```
 */
export const PermissionManager = forwardRef<HTMLDivElement, PermissionManagerProps>(
  function PermissionManager(
    {
      permissions,
      state,
      onChange,
      categories,
      readOnly = false,
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();

    const colors = useMemo(
      () => resolvePermissionManagerColors(theme),
      [theme],
    );

    const containerStyle = useMemo(
      () => buildPermissionManagerContainerStyle(colors, theme, userStyle as any),
      [colors, theme, userStyle],
    );

    const categoryHeaderStyle = useMemo(
      () => buildPermissionCategoryHeaderStyle(colors, theme),
      [colors, theme],
    );

    const toggleGroupStyle = useMemo(
      () => buildPermissionToggleGroupStyle(theme),
      [theme],
    );

    const infoColumnStyle = useMemo(
      () => buildPermissionInfoColumnStyle(theme),
      [theme],
    );

    const dividerStyle = useMemo(
      () => buildPermissionDividerStyle(colors),
      [colors],
    );

    // Group permissions by category
    const grouped = useMemo(() => {
      const map = new Map<PermissionCategory, Permission[]>();
      for (const perm of permissions) {
        const list = map.get(perm.category) ?? [];
        list.push(perm);
        map.set(perm.category, list);
      }
      return map;
    }, [permissions]);

    // Determine visible categories in order
    const visibleCategories = useMemo(() => {
      const order = categories ?? defaultCategoryOrder;
      return order.filter((cat) => grouped.has(cat));
    }, [categories, grouped]);

    const handleToggle = useCallback(
      (permissionId: string, value: boolean | null) => {
        if (!readOnly) {
          onChange(permissionId, value);
        }
      },
      [onChange, readOnly],
    );

    return (
      <div
        ref={ref}
        className={className}
        style={containerStyle}
        role="region"
        aria-label="Permission manager"
        {...rest}
      >
        {visibleCategories.map((category, catIndex) => {
          const perms = grouped.get(category) ?? [];

          return (
            <div key={category}>
              {/* Category header */}
              <div style={categoryHeaderStyle}>
                {categoryLabels[category]}
              </div>

              {/* Permission rows */}
              {perms.map((perm) => {
                const currentValue = state[perm.id] ?? null;
                const rowStyle = buildPermissionRowStyle(colors, !!perm.dangerous, theme);
                const nameStyle = buildPermissionNameStyle(colors, theme);
                const descStyle = buildPermissionDescStyle(colors, theme);

                const allowActive = currentValue === true;
                const denyActive = currentValue === false;
                const inheritActive = currentValue === null;

                const allowBtnStyle = buildPermissionToggleButtonStyle(
                  allowActive,
                  colors.toggleAllowBg,
                  colors.toggleAllowIcon,
                  colors,
                  theme,
                );
                const denyBtnStyle = buildPermissionToggleButtonStyle(
                  denyActive,
                  colors.toggleDenyBg,
                  colors.toggleDenyIcon,
                  colors,
                  theme,
                );
                const inheritBtnStyle = buildPermissionToggleButtonStyle(
                  inheritActive,
                  colors.toggleInheritBg,
                  colors.toggleInheritIcon,
                  colors,
                  theme,
                );

                return (
                  <div key={perm.id} style={rowStyle}>
                    {/* Info column */}
                    <div style={infoColumnStyle}>
                      <span style={nameStyle}>{perm.name}</span>
                      <span style={descStyle}>{perm.description}</span>
                    </div>

                    {/* Toggle group */}
                    <div style={toggleGroupStyle} role="radiogroup" aria-label={`${perm.name} permission`}>
                      <button
                        type="button"
                        style={allowBtnStyle}
                        onClick={() => handleToggle(perm.id, true)}
                        aria-pressed={allowActive}
                        aria-label="Allow"
                        disabled={readOnly}
                      >
                        <CheckIcon size={12} />
                      </button>
                      <button
                        type="button"
                        style={denyBtnStyle}
                        onClick={() => handleToggle(perm.id, false)}
                        aria-pressed={denyActive}
                        aria-label="Deny"
                        disabled={readOnly}
                      >
                        <XIcon size={12} />
                      </button>
                      <button
                        type="button"
                        style={inheritBtnStyle}
                        onClick={() => handleToggle(perm.id, null)}
                        aria-pressed={inheritActive}
                        aria-label="Inherit"
                        disabled={readOnly}
                      >
                        <SlashIcon size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Divider between categories (not after the last) */}
              {catIndex < visibleCategories.length - 1 && (
                <hr style={dividerStyle} aria-hidden />
              )}
            </div>
          );
        })}
      </div>
    );
  },
);

PermissionManager.displayName = 'PermissionManager';
