/**
 * @module components/channel-list
 * @description React Native ChannelList for the Wisp design system.
 *
 * Reuses color resolution from `@coexist/wisp-core`. Renders via `<View>` + `<Text>`.
 * Collapsible category-grouped channel sidebar with type icons.
 * Supports optional drag-and-drop reordering of channels between categories.
 */

import React, { forwardRef, useMemo, useState, useCallback, useRef } from 'react';
import { View, Text, Pressable, ScrollView, PanResponder, Animated, Platform } from 'react-native';
import type {
  ViewProps,
  ViewStyle,
  TextStyle,
  GestureResponderEvent,
  LayoutChangeEvent,
  PanResponderInstance,
} from 'react-native';

/**
 * Creates a web-compatible onContextMenu handler that maps right-click
 * to the same handler used for mobile long-press.
 * Returns undefined on non-web platforms.
 */
function webContextMenu(handler: ((e: GestureResponderEvent) => void) | undefined) {
  if (Platform.OS !== 'web' || !handler) return undefined;
  return (e: any) => {
    e.preventDefault();
    // Build a synthetic GestureResponderEvent-like object with the coordinates
    const syntheticEvent = {
      nativeEvent: {
        pageX: e.clientX ?? e.pageX ?? 0,
        pageY: e.clientY ?? e.pageY ?? 0,
        locationX: 0,
        locationY: 0,
        target: e.target,
        identifier: 0,
        timestamp: Date.now(),
      },
      // Pass through for any other usage
      preventDefault: () => e.preventDefault(),
      stopPropagation: () => e.stopPropagation(),
    } as unknown as GestureResponderEvent;
    handler(syntheticEvent);
  };
}
import type {
  ChannelItem as ChannelItemType,
  ChannelCategory,
  ChannelType,
} from '@coexist/wisp-core/types/ChannelList.types';
import { resolveChannelListColors } from '@coexist/wisp-core/styles/ChannelList.styles';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';
import Svg, { Line, Path, Polyline } from 'react-native-svg';

// ---------------------------------------------------------------------------
// Props (RN-specific override — ViewProps instead of HTMLAttributes)
// ---------------------------------------------------------------------------

export interface ChannelListProps extends ViewProps {
  /** List of channel categories. */
  categories: ChannelCategory[];
  /** Called when a channel is pressed. */
  onChannelClick?: (channel: ChannelItemType) => void;
  /** Called when a channel is long-pressed (context menu). */
  onChannelLongPress?: (channel: ChannelItemType, event: GestureResponderEvent) => void;
  /** Called when a category collapse state toggles. */
  onCategoryToggle?: (categoryId: string) => void;
  /** Called when a category is long-pressed (context menu). */
  onCategoryLongPress?: (categoryId: string, event: GestureResponderEvent) => void;
  /** Called when a channel create action is triggered within a category. */
  onChannelCreate?: (categoryId: string) => void;
  /** Optional header element above the channel list (e.g. server name). */
  header?: React.ReactNode;
  /** Whether the list is loading. @default false */
  loading?: boolean;
  /** Show loading skeleton. @default false */
  skeleton?: boolean;
  /** Enable drag-and-drop reordering. @default false */
  draggable?: boolean;
  /** Called when a channel is dropped to a new position/category. */
  onChannelReorder?: (channelId: string, targetCategoryId: string | null, newIndex: number) => void;
  /** Called when a category header is dropped to a new position. */
  onCategoryReorder?: (categoryId: string, newIndex: number) => void;
  /** Render extra content below a channel row (e.g. voice channel participants). */
  renderChannelExtra?: (channel: ChannelItemType) => React.ReactNode;
  /** Override the default channel icon. Receives the channel and default icon element. */
  renderChannelIcon?: (channel: ChannelItemType, defaultIcon: React.ReactNode) => React.ReactNode;
}

// ---------------------------------------------------------------------------
// Channel hover gradient bar (web only)
// ---------------------------------------------------------------------------

