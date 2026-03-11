/**
 * @module ReadReceipt
 * @description Message delivery status indicator with inline SVG icons
 * for sent (single check), delivered (double check), read (blue double check),
 * sending (clock), and failed (exclamation) states.
 */

import React, { forwardRef, useMemo } from 'react';
import { useTheme } from '../../providers';
import { Text } from '../text';
import type { ReadReceiptProps, ReadReceiptStatus } from '@coexist/wisp-core/types/ReadReceipt.types';
import { readReceiptSizeMap } from '@coexist/wisp-core/types/ReadReceipt.types';
import {
  resolveReadReceiptColors,
  buildReadReceiptContainerStyle,
  buildReadReceiptIconStyle,
  buildReadReceiptLabelStyle,
  buildReadReceiptSkeletonStyle,
} from '@coexist/wisp-core/styles/ReadReceipt.styles';

// ---------------------------------------------------------------------------
// Default labels
// ---------------------------------------------------------------------------

const DEFAULT_LABELS: Record<ReadReceiptStatus, string> = {
  sending: 'Sending',
  sent: 'Sent',
  delivered: 'Delivered',
  read: 'Read',
  failed: 'Failed',
};

// ---------------------------------------------------------------------------
// Inline SVG Icons
// ---------------------------------------------------------------------------

function SendingIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function SentIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function DeliveredIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 6 7 17 2 12" />
      <polyline points="22 6 11 17" />
    </svg>
  );
}

function FailedIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function StatusIcon({ status, size }: { status: ReadReceiptStatus; size: number }) {
  switch (status) {
    case 'sending': return <SendingIcon size={size} />;
    case 'sent': return <SentIcon size={size} />;
    case 'delivered': return <DeliveredIcon size={size} />;
    case 'read': return <DeliveredIcon size={size} />;
    case 'failed': return <FailedIcon size={size} />;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const ReadReceipt = forwardRef<HTMLSpanElement, ReadReceiptProps>(function ReadReceipt(
  {
    status,
    size = 'sm',
    timestamp,
    showLabel = false,
    labels,
    skeleton = false,
    style: userStyle,
    className,
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const sizeConfig = readReceiptSizeMap[size];

  const colors = useMemo(
    () => resolveReadReceiptColors(status, theme),
    [status, theme],
  );

  if (skeleton) {
    const skeletonStyle = buildReadReceiptSkeletonStyle(sizeConfig, theme);
    return <span aria-hidden className={className} style={{ ...skeletonStyle, ...userStyle }} />;
  }

  const containerStyle = useMemo(
    () => buildReadReceiptContainerStyle(sizeConfig),
    [sizeConfig],
  );

  const iconStyle = useMemo(
    () => buildReadReceiptIconStyle(sizeConfig, colors, status),
    [sizeConfig, colors, status],
  );

  const labelStyle = useMemo(
    () => buildReadReceiptLabelStyle(sizeConfig, colors),
    [sizeConfig, colors],
  );

  const label = labels?.[status] ?? DEFAULT_LABELS[status];

  return (
    <span
      ref={ref}
      className={className}
      style={{ ...containerStyle, ...userStyle }}
      aria-label={`Message ${label.toLowerCase()}`}
      {...rest}
    >
      <span style={iconStyle}>
        <StatusIcon status={status} size={sizeConfig.iconSize} />
      </span>
      {timestamp && <Text style={labelStyle}>{timestamp}</Text>}
      {showLabel && <Text style={labelStyle}>{label}</Text>}
    </span>
  );
});

ReadReceipt.displayName = 'ReadReceipt';
