/**
 * GuideDialog — In-app user manual presented as a "book" modal.
 *
 * Organised into chapters on the left with scrollable content on
 * the right, mirroring the familiar Settings dialog layout.
 */

import React, { useState, useMemo, useCallback } from 'react';
import { View, Pressable, ScrollView, Text as RNText } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import { Overlay, useTheme } from '@coexist/wisp-react-native';

import { GuideSection } from '@/components/guide/GuideSection';
import { FeatureCard } from '@/components/guide/FeatureCard';
import {
  FlowDiagram,
  MessageEncryptionFlow,
  FriendRequestFlow,
  NetworkArchitectureFlow,
  GroupKeyDistributionFlow,
  GroupKeyRotationFlow,
} from '@/components/guide/FlowDiagram';
import { TechSpec } from '@/components/guide/TechSpec';
import { StatCard } from '@/components/guide/StatCard';
import {
  BookOpenIcon,
  UsersIcon,
  MessageIcon,
  SettingsIcon,
  ShieldIcon,
  PlusIcon,
  PuzzleIcon,
  XIcon,
  PhoneIcon,
} from '@/components/icons';
import CallingContent from '@/components/guide/CallingContent';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GuideDialogProps {
  open: boolean;
  onClose: () => void;
}

type Chapter =
  | 'getting-started'
  | 'friends'
  | 'messaging'
  | 'groups'
  | 'calling'
  | 'data'
  | 'security'
  | 'network'
  | 'plugins'
  | 'limitations'
  | 'technical';

interface ChapterItem {
  id: Chapter;
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  color: string;
}

const CHAPTERS: ChapterItem[] = [
  { id: 'getting-started', label: 'Getting Started', icon: PlusIcon, color: '#22C55E' },
  { id: 'friends', label: 'Friends', icon: UsersIcon, color: '#8B5CF6' },
  { id: 'messaging', label: 'Messaging', icon: MessageIcon, color: '#3B82F6' },
  { id: 'groups', label: 'Groups', icon: UsersIcon, color: '#EC4899' },
  { id: 'calling', label: 'Calling', icon: PhoneIcon, color: '#10B981' },
  { id: 'data', label: 'Data Management', icon: SettingsIcon, color: '#F59E0B' },
  { id: 'security', label: 'Security & Privacy', icon: ShieldIcon, color: '#EAB308' },
  { id: 'network', label: 'Network', icon: SettingsIcon, color: '#06B6D4' },
  { id: 'plugins', label: 'Plugins', icon: PuzzleIcon, color: '#8B5CF6' },
  { id: 'limitations', label: 'Limitations', icon: BookOpenIcon, color: '#F97316' },
  { id: 'technical', label: 'Tech Reference', icon: SettingsIcon, color: '#6366F1' },
];

// ---------------------------------------------------------------------------
// Chapter content renderers
// ---------------------------------------------------------------------------

function GettingStartedContent() {
  return (
    <>
      <FeatureCard
        title="Create Identity"
        description="Generate a new decentralized identity (DID) with a unique cryptographic key pair. Your identity is stored locally and never shared with any server. Your data persists locally using IndexedDB — each identity has its own isolated database."
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
        howTo={['Go to Settings', 'Enable PIN lock', 'Enter your desired PIN', 'Confirm your PIN']}
      />
      <FeatureCard
        title="Data Persistence"
        description="Your data is automatically saved to IndexedDB on every write. When you reload the page, a splash screen shows loading progress while your database, identity, and conversations are restored."
        status="working"
        howTo={[
          'Data is saved automatically — no manual action needed',
          'Closing and reopening the browser restores all your data',
          'Each identity has its own isolated database',
        ]}
      />
    </>
  );
}

