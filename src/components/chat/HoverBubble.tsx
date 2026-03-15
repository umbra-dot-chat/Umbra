import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Animated, Pressable, View, useWindowDimensions, Platform } from 'react-native';
import { Box, Text, useTheme, MessageActionBar } from '@coexist/wisp-react-native';
import { ReplyIcon, ThreadIcon, CopyIcon, ForwardIcon, PinIcon, TrashIcon, EditIcon } from '@/components/ui';
import { SlotRenderer } from '@/components/plugins/SlotRenderer';
import { useAnimatedToggle } from '@/hooks/useAnimatedToggle';
import { useTranslation } from 'react-i18next';
import { AnimatedPresence } from '@/components/ui/AnimatedPresence';
import { dbg } from '@/utils/debug';

// Lazy-load createPortal only on web to avoid react-dom import in native/test
let createPortal: ((children: React.ReactNode, container: Element) => React.ReactPortal) | null = null;
if (Platform.OS === 'web') {
  try {
    createPortal = require('react-dom').createPortal;
  } catch {}
}

// ---------------------------------------------------------------------------
// Menu dimensions for smart positioning
// ---------------------------------------------------------------------------
const MENU_WIDTH = 200;
const MENU_ITEM_HEIGHT = 36;
const MENU_SEPARATOR_HEIGHT = 9;
const MENU_PADDING = 6;
const MENU_ITEMS = 7; // Reply, Thread, Copy, Edit (optional), Forward, Pin, Delete
const MENU_ESTIMATED_HEIGHT =
  MENU_ITEMS * MENU_ITEM_HEIGHT + MENU_SEPARATOR_HEIGHT + MENU_PADDING * 2;
const SCREEN_MARGIN = 8;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface HoverBubbleProps {
  id: string;
  align: 'incoming' | 'outgoing';
  /** @deprecated — hover state is now managed internally. Ignored if passed. */
  hoveredMessage?: string | null;
  /** @deprecated — hover state is now managed internally. Ignored if passed. */
  onHoverIn?: (id: string) => void;
  /** @deprecated — hover state is now managed internally. Ignored if passed. */
  onHoverOut?: () => void;
  actions: { key: string; label: string; icon: React.ReactNode; onClick: () => void }[];
  contextActions: {
    onReply: () => void;
    onThread: () => void;
    onCopy: () => void;
    onForward: () => void;
    onPin: () => void;
    onDelete: () => void;
    onEdit?: () => void;
  };
  themeColors: any;
  children: React.ReactNode;
  /** Message data for plugin message-actions slot + memo fingerprint */
  message?: { id: string; text: string; conversationId?: string; senderDid?: string; edited?: boolean; reactionsCount?: number; status?: string };
}

// ---------------------------------------------------------------------------
// Context menu item
// ---------------------------------------------------------------------------
interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  danger?: boolean;
  colors: any;
}

