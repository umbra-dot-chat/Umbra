/**
 * @module components/file-context-menu
 * @description React Native context menus for file and folder operations.
 *
 * Uses a bottom-sheet modal pattern triggered by long-press on RN.
 */

import React, { useMemo } from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import { defaultSpacing, defaultTypography, defaultRadii } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';
import Svg, { Path, Polyline, Line, Circle } from 'react-native-svg';

// ---------------------------------------------------------------------------
// Props (RN-specific)
// ---------------------------------------------------------------------------

export interface FileContextMenuProps {
  open: boolean;
  onClose: () => void;
  onDownload?: () => void;
  onRename?: () => void;
  onMove?: () => void;
  onCopyLink?: () => void;
  onDetails?: () => void;
  onDelete?: () => void;
  multiSelect?: boolean;
  selectedCount?: number;
}

export interface FolderContextMenuProps {
  open: boolean;
  onClose: () => void;
  onOpen?: () => void;
  onRename?: () => void;
  onMove?: () => void;
  onDelete?: () => void;
}

// ---------------------------------------------------------------------------
// SVG Icons
// ---------------------------------------------------------------------------

function DownloadIcon({ size = 20, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <Polyline points="7 10 12 15 17 10" />
      <Line x1="12" y1="15" x2="12" y2="3" />
    </Svg>
  );
}

function PenIcon({ size = 20, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </Svg>
  );
}

function MoveIcon({ size = 20, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M5 12h14" />
      <Path d="M12 5l7 7-7 7" />
    </Svg>
  );
}

function TrashIcon({ size = 20, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Polyline points="3 6 5 6 21 6" />
      <Path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    </Svg>
  );
}

function InfoIcon({ size = 20, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="12" cy="12" r="10" />
      <Line x1="12" y1="16" x2="12" y2="12" />
      <Line x1="12" y1="8" x2="12.01" y2="8" />
    </Svg>
  );
}

function FolderOpenIcon({ size = 20, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M2 6a2 2 0 012-2h5l2 2h9a2 2 0 012 2v1H7.5a2 2 0 00-1.8 1.1L2 18V6z" />
      <Path d="M5.7 11.1A2 2 0 017.5 10H22l-3.3 8.1a2 2 0 01-1.8 1.1H2l3.7-8z" />
    </Svg>
  );
}