function FriendsContent() {
  return (
    <>
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
        description="Incoming friend requests appear in the Pending tab. Accepting triggers a relay-confirmed key exchange — both sides receive acknowledgement that the friendship is synced."
        status="working"
        howTo={['Go to Friends > Pending tab', 'Review incoming requests', 'Click Accept or Reject']}
      />
      <FeatureCard
        title="Start a New DM"
        description="Use the + button next to 'Conversations' in the sidebar to open the friend picker. Select any friend to start a DM — if a conversation already exists, you'll navigate to it."
        status="working"
        howTo={[
          'Click the + button next to "Conversations" in the sidebar',
          'Select "New DM" from the menu',
          'Search and select a friend from the list',
        ]}
      />
      <FeatureCard
        title="Block/Unblock"
        description="Block a user to prevent them from sending you messages or friend requests."
        status="working"
      />
      <FriendRequestFlow />
    </>
  );
}

function MessagingContent() {
  return (
    <>
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
        title="Message Delivery Status"
        description="Track your message through its delivery lifecycle. Status icons appear next to the timestamp for sent messages."
        status="working"
        howTo={[
          'Sent: Single checkmark — message stored and relayed',
          'Delivered: Double checkmark — recipient received the message',
          'Read: Blue double checkmark — recipient viewed the conversation',
        ]}
      />
      <FeatureCard
        title="Typing Indicators"
        description="See when someone is typing in your conversation. In group chats, you'll see who is typing by name."
        status="working"
        howTo={[
          'Start typing in a conversation to notify the other person',
          'In DMs: "Alice is typing..."',
          'In groups: "Alice and Bob are typing..." or "3 people typing..."',
        ]}
      />
      <FeatureCard
        title="Edit Messages"
        description="Edit the text of a message you sent. The edited message will show an (edited) indicator to the other participant."
        status="working"
        howTo={['Hover over your sent message', 'Click the edit (pencil) icon', 'Modify the text and confirm']}
      />
      <FeatureCard title="Delete Messages" description="Delete a message you sent. The other participant will see a [Message deleted] placeholder." status="working" />
      <FeatureCard
        title="Pin Messages"
        description="Pin important messages to the top of a conversation for easy reference."
        status="working"
        howTo={['Hover over any message', 'Click the pin icon', 'View pinned messages in the right panel']}
      />
      <FeatureCard
        title="Reactions"
        description="React to messages with emoji. Reactions are visible to all participants."
        status="working"
        howTo={['Hover over any message', 'Click the reaction (smiley) icon', 'Select an emoji']}
      />
      <FeatureCard
        title="Thread Replies"
        description="Reply to a specific message to start a thread. Threads keep related messages organized."
        status="working"
        howTo={['Hover over any message', 'Click the reply icon', 'Type your reply in the thread panel']}
      />
      <FeatureCard
        title="Forward Messages"
        description="Forward a message to another conversation. The forwarded message is re-encrypted for the new recipient."
        status="working"
      />
      <MessageEncryptionFlow />
    </>
  );
}

function GroupsContent() {
  return (
    <>
      <FeatureCard
        title="Create Groups"
        description="Create a group conversation and invite friends. Messages are encrypted with a shared AES-256-GCM group key that is distributed to each member via ECDH key exchange."
        status="working"
        howTo={[
          'Click the + button next to "Conversations" in the sidebar',
          'Select "New Group"',
          'Enter a group name and optional description',
          'Select friends to invite (min 1, max 255)',
          'Click Create — invitations are sent via relay',
        ]}
      />
      <FeatureCard
        title="Group Invitations"
        description="When invited to a group, you'll see a pending invite in the sidebar above your conversations. Accept to join, or decline to dismiss."
        status="working"
        howTo={[
          'Pending invites appear in a collapsible section above conversations',
          'Each invite shows the group name and who invited you',
          'Click Accept to join the group and receive the shared key',
          'Click Decline to dismiss the invite',
        ]}
      />
      <FeatureCard
        title="Group Messaging"
        description="Send messages to all group members at once. Messages are encrypted with a shared group key so all members can decrypt them."
        status="working"
        howTo={[
          'Select a group conversation from the sidebar',
          'Group conversations show stacked avatars and member count',
          'Type and send messages as usual — all members receive them',
        ]}
      />
      <FeatureCard
        title="Manage Members"
        description="Group admins can add or remove members. When a member is removed, the group key is automatically rotated so they cannot read new messages."
        status="working"
        howTo={['Open a group conversation', 'Use the members panel to manage membership']}
        limitations={['Only the group admin can add/remove members', 'Removed members cannot decrypt new messages', 'Old messages remain accessible to removed members on their device']}
      />
      <FeatureCard
        title="Group Settings"
        description="Edit group name, description, and manage the group lifecycle."
        status="working"
        howTo={['Open group settings from the chat header', 'Edit the name or description', 'Click Save to apply changes']}
      />
    </>
  );
}

