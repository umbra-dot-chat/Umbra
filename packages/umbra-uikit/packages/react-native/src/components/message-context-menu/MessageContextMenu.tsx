import React, { forwardRef, useMemo, useState, useCallback } from 'react';
import { View, Pressable, Text as RNText, Modal } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MessageContextMenuProps {
  /** Whether this is the current user's message. */
  isOwn?: boolean;
  /** Whether the current user can pin messages. @default false */
  canPin?: boolean;
  /** Whether the current user can delete messages. @default false */
  canDelete?: boolean;
  /** Whether the message is already pinned. @default false */
  isPinned?: boolean;
  /** Children (the trigger element). */
  children: React.ReactElement;

  // Callbacks
  onReply?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onDeleteForMe?: () => void;
  onPin?: () => void;
  onUnpin?: () => void;
  onCreateThread?: () => void;
  onCopyText?: () => void;
  onCopyLink?: () => void;
  onReact?: () => void;
  onForward?: () => void;

  style?: ViewStyle;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const MessageContextMenu = forwardRef<View, MessageContextMenuProps>(
  function MessageContextMenu(
    {
      isOwn = false,
      canPin = false,
      canDelete = false,
      isPinned = false,
      children,
      onReply,
      onEdit,
      onDelete,
      onDeleteForMe,
      onPin,
      onUnpin,
      onCreateThread,
      onCopyText,
      onCopyLink,
      onReact,
      onForward,
      style: userStyle,
    },
    ref,
  ) {
    const { theme } = useTheme();
    const tc = theme.colors;
    const [visible, setVisible] = useState(false);

    const open = useCallback(() => setVisible(true), []);
    const close = useCallback(() => setVisible(false), []);

    const handleAction = useCallback(
      (cb?: () => void) => () => {
        close();
        cb?.();
      },
      [close],
    );

    // -----------------------------------------------------------------------
    // Styles
    // -----------------------------------------------------------------------
    const overlayStyle = useMemo<ViewStyle>(
      () => ({
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: defaultSpacing.xl,
      }),
      [],
    );

    const sheetStyle = useMemo<ViewStyle>(
      () => ({
        width: '100%',
        maxWidth: 320,
        backgroundColor: tc.background.raised,
        borderRadius: defaultRadii.lg,
        paddingVertical: defaultSpacing.xs,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 24,
        elevation: 8,
      }),
      [tc],
    );

    const itemStyle = useMemo<ViewStyle>(
      () => ({
        paddingHorizontal: defaultSpacing.lg,
        paddingVertical: defaultSpacing.md,
      }),
      [],
    );

    const itemTextStyle = useMemo<TextStyle>(
      () => ({
        fontSize: defaultTypography.sizes.sm.fontSize,
        color: tc.text.onRaised,
      }),
      [tc],
    );

    const destructiveTextStyle = useMemo<TextStyle>(
      () => ({
        fontSize: defaultTypography.sizes.sm.fontSize,
        color: tc.status.danger,
      }),
      [tc],
    );

    const separatorStyle = useMemo<ViewStyle>(
      () => ({
        height: 1,
        marginVertical: defaultSpacing.xs,
        backgroundColor: tc.accent.dividerRaised,
      }),
      [tc],
    );

    // -----------------------------------------------------------------------
    // Menu items
    // -----------------------------------------------------------------------
    const items: Array<{
      label: string;
      onPress: () => void;
      destructive?: boolean;
      separator?: boolean;
    }> = [];

    if (onReply) items.push({ label: 'Reply', onPress: handleAction(onReply) });
    if (isOwn && onEdit) items.push({ label: 'Edit', onPress: handleAction(onEdit) });
    if (onReact) items.push({ label: 'React', onPress: handleAction(onReact) });
    if (onCreateThread) items.push({ label: 'Create Thread', onPress: handleAction(onCreateThread) });

    items.push({ label: '', onPress: () => {}, separator: true });

    if (canPin && !isPinned && onPin) items.push({ label: 'Pin Message', onPress: handleAction(onPin) });
    if (canPin && isPinned && onUnpin) items.push({ label: 'Unpin Message', onPress: handleAction(onUnpin) });
    if (onCopyText) items.push({ label: 'Copy Text', onPress: handleAction(onCopyText) });
    if (onCopyLink) items.push({ label: 'Copy Link', onPress: handleAction(onCopyLink) });
    if (onForward) items.push({ label: 'Forward', onPress: handleAction(onForward) });

    items.push({ label: '', onPress: () => {}, separator: true });

    if (onDeleteForMe) items.push({ label: 'Delete For Me', onPress: handleAction(onDeleteForMe) });
    if (canDelete && onDelete) items.push({ label: 'Delete', onPress: handleAction(onDelete), destructive: true });

    return (
      <View ref={ref} style={userStyle}>
        <Pressable onLongPress={open} accessibilityRole="button">
          {children}
        </Pressable>

        <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
          <Pressable style={overlayStyle} onPress={close}>
            <Pressable style={sheetStyle} onPress={() => {}}>
              {items.map((item, index) => {
                if (item.separator) {
                  return <View key={`sep-${index}`} style={separatorStyle} />;
                }
                return (
                  <Pressable
                    key={item.label}
                    style={itemStyle}
                    onPress={item.onPress}
                    accessibilityRole="menuitem"
                  >
                    <RNText style={item.destructive ? destructiveTextStyle : itemTextStyle}>
                      {item.label}
                    </RNText>
                  </Pressable>
                );
              })}
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    );
  },
);

MessageContextMenu.displayName = 'MessageContextMenu';
