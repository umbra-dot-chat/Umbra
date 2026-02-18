/**
 * DmFileMessage — Renders a file attachment card within a chat message.
 *
 * Shows a compact file card with MIME icon, filename, file size,
 * and a download button. Used inside message bubbles when a message
 * has `content.type === 'file'`.
 */

import React from 'react';
import { View, Pressable } from 'react-native';
import { Text, useTheme } from '@coexist/wisp-react-native';
import { getFileTypeIcon, formatFileSize } from '@/utils/fileIcons';
import { DownloadIcon } from '@/components/icons';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface DmFileMessageProps {
  /** File identifier */
  fileId: string;
  /** Display filename */
  filename: string;
  /** File size in bytes */
  size: number;
  /** MIME type */
  mimeType: string;
  /** Whether this is an outgoing (own) message */
  isOutgoing?: boolean;
  /** Called when the download button is pressed */
  onDownload?: (fileId: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DmFileMessage({
  fileId,
  filename,
  size,
  mimeType,
  isOutgoing = false,
  onDownload,
}: DmFileMessageProps) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const typeIcon = getFileTypeIcon(mimeType);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: isOutgoing
          ? colors.accent.primary + '12'
          : colors.background.raised,
        borderRadius: 10,
        padding: 10,
        gap: 10,
        maxWidth: 280,
        borderWidth: 1,
        borderColor: colors.border.subtle,
      }}
    >
      {/* File type icon */}
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          backgroundColor: typeIcon.color + '1A',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Text size="lg">{typeIcon.icon}</Text>
      </View>

      {/* File info */}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          size="sm"
          weight="medium"
          numberOfLines={1}
          style={{ color: colors.text.primary }}
        >
          {filename}
        </Text>
        <Text size="xs" style={{ color: colors.text.muted, marginTop: 1 }}>
          {formatFileSize(size)} · {typeIcon.label}
        </Text>
      </View>

      {/* Download button */}
      {onDownload && (
        <Pressable
          onPress={() => onDownload(fileId)}
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: colors.accent.primary + '1A',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <DownloadIcon size={14} color={colors.accent.primary} />
        </Pressable>
      )}
    </View>
  );
}