function DataManagementContent() {
  return (
    <>
      <FeatureCard
        title="Local Data Storage"
        description="All your data — friends, conversations, messages, groups — is stored locally in an SQLite database backed by IndexedDB. Data never leaves your device unencrypted."
        status="working"
        howTo={[
          'Data is saved automatically after every write operation',
          'Each identity has its own isolated IndexedDB store',
          'Reloading the page restores everything from your local database',
        ]}
      />
      <FeatureCard
        title="Clear Data"
        description="Remove your local data through the Settings dialog. You can clear all data to start fresh."
        status="working"
        howTo={[
          'Open Settings from the sidebar',
          'Scroll to the Data Management section',
          'Use "Clear All Data" to wipe everything and return to onboarding',
        ]}
        limitations={['Clearing data is permanent and cannot be undone', 'Your identity can be restored from your recovery phrase']}
      />
      <FeatureCard
        title="Data Isolation"
        description="Each identity gets its own IndexedDB database. Switching identities does not affect another identity's data."
        status="working"
      />
      <FeatureCard
        title="What Happens on Refresh"
        description="When you reload the page, Umbra shows a splash screen while restoring your data. The loading steps are: Loading database, Restoring identity, Loading your data."
        status="working"
      />
    </>
  );
}

function SecurityContent() {
  return (
    <>
      <FeatureCard
        title="End-to-End Encryption"
        description="All messages are encrypted before leaving your device using AES-256-GCM. For DMs, the key is derived via X25519 ECDH. For groups, a shared AES-256-GCM key is distributed to each member."
        status="working"
      />
      <FeatureCard
        title="Group Key Encryption"
        description="Groups use a shared AES-256-GCM key for message encryption. The key is distributed to each member via per-member ECDH encryption. When a member is removed, the key is rotated so they can no longer decrypt new messages."
        status="working"
        limitations={['Old messages remain accessible to removed members on their device', 'Key rotation only protects future messages']}
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
        title="IndexedDB Persistence Security"
        description="Your SQLite database is persisted to IndexedDB in binary format. Each identity has its own isolated store, preventing cross-identity data leakage. IndexedDB is origin-scoped by the browser."
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
      <GroupKeyDistributionFlow />
      <GroupKeyRotationFlow />
    </>
  );
}

function NetworkContent() {
  return (
    <>
      <FeatureCard title="Relay Server" description="Messages are routed through a relay server that acts as a mailbox. When both peers are online, messages are delivered in real-time via WebSocket." status="working" />
      <FeatureCard title="WebSocket Connection" description="Umbra maintains a persistent WebSocket connection to the relay server for real-time message delivery, friend request notifications, and online status updates." status="working" />
      <FeatureCard title="Offline Delivery" description="When the recipient is offline, the relay queues the encrypted message. When they come online, queued messages are automatically fetched and decrypted." status="working" />
      <FeatureCard
        title="WebRTC (P2P)"
        description="Direct peer-to-peer connections using WebRTC for lowest latency. Falls back to relay when P2P is unavailable."
        status="beta"
        limitations={['Requires both peers to be online simultaneously', 'NAT traversal may fail on some networks', 'Falls back to relay automatically']}
      />
      <NetworkArchitectureFlow />
    </>
  );
}