let channelHoverCSSInjected = false;
function injectChannelHoverCSS() {
  if (channelHoverCSSInjected || Platform.OS !== 'web') return;
  channelHoverCSSInjected = true;
  const style = document.createElement('style');
  style.textContent = `
    [data-wisp-channel]:hover::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      margin-top: -8px;
      width: 3px;
      height: 16px;
      border-radius: 2px;
      background: linear-gradient(180deg, #8B5CF6, #EC4899, #3B82F6);
      opacity: 1;
      transition: opacity 0.15s ease;
    }
    [data-wisp-channel]::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      margin-top: -8px;
      width: 3px;
      height: 16px;
      border-radius: 2px;
      background: linear-gradient(180deg, #8B5CF6, #EC4899, #3B82F6);
      opacity: 0;
      transition: opacity 0.15s ease;
    }
  `;
  document.head.appendChild(style);
}

// ---------------------------------------------------------------------------
// Drag state types
// ---------------------------------------------------------------------------

interface DragState {
  channelId: string;
  channelName: string;
  channelType: ChannelType;
  originCategoryId: string;
}

interface DropTarget {
  categoryId: string;
  index: number;
  /** Y position in scroll-content coordinate space */
  y: number;
}

interface ItemPosition {
  /** Y within ScrollView content (from onLayout) */
  y: number;
  height: number;
  categoryId: string;
  index: number;
}

interface CategoryPosition {
  /** Y within ScrollView content (from onLayout) */
  y: number;
  height: number;
  index: number;
}

// ---------------------------------------------------------------------------
// Inline SVG Icons
// ---------------------------------------------------------------------------

function HashIcon({ size = 18, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? '#888'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Line x1={4} y1={9} x2={20} y2={9} />
      <Line x1={4} y1={15} x2={20} y2={15} />
      <Line x1={10} y1={3} x2={8} y2={21} />
      <Line x1={16} y1={3} x2={14} y2={21} />
    </Svg>
  );
}

function SpeakerIcon({ size = 18, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? '#888'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M11 5L6 9H2v6h4l5 4V5z" />
      <Path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <Path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </Svg>
  );
}

function MegaphoneIcon({ size = 18, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? '#888'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 11l18-5v12L3 13v-2z" />
      <Path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
    </Svg>
  );
}

function MessageSquareIcon({ size = 18, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? '#888'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </Svg>
  );
}

function MessagesIcon({ size = 18, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? '#888'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2z" />
      <Path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1" />
    </Svg>
  );
}

function FolderIcon({ size = 18, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? '#888'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </Svg>
  );
}

