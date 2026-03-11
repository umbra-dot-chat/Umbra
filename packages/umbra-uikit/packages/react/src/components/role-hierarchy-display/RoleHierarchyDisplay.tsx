/**
 * @module RoleHierarchyDisplay
 * @description A visual display of the role hierarchy in a community.
 *
 * Shows roles in order of authority (position) with drag handles for
 * reordering. Uses RoleBadge for display. Default roles are pinned to
 * the bottom and are not draggable.
 *
 * @example
 * ```tsx
 * <RoleHierarchyDisplay
 *   roles={[
 *     { id: '1', name: 'Admin', color: '#e74c3c', position: 0 },
 *     { id: '2', name: 'Moderator', color: '#3498db', position: 1 },
 *     { id: '3', name: '@everyone', color: '#95a5a6', position: 2, isDefault: true },
 *   ]}
 *   editable
 *   onReorder={(ids) => console.log('New order:', ids)}
 * />
 * ```
 */

import React, { forwardRef, useMemo, useState, useCallback } from 'react';
import type {
  RoleHierarchyDisplayProps,
  HierarchyRole,
} from '@coexist/wisp-core/types/RoleHierarchyDisplay.types';
import {
  buildContainerStyle,
  buildHeaderStyle,
  buildTitleStyle,
  buildDescriptionStyle,
  buildRoleRowStyle,
  buildDragHandleStyle,
  buildPositionBadgeStyle,
  buildMemberCountStyle,
  buildRoleListStyle,
  buildSkeletonRowStyle,
} from '@coexist/wisp-core/styles/RoleHierarchyDisplay.styles';
import { useTheme } from '../../providers';
import { RoleBadge } from '../role-badge';

// ---------------------------------------------------------------------------
// Inline SVG icons
// ---------------------------------------------------------------------------

