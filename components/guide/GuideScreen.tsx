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
import { FlowDiagram, MessageEncryptionFlow, FriendRequestFlow, NetworkArchitectureFlow } from './FlowDiagram';
import { TechSpec } from './TechSpec';
import { StatCard } from './StatCard';
import {
  BookOpenIcon, UsersIcon, MessageIcon, SettingsIcon, ShieldIcon,
  PlusIcon,
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
  { id: 'security', title: 'Security & Privacy', subtitle: 'Encryption and key management', iconBg: '#EAB308', keywords: ['encrypt', 'key', 'privacy', 'security', 'e2e', 'did'] },
  { id: 'network', title: 'Network & Architecture', subtitle: 'How Umbra connects peers', iconBg: '#06B6D4', keywords: ['network', 'relay', 'p2p', 'webrtc', 'offline'] },
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
        <StatCard label="Encryption" value="E2E" color="#22C55E" />
        <StatCard label="Protocol" value="DID" color="#8B5CF6" />
        <StatCard label="Storage" value="Local" color="#3B82F6" />
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
          />
          <FeatureCard
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
          />
          <FeatureCard
            title="PIN Lock"
            description="Set a numeric PIN to lock the app. Prevents unauthorized access without needing to re-enter your recovery phrase."
            status="working"
            howTo={[
              'Go to Settings',
              'Enable PIN lock',
              'Enter your desired PIN',
              'Confirm your PIN',
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
          />
          <FeatureCard
            title="Block/Unblock"
            description="Block a user to prevent them from sending you messages or friend requests."
            status="working"
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
            title="Send Messages"
            description="Messages are end-to-end encrypted using AES-256-GCM with a shared secret derived via X25519 ECDH. Only you and your friend can read them."
            status="working"
            howTo={[
              'Select a conversation from the sidebar',
              'Type your message in the input field',
              'Press Enter or click Send',
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
          />
          <FeatureCard
            title="Delete Messages"
            description="Delete a message you sent. The other participant will see a [Message deleted] placeholder."
            status="working"
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
          />
          <FeatureCard
            title="Forward Messages"
            description="Forward a message to another conversation. The forwarded message is re-encrypted for the new recipient."
            status="working"
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
            title="Create Groups"
            description="Create a group conversation and invite friends. Each message is encrypted individually for every group member."
            status="working"
            howTo={[
              'Click Create Group in the sidebar',
              'Enter a group name and optional description',
              'Select friends to add as initial members',
              'Click Create Group',
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
          />
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
            title="End-to-End Encryption"
            description="All messages are encrypted before leaving your device using AES-256-GCM. The encryption key is derived from a shared secret via X25519 ECDH key exchange. The relay server can never read your messages."
            status="working"
          />
          <FeatureCard
            title="Key Management"
            description="Your Ed25519 signing key and X25519 encryption key are generated from your recovery phrase using BIP39 + HKDF. Keys are stored locally in an encrypted SQLite database."
            status="working"
          />
          <FeatureCard
            title="Decentralized Identity (DID)"
            description="Umbra uses did:key identifiers derived from your Ed25519 public key. Your DID is your address on the network — no centralized account server."
            status="working"
          />
          <FeatureCard
            title="What the Relay Can See"
            description="The relay server only sees encrypted message envelopes and sender/recipient DIDs for routing. It cannot read message content, see your friend list, or access your keys."
            status="working"
            limitations={[
              'Relay sees sender + recipient DIDs (for routing)',
              'Relay sees message timestamps',
              'Relay cannot read message content',
              'Relay does not store messages permanently',
            ]}
          />
          <MessageEncryptionFlow />
        </GuideSection>
      )}

      {/* ── Network & Architecture ───────────────────────────────── */}
      {filteredSections.some((s) => s.id === 'network') && (
        <GuideSection
          title="Network & Architecture"
          subtitle="How Umbra connects peers"
          icon={<SettingsIcon size={20} color="#FFF" />}
          iconBg="#06B6D4"
        >
          <FeatureCard
            title="Relay Server"
            description="Messages are routed through a relay server that acts as a mailbox. When both peers are online, messages are delivered in real-time via WebSocket. When a peer is offline, messages are queued for later delivery."
            status="working"
          />
          <FeatureCard
            title="WebSocket Connection"
            description="Umbra maintains a persistent WebSocket connection to the relay server for real-time message delivery, friend request notifications, and online status updates."
            status="working"
          />
          <FeatureCard
            title="Offline Delivery"
            description="When the recipient is offline, the relay queues the encrypted message. When they come online, queued messages are automatically fetched and decrypted."
            status="working"
          />
          <FeatureCard
            title="WebRTC (P2P)"
            description="Direct peer-to-peer connections using WebRTC for lowest latency. Falls back to relay when P2P is unavailable."
            status="beta"
            limitations={[
              'Requires both peers to be online simultaneously',
              'NAT traversal may fail on some networks',
              'Falls back to relay automatically',
            ]}
          />
          <NetworkArchitectureFlow />
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
              { label: 'Backend', value: 'Rust (WASM)' },
              { label: 'UI Library', value: 'Wisp React Native' },
              { label: 'Relay', value: 'Node.js WebSocket' },
              { label: 'Desktop', value: 'Tauri v2' },
              { label: 'Build', value: 'wasm-pack + Cargo' },
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
