/**
 * ConnectionLinkPanel — Desktop-friendly panel for sharing identity and adding friends.
 *
 * Features:
 * - Collapsible "Share Your Info" section with DID and connection link (copy buttons)
 * - "Add Friend" section for pasting DIDs or connection links
 * - Parses input and shows parsed info before sending request
 */

import React, { useState, useCallback } from 'react';
import { Pressable } from 'react-native';
import type { ViewStyle } from 'react-native';
import {
  useTheme,
  Box,
  Text,
  Input,
  Card,
  Button,
  CopyButton,
  Collapse,
  Separator,
  Spinner,
  HStack,
} from '@coexist/wisp-react-native';
import { useConnectionLink, type ParseResult } from '@/hooks/useConnectionLink';
import { useFriends } from '@/hooks/useFriends';
import { dbg } from '@/utils/debug';

// Simple chevron icon components
function ChevronDownIcon({ size = 16, color }: { size?: number; color: string }) {
  return (
    <Box style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color, fontSize: size * 0.75, transform: [{ rotate: '0deg' }] }}>{'\u25BC'}</Text>
    </Box>
  );
}

function ChevronUpIcon({ size = 16, color }: { size?: number; color: string }) {
  return (
    <Box style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color, fontSize: size * 0.75, transform: [{ rotate: '180deg' }] }}>{'\u25BC'}</Text>
    </Box>
  );
}

export interface ConnectionLinkPanelProps {
  style?: ViewStyle;
}

