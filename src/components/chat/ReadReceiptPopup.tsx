import React from 'react';
import { Avatar, Box, Text, StatusIcon, Popover, PopoverTrigger, PopoverContent } from '@coexist/wisp-react-native';
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
 * Inline read receipt checkmark for group chats.
 *
 * Renders a double-check icon inline next to the timestamp.
 * On press, opens a floating popover with the list of readers.
 */
export function ReadReceiptPopup({ readers, totalParticipants, themeColors }: ReadReceiptPopupProps) {
  const { t } = useTranslation('chat');

  if (readers.length === 0) return null;

  const allRead = readers.length >= totalParticipants;
  const label = allRead
    ? t('readByAll')
    : t('readByCount', { count: readers.length });

  return (
    <Popover placement="top">
      <PopoverTrigger>
        <StatusIcon status="read" color={themeColors.text.muted} readColor={themeColors.accent.primary} />
      </PopoverTrigger>
      <PopoverContent style={{ padding: 12, minWidth: 160 }}>
        <Text size="xs" weight="semibold" style={{ color: themeColors.text.secondary, marginBottom: 8 }}>
          {label}
        </Text>
        <Box style={{ gap: 6 }}>
          {readers.map((reader) => (
            <Box key={reader.did} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Avatar name={reader.name} src={reader.avatar} size="xs" />
              <Text size="xs" style={{ color: themeColors.text.primary }}>
                {reader.name}
              </Text>
            </Box>
          ))}
        </Box>
      </PopoverContent>
    </Popover>
  );
}
