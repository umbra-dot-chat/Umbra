/**
 * GuideScreen — Main in-app user manual and help guide.
 *
 * A rich, interactive help screen with collapsible sections,
 * search, feature documentation, architecture diagrams,
 * and technical specifications.
 */

import React, { useState, useMemo } from 'react';
import { View, ScrollView } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import { Text, useTheme } from '@coexist/wisp-react-native';

import { GuideSection } from './GuideSection';
import { FeatureCard } from './FeatureCard';
import {
  FlowDiagram,
  MessageEncryptionFlow,
  FriendRequestFlow,
  NetworkArchitectureFlow,
  RelayFederationFlow,
  KeyDerivationFlow,
  OfflineDeliveryFlow,
  ZeroKnowledgeFlow,
  GroupKeyDistributionFlow,
  GroupKeyRotationFlow,
} from './FlowDiagram';
import { TechSpec } from './TechSpec';
import { StatCard } from './StatCard';
import {
  BookOpenIcon, UsersIcon, MessageIcon, SettingsIcon, ShieldIcon,
  PlusIcon, ServerIcon, GlobeIcon, KeyIcon, LockIcon, ZapIcon,
  NetworkIcon, DatabaseIcon, ActivityIcon, MapPinIcon,
} from '@/components/icons';

// ── Section definitions ────────────────────────────────────────────────

interface SectionDef {
  id: string;
  title: string;
  subtitle: string;
  iconBg: string;
  keywords: string[];
}

const SECTIONS: SectionDef[] = [
  { id: 'getting-started', title: 'Getting Started', subtitle: 'Create your identity and connect', iconBg: '#22C55E', keywords: ['identity', 'create', 'recovery', 'pin', 'start'] },
  { id: 'friends', title: 'Friends', subtitle: 'Add and manage friends', iconBg: '#8B5CF6', keywords: ['friend', 'request', 'add', 'block', 'accept', 'reject'] },
  { id: 'messaging', title: 'Messaging', subtitle: 'Send encrypted messages', iconBg: '#3B82F6', keywords: ['message', 'send', 'edit', 'delete', 'pin', 'reaction', 'thread', 'reply', 'forward'] },
  { id: 'groups', title: 'Groups', subtitle: 'Group conversations', iconBg: '#EC4899', keywords: ['group', 'create', 'member', 'admin'] },
  { id: 'security', title: 'Security & Privacy', subtitle: 'Encryption and key management', iconBg: '#EAB308', keywords: ['encrypt', 'key', 'privacy', 'security', 'e2e', 'did', 'aes', 'x25519', 'ed25519', 'zero-knowledge'] },
  { id: 'network', title: 'Network & Architecture', subtitle: 'How Umbra connects peers', iconBg: '#06B6D4', keywords: ['network', 'relay', 'p2p', 'webrtc', 'offline', 'federation', 'mesh', 'websocket', 'server'] },
  { id: 'limitations', title: 'Known Limitations', subtitle: 'Current feature status', iconBg: '#F97316', keywords: ['limit', 'known', 'issue', 'status', 'bug'] },
  { id: 'technical', title: 'Technical Reference', subtitle: 'Protocols, formats, and specs', iconBg: '#6366F1', keywords: ['technical', 'protocol', 'format', 'crypto', 'spec', 'reference'] },
];

// ── Main component ────────────────────────────────────────────────────