function GripVerticalIcon({ size = 16, color }: { size?: number; color?: string }) {
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
      aria-hidden="true"
    >
      <circle cx="9" cy="5" r="1" fill={color ?? 'currentColor'} />
      <circle cx="9" cy="12" r="1" fill={color ?? 'currentColor'} />
      <circle cx="9" cy="19" r="1" fill={color ?? 'currentColor'} />
      <circle cx="15" cy="5" r="1" fill={color ?? 'currentColor'} />
      <circle cx="15" cy="12" r="1" fill={color ?? 'currentColor'} />
      <circle cx="15" cy="19" r="1" fill={color ?? 'currentColor'} />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// RoleHierarchyDisplay
// ---------------------------------------------------------------------------

/**
 * RoleHierarchyDisplay -- A vertical list of roles ordered by position.
 *
 * @remarks
 * Renders roles sorted by position (ascending: 0 = highest authority).
 * When `editable` is `true`, drag handles appear and rows can be
 * reordered via native HTML drag-and-drop. The default role (`isDefault`)
 * is always pinned at the bottom and cannot be dragged.
 */
export const RoleHierarchyDisplay = forwardRef<HTMLDivElement, RoleHierarchyDisplayProps>(
  function RoleHierarchyDisplay(
    {
      roles,
      onReorder,
      editable = false,
      onRoleClick,
      title = 'Role Hierarchy',
      description,
      loading = false,
      skeleton = false,
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();

    // -- Drag state --
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    // -- Sort roles by position (ascending: 0 = highest authority) --
    const sortedRoles = useMemo(() => {
      const sorted = [...roles].sort((a, b) => a.position - b.position);
      return sorted;
    }, [roles]);

    // Separate default roles (always at bottom) from draggable roles
    const { draggableRoles, defaultRoles } = useMemo(() => {
      const draggable: HierarchyRole[] = [];
      const defaults: HierarchyRole[] = [];
      for (const role of sortedRoles) {
        if (role.isDefault) {
          defaults.push(role);
        } else {
          draggable.push(role);
        }
      }
      return { draggableRoles: draggable, defaultRoles: defaults };
    }, [sortedRoles]);

    // -- Styles --
    const containerStyle = useMemo(
      () => ({ ...buildContainerStyle(theme), ...userStyle as any }),
      [theme, userStyle],
    );

    const headerStyle = useMemo(
      () => buildHeaderStyle(theme),
      [theme],
    );

    const titleStyle = useMemo(
      () => buildTitleStyle(theme),
      [theme],
    );

    const descriptionStyle = useMemo(
      () => buildDescriptionStyle(theme),
      [theme],
    );

    const dragHandleStyle = useMemo(
      () => buildDragHandleStyle(theme),
      [theme],
    );

    const positionBadgeStyle = useMemo(
      () => buildPositionBadgeStyle(theme),
      [theme],
    );

    const memberCountStyle = useMemo(
      () => buildMemberCountStyle(theme),
      [theme],
    );

    const roleListStyle = useMemo(
      () => buildRoleListStyle(theme),
      [theme],
    );

    const skeletonRowStyle = useMemo(
      () => buildSkeletonRowStyle(theme),
      [theme],
    );

    // -- Drag handlers --
    const handleDragStart = useCallback(
      (e: React.DragEvent<HTMLDivElement>, index: number) => {
        setDragIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(index));
      },
      [],
    );

    const handleDragOver = useCallback(
      (e: React.DragEvent<HTMLDivElement>, index: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverIndex(index);
      },
      [],
    );

    const handleDragLeave = useCallback(() => {
      setDragOverIndex(null);
    }, []);

    const handleDrop = useCallback(
      (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
        e.preventDefault();
        const fromIndex = dragIndex;
        setDragIndex(null);
        setDragOverIndex(null);

        if (fromIndex === null || fromIndex === dropIndex) return;

        const reordered = [...draggableRoles];
        const [moved] = reordered.splice(fromIndex, 1);
        reordered.splice(dropIndex, 0, moved);

        // Emit ordered IDs: draggable first, then default roles
        const orderedIds = [
          ...reordered.map((r) => r.id),
          ...defaultRoles.map((r) => r.id),
        ];
        onReorder?.(orderedIds);
      },
      [dragIndex, draggableRoles, defaultRoles, onReorder],
    );

    const handleDragEnd = useCallback(() => {
      setDragIndex(null);
      setDragOverIndex(null);
    }, []);

    const handleRoleClick = useCallback(
      (roleId: string) => {
        onRoleClick?.(roleId);
      },
      [onRoleClick],
    );

    // -- Skeleton render --
    if (skeleton) {
      return (
        <div ref={ref} className={className} style={containerStyle} {...rest}>
          <div style={headerStyle}>
            <div
              style={{
                width: 120,
                height: 16,
                borderRadius: 4,
                backgroundColor: theme.colors.border.subtle,
                animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite',
              }}
            />
          </div>
          <div style={roleListStyle}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={skeletonRowStyle} />
            ))}
          </div>
        </div>
      );
    }

    // -- Loading render --
    if (loading) {
      return (
        <div ref={ref} className={className} style={containerStyle} {...rest}>
          <div style={headerStyle}>
            {title && <p style={titleStyle}>{title}</p>}
          </div>
          <p
            style={{
              margin: 0,
              fontSize: 12,
              color: theme.colors.text.muted,
            }}
          >
            Loading roles...
          </p>
        </div>
      );
    }

    // -- Role row renderer --
    const renderRoleRow = (
      role: HierarchyRole,
      index: number,
      isDraggable: boolean,
    ) => {
      const isDragging = dragIndex === index && isDraggable;
      const isDragOver = dragOverIndex === index && isDraggable;
      const rowStyle = buildRoleRowStyle(theme, isDragging || isDragOver);

      return (
        <div
          key={role.id}
          style={rowStyle}
          draggable={editable && isDraggable}
          onDragStart={
            editable && isDraggable
              ? (e) => handleDragStart(e, index)
              : undefined
          }
          onDragOver={
            editable && isDraggable
              ? (e) => handleDragOver(e, index)
              : undefined
          }
          onDragLeave={editable && isDraggable ? handleDragLeave : undefined}
          onDrop={
            editable && isDraggable
              ? (e) => handleDrop(e, index)
              : undefined
          }
          onDragEnd={editable && isDraggable ? handleDragEnd : undefined}
          onClick={() => handleRoleClick(role.id)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleRoleClick(role.id);
            }
          }}
          aria-label={`Role: ${role.name}, position ${role.position}`}
          data-testid={`role-row-${role.id}`}
        >
          {/* Drag handle */}
          {editable && isDraggable && (
            <span style={dragHandleStyle} data-testid={`drag-handle-${role.id}`}>
              <GripVerticalIcon size={14} />
            </span>
          )}

          {/* Position badge */}
          <span style={positionBadgeStyle}>{role.position}</span>

          {/* Role badge */}
          <RoleBadge
            role={{ id: role.id, name: role.name, color: role.color, position: role.position }}
            size="sm"
          />

          {/* Member count */}
          {role.memberCount != null && (
            <span style={memberCountStyle}>
              {role.memberCount} {role.memberCount === 1 ? 'member' : 'members'}
            </span>
          )}
        </div>
      );
    };

    return (
      <div
        ref={ref}
        className={className}
        style={containerStyle}
        aria-label={title || 'Role Hierarchy'}
        {...rest}
      >
        {/* Header */}
        {(title || description) && (
          <div style={headerStyle}>
            {title && <p style={titleStyle}>{title}</p>}
            {description && <p style={descriptionStyle}>{description}</p>}
          </div>
        )}

        {/* Role list */}
        <div style={roleListStyle} data-testid="role-list">
          {draggableRoles.map((role, index) =>
            renderRoleRow(role, index, true),
          )}
          {defaultRoles.map((role, index) =>
            renderRoleRow(role, index, false),
          )}
        </div>
      </div>
    );
  },
);

RoleHierarchyDisplay.displayName = 'RoleHierarchyDisplay';
