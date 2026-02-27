/**
 * HelpPopoverHost — Root-level popover renderer for help tooltips.
 *
 * Renders at the top of the component tree (in _layout.tsx) so that
 * help tooltips always appear in viewport coordinates, avoiding
 * stacking context and overflow issues from parent containers.
 *
 * Communicates with HelpIndicator via HelpContext (openPopover/closePopover).
 */

import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Pressable,
  ScrollView,
  Dimensions,
  StyleSheet,
  Text as RNText,
  Platform,
} from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import { useTheme } from '@coexist/wisp-react-native';
import { useHelp } from '@/contexts/HelpContext';

const SCREEN_PADDING = 12;
const POPOVER_WIDTH = 340;
const POPOVER_MAX_HEIGHT = 420;

export function HelpPopoverHost() {
  const { popoverState, closePopover } = useHelp();
  const { theme } = useTheme();
  const tc = theme.colors;
  const [contentHeight, setContentHeight] = useState<number | null>(null);

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    const { height } = e.nativeEvent.layout;
    setContentHeight(height);
  }, []);

  // Calculate clamped position
  const position = useMemo(() => {
    if (!popoverState) return { left: 0, top: 0 };

    const { width: screenW, height: screenH } = Dimensions.get('window');
    let x = popoverState.anchor.x;
    let y = popoverState.anchor.y;

    // Clamp horizontally
    const maxX = screenW - POPOVER_WIDTH - SCREEN_PADDING;
    x = Math.max(SCREEN_PADDING, Math.min(x, maxX));

    // Clamp vertically
    const h = contentHeight ?? POPOVER_MAX_HEIGHT;
    const maxY = screenH - h - SCREEN_PADDING;
    y = Math.max(SCREEN_PADDING, Math.min(y, maxY));

    return { left: x, top: y };
  }, [popoverState, contentHeight]);

  if (!popoverState) return null;

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      {/* Dismiss backdrop */}
      <Pressable style={StyleSheet.absoluteFill} onPress={closePopover} />

      {/* Positioned popup */}
      <View
        style={[styles.popoverContainer, position]}
        onLayout={handleLayout}
        pointerEvents="box-none"
      >
        <View
          style={[
            styles.popoverCard,
            {
              backgroundColor: tc.background.canvas,
              ...Platform.select({
                web: {
                  boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
                } as any,
                default: {
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.2,
                  shadowRadius: 24,
                  elevation: 8,
                },
              }),
            },
          ]}
        >
          {/* Header */}
          <View
            style={[
              styles.header,
              { borderBottomColor: tc.border.subtle },
            ]}
          >
            <View style={styles.headerLeft}>
              {/* Icon badge */}
              <View
                style={[
                  styles.iconBadge,
                  { backgroundColor: tc.accent.primary + '15' },
                ]}
              >
                <RNText
                  style={{
                    fontSize: 14,
                    fontWeight: '700',
                    color: tc.accent.primary,
                  }}
                >
                  {popoverState.icon}
                </RNText>
              </View>
              <RNText
                style={{
                  fontSize: 16,
                  fontWeight: '700',
                  color: tc.text.primary,
                  flex: 1,
                }}
                numberOfLines={1}
              >
                {popoverState.title}
              </RNText>
            </View>

            {/* Close button */}
            <Pressable
              onPress={closePopover}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={({ pressed }) => ({
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: pressed ? tc.background.sunken : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              })}
            >
              <RNText
                style={{
                  fontSize: 18,
                  color: tc.text.muted,
                  lineHeight: 20,
                }}
              >
                {'\u00D7'}
              </RNText>
            </Pressable>
          </View>

          {/* Content */}
          <ScrollView
            style={{ maxHeight: 300 }}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {popoverState.children}
          </ScrollView>

          {/* Footer — Got It button */}
          <View
            style={[
              styles.footer,
              { borderTopColor: tc.border.subtle },
            ]}
          >
            <Pressable
              onPress={closePopover}
              style={({ pressed }) => ({
                paddingVertical: 10,
                borderRadius: 10,
                backgroundColor: pressed
                  ? tc.accent.primary + 'DD'
                  : tc.accent.primary,
                alignItems: 'center',
              })}
            >
              <RNText
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: '#FFFFFF',
                }}
              >
                Got it
              </RNText>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 99999, // Must appear above modals
  },
  popoverContainer: {
    position: 'absolute',
  },
  popoverCard: {
    width: POPOVER_WIDTH,
    maxHeight: POPOVER_MAX_HEIGHT,
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    padding: 20,
    gap: 12,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 8,
    borderTopWidth: 1,
  },
});

HelpPopoverHost.displayName = 'HelpPopoverHost';
