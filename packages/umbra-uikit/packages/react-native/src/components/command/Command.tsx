import React, { createContext, useContext, useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { View, Pressable, Modal, TextInput, FlatList, SafeAreaView, StyleSheet, Text as RNText, ActivityIndicator } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

type CommandSize = 'sm' | 'md' | 'lg';
const commandSizeMap: Record<CommandSize, number> = { sm: 400, md: 520, lg: 640 };

interface CommandContextValue {
  search: string;
  onSearchChange: (v: string) => void;
  onItemSelect: (v: string) => void;
  filter?: (value: string, search: string, keywords?: string[]) => boolean;
  size: CommandSize;
  loading: boolean;
}

const CommandContext = createContext<CommandContextValue | null>(null);
function useCommandContext(): CommandContextValue {
  const ctx = useContext(CommandContext);
  if (!ctx) throw new Error('[Wisp] Command compound components must be used within <Command>.');
  return ctx;
}

function defaultFilter(value: string, search: string, keywords?: string[]): boolean {
  const lower = search.toLowerCase();
  if (value.toLowerCase().includes(lower)) return true;
  if (keywords?.some((kw) => kw.toLowerCase().includes(lower))) return true;
  return false;
}

export interface CommandProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect?: (value: string) => void;
  size?: CommandSize;
  filter?: (value: string, search: string, keywords?: string[]) => boolean;
  loading?: boolean;
  closeOnSelect?: boolean;
  children: React.ReactNode;
  style?: ViewStyle;
}

export function Command({ open, onOpenChange, onSelect, size = 'md', filter, loading = false, closeOnSelect = true, children, style: userStyle }: CommandProps) {
  const { theme, mode } = useTheme();
  const tc = theme.colors;
  const isDark = mode === 'dark';
  const [search, setSearch] = useState('');

  useEffect(() => { if (open) setSearch(''); }, [open]);

  const handleItemSelect = useCallback((value: string) => {
    onSelect?.(value);
    if (closeOnSelect) onOpenChange(false);
  }, [onSelect, closeOnSelect, onOpenChange]);

  const contextValue = useMemo<CommandContextValue>(() => ({
    search, onSearchChange: setSearch, onItemSelect: handleItemSelect, filter, size, loading,
  }), [search, handleItemSelect, filter, size, loading]);

  if (!open) return null;

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={() => onOpenChange(false)} statusBarTranslucent>
      <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)' }]} onPress={() => onOpenChange(false)}>
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View style={[{
              backgroundColor: isDark ? tc.background.raised : tc.background.canvas,
              borderRadius: defaultRadii.xl, overflow: 'hidden',
              borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.12)' : tc.border.subtle,
              width: commandSizeMap[size], maxHeight: 400,
              shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
              shadowOpacity: isDark ? 0.5 : 0.2, shadowRadius: 24, elevation: 10,
            }, userStyle]}>
              <CommandContext.Provider value={contextValue}>
                {children}
              </CommandContext.Provider>
            </View>
          </Pressable>
        </SafeAreaView>
      </Pressable>
    </Modal>
  );
}
Command.displayName = 'Command';

export interface CommandInputProps {
  placeholder?: string;
  icon?: React.ComponentType<{ size?: number | string; color?: string }>;
}

export function CommandInput({ placeholder = 'Type a command or search...', icon: IconComp }: CommandInputProps) {
  const { theme, mode } = useTheme();
  const { search, onSearchChange } = useCommandContext();
  const tc = theme.colors;
  const isDark = mode === 'dark';
  const inputRef = useRef<TextInput>(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 100); }, []);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: defaultSpacing.md, borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : tc.border.subtle, gap: defaultSpacing.sm }}>
      {IconComp ? (
        <IconComp size={18} color={tc.text.muted} />
      ) : (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
          <Circle cx={11} cy={11} r={8} stroke={tc.text.muted} strokeWidth={2} />
          <Line x1={21} y1={21} x2={16.65} y2={16.65} stroke={tc.text.muted} strokeWidth={2} strokeLinecap="round" />
        </Svg>
      )}
      <TextInput ref={inputRef} value={search} onChangeText={onSearchChange}
        placeholder={placeholder} placeholderTextColor={tc.text.muted}
        autoCorrect={false} autoCapitalize="none" spellCheck={false}
        style={{ flex: 1, height: 44, fontSize: defaultTypography.sizes.sm.fontSize, color: tc.text.primary } as TextStyle} />
    </View>
  );
}
CommandInput.displayName = 'CommandInput';

