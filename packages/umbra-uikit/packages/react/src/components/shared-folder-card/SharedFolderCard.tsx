/**
 * @module SharedFolderCard
 */
import React, { forwardRef, useMemo, useState } from 'react';
import type { SharedFolderCardProps } from '@coexist/wisp-core/types/SharedFolderCard.types';
import {
  buildSharedFolderCardStyle,
  buildSharedFolderCardHeaderStyle,
  buildSharedFolderCardIconStyle,
  buildSharedFolderCardNameStyle,
  buildSharedFolderCardSyncRingStyle,
  buildSharedFolderCardMetaStyle,
  buildSharedFolderCardAvatarRowStyle,
  buildSharedFolderCardAvatarStyle,
  buildSharedFolderCardSkeletonStyle,
} from '@coexist/wisp-core/styles/SharedFolderCard.styles';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// SharedFolderCard
// ---------------------------------------------------------------------------

/**
 * SharedFolderCard — a folder card with sync ring and shared-with avatars.
 *
 * @example
 * ```tsx
 * <SharedFolderCard
 *   name="Design Assets"
 *   sharedWith={[{ did: '1', name: 'Alice' }]}
 *   fileCount={24}
 *   syncProgress={80}
 *   syncStatus="syncing"
 * />
 * ```
 */
export const SharedFolderCard = forwardRef<HTMLDivElement, SharedFolderCardProps>(
  function SharedFolderCard(
    {
      name,
      sharedWith,
      fileCount,
      lastSyncAt,
      syncProgress,
      syncStatus,
      onClick,
      onSync,
      skeleton = false,
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();
    const [hovered, setHovered] = useState(false);

    const cardStyle = useMemo(() => buildSharedFolderCardStyle(theme, hovered), [theme, hovered]);
    const headerStyle = useMemo(() => buildSharedFolderCardHeaderStyle(theme), [theme]);
    const iconStyle = useMemo(() => buildSharedFolderCardIconStyle(theme), [theme]);
    const nameStyle = useMemo(() => buildSharedFolderCardNameStyle(theme), [theme]);
    const syncRingStyle = useMemo(() => buildSharedFolderCardSyncRingStyle(theme), [theme]);
    const metaStyle = useMemo(() => buildSharedFolderCardMetaStyle(theme), [theme]);
    const avatarRowStyle = useMemo(() => buildSharedFolderCardAvatarRowStyle(theme), [theme]);
    const skeletonStyle = useMemo(() => buildSharedFolderCardSkeletonStyle(theme), [theme]);

    if (skeleton) {
      return (
        <div ref={ref} className={className} style={{ ...skeletonStyle, ...userStyle }} data-testid="shared-folder-card-skeleton" {...rest} />
      );
    }

    const statusColorMap: Record<string, string> = {
      synced: theme.colors.status.success,
      syncing: theme.colors.accent.primary,
      offline: theme.colors.text.muted,
      error: theme.colors.status.danger,
    };

    const strokeColor = statusColorMap[syncStatus] ?? theme.colors.text.muted;
    const circumference = 2 * Math.PI * 9; // radius = 9
    const offset = circumference - (syncProgress / 100) * circumference;

    return (
      <div
        ref={ref}
        className={className}
        style={{ ...cardStyle, ...userStyle }}
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        role="button"
        tabIndex={0}
        aria-label={name}
        data-testid="shared-folder-card"
        {...rest}
      >
        {/* Header */}
        <div style={headerStyle}>
          <div style={iconStyle}>
            <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div style={nameStyle} title={name}>{name}</div>
          {/* Sync ring */}
          <div style={syncRingStyle}>
            <svg width={24} height={24} viewBox="0 0 24 24">
              <circle cx={12} cy={12} r={9} fill="none" stroke={theme.colors.border.subtle} strokeWidth={2} />
              <circle
                cx={12}
                cy={12}
                r={9}
                fill="none"
                stroke={strokeColor}
                strokeWidth={2}
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                transform="rotate(-90 12 12)"
              />
            </svg>
          </div>
        </div>

        {/* Meta */}
        <div style={metaStyle}>
          <span>{fileCount} {fileCount === 1 ? 'file' : 'files'}</span>
          {lastSyncAt && (
            <>
              <span>{'\u00B7'}</span>
              <span>Synced {new Date(lastSyncAt).toLocaleDateString()}</span>
            </>
          )}
        </div>

        {/* Shared-with avatars */}
        {sharedWith.length > 0 && (
          <div style={avatarRowStyle}>
            {sharedWith.slice(0, 5).map((member, i) => (
              <div key={member.did} style={buildSharedFolderCardAvatarStyle(theme, i)} title={member.name}>
                {member.avatarUrl ? (
                  <img src={member.avatarUrl} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  member.name.charAt(0).toUpperCase()
                )}
              </div>
            ))}
            {sharedWith.length > 5 && (
              <div style={buildSharedFolderCardAvatarStyle(theme, 5)}>
                +{sharedWith.length - 5}
              </div>
            )}
          </div>
        )}
      </div>
    );
  },
);

SharedFolderCard.displayName = 'SharedFolderCard';
