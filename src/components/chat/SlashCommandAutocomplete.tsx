import React from 'react';
import { Pressable, View } from 'react-native';
import { Text, useTheme } from '@coexist/wisp-react-native';
import type { SlashDropdownItem } from '@/hooks/useSlashCommand';

export interface SlashCommandAutocompleteProps {
  items: SlashDropdownItem[];
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  onSelect: (item: SlashDropdownItem) => void;
  open: boolean;
}

export function SlashCommandAutocomplete({
  items,
  activeIndex,
  onActiveIndexChange,
  onSelect,
  open,
}: SlashCommandAutocompleteProps) {
  const { theme } = useTheme();

  if (!open || items.length === 0) return null;

  return (
    <View
      style={{
        backgroundColor: theme.colors.background.raised,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.border.subtle,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
      }}
    >
      {items.map((item, index) => {
        const isActive = index === activeIndex;
        return (
          <Pressable
            key={`${item.label}-${index}`}
            onPress={() => onSelect(item)}
            onHoverIn={() => onActiveIndexChange(index)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 12,
              paddingVertical: 8,
              backgroundColor: isActive
                ? theme.colors.background.surface
                : 'transparent',
            }}
          >
            {item.icon && (
              <Text
                size="md"
                style={{ marginRight: 8, width: 20, textAlign: 'center' } as any}
              >
                {item.icon}
              </Text>
            )}
            <Text
              size="sm"
              weight="semibold"
              style={{ color: theme.colors.text.primary } as any}
            >
              {item.label}
            </Text>
            {item.description && (
              <Text
                size="xs"
                style={{
                  color: theme.colors.text.muted,
                  marginLeft: 8,
                  flex: 1,
                } as any}
                numberOfLines={1}
              >
                {item.description}
              </Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