export interface CommandListProps { children: React.ReactNode; style?: ViewStyle; }

export function CommandList({ children, style: userStyle }: CommandListProps) {
  const { theme } = useTheme();
  const { loading } = useCommandContext();
  const tc = theme.colors;
  if (loading) {
    return <View style={[{ padding: defaultSpacing.xl, alignItems: 'center' }, userStyle]}><ActivityIndicator color={tc.accent.primary} /></View>;
  }
  return <View style={[{ paddingVertical: defaultSpacing.xs, maxHeight: 300 }, userStyle]}>{children}</View>;
}
CommandList.displayName = 'CommandList';

export interface CommandGroupProps { heading?: string; children: React.ReactNode; style?: ViewStyle; }

export function CommandGroup({ heading, children, style: userStyle }: CommandGroupProps) {
  const { theme } = useTheme();
  const tc = theme.colors;
  return (
    <View style={userStyle}>
      {heading && (
        <RNText style={{ fontSize: defaultTypography.sizes.xs.fontSize, fontWeight: defaultTypography.weights.semibold, color: tc.text.muted, paddingHorizontal: defaultSpacing.md, paddingTop: defaultSpacing.sm, paddingBottom: defaultSpacing.xs, textTransform: 'uppercase', letterSpacing: 0.5 } as TextStyle}>{heading}</RNText>
      )}
      {children}
    </View>
  );
}
CommandGroup.displayName = 'CommandGroup';

export interface CommandItemProps {
  value: string;
  onSelect?: (value: string) => void;
  disabled?: boolean;
  icon?: React.ComponentType<{ size?: number | string; color?: string }>;
  description?: string;
  keywords?: string[];
  children: React.ReactNode;
  style?: ViewStyle;
}

export function CommandItem({ value, onSelect: onItemSelect, disabled = false, icon: IconComp, description, keywords, children, style: userStyle }: CommandItemProps) {
  const { theme } = useTheme();
  const { search, onItemSelect: onRootSelect, filter } = useCommandContext();
  const tc = theme.colors;

  const filterFn = filter || defaultFilter;
  const isVisible = !search || filterFn(value, search, keywords);

  const handlePress = useCallback(() => {
    if (disabled) return;
    onItemSelect?.(value);
    onRootSelect(value);
  }, [disabled, value, onItemSelect, onRootSelect]);

  if (!isVisible) return null;

  return (
    <Pressable onPress={handlePress} disabled={disabled}
      style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: defaultSpacing.sm, paddingVertical: defaultSpacing.sm, paddingHorizontal: defaultSpacing.md, backgroundColor: pressed ? tc.accent.highlight : 'transparent', opacity: disabled ? 0.4 : 1, borderRadius: defaultRadii.md, marginHorizontal: defaultSpacing.xs }, userStyle]}>
      {IconComp && <View style={{ width: 20, alignItems: 'center' }}><IconComp size={18} color={tc.text.secondary} /></View>}
      <View style={{ flex: 1 }}>
        <RNText style={{ fontSize: defaultTypography.sizes.sm.fontSize, color: tc.text.primary } as TextStyle}>{children}</RNText>
        {description && <RNText style={{ fontSize: defaultTypography.sizes.xs.fontSize, color: tc.text.muted, marginTop: defaultSpacing['2xs'] } as TextStyle}>{description}</RNText>}
      </View>
    </Pressable>
  );
}
CommandItem.displayName = 'CommandItem';

export interface CommandSeparatorProps { style?: ViewStyle; }

export function CommandSeparator({ style: userStyle }: CommandSeparatorProps) {
  const { theme, mode } = useTheme();
  const isDark = mode === 'dark';
  return <View style={[{ height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : theme.colors.border.subtle, marginVertical: defaultSpacing.xs }, userStyle]} />;
}
CommandSeparator.displayName = 'CommandSeparator';

export interface CommandEmptyProps { children?: React.ReactNode; style?: ViewStyle; }

export function CommandEmpty({ children, style: userStyle }: CommandEmptyProps) {
  const { theme } = useTheme();
  const tc = theme.colors;
  return (
    <View style={[{ padding: defaultSpacing.xl, alignItems: 'center' }, userStyle]}>
      <RNText style={{ fontSize: defaultTypography.sizes.sm.fontSize, color: tc.text.muted } as TextStyle}>{children || 'No results found.'}</RNText>
    </View>
  );
}
CommandEmpty.displayName = 'CommandEmpty';
