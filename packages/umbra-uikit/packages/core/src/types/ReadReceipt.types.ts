/**
 * @module types/ReadReceipt
 * @description Type definitions for the ReadReceipt primitive — message
 * delivery status indicator (sent, delivered, read) for chat interfaces.
 */

import type React from 'react';
import { defaultSpacing, defaultTypography } from '../theme/create-theme';

// ---------------------------------------------------------------------------
// Status
// ---------------------------------------------------------------------------

export const readReceiptStatuses = ['sending', 'sent', 'delivered', 'read', 'failed'] as const;
export type ReadReceiptStatus = (typeof readReceiptStatuses)[number];

// ---------------------------------------------------------------------------
// Size
// ---------------------------------------------------------------------------

export const readReceiptSizes = ['xs', 'sm', 'md', 'lg'] as const;
export type ReadReceiptSize = (typeof readReceiptSizes)[number];

export interface ReadReceiptSizeConfig {
  /** Icon size (px). */
  iconSize: number;
  /** Font size for label text. */
  fontSize: number;
  /** Gap between icon and label. */
  gap: number;
}

export const readReceiptSizeMap: Record<ReadReceiptSize, ReadReceiptSizeConfig> = {
  xs: { iconSize: 12, fontSize: defaultTypography.sizes['2xs'].fontSize, gap: defaultSpacing['2xs'] },
  sm: { iconSize: 14, fontSize: defaultTypography.sizes.xs.fontSize, gap: defaultSpacing.xs },
  md: { iconSize: 16, fontSize: defaultTypography.sizes.xs.fontSize, gap: defaultSpacing.xs },
  lg: { iconSize: 20, fontSize: defaultTypography.sizes.sm.fontSize, gap: defaultSpacing.sm },
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ReadReceiptProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** Current delivery status. */
  status: ReadReceiptStatus;

  /** Size preset. @default 'sm' */
  size?: ReadReceiptSize;

  /** Optional timestamp text (e.g. "2:30 PM"). */
  timestamp?: string;

  /** Show label text alongside icon. @default false */
  showLabel?: boolean;

  /** Custom labels for each status. */
  labels?: Partial<Record<ReadReceiptStatus, string>>;

  /** Show loading skeleton. @default false */
  skeleton?: boolean;
}
