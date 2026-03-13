/**
 * PendingAttachmentBar — Shows a queued file attachment above the chat input.
 *
 * Displays the file name, size, a real progress bar during file reading,
 * and a remove button. Once processing completes the bar shows a send
 * button so the user can dispatch the file (with or without text).
 */

import React from 'react';
import { Box, Text, useTheme } from '@coexist/wisp-react-native';
import { Pressable } from 'react-native';
import { getFileTypeIcon, formatFileSize } from '@/utils/fileIcons';
import { XIcon, SendIcon } from '@/components/ui';
import { dbg } from '@/utils/debug';

// ── Types ────────────────────────────────────────────────────────────────

export interface PendingAttachment {
  fileId: string;
  filename: string;
  size: number;
  mimeType: string;
  status: 'processing' | 'ready';
  /** Read progress 0→1. Only meaningful when status === 'processing'. */
  progress: number;
}

export interface PendingAttachmentBarProps {
  attachment: PendingAttachment;
  onRemove: () => void;
  /** Send the attachment (and any typed text). Shown when status is 'ready'. */
  onSend?: () => void;
}

// ── Component ────────────────────────────────────────────────────────────

export function PendingAttachmentBar({ attachment, onRemove, onSend }: PendingAttachmentBarProps) {
  if (__DEV__) dbg.trackRender('PendingAttachmentBar');
  const { theme, mode } = useTheme();
  const tc = theme.colors;
  const isDark = mode === 'dark';
  const isProcessing = attachment.status === 'processing';
  const isReady = attachment.status === 'ready';

  const typeIcon = getFileTypeIcon(attachment.mimeType);
  const accentColor = tc.accent.primary;
  const progressPct = Math.round(attachment.progress * 100);

  return (
    <Box
      style={{
        marginHorizontal: 12,
        marginBottom: 4,
        borderRadius: 10,
        overflow: 'hidden',
        backgroundColor: isDark ? tc.background.sunken : tc.background.surface,
        borderWidth: 1,
        borderColor: tc.border.subtle,
      }}
    >
      {/* File info row */}
      <Box
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 10,
          paddingVertical: 8,
          gap: 10,
        }}
      >
        {/* File type icon */}
        <Box
          style={{
            width: 32,
            height: 32,
            borderRadius: 7,
            backgroundColor: typeIcon.color + '1A',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <typeIcon.IconComponent size={16} color={typeIcon.color} />
        </Box>

        {/* Filename + size */}
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Text
            size="sm"
            weight="medium"
            numberOfLines={1}
            style={{ color: tc.text.primary }}
          >
            {attachment.filename}
          </Text>
          <Text size="xs" style={{ color: tc.text.muted, marginTop: 1 }}>
            {formatFileSize(attachment.size)}
            {isProcessing ? ` · Processing ${progressPct}%` : ' · Ready to send'}
          </Text>
        </Box>

        {/* Send button — visible when ready */}
        {isReady && onSend && (
          <Pressable
            onPress={onSend}
            hitSlop={8}
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: accentColor,
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <SendIcon size={14} color={tc.text.inverse} />
          </Pressable>
        )}

        {/* Remove button */}
        <Pressable
          onPress={onRemove}
          hitSlop={8}
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: tc.background.sunken,
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <XIcon size={12} color={tc.text.muted} />
        </Pressable>
      </Box>

      {/* Progress bar */}
      <Box
        style={{
          height: 3,
          backgroundColor: tc.border.subtle,
          overflow: 'hidden',
        }}
      >
        <Box
          style={{
            width: isProcessing ? `${progressPct}%` : '100%',
            height: '100%',
            backgroundColor: isProcessing ? accentColor : tc.status.success,
            borderRadius: 2,
          }}
        />
      </Box>
    </Box>
  );
}
