/**
 * @module FileTransferProgress
 */
import type { CSSStyleObject } from '../types';
import type { WispTheme } from '../theme/types';
import { fontFamilyStacks } from '../tokens/shared';
import { durations, easings } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Root container
// ---------------------------------------------------------------------------

export function buildTransferProgressRootStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, radii, spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.lg,
    border: `1px solid ${themeColors.border.subtle}`,
    backgroundColor: themeColors.background.surface,
    fontFamily: fontFamilyStacks.sans,
    boxSizing: 'border-box',
  };
}

// ---------------------------------------------------------------------------
// Header row (filename + direction icon + actions)
// ---------------------------------------------------------------------------

export function buildTransferProgressHeaderStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  };
}

export function buildTransferProgressFileInfoStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: 0,
    flex: 1,
  };
}

export function buildTransferProgressFilenameStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, typography } = theme;
  return {
    fontSize: typography.sizes.sm.fontSize,
    fontWeight: typography.weights.medium,
    color: themeColors.text.primary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    margin: 0,
  };
}

export function buildTransferProgressDirectionStyle(
  theme: WispTheme,
  direction: 'upload' | 'download',
): CSSStyleObject {
  const { colors: themeColors } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 16,
    height: 16,
    color: direction === 'upload'
      ? themeColors.status.success
      : themeColors.accent.primary,
    flexShrink: 0,
  };
}

// ---------------------------------------------------------------------------
// Progress bar
// ---------------------------------------------------------------------------

export function buildTransferProgressBarTrackStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, radii } = theme;
  return {
    width: '100%',
    height: 6,
    borderRadius: radii.full,
    backgroundColor: themeColors.border.subtle,
    overflow: 'hidden',
    position: 'relative',
  };
}

export function buildTransferProgressBarFillStyle(
  theme: WispTheme,
  progress: number,
  state: string,
): CSSStyleObject {
  const { colors: themeColors, radii } = theme;
  const isError = state === 'error';
  const isPaused = state === 'paused';
  return {
    height: '100%',
    width: `${Math.min(100, Math.max(0, progress))}%`,
    borderRadius: radii.full,
    backgroundColor: isError
      ? themeColors.status.danger
      : isPaused
        ? themeColors.status.warning
        : themeColors.accent.primary,
    transition: `width ${durations.normal}ms ${easings.easeOut.css}`,
  };
}

// ---------------------------------------------------------------------------
// Stats row (speed, transferred, ETA)
// ---------------------------------------------------------------------------

export function buildTransferProgressStatsStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, typography, spacing } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    fontSize: typography.sizes.xs.fontSize,
    color: themeColors.text.muted,
    margin: 0,
  };
}

// ---------------------------------------------------------------------------
// Step indicator
// ---------------------------------------------------------------------------

export function buildTransferProgressStepsStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.xs,
  };
}

export function buildTransferProgressStepDotStyle(
  theme: WispTheme,
  status: 'pending' | 'active' | 'complete' | 'error',
): CSSStyleObject {
  const { colors: themeColors, radii } = theme;
  const colorMap: Record<string, string> = {
    pending: themeColors.border.strong,
    active: themeColors.accent.primary,
    complete: themeColors.status.success,
    error: themeColors.status.danger,
  };
  return {
    width: 8,
    height: 8,
    borderRadius: radii.full,
    backgroundColor: colorMap[status] ?? themeColors.border.strong,
    transition: `background-color ${durations.fast}ms ${easings.easeOut.css}`,
  };
}

export function buildTransferProgressStepConnectorStyle(
  theme: WispTheme,
  completed: boolean,
): CSSStyleObject {
  const { colors: themeColors } = theme;
  return {
    width: 16,
    height: 2,
    backgroundColor: completed
      ? themeColors.status.success
      : themeColors.border.subtle,
    transition: `background-color ${durations.fast}ms ${easings.easeOut.css}`,
  };
}

// ---------------------------------------------------------------------------
// Actions row
// ---------------------------------------------------------------------------

export function buildTransferProgressActionsStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.xs,
    flexShrink: 0,
  };
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function buildTransferProgressSkeletonStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, radii } = theme;
  return {
    borderRadius: radii.lg,
    backgroundColor: themeColors.border.subtle,
    height: 80,
    animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite',
  };
}