function LinkIcon({ size = 20, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
      <Path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Shared MenuItem
// ---------------------------------------------------------------------------

function MenuItem({
  icon,
  label,
  onPress,
  destructive,
  itemStyle,
  textStyle,
  destructiveTextStyle,
}: {
  icon: React.ReactNode;
  label: string;
  onPress?: () => void;
  destructive?: boolean;
  itemStyle: ViewStyle;
  textStyle: TextStyle;
  destructiveTextStyle: TextStyle;
}) {
  return (
    <Pressable
      style={({ pressed }) => [itemStyle, pressed && { opacity: 0.7 }]}
      onPress={onPress}
      accessibilityRole="menuitem"
    >
      {icon}
      <Text style={[textStyle, destructive && destructiveTextStyle]}>{label}</Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// FileContextMenu
// ---------------------------------------------------------------------------

export function FileContextMenu({
  open,
  onClose,
  onDownload,
  onRename,
  onMove,
  onCopyLink,
  onDetails,
  onDelete,
  multiSelect = false,
  selectedCount,
}: FileContextMenuProps) {
  const { theme } = useTheme();
  const themeColors = theme.colors;

  const overlayStyle = useMemo<ViewStyle>(() => ({
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  }), []);

  const sheetStyle = useMemo<ViewStyle>(() => ({
    backgroundColor: themeColors.background.surface,
    borderTopLeftRadius: defaultRadii.xl,
    borderTopRightRadius: defaultRadii.xl,
    paddingVertical: defaultSpacing.sm,
    paddingBottom: defaultSpacing.xl,
  }), [themeColors]);

  const handleStyle = useMemo<ViewStyle>(() => ({
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: themeColors.border.subtle,
    alignSelf: 'center',
    marginVertical: defaultSpacing.xs,
  }), [themeColors]);

  const itemStyle = useMemo<ViewStyle>(() => ({
    flexDirection: 'row',
    alignItems: 'center',
    gap: defaultSpacing.md,
    paddingHorizontal: defaultSpacing.lg,
    paddingVertical: defaultSpacing.sm,
  }), []);

  const textStyle = useMemo<TextStyle>(() => ({
    fontSize: defaultTypography.sizes.base.fontSize,
    color: themeColors.text.primary,
  }), [themeColors]);

  const destructiveTextStyle = useMemo<TextStyle>(() => ({
    color: themeColors.status?.danger ?? '#ef4444',
  }), [themeColors]);

  const separatorStyle = useMemo<ViewStyle>(() => ({
    height: 1,
    backgroundColor: themeColors.border.subtle,
    marginVertical: defaultSpacing.xs,
    marginHorizontal: defaultSpacing.md,
  }), [themeColors]);

  const label = multiSelect && selectedCount ? `${selectedCount} files` : '';

  const handleAction = (action?: () => void) => {
    action?.();
    onClose();
  };

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={overlayStyle} onPress={onClose}>
        <View style={sheetStyle}>
          <View style={handleStyle} />
          {onDownload && (
            <MenuItem icon={<DownloadIcon color={themeColors.text.primary} />} label={multiSelect ? `Download ${label}` : 'Download'} onPress={() => handleAction(onDownload)} itemStyle={itemStyle} textStyle={textStyle} destructiveTextStyle={destructiveTextStyle} />
          )}
          {onRename && !multiSelect && (
            <MenuItem icon={<PenIcon color={themeColors.text.primary} />} label="Rename" onPress={() => handleAction(onRename)} itemStyle={itemStyle} textStyle={textStyle} destructiveTextStyle={destructiveTextStyle} />
          )}
          {onMove && (
            <MenuItem icon={<MoveIcon color={themeColors.text.primary} />} label="Move to..." onPress={() => handleAction(onMove)} itemStyle={itemStyle} textStyle={textStyle} destructiveTextStyle={destructiveTextStyle} />
          )}
          {onCopyLink && !multiSelect && (
            <MenuItem icon={<LinkIcon color={themeColors.text.primary} />} label="Copy Link" onPress={() => handleAction(onCopyLink)} itemStyle={itemStyle} textStyle={textStyle} destructiveTextStyle={destructiveTextStyle} />
          )}
          {onDetails && !multiSelect && (
            <>
              <View style={separatorStyle} />
              <MenuItem icon={<InfoIcon color={themeColors.text.primary} />} label="Details" onPress={() => handleAction(onDetails)} itemStyle={itemStyle} textStyle={textStyle} destructiveTextStyle={destructiveTextStyle} />
            </>
          )}
          {onDelete && (
            <>
              <View style={separatorStyle} />
              <MenuItem icon={<TrashIcon color={themeColors.status?.danger ?? '#ef4444'} />} label={multiSelect ? `Delete ${label}` : 'Delete'} onPress={() => handleAction(onDelete)} destructive itemStyle={itemStyle} textStyle={textStyle} destructiveTextStyle={destructiveTextStyle} />
            </>
          )}
        </View>
      </Pressable>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// FolderContextMenu
// ---------------------------------------------------------------------------

export function FolderContextMenu({
  open,
  onClose,
  onOpen,
  onRename,
  onMove,
  onDelete,
}: FolderContextMenuProps) {
  const { theme } = useTheme();
  const themeColors = theme.colors;

  const overlayStyle = useMemo<ViewStyle>(() => ({
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  }), []);

  const sheetStyle = useMemo<ViewStyle>(() => ({
    backgroundColor: themeColors.background.surface,
    borderTopLeftRadius: defaultRadii.xl,
    borderTopRightRadius: defaultRadii.xl,
    paddingVertical: defaultSpacing.sm,
    paddingBottom: defaultSpacing.xl,
  }), [themeColors]);

  const handleStyle = useMemo<ViewStyle>(() => ({
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: themeColors.border.subtle,
    alignSelf: 'center',
    marginVertical: defaultSpacing.xs,
  }), [themeColors]);

  const itemStyle = useMemo<ViewStyle>(() => ({
    flexDirection: 'row',
    alignItems: 'center',
    gap: defaultSpacing.md,
    paddingHorizontal: defaultSpacing.lg,
    paddingVertical: defaultSpacing.sm,
  }), []);

  const textStyle = useMemo<TextStyle>(() => ({
    fontSize: defaultTypography.sizes.base.fontSize,
    color: themeColors.text.primary,
  }), [themeColors]);

  const destructiveTextStyle = useMemo<TextStyle>(() => ({
    color: themeColors.status?.danger ?? '#ef4444',
  }), [themeColors]);

  const separatorStyle = useMemo<ViewStyle>(() => ({
    height: 1,
    backgroundColor: themeColors.border.subtle,
    marginVertical: defaultSpacing.xs,
    marginHorizontal: defaultSpacing.md,
  }), [themeColors]);

  const handleAction = (action?: () => void) => {
    action?.();
    onClose();
  };

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={overlayStyle} onPress={onClose}>
        <View style={sheetStyle}>
          <View style={handleStyle} />
          {onOpen && (
            <MenuItem icon={<FolderOpenIcon color={themeColors.text.primary} />} label="Open" onPress={() => handleAction(onOpen)} itemStyle={itemStyle} textStyle={textStyle} destructiveTextStyle={destructiveTextStyle} />
          )}
          {onRename && (
            <MenuItem icon={<PenIcon color={themeColors.text.primary} />} label="Rename" onPress={() => handleAction(onRename)} itemStyle={itemStyle} textStyle={textStyle} destructiveTextStyle={destructiveTextStyle} />
          )}
          {onMove && (
            <MenuItem icon={<MoveIcon color={themeColors.text.primary} />} label="Move to..." onPress={() => handleAction(onMove)} itemStyle={itemStyle} textStyle={textStyle} destructiveTextStyle={destructiveTextStyle} />
          )}
          {onDelete && (
            <>
              <View style={separatorStyle} />
              <MenuItem icon={<TrashIcon color={themeColors.status?.danger ?? '#ef4444'} />} label="Delete" onPress={() => handleAction(onDelete)} destructive itemStyle={itemStyle} textStyle={textStyle} destructiveTextStyle={destructiveTextStyle} />
            </>
          )}
        </View>
      </Pressable>
    </Modal>
  );
}

FileContextMenu.displayName = 'FileContextMenu';
FolderContextMenu.displayName = 'FolderContextMenu';
