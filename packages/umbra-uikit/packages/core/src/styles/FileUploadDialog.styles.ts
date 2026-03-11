/**
 * @module FileUploadDialog
 */
import type { CSSStyleObject } from '../types';
import { fontFamilyStacks } from '../tokens/shared';
import type { WispTheme } from '../theme/types';
import { durations, easings } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Dialog body content
// ---------------------------------------------------------------------------

export function buildUploadDialogBodyStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.md,
    fontFamily: fontFamilyStacks.sans,
  };
}

// ---------------------------------------------------------------------------
// Target folder label
// ---------------------------------------------------------------------------

export function buildUploadDialogFolderLabelStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, typography, spacing, radii } = theme;
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing.xs,
    padding: `${spacing['2xs']}px ${spacing.sm}px`,
    backgroundColor: themeColors.background.raised,
    borderRadius: radii.md,
    fontSize: typography.sizes.xs.fontSize,
    color: themeColors.text.secondary,
  };
}

// ---------------------------------------------------------------------------
// Upload file list container
// ---------------------------------------------------------------------------

export function buildUploadFileListStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
    maxHeight: 300,
    overflowY: 'auto',
  };
}

// ---------------------------------------------------------------------------
// Individual upload file row
// ---------------------------------------------------------------------------

export function buildUploadFileRowStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, spacing, radii } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
    padding: spacing.sm,
    backgroundColor: themeColors.background.surface,
    borderRadius: radii.md,
    border: `1px solid ${themeColors.border.subtle}`,
  };
}

// ---------------------------------------------------------------------------
// Upload file row header (name + actions)
// ---------------------------------------------------------------------------

export function buildUploadFileRowHeaderStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  };
}

// ---------------------------------------------------------------------------
// Upload file info (name + size)
// ---------------------------------------------------------------------------

export function buildUploadFileInfoStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    minWidth: 0,
    flex: 1,
  };
}

// ---------------------------------------------------------------------------
// File name text
// ---------------------------------------------------------------------------

export function buildUploadFileNameStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, typography } = theme;
  return {
    fontSize: typography.sizes.sm.fontSize,
    fontWeight: typography.weights.medium,
    color: themeColors.text.primary,
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };
}

// ---------------------------------------------------------------------------
// File size text
// ---------------------------------------------------------------------------

export function buildUploadFileSizeStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, typography } = theme;
  return {
    fontSize: typography.sizes.xs.fontSize,
    color: themeColors.text.muted,
    margin: 0,
  };
}

// ---------------------------------------------------------------------------
// Row actions container
// ---------------------------------------------------------------------------

export function buildUploadFileActionsStyle(
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
// Error text
// ---------------------------------------------------------------------------

export function buildUploadFileErrorStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, typography } = theme;
  return {
    fontSize: typography.sizes.xs.fontSize,
    color: themeColors.status.danger,
    margin: 0,
  };
}

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

export function buildUploadDialogFooterStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    paddingTop: spacing.sm,
  };
}
