import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { Text, useTheme } from '@coexist/wisp-react-native';
import { useRouter } from 'expo-router';
import { useUmbra } from '@/contexts/UmbraContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNetwork } from '@/hooks/useNetwork';
import { useConversations } from '@/hooks/useConversations';
import { useFriends } from '@/hooks/useFriends';

// ─────────────────────────────────────────────────────────────────────────────
// Debug Page
// ─────────────────────────────────────────────────────────────────────────────

export default function DebugPage() {
  const { theme } = useTheme();
  const colors = theme.colors;
  const router = useRouter();
  const { isReady, isLoading, error, service, version } = useUmbra();
  const { identity } = useAuth();
  const { isConnected, peerCount, listenAddresses } = useNetwork();
  const { conversations } = useConversations();
  const { friends, incomingRequests, outgoingRequests } = useFriends();

  // Event log
  const [eventLog, setEventLog] = useState<string[]>([]);

  useEffect(() => {
    if (!service) return;

    const unsubs = [
      service.onMessageEvent((event: any) => {
        setEventLog((prev: string[]) => [`[MSG] ${event.type} — ${JSON.stringify(event).slice(0, 100)}`, ...prev].slice(0, 100));
      }),
      service.onFriendEvent((event: any) => {
        setEventLog((prev: string[]) => [`[FRN] ${event.type} — ${JSON.stringify(event).slice(0, 100)}`, ...prev].slice(0, 100));
      }),
      service.onDiscoveryEvent((event: any) => {
        setEventLog((prev: string[]) => [`[DSC] ${event.type} — ${JSON.stringify(event).slice(0, 100)}`, ...prev].slice(0, 100));
      }),
    ];

    return () => unsubs.forEach((u) => u());
  }, [service]);

  // Styles
  const sectionStyle = {
    backgroundColor: colors.background.raised,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  };

  const rowStyle = {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  };

  const labelStyle = { color: colors.text.muted, fontSize: 13 };
  const valueStyle = { color: colors.text.primary, fontSize: 13, fontWeight: '500' as const };
  const monoStyle = { color: colors.text.primary, fontSize: 11, fontFamily: 'monospace' as any };

  const StatusDot = ({ active }: { active: boolean }) => (
    <View
      style={{
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: active ? colors.status.success : colors.status.danger,
        marginRight: 6,
        marginTop: 3,
      }}
    />
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background.canvas }}
      contentContainerStyle={{ padding: 20, maxWidth: 700 }}
    >
      <Text size="display-sm" weight="bold" style={{ color: colors.text.primary, marginBottom: 12 }}>
        Debug & Diagnostics
      </Text>

      {/* ─── Quick Links ─── */}
      <Pressable
        onPress={() => router.push('/call-diagnostics')}
        style={{
          backgroundColor: colors.accent.primary,
          borderRadius: 8,
          paddingHorizontal: 16,
          paddingVertical: 10,
          alignItems: 'center' as const,
          marginBottom: 16,
        }}
      >
        <Text size="sm" weight="semibold" style={{ color: '#FFF' }}>
          Open Call Diagnostics
        </Text>
      </Pressable>

      {/* ─── WASM Status ─── */}
      <View style={sectionStyle}>
        <Text size="lg" weight="semibold" style={{ color: colors.text.primary, marginBottom: 12 }}>
          WASM Module
        </Text>

        <View style={rowStyle}>
          <Text style={labelStyle}>Status</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <StatusDot active={isReady} />
            <Text style={valueStyle}>{isLoading ? 'Loading...' : isReady ? 'Ready' : 'Failed'}</Text>
          </View>
        </View>

        <View style={rowStyle}>
          <Text style={labelStyle}>Version</Text>
          <Text style={valueStyle}>{version || '—'}</Text>
        </View>

        {error && (
          <View style={rowStyle}>
            <Text style={labelStyle}>Error</Text>
            <Text style={{ color: colors.status.danger, fontSize: 13 }}>{error.message}</Text>
          </View>
        )}
      </View>

      {/* ─── Identity ─── */}
      <View style={sectionStyle}>
        <Text size="lg" weight="semibold" style={{ color: colors.text.primary, marginBottom: 12 }}>
          Identity
        </Text>

        <View style={rowStyle}>
          <Text style={labelStyle}>Authenticated</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <StatusDot active={!!identity} />
            <Text style={valueStyle}>{identity ? 'Yes' : 'No'}</Text>
          </View>
        </View>

        {identity && (
          <>
            <View style={rowStyle}>
              <Text style={labelStyle}>Display Name</Text>
              <Text style={valueStyle}>{identity.displayName}</Text>
            </View>
            <View style={{ paddingVertical: 6 }}>
              <Text style={labelStyle}>DID</Text>
              <Text style={monoStyle} selectable>{identity.did}</Text>
            </View>
          </>
        )}
      </View>

      {/* ─── Network ─── */}
      <View style={sectionStyle}>
        <Text size="lg" weight="semibold" style={{ color: colors.text.primary, marginBottom: 12 }}>
          Network
        </Text>

        <View style={rowStyle}>
          <Text style={labelStyle}>Connected</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <StatusDot active={isConnected} />
            <Text style={valueStyle}>{isConnected ? 'Yes' : 'No'}</Text>
          </View>
        </View>

        <View style={rowStyle}>
          <Text style={labelStyle}>Peer Count</Text>
          <Text style={valueStyle}>{peerCount}</Text>
        </View>

        {listenAddresses.length > 0 && (
          <View style={{ paddingVertical: 6 }}>
            <Text style={labelStyle}>Listen Addresses</Text>
            {listenAddresses.map((addr, i) => (
              <Text key={i} style={monoStyle} selectable>{addr}</Text>
            ))}
          </View>
        )}
      </View>

      {/* ─── Storage Stats ─── */}
      <View style={sectionStyle}>
        <Text size="lg" weight="semibold" style={{ color: colors.text.primary, marginBottom: 12 }}>
          Storage
        </Text>

        <View style={rowStyle}>
          <Text style={labelStyle}>Friends</Text>
          <Text style={valueStyle}>{friends.length}</Text>
        </View>

        <View style={rowStyle}>
          <Text style={labelStyle}>Incoming Requests</Text>
          <Text style={valueStyle}>{incomingRequests.length}</Text>
        </View>

        <View style={rowStyle}>
          <Text style={labelStyle}>Outgoing Requests</Text>
          <Text style={valueStyle}>{outgoingRequests.length}</Text>
        </View>

        <View style={rowStyle}>
          <Text style={labelStyle}>Conversations</Text>
          <Text style={valueStyle}>{conversations.length}</Text>
        </View>
      </View>

      {/* ─── Event Log ─── */}
      <View style={sectionStyle}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text size="lg" weight="semibold" style={{ color: colors.text.primary }}>
            Event Log
          </Text>
          <Pressable onPress={() => setEventLog([])}>
            <Text size="xs" style={{ color: colors.accent.primary }}>Clear</Text>
          </Pressable>
        </View>

        {eventLog.length === 0 ? (
          <Text style={{ color: colors.text.muted, fontSize: 13 }}>
            No events yet. Events will appear here in real-time.
          </Text>
        ) : (
          eventLog.map((entry, i) => (
            <Text key={i} style={{ ...monoStyle, marginBottom: 4, fontSize: 10 }} selectable>
              {entry}
            </Text>
          ))
        )}
      </View>
    </ScrollView>
  );
}
