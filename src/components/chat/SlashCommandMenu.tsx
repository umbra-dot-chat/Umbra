import React from 'react';
import { Platform, Pressable, ScrollView, View } from 'react-native';
import { Text, useTheme } from '@coexist/wisp-react-native';
import type { SlashCommandDef } from '@/hooks/useSlashCommand';

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
  const { theme, mode } = useTheme();
  const isDark = mode === 'dark';

  if (!open || commands.length === 0) return null;

  // Group commands by category
  const grouped = new Map<string, SlashCommandDef[]>();
  for (const cmd of commands) {
    const list = grouped.get(cmd.category) ?? [];
    list.push(cmd);
    grouped.set(cmd.category, list);
  }

  // Build flat index mapping for active highlight
  let flatIndex = 0;

  return (
    <View
      style={{
        backgroundColor: isDark ? theme.colors.background.raised : theme.colors.background.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.border.subtle,
        overflow: 'hidden',
        maxHeight: 320,
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
        style={{ maxHeight: 320 }}
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 12, paddingTop: 8, paddingBottom: 4 }}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: '600',
              color: theme.colors.text.secondary,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            Commands {query ? `matching "${query}"` : ''}
          </Text>
        </View>

        {Array.from(grouped.entries()).map(([category, cmds]) => (
          <View key={category}>
            {/* Category label */}
            <View style={{ paddingHorizontal: 12, paddingTop: 6, paddingBottom: 2 }}>
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '700',
                  color: theme.colors.accent.primary,
                  textTransform: 'uppercase',
                  letterSpacing: 0.8,
                }}
              >
                {category}
              </Text>
            </View>

            {/* Commands in this category */}
            {cmds.map((cmd) => {
              const isActive = flatIndex === activeIndex;
              const currentIndex = flatIndex;
              flatIndex++;

              return (
                <CommandRow
                  key={cmd.id}
                  cmd={cmd}
                  isActive={isActive}
                  isDark={isDark}
                  theme={theme}
                  onPress={() => onSelect(cmd)}
                  onHover={() => onActiveIndexChange(currentIndex)}
                />
              );
            })}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// CommandRow
// ---------------------------------------------------------------------------

function CommandRow({
  cmd,
  isActive,
  isDark,
  theme,
  onPress,
  onHover,
}: {
  cmd: SlashCommandDef;
  isActive: boolean;
  isDark: boolean;
  theme: any;
  onPress: () => void;
  onHover: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      onHoverIn={Platform.OS === 'web' ? onHover : undefined}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: isActive
          ? isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'
          : 'transparent',
        gap: 8,
      }}
    >
      {/* Icon */}
      {cmd.icon && (
        <Text style={{ fontSize: 16, width: 24, textAlign: 'center' }}>
          {cmd.icon}
        </Text>
      )}

      {/* Command text and description */}
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
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
          {cmd.args && (
            <Text
              style={{
                fontSize: 12,
                color: theme.colors.text.muted,
                fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
                fontStyle: 'italic',
              }}
              numberOfLines={1}
            >
              {cmd.args}
            </Text>
          )}
        </View>
        {cmd.description && (
          <Text
            style={{
              fontSize: 11,
              color: theme.colors.text.secondary,
              marginTop: 1,
            }}
            numberOfLines={1}
          >
            {cmd.description}
          </Text>
        )}
      </View>

      {/* Active hint */}
      {isActive && (
        <Text
          style={{
            fontSize: 10,
            color: theme.colors.text.muted,
            fontStyle: 'italic',
          }}
        >
          enter
        </Text>
      )}
    </Pressable>
  );
}
