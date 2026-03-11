/**
 * @module ChannelHeader
 * @description Header bar for active community channels showing name, topic, and actions.
 */
import React, { forwardRef, useMemo } from 'react';
import type {
  ChannelHeaderProps,
  ChannelHeaderType,
  ChannelHeaderAction,
} from '@coexist/wisp-core/types/ChannelHeader.types';
import {
  resolveChannelHeaderColors,
  buildChannelHeaderStyle,
  buildNameContainerStyle,
  buildNameStyle,
  buildTopicStyle,
  buildDividerStyle,
  buildActionsStyle,
  buildActionButtonStyle,
  buildIndicatorIconStyle,
  buildSkeletonNameStyle,
  buildSkeletonTopicStyle,
  buildSkeletonActionStyle,
} from '@coexist/wisp-core/styles/ChannelHeader.styles';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Inline SVG icons (following ChannelList pattern — no lucide dependency)
// ---------------------------------------------------------------------------

function HashIcon({ size = 18, color }: { size?: number; color?: string }) {
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
      <line x1="4" y1="9" x2="20" y2="9" />
      <line x1="4" y1="15" x2="20" y2="15" />
      <line x1="10" y1="3" x2="8" y2="21" />
      <line x1="16" y1="3" x2="14" y2="21" />
    </svg>
  );
}

function SpeakerIcon({ size = 18, color }: { size?: number; color?: string }) {
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
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}

function MegaphoneIcon({ size = 18, color }: { size?: number; color?: string }) {
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
      <path d="m3 11 18-5v12L3 13v-2z" />
      <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
    </svg>
  );
}

function FolderOpenIcon({ size = 18, color }: { size?: number; color?: string }) {
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
      <path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function ClipboardListIcon({ size = 18, color }: { size?: number; color?: string }) {
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
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M12 11h4" />
      <path d="M12 16h4" />
      <path d="M8 11h.01" />
      <path d="M8 16h.01" />
    </svg>
  );
}