function ContextMenuItem({ icon, label, onPress, danger, colors }: MenuItemProps) {
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        height: MENU_ITEM_HEIGHT,
        paddingHorizontal: 12,
        borderRadius: 6,
        backgroundColor: hovered ? colors.background.sunken : 'transparent',
      }}
    >
      {icon}
      <Text
        size="sm"
        style={{ color: danger ? colors.status.danger : colors.text.primary }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// HoverBubble
// ---------------------------------------------------------------------------
export const HoverBubble = React.memo(function HoverBubble({
  id, align,
  actions, contextActions, themeColors, children, message,
}: HoverBubbleProps) {
  if (__DEV__) dbg.trackRender('HoverBubble');
  const isOut = align === 'outgoing';
  const { theme } = useTheme();
  const colors = theme.colors;
  const { width: winW, height: winH } = useWindowDimensions();
  const { t } = useTranslation('chat');

  // ── Local hover state — eliminates parent re-render cascade ──
  const [hovered, setHovered] = useState(false);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const localHoverIn = useCallback(() => {
    if (hoverTimeoutRef.current) { clearTimeout(hoverTimeoutRef.current); hoverTimeoutRef.current = null; }
    setHovered(true);
  }, []);
  const localHoverOut = useCallback(() => {
    hoverTimeoutRef.current = setTimeout(() => setHovered(false), 150);
  }, []);
  const showBar = hovered;

  // Animated action bar fade
  const { animatedValue: barOpacity, shouldRender: shouldRenderBar } = useAnimatedToggle(showBar, {
    duration: 150,
  });

  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const pressableRef = useRef<View>(null);

  // --- Right-click handler (web) ---
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const node = pressableRef.current as unknown as HTMLElement | null;
    if (!node) return;

    const handler = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Smart positioning: keep menu on screen
      let x = e.clientX;
      let y = e.clientY;

      if (x + MENU_WIDTH + SCREEN_MARGIN > winW) {
        x = winW - MENU_WIDTH - SCREEN_MARGIN;
      }
      if (x < SCREEN_MARGIN) x = SCREEN_MARGIN;

      if (y + MENU_ESTIMATED_HEIGHT + SCREEN_MARGIN > winH) {
        y = winH - MENU_ESTIMATED_HEIGHT - SCREEN_MARGIN;
      }
      if (y < SCREEN_MARGIN) y = SCREEN_MARGIN;

      setMenuPos({ x, y });
      setMenuOpen(true);
    };

    node.addEventListener('contextmenu', handler);
    return () => node.removeEventListener('contextmenu', handler);
  }, [winW, winH]);

  // --- Close on Escape key ---
  useEffect(() => {
    if (!menuOpen || Platform.OS !== 'web') return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [menuOpen]);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const handleAction = useCallback(
    (action: () => void) => {
      setMenuOpen(false);
      action();
    },
    [],
  );

  return (
    <>
      <Pressable
        ref={pressableRef}
        onHoverIn={localHoverIn}
        onHoverOut={localHoverOut}
        style={{
          alignSelf: isOut ? 'flex-end' : 'flex-start',
          maxWidth: '85%',
          position: 'relative' as any,
        }}
      >
        {shouldRenderBar && (
          <Animated.View
            style={{
              position: 'absolute' as any,
              top: -28,
              ...(isOut ? { right: 0 } : { left: 0 }),
              zIndex: 10,
              opacity: barOpacity,
              pointerEvents: showBar ? ('auto' as any) : ('none' as any),
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <MessageActionBar actions={actions} />
            {message && (
              <SlotRenderer
                slot="message-actions"
                props={{ message }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
              />
            )}
          </Animated.View>
        )}
        {children}
      </Pressable>

      {/* Context menu — portaled to document.body so position:fixed works regardless of parent transforms */}
      {menuOpen && Platform.OS === 'web' && createPortal?.(
        <>
          {/* Backdrop */}
          <Pressable
            onPress={closeMenu}
            style={{
              position: 'fixed' as any,
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 9998,
            }}
          />
          {/* Menu */}
          <AnimatedPresence
            visible={menuOpen}
            preset="scaleIn"
            options={{ duration: 150 }}
            style={{
              position: 'fixed' as any,
              left: menuPos.x,
              top: menuPos.y,
              width: MENU_WIDTH,
              zIndex: 9999,
            }}
          >
            <Box
              style={{
                backgroundColor: colors.background.canvas,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: colors.border.subtle,
                paddingVertical: MENU_PADDING,
                paddingHorizontal: 4,
                // Shadow
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.15,
                shadowRadius: 24,
                elevation: 8,
              }}
            >
            <ContextMenuItem
              icon={<ReplyIcon size={14} color={colors.text.secondary} />}
              label={t('reply')}
              onPress={() => handleAction(contextActions.onReply)}
              colors={colors}
            />
            <ContextMenuItem
              icon={<ThreadIcon size={14} color={colors.text.secondary} />}
              label="Thread"
              onPress={() => handleAction(contextActions.onThread)}
              colors={colors}
            />
            <ContextMenuItem
              icon={<CopyIcon size={14} color={colors.text.secondary} />}
              label={t('copyMessage')}
              onPress={() => handleAction(contextActions.onCopy)}
              colors={colors}
            />
            {contextActions.onEdit && (
              <ContextMenuItem
                icon={<EditIcon size={14} color={colors.text.secondary} />}
                label={t('editMessageAction')}
                onPress={() => handleAction(contextActions.onEdit!)}
                colors={colors}
              />
            )}
            <ContextMenuItem
              icon={<ForwardIcon size={14} color={colors.text.secondary} />}
              label={t('forward')}
              onPress={() => handleAction(contextActions.onForward)}
              colors={colors}
            />
            <ContextMenuItem
              icon={<PinIcon size={14} color={colors.text.secondary} />}
              label={t('pinMessage')}
              onPress={() => handleAction(contextActions.onPin)}
              colors={colors}
            />
            {/* Separator */}
            <Box
              style={{
                height: 1,
                backgroundColor: colors.border.subtle,
                marginVertical: 4,
                marginHorizontal: 8,
              }}
            />
            <ContextMenuItem
              icon={<TrashIcon size={14} color={colors.status.danger} />}
              label={t('deleteMessage')}
              onPress={() => handleAction(contextActions.onDelete)}
              danger
              colors={colors}
            />
            </Box>
          </AnimatedPresence>
        </>,
        document.body,
      )}
    </>
  );
}, (prev, next) => {
  // Custom comparator: skip re-render if the message data hasn't changed.
  // Actions/contextActions are new objects every parent render but functionally
  // identical for the same message, so we compare by message fields.
  //
  // IMPORTANT: We do NOT compare `children` — the parent recreates children JSX
  // on every render (new object ref), but the visual output is identical when the
  // message data is unchanged. Comparing children defeats the entire memo.
  if (prev.id !== next.id) return false;
  if (prev.align !== next.align) return false;
  if (prev.message?.id !== next.message?.id) return false;
  if (prev.message?.text !== next.message?.text) return false;
  if (prev.message?.edited !== next.message?.edited) return false;
  if (prev.message?.reactionsCount !== next.message?.reactionsCount) return false;
  if (prev.message?.status !== next.message?.status) return false;
  // themeColors is the same object within a theme, only changes on theme switch
  if (prev.themeColors !== next.themeColors) return false;
  return true;
});
