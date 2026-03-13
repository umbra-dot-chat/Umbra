import React, { useRef, useEffect } from 'react';
import { Animated, Platform, Pressable, ScrollView } from 'react-native';
import { Box, Text, useTheme } from '@coexist/wisp-react-native';
import type { SlashCommandDef } from '@/hooks/useSlashCommand';
import { useAppTheme } from '@/contexts/ThemeContext';
import { dbg } from '@/utils/debug';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface SlashCommandMenuProps {
  commands: SlashCommandDef[];
  query: string;
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  onSelect: (cmd: SlashCommandDef) => void;
  open: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Parse hex color to rgba with given alpha */
function hexToRgba(hex: string, alpha: number): string {
  const cleaned = hex.replace('#', '');
  const r = parseInt(cleaned.substring(0, 2), 16);
  const g = parseInt(cleaned.substring(2, 4), 16);
  const b = parseInt(cleaned.substring(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return `rgba(128, 128, 255, ${alpha})`;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SlashCommandMenu({
  commands,
  query,
  activeIndex,
  onActiveIndexChange,
  onSelect,
  open,
}: SlashCommandMenuProps) {
  if (__DEV__) dbg.trackRender('SlashCommandMenu');
  const { theme, mode } = useTheme();
  const isDark = mode === 'dark';

  if (!open || commands.length === 0) return null;

  // Group commands by category (for divider placement)
  const grouped = new Map<string, SlashCommandDef[]>();
  for (const cmd of commands) {
    const list = grouped.get(cmd.category) ?? [];
    list.push(cmd);
    grouped.set(cmd.category, list);
  }

  // Build flat list with divider markers
  const rows: { cmd: SlashCommandDef; flatIndex: number; showDivider: boolean }[] = [];
  let flatIndex = 0;
  let isFirstGroup = true;
  for (const [, cmds] of grouped.entries()) {
    for (let i = 0; i < cmds.length; i++) {
      rows.push({
        cmd: cmds[i],
        flatIndex,
        // Show divider before the first item of each group (except the very first)
        showDivider: i === 0 && !isFirstGroup,
      });
      flatIndex++;
    }
    isFirstGroup = false;
  }

  const accentColor = theme.colors.accent.primary;
  // Max 6 rows visible: 6 * 36 = 216
  const maxVisibleHeight = 6 * 36;

  return (
    <Box
      style={{
        backgroundColor: isDark ? theme.colors.background.raised : theme.colors.background.surface,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: theme.colors.border.subtle,
        overflow: 'hidden',
        maxHeight: maxVisibleHeight + 8, // +8 for vertical padding
        ...Platform.select({
          web: {
            boxShadow: isDark
              ? '0 8px 32px rgba(0,0,0,0.5)'
              : '0 8px 32px rgba(0,0,0,0.12)',
          } as any,
          default: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isDark ? 0.4 : 0.12,
            shadowRadius: 12,
            elevation: 8,
          },
        }),
      }}
    >
      <ScrollView
        keyboardShouldPersistTaps="always"
        style={{ maxHeight: maxVisibleHeight + 8 }}
      >
        <Box style={{ paddingVertical: 4 }}>
          {rows.map(({ cmd, flatIndex: idx, showDivider }) => (
            <React.Fragment key={cmd.id}>
              {showDivider && (
                <Box
                  style={{
                    height: 1,
                    backgroundColor: theme.colors.border.subtle,
                    marginHorizontal: 8,
                    marginVertical: 2,
                  }}
                />
              )}
              <CommandRow
                cmd={cmd}
                isActive={idx === activeIndex}
                isDark={isDark}
                theme={theme}
                accentColor={accentColor}
                onPress={() => onSelect(cmd)}
                onHover={() => onActiveIndexChange(idx)}
              />
            </React.Fragment>
          ))}
        </Box>
      </ScrollView>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// CommandRow — Condensed single-line layout with gradient active accent
// ---------------------------------------------------------------------------

function CommandRow({
  cmd,
  isActive,
  isDark,
  theme,
  accentColor,
  onPress,
  onHover,
}: {
  cmd: SlashCommandDef;
  isActive: boolean;
  isDark: boolean;
  theme: any;
  accentColor: string;
  onPress: () => void;
  onHover: () => void;
}) {
  let motionEnabled = true;
  try {
    const appTheme = useAppTheme();
    motionEnabled = appTheme.motionPreferences.enableAnimations;
  } catch {
    // ThemeProvider not available — skip animations
  }

  // Animated left-border width
  const borderAnim = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    if (motionEnabled) {
      Animated.timing(borderAnim, {
        toValue: isActive ? 1 : 0,
        duration: 150,
        useNativeDriver: false,
      }).start();
    } else {
      borderAnim.setValue(isActive ? 1 : 0);
    }
  }, [isActive, motionEnabled]);

  const animatedBorderWidth = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 2],
  });

  const animatedBgOpacity = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  // Gradient-like background for web, solid fallback for native
  const activeBg = Platform.OS === 'web'
    ? {
        backgroundImage: `linear-gradient(to right, ${hexToRgba(accentColor, 0.12)}, transparent)`,
      } as any
    : {
        backgroundColor: hexToRgba(accentColor, 0.08),
      };

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={Platform.OS === 'web' ? onHover : undefined}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        height: 36,
        paddingHorizontal: 8,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Animated gradient background */}
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: animatedBgOpacity,
          ...activeBg,
        }}
        pointerEvents="none"
      />

      {/* Animated left accent border */}
      <Animated.View
        style={{
          position: 'absolute',
          left: 0,
          top: 4,
          bottom: 4,
          width: animatedBorderWidth,
          backgroundColor: accentColor,
          borderRadius: 1,
        }}
        pointerEvents="none"
      />

      {/* Icon */}
      {cmd.icon && (
        <Text style={{ fontSize: 14, width: 22, textAlign: 'center', marginRight: 6 }}>
          {cmd.icon}
        </Text>
      )}

      {/* Command name (bold) */}
      <Text
        style={{
          fontSize: 13,
          fontWeight: '600',
          color: theme.colors.text.primary,
          fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
        }}
        numberOfLines={1}
      >
        /{cmd.command}
      </Text>

      {/* Args (muted, italic) */}
      {cmd.args && (
        <Text
          style={{
            fontSize: 12,
            color: theme.colors.text.muted,
            fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
            fontStyle: 'italic',
            marginLeft: 4,
          }}
          numberOfLines={1}
        >
          {cmd.args}
        </Text>
      )}

      {/* Separator and description */}
      {cmd.description && (
        <Text
          style={{
            fontSize: 12,
            color: theme.colors.text.muted,
            marginLeft: 8,
            flex: 1,
            minWidth: 0,
          }}
          numberOfLines={1}
        >
          — {cmd.description}
        </Text>
      )}

      {/* Active hint */}
      {isActive && (
        <Text
          style={{
            fontSize: 10,
            color: theme.colors.text.muted,
            fontStyle: 'italic',
            marginLeft: 8,
          }}
        >
          enter
        </Text>
      )}
    </Pressable>
  );
}
