/**
 * CallHistoryPanel -- Scrollable list of past calls.
 *
 * Optionally scoped to a single conversation via `conversationId`.
 * Renders inside a side-panel or dialog.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { Text, Separator, useTheme } from '@coexist/wisp-react-native';
import { useUmbra } from '@/contexts/UmbraContext';
import { PhoneIcon, VideoIcon } from '@/components/ui';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface CallRecord {
  id: string;
  conversationId: string;
  callType: 'voice' | 'video';
  direction: 'incoming' | 'outgoing';
  status: string;
  participants: string;
  startedAt: number;
  endedAt: number | null;
  durationMs: number | null;
  createdAt: number;
}

export interface CallHistoryPanelProps {
  /** If provided, show only that conversation's calls. */
  conversationId?: string;
  /** Callback when the user taps the call-back button on a row. */
  onCallBack?: (conversationId: string, callType: 'voice' | 'video') => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Format a duration in milliseconds to "M:SS" or "H:MM:SS". */
function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const mm = String(minutes).padStart(hours > 0 ? 2 : 1, '0');
  const ss = String(seconds).padStart(2, '0');

  return hours > 0 ? `${hours}:${mm}:${ss}` : `${minutes}:${ss}`;
}

/** Format a Unix-ms timestamp into a human-friendly relative string. */
function formatRelativeTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday.getTime() - 86_400_000);

  const time = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  if (date >= startOfToday) {
    return `Today ${time}`;
  }
  if (date >= startOfYesterday) {
    return `Yesterday ${time}`;
  }

  // Older: show short date + time
  const dateStr = date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  });
  return `${dateStr} ${time}`;
}

/** Map a status string to a display label. */
function statusLabel(status: string): string {
  switch (status.toLowerCase()) {
    case 'completed':
      return 'Completed';
    case 'missed':
      return 'Missed';
    case 'declined':
      return 'Declined';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
}

/** Return a color token for a given status. */
function statusColor(status: string, colors: Record<string, any>): string {
  switch (status.toLowerCase()) {
    case 'missed':
    case 'declined':
      return colors.destructive ?? '#FF7B72';
    case 'cancelled':
      return colors.mutedForeground ?? '#888';
    case 'completed':
    default:
      return colors.foreground ?? '#fff';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function CallHistoryPanel({ conversationId, onCallBack }: CallHistoryPanelProps) {
  const { service } = useUmbra();
  const theme = useTheme();
  const colors = (theme as any).colors ?? {};

  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Load call history ────────────────────────────────────────────────────
  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const records: CallRecord[] = conversationId
        ? await (service as any).getCallHistory(conversationId)
        : await (service as any).getAllCallHistory();
      setCalls(records ?? []);
    } catch {
      // Service methods may not exist yet -- gracefully fall back to empty.
      setCalls([]);
    } finally {
      setLoading(false);
    }
  }, [service, conversationId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // ── Direction arrow ──────────────────────────────────────────────────────
  const directionArrow = (direction: 'incoming' | 'outgoing') =>
    direction === 'outgoing' ? '\u2197' : '\u2199'; // ↗ / ↙

  // ── Empty state ──────────────────────────────────────────────────────────
  if (!loading && calls.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
        <Text style={{ color: colors.mutedForeground ?? '#888', fontSize: 14 }}>
          No call history
        </Text>
      </View>
    );
  }

  // ── List ──────────────────────────────────────────────────────────────────
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingVertical: 8 }}
      showsVerticalScrollIndicator={false}
    >
      {calls.map((call, index) => (
        <React.Fragment key={call.id}>
          {index > 0 && (
            <Separator style={{ marginHorizontal: 16 }} />
          )}

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 12,
              gap: 12,
            }}
          >
            {/* Call type icon */}
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: colors.muted ?? '#2a2a2a',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {call.callType === 'video' ? (
                <VideoIcon size={18} color={colors.foreground ?? '#fff'} />
              ) : (
                <PhoneIcon size={18} color={colors.foreground ?? '#fff'} />
              )}
            </View>

            {/* Details */}
            <View style={{ flex: 1, gap: 2 }}>
              {/* Top row: direction + status */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={{ fontSize: 14 }}>
                  {directionArrow(call.direction)}
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: statusColor(call.status, colors),
                  }}
                >
                  {statusLabel(call.status)}
                </Text>
                {call.durationMs != null && call.durationMs > 0 && (
                  <Text style={{ fontSize: 12, color: colors.mutedForeground ?? '#888' }}>
                    {' '}{formatDuration(call.durationMs)}
                  </Text>
                )}
              </View>

              {/* Bottom row: participants + timestamp */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: 12,
                    color: colors.mutedForeground ?? '#888',
                    flexShrink: 1,
                  }}
                >
                  {call.participants}
                </Text>
                <Text style={{ fontSize: 12, color: colors.mutedForeground ?? '#888' }}>
                  {formatRelativeTimestamp(call.startedAt)}
                </Text>
              </View>
            </View>

            {/* Call-back button */}
            {onCallBack && (
              <Pressable
                onPress={() => onCallBack(call.conversationId, call.callType)}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.6 : 1,
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: colors.muted ?? '#2a2a2a',
                  justifyContent: 'center',
                  alignItems: 'center',
                })}
              >
                <PhoneIcon size={16} color={colors.primary ?? '#58A6FF'} />
              </Pressable>
            )}
          </View>
        </React.Fragment>
      ))}
    </ScrollView>
  );
}
