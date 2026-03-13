import React, { useState, useEffect } from 'react';
import { Text, Button, useTheme, Box, ScrollArea } from '@coexist/wisp-react-native';
import { useRouter } from 'expo-router';
import { useUmbra } from '@/contexts/UmbraContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNetwork } from '@/hooks/useNetwork';
import { useConversations } from '@/hooks/useConversations';
import { useFriends } from '@/hooks/useFriends';
import { dbg } from '@/utils/debug';

// ─────────────────────────────────────────────────────────────────────────────
// Debug Page
// ─────────────────────────────────────────────────────────────────────────────

export default function DebugPage() {
  if (__DEV__) dbg.trackRender('DebugPage');
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

  const labelColor = { color: colors.text.muted };
  const valueColor = { color: colors.text.primary };
  const monoColor = { color: colors.text.primary, fontFamily: 'monospace' as any };

  const StatusDot = ({ active }: { active: boolean }) => (
    <Box
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
    <ScrollArea
      style={{ flex: 1, backgroundColor: colors.background.canvas }}
      contentContainerStyle={{ padding: 20, maxWidth: 700 }}
    >
      <Text size="display-sm" weight="bold" style={{ color: colors.text.primary, marginBottom: 12 }}>
        Debug & Diagnostics
      </Text>

      {/* ─── Quick Links ─── */}
      <Button
        variant="primary"
        size="md"
        onPress={() => router.push('/call-diagnostics')}
        fullWidth
        style={{ marginBottom: 16 }}
      >
        Open Call Diagnostics
      </Button>

      {/* ─── WASM Status ─── */}
      <Box style={sectionStyle}>
        <Text size="lg" weight="semibold" style={{ color: colors.text.primary, marginBottom: 12 }}>
          WASM Module
        </Text>

        <Box style={rowStyle}>
          <Text size="sm" style={labelColor}>Status</Text>
          <Box style={{ flexDirection: 'row', alignItems: 'center' }}>
            <StatusDot active={isReady} />
            <Text size="sm" weight="medium" style={valueColor}>{isLoading ? 'Loading...' : isReady ? 'Ready' : 'Failed'}</Text>
          </Box>
        </Box>

        <Box style={rowStyle}>
          <Text size="sm" style={labelColor}>Version</Text>
          <Text size="sm" weight="medium" style={valueColor}>{version || '—'}</Text>
        </Box>

        {error && (
          <Box style={rowStyle}>
            <Text size="sm" style={labelColor}>Error</Text>
            <Text size="sm" style={{ color: colors.status.danger }}>{error.message}</Text>
          </Box>
        )}
      </Box>

      {/* ─── Identity ─── */}
      <Box style={sectionStyle}>
        <Text size="lg" weight="semibold" style={{ color: colors.text.primary, marginBottom: 12 }}>
          Identity
        </Text>

        <Box style={rowStyle}>
          <Text size="sm" style={labelColor}>Authenticated</Text>
          <Box style={{ flexDirection: 'row', alignItems: 'center' }}>
            <StatusDot active={!!identity} />
            <Text size="sm" weight="medium" style={valueColor}>{identity ? 'Yes' : 'No'}</Text>
          </Box>
        </Box>

        {identity && (
          <>
            <Box style={rowStyle}>
              <Text size="sm" style={labelColor}>Display Name</Text>
              <Text size="sm" weight="medium" style={valueColor}>{identity.displayName}</Text>
            </Box>
            <Box style={{ paddingVertical: 6 }}>
              <Text size="sm" style={labelColor}>DID</Text>
              <Text size="xs" style={monoColor} selectable>{identity.did}</Text>
            </Box>
          </>
        )}
      </Box>

      {/* ─── Network ─── */}
      <Box style={sectionStyle}>
        <Text size="lg" weight="semibold" style={{ color: colors.text.primary, marginBottom: 12 }}>
          Network
        </Text>

        <Box style={rowStyle}>
          <Text size="sm" style={labelColor}>Connected</Text>
          <Box style={{ flexDirection: 'row', alignItems: 'center' }}>
            <StatusDot active={isConnected} />
            <Text size="sm" weight="medium" style={valueColor}>{isConnected ? 'Yes' : 'No'}</Text>
          </Box>
        </Box>

        <Box style={rowStyle}>
          <Text size="sm" style={labelColor}>Peer Count</Text>
          <Text size="sm" weight="medium" style={valueColor}>{peerCount}</Text>
        </Box>

        {listenAddresses.length > 0 && (
          <Box style={{ paddingVertical: 6 }}>
            <Text size="sm" style={labelColor}>Listen Addresses</Text>
            {listenAddresses.map((addr, i) => (
              <Text key={i} size="xs" style={monoColor} selectable>{addr}</Text>
            ))}
          </Box>
        )}
      </Box>

      {/* ─── Storage Stats ─── */}
      <Box style={sectionStyle}>
        <Text size="lg" weight="semibold" style={{ color: colors.text.primary, marginBottom: 12 }}>
          Storage
        </Text>

        <Box style={rowStyle}>
          <Text size="sm" style={labelColor}>Friends</Text>
          <Text size="sm" weight="medium" style={valueColor}>{friends.length}</Text>
        </Box>

        <Box style={rowStyle}>
          <Text size="sm" style={labelColor}>Incoming Requests</Text>
          <Text size="sm" weight="medium" style={valueColor}>{incomingRequests.length}</Text>
        </Box>

        <Box style={rowStyle}>
          <Text size="sm" style={labelColor}>Outgoing Requests</Text>
          <Text size="sm" weight="medium" style={valueColor}>{outgoingRequests.length}</Text>
        </Box>

        <Box style={rowStyle}>
          <Text size="sm" style={labelColor}>Conversations</Text>
          <Text size="sm" weight="medium" style={valueColor}>{conversations.length}</Text>
        </Box>
      </Box>

      {/* ─── Event Log ─── */}
      <Box style={sectionStyle}>
        <Box style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text size="lg" weight="semibold" style={{ color: colors.text.primary }}>
            Event Log
          </Text>
          <Button variant="tertiary" size="xs" onPress={() => setEventLog([])}>
            Clear
          </Button>
        </Box>

        {eventLog.length === 0 ? (
          <Text size="sm" style={{ color: colors.text.muted }}>
            No events yet. Events will appear here in real-time.
          </Text>
        ) : (
          eventLog.map((entry, i) => (
            <Text key={i} size="xs" style={{ ...monoColor, marginBottom: 4 }} selectable>
              {entry}
            </Text>
          ))
        )}
      </Box>
    </ScrollArea>
  );
}
