/**
 * FlowDiagram — Visual flow diagrams for architecture.
 *
 * Uses enhanced block-and-arrow layout to illustrate:
 * - Message encryption flow
 * - Friend request flow
 * - Group creation flow
 * - P2P vs relay delivery
 * - Test coverage flows
 *
 * Includes step numbers, improved styling, and optional descriptions.
 */

import React from 'react';
import { View, Pressable, Linking } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import { Text, useTheme } from '@coexist/wisp-react-native';

export interface FlowStep {
  /** Label for this step */
  label: string;
  /** Optional icon */
  icon?: string;
  /** Color accent for this step */
  color?: string;
  /** Optional description shown on hover/press */
  description?: string;
}

export interface FlowDiagramProps {
  /** Title of the diagram */
  title: string;
  /** Steps in the flow */
  steps: FlowStep[];
  /** Direction of flow */
  direction?: 'horizontal' | 'vertical';
  /** Optional description below the title */
  description?: string;
  /** Optional link to related source code */
  sourceLink?: string;
}

const REPO_BASE = 'https://github.com/InfamousVague/Umbra/blob/main';

function openLink(path: string) {
  const url = `${REPO_BASE}/${path}`;
  Linking.openURL(url).catch(() => {});
}

function FlowBlock({ label, icon, color = '#3B82F6', description }: FlowStep & { stepNumber?: number }) {
  const { theme, mode } = useTheme();
  const isDark = mode === 'dark';

  return (
    <View
      style={{
        backgroundColor: color + '15',
        borderWidth: 1,
        borderColor: color + '40',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        minWidth: 90,
        shadowColor: color,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.3 : 0.1,
        shadowRadius: 4,
        elevation: 2,
      }}
      accessibilityLabel={description || label}
    >
      {icon && (
        <Text style={{ fontSize: 18, marginBottom: 4 }}>{icon}</Text>
      )}
      <Text
        style={{
          fontSize: 11,
          fontWeight: '600' as const,
          color: color,
          textAlign: 'center' as const,
          lineHeight: 14,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function Arrow({ direction, color }: { direction: 'horizontal' | 'vertical'; color?: string }) {
  const { theme } = useTheme();
  const arrowColor = color || theme.colors.text.muted;

  if (direction === 'horizontal') {
    return (
      <View style={{ alignItems: 'center', justifyContent: 'center', marginHorizontal: 2 }}>
        <View
          style={{
            width: 16,
            height: 2,
            backgroundColor: arrowColor,
            borderRadius: 1,
          }}
        />
        <View
          style={{
            position: 'absolute',
            right: 0,
            width: 0,
            height: 0,
            borderLeftWidth: 6,
            borderLeftColor: arrowColor,
            borderTopWidth: 4,
            borderTopColor: 'transparent',
            borderBottomWidth: 4,
            borderBottomColor: 'transparent',
          }}
        />
      </View>
    );
  }
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', marginVertical: 2 }}>
      <View
        style={{
          width: 2,
          height: 12,
          backgroundColor: arrowColor,
          borderRadius: 1,
        }}
      />
      <View
        style={{
          width: 0,
          height: 0,
          borderTopWidth: 6,
          borderTopColor: arrowColor,
          borderLeftWidth: 4,
          borderLeftColor: 'transparent',
          borderRightWidth: 4,
          borderRightColor: 'transparent',
        }}
      />
    </View>
  );
}

export function FlowDiagram({
  title,
  steps,
  direction = 'horizontal',
  description,
  sourceLink,
}: FlowDiagramProps) {
  const { theme, mode } = useTheme();
  const tc = theme.colors;
  const isDark = mode === 'dark';
  const isHorizontal = direction === 'horizontal';

  const styles = React.useMemo(
    () => ({
      container: {
        borderRadius: 12,
        borderWidth: 1,
        borderColor: isDark ? '#27272A' : tc.border.subtle,
        backgroundColor: isDark ? '#0C0C0E' : tc.background.sunken,
        padding: 16,
        gap: 12,
      } as ViewStyle,
      header: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        justifyContent: 'space-between' as const,
      } as ViewStyle,
      titleContainer: {
        flex: 1,
      } as ViewStyle,
      title: {
        fontSize: 12,
        fontWeight: '700' as const,
        color: tc.text.primary,
        textTransform: 'uppercase' as const,
        letterSpacing: 0.8,
      } as TextStyle,
      description: {
        fontSize: 11,
        color: tc.text.muted,
        marginTop: 4,
      } as TextStyle,
      sourceLink: {
        fontSize: 10,
        color: tc.status.info,
        fontFamily: 'monospace',
      } as TextStyle,
      flow: {
        flexDirection: isHorizontal ? ('row' as const) : ('column' as const),
        alignItems: 'center' as const,
        flexWrap: isHorizontal ? ('wrap' as const) : ('nowrap' as const),
        gap: 6,
        justifyContent: 'center' as const,
        paddingVertical: 8,
      } as ViewStyle,
      stepNumber: {
        position: 'absolute' as const,
        top: -8,
        left: -8,
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: tc.background.canvas,
        borderWidth: 1,
        borderColor: tc.border.subtle,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
      } as ViewStyle,
      stepNumberText: {
        fontSize: 9,
        fontWeight: '700' as const,
        color: tc.text.muted,
      } as TextStyle,
    }),
    [isHorizontal, tc, isDark]
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{title}</Text>
          {description && <Text style={styles.description}>{description}</Text>}
        </View>
        {sourceLink && (
          <Pressable onPress={() => openLink(sourceLink)} style={{ cursor: 'pointer' }}>
            <Text style={styles.sourceLink}>View Code</Text>
          </Pressable>
        )}
      </View>
      <View style={styles.flow}>
        {steps.map((step, i) => (
          <React.Fragment key={i}>
            <View style={{ position: 'relative' }}>
              <FlowBlock {...step} />
            </View>
            {i < steps.length - 1 && (
              <Arrow direction={direction} color={step.color ? `${step.color}60` : undefined} />
            )}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

// ── Pre-built diagrams ────────────────────────────────────────────────────

export function MessageEncryptionFlow() {
  return (
    <FlowDiagram
      title="Message Encryption Flow"
      description="End-to-end encryption using AES-256-GCM with ECDH-derived keys"
      sourceLink="packages/umbra-core/src/crypto/encryption.rs"
      steps={[
        { label: 'Plaintext', icon: '\uD83D\uDCDD', color: '#22C55E', description: 'Your message in clear text' },
        { label: 'AES-256-GCM\nEncrypt', icon: '\uD83D\uDD12', color: '#3B82F6', description: '256-bit key, 96-bit nonce' },
        { label: 'Relay\nServer', icon: '\uD83C\uDF10', color: '#EAB308', description: 'Sees only encrypted blob' },
        { label: 'AES-256-GCM\nDecrypt', icon: '\uD83D\uDD13', color: '#3B82F6', description: 'Recipient decrypts with shared key' },
        { label: 'Plaintext', icon: '\uD83D\uDCDD', color: '#22C55E', description: 'Message delivered securely' },
      ]}
    />
  );
}

export function FriendRequestFlow() {
  return (
    <FlowDiagram
      title="Friend Request Flow"
      description="Three-phase protocol: Request, Response, Acknowledgment"
      sourceLink="packages/umbra-core/src/friends/mod.rs"
      direction="vertical"
      steps={[
        { label: 'Send Request\n(with public key)', icon: '\uD83D\uDC64', color: '#8B5CF6', description: 'Ed25519 + X25519 keys included' },
        { label: 'Relay delivers\nto recipient DID', icon: '\uD83C\uDF10', color: '#EAB308', description: 'Routed by DID address' },
        { label: 'Recipient accepts\n(ECDH key exchange)', icon: '\u2705', color: '#22C55E', description: 'X25519 shared secret computed' },
        { label: 'Shared secret\nestablished', icon: '\uD83D\uDD11', color: '#3B82F6', description: 'HKDF-SHA256 derives message key' },
        { label: 'Encrypted messaging\nbegins', icon: '\uD83D\uDCAC', color: '#EC4899', description: 'AES-256-GCM conversation' },
      ]}
    />
  );
}

export function NetworkArchitectureFlow() {
  return (
    <FlowDiagram
      title="Network Architecture"
      description="Messages route through relay servers; media goes P2P via WebRTC"
      sourceLink="packages/umbra-relay/src/handler.rs"
      steps={[
        { label: 'Your\nDevice', icon: '\uD83D\uDDA5\uFE0F', color: '#22C55E', description: 'Encrypted locally before sending' },
        { label: 'Relay\nServer', icon: '\uD83C\uDF10', color: '#EAB308', description: 'Zero-knowledge routing' },
        { label: "Friend's\nDevice", icon: '\uD83D\uDDA5\uFE0F', color: '#22C55E', description: 'Decrypted locally' },
      ]}
    />
  );
}

export function RelayFederationFlow() {
  return (
    <FlowDiagram
      title="Relay Federation Mesh"
      description="Cross-region message routing via federated relay servers"
      sourceLink="packages/umbra-relay/src/federation.rs"
      steps={[
        { label: 'You\n(US Relay)', icon: '\uD83D\uDDA5\uFE0F', color: '#22C55E', description: 'Connected to nearest relay' },
        { label: 'US East\nRelay', icon: '\uD83C\uDDFA\uD83C\uDDF8', color: '#3B82F6', description: 'Primary relay server' },
        { label: 'Seoul\nRelay', icon: '\uD83C\uDDF0\uD83C\uDDF7', color: '#8B5CF6', description: 'Federated peer relay' },
        { label: 'Friend\n(Seoul Relay)', icon: '\uD83D\uDDA5\uFE0F', color: '#22C55E', description: 'Receives via local relay' },
      ]}
    />
  );
}

export function KeyDerivationFlow() {
  return (
    <FlowDiagram
      title="Key Derivation Chain"
      description="Deterministic key generation from BIP39 mnemonic"
      sourceLink="packages/umbra-core/src/crypto/kdf.rs"
      direction="vertical"
      steps={[
        { label: '24-word\nRecovery Phrase', icon: '\uD83D\uDCDD', color: '#8B5CF6', description: 'BIP39 mnemonic (256-bit entropy)' },
        { label: 'BIP39\nSeed Bytes', icon: '\uD83C\uDF31', color: '#06B6D4', description: 'PBKDF2-HMAC-SHA512 (2048 iter)' },
        { label: 'HKDF-SHA256\nKey Derivation', icon: '\u2699\uFE0F', color: '#EAB308', description: 'Domain-separated key expansion' },
        { label: 'Ed25519 Signing\n+ X25519 Encryption', icon: '\uD83D\uDD11', color: '#3B82F6', description: '32-byte keys for signing & ECDH' },
        { label: 'did:key\nIdentifier', icon: '\uD83C\uDD94', color: '#22C55E', description: 'W3C DID (multicodec 0xed01)' },
      ]}
    />
  );
}

export function OfflineDeliveryFlow() {
  return (
    <FlowDiagram
      title="Offline Message Delivery"
      description="Messages queued at relay until recipient reconnects"
      sourceLink="packages/umbra-relay/src/state.rs"
      direction="vertical"
      steps={[
        { label: 'You send message\n(friend offline)', icon: '\u2709\uFE0F', color: '#3B82F6', description: 'Encrypted before sending' },
        { label: 'Relay queues\nencrypted payload', icon: '\uD83D\uDCE5', color: '#EAB308', description: 'Stored encrypted, no plaintext' },
        { label: 'Friend comes\nonline', icon: '\uD83D\uDFE2', color: '#22C55E', description: 'WebSocket reconnects' },
        { label: 'Relay delivers\nqueued messages', icon: '\uD83D\uDCE8', color: '#06B6D4', description: 'Batch delivery on reconnect' },
        { label: 'Friend decrypts\nand reads', icon: '\uD83D\uDD13', color: '#8B5CF6', description: 'Decryption on device only' },
      ]}
    />
  );
}

export function ZeroKnowledgeFlow() {
  return (
    <FlowDiagram
      title="What the Relay Sees"
      description="Zero-knowledge: only routing metadata, never plaintext"
      sourceLink="packages/umbra-relay/src/handler.rs"
      steps={[
        { label: 'Sender\nDID', icon: '\uD83D\uDC64', color: '#3B82F6', description: 'Routing address only' },
        { label: 'Encrypted\nBlob', icon: '\uD83D\uDD12', color: '#EF4444', description: 'AES-256-GCM ciphertext' },
        { label: 'Recipient\nDID', icon: '\uD83D\uDC64', color: '#3B82F6', description: 'Destination address' },
        { label: 'Timestamp', icon: '\uD83D\uDD51', color: '#71717A', description: 'Message timing only' },
      ]}
    />
  );
}

export function GroupKeyDistributionFlow() {
  return (
    <FlowDiagram
      title="Group Key Distribution"
      description="ECDH envelope encryption for per-member key delivery"
      sourceLink="hooks/useGroups.ts"
      direction="vertical"
      steps={[
        { label: 'Admin creates group\n+ AES-256-GCM key', icon: '\uD83D\uDD11', color: '#8B5CF6', description: '32-byte random group key' },
        { label: 'Key encrypted per member\nvia ECDH (X25519)', icon: '\uD83D\uDD12', color: '#3B82F6', description: 'Individual envelope per member' },
        { label: 'Encrypted keys sent\nvia relay invites', icon: '\uD83C\uDF10', color: '#EAB308', description: 'group_invite message type' },
        { label: 'Each member decrypts\ntheir copy of the key', icon: '\uD83D\uDD13', color: '#22C55E', description: 'X25519 private key decrypts' },
        { label: 'All members can\nencrypt/decrypt group messages', icon: '\uD83D\uDCAC', color: '#EC4899', description: 'Shared group key established' },
      ]}
    />
  );
}

export function GroupKeyRotationFlow() {
  return (
    <FlowDiagram
      title="Key Rotation (on member removal)"
      description="Forward secrecy via automatic key rotation on member removal"
      sourceLink="hooks/useGroups.ts"
      direction="vertical"
      steps={[
        { label: 'Admin removes\na member', icon: '\u274C', color: '#EF4444', description: 'Triggers rotation' },
        { label: 'New AES-256-GCM\nkey generated', icon: '\uD83D\uDD11', color: '#8B5CF6', description: 'Fresh 32-byte key' },
        { label: 'New key encrypted\nfor remaining members', icon: '\uD83D\uDD12', color: '#3B82F6', description: 'ECDH per-member' },
        { label: 'Distributed via\ngroup_key_rotation', icon: '\uD83C\uDF10', color: '#EAB308', description: 'Key version incremented' },
        { label: 'Removed member\ncannot decrypt new messages', icon: '\uD83D\uDEAB', color: '#EF4444', description: 'Old key no longer valid' },
      ]}
    />
  );
}

// ── Calling diagrams ────────────────────────────────────────────────────

export function CallSignalingFlow() {
  return (
    <FlowDiagram
      title="1:1 Call Signaling (SDP Offer/Answer)"
      description="WebRTC signaling with E2E encrypted SDP exchange"
      sourceLink="services/CallManager.ts"
      direction="vertical"
      steps={[
        { label: 'Caller creates\nSDP Offer', icon: '\uD83D\uDCDE', color: '#3B82F6', description: 'Local media capabilities' },
        { label: 'Offer encrypted\n(X25519+AES-256-GCM)', icon: '\uD83D\uDD12', color: '#8B5CF6', description: 'WASM crypto module' },
        { label: 'Relay forwards\nencrypted envelope', icon: '\uD83C\uDF10', color: '#EAB308', description: 'Zero-knowledge routing' },
        { label: 'Callee decrypts\nand creates SDP Answer', icon: '\uD83D\uDD13', color: '#22C55E', description: 'Remote description set' },
        { label: 'Answer encrypted\nand sent via relay', icon: '\uD83D\uDD12', color: '#8B5CF6', description: 'Return path' },
        { label: 'ICE candidates\nexchanged (trickle)', icon: '\u2744\uFE0F', color: '#06B6D4', description: 'NAT traversal' },
        { label: 'P2P media\nconnection established', icon: '\u2705', color: '#10B981', description: 'Direct peer connection' },
      ]}
    />
  );
}

export function ICENegotiationFlow() {
  return (
    <FlowDiagram
      title="ICE Candidate Resolution"
      description="Network path discovery for optimal P2P connectivity"
      sourceLink="config/network.ts"
      direction="vertical"
      steps={[
        { label: 'Gather local\ncandidates', icon: '\uD83D\uDCE1', color: '#3B82F6', description: 'Host (local IP) candidates' },
        { label: 'Try STUN\n(public IP discovery)', icon: '\uD83C\uDF10', color: '#06B6D4', description: 'Server-reflexive candidates' },
        { label: 'Try TURN\n(relay fallback)', icon: '\uD83D\uDD04', color: '#EAB308', description: 'Relay candidates for NAT' },
        { label: 'HMAC-SHA1\ncredential auth', icon: '\uD83D\uDD11', color: '#8B5CF6', description: 'Time-limited TURN auth' },
        { label: 'Best candidate\npair selected', icon: '\u2705', color: '#22C55E', description: 'Lowest latency path wins' },
      ]}
    />
  );
}

export function MediaE2EEFlow() {
  return (
    <FlowDiagram
      title="Frame-Level E2EE (AES-256-GCM)"
      description="Optional per-frame encryption via RTCRtpScriptTransform"
      sourceLink="services/callCrypto.ts"
      direction="vertical"
      steps={[
        { label: 'Shared key derived\n(SHA-256 of identities)', icon: '\uD83D\uDD11', color: '#8B5CF6', description: 'our_id || peer_key || call_id' },
        { label: 'Key sent to\nWeb Worker', icon: '\u2699\uFE0F', color: '#6366F1', description: 'Inline Blob URL worker' },
        { label: 'Each media frame\ngets fresh 96-bit IV', icon: '\uD83C\uDFB2', color: '#06B6D4', description: 'crypto.getRandomValues()' },
        { label: 'Frame encrypted\n(AES-256-GCM)', icon: '\uD83D\uDD12', color: '#EF4444', description: 'SubtleCrypto.encrypt()' },
        { label: 'IV prepended\nto ciphertext', icon: '\uD83D\uDCE6', color: '#EAB308', description: '12 bytes + encrypted frame' },
        { label: 'Recipient worker\ndecrypts with same key', icon: '\uD83D\uDD13', color: '#22C55E', description: 'Symmetric key shared' },
      ]}
    />
  );
}

export function GroupCallMeshFlow() {
  return (
    <FlowDiagram
      title="Group Call Mesh Topology (2-6 peers)"
      description="Full mesh: each peer connects to all others (N*(N-1)/2 connections)"
      sourceLink="services/GroupCallManager.ts"
      steps={[
        { label: 'Peer A', icon: '\uD83D\uDDA5\uFE0F', color: '#3B82F6', description: 'Full mesh connection' },
        { label: 'Peer B', icon: '\uD83D\uDDA5\uFE0F', color: '#22C55E', description: 'Full mesh connection' },
        { label: 'Peer C', icon: '\uD83D\uDDA5\uFE0F', color: '#8B5CF6', description: 'Full mesh connection' },
        { label: 'Peer D', icon: '\uD83D\uDDA5\uFE0F', color: '#EC4899', description: 'Full mesh connection' },
      ]}
    />
  );
}

export function TURNCredentialFlow() {
  return (
    <FlowDiagram
      title="TURN Credential Resolution"
      description="RFC 5389 time-limited credential resolution chain"
      sourceLink="config/network.ts"
      direction="vertical"
      steps={[
        { label: 'Check local\ncredential cache', icon: '\uD83D\uDCBE', color: '#6366F1', description: 'Valid if >1h remaining' },
        { label: 'Fetch from relay\n/turn-credentials', icon: '\uD83C\uDF10', color: '#3B82F6', description: 'HTTP endpoint' },
        { label: 'Fallback: generate\nfrom env secret', icon: '\uD83D\uDD11', color: '#EAB308', description: 'EXPO_PUBLIC_TURN_SECRET' },
        { label: 'HMAC-SHA1 signed\ntime-limited credential', icon: '\u23F0', color: '#22C55E', description: '{expiry}:umbra username' },
        { label: 'Cached for reuse\n(24h TTL, 1h buffer)', icon: '\uD83D\uDCBE', color: '#8B5CF6', description: 'Refreshed before expiry' },
      ]}
    />
  );
}

export function CallEncryptionLayersFlow() {
  return (
    <FlowDiagram
      title="Call Encryption Layers"
      description="Three layers: signaling, transport, and optional frame E2EE"
      sourceLink="services/CallManager.ts"
      steps={[
        { label: 'Signal\nEncryption', icon: '\uD83D\uDD12', color: '#8B5CF6', description: 'X25519+AES-256-GCM' },
        { label: 'DTLS-SRTP\nTransport', icon: '\uD83D\uDEE1\uFE0F', color: '#3B82F6', description: 'WebRTC standard' },
        { label: 'Frame E2EE\n(optional)', icon: '\uD83D\uDD10', color: '#EF4444', description: 'Per-frame AES-256-GCM' },
      ]}
    />
  );
}

// ── General diagrams ────────────────────────────────────────────────────

export function PINLockFlow() {
  return (
    <FlowDiagram
      title="PIN Lock Security"
      description="Brute-force protection with attempt limiting and cooldown"
      sourceLink="contexts/AuthContext.tsx"
      direction="vertical"
      steps={[
        { label: 'User enters\nPIN code', icon: '\uD83D\uDD22', color: '#3B82F6', description: 'Numeric PIN input' },
        { label: 'Compare to\nstored PIN', icon: '\uD83D\uDD0D', color: '#8B5CF6', description: 'Local verification' },
        { label: 'Success:\nunlock app', icon: '\uD83D\uDD13', color: '#22C55E', description: 'Counter reset' },
        { label: 'Failure: increment\nattempt counter', icon: '\u274C', color: '#EF4444', description: 'Track failures' },
        { label: 'Max 5 failures\n\u2192 30s cooldown', icon: '\u23F1\uFE0F', color: '#F97316', description: 'Rate limiting' },
      ]}
    />
  );
}

export function MessageStatusFlow() {
  return (
    <FlowDiagram
      title="Message Status Lifecycle"
      description="Status updates tracked via relay acknowledgments"
      sourceLink="hooks/useMessages.ts"
      steps={[
        { label: 'Sending', icon: '\u23F3', color: '#71717A', description: 'Queued locally' },
        { label: 'Sent\n(relay ack)', icon: '\u2713', color: '#3B82F6', description: 'Relay received' },
        { label: 'Delivered', icon: '\u2713\u2713', color: '#22C55E', description: 'Recipient received' },
        { label: 'Read', icon: '\uD83D\uDC41\uFE0F', color: '#8B5CF6', description: 'Recipient viewed' },
      ]}
    />
  );
}

export function StorageEncryptionFlow() {
  return (
    <FlowDiagram
      title="Local Storage Encryption"
      description="Database encrypted with storage key derived from recovery phrase"
      sourceLink="packages/umbra-core/src/storage/secure_store.rs"
      direction="vertical"
      steps={[
        { label: 'Recovery phrase\n(24 words)', icon: '\uD83D\uDCDD', color: '#8B5CF6', description: 'BIP39 mnemonic' },
        { label: 'HKDF-SHA256\n(storage-key-v1)', icon: '\u2699\uFE0F', color: '#EAB308', description: 'Domain-separated' },
        { label: 'Storage key\n(32 bytes)', icon: '\uD83D\uDD11', color: '#3B82F6', description: 'AES-256 key' },
        { label: 'Encrypt SQLite\n(AES-256)', icon: '\uD83D\uDD12', color: '#EF4444', description: 'Database encryption' },
        { label: 'Persist to\nIndexedDB (by DID)', icon: '\uD83D\uDCBE', color: '#22C55E', description: 'Multi-identity support' },
      ]}
    />
  );
}

// ── Test coverage diagram ────────────────────────────────────────────────

export function TestCoverageFlow() {
  return (
    <FlowDiagram
      title="Test Coverage Architecture"
      description="Unit tests, integration tests, and E2E tests across the codebase"
      sourceLink="__tests__"
      steps={[
        { label: 'Unit Tests\n(hooks/services)', icon: '\uD83E\uDDEA', color: '#3B82F6', description: 'Jest + React Testing Library' },
        { label: 'Integration\nTests', icon: '\uD83D\uDD17', color: '#22C55E', description: 'Cross-component flows' },
        { label: 'E2E Tests\n(Playwright)', icon: '\uD83C\uDFAD', color: '#8B5CF6', description: 'Full user journeys' },
        { label: 'WASM Tests\n(Rust)', icon: '\uD83E\uDD80', color: '#F97316', description: 'Crypto module tests' },
      ]}
    />
  );
}

// ── Architecture overview diagram ────────────────────────────────────────

export function ArchitectureOverviewFlow() {
  return (
    <FlowDiagram
      title="System Architecture"
      description="Frontend (React Native) + WASM crypto + Rust relay servers"
      sourceLink="packages"
      steps={[
        { label: 'React Native\n+ Expo', icon: '\u269B\uFE0F', color: '#61DAFB', description: 'Cross-platform UI' },
        { label: 'umbra-wasm\n(Rust WASM)', icon: '\uD83E\uDD80', color: '#F97316', description: 'Crypto operations' },
        { label: 'umbra-relay\n(Rust server)', icon: '\uD83D\uDE80', color: '#22C55E', description: 'Message routing' },
        { label: 'WebRTC\n(P2P media)', icon: '\uD83D\uDCDE', color: '#8B5CF6', description: 'Voice/video calls' },
      ]}
    />
  );
}
