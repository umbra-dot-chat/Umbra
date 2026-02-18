/**
 * @module MoveToCategoryDialog
 * @description Dialog to move a channel to a different category.
 *
 * Shows a list of available categories in the current space plus an
 * "Uncategorized" option. The current category is highlighted and disabled.
 */

import React from 'react';
import { View, Pressable } from 'react-native';
import { Dialog, Button, Text, useTheme } from '@coexist/wisp-react-native';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MoveToCategoryDialogProps {
  /** Whether the dialog is visible. */
  open: boolean;
  /** Called when the dialog should close. */
  onClose: () => void;
  /** The channel being moved. */
  channel: { id: string; name: string } | null;
  /** Available categories in the current space. */
  categories: { id: string; name: string }[];
  /** The channel's current category ID (null = uncategorized). */
  currentCategoryId?: string | null;
  /** Called when a category is selected. */
  onSelect: (channelId: string, categoryId: string | null) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MoveToCategoryDialog({
  open,
  onClose,
  channel,
  categories,
  currentCategoryId,
  onSelect,
}: MoveToCategoryDialogProps) {
  const { theme } = useTheme();

  if (!channel) return null;

  const handleSelect = (categoryId: string | null) => {
    onSelect(channel.id, categoryId);
    onClose();
  };

  const isCurrent = (categoryId: string | null) => {
    if (categoryId === null) return !currentCategoryId;
    return currentCategoryId === categoryId;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Move #${channel.name}`}
      size="sm"
      footer={
        <Button variant="tertiary" onPress={onClose}>
          Cancel
        </Button>
      }
    >
      <View style={{ gap: 4 }}>
        <Text size="xs" style={{ color: theme.colors.text.secondary, marginBottom: 8 }}>
          Select a category for this channel:
        </Text>

        {categories.map((cat) => {
          const current = isCurrent(cat.id);
          return (
            <Pressable
              key={cat.id}
              onPress={() => !current && handleSelect(cat.id)}
              disabled={current}
              style={({ pressed }) => ({
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderRadius: 8,
                backgroundColor: current
                  ? theme.colors.background.raised
                  : pressed
                    ? theme.colors.background.raised
                    : 'transparent',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                opacity: current ? 0.5 : 1,
              })}
            >
              <Text size="sm" style={{ color: theme.colors.text.primary }}>
                {cat.name}
              </Text>
              {current && (
                <Text size="xs" style={{ color: theme.colors.text.secondary }}>
                  Current
                </Text>
              )}
            </Pressable>
          );
        })}

        {/* Uncategorized option */}
        <Pressable
          onPress={() => !isCurrent(null) && handleSelect(null)}
          disabled={isCurrent(null)}
          style={({ pressed }) => ({
            paddingVertical: 10,
            paddingHorizontal: 12,
            borderRadius: 8,
            backgroundColor: isCurrent(null)
              ? theme.colors.background.raised
              : pressed
                ? theme.colors.background.raised
                : 'transparent',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            opacity: isCurrent(null) ? 0.5 : 1,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border.subtle,
            marginTop: 4,
          })}
        >
          <Text size="sm" style={{ color: theme.colors.text.secondary, fontStyle: 'italic' }}>
            Uncategorized
          </Text>
          {isCurrent(null) && (
            <Text size="xs" style={{ color: theme.colors.text.secondary }}>
              Current
            </Text>
          )}
        </Pressable>
      </View>
    </Dialog>
  );
}