export function GuideScreen() {
  const { theme } = useTheme();
  const [search, setSearch] = useState('');

  const filteredSections = useMemo(() => {
    if (!search.trim()) return SECTIONS;
    const q = search.toLowerCase();
    return SECTIONS.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.subtitle.toLowerCase().includes(q) ||
        s.keywords.some((k) => k.includes(q))
    );
  }, [search]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <BookOpenIcon size={28} color="#FAFAFA" />
        </View>
        <Text style={styles.headerTitle}>Umbra User Guide</Text>
        <Text style={styles.headerSubtitle}>
          End-to-end encrypted, decentralized messaging
        </Text>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <StatCard label="Encryption" value="E2E" color="#22C55E" icon={<LockIcon size={20} color="#22C55E" />} />
        <StatCard label="Protocol" value="DID" color="#8B5CF6" icon={<KeyIcon size={20} color="#8B5CF6" />} />
        <StatCard label="Relay" value="Mesh" color="#06B6D4" icon={<NetworkIcon size={20} color="#06B6D4" />} />
        <StatCard label="Storage" value="Local" color="#3B82F6" icon={<DatabaseIcon size={20} color="#3B82F6" />} />
      </View>

      {/* ── Getting Started ──────────────────────────────────────── */}
      {filteredSections.some((s) => s.id === 'getting-started') && (
        <GuideSection
          title="Getting Started"
          subtitle="Create your identity and connect to the network"
          icon={<PlusIcon size={20} color="#FFF" />}
          iconBg="#22C55E"
          defaultExpanded
        >
          <FeatureCard
            icon={<KeyIcon size={16} color="#22C55E" />}
            title="Create Identity"
            description="Generate a new decentralized identity (DID) with a unique cryptographic key pair. Your identity is stored locally and never shared with any server."
            status="working"
            howTo={[
              'Open Umbra for the first time',
              'Enter your display name',
              'Save your 24-word recovery phrase securely',
              'Optionally set a PIN for app lock',
            ]}
            limitations={[
              'Recovery phrase is the only way to restore your identity',
              'Display name is not unique — use DID for identification',
            ]}
            sourceLinks={[
              { label: 'did.rs', path: 'packages/umbra-core/src/identity/did.rs' },
              { label: 'keys.rs', path: 'packages/umbra-core/src/crypto/keys.rs' },
              { label: 'CreateWalletFlow.tsx', path: 'components/auth/CreateWalletFlow.tsx' },
            ]}
          />
          <FeatureCard
            icon={<ShieldIcon size={16} color="#8B5CF6" />}
            title="Recovery Phrase"
            description="A 24-word BIP39 mnemonic that can restore your identity on any device. This phrase generates your cryptographic keys deterministically."
            status="working"
            howTo={[
              'Write down all 24 words in order',
              'Store them in a secure, offline location',
              'Never share your recovery phrase with anyone',
            ]}
            limitations={[
              'If lost, your identity cannot be recovered',
              'Anyone with your phrase can impersonate you',
            ]}
            sourceLinks={[
              { label: 'recovery.rs', path: 'packages/umbra-core/src/identity/recovery.rs' },
              { label: 'kdf.rs', path: 'packages/umbra-core/src/crypto/kdf.rs' },
              { label: 'ImportWalletFlow.tsx', path: 'components/auth/ImportWalletFlow.tsx' },
            ]}
          />
          <FeatureCard
            icon={<LockIcon size={16} color="#3B82F6" />}
            title="PIN Lock"
            description="Set a numeric PIN to lock the app. Prevents unauthorized access without needing to re-enter your recovery phrase."
            status="working"
            howTo={[
              'Go to Settings',
              'Enable PIN lock',
              'Enter your desired PIN',
              'Confirm your PIN',
            ]}
            sourceLinks={[
              { label: 'PinLockScreen.tsx', path: 'components/auth/PinLockScreen.tsx' },
              { label: 'AuthContext.tsx', path: 'contexts/AuthContext.tsx' },
            ]}
          />
        </GuideSection>
      )}

      {/* ── Friends ──────────────────────────────────────────────── */}
      {filteredSections.some((s) => s.id === 'friends') && (
        <GuideSection
          title="Friends"
          subtitle="Add friends and manage connections"
          icon={<UsersIcon size={20} color="#FFF" />}
          iconBg="#8B5CF6"
        >
          <FeatureCard
            icon={<PlusIcon size={16} color="#8B5CF6" />}
            title="Add Friends"
            description="Send a friend request using their DID (decentralized identifier). Both parties must be connected to the relay for delivery."
            status="working"
            howTo={[
              'Go to the Friends tab',
              "Paste your friend's DID in the Add Friend input",
              'Optionally add a message',
              'Click Send Request',
            ]}
            limitations={[
              'Recipient must be online or have offline delivery enabled',
              'DID must be exact — there is no username search',
            ]}
            sourceLinks={[
              { label: 'friends/mod.rs', path: 'packages/umbra-core/src/friends/mod.rs' },
              { label: 'useFriends.ts', path: 'hooks/useFriends.ts' },
              { label: 'FriendComponents.tsx', path: 'components/friends/FriendComponents.tsx' },
            ]}
          />
          <FeatureCard
            title="Accept/Reject Requests"
            description="Incoming friend requests appear in the Pending tab. Accepting triggers a key exchange that enables encrypted messaging."
            status="working"
            howTo={[
              'Go to Friends > Pending tab',
              'Review incoming requests',
              'Click Accept or Reject',
            ]}
            sourceLinks={[
              { label: 'friends/mod.rs', path: 'packages/umbra-core/src/friends/mod.rs' },
              { label: 'useFriends.ts', path: 'hooks/useFriends.ts' },
            ]}
          />
          <FeatureCard
            title="Block/Unblock"
            description="Block a user to prevent them from sending you messages or friend requests."
            status="working"
            sourceLinks={[
              { label: 'friends/mod.rs', path: 'packages/umbra-core/src/friends/mod.rs' },
            ]}
          />
          <FriendRequestFlow />
        </GuideSection>
      )}

      {/* ── Messaging ────────────────────────────────────────────── */}
      {filteredSections.some((s) => s.id === 'messaging') && (
        <GuideSection
          title="Messaging"
          subtitle="Send and manage encrypted messages"
          icon={<MessageIcon size={20} color="#FFF" />}
          iconBg="#3B82F6"
        >
          <FeatureCard
            icon={<LockIcon size={16} color="#3B82F6" />}
            title="Send Messages"
            description="Messages are end-to-end encrypted using AES-256-GCM with a shared secret derived via X25519 ECDH. Only you and your friend can read them."
            status="working"
            howTo={[
              'Select a conversation from the sidebar',
              'Type your message in the input field',
              'Press Enter or click Send',
            ]}
            sourceLinks={[
              { label: 'encryption.rs', path: 'packages/umbra-core/src/crypto/encryption.rs' },
              { label: 'messaging/mod.rs', path: 'packages/umbra-core/src/messaging/mod.rs' },
              { label: 'useMessages.ts', path: 'hooks/useMessages.ts' },
            ]}
          />
          <FeatureCard
            title="Edit Messages"
            description="Edit the text of a message you sent. The edited message will show an (edited) indicator to the other participant."
            status="working"
            howTo={[
              'Hover over your sent message',
              'Click the edit (pencil) icon',
              'Modify the text and confirm',
            ]}
            sourceLinks={[
              { label: 'useMessages.ts', path: 'hooks/useMessages.ts' },
            ]}
          />
          <FeatureCard
            title="Delete Messages"
            description="Delete a message you sent. The other participant will see a [Message deleted] placeholder."
            status="working"
            sourceLinks={[
              { label: 'useMessages.ts', path: 'hooks/useMessages.ts' },
            ]}
          />
          <FeatureCard
            title="Pin Messages"
            description="Pin important messages to the top of a conversation for easy reference. View all pinned messages in the Pins panel."
            status="working"
            howTo={[
              'Hover over any message',
              'Click the pin icon',
              'View pinned messages in the right panel',
            ]}
            sourceLinks={[
              { label: 'useMessages.ts', path: 'hooks/useMessages.ts' },
            ]}
          />
          <FeatureCard
            title="Reactions"
            description="React to messages with emoji. Reactions are visible to all participants."
            status="working"
            howTo={[
              'Hover over any message',
              'Click the reaction (smiley) icon',
              'Select an emoji',
            ]}
            sourceLinks={[
              { label: 'useMessages.ts', path: 'hooks/useMessages.ts' },
            ]}
          />
          <FeatureCard
            title="Thread Replies"
            description="Reply to a specific message to start a thread. Threads keep related messages organized."
            status="working"
            howTo={[
              'Hover over any message',
              'Click the reply icon',
              'Type your reply in the thread panel',
            ]}
            sourceLinks={[
              { label: 'useMessages.ts', path: 'hooks/useMessages.ts' },
              { label: 'ChatArea.tsx', path: 'components/chat/ChatArea.tsx' },
            ]}
          />
          <FeatureCard
            title="Forward Messages"
            description="Forward a message to another conversation. The forwarded message is re-encrypted for the new recipient."
            status="working"
            sourceLinks={[
              { label: 'encryption.rs', path: 'packages/umbra-core/src/crypto/encryption.rs' },
              { label: 'useMessages.ts', path: 'hooks/useMessages.ts' },
            ]}
          />
          <MessageEncryptionFlow />
        </GuideSection>
      )}

      {/* ── Groups ───────────────────────────────────────────────── */}
      {filteredSections.some((s) => s.id === 'groups') && (
        <GuideSection
          title="Groups"
          subtitle="Create and manage group conversations"
          icon={<UsersIcon size={20} color="#FFF" />}
          iconBg="#EC4899"
        >
          <FeatureCard
            icon={<UsersIcon size={16} color="#EC4899" />}
            title="Create Groups"
            description="Create a group conversation and invite friends. A unique AES-256-GCM group key is generated and distributed to each member via individual ECDH-encrypted envelopes. Each message is encrypted with the group key so all members can decrypt it."
            status="working"
            howTo={[
              'Click Create Group in the sidebar',
              'Enter a group name and optional description',
              'Select friends to add as initial members',
              'Click Create Group',
            ]}
            sourceLinks={[
              { label: 'useGroups.ts', path: 'hooks/useGroups.ts' },
              { label: 'encryption.rs', path: 'packages/umbra-core/src/crypto/encryption.rs' },
              { label: 'CreateGroupDialog.tsx', path: 'components/groups/CreateGroupDialog.tsx' },
            ]}
          />
          <FeatureCard
            title="Manage Members"
            description="Add or remove members from a group. Group admins (the creator) can manage membership."
            status="working"
            howTo={[
              'Open a group conversation',
              'Click the settings icon in the header',
              'Add or remove members',
            ]}
            limitations={[
              'Only the group admin can add/remove members',
              'Removed members cannot see new messages',
            ]}
            sourceLinks={[
              { label: 'useGroups.ts', path: 'hooks/useGroups.ts' },
              { label: 'GroupMemberList.tsx', path: 'components/groups/GroupMemberList.tsx' },
            ]}
          />
          <FeatureCard
            title="Group Settings"
            description="Edit group name, description, and manage the group lifecycle."
            status="working"
            howTo={[
              'Open group settings from the chat header',
              'Edit the name or description',
              'Click Save to apply changes',
            ]}
            sourceLinks={[
              { label: 'useGroups.ts', path: 'hooks/useGroups.ts' },
              { label: 'schema.rs', path: 'packages/umbra-core/src/storage/schema.rs' },
            ]}
          />
          <GroupKeyDistributionFlow />
          <GroupKeyRotationFlow />
        </GuideSection>
      )}

      {/* ── Security & Privacy ───────────────────────────────────── */}
      {filteredSections.some((s) => s.id === 'security') && (
        <GuideSection
          title="Security & Privacy"
          subtitle="How Umbra protects your data"
          icon={<ShieldIcon size={20} color="#FFF" />}
          iconBg="#EAB308"
        >
          <FeatureCard
            icon={<LockIcon size={16} color="#22C55E" />}
            title="End-to-End Encryption"
            description="Every message is encrypted on your device before transmission using AES-256-GCM, the same cipher used by government and military systems. The encryption key is derived from a shared secret established via X25519 Elliptic-Curve Diffie-Hellman (ECDH) key exchange. Neither the relay server, network operators, nor anyone else can read your messages — only you and your intended recipient hold the keys."
            status="working"
            howTo={[
              'Encryption is automatic — no setup required',
              'Each conversation has a unique shared secret',
              'Messages include authenticated additional data (AAD) binding sender, recipient, and timestamp',
              'A fresh 96-bit nonce is generated per message to prevent replay attacks',
            ]}
            sourceLinks={[
              { label: 'encryption.rs', path: 'packages/umbra-core/src/crypto/encryption.rs' },
              { label: 'keys.rs', path: 'packages/umbra-core/src/crypto/keys.rs' },
              { label: 'messaging/mod.rs', path: 'packages/umbra-core/src/messaging/mod.rs' },
            ]}
          />
          <MessageEncryptionFlow />
          <FeatureCard
            icon={<KeyIcon size={16} color="#8B5CF6" />}
            title="Key Management"
            description="Your cryptographic identity is derived deterministically from your 24-word BIP39 recovery phrase. The seed is processed through HKDF-SHA256 to produce two key pairs: an Ed25519 signing key (for identity and authentication) and an X25519 encryption key (for ECDH shared secret derivation). All keys are stored locally in an encrypted SQLite database and never leave your device."
            status="working"
            howTo={[
              'Keys are generated automatically from your recovery phrase',
              'Ed25519 key is used for signing and identity verification',
              'X25519 key is used for establishing encrypted channels',
              'The same phrase always produces the same keys (deterministic)',
            ]}
            sourceLinks={[
              { label: 'keys.rs', path: 'packages/umbra-core/src/crypto/keys.rs' },
              { label: 'kdf.rs', path: 'packages/umbra-core/src/crypto/kdf.rs' },
              { label: 'signing.rs', path: 'packages/umbra-core/src/crypto/signing.rs' },
              { label: 'secure_store.rs', path: 'packages/umbra-core/src/storage/secure_store.rs' },
            ]}
          />
          <KeyDerivationFlow />
          <FeatureCard
            icon={<GlobeIcon size={16} color="#06B6D4" />}
            title="Decentralized Identity (DID)"
            description="Umbra uses the did:key method to create self-sovereign identifiers derived from your Ed25519 public key. Your DID is your permanent address on the network — there is no centralized account server, no email verification, and no phone number required. You own your identity completely."
            status="working"
            howTo={[
              'Your DID is generated automatically from your key pair',
              'Share your DID with friends to connect',
              'DIDs are globally unique and cryptographically verifiable',
              'No server can revoke or modify your identity',
            ]}
            sourceLinks={[
              { label: 'did.rs', path: 'packages/umbra-core/src/identity/did.rs' },
              { label: 'identity/mod.rs', path: 'packages/umbra-core/src/identity/mod.rs' },
            ]}
          />
          <FeatureCard
            icon={<ShieldIcon size={16} color="#EAB308" />}
            title="Zero-Knowledge Relay"
            description="The relay server operates on a zero-knowledge principle. It routes encrypted envelopes between peers but cannot decrypt, inspect, or modify message content. The relay has no access to your private keys, friend list, message history, or any plaintext data."
            status="working"
            limitations={[
              'Relay sees sender + recipient DIDs (necessary for routing)',
              'Relay sees encrypted message size and timestamps',
              'Relay cannot read message content or metadata',
              'Relay does not store messages permanently — only queues for offline delivery',
              'Relay cannot correlate friend relationships or conversation patterns',
            ]}
            sourceLinks={[
              { label: 'handler.rs', path: 'packages/umbra-relay/src/handler.rs' },
              { label: 'protocol.rs', path: 'packages/umbra-relay/src/protocol.rs' },
              { label: 'state.rs', path: 'packages/umbra-relay/src/state.rs' },
            ]}
          />
          <ZeroKnowledgeFlow />
          <TechSpec
            title="Encryption at a Glance"
            accentColor="#EAB308"
            entries={[
              { label: 'Message Cipher', value: 'AES-256-GCM' },
              { label: 'Key Exchange', value: 'X25519 ECDH' },
              { label: 'Signing', value: 'Ed25519' },
              { label: 'Key Derivation', value: 'HKDF-SHA256' },
              { label: 'Nonce Size', value: '96 bits (per message)' },
              { label: 'Identity Format', value: 'did:key (Ed25519)' },
              { label: 'Recovery Phrase', value: 'BIP39 (24 words)' },
            ]}
          />
        </GuideSection>
      )}

      {/* ── Network & Architecture ───────────────────────────────── */}
      {filteredSections.some((s) => s.id === 'network') && (
        <GuideSection
          title="Network & Architecture"
          subtitle="How Umbra connects peers"
          icon={<GlobeIcon size={20} color="#FFF" />}
          iconBg="#06B6D4"
        >
          <FeatureCard
            icon={<ServerIcon size={16} color="#EAB308" />}
            title="Relay Server"
            description="The relay server is a lightweight message router that acts as a mailbox for encrypted messages. When both peers are online, messages are delivered in real-time via persistent WebSocket connections. When a peer is offline, messages are encrypted-at-rest in a queue until the recipient reconnects. The relay is written in Rust for performance and minimal resource usage."
            status="working"
            howTo={[
              'Your client connects to the relay automatically on startup',
              'The relay authenticates your DID and registers your presence',
              'Messages are routed by DID — the relay matches sender to recipient',
              'Multiple relay servers can be configured for redundancy',
            ]}
            sourceLinks={[
              { label: 'main.rs', path: 'packages/umbra-relay/src/main.rs' },
              { label: 'handler.rs', path: 'packages/umbra-relay/src/handler.rs' },
              { label: 'state.rs', path: 'packages/umbra-relay/src/state.rs' },
              { label: 'protocol.rs', path: 'packages/umbra-relay/src/protocol.rs' },
            ]}
          />
          <NetworkArchitectureFlow />
          <FeatureCard
            icon={<ZapIcon size={16} color="#8B5CF6" />}
            title="Relay Federation Mesh"
            description="Relay servers form a federated mesh network, interconnecting via persistent WebSocket tunnels. Users on different relays can communicate seamlessly — if your friend is connected to a different relay, your message is automatically forwarded through the mesh. Relays share presence information so any relay knows which peer hosts a given user."
            status="working"
            howTo={[
              'Federation is automatic — your relay discovers peers on startup',
              'Presence is gossiped across the mesh every 30 seconds',
              'Messages for remote users are forwarded in real-time',
              'If a relay goes down, users reconnect to any available relay',
            ]}
            limitations={[
              'Federation requires relays to be explicitly peered',
              'Cross-relay latency adds a small routing hop',
              'Presence sync has up to 30-second propagation delay',
            ]}
            sourceLinks={[
              { label: 'federation.rs', path: 'packages/umbra-relay/src/federation.rs' },
              { label: 'protocol.rs (PeerMessage)', path: 'packages/umbra-relay/src/protocol.rs' },
              { label: 'network.ts', path: 'config/network.ts' },
            ]}
          />
          <RelayFederationFlow />
          <FeatureCard
            icon={<ActivityIcon size={16} color="#3B82F6" />}
            title="WebSocket Connection"
            description="Umbra maintains a persistent, encrypted WebSocket connection to the relay server. This single connection handles real-time message delivery, friend request notifications, online presence updates, typing indicators, and signaling for peer-to-peer connections. The connection auto-reconnects with exponential backoff if interrupted."
            status="working"
            howTo={[
              'Connection is established automatically when you open Umbra',
              'A green indicator shows you are connected',
              'If disconnected, Umbra reconnects automatically',
              'Multiple relay connections can run simultaneously',
            ]}
            sourceLinks={[
              { label: 'useNetwork.ts', path: 'hooks/useNetwork.ts' },
              { label: 'relay_client.rs', path: 'packages/umbra-core/src/network/relay_client.rs' },
              { label: 'network.ts', path: 'config/network.ts' },
            ]}
          />
          <FeatureCard
            icon={<DatabaseIcon size={16} color="#06B6D4" />}
            title="Offline Delivery"
            description="When the recipient is offline, the relay queues the encrypted message payload. No plaintext data is ever stored — only the encrypted blob, sender DID, and timestamp. When the recipient comes online, all queued messages are delivered immediately and removed from the queue. Messages are never stored permanently on any server."
            status="working"
            sourceLinks={[
              { label: 'state.rs', path: 'packages/umbra-relay/src/state.rs' },
              { label: 'handler.rs', path: 'packages/umbra-relay/src/handler.rs' },
            ]}
          />
          <OfflineDeliveryFlow />
          <FeatureCard
            icon={<NetworkIcon size={16} color="#22C55E" />}
            title="WebRTC (P2P)"
            description="For lowest possible latency, Umbra can establish direct peer-to-peer connections using WebRTC. The relay server acts as a signaling channel to negotiate the P2P connection (via SDP offer/answer exchange). Once established, messages bypass the relay entirely and flow directly between devices."
            status="beta"
            limitations={[
              'Requires both peers to be online simultaneously',
              'NAT traversal may fail on restrictive networks',
              'Falls back to relay routing automatically',
              'Signaling still requires the relay for connection setup',
            ]}
            sourceLinks={[
              { label: 'webrtc_transport.rs', path: 'packages/umbra-core/src/network/webrtc_transport.rs' },
              { label: 'useNetwork.ts', path: 'hooks/useNetwork.ts' },
            ]}
          />
          <TechSpec
            title="Relay Infrastructure"
            accentColor="#06B6D4"
            entries={[
              { label: 'Relay Runtime', value: 'Rust (Tokio async)' },
              { label: 'Protocol', value: 'WebSocket JSON v1' },
              { label: 'Federation', value: 'Mesh (peer-to-peer)' },
              { label: 'Regions', value: 'US East, Asia Pacific' },
              { label: 'Presence Sync', value: 'Gossip (30s heartbeat)' },
              { label: 'Offline Queue', value: 'Encrypted at-rest' },
              { label: 'Reconnect', value: 'Exponential backoff' },
              { label: 'TLS', value: 'rustls (ring provider)' },
            ]}
          />
        </GuideSection>
      )}

      {/* ── Known Limitations ────────────────────────────────────── */}
      {filteredSections.some((s) => s.id === 'limitations') && (
        <GuideSection
          title="Known Limitations"
          subtitle="Current feature status and caveats"
          icon={<BookOpenIcon size={20} color="#FFF" />}
          iconBg="#F97316"
        >
          <TechSpec
            title="Feature Status"
            accentColor="#F97316"
            entries={[
              { label: 'Text Messaging', value: 'Working' },
              { label: 'Edit Messages', value: 'Working' },
              { label: 'Delete Messages', value: 'Working' },
              { label: 'Pin Messages', value: 'Working' },
              { label: 'Reactions', value: 'Working' },
              { label: 'Thread Replies', value: 'Working' },
              { label: 'Forward Messages', value: 'Working' },
              { label: 'Group Messaging', value: 'Working' },
              { label: 'File Attachments', value: 'Coming Soon' },
              { label: 'Voice/Video Calls', value: 'Coming Soon' },
              { label: 'Read Receipts', value: 'Coming Soon' },
              { label: 'Typing Indicators', value: 'Coming Soon' },
            ]}
          />
          <TechSpec
            title="Platform Notes"
            accentColor="#EAB308"
            entries={[
              { label: 'Web Browser', value: 'Full support' },
              { label: 'Desktop (Tauri)', value: 'In development' },
              { label: 'Mobile (React Native)', value: 'In development' },
              { label: 'Database', value: 'In-memory SQLite (web)' },
              { label: 'Data Persistence', value: 'Per-session (web)' },
            ]}
          />
        </GuideSection>
      )}

      {/* ── Technical Reference ──────────────────────────────────── */}
      {filteredSections.some((s) => s.id === 'technical') && (
        <GuideSection
          title="Technical Reference"
          subtitle="Protocols, algorithms, and data formats"
          icon={<SettingsIcon size={20} color="#FFF" />}
          iconBg="#6366F1"
        >
          <TechSpec
            title="Cryptographic Algorithms"
            accentColor="#6366F1"
            entries={[
              { label: 'Signing', value: 'Ed25519' },
              { label: 'Encryption', value: 'X25519 ECDH' },
              { label: 'Symmetric Cipher', value: 'AES-256-GCM' },
              { label: 'Key Derivation', value: 'HKDF-SHA256' },
              { label: 'Mnemonic', value: 'BIP39 (24 words)' },
              { label: 'Hash Function', value: 'SHA-256' },
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
            ]}
          />
          <TechSpec
            title="Data Formats"
            accentColor="#22C55E"
            entries={[
              { label: 'Identity', value: 'did:key (Ed25519)' },
              { label: 'Encoding', value: 'Base64 / Hex' },
              { label: 'Serialization', value: 'JSON' },
              { label: 'Database', value: 'SQLite (sql.js / native)' },
              { label: 'WASM Runtime', value: 'wasm-bindgen 0.2.x' },
              { label: 'AAD Format', value: '{sender}{recipient}{ts}' },
            ]}
          />
          <TechSpec
            title="Architecture"
            accentColor="#EC4899"
            entries={[
              { label: 'Frontend', value: 'React Native + Expo' },
              { label: 'Crypto Backend', value: 'Rust (WASM)' },
              { label: 'UI Library', value: 'Wisp React Native' },
              { label: 'Relay Server', value: 'Rust (Tokio + Axum)' },
              { label: 'Federation', value: 'WebSocket mesh' },
              { label: 'Desktop', value: 'Tauri v2' },
              { label: 'Build', value: 'wasm-pack + Cargo' },
            ]}
          />
          <TechSpec
            title="Federation Protocol"
            accentColor="#06B6D4"
            entries={[
              { label: 'Peer Discovery', value: 'Static config' },
              { label: 'Transport', value: 'WSS (rustls/ring)' },
              { label: 'Handshake', value: 'Hello + PresenceSync' },
              { label: 'Presence Gossip', value: 'Online/Offline events' },
              { label: 'Heartbeat', value: '30s full sync' },
              { label: 'Reconnect', value: '1s \u2192 60s backoff' },
              { label: 'Routing', value: 'DID \u2192 peer index O(1)' },
              { label: 'Forwarding', value: 'Signal, Message, Session' },
            ]}
          />
        </GuideSection>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Umbra v0.1.0 — Built with privacy in mind
        </Text>
        <Text style={styles.footerSub}>
          All data is encrypted locally. No servers can read your messages.
        </Text>
      </View>
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────

const styles: Record<string, ViewStyle | TextStyle> = {
  container: {
    flex: 1,
    backgroundColor: '#09090B',
  },
  content: {
    padding: 24,
    gap: 20,
    maxWidth: 800,
    alignSelf: 'center' as const,
    width: '100%' as unknown as number,
  },
  header: {
    alignItems: 'center' as const,
    gap: 8,
    paddingVertical: 20,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#FAFAFA',
    textAlign: 'center' as const,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#71717A',
    textAlign: 'center' as const,
  },
  statsRow: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  footer: {
    alignItems: 'center' as const,
    paddingVertical: 32,
    gap: 4,
  },
  footerText: {
    fontSize: 13,
    color: '#52525B',
    fontWeight: '500' as const,
  },
  footerSub: {
    fontSize: 12,
    color: '#3F3F46',
  },
};
