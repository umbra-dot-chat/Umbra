/**
 * PermissionCalculator -- Read-only display of effective computed permissions.
 *
 * @remarks
 * Shows the effective permissions for a user in a specific channel,
 * grouped by category using Accordion. Each permission displays a
 * granted/denied icon and source badge.
 *
 * @module components/permission-calculator
 * @example
 * ```tsx
 * <PermissionCalculator
 *   userName="Alice"
 *   channelName="#general"
 *   permissions={computedPermissions}
 * />
 * ```
 */
import React, { forwardRef, useMemo } from 'react';
import type {
  PermissionCalculatorProps,
  ComputedPermission,
} from '@coexist/wisp-core/types/PermissionCalculator.types';
import {
  buildContainerStyle,
  buildHeaderStyle,
  buildHeaderTitleStyle,
  buildPermissionListStyle,
  buildPermissionRowStyle,
  buildPermissionRowLeftStyle,
  buildPermissionRowRightStyle,
  buildGrantedIconStyle,
  buildDeniedIconStyle,
  buildSourceBadgeStyle,
} from '@coexist/wisp-core/styles/PermissionCalculator.styles';
import { useTheme } from '../../providers';
import { Card } from '../../layouts/card';
import { Text } from '../../primitives/text';
import { Badge } from '../../primitives/badge';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../accordion';
import { Separator } from '../../layouts/separator';
import { Check, X } from 'lucide-react';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Group permissions by category name. */
function groupByCategory(permissions: ComputedPermission[]): Record<string, ComputedPermission[]> {
  const groups: Record<string, ComputedPermission[]> = {};
  for (const perm of permissions) {
    if (!groups[perm.category]) groups[perm.category] = [];
    groups[perm.category].push(perm);
  }
  return groups;
}

/** Resolve human-readable source label. */
function resolveSourceLabel(perm: ComputedPermission): string {
  switch (perm.source) {
    case 'role':
      return perm.sourceName ?? 'Role';
    case 'channel-override':
      return perm.sourceName ?? 'Channel Override';
    case 'administrator':
      return 'Administrator';
    case 'owner':
      return 'Owner';
    default:
      return perm.source;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * PermissionCalculator -- Displays effective computed permissions.
 *
 * @remarks
 * Read-only component. Groups permissions by category and shows
 * granted/denied status with source badges.
 */
export const PermissionCalculator = forwardRef<HTMLDivElement, PermissionCalculatorProps>(
  function PermissionCalculator(
    {
      userName,
      userAvatar,
      channelName,
      permissions,
      title = 'Effective Permissions',
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

    // -----------------------------------------------------------------------
    // Styles
    // -----------------------------------------------------------------------
    const containerStyle = useMemo(() => buildContainerStyle(theme), [theme]);
    const headerStyle = useMemo(() => buildHeaderStyle(theme), [theme]);
    const headerTitleStyle = useMemo(() => buildHeaderTitleStyle(theme), [theme]);
    const permissionListStyle = useMemo(() => buildPermissionListStyle(theme), [theme]);
    const grantedIconStyle = useMemo(() => buildGrantedIconStyle(theme), [theme]);
    const deniedIconStyle = useMemo(() => buildDeniedIconStyle(theme), [theme]);
    const sourceBadgeStyle = useMemo(() => buildSourceBadgeStyle(theme), [theme]);

    // Group permissions
    const groups = useMemo(() => groupByCategory(permissions), [permissions]);
    const categoryNames = useMemo(() => Object.keys(groups), [groups]);

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------
    return (
      <div ref={ref} {...rest}>
      <Card
        style={{ ...containerStyle, ...userStyle } as React.CSSProperties}
        className={className}
        padding="md"
      >
        {/* Title row */}
        <div style={headerTitleStyle}>
          <Text size="lg" weight="semibold">
            {title}
          </Text>
          {onClose && (
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: theme.colors.text.secondary,
                padding: 4,
              }}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* User + channel header */}
        <div style={headerStyle}>
          {userAvatar}
          <Text size="sm" weight="medium">
            {userName}
          </Text>
          <Text size="sm" color="secondary">
            in
          </Text>
          <Badge size="sm" variant="default">
            {channelName}
          </Badge>
        </div>

        <Separator spacing="sm" />

        {/* Loading state */}
        {loading && (
          <Text size="sm" color="secondary">
            Calculating permissions...
          </Text>
        )}

        {/* Permission categories */}
        {!loading && (
          <Accordion type="multiple" defaultValue={categoryNames}>
            {categoryNames.map((categoryName) => (
              <AccordionItem key={categoryName} value={categoryName}>
                <AccordionTrigger>
                  {categoryName}
                  <Badge size="sm" variant="default" style={{ marginLeft: 8 }}>
                    {groups[categoryName].filter((p) => p.granted).length}/
                    {groups[categoryName].length}
                  </Badge>
                </AccordionTrigger>
                <AccordionContent>
                  <div style={permissionListStyle}>
                    {groups[categoryName].map((perm) => {
                      const rowStyle = buildPermissionRowStyle(theme, perm.granted);
                      const leftStyle = buildPermissionRowLeftStyle(theme);
                      const rightStyle = buildPermissionRowRightStyle(theme);

                      return (
                        <div key={perm.key} style={rowStyle}>
                          <div style={leftStyle}>
                            {perm.granted ? (
                              <Check size={16} style={grantedIconStyle} />
                            ) : (
                              <X size={16} style={deniedIconStyle} />
                            )}
                            <Text size="sm">{perm.label}</Text>
                          </div>
                          <div style={rightStyle}>
                            <span style={sourceBadgeStyle}>
                              {resolveSourceLabel(perm)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </Card>
      </div>
    );
  },
);

PermissionCalculator.displayName = 'PermissionCalculator';
