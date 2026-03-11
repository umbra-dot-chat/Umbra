/**
 * @module components/folder-card
 * @description React Native FolderCard for the Wisp design system.
 *
 * Displays a folder in a file channel grid view with icon, name, and file count.
 */

import React, { forwardRef, useMemo, useState, useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import type { ViewProps, ViewStyle, TextStyle } from 'react-native';
import { defaultSpacing, defaultTypography, defaultRadii } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';
import Svg, { Path } from 'react-native-svg';

// ---------------------------------------------------------------------------
// Props (RN-specific)
// ---------------------------------------------------------------------------

export interface FolderCardProps extends ViewProps {
  /** The folder name to display. */
  name: string;
  /** Number of files inside this folder. */
  fileCount?: number;
  /** Callback fired when the card is pressed. */
  onPress?: () => void;
  /** Callback fired on long press (context menu). */
  onLongPress?: () => void;
  /** Whether the card is in a selected state. @default false */
  selected?: boolean;
  /** When true, renders skeleton placeholders. @default false */
  skeleton?: boolean;
  /** Whether this folder can accept drop targets (visual indicator). @default false */
  dropTarget?: boolean;
  /** Name of the user who created the folder. */
  createdBy?: string;
  /** ISO date string of when the folder was created. */
  createdAt?: string;
}

// ---------------------------------------------------------------------------
// SVG Icons
// ---------------------------------------------------------------------------

function FolderIcon({ size = 40, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color ?? 'currentColor'}>
      <Path d="M2 6a2 2 0 012-2h5l2 2h9a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// FolderCard
// ---------------------------------------------------------------------------

export const FolderCard = forwardRef<View, FolderCardProps>(
  function FolderCard(
    {
      name,
      fileCount,
      onPress,
      onLongPress,
      selected = false,
      skeleton = false,
      dropTarget = false,
      createdBy,
      createdAt,
      style: userStyle,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();
    const themeColors = theme.colors;

    // Styles
    const cardStyle = useMemo<ViewStyle>(() => ({
      borderRadius: defaultRadii.lg,
      borderWidth: 1,
      borderColor: selected || dropTarget ? themeColors.accent.primary : themeColors.border.subtle,
      backgroundColor: dropTarget
        ? `${themeColors.accent.primary}10`
        : themeColors.background.surface,
      overflow: 'hidden',
    }), [themeColors, selected, dropTarget]);

    const iconAreaStyle = useMemo<ViewStyle>(() => ({
      alignItems: 'center',
      justifyContent: 'center',
      height: 80,
      backgroundColor: themeColors.background.canvas,
    }), [themeColors]);

    const bodyStyle = useMemo<ViewStyle>(() => ({
      gap: 2,
      padding: defaultSpacing.sm,
    }), []);

    const nameStyle = useMemo<TextStyle>(() => ({
      fontSize: defaultTypography.sizes.sm.fontSize,
      fontWeight: String(defaultTypography.weights.medium) as TextStyle['fontWeight'],
      color: themeColors.text.primary,
    }), [themeColors]);

    const metaStyle = useMemo<TextStyle>(() => ({
      fontSize: defaultTypography.sizes.xs.fontSize,
      color: themeColors.text.muted,
    }), [themeColors]);

    const skeletonStyle = useMemo<ViewStyle>(() => ({
      borderRadius: defaultRadii.lg,
      backgroundColor: themeColors.border.subtle,
      height: 130,
      opacity: 0.3,
    }), [themeColors]);

    // Skeleton
    if (skeleton) {
      return (
        <View
          ref={ref}
          style={[skeletonStyle, userStyle as ViewStyle]}
          {...rest}
        />
      );
    }

    return (
      <Pressable
        ref={ref as any}
        style={[cardStyle, userStyle as ViewStyle]}
        onPress={onPress}
        onLongPress={onLongPress}
        accessibilityRole="button"
        accessibilityLabel={`Folder: ${name}`}
        {...rest}
      >
        {/* Icon area */}
        <View style={iconAreaStyle}>
          <FolderIcon size={36} color={themeColors.status?.warning ?? '#f59e0b'} />
        </View>

        {/* Body */}
        <View style={bodyStyle}>
          <Text style={nameStyle} numberOfLines={1}>{name}</Text>
          {fileCount !== undefined && (
            <Text style={metaStyle}>
              {fileCount} {fileCount === 1 ? 'file' : 'files'}
            </Text>
          )}
        </View>
      </Pressable>
    );
  },
);

FolderCard.displayName = 'FolderCard';
