/**
 * @module primitives/read-receipt
 * @description React Native ReadReceipt primitive for the Wisp design system.
 *
 * Reuses color resolution and size maps from `@coexist/wisp-core`.
 * Renders status icons as unicode characters instead of Lucide SVGs.
 */

import React, { forwardRef, useMemo } from 'react';
import { View, Text } from 'react-native';
import type { ViewProps, ViewStyle, TextStyle } from 'react-native';
import type { ReadReceiptStatus, ReadReceiptSize } from '@coexist/wisp-core/types/ReadReceipt.types';
import { readReceiptSizeMap } from '@coexist/wisp-core/types/ReadReceipt.types';
import { resolveReadReceiptColors } from '@coexist/wisp-core/styles/ReadReceipt.styles';
import { defaultRadii } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Status → unicode icon map
// ---------------------------------------------------------------------------

const STATUS_ICONS: Record<ReadReceiptStatus, string> = {
  sending: '\u{23F3}',   // hourglass
  sent: '\u{2713}',      // check
  delivered: '\u{2713}\u{2713}', // double check
  read: '\u{2713}\u{2713}',     // double check (colored blue)
  failed: '\u{26A0}',    // warning
};

const DEFAULT_LABELS: Record<ReadReceiptStatus, string> = {
  sending: 'Sending',
  sent: 'Sent',
  delivered: 'Delivered',
  read: 'Read',
  failed: 'Failed',
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ReadReceiptProps extends ViewProps {
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const ReadReceipt = forwardRef<View, ReadReceiptProps>(
  function ReadReceipt(
    {
      status,
      size = 'sm',
      timestamp,
      showLabel = false,
      labels,
      skeleton = false,
      style: userStyle,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();
    const themeColors = theme.colors;
    const sizeConfig = readReceiptSizeMap[size];

    const colors = useMemo(
      () => resolveReadReceiptColors(status, theme),
      [status, themeColors],
    );

    if (skeleton) {
      const skeletonStyle: ViewStyle = {
        width: sizeConfig.iconSize * 3,
        height: sizeConfig.iconSize,
        borderRadius: defaultRadii.sm,
        backgroundColor: themeColors.border.subtle,
      };
      return <View ref={ref} style={[skeletonStyle, userStyle]} {...rest} />;
    }

    const containerStyle = useMemo<ViewStyle>(() => ({
      flexDirection: 'row',
      alignItems: 'center',
      gap: sizeConfig.gap,
      flexShrink: 0,
    }), [sizeConfig]);

    const iconStyle = useMemo<TextStyle>(() => ({
      fontSize: sizeConfig.iconSize,
      color: status === 'failed' ? colors.failedIcon : colors.icon,
    }), [sizeConfig, status, colors]);

    const labelStyle = useMemo<TextStyle>(() => ({
      fontSize: sizeConfig.fontSize,
      color: colors.label,
    }), [sizeConfig, colors]);

    const resolvedLabel = labels?.[status] ?? DEFAULT_LABELS[status];

    return (
      <View
        ref={ref}
        accessibilityLabel={resolvedLabel}
        style={[containerStyle, userStyle]}
        {...rest}
      >
        <Text style={iconStyle}>{STATUS_ICONS[status]}</Text>
        {showLabel && <Text style={labelStyle}>{resolvedLabel}</Text>}
        {timestamp && <Text style={labelStyle}>{timestamp}</Text>}
      </View>
    );
  },
);

ReadReceipt.displayName = 'ReadReceipt';
