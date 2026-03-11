/**
 * @module ReactionBar
 * @description Floating emoji reaction bar for chat messages with toggle
 * support, counts, and an optional "add reaction" button.
 */

import React, { forwardRef, useCallback, useMemo } from 'react';
import { useTheme } from '../../providers';
import type { ReactionBarProps } from '@coexist/wisp-core/types/ReactionBar.types';
import { reactionBarSizeMap } from '@coexist/wisp-core/types/ReactionBar.types';
import {
  resolveReactionBarColors,
  buildReactionBarContainerStyle,
  buildReactionButtonStyle,
  buildReactionCountStyle,
  buildAddButtonStyle,
  buildReactionBarSkeletonStyle,
} from '@coexist/wisp-core/styles/ReactionBar.styles';

// ---------------------------------------------------------------------------
// Add icon (small +)
// ---------------------------------------------------------------------------

function PlusIcon({ size }: { size: number }) {
  return (
    <svg width={size * 0.7} height={size * 0.7} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const ReactionBar = forwardRef<HTMLDivElement, ReactionBarProps>(function ReactionBar(
  {
    reactions,
    size = 'md',
    onReactionClick,
    showAddButton = true,
    onAddClick,
    maxVisible,
    skeleton = false,
    style: userStyle,
    className,
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const sizeConfig = reactionBarSizeMap[size];

  const colors = useMemo(
    () => resolveReactionBarColors(theme),
    [theme],
  );

  if (skeleton) {
    const skeletonStyle = buildReactionBarSkeletonStyle(sizeConfig, theme);
    return <div aria-hidden className={className} style={{ ...skeletonStyle, ...userStyle }} />;
  }

  const containerStyle = useMemo(
    () => buildReactionBarContainerStyle(sizeConfig, colors, theme),
    [sizeConfig, colors, theme],
  );

  const visibleReactions = maxVisible ? reactions.slice(0, maxVisible) : reactions;
  const hiddenCount = maxVisible ? Math.max(0, reactions.length - maxVisible) : 0;

  const handleReactionClick = useCallback(
    (emoji: string, active: boolean) => {
      onReactionClick?.(emoji, !active);
    },
    [onReactionClick],
  );

  return (
    <div
      ref={ref}
      className={className}
      style={{ ...containerStyle, ...userStyle }}
      role="group"
      aria-label="Reactions"
      {...rest}
    >
      {visibleReactions.map((reaction) => {
        const isActive = reaction.active ?? false;
        const btnStyle = buildReactionButtonStyle(sizeConfig, colors, isActive, theme);
        const countStyle = buildReactionCountStyle(sizeConfig, colors, isActive, theme);

        return (
          <button
            key={reaction.emoji}
            type="button"
            style={btnStyle}
            onClick={() => handleReactionClick(reaction.emoji, isActive)}
            aria-label={`${reaction.label || reaction.emoji} ${reaction.count}`}
            aria-pressed={isActive}
          >
            <span>{reaction.emoji}</span>
            {reaction.count > 0 && <span style={countStyle}>{reaction.count}</span>}
          </button>
        );
      })}

      {hiddenCount > 0 && (
        <span style={{
          fontSize: sizeConfig.countFontSize,
          color: colors.text,
          padding: '0 4px',
          userSelect: 'none',
        }}>
          +{hiddenCount}
        </span>
      )}

      {showAddButton && (
        <button
          type="button"
          style={buildAddButtonStyle(sizeConfig, colors, theme)}
          onClick={onAddClick}
          aria-label="Add reaction"
        >
          <PlusIcon size={sizeConfig.emojiSize} />
        </button>
      )}
    </div>
  );
});

ReactionBar.displayName = 'ReactionBar';