function ChevronIcon({ size = 12, color, collapsed }: { size?: number; color?: string; collapsed?: boolean }) {
  return (
    <View style={{ transform: [{ rotate: collapsed ? '-90deg' : '0deg' }], flexShrink: 0 }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? '#888'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <Polyline points="6,9 12,15 18,9" />
      </Svg>
    </View>
  );
}

function PlusIcon({ size = 14, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? '#888'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Line x1={12} y1={5} x2={12} y2={19} />
      <Line x1={5} y1={12} x2={19} y2={12} />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Channel type icon map
// ---------------------------------------------------------------------------

function ChannelTypeIcon({
  type,
  size,
  color,
}: {
  type: ChannelType;
  size?: number;
  color?: string;
}) {
  switch (type) {
    case 'voice':
      return <SpeakerIcon size={size} color={color} />;
    case 'announcement':
      return <MegaphoneIcon size={size} color={color} />;
    case 'thread':
      return <MessageSquareIcon size={size} color={color} />;
    case 'forum':
      return <MessagesIcon size={size} color={color} />;
    case 'files':
      return <FolderIcon size={size} color={color} />;
    case 'text':
    default:
      return <HashIcon size={size} color={color} />;
  }
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function ChannelListSkeleton({
  skeletonColor,
}: {
  skeletonColor: string;
}) {
  const catStyle: ViewStyle = {
    height: 10,
    width: '40%',
    borderRadius: defaultRadii.sm,
    backgroundColor: skeletonColor,
    marginTop: defaultSpacing.sm,
    marginBottom: defaultSpacing.xs,
    marginHorizontal: defaultSpacing.md,
  };

  const itemBaseStyle: ViewStyle = {
    height: 14,
    borderRadius: defaultRadii.sm,
    backgroundColor: skeletonColor,
    marginVertical: defaultSpacing.xs,
    marginHorizontal: defaultSpacing.md,
  };

  const widths: ('55%' | '70%' | '85%')[] = ['55%', '70%', '55%', '85%'];

  return (
    <>
      {[0, 1, 2].map((catIdx) => (
        <View key={catIdx}>
          <View style={catStyle} />
          {[0, 1, 2, 3].map((itemIdx) => (
            <View
              key={itemIdx}
              style={[itemBaseStyle, { width: widths[itemIdx % widths.length] }]}
            />
          ))}
        </View>
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Drop target calculation helper
// ---------------------------------------------------------------------------

function calculateDropTarget(
  /** Y in scroll-content coordinate space */
  contentY: number,
  draggedChannelId: string,
  itemPositions: Map<string, ItemPosition>,
  categoryPositions: Map<string, CategoryPosition>,
  categories: ChannelCategory[],
  collapsedMap: Record<string, boolean>,
): DropTarget | null {
  const insertionPoints: Array<{
    y: number;
    categoryId: string;
    index: number;
  }> = [];

  for (const cat of categories) {
    const isCollapsed = collapsedMap[cat.id] ?? false;
    const catPos = categoryPositions.get(cat.id);
    if (!catPos) continue;

    // Insertion point at index 0 — right after the category header
    const headerBottom = catPos.y + catPos.height;
    insertionPoints.push({
      y: headerBottom,
      categoryId: cat.id,
      index: 0,
    });

    if (isCollapsed) continue;

    // Insertion points between/after each channel
    let insertIdx = 0;
    for (let i = 0; i < cat.channels.length; i++) {
      const channel = cat.channels[i];
      if (channel.id === draggedChannelId) continue;

      const pos = itemPositions.get(channel.id);
      if (pos) {
        insertIdx++;
        const itemBottom = pos.y + pos.height;
        insertionPoints.push({
          y: itemBottom,
          categoryId: cat.id,
          index: insertIdx,
        });
      }
    }
  }

  if (insertionPoints.length === 0) return null;

  // Find closest insertion point
  let closest = insertionPoints[0];
  let closestDist = Math.abs(contentY - closest.y);

  for (let i = 1; i < insertionPoints.length; i++) {
    const dist = Math.abs(contentY - insertionPoints[i].y);
    if (dist < closestDist) {
      closest = insertionPoints[i];
      closestDist = dist;
    }
  }

  return {
    categoryId: closest.categoryId,
    index: closest.index,
    y: closest.y,
  };
}

// ---------------------------------------------------------------------------
// ChannelList
// ---------------------------------------------------------------------------

export const ChannelList = forwardRef<View, ChannelListProps>(
  function ChannelList(
    {
      categories,
      onChannelClick,
      onChannelLongPress,
      onCategoryToggle,
      onCategoryLongPress,
      onChannelCreate,
      header,
      loading = false,
      skeleton = false,
      draggable = false,
      onChannelReorder,
      onCategoryReorder,
      renderChannelExtra,
      renderChannelIcon,
      style: userStyle,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();

    // Track collapsed state per category
    const [collapsedMap, setCollapsedMap] = useState<Record<string, boolean>>(
      () => {
        const initial: Record<string, boolean> = {};
        for (const cat of categories) {
          if (cat.collapsed) {
            initial[cat.id] = true;
          }
        }
        return initial;
      },
    );

    // ----- Drag state -----
    const [dragState, setDragState] = useState<DragState | null>(null);
    // Finger pageY — updated every move. We use a ref + tick counter
    // to avoid re-rendering on every pixel while still getting React
    // state updates for the drop target.
    const fingerPageY = useRef<number>(0);
    const [dragTick, setDragTick] = useState(0);
    // Grab offset: distance from finger to top of the dragged item
    const grabOffset = useRef<number>(16);

    const itemPositions = useRef<Map<string, ItemPosition>>(new Map());
    const categoryPositions = useRef<Map<string, CategoryPosition>>(new Map());
    const scrollOffset = useRef<number>(0);
    const isDragging = useRef<boolean>(false);

    // ScrollView ref — we measure its window position for coordinate conversion
    const scrollViewRef = useRef<ScrollView | null>(null);
    const scrollViewPageY = useRef<number>(0);

    // ----- Colors -----
    const colors = useMemo(
      () => resolveChannelListColors(theme),
      [theme],
    );

    // ----- Drop target -----
    const dropTarget = useMemo<DropTarget | null>(() => {
      if (!dragState) return null;
      // Convert finger page Y → scroll content Y
      const contentY = fingerPageY.current - scrollViewPageY.current + scrollOffset.current;
      return calculateDropTarget(
        contentY,
        dragState.channelId,
        itemPositions.current,
        categoryPositions.current,
        categories,
        collapsedMap,
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dragState, categories, collapsedMap, dragTick]);

    // Keep a ref of current dropTarget for the end handler
    const dropTargetRef = useRef<DropTarget | null>(null);
    dropTargetRef.current = dropTarget;

    // ----- Styles -----
    const containerStyle: ViewStyle = useMemo(() => ({
      flex: 1,
      backgroundColor: 'transparent',
      width: '100%',
    }), [colors.bg]);

    const headerSlotStyle: ViewStyle = useMemo(() => ({
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: defaultSpacing.md,
      paddingHorizontal: defaultSpacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.headerBg,
      minHeight: 48,
    }), [colors.border, colors.headerBg]);

    const categoryHeaderStyle: ViewStyle = useMemo(() => ({
      flexDirection: 'row',
      alignItems: 'center',
      gap: defaultSpacing.xs,
      paddingVertical: defaultSpacing.xs,
      paddingHorizontal: defaultSpacing.sm,
      marginTop: defaultSpacing.sm,
      marginHorizontal: defaultSpacing.sm,
      borderRadius: defaultRadii.sm,
    }), []);

    const categoryLabelStyle: TextStyle = useMemo(() => ({
      fontSize: defaultTypography.sizes.xs.fontSize,
      lineHeight: defaultTypography.sizes.xs.lineHeight,
      fontWeight: String(defaultTypography.weights.semibold) as TextStyle['fontWeight'],
      color: colors.categoryText,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      textAlign: 'left',
      flex: 1,
    }), [colors.categoryText]);

    const badgeStyle: ViewStyle & TextStyle = useMemo(() => ({
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      paddingHorizontal: 5,
      backgroundColor: colors.badgeBg,
    }), [colors.badgeBg]);

    const badgeTextStyle: TextStyle = useMemo(() => ({
      fontSize: defaultTypography.sizes['2xs'].fontSize,
      lineHeight: defaultTypography.sizes['2xs'].lineHeight,
      fontWeight: String(defaultTypography.weights.semibold) as TextStyle['fontWeight'],
      color: colors.badgeText,
    }), [colors.badgeText]);

    const loadingTextStyle: TextStyle = useMemo(() => ({
      fontSize: defaultTypography.sizes.sm.fontSize,
      color: colors.categoryText,
    }), [colors.categoryText]);

    // ----- Drag styles -----
    const ghostBaseStyle: ViewStyle = useMemo(() => ({
      position: 'absolute',
      left: defaultSpacing.md,
      right: defaultSpacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: defaultSpacing.sm,
      paddingVertical: defaultSpacing.xs + 1,
      paddingHorizontal: defaultSpacing.sm,
      borderRadius: defaultRadii.md,
      backgroundColor: colors.channelActiveBg,
      opacity: 0.9,
      minHeight: 32,
      zIndex: 1000,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 12,
    }), [colors.channelActiveBg]);

    const insertionLineStyle: ViewStyle = useMemo(() => ({
      position: 'absolute',
      left: defaultSpacing.sm + defaultSpacing.sm,
      right: defaultSpacing.sm + defaultSpacing.sm,
      height: 2,
      backgroundColor: '#3B82F6',
      borderRadius: 1,
      zIndex: 999,
    }), []);

    // ----- Handlers -----
    const handleCategoryToggle = useCallback(
      (categoryId: string) => {
        setCollapsedMap((prev) => ({
          ...prev,
          [categoryId]: !prev[categoryId],
        }));
        onCategoryToggle?.(categoryId);
      },
      [onCategoryToggle],
    );

    const handleChannelClick = useCallback(
      (channel: ChannelItemType) => {
        if (isDragging.current) return;
        onChannelClick?.(channel);
      },
      [onChannelClick],
    );

    // Measure the ScrollView's position in window coordinates
    const measureScrollView = useCallback(() => {
      if (scrollViewRef.current) {
        (scrollViewRef.current as any).measureInWindow?.(
          (_x: number, y: number) => {
            scrollViewPageY.current = y;
          },
        );
      }
    }, []);

    const handleDragStart = useCallback(
      (channel: ChannelItemType, categoryId: string, pageY: number) => {
        if (!draggable) return;

        // Measure ScrollView position right before drag starts
        measureScrollView();

        isDragging.current = true;
        fingerPageY.current = pageY;

        // Calculate grab offset: distance from finger to item top
        const itemPos = itemPositions.current.get(channel.id);
        if (itemPos) {
          // Convert item's scroll-content Y to page Y
          const itemPageY = itemPos.y - scrollOffset.current + scrollViewPageY.current;
          grabOffset.current = pageY - itemPageY;
        } else {
          grabOffset.current = 16;
        }

        setDragState({
          channelId: channel.id,
          channelName: channel.name,
          channelType: channel.type ?? 'text',
          originCategoryId: categoryId,
        });
        setDragTick(1);
      },
      [draggable, measureScrollView],
    );

    const handleDragMove = useCallback(
      (pageY: number) => {
        if (!isDragging.current) return;
        fingerPageY.current = pageY;
        setDragTick((t) => t + 1);
      },
      [],
    );

    // Keep refs for latest callbacks
    const onChannelReorderRef = useRef(onChannelReorder);
    onChannelReorderRef.current = onChannelReorder;
    const dragStateRef = useRef(dragState);
    dragStateRef.current = dragState;

    const handleDragEnd = useCallback(() => {
      if (!isDragging.current) {
        setDragState(null);
        return;
      }

      const dt = dropTargetRef.current;
      const ds = dragStateRef.current;
      if (dt && ds && onChannelReorderRef.current) {
        onChannelReorderRef.current(ds.channelId, dt.categoryId, dt.index);
      }

      isDragging.current = false;
      setDragState(null);
    }, []);

    // ----- Layout tracking -----
    // onLayout gives us positions relative to the ScrollView content, which
    // is exactly what we store. No offset adjustments needed — the layout
    // coordinates are in the scroll content coordinate space.
    const handleChannelLayout = useCallback(
      (channelId: string, categoryId: string, index: number) =>
        (event: LayoutChangeEvent) => {
          const { y, height } = event.nativeEvent.layout;
          itemPositions.current.set(channelId, { y, height, categoryId, index });
        },
      [],
    );

    const handleCategoryLayout = useCallback(
      (categoryId: string, index: number) =>
        (event: LayoutChangeEvent) => {
          const { y, height } = event.nativeEvent.layout;
          categoryPositions.current.set(categoryId, { y, height, index });
        },
      [],
    );

    // ----- PanResponder -----
    const dragMoveRef = useRef(handleDragMove);
    dragMoveRef.current = handleDragMove;
    const dragEndRef = useRef(handleDragEnd);
    dragEndRef.current = handleDragEnd;

    const panResponder = useRef<PanResponderInstance>(
      PanResponder.create({
        onStartShouldSetPanResponder: () => isDragging.current,
        onMoveShouldSetPanResponder: () => isDragging.current,
        onPanResponderMove: (_evt, gestureState) => {
          if (isDragging.current) {
            dragMoveRef.current(gestureState.moveY);
          }
        },
        onPanResponderRelease: () => {
          dragEndRef.current();
        },
        onPanResponderTerminate: () => {
          isDragging.current = false;
          setDragState(null);
        },
      }),
    ).current;

    // ----- Render: Channel -----
    const renderChannel = useCallback(
      (channel: ChannelItemType, categoryId: string, channelIndex: number) => {
        const active = channel.active ?? false;
        const muted = channel.muted ?? false;
        const type = channel.type ?? 'text';
        const hasUnread = (channel.unreadCount ?? 0) > 0;
        const isBeingDragged = dragState?.channelId === channel.id;

        // Inject channel hover CSS on first render (web only)
        if (Platform.OS === 'web') injectChannelHoverCSS();

        const itemStyle: ViewStyle = {
          flexDirection: 'row',
          alignItems: 'center',
          gap: defaultSpacing.sm,
          paddingVertical: defaultSpacing.xs + 1,
          paddingHorizontal: defaultSpacing.sm,
          marginVertical: 1,
          marginHorizontal: defaultSpacing.sm,
          borderRadius: defaultRadii.md,
          backgroundColor: active ? colors.channelActiveBg : 'transparent',
          opacity: isBeingDragged ? 0.3 : muted && !active ? 0.5 : 1,
          minHeight: 32,
          position: 'relative' as const,
          overflow: 'hidden' as const,
        };

        const iconContainerStyle: ViewStyle = {
          width: 18, height: 18,
          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        };

        const iconColor = active ? colors.channelIconActive : colors.channelIcon;

        const nameStyle: TextStyle = {
          fontSize: defaultTypography.sizes.sm.fontSize,
          lineHeight: defaultTypography.sizes.sm.lineHeight,
          fontWeight: active || hasUnread
            ? String(defaultTypography.weights.semibold) as TextStyle['fontWeight']
            : String(defaultTypography.weights.regular) as TextStyle['fontWeight'],
          color: active ? colors.channelTextActive : colors.channelText,
          flex: 1,
        };

        const handleLongPress = (e: GestureResponderEvent) => {
          if (draggable) {
            handleDragStart(channel, categoryId, e.nativeEvent.pageY);
          } else if (onChannelLongPress) {
            onChannelLongPress(channel, e);
          }
        };

        // Web context menu: always opens channel context menu (right-click)
        const contextMenuHandler = onChannelLongPress
          ? webContextMenu((e) => onChannelLongPress(channel, e))
          : undefined;

        // Spread web-only props (onContextMenu is not typed in RN but works on web)
        const webProps: any = {};
        if (contextMenuHandler) webProps.onContextMenu = contextMenuHandler;
        if (Platform.OS === 'web' && !active) webProps['data-wisp-channel'] = '';

        return (
          <View
            key={channel.id}
            onLayout={handleChannelLayout(channel.id, categoryId, channelIndex)}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${channel.name} channel`}
              accessibilityState={{ selected: active }}
              onPress={() => handleChannelClick(channel)}
              onLongPress={handleLongPress}
              delayLongPress={draggable ? 300 : undefined}
              style={itemStyle}
              {...webProps}
            >
              <View style={iconContainerStyle}>
                {renderChannelIcon
                  ? renderChannelIcon(channel, channel.icon ?? <ChannelTypeIcon type={type} size={18} color={iconColor} />)
                  : (channel.icon ?? <ChannelTypeIcon type={type} size={18} color={iconColor} />)}
              </View>
              <Text style={nameStyle} numberOfLines={1}>{channel.name}</Text>
              {hasUnread && !muted && (
                <View style={badgeStyle}>
                  <Text style={badgeTextStyle}>
                    {channel.hasMention ? `@${channel.unreadCount}` : channel.unreadCount}
                  </Text>
                </View>
              )}
            </Pressable>
            {renderChannelExtra?.(channel)}
          </View>
        );
      },
      [
        colors, badgeStyle, badgeTextStyle,
        handleChannelClick, onChannelLongPress,
        draggable, dragState,
        renderChannelExtra, renderChannelIcon,
        handleDragStart, handleChannelLayout,
      ],
    );

    // ----- Render: Category -----
    const renderCategory = useCallback(
      (category: ChannelCategory, categoryIndex: number) => {
        const isCollapsed = collapsedMap[category.id] ?? false;

        // Web context menu for category right-click
        const catContextHandler = onCategoryLongPress
          ? webContextMenu((e) => onCategoryLongPress(category.id, e))
          : undefined;
        const catWebProps = catContextHandler
          ? { onContextMenu: catContextHandler } as any
          : {};

        return (
          <View
            key={category.id}
            accessibilityRole="summary"
            accessibilityLabel={category.label}
            onLayout={handleCategoryLayout(category.id, categoryIndex)}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${category.label}, ${isCollapsed ? 'collapsed' : 'expanded'}`}
              accessibilityState={{ expanded: !isCollapsed }}
              onPress={() => handleCategoryToggle(category.id)}
              onLongPress={onCategoryLongPress ? (e) => onCategoryLongPress(category.id, e) : undefined}
              style={categoryHeaderStyle}
              {...catWebProps}
            >
              <ChevronIcon size={12} color={colors.categoryIcon} collapsed={isCollapsed} />
              <Text style={categoryLabelStyle} numberOfLines={1}>{category.label}</Text>
              {onChannelCreate && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Create channel in ${category.label}`}
                  onPress={() => onChannelCreate(category.id)}
                  hitSlop={6}
                  style={{ width: 18, height: 18, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                >
                  <PlusIcon size={14} color={colors.categoryIcon} />
                </Pressable>
              )}
            </Pressable>
            {!isCollapsed &&
              category.channels.map((channel, idx) =>
                renderChannel(channel, category.id, idx),
              )}
          </View>
        );
      },
      [
        collapsedMap, categoryHeaderStyle, categoryLabelStyle,
        colors.categoryIcon, handleCategoryToggle,
        onCategoryLongPress, onChannelCreate,
        renderChannel, handleCategoryLayout,
      ],
    );

    // ----- Drag: Ghost overlay -----
    // The ghost is positioned inside the drag overlay which covers the
    // ScrollView area. We compute its `top` as:
    //   fingerPageY - grabOffset - scrollViewPageY
    // This converts page coordinates to ScrollView-local coordinates.
    const ghostTop = dragState
      ? fingerPageY.current - grabOffset.current - scrollViewPageY.current
      : 0;

    // ----- Drag: Insertion line -----
    // dropTarget.y is in scroll-content coordinates. Convert to
    // ScrollView-visible-area coordinates by subtracting scroll offset.
    const insertionTop = dropTarget
      ? dropTarget.y - scrollOffset.current
      : 0;

    return (
      <View
        ref={ref}
        accessibilityRole="menu"
        accessibilityLabel="Channel list"
        style={[containerStyle, userStyle as ViewStyle]}
        {...rest}
      >
        {/* Header slot */}
        {header && <View style={headerSlotStyle}>{header}</View>}

        {/* Scrollable content with drag responder */}
        <View style={{ flex: 1 }} {...(draggable ? panResponder.panHandlers : {})}>
          <ScrollView
            ref={scrollViewRef}
            style={{ flex: 1 }}
            scrollEnabled={!dragState}
            onScroll={(e) => {
              scrollOffset.current = e.nativeEvent.contentOffset.y;
              if (isDragging.current) setDragTick((t) => t + 1);
            }}
            scrollEventThrottle={16}
            onLayout={() => measureScrollView()}
          >
            {loading && !skeleton && (
              <View style={{ alignItems: 'center', justifyContent: 'center', padding: defaultSpacing.xl }}>
                <Text style={loadingTextStyle}>Loading channels...</Text>
              </View>
            )}
            {skeleton && <ChannelListSkeleton skeletonColor={colors.skeleton} />}
            {!loading && !skeleton && categories.map((cat, idx) =>
              renderCategory(cat, idx),
            )}
          </ScrollView>

          {/* Drag overlay: ghost + insertion line */}
          {draggable && dragState && (
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                zIndex: 998,
              }}
            >
              {/* Insertion line */}
              {dropTarget && (
                <View
                  style={[insertionLineStyle, { top: insertionTop - 1 }]}
                />
              )}
              {/* Ghost */}
              <View
                style={[ghostBaseStyle, { top: ghostTop }]}
              >
                <View style={{ width: 18, height: 18, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <ChannelTypeIcon type={dragState.channelType} size={18} color={colors.channelIconActive} />
                </View>
                <Text
                  style={{
                    fontSize: defaultTypography.sizes.sm.fontSize,
                    lineHeight: defaultTypography.sizes.sm.lineHeight,
                    fontWeight: String(defaultTypography.weights.semibold) as TextStyle['fontWeight'],
                    color: colors.channelTextActive,
                    flex: 1,
                  }}
                  numberOfLines={1}
                >
                  {dragState.channelName}
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>
    );
  },
);

ChannelList.displayName = 'ChannelList';