function PluginsContent() {
  const { theme, mode } = useTheme();
  const tc = theme.colors;
  const isDark = mode === 'dark';

  return (
    <>
      <FeatureCard
        title="Plugin System"
        description="Umbra supports a plugin architecture that lets you extend the app with custom functionality. Plugins can add UI components to predefined slots, register commands, store data, and interact with messages — all while running sandboxed within the app."
        status="working"
        howTo={[
          'Open the Plugin Marketplace from the sidebar or Command Palette (Cmd+K)',
          'Browse available plugins and click Install',
          'Installed plugins activate automatically and appear in their designated UI slots',
          'Manage plugins in Settings > Plugins — enable, disable, or uninstall',
        ]}
      />
      <FeatureCard
        title="Marketplace"
        description="The Plugin Marketplace is a centralized registry that lists all available plugins. Each listing includes the plugin name, description, author, permissions, and an install button. The marketplace fetches its data from a static JSON registry."
        status="working"
        howTo={[
          'Click "Plugins" in the sidebar to open the Marketplace',
          'Or press Cmd+K and search for "Plugin Marketplace"',
          'Browse by category or search by keyword',
          'Click Install to download and activate a plugin',
        ]}
      />
      <TechSpec
        title="UI Slots"
        accentColor="#8B5CF6"
        entries={[
          { label: 'message-actions', value: 'Buttons in the message hover bar' },
          { label: 'message-decorator', value: 'Content below a message bubble' },
          { label: 'sidebar-section', value: 'Widget at the bottom of the sidebar' },
          { label: 'chat-toolbar', value: 'Toolbar above the message input' },
          { label: 'chat-header', value: 'Content in the chat header row' },
          { label: 'settings-tab', value: 'Custom tab in Settings' },
          { label: 'right-panel', value: 'Panel in the right sidebar' },
          { label: 'command-palette', value: 'Commands in the Command Palette' },
        ]}
      />
      <TechSpec
        title="Permissions"
        accentColor="#22C55E"
        entries={[
          { label: 'messages:read', value: 'Read message content' },
          { label: 'messages:write', value: 'Send messages to conversations' },
          { label: 'friends:read', value: 'Access the friends list' },
          { label: 'conversations:read', value: 'Access the conversation list' },
          { label: 'storage:kv', value: 'Key-value storage (per-plugin)' },
          { label: 'storage:sql', value: 'SQLite tables (namespaced)' },
          { label: 'network:local', value: 'Fetch external APIs' },
          { label: 'notifications', value: 'Show toast notifications' },
          { label: 'commands', value: 'Register command palette entries' },
        ]}
      />
      <FeatureCard
        title="Building a Plugin"
        description="Plugins are ES module bundles that export an activate() function, an optional deactivate() function, and a components object mapping component names to React components. Plugins use React.createElement for rendering (no JSX) since they run outside the app's build pipeline."
        status="working"
        howTo={[
          'Create a new JS file (your bundle) that exports { activate, deactivate, components }',
          'Access React via `const React = window.React || globalThis.React`',
          'In activate(api), use api.kv for storage, api.registerCommand() for commands, api.showToast() for notifications',
          'Export components as named entries — these map to the "component" field in your manifest slots',
          'Use the Wisp font stack for consistent typography: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, etc.',
        ]}
      />
      <TechSpec
        title="Plugin Bundle Structure"
        accentColor="#3B82F6"
        entries={[
          { label: 'activate(api)', value: 'Called when plugin is enabled' },
          { label: 'deactivate()', value: 'Called when plugin is disabled' },
          { label: 'components', value: 'Object mapping names to React components' },
          { label: 'api.kv', value: 'Namespaced key-value store' },
          { label: 'api.sql', value: 'Namespaced SQLite (optional)' },
          { label: 'api.registerCommand()', value: 'Add to command palette' },
          { label: 'api.showToast()', value: 'Display a notification' },
        ]}
      />
      <FeatureCard
        title="Example: Minimal Plugin"
        description={`A minimal plugin that adds a sidebar widget:\n\nconst React = window.React;\nconst { createElement: h, useState } = React;\n\nfunction MyWidget() {\n  const [count, setCount] = useState(0);\n  return h('div', { style: { padding: 12 } },\n    h('span', null, 'Count: ' + count),\n    h('button', { onClick: () => setCount(c => c + 1) }, '+1')\n  );\n}\n\nexport async function activate(api) {\n  api.showToast('My Plugin activated!', 'info');\n}\n\nexport function deactivate() {}\nexport const components = { MyWidget };`}
        status="working"
      />
      <TechSpec
        title="Manifest (plugins.json)"
        accentColor="#F59E0B"
        entries={[
          { label: 'id', value: 'Unique identifier (e.g. com.you.plugin)' },
          { label: 'name', value: 'Human-readable name' },
          { label: 'version', value: 'Semver version string' },
          { label: 'downloadUrl', value: 'URL to the JS bundle' },
          { label: 'permissions', value: 'Array of required permissions' },
          { label: 'slots', value: 'Array of { slot, component, priority }' },
          { label: 'platforms', value: '"web", "desktop", or both' },
          { label: 'storage', value: '{ kv: true, sql: { tables: [...] } }' },
        ]}
      />
      <FeatureCard
        title="Dev Mode"
        description="During development you can load a plugin from a local URL for hot reload. The Plugin Marketplace has a 'Load Dev Plugin' option in the Installed tab where you can paste a URL. The runtime polls the URL for changes and automatically reloads the module when it detects updates."
        status="working"
        howTo={[
          'Build your plugin bundle with a watch mode (e.g. esbuild --watch)',
          'Serve the bundle on a local port (e.g. http://localhost:3001/bundle.js)',
          'Open Plugin Marketplace > Installed tab > "Load Dev Plugin"',
          'Paste your URL and click Load — the plugin will hot reload on changes',
        ]}
      />
    </>
  );
}

