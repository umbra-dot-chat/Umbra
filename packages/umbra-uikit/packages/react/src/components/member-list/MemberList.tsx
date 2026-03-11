/**
 * @module MemberList
 * @description Side panel showing grouped user lists with online/offline status.
 */
import React, { forwardRef, useMemo, useState, useCallback } from 'react';
import type {
  MemberListProps,
  MemberListMember,
  MemberListSection,
} from '@coexist/wisp-core/types/MemberList.types';
import {
  resolveMemberListColors,
  buildMemberListContainerStyle,
  buildMemberListHeaderStyle,
  buildMemberListTitleStyle,
  buildMemberListCloseStyle,
  buildMemberListBodyStyle,
  buildSectionHeaderStyle,
  buildSectionLabelStyle,
  buildMemberItemStyle,
  buildMemberNameStyle,
  buildMemberRoleTextStyle,
  buildMemberStatusDotStyle,
  buildMemberListLoadingStyle,
} from '@coexist/wisp-core/styles/MemberList.styles';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Inline SVG icons
// ---------------------------------------------------------------------------

function CloseIcon({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function ChevronIcon({ size = 12, color, collapsed }: { size?: number; color?: string; collapsed: boolean }) {
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
      style={{
        transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
        transition: 'transform 150ms ease-out',
        flexShrink: 0,
      }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Default Avatar
// ---------------------------------------------------------------------------

function DefaultAvatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#333',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 12,
        fontWeight: 600,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton keyframes injection
// ---------------------------------------------------------------------------

let skeletonKeyframesInjected = false;

function ensureSkeletonKeyframes() {
  if (skeletonKeyframesInjected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.textContent = `@keyframes wisp-skeleton-pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 0.25; } }`;
  document.head.appendChild(style);
  skeletonKeyframesInjected = true;
}

// ---------------------------------------------------------------------------
// Skeleton component
// ---------------------------------------------------------------------------

function MemberListSkeleton({
  colors,
  theme,
  userStyle,
  className,
}: {
  colors: ReturnType<typeof resolveMemberListColors>;
  theme: Parameters<typeof buildMemberListContainerStyle>[1];
  userStyle?: React.CSSProperties;
  className?: string;
}) {
  ensureSkeletonKeyframes();

  const containerStyle = useMemo(
    () => buildMemberListContainerStyle(colors, theme),
    [colors, theme],
  );

  const headerStyle = useMemo(
    () => buildMemberListHeaderStyle(colors, theme),
    [colors, theme],
  );

  const bodyStyle = useMemo(
    () => buildMemberListBodyStyle(theme),
    [theme],
  );

  const barBase: React.CSSProperties = {
    backgroundColor: colors.border,
    borderRadius: 4,
    animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite',
  };

  return (
    <div
      aria-hidden
      className={className}
      style={{ ...containerStyle, ...userStyle }}
    >
      {/* Skeleton header */}
      <div style={headerStyle}>
        <div style={{ ...barBase, width: 80, height: 14 }} />
        <div style={{ ...barBase, width: 28, height: 28, borderRadius: '50%' }} />
      </div>

      {/* Skeleton body */}
      <div style={bodyStyle}>
        {/* Skeleton section */}
        <div style={{ padding: `${theme.spacing.xs}px ${theme.spacing.md}px` }}>
          <div style={{ ...barBase, width: 100, height: 10 }} />
        </div>
        {Array.from({ length: 5 }, (_, i) => (
          <div
            key={`skeleton-member-${i}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.sm,
              padding: `${theme.spacing.xs}px ${theme.spacing.md}px`,
            }}
          >
            <div style={{ ...barBase, width: 32, height: 32, borderRadius: '50%' }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ ...barBase, width: `${60 + (i % 3) * 15}%`, height: 12 }} />
              <div style={{ ...barBase, width: `${40 + (i % 2) * 20}%`, height: 10 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MemberList
// ---------------------------------------------------------------------------

/**
 * MemberList -- Side panel showing grouped user lists with online/offline status.
 *
 * @remarks
 * Displays collapsible sections of members with avatars, status dots,
 * role text, and click interaction. Supports loading and skeleton states.
 *
 * @example
 * ```tsx
 * <MemberList
 *   sections={[
 *     { id: 'online', label: 'Online', members: [...] },
 *     { id: 'offline', label: 'Offline', members: [...], collapsed: true },
 *   ]}
 *   onMemberClick={(member) => openProfile(member.id)}
 *   onClose={() => setOpen(false)}
 * />
 * ```
 */
export const MemberList = forwardRef<HTMLDivElement, MemberListProps>(
  function MemberList(
    {
      sections,
      onMemberClick,
      title = 'Members',
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

    const colors = useMemo(
      () => resolveMemberListColors(theme),
      [theme],
    );

    // Track collapsed state per section, initialized from section.collapsed
    const [collapsedMap, setCollapsedMap] = useState<Record<string, boolean>>(() => {
      const initial: Record<string, boolean> = {};
      for (const section of sections) {
        initial[section.id] = section.collapsed ?? false;
      }
      return initial;
    });

    const toggleSection = useCallback((sectionId: string) => {
      setCollapsedMap((prev) => ({
        ...prev,
        [sectionId]: !prev[sectionId],
      }));
    }, []);

    const handleMemberClick = useCallback(
      (member: MemberListMember) => {
        onMemberClick?.(member);
      },
      [onMemberClick],
    );

    // -- Skeleton early return ------------------------------------------------

    if (skeleton) {
      return (
        <MemberListSkeleton
          colors={colors}
          theme={theme}
          userStyle={userStyle}
          className={className}
        />
      );
    }

    // -- Memoised styles ------------------------------------------------------

    const containerStyle = useMemo(
      () => buildMemberListContainerStyle(colors, theme),
      [colors, theme],
    );

    const headerStyle = useMemo(
      () => buildMemberListHeaderStyle(colors, theme),
      [colors, theme],
    );

    const titleStyle = useMemo(
      () => buildMemberListTitleStyle(colors, theme),
      [colors, theme],
    );

    const closeStyle = useMemo(
      () => buildMemberListCloseStyle(colors, theme),
      [colors, theme],
    );

    const bodyStyle = useMemo(
      () => buildMemberListBodyStyle(theme),
      [theme],
    );

    const sectionHeaderStyle = useMemo(
      () => buildSectionHeaderStyle(colors, theme),
      [colors, theme],
    );

    const sectionLabelStyle = useMemo(
      () => buildSectionLabelStyle(colors, theme),
      [colors, theme],
    );

    const memberItemStyle = useMemo(
      () => buildMemberItemStyle(colors, theme),
      [colors, theme],
    );

    const memberNameStyle = useMemo(
      () => buildMemberNameStyle(colors, theme),
      [colors, theme],
    );

    const memberRoleTextStyle = useMemo(
      () => buildMemberRoleTextStyle(colors, theme),
      [colors, theme],
    );

    const loadingStyle = useMemo(
      () => buildMemberListLoadingStyle(colors, theme),
      [colors, theme],
    );

    return (
      <div
        ref={ref}
        role="complementary"
        aria-label={title}
        className={className}
        style={{ ...containerStyle, ...userStyle }}
        {...rest}
      >
        {/* Header */}
        <div style={headerStyle}>
          <span style={titleStyle}>{title}</span>
          {onClose && (
            <button
              type="button"
              aria-label="Close member list"
              style={closeStyle}
              onClick={onClose}
            >
              <CloseIcon size={16} />
            </button>
          )}
        </div>

        {/* Body */}
        <div style={bodyStyle}>
          {/* Loading */}
          {loading && (
            <div style={loadingStyle}>Loading members…</div>
          )}

          {/* Sections */}
          {!loading &&
            sections.map((section) => {
              const isCollapsed = collapsedMap[section.id] ?? false;

              return (
                <div key={section.id} role="group" aria-label={section.label}>
                  {/* Section header */}
                  <button
                    type="button"
                    style={sectionHeaderStyle}
                    onClick={() => toggleSection(section.id)}
                    aria-expanded={!isCollapsed}
                  >
                    <ChevronIcon
                      size={12}
                      color={colors.sectionLabel}
                      collapsed={isCollapsed}
                    />
                    <span style={sectionLabelStyle}>
                      {section.label} ({section.members.length})
                    </span>
                  </button>

                  {/* Member items */}
                  {!isCollapsed &&
                    section.members.map((member) => {
                      const statusDotStyle = buildMemberStatusDotStyle(
                        member.status,
                        colors,
                        theme,
                      );

                      return (
                        <button
                          key={member.id}
                          type="button"
                          style={memberItemStyle}
                          onClick={() => handleMemberClick(member)}
                          aria-label={`${member.name}${member.status ? `, ${member.status}` : ''}`}
                        >
                          {/* Avatar */}
                          <div style={{ position: 'relative', flexShrink: 0 }}>
                            {member.avatar || <DefaultAvatar name={member.name} />}
                            {/* Status dot */}
                            {member.status && (
                              <div
                                style={{
                                  ...statusDotStyle,
                                  position: 'absolute',
                                  bottom: -1,
                                  right: -1,
                                  border: `2px solid ${colors.bg}`,
                                  width: 10,
                                  height: 10,
                                  boxSizing: 'border-box',
                                }}
                              />
                            )}
                          </div>

                          {/* Text */}
                          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              {member.roleIcon && (
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: 14,
                                    height: 14,
                                    flexShrink: 0,
                                  }}
                                  aria-hidden
                                >
                                  {member.roleIcon}
                                </span>
                              )}
                              <span style={member.roleColor ? { ...memberNameStyle, color: member.roleColor } : memberNameStyle}>{member.name}</span>
                            </span>
                            {(member.roleText || member.statusText) && (
                              <span style={memberRoleTextStyle}>
                                {member.roleText || member.statusText}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                </div>
              );
            })}
        </div>
      </div>
    );
  },
);

MemberList.displayName = 'MemberList';
