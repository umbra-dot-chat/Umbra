/**
 * NewChatMenu — Dropdown menu from the "+" button in the sidebar.
 *
 * Shows two options:
 * - "New DM" → opens friend picker dialog
 * - "New Group" → opens CreateGroupDialog
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { View, Platform } from 'react-native';
import { Button, Text, useTheme } from '@coexist/wisp-react-native';
import { UsersIcon, MessageIcon } from '@/components/icons';

export interface NewChatMenuProps {
  visible: boolean;
  onClose: () => void;
  onNewDm: () => void;
  onNewGroup: () => void;
}

export function NewChatMenu({ visible, onClose, onNewDm, onNewGroup }: NewChatMenuProps) {
  const { theme } = useTheme();
  const tc = theme.colors;
  const menuRef = useRef<View>(null);
  // Track whether an internal item was clicked so the outside-click handler skips closing
  const internalClickRef = useRef(false);

  // Close menu on click outside (web only).
  // Uses mousedown (fires before click/onPress) to detect outside clicks.
  // Internal Pressable items set the flag on onPressIn (also mousedown-phase)
  // before this handler checks it.
  useEffect(() => {
    if (!visible || Platform.OS !== 'web') return;

    const handleMouseDown = (e: MouseEvent) => {
      // Check if click target is inside the menu DOM node
      const menuEl = menuRef.current;
      if (menuEl) {
        const domNode = menuEl as unknown as HTMLElement;
        if (domNode && typeof domNode.contains === 'function' && domNode.contains(e.target as Node)) {
          return; // Click inside menu — don't close
        }
      }
      onClose();
    };

    // Delay adding the listener so the current pointer event that opened the menu
    // doesn't immediately close it
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleMouseDown);
    }, 50);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [visible, onClose]);

  const handleNewDm = useCallback(() => {
    internalClickRef.current = true;
    onNewDm();
    onClose();
  }, [onNewDm, onClose]);

  const handleNewGroup = useCallback(() => {
    internalClickRef.current = true;
    onNewGroup();
    onClose();
  }, [onNewGroup, onClose]);

  if (!visible) return null;

  return (
    <View
      ref={menuRef}
      style={{
        position: 'absolute',
        top: '100%',
        right: 0,
        marginTop: 4,
        zIndex: 100,
        backgroundColor: tc.background.surface,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: tc.border.strong,
        overflow: 'hidden',
        minWidth: 180,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
      }}
    >
      <Button
        variant="tertiary"
        size="sm"
        onPress={handleNewDm}
        iconLeft={<MessageIcon size={16} color={tc.text.secondary} />}
        style={{ justifyContent: 'flex-start', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 0 }}
      >
        <Text size="sm" weight="medium">New DM</Text>
      </Button>

      <View style={{ height: 1, backgroundColor: tc.border.strong }} />

      <Button
        variant="tertiary"
        size="sm"
        onPress={handleNewGroup}
        iconLeft={<UsersIcon size={16} color={tc.text.secondary} />}
        style={{ justifyContent: 'flex-start', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 0 }}
      >
        <Text size="sm" weight="medium">New Group</Text>
      </Button>
    </View>
  );
}
