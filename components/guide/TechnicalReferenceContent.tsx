/**
 * TechnicalReferenceContent — Protocols, algorithms, formats, and specs.
 * Includes links to source code and test files for each specification.
 */

import React from 'react';
import { View, Pressable, Platform } from 'react-native';
import { Text, useTheme } from '@coexist/wisp-react-native';

import { TechSpec } from '@/components/guide/TechSpec';
import { ExternalLinkIcon } from '@/components/icons';

const REPO_BASE = 'https://github.com/InfamousVague/Umbra/blob/main';

function SourceLink({ label, path }: { label: string; path: string }) {
  const { theme } = useTheme();

  const openLink = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(`${REPO_BASE}/${path}`, '_blank');
    }
  };

  return (
    <Pressable
      onPress={openLink}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: theme.colors.background.sunken,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: theme.colors.border.subtle,
      }}
    >
      <ExternalLinkIcon size={10} color={theme.colors.status.info} />
      <Text
        style={{
          fontSize: 11,
          color: theme.colors.status.info,
          fontFamily: 'monospace',
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function TechnicalReferenceContent() {
  const { theme, mode } = useTheme();
  const tc = theme.colors;
  const isDark = mode === 'dark';

  return (
    <View style={{ gap: 12 }}>
      {/* Quick links */}
      <View
        style={{
          backgroundColor: isDark ? '#18181B' : tc.background.sunken,
          borderRadius: 10,
          padding: 14,
          borderWidth: 1,
          borderColor: isDark ? '#27272A' : tc.border.subtle,
        }}
      >
        <Text
          style={{
            fontSize: 12,
            fontWeight: '600',
            color: tc.text.muted,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: 8,
          }}
        >
          Source Code Reference
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          <SourceLink label="encryption.rs" path="packages/umbra-core/src/crypto/encryption.rs" />
          <SourceLink label="keys.rs" path="packages/umbra-core/src/crypto/keys.rs" />
          <SourceLink label="kdf.rs" path="packages/umbra-core/src/crypto/kdf.rs" />
          <SourceLink label="signing.rs" path="packages/umbra-core/src/crypto/signing.rs" />
          <SourceLink label="messaging/mod.rs" path="packages/umbra-core/src/messaging/mod.rs" />
          <SourceLink label="friends/mod.rs" path="packages/umbra-core/src/friends/mod.rs" />
          <SourceLink label="schema.rs" path="packages/umbra-core/src/storage/schema.rs" />
        </View>
      </View>

      <TechSpec
        title="Cryptographic Algorithms"
        accentColor="#6366F1"
        entries={[
          { label: 'Signing', value: 'Ed25519 (Edwards curve)' },
          { label: 'Key Exchange', value: 'X25519 ECDH (Curve25519)' },
          { label: 'Symmetric Cipher', value: 'AES-256-GCM (AEAD)' },
          { label: 'Key Derivation', value: 'HKDF-SHA256 (domain separated)' },
          { label: 'Seed Derivation', value: 'PBKDF2-HMAC-SHA512 (2048 iter)' },
          { label: 'Mnemonic', value: 'BIP39 (24 words, 256-bit entropy)' },
          { label: 'Hash Function', value: 'SHA-256 / SHA-512' },
          { label: 'CSPRNG', value: 'window.crypto / OS /dev/urandom' },
          { label: 'TURN Auth', value: 'HMAC-SHA1 (RFC 5389)' },
        ]}
      />

      <TechSpec
        title="Protocol Versions"
        accentColor="#3B82F6"
        entries={[
          { label: 'Messaging', value: '/umbra/messaging/1.0.0' },
          { label: 'Friends', value: '/umbra/friends/1.0.0' },
          { label: 'Relay', value: 'WebSocket JSON v1' },
          { label: 'Schema Version', value: '2' },
          { label: 'Call Signaling', value: 'WebRTC SDP + trickle ICE' },
        ]}
      />

      <TechSpec
        title="Message Envelope Schema"
        accentColor="#8B5CF6"
        entries={[
          { label: 'version', value: 'Protocol version (integer)' },
          { label: 'id', value: 'UUID v4 (message identifier)' },
          { label: 'msg_type', value: 'ChatMessage | Signal | Session' },
          { label: 'sender_did', value: 'did:key:z... (Ed25519)' },
          { label: 'recipient_did', value: 'DID or group ID' },
          { label: 'timestamp', value: 'Unix timestamp (ms)' },
          { label: 'nonce', value: '96-bit (12 bytes, Base64)' },
          { label: 'ciphertext', value: 'AES-256-GCM output (Base64)' },
          { label: 'signature', value: 'Ed25519 over full envelope (Hex)' },
        ]}
      />

      <TechSpec
        title="Data Formats"
        accentColor="#22C55E"
        entries={[
          { label: 'Identity', value: 'did:key (Ed25519 multicodec 0xed01)' },
          { label: 'Public Key Encoding', value: 'Base58btc (z-prefixed)' },
          { label: 'Nonce Encoding', value: 'Base64' },
          { label: 'Ciphertext Encoding', value: 'Base64' },
          { label: 'Signature Encoding', value: 'Hex' },
          { label: 'Serialization', value: 'JSON' },
          { label: 'AAD Format', value: '{sender_did}|{recipient_did}|{ts}' },
          { label: 'Database', value: 'SQLite (sql.js WASM / rusqlite)' },
          { label: 'WASM Runtime', value: 'wasm-bindgen 0.2.x' },
        ]}
      />

      <TechSpec
        title="Database Schema"
        accentColor="#EC4899"
        entries={[
          { label: 'Schema Version', value: '2' },
          { label: 'Core Tables', value: 'friends, conversations, messages' },
          { label: 'Group Tables', value: 'groups, group_members, group_keys' },
          { label: 'Social Tables', value: 'friend_requests, blocked_users' },
          { label: 'Metadata', value: 'reactions, settings' },
          { label: 'Web Storage', value: 'sql.js (WASM) + IndexedDB' },
          { label: 'Desktop Storage', value: 'rusqlite (native file)' },
          { label: 'Encryption', value: 'Storage key via HKDF-SHA256' },
        ]}
      />

      <TechSpec
        title="Architecture"
        accentColor="#06B6D4"
        entries={[
          { label: 'Frontend', value: 'React Native + Expo' },
          { label: 'Crypto Backend', value: 'Rust (WASM via wasm-bindgen)' },
          { label: 'UI Library', value: 'Wisp React Native' },
          { label: 'Relay Server', value: 'Rust (Tokio + Axum)' },
          { label: 'Federation', value: 'WebSocket mesh (rustls/ring)' },
          { label: 'Desktop', value: 'Tauri v2' },
          { label: 'Build', value: 'wasm-pack + Cargo' },
          { label: 'WebRTC', value: 'Browser RTCPeerConnection API' },
        ]}
      />

      <TechSpec
        title="Federation Protocol"
        accentColor="#F97316"
        entries={[
          { label: 'Peer Discovery', value: 'Static config (relay URLs)' },
          { label: 'Transport', value: 'WSS (rustls / ring provider)' },
          { label: 'Handshake', value: 'Hello + PresenceSync' },
          { label: 'Presence Gossip', value: 'Online/Offline events' },
          { label: 'Heartbeat', value: '30s full sync' },
          { label: 'Reconnect', value: '1s \u2192 60s exponential backoff' },
          { label: 'Routing', value: 'DID \u2192 peer index O(1) HashMap' },
          { label: 'Forwarding', value: 'Signal, Message, Session' },
        ]}
      />
    </View>
  );
}