function LimitationsContent() {
  return (
    <>
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
          { label: 'Group Invitations', value: 'Working' },
          { label: 'Delivery Status', value: 'Working' },
          { label: 'Read Receipts', value: 'Working' },
          { label: 'Typing Indicators', value: 'Working' },
          { label: 'Data Persistence', value: 'Working' },
          { label: 'File Attachments', value: 'Coming Soon' },
          { label: 'Voice/Video Calls', value: 'Working' },
        ]}
      />
      <TechSpec
        title="Platform Notes"
        accentColor="#EAB308"
        entries={[
          { label: 'Web Browser', value: 'Full support' },
          { label: 'Desktop (Tauri)', value: 'In development' },
          { label: 'Mobile (React Native)', value: 'In development' },
          { label: 'Database', value: 'SQLite via IndexedDB (web)' },
          { label: 'Data Persistence', value: 'Persistent via IndexedDB' },
        ]}
      />
    </>
  );
}

function TechnicalContent() {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { theme, mode } = useTheme();
  const tc = theme.colors;
  const isDark = mode === 'dark';

  return (
    <>
      <TechSpec
        title="Architecture"
        accentColor="#EC4899"
        entries={[
          { label: 'Frontend', value: 'React Native + Expo' },
          { label: 'Backend', value: 'Rust (WASM)' },
          { label: 'UI Library', value: 'Wisp React Native' },
          { label: 'Relay', value: 'Rust / Axum WebSocket' },
          { label: 'Desktop', value: 'Tauri v2' },
          { label: 'Build', value: 'wasm-pack + Cargo' },
        ]}
      />
      <TechSpec
        title="Cryptographic Algorithms"
        accentColor="#6366F1"
        entries={[
          { label: 'Signing', value: 'Ed25519' },
          { label: 'DM Encryption', value: 'X25519 ECDH + AES-256-GCM' },
          { label: 'Group Encryption', value: 'Shared AES-256-GCM key' },
          { label: 'Key Derivation', value: 'HKDF-SHA256' },
          { label: 'Mnemonic', value: 'BIP39 (24 words)' },
          { label: 'Hash Function', value: 'SHA-256' },
        ]}
      />

      {/* Advanced toggle */}
      <Pressable
        onPress={() => setShowAdvanced((p) => !p)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingVertical: 10,
          paddingHorizontal: 14,
          borderRadius: 8,
          backgroundColor: tc.background.sunken,
          borderWidth: 1,
          borderColor: tc.border.subtle,
        }}
      >
        <RNText style={{ fontSize: 14, color: tc.text.secondary }}>
          {showAdvanced ? '\u25BC' : '\u25B6'}
        </RNText>
        <RNText style={{ fontSize: 13, fontWeight: '600', color: tc.text.primary }}>
          {showAdvanced ? 'Hide Advanced Protocol Details' : 'Show Advanced Protocol Details'}
        </RNText>
      </Pressable>

      {showAdvanced && (
        <>
          <TechSpec
            title="Relay Envelope Types"
            accentColor="#3B82F6"
            entries={[
              { label: 'chat_message', value: 'Encrypted DM message' },
              { label: 'friend_request', value: 'New friend request' },
              { label: 'friend_response', value: 'Accept/reject response' },
              { label: 'friend_accept_ack', value: 'Friendship sync confirmation' },
              { label: 'group_invite', value: 'Group invitation with key' },
              { label: 'group_invite_accept', value: 'Accept group invite' },
              { label: 'group_invite_decline', value: 'Decline group invite' },
              { label: 'group_message', value: 'Encrypted group message' },
              { label: 'group_key_rotation', value: 'New key for remaining members' },
              { label: 'group_member_removed', value: 'Member removal notification' },
              { label: 'message_status', value: 'Delivered/read status update' },
              { label: 'typing_indicator', value: 'Typing start/stop' },
            ]}
          />
          <TechSpec
            title="Data Formats"
            accentColor="#22C55E"
            entries={[
              { label: 'Identity', value: 'did:key (Ed25519)' },
              { label: 'Encoding', value: 'Base64 / Hex' },
              { label: 'Serialization', value: 'JSON' },
              { label: 'Database', value: 'SQLite (sql.js + IndexedDB)' },
              { label: 'WASM Runtime', value: 'wasm-bindgen 0.2.x' },
              { label: 'AAD Format', value: '{sender}{recipient}{ts}' },
              { label: 'Persistence', value: 'IndexedDB (per-DID store)' },
            ]}
          />
          <TechSpec
            title="Group Key Protocol"
            accentColor="#8B5CF6"
            entries={[
              { label: 'Group Key Type', value: 'AES-256-GCM (random)' },
              { label: 'Key Distribution', value: 'ECDH per-member encrypt' },
              { label: 'Key Wrapping', value: 'HKDF-SHA256 derived key' },
              { label: 'Key Storage', value: 'group_keys table (versioned)' },
              { label: 'Rotation Trigger', value: 'Member removal' },
              { label: 'Version Tracking', value: 'Monotonic key_version' },
            ]}
          />
          <TechSpec
            title="Message Status Protocol"
            accentColor="#F59E0B"
            entries={[
              { label: 'sending', value: 'Created locally, relay pending' },
              { label: 'sent', value: 'Relay ack received' },
              { label: 'delivered', value: 'Recipient stored message' },
              { label: 'read', value: 'Recipient viewed conversation' },
            ]}
          />
        </>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// GuideDialog
// ---------------------------------------------------------------------------

export function GuideDialog({ open, onClose }: GuideDialogProps) {
  const { theme, mode } = useTheme();
  const tc = theme.colors;
  const isDark = mode === 'dark';
  const [activeChapter, setActiveChapter] = useState<Chapter>('getting-started');

  // -- Styles ----------------------------------------------------------------

  const modalStyle = useMemo<ViewStyle>(
    () => ({
      width: 860,
      maxWidth: '95%',
      height: 600,
      maxHeight: '90%',
      flexDirection: 'row',
      borderRadius: 16,
      overflow: 'hidden',
      backgroundColor: isDark ? tc.background.raised : tc.background.canvas,
      borderWidth: isDark ? 1 : 0,
      borderColor: isDark ? tc.border.subtle : 'transparent',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: isDark ? 0.6 : 0.25,
      shadowRadius: 32,
      elevation: 12,
    }),
    [tc, isDark],
  );

  const sidebarStyle = useMemo<ViewStyle>(
    () => ({
      width: 210,
      backgroundColor: isDark ? tc.background.surface : tc.background.sunken,
      borderRightWidth: 1,
      borderRightColor: tc.border.subtle,
      paddingVertical: 16,
      paddingHorizontal: 10,
    }),
    [tc, isDark],
  );

  // -- Render chapter --------------------------------------------------------

  const renderChapter = useCallback(() => {
    switch (activeChapter) {
      case 'getting-started':
        return <GettingStartedContent />;
      case 'friends':
        return <FriendsContent />;
      case 'messaging':
        return <MessagingContent />;
      case 'groups':
        return <GroupsContent />;
      case 'calling':
        return <CallingContent />;
      case 'data':
        return <DataManagementContent />;
      case 'security':
        return <SecurityContent />;
      case 'network':
        return <NetworkContent />;
      case 'plugins':
        return <PluginsContent />;
      case 'limitations':
        return <LimitationsContent />;
      case 'technical':
        return <TechnicalContent />;
    }
  }, [activeChapter]);

  const activeInfo = CHAPTERS.find((c) => c.id === activeChapter)!;

  // -- Render ----------------------------------------------------------------

  return (
    <Overlay open={open} backdrop="dim" center onBackdropPress={onClose} animationType="fade">
      <View style={modalStyle}>
        {/* ── Left: Chapter Navigation ── */}
        <View style={sidebarStyle}>
          {/* Book Title */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 8, marginBottom: 16 }}>
            <View
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                backgroundColor: tc.accent.primary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BookOpenIcon size={16} color={tc.text.inverse} />
            </View>
            <RNText style={{ fontSize: 15, fontWeight: '700', color: tc.text.primary }}>User Guide</RNText>
          </View>

          {/* Chapter List */}
          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
            {CHAPTERS.map((ch) => {
              const isActive = activeChapter === ch.id;
              const Icon = ch.icon;

              return (
                <Pressable
                  key={ch.id}
                  onPress={() => setActiveChapter(ch.id)}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    paddingVertical: 9,
                    paddingHorizontal: 10,
                    borderRadius: 8,
                    backgroundColor: isActive
                      ? tc.accent.primary
                      : pressed
                        ? tc.accent.highlight
                        : 'transparent',
                    marginBottom: 2,
                  })}
                >
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      backgroundColor: isActive ? ch.color : tc.accent.highlight,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={13} color={isActive ? tc.text.inverse : tc.text.secondary} />
                  </View>
                  <RNText
                    style={{
                      fontSize: 13,
                      fontWeight: isActive ? '600' : '400',
                      color: isActive ? tc.text.inverse : tc.text.secondary,
                      flex: 1,
                    }}
                    numberOfLines={1}
                  >
                    {ch.label}
                  </RNText>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Footer */}
          <RNText style={{ fontSize: 11, color: tc.text.muted, textAlign: 'center', marginTop: 12 }}>
            Umbra v0.1.0
          </RNText>
        </View>

        {/* ── Right: Chapter Content ── */}
        <View style={{ flex: 1 }}>
          {/* Chapter Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 28,
              paddingVertical: 16,
              borderBottomWidth: 1,
              borderBottomColor: tc.border.subtle,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: activeInfo.color,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <activeInfo.icon size={18} color={tc.text.inverse} />
              </View>
              <RNText style={{ fontSize: 18, fontWeight: '700', color: tc.text.primary }}>
                {activeInfo.label}
              </RNText>
            </View>

            <Pressable
              onPress={onClose}
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              accessibilityLabel="Close guide"
            >
              <XIcon size={16} color={tc.text.secondary} />
            </Pressable>
          </View>

          {/* Chapter Body */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 28, gap: 16 }}
            showsVerticalScrollIndicator={false}
          >
            {renderChapter()}
          </ScrollView>
        </View>
      </View>
    </Overlay>
  );
}
