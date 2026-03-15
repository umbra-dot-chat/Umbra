/**
 * ResultPreview — Preview pane for a selected search result.
 *
 * Shows the matched message with surrounding context and a
 * "Jump to message" button to navigate to the conversation.
 */

import React, { useCallback } from 'react';
import { View, ScrollView } from 'react-native';
import {
  Text,
  Box,
  HStack,
  VStack,
  Avatar,
  Button,
  useTheme,
} from '@coexist/wisp-react-native';
import { HighlightedText } from './HighlightedText';
import type { UnifiedSearchResult } from '@/services/SearchIndexService';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ResultPreviewProps {
  /** The selected search result to preview */
  result: UnifiedSearchResult;
  /** Display name of the sender */
  senderName: string;
  /** Avatar URL of the sender */
  senderAvatar?: string;
  /** Conversation display name */
  conversationName: string;
  /** Called when user clicks "Jump to message" */
  onJumpToMessage?: (conversationId: string, messageId: string) => void;
  /** Called when user clicks close */
  onClose?: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ResultPreview({
  result,
  senderName,
  senderAvatar,
  conversationName,
  onJumpToMessage,
  onClose,
}: ResultPreviewProps) {
  const { theme } = useTheme();
  const tc = theme.colors;
  const doc = result.document;

  const handleJump = useCallback(() => {
    onJumpToMessage?.(doc.conversationId, doc.id);
  }, [onJumpToMessage, doc.conversationId, doc.id]);

  const timeStr = formatTimestamp(doc.timestamp);
  const dateStr = formatDate(doc.timestamp);

  return (
    <VStack style={{
      flex: 1,
      borderLeftWidth: 1,
      borderLeftColor: tc.border.subtle,
      backgroundColor: tc.background.surface,
    }}>
      {/* Header */}
      <Box style={{
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: tc.border.subtle,
      }}>
        <HStack style={{ alignItems: 'center', gap: 8 }}>
          <VStack style={{ flex: 1, gap: 2 }}>
            <Text size="sm" weight="medium" numberOfLines={1}>
              {conversationName}
            </Text>
            <Text size="xs" color="tertiary">{dateStr}</Text>
          </VStack>
          {onClose && (
            <Button variant="tertiary" size="xs" onPress={onClose}>
              Close
            </Button>
          )}
        </HStack>
      </Box>

      {/* Message preview */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16 }}
      >
        <HStack style={{ alignItems: 'flex-start', gap: 10 }}>
          <Avatar name={senderName} src={senderAvatar} size="sm" />
          <VStack style={{ flex: 1, gap: 4 }}>
            <HStack style={{ alignItems: 'center', gap: 6 }}>
              <Text size="sm" weight="medium">{senderName}</Text>
              <Text size="xs" color="tertiary">{timeStr}</Text>
            </HStack>
            <View style={{
              padding: 10,
              borderRadius: 8,
              backgroundColor: `${tc.accent.primary}10`,
              borderWidth: 1,
              borderColor: `${tc.accent.primary}20`,
            }}>
              <HighlightedText
                text={doc.text}
                terms={result.matchedTerms}
                size="sm"
              />
            </View>
          </VStack>
        </HStack>
      </ScrollView>

      {/* Footer with action */}
      <Box style={{
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: tc.border.subtle,
      }}>
        <Button
          variant="primary"
          size="sm"
          onPress={handleJump}
          fullWidth
        >
          Jump to message
        </Button>
      </Box>
    </VStack>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTimestamp(ts: number): string {
  const tsMs = ts < 1000000000000 ? ts * 1000 : ts;
  return new Date(tsMs).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function formatDate(ts: number): string {
  const tsMs = ts < 1000000000000 ? ts * 1000 : ts;
  return new Date(tsMs).toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

ResultPreview.displayName = 'ResultPreview';