function HeartIcon({ size = 18, color }: { size?: number; color?: string }) {
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
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

function MessageSquareIcon({ size = 18, color }: { size?: number; color?: string }) {
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
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function MessagesIcon({ size = 18, color }: { size?: number; color?: string }) {
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
      <path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2z" />
      <path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1" />
    </svg>
  );
}

function LockIcon({ size = 14, color }: { size?: number; color?: string }) {
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
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function ClockIcon({ size = 14, color }: { size?: number; color?: string }) {
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
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Channel type icon map
// ---------------------------------------------------------------------------

function ChannelTypeIcon({
  type,
  size,
  color,
}: {
  type: ChannelHeaderType;
  size?: number;
  color?: string;
}) {
  switch (type) {
    case 'voice':
      return <SpeakerIcon size={size} color={color} />;
    case 'announcement':
      return <MegaphoneIcon size={size} color={color} />;
    case 'files':
      return <FolderOpenIcon size={size} color={color} />;
    case 'bulletin':
      return <ClipboardListIcon size={size} color={color} />;
    case 'welcome':
      return <HeartIcon size={size} color={color} />;
    case 'thread':
      return <MessageSquareIcon size={size} color={color} />;
    case 'forum':
      return <MessagesIcon size={size} color={color} />;
    case 'text':
    default:
      return <HashIcon size={size} color={color} />;
  }
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function ChannelHeaderSkeleton({
  colors,
  theme,
}: {
  colors: ReturnType<typeof resolveChannelHeaderColors>;
  theme: Parameters<typeof buildSkeletonNameStyle>[1];
}) {
  const nameSkStyle = useMemo(
    () => buildSkeletonNameStyle(colors, theme),
    [colors, theme],
  );
  const topicSkStyle = useMemo(
    () => buildSkeletonTopicStyle(colors, theme),
    [colors, theme],
  );
  const actionSkStyle = useMemo(
    () => buildSkeletonActionStyle(colors, theme),
    [colors, theme],
  );
  const actionsContainerStyle = useMemo(
    () => buildActionsStyle(theme),
    [theme],
  );

  return (
    <>
      <div style={nameSkStyle} />
      <div style={topicSkStyle} />
      <div style={{ ...actionsContainerStyle, marginLeft: 'auto' }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={actionSkStyle} />
        ))}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// ChannelHeader
// ---------------------------------------------------------------------------

/**
 * ChannelHeader -- Header bar for an active channel.
 *
 * @remarks
 * Renders a horizontal bar with the channel type icon, name, optional
 * encrypted/slow-mode indicators, a topic description, and action buttons.
 *
 * @example
 * ```tsx
 * <ChannelHeader
 *   name="general"
 *   type="text"
 *   topic="General discussion for the team"
 *   actions={[
 *     { key: 'pin', label: 'Pinned Messages', icon: <PinIcon />, onClick: () => {} },
 *     { key: 'members', label: 'Member List', icon: <UsersIcon />, onClick: () => {}, active: true },
 *   ]}
 * />
 * ```
 */
export const ChannelHeader = forwardRef<HTMLDivElement, ChannelHeaderProps>(
  function ChannelHeader(
    {
      name,
      type = 'text',
      topic,
      actions,
      encrypted = false,
      slowMode = false,
      icon: customIcon,
      onTopicClick,
      skeleton = false,
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();

    // ----- Colors -----
    const colors = useMemo(
      () => resolveChannelHeaderColors(theme),
      [theme],
    );

    // ----- Styles -----
    const containerStyle = useMemo(
      () => buildChannelHeaderStyle(colors, theme),
      [colors, theme],
    );

    const nameContainerStyle = useMemo(
      () => buildNameContainerStyle(theme),
      [theme],
    );

    const nameStyle = useMemo(
      () => buildNameStyle(colors, theme),
      [colors, theme],
    );

    const topicStyle = useMemo(
      () => buildTopicStyle(colors, theme),
      [colors, theme],
    );

    const dividerStyle = useMemo(
      () => buildDividerStyle(colors, theme),
      [colors, theme],
    );

    const actionsContainerStyle = useMemo(
      () => buildActionsStyle(theme),
      [theme],
    );

    const indicatorStyle = useMemo(
      () => buildIndicatorIconStyle(colors),
      [colors],
    );

    // ----- Render -----
    return (
      <div
        ref={ref}
        role="banner"
        aria-label={`${name} channel header`}
        className={className}
        style={{ ...containerStyle, ...userStyle }}
        {...rest}
      >
        {skeleton ? (
          <ChannelHeaderSkeleton colors={colors} theme={theme} />
        ) : (
          <>
            {/* Name area: icon + name + indicators */}
            <div style={nameContainerStyle}>
              {/* Channel type icon */}
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  color: colors.iconColor,
                }}
              >
                {customIcon ?? (
                  <ChannelTypeIcon type={type} size={20} color={colors.iconColor} />
                )}
              </span>

              {/* Channel name */}
              <span style={nameStyle}>{name}</span>

              {/* Encrypted indicator */}
              {encrypted && (
                <span style={indicatorStyle} title="End-to-end encrypted">
                  <LockIcon size={14} color={colors.iconColor} />
                </span>
              )}

              {/* Slow mode indicator */}
              {slowMode && (
                <span style={indicatorStyle} title="Slow mode enabled">
                  <ClockIcon size={14} color={colors.iconColor} />
                </span>
              )}
            </div>

            {/* Topic */}
            {topic && (
              <>
                <div style={dividerStyle} />
                <span
                  style={topicStyle}
                  title={topic}
                  role="note"
                  onClick={onTopicClick}
                  onKeyDown={
                    onTopicClick
                      ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onTopicClick();
                          }
                        }
                      : undefined
                  }
                  tabIndex={onTopicClick ? 0 : undefined}
                >
                  {topic}
                </span>
              </>
            )}

            {/* Actions */}
            {actions && actions.length > 0 && (
              <div style={actionsContainerStyle}>
                {actions.map((action: ChannelHeaderAction) => (
                  <button
                    key={action.key}
                    type="button"
                    aria-label={action.label}
                    title={action.label}
                    disabled={action.disabled}
                    onClick={action.onClick}
                    style={buildActionButtonStyle(
                      colors,
                      action.active ?? false,
                      action.disabled ?? false,
                      theme,
                    )}
                  >
                    {action.icon}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    );
  },
);

ChannelHeader.displayName = 'ChannelHeader';
