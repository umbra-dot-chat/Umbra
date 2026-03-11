/**
 * @module MemberStatusDisplay
 */
import type { CSSStyleObject } from '../types';
import type { WispTheme } from '../theme/types';
import type { MemberStatusDisplaySizeConfig } from '../types/MemberStatusDisplay.types';
import { fontFamilyStacks } from '../tokens/shared';

// ---------------------------------------------------------------------------
// Container
// ---------------------------------------------------------------------------

export function buildMemberStatusDisplayContainerStyle(
  sizeConfig: MemberStatusDisplaySizeConfig,
  truncate: boolean,
  maxWidth: number,
  theme: WispTheme,
): CSSStyleObject {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: sizeConfig.gap,
    maxWidth: truncate ? maxWidth : undefined,
    overflow: truncate ? 'hidden' : undefined,
    lineHeight: sizeConfig.lineHeight,
  };
}

// ---------------------------------------------------------------------------
// Emoji
// ---------------------------------------------------------------------------

export function buildMemberStatusDisplayEmojiStyle(
  sizeConfig: MemberStatusDisplaySizeConfig,
): CSSStyleObject {
  return {
    fontSize: sizeConfig.emojiSize,
    lineHeight: 1,
    flexShrink: 0,
  };
}

// ---------------------------------------------------------------------------
// Text
// ---------------------------------------------------------------------------

export function buildMemberStatusDisplayTextStyle(
  sizeConfig: MemberStatusDisplaySizeConfig,
  truncate: boolean,
  theme: WispTheme,
): CSSStyleObject {
  return {
    fontSize: sizeConfig.fontSize,
    fontFamily: fontFamilyStacks.sans,
    color: theme.colors.text.muted,
    lineHeight: sizeConfig.lineHeight,
    overflow: truncate ? 'hidden' : undefined,
    textOverflow: truncate ? 'ellipsis' : undefined,
    whiteSpace: truncate ? 'nowrap' : undefined,
    minWidth: 0,
  };
}
