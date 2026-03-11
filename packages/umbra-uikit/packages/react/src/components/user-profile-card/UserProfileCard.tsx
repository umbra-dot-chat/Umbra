/**
 * @module UserProfileCard
 * @description A popover or panel showing user profile details with actions.
 */
import React, { forwardRef, useMemo } from 'react';
import type { UserProfileCardProps } from '@coexist/wisp-core/types/UserProfileCard.types';
import {
  resolveUserProfileCardColors,
  buildUserProfileCardContainerStyle,
  buildBannerStyle,
  buildAvatarAreaStyle,
  buildAvatarWrapperStyle,
  buildStatusDotStyle,
  buildProfileInfoStyle,
  buildNameStyle,
  buildUsernameStyle,
  buildStatusTextStyle,
  buildBioStyle,
  buildRolesContainerStyle,
  buildRoleBadgeStyle,
  buildDividerStyle,
  buildActionsContainerStyle,
  buildActionButtonStyle,
  buildCloseButtonStyle,
  buildSkeletonContainerStyle,
} from '@coexist/wisp-core/styles/UserProfileCard.styles';
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

function MessageIcon({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function PhoneIcon({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Default Avatar
// ---------------------------------------------------------------------------

function DefaultAvatar({ name, bg }: { name: string; bg: string }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <div
      style={{
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: bg,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 16,
        fontWeight: 600,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton pulse keyframes
// ---------------------------------------------------------------------------

let skeletonKeyframesInjected = false;

function injectSkeletonKeyframes() {
  if (skeletonKeyframesInjected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.textContent = `@keyframes wisp-skeleton-pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 0.25; } }`;
  document.head.appendChild(style);
  skeletonKeyframesInjected = true;
}

// ---------------------------------------------------------------------------
// UserProfileCard
// ---------------------------------------------------------------------------

/**
 * UserProfileCard -- A popover or panel showing user profile details.
 *
 * @remarks
 * Displays a user's profile with avatar, status, bio, role badges, and
 * action buttons. Supports banner images/colors, skeleton loading, and
 * an optional close button.
 *
 * @example
 * ```tsx
 * <UserProfileCard
 *   name="Jane Doe"
 *   username="@janedoe"
 *   status="online"
 *   bio="Full-stack developer"
 *   roles={[{ id: 'admin', label: 'Admin', color: '#e74c3c' }]}
 *   actions={[
 *     { id: 'msg', label: 'Message', onClick: () => {} },
 *     { id: 'call', label: 'Call', onClick: () => {} },
 *   ]}
 *   onClose={() => setOpen(false)}
 * />
 * ```
 */
export const UserProfileCard = forwardRef<HTMLDivElement, UserProfileCardProps>(
  function UserProfileCard(
    {
      name,
      username,
      avatar,
      status = 'offline',
      statusText,
      bio,
      roles,
      actions,
      bannerUrl,
      bannerColor,
      skeleton = false,
      onClose,
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();

    const colors = useMemo(
      () => resolveUserProfileCardColors(theme),
      [theme],
    );

    // -- Skeleton state ------------------------------------------------------

    if (skeleton) {
      injectSkeletonKeyframes();
      const skeletonContainerStyle = buildSkeletonContainerStyle(theme);
      const skeletonBarBase: React.CSSProperties = {
        borderRadius: 4,
        backgroundColor: colors.divider,
        animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite',
      };

      return (
        <div
          ref={ref}
          aria-hidden
          className={className}
          style={{ ...skeletonContainerStyle, ...userStyle }}
          {...rest}
        >
          {/* Skeleton banner */}
          <div style={{ width: '100%', height: 60, backgroundColor: colors.divider, ...skeletonBarBase }} />
          {/* Skeleton avatar area */}
          <div style={{ padding: '0 16px', marginTop: -24, zIndex: 1, position: 'relative' }}>
            <div style={{ width: 48, height: 48, borderRadius: 24, ...skeletonBarBase }} />
          </div>
          {/* Skeleton info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '8px 16px' }}>
            <div style={{ width: '60%', height: 14, ...skeletonBarBase }} />
            <div style={{ width: '40%', height: 12, ...skeletonBarBase }} />
            <div style={{ width: '80%', height: 12, ...skeletonBarBase }} />
          </div>
          {/* Skeleton actions */}
          <div style={{ display: 'flex', gap: 8, padding: '8px 16px' }}>
            <div style={{ flex: 1, height: 32, ...skeletonBarBase }} />
            <div style={{ flex: 1, height: 32, ...skeletonBarBase }} />
          </div>
        </div>
      );
    }

    // -- Normal rendering ----------------------------------------------------

    const containerStyle = useMemo(
      () => buildUserProfileCardContainerStyle(colors, theme),
      [colors, theme],
    );

    const bannerStyle = useMemo(
      () => buildBannerStyle(colors, bannerUrl, bannerColor, theme),
      [colors, bannerUrl, bannerColor, theme],
    );

    const avatarAreaStyle = useMemo(
      () => buildAvatarAreaStyle(theme),
      [theme],
    );

    const avatarWrapperStyle = useMemo(
      () => buildAvatarWrapperStyle(colors, theme),
      [colors, theme],
    );

    const statusDotStyle = useMemo(
      () => buildStatusDotStyle(status, colors, theme),
      [status, colors, theme],
    );

    const profileInfoStyle = useMemo(
      () => buildProfileInfoStyle(theme),
      [theme],
    );

    const nameStyle = useMemo(
      () => buildNameStyle(colors, theme),
      [colors, theme],
    );

    const usernameStyle = useMemo(
      () => buildUsernameStyle(colors, theme),
      [colors, theme],
    );

    const statusTextStyle = useMemo(
      () => buildStatusTextStyle(colors, theme),
      [colors, theme],
    );

    const bioStyle = useMemo(
      () => buildBioStyle(colors, theme),
      [colors, theme],
    );

    const rolesContainerStyle = useMemo(
      () => buildRolesContainerStyle(theme),
      [theme],
    );

    const dividerStyle = useMemo(
      () => buildDividerStyle(colors),
      [colors],
    );

    const actionsContainerStyle = useMemo(
      () => buildActionsContainerStyle(colors, theme),
      [colors, theme],
    );

    const actionBtnStyle = useMemo(
      () => buildActionButtonStyle(colors, theme),
      [colors, theme],
    );

    const closeBtnStyle = useMemo(
      () => buildCloseButtonStyle(colors, theme),
      [colors, theme],
    );

    const statusLabel: Record<string, string> = {
      online: 'Online',
      idle: 'Idle',
      dnd: 'Do Not Disturb',
      offline: 'Offline',
    };

    return (
      <div
        ref={ref}
        role="complementary"
        aria-label={`${name} profile card`}
        className={className}
        style={{ ...containerStyle, ...userStyle }}
        {...rest}
      >
        {/* Close button */}
        {onClose && (
          <button
            type="button"
            aria-label="Close profile card"
            style={closeBtnStyle}
            onClick={onClose}
          >
            <CloseIcon size={16} />
          </button>
        )}

        {/* Banner */}
        <div style={bannerStyle} />

        {/* Avatar area */}
        <div style={avatarAreaStyle}>
          <div style={avatarWrapperStyle}>
            {avatar || <DefaultAvatar name={name} bg={colors.avatarBg} />}
            <div
              style={statusDotStyle}
              role="img"
              aria-label={statusLabel[status] ?? 'Offline'}
            />
          </div>
        </div>

        {/* Profile info */}
        <div style={profileInfoStyle}>
          <h3 style={nameStyle}>{name}</h3>
          {username && <p style={usernameStyle}>{username}</p>}
          {statusText && <p style={statusTextStyle}>{statusText}</p>}
        </div>

        {/* Bio */}
        {bio && (
          <>
            <hr style={dividerStyle} />
            <div style={{ padding: `0 ${theme.spacing.md}px`, boxSizing: 'border-box' as const }}>
              <p style={bioStyle}>{bio}</p>
            </div>
          </>
        )}

        {/* Roles */}
        {roles && roles.length > 0 && (
          <>
            <hr style={dividerStyle} />
            <div style={rolesContainerStyle}>
              {roles.map((role) => (
                <span
                  key={role.id}
                  style={buildRoleBadgeStyle(role.color, colors, theme)}
                >
                  {role.label}
                </span>
              ))}
            </div>
          </>
        )}

        {/* Actions */}
        {actions && actions.length > 0 && (
          <div style={actionsContainerStyle}>
            {actions.map((action) => (
              <button
                key={action.id}
                type="button"
                style={{
                  ...actionBtnStyle,
                  opacity: action.disabled ? 0.5 : 1,
                  cursor: action.disabled ? 'not-allowed' : 'pointer',
                }}
                onClick={action.disabled ? undefined : action.onClick}
                disabled={action.disabled}
                aria-label={action.label}
              >
                {action.icon}
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  },
);

UserProfileCard.displayName = 'UserProfileCard';
