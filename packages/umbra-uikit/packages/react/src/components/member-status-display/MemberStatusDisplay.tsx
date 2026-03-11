/**
 * @module MemberStatusDisplay
 * @description Inline display of a member's custom status (emoji + text).
 */
import React, { forwardRef, useMemo } from 'react';
import type { MemberStatusDisplayProps } from '@coexist/wisp-core/types/MemberStatusDisplay.types';
import { memberStatusDisplaySizeMap } from '@coexist/wisp-core/types/MemberStatusDisplay.types';
import {
  buildMemberStatusDisplayContainerStyle,
  buildMemberStatusDisplayEmojiStyle,
  buildMemberStatusDisplayTextStyle,
} from '@coexist/wisp-core/styles/MemberStatusDisplay.styles';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * MemberStatusDisplay -- An inline span showing emoji + text for a member status.
 *
 * @remarks
 * Renders in muted color with a smaller font. Truncates with ellipsis by default.
 *
 * @example
 * ```tsx
 * <MemberStatusDisplay emoji="\u{1F3AE}" text="Playing a game" />
 * <MemberStatusDisplay text="Away" size="xs" />
 * ```
 */
export const MemberStatusDisplay = forwardRef<HTMLSpanElement, MemberStatusDisplayProps>(
  function MemberStatusDisplay(
    {
      text,
      emoji,
      size = 'sm',
      truncate = true,
      maxWidth = 200,
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();

    const sizeConfig = useMemo(
      () => memberStatusDisplaySizeMap[size],
      [size],
    );

    const containerStyle = useMemo(
      () => buildMemberStatusDisplayContainerStyle(sizeConfig, truncate, maxWidth, theme),
      [sizeConfig, truncate, maxWidth, theme],
    );

    const emojiStyle = useMemo(
      () => buildMemberStatusDisplayEmojiStyle(sizeConfig),
      [sizeConfig],
    );

    const textStyle = useMemo(
      () => buildMemberStatusDisplayTextStyle(sizeConfig, truncate, theme),
      [sizeConfig, truncate, theme],
    );

    // Render nothing if both text and emoji are empty
    if (!text && !emoji) return null;

    return (
      <span
        ref={ref}
        className={className}
        style={{ ...containerStyle, ...userStyle }}
        aria-label={[emoji, text].filter(Boolean).join(' ')}
        {...rest}
      >
        {emoji && <span style={emojiStyle} aria-hidden="true">{emoji}</span>}
        {text && <span style={textStyle}>{text}</span>}
      </span>
    );
  },
);

MemberStatusDisplay.displayName = 'MemberStatusDisplay';
