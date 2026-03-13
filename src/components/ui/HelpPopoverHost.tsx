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
  Pressable,
  ScrollView,
  Dimensions,
  StyleSheet,
  Platform,
} from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import { Box, Button, Text, useTheme } from '@coexist/wisp-react-native';
import { useHelp } from '@/contexts/HelpContext';
import { dbg } from '@/utils/debug';

const SCREEN_PADDING = 12;
const POPOVER_WIDTH = 340;
const POPOVER_MAX_HEIGHT = 420;

export function HelpPopoverHost() {
  if (__DEV__) dbg.trackRender('HelpPopoverHost');
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
    <Box
      style={{
        ...StyleSheet.absoluteFillObject,
        zIndex: 99999,
      }}
      pointerEvents="box-none"
    >
      {/* Dismiss backdrop */}
      <Pressable style={StyleSheet.absoluteFill} onPress={closePopover} />

      {/* Positioned popup */}
      <Box
        style={{
          position: 'absolute',
          ...position,
        }}
        onLayout={handleLayout}
        pointerEvents="box-none"
      >
        <Box
          style={{
            width: POPOVER_WIDTH,
            maxHeight: POPOVER_MAX_HEIGHT,
            borderRadius: 16,
            overflow: 'hidden',
            backgroundColor: tc.background.canvas,
            ...Platform.select({
              web: {
                boxShadow: `0 12px 40px ${tc.background.overlay}`,
              } as any,
              default: {
                shadowColor: tc.background.overlay,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.2,
                shadowRadius: 24,
                elevation: 8,
              },
            }),
          }}
        >
          {/* Header */}
          <Box
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 20,
              paddingTop: 18,
              paddingBottom: 12,
              borderBottomWidth: 1,
              borderBottomColor: tc.border.subtle,
            }}
          >
            <Box
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                flex: 1,
              }}
            >
              {/* Icon badge */}
              <Box
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: tc.accent.primary + '15',
                }}
              >
                <Text size="sm" weight="bold" style={{ color: tc.accent.primary }}>
                  {popoverState.icon}
                </Text>
              </Box>
              <Text
                size="md"
                weight="bold"
                style={{ color: tc.text.primary, flex: 1 }}
                numberOfLines={1}
              >
                {popoverState.title}
              </Text>
            </Box>

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
              <Text size="md" style={{ color: tc.text.muted, lineHeight: 20 }}>
                {'\u00D7'}
              </Text>
            </Pressable>
          </Box>

          {/* Content */}
          <ScrollView
            style={{ maxHeight: 300 }}
            contentContainerStyle={{ padding: 20, gap: 12 }}
            showsVerticalScrollIndicator={false}
          >
            {popoverState.children}
          </ScrollView>

          {/* Footer — Got It button */}
          <Box
            style={{
              paddingHorizontal: 20,
              paddingBottom: 16,
              paddingTop: 8,
              borderTopWidth: 1,
              borderTopColor: tc.border.subtle,
            }}
          >
            <Button
              variant="primary"
              size="md"
              fullWidth
              onPress={closePopover}
            >
              Got it
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

HelpPopoverHost.displayName = 'HelpPopoverHost';
