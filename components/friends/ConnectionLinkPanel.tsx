/**
 * ConnectionLinkPanel — Desktop-friendly panel for sharing identity and adding friends.
 *
 * Features:
 * - Collapsible "Share Your Info" section with DID and connection link (copy buttons)
 * - "Add Friend" section for pasting DIDs or connection links
 * - Parses input and shows parsed info before sending request
 */

import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, TextInput, ViewStyle } from 'react-native';
import {
  useTheme,
  Card,
  Button,
  CopyButton,
  Collapse,
  Spinner,
} from '@coexist/wisp-react-native';
import { useConnectionLink, type ParseResult } from '@/hooks/useConnectionLink';
import { useFriends } from '@/hooks/useFriends';

// Simple chevron icon components
function ChevronDownIcon({ size = 16, color }: { size?: number; color: string }) {
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color, fontSize: size * 0.75, transform: [{ rotate: '0deg' }] }}>{'\u25BC'}</Text>
    </View>
  );
}

function ChevronUpIcon({ size = 16, color }: { size?: number; color: string }) {
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color, fontSize: size * 0.75, transform: [{ rotate: '180deg' }] }}>{'\u25BC'}</Text>
    </View>
  );
}

export interface ConnectionLinkPanelProps {
  style?: ViewStyle;
}

export function ConnectionLinkPanel({ style }: ConnectionLinkPanelProps) {
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
      {/* ── Share Your Info Section ── */}
      <Pressable
        onPress={() => setShareExpanded(!shareExpanded)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: 4,
        }}
      >
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: theme.colors.text.primary,
          }}
        >
          Share Your Info
        </Text>
        {shareExpanded ? (
          <ChevronUpIcon size={14} color={theme.colors.text.muted} />
        ) : (
          <ChevronDownIcon size={14} color={theme.colors.text.muted} />
        )}
      </Pressable>

      <Collapse open={shareExpanded}>
        <View style={{ marginTop: 12, gap: 12 }}>
          {connectionLoading ? (
            <View style={{ alignItems: 'center', padding: 16 }}>
              <Spinner size="sm" />
            </View>
          ) : (
            <>
              {/* DID */}
              <View>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '500',
                    color: theme.colors.text.muted,
                    marginBottom: 4,
                  }}
                >
                  Your DID
                </Text>
                <View
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
                    style={{
                      flex: 1,
                      fontSize: 12,
                      fontFamily: 'monospace',
                      color: theme.colors.text.secondary,
                    }}
                    numberOfLines={1}
                    ellipsizeMode="middle"
                  >
                    {myDid || 'Not available'}
                  </Text>
                  {myDid && <CopyButton value={myDid} size="sm" />}
                </View>
              </View>

              {/* Connection Link */}
              {myLink && (
                <View>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '500',
                      color: theme.colors.text.muted,
                      marginBottom: 4,
                    }}
                  >
                    Connection Link
                  </Text>
                  <View
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
                      style={{
                        flex: 1,
                        fontSize: 12,
                        fontFamily: 'monospace',
                        color: theme.colors.text.secondary,
                      }}
                      numberOfLines={1}
                      ellipsizeMode="middle"
                    >
                      {myLink}
                    </Text>
                    <CopyButton value={myLink} size="sm" />
                  </View>
                </View>
              )}
            </>
          )}
        </View>
      </Collapse>

      {/* ── Divider ── */}
      <View
        style={{
          height: 1,
          backgroundColor: theme.colors.border.subtle,
          marginVertical: 12,
        }}
      />

      {/* ── Add Friend Section ── */}
      <Text
        style={{
          fontSize: 14,
          fontWeight: '600',
          color: theme.colors.text.primary,
          marginBottom: 8,
        }}
      >
        Add Friend by Link
      </Text>

      <View style={{ gap: 8 }}>
        {/* Input + Parse Button */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput
            value={inputValue}
            onChangeText={handleInputChange}
            placeholder="Paste DID or connection link..."
            placeholderTextColor={theme.colors.text.muted}
            style={{
              flex: 1,
              backgroundColor: theme.colors.background.sunken,
              borderRadius: 6,
              padding: 10,
              fontSize: 13,
              color: theme.colors.text.primary,
              borderWidth: 1,
              borderColor: theme.colors.border.subtle,
            }}
          />
          <Button
            onPress={handleParse}
            disabled={!inputValue.trim() || isParsing}
            size="md"
            variant="secondary"
          >
            {isParsing ? 'Parsing...' : 'Parse'}
          </Button>
        </View>

        {/* Parse Result */}
        {parseResult && (
          <View
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
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: theme.colors.status.success,
                    }}
                  />
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '500',
                      color: theme.colors.text.primary,
                    }}
                  >
                    {parseResult.connectionInfo.displayName || 'Unknown User'}
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 11,
                    fontFamily: 'monospace',
                    color: theme.colors.text.muted,
                  }}
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
                style={{
                  fontSize: 13,
                  color: theme.colors.status.danger,
                }}
              >
                {parseResult.error || 'Invalid input'}
              </Text>
            )}
          </View>
        )}

        {/* Send Feedback */}
        {sendFeedback && (
          <View
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
              style={{
                fontSize: 13,
                color:
                  sendFeedback.type === 'success'
                    ? theme.colors.status.success
                    : theme.colors.status.danger,
              }}
            >
              {sendFeedback.message}
            </Text>
          </View>
        )}
      </View>
    </Card>
  );
}

ConnectionLinkPanel.displayName = 'ConnectionLinkPanel';