export function ConnectionLinkPanel({ style }: ConnectionLinkPanelProps) {
  if (__DEV__) dbg.trackRender('ConnectionLinkPanel');
  const { theme } = useTheme();
  const { myDid, myLink, isLoading: connectionLoading } = useConnectionLink();
  const { sendRequest } = useFriends();

  // Share section state
  const [shareExpanded, setShareExpanded] = useState(false);

  // Add friend section state
  const [inputValue, setInputValue] = useState('');
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendFeedback, setSendFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const { parseLink } = useConnectionLink();

  // Handle input change - clear parse result when input changes
  const handleInputChange = useCallback((text: string) => {
    setInputValue(text);
    setParseResult(null);
    setSendFeedback(null);
  }, []);

  // Parse the input
  const handleParse = useCallback(async () => {
    if (!inputValue.trim()) return;

    setIsParsing(true);
    setSendFeedback(null);
    try {
      const result = await parseLink(inputValue);
      setParseResult(result);
    } finally {
      setIsParsing(false);
    }
  }, [inputValue, parseLink]);

  // Send friend request
  const handleSendRequest = useCallback(async () => {
    if (!parseResult?.connectionInfo?.did) return;

    setIsSending(true);
    setSendFeedback(null);
    try {
      const request = await sendRequest(parseResult.connectionInfo.did);
      if (request) {
        setSendFeedback({ type: 'success', message: 'Friend request sent!' });
        setInputValue('');
        setParseResult(null);
      } else {
        setSendFeedback({ type: 'error', message: 'Failed to send request' });
      }
    } catch (err) {
      setSendFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to send request',
      });
    } finally {
      setIsSending(false);
    }
  }, [parseResult, sendRequest]);

  // Truncate DID for display
  const truncateDid = (did: string, maxLen = 40) => {
    if (did.length <= maxLen) return did;
    return did.slice(0, 20) + '...' + did.slice(-16);
  };

  return (
    <Card style={{ marginBottom: 16, ...style }} padding="md">
      {/* -- Share Your Info Section -- */}
      <Pressable
        onPress={() => setShareExpanded(!shareExpanded)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: 4,
        }}
      >
        <Text size="sm" weight="semibold">
          Share Your Info
        </Text>
        {shareExpanded ? (
          <ChevronUpIcon size={14} color={theme.colors.text.muted} />
        ) : (
          <ChevronDownIcon size={14} color={theme.colors.text.muted} />
        )}
      </Pressable>

      <Collapse open={shareExpanded}>
        <Box style={{ marginTop: 12, gap: 12 }}>
          {connectionLoading ? (
            <Box style={{ alignItems: 'center', padding: 16 }}>
              <Spinner size="sm" />
            </Box>
          ) : (
            <>
              {/* DID */}
              <Box>
                <Text
                  size="xs"
                  weight="medium"
                  color="muted"
                  style={{ marginBottom: 4 }}
                >
                  Your DID
                </Text>
                <Box
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: theme.colors.background.sunken,
                    borderRadius: 6,
                    padding: 8,
                    gap: 8,
                  }}
                >
                  <Text
                    size="xs"
                    style={{
                      flex: 1,
                      fontFamily: 'monospace',
                      color: theme.colors.text.secondary,
                    }}
                    numberOfLines={1}
                    ellipsizeMode="middle"
                  >
                    {myDid || 'Not available'}
                  </Text>
                  {myDid && <CopyButton value={myDid} size="sm" />}
                </Box>
              </Box>

              {/* Connection Link */}
              {myLink && (
                <Box>
                  <Text
                    size="xs"
                    weight="medium"
                    color="muted"
                    style={{ marginBottom: 4 }}
                  >
                    Connection Link
                  </Text>
                  <Box
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: theme.colors.background.sunken,
                      borderRadius: 6,
                      padding: 8,
                      gap: 8,
                    }}
                  >
                    <Text
                      size="xs"
                      style={{
                        flex: 1,
                        fontFamily: 'monospace',
                        color: theme.colors.text.secondary,
                      }}
                      numberOfLines={1}
                      ellipsizeMode="middle"
                    >
                      {myLink}
                    </Text>
                    <CopyButton value={myLink} size="sm" />
                  </Box>
                </Box>
              )}
            </>
          )}
        </Box>
      </Collapse>

      {/* -- Divider -- */}
      <Separator spacing="sm" style={{ marginVertical: 12 }} />

      {/* -- Add Friend Section -- */}
      <Text size="sm" weight="semibold" style={{ marginBottom: 8 }}>
        Add Friend by Link
      </Text>

      <Box style={{ gap: 8 }}>
        {/* Input + Parse Button */}
        <HStack style={{ gap: 8 }}>
          <Box style={{ flex: 1 }}>
            <Input
              value={inputValue}
              onChangeText={handleInputChange}
              placeholder="Paste DID or connection link..."
              fullWidth
            />
          </Box>
          <Button
            onPress={handleParse}
            disabled={!inputValue.trim() || isParsing}
            size="md"
            variant="secondary"
          >
            {isParsing ? 'Parsing...' : 'Parse'}
          </Button>
        </HStack>

        {/* Parse Result */}
        {parseResult && (
          <Box
            style={{
              backgroundColor: parseResult.success
                ? theme.colors.background.sunken
                : `${theme.colors.status.danger}15`,
              borderRadius: 6,
              padding: 12,
              gap: 8,
            }}
          >
            {parseResult.success && parseResult.connectionInfo ? (
              <>
                <Box style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Box
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: theme.colors.status.success,
                    }}
                  />
                  <Text size="sm" weight="medium">
                    {parseResult.connectionInfo.displayName || 'Unknown User'}
                  </Text>
                </Box>
                <Text
                  size="xs"
                  color="muted"
                  style={{ fontFamily: 'monospace' }}
                >
                  {truncateDid(parseResult.connectionInfo.did)}
                </Text>
                <Button
                  onPress={handleSendRequest}
                  disabled={isSending}
                  size="md"
                  variant="primary"
                  style={{ marginTop: 4 }}
                >
                  {isSending ? 'Sending...' : 'Send Friend Request'}
                </Button>
              </>
            ) : (
              <Text
                size="sm"
                style={{ color: theme.colors.status.danger }}
              >
                {parseResult.error || 'Invalid input'}
              </Text>
            )}
          </Box>
        )}

        {/* Send Feedback */}
        {sendFeedback && (
          <Box
            style={{
              backgroundColor:
                sendFeedback.type === 'success'
                  ? `${theme.colors.status.success}15`
                  : `${theme.colors.status.danger}15`,
              borderRadius: 6,
              padding: 10,
            }}
          >
            <Text
              size="sm"
              style={{
                color:
                  sendFeedback.type === 'success'
                    ? theme.colors.status.success
                    : theme.colors.status.danger,
              }}
            >
              {sendFeedback.message}
            </Text>
          </Box>
        )}
      </Box>
    </Card>
  );
}

ConnectionLinkPanel.displayName = 'ConnectionLinkPanel';
