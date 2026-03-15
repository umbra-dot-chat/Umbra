import React, { useState, useCallback } from 'react';
import { Pressable } from 'react-native';
import { Avatar, Box, Text, StatusIcon, useTheme } from '@coexist/wisp-react-native';
import { useTranslation } from 'react-i18next';

export interface ReadReceiptMember {
  did: string;
  name: string;
  avatar?: string;
}

interface ReadReceiptPopupProps {
  /** Members who have read this message group */
  readers: ReadReceiptMember[];
  /** Total participants (excluding self) to show "X of Y read" */
  totalParticipants: number;
  themeColors: any;
}

/**
 * Tap-to-expand read receipt indicator for group chats.
 *
 * Shows a condensed "Read by X" label. On press, expands to show
 * a list of members who have read the message with their avatars.
 */
export function ReadReceiptPopup({ readers, totalParticipants, themeColors }: ReadReceiptPopupProps) {
  const [expanded, setExpanded] = useState(false);
  const toggle = useCallback(() => setExpanded(prev => !prev), []);
  const { t } = useTranslation('chat');

  if (readers.length === 0) return null;

  const allRead = readers.length >= totalParticipants;
  const label = allRead
    ? t('readByAll')
    : t('readByCount', { count: readers.length });

  return (
    <Box style={{ alignItems: 'flex-end', marginTop: 2 }}>
      <Pressable onPress={toggle}>
        <Box style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <StatusIcon status="read" color={themeColors.text.muted} readColor={themeColors.accent.primary} />
          <Text size="xs" style={{ color: themeColors.accent.primary }}>
            {label}
          </Text>
        </Box>
      </Pressable>

      {expanded && (
        <Box
          style={{
            marginTop: 4,
            padding: 8,
            borderRadius: 8,
            backgroundColor: themeColors.background.raised,
            borderWidth: 1,
            borderColor: themeColors.border.subtle,
            gap: 6,
            minWidth: 140,
          }}
        >
          {readers.map((reader) => (
            <Box key={reader.did} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Avatar name={reader.name} src={reader.avatar} size="xs" />
              <Text size="xs" style={{ color: themeColors.text.primary }}>
                {reader.name}
              </Text>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
