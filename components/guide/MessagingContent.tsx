/**
 * MessagingContent — Encrypted messaging, operations, and protocol details.
 * Includes code examples and test coverage information.
 */

import React from 'react';
import { View } from 'react-native';

import { FeatureCard } from '@/components/guide/FeatureCard';
import { TechSpec } from '@/components/guide/TechSpec';
import {
  SendIcon, CheckCircleIcon, EditIcon, TrashIcon, PinIcon,
  SmileIcon, ThreadIcon, ForwardIcon, AtSignIcon, PaperclipIcon,
  FileIcon, ImageIcon,
} from '@/components/icons';

export default function MessagingContent() {
  return (
    <View style={{ gap: 12 }}>
<FeatureCard
        icon={<SendIcon size={16} color="#3B82F6" />}
        title="Send Messages"
        description="Every message is end-to-end encrypted on your device before transmission. The encryption key is derived from a shared secret established via X25519 ECDH, then expanded through HKDF-SHA256 using the conversation ID as salt. Each message is encrypted with AES-256-GCM using a fresh 96-bit nonce from a cryptographic random number generator — nonces are never reused. The Additional Authenticated Data (AAD) binds the sender DID, recipient DID, and timestamp to the ciphertext, preventing replay and misdirection attacks. The entire message envelope is then signed with your Ed25519 key to prove authenticity."
        status="working"
        howTo={[
          'Select a conversation from the sidebar',
          'Type your message in the input field',
          'Press Enter or click Send',
          'Watch the status indicator: sending → sent → delivered',
        ]}
        limitations={[
          'Maximum message size: 64 KB (65,536 bytes)',
        ]}
        sourceLinks={[
          { label: 'encryption.rs', path: 'packages/umbra-core/src/crypto/encryption.rs' },
          { label: 'messaging/mod.rs', path: 'packages/umbra-core/src/messaging/mod.rs' },
          { label: 'useMessages.ts', path: 'hooks/useMessages.ts' },
        ]}
        testLinks={[
          { label: 'useMessages.test.ts', path: '__tests__/hooks/useMessages.test.ts' },
          { label: 'messaging-flow.test.ts', path: '__tests__/integration/messaging-flow.test.ts' },
          { label: 'chat-features.test.ts', path: '__tests__/integration/chat-features.test.ts' },
        ]}
      />

      <FeatureCard
        icon={<CheckCircleIcon size={16} color="#22C55E" />}
        title="Message Status Tracking"
        description="Every message progresses through a lifecycle of delivery states. 'Sending' means the message is encrypted and queued for transmission. 'Sent' means the relay server acknowledged receipt (via a FIFO ack queue). 'Delivered' confirms the recipient's device has received and stored the message. 'Read' indicates the recipient has viewed the message. Status updates are transmitted as lightweight 'message_status' envelopes through the relay."
        status="working"
        howTo={[
          'Watch for checkmark indicators next to each message',
          'Single check: sent to relay',
          'Double check: delivered to recipient',
          'Colored check: read by recipient',
        ]}
        sourceLinks={[
          { label: 'useMessages.ts', path: 'hooks/useMessages.ts' },
          { label: 'useNetwork.ts', path: 'hooks/useNetwork.ts' },
        ]}
        testLinks={[
          { label: 'useMessages.test.ts', path: '__tests__/hooks/useMessages.test.ts' },
        ]}
      />

      <FeatureCard
        icon={<EditIcon size={16} color="#EAB308" />}
        title="Edit Messages"
        description="Edit the text of a message you sent. The edited message is re-encrypted with a fresh nonce and transmitted as an update with the same message ID. The 'edited' flag is set to true in the envelope metadata, and an 'editedAt' timestamp records when the change occurred. The recipient sees an (edited) indicator. The original plaintext is not preserved — only the latest version exists, providing a form of forward secrecy for edits."
        status="working"
        howTo={[
          'Hover over your sent message',
          'Click the edit (pencil) icon',
          'Modify the text and press Enter to confirm',
          'The (edited) indicator appears for all participants',
        ]}
        limitations={[
          'Only your own messages can be edited',
          'Edit history is not visible to recipients',
        ]}
        sourceLinks={[
          { label: 'useMessages.ts', path: 'hooks/useMessages.ts' },
        ]}
        testLinks={[
          { label: 'chat-features.test.ts', path: '__tests__/integration/chat-features.test.ts' },
        ]}
      />
<FeatureCard
        icon={<TrashIcon size={16} color="#EF4444" />}
        title="Delete Messages"
        description="Delete a message you sent. A deletion marker (deleted: true) is sent to all participants via the relay. The ciphertext is retained in the database for thread integrity, but the plaintext is discarded. Recipients see a '[Message deleted]' placeholder. Deletion is one-directional — it marks the message as deleted on the recipient's device, but cannot force removal from their storage."
        status="working"
        howTo={[
          'Hover over your sent message',
          'Click the more menu (…) icon',
          'Select Delete',
          'Recipients see [Message deleted] placeholder',
        ]}
        limitations={[
          'Cannot force-delete from recipient device storage',
          'Only marks as deleted (ciphertext kept for thread integrity)',
        ]}
        sourceLinks={[
          { label: 'useMessages.ts', path: 'hooks/useMessages.ts' },
        ]}
        testLinks={[
          { label: 'chat-features.test.ts', path: '__tests__/integration/chat-features.test.ts' },
        ]}
      />

      <FeatureCard
        icon={<PinIcon size={16} color="#F97316" />}
        title="Pin Messages"
        description="Pin important messages to the top of a conversation for quick reference. Pinned messages include metadata: who pinned them (pinnedBy DID) and when (pinnedAt timestamp). View all pinned messages in the dedicated Pins panel. Pins are stored locally per-conversation."
        status="working"
        howTo={[
          'Hover over any message',
          'Click the pin icon',
          'View pinned messages in the right panel',
          'Click unpin to remove from the pin list',
        ]}
        sourceLinks={[
          { label: 'useMessages.ts', path: 'hooks/useMessages.ts' },
        ]}
        testLinks={[
          { label: 'chat-features.test.ts', path: '__tests__/integration/chat-features.test.ts' },
        ]}
      />

      <FeatureCard
        icon={<SmileIcon size={16} color="#EC4899" />}
        title="Reactions"
        description="React to any message with emoji. Each reaction is transmitted as an encrypted 'reaction' message type containing the target message ID, emoji, your DID, and a timestamp. Multiple users can react with the same emoji, and reactions are aggregated in the UI. Reactions are encrypted with the same conversation key as regular messages."
        status="working"
        howTo={[
          'Hover over any message',
          'Click the reaction (smiley) icon',
          'Select an emoji from the picker',
          'Click an existing reaction to add yours or remove it',
        ]}
        sourceLinks={[
          { label: 'useMessages.ts', path: 'hooks/useMessages.ts' },
        ]}
        testLinks={[
          { label: 'chat-features.test.ts', path: '__tests__/integration/chat-features.test.ts' },
        ]}
      />

      <FeatureCard
        icon={<ThreadIcon size={16} color="#8B5CF6" />}
        title="Thread Replies"
        description="Reply to a specific message to start a threaded conversation. Reply messages contain a 'threadId' field pointing to the parent message. The parent message tracks a 'threadReplyCount' that increments with each reply. Thread replies are displayed in a dedicated panel and are not mixed into the main message list. Each reply is independently encrypted with a fresh nonce."
        status="working"
        howTo={[
          'Hover over any message',
          'Click the reply icon',
          'Type your reply in the thread panel',
          'Thread indicator shows reply count on the parent message',
        ]}
        limitations={[
          'Threads are one level deep (no nested replies)',
        ]}
        sourceLinks={[
          { label: 'useMessages.ts', path: 'hooks/useMessages.ts' },
          { label: 'ChatArea.tsx', path: 'components/chat/ChatArea.tsx' },
        ]}
        testLinks={[
          { label: 'ChatArea.test.tsx', path: '__tests__/components/chat/ChatArea.test.tsx' },
        ]}
      />

      <FeatureCard
        icon={<ForwardIcon size={16} color="#06B6D4" />}
        title="Forward Messages"
        description="Forward a message to another conversation. The message content is decrypted from the original conversation's key and then re-encrypted with the target conversation's shared secret using a fresh nonce. A 'forwarded' flag is set in the metadata, and the original sender's DID is preserved for attribution. The forwarded message receives a new unique ID."
        status="working"
        howTo={[
          'Hover over any message and click forward',
          'Select the target conversation',
          'Message is re-encrypted for the new recipient',
        ]}
        sourceLinks={[
          { label: 'encryption.rs', path: 'packages/umbra-core/src/crypto/encryption.rs' },
          { label: 'useMessages.ts', path: 'hooks/useMessages.ts' },
        ]}
        testLinks={[
          { label: 'chat-features.test.ts', path: '__tests__/integration/chat-features.test.ts' },
        ]}
      />
      <FeatureCard
        icon={<AtSignIcon size={16} color="#14B8A6" />}
        title="@Mention Autocomplete"
        description="Type @ in the chat input to trigger mention autocomplete. The useMention hook detects the @ trigger with word boundary validation and filters conversation members in real-time as you type. A dropdown appears with up to 5 matching suggestions showing display names and usernames. Navigate with arrow keys, select with Enter, or dismiss with Escape. When a mention is selected, it replaces the partial @text with the full display name and stores the DID reference for notification routing."
        status="working"
        howTo={[
          'Type @ in the message input',
          'Start typing a name to filter suggestions',
          'Arrow keys to navigate, Enter to select',
          'Escape to dismiss the autocomplete dropdown',
        ]}
        sourceLinks={[
          { label: 'ChatInput.tsx', path: 'components/chat/ChatInput.tsx' },
          { label: 'useMention.ts', path: 'hooks/useMention.ts' },
        ]}
        testLinks={[]}
      />

      <FeatureCard
        icon={<SmileIcon size={16} color="#F59E0B" />}
        title="Emoji & Sticker Picker"
        description="The chat input includes a CombinedPicker component that provides both emoji and sticker selection. The emoji picker offers the full Unicode emoji set organized by category. Sticker packs support custom community stickers — selecting a sticker sends it as a special sticker message type. The picker is accessible via the smiley icon button in the chat input bar. Custom community emojis are also supported and displayed inline within messages."
        status="working"
        howTo={[
          'Click the smiley icon in the chat input bar',
          'Browse emojis by category or search',
          'Switch to the Stickers tab for sticker packs',
          'Click to insert an emoji or send a sticker',
        ]}
        sourceLinks={[
          { label: 'ChatInput.tsx', path: 'components/chat/ChatInput.tsx' },
        ]}
        testLinks={[]}
      />

      <FeatureCard
        icon={<PaperclipIcon size={16} color="#6366F1" />}
        title="File Attachments & Transfers"
        description="Send files in DM conversations with end-to-end encrypted peer-to-peer transfers. The useFileTransfer hook manages the full transfer lifecycle: requesting, negotiating, transferring, paused, completed, failed, or cancelled. Files are transferred directly between peers with real-time speed calculation (bytes/sec) and progress tracking. File messages display with MIME-type icons, filename, file size, optional image thumbnail preview, a download button, and an encryption indicator (lock icon). The DmSharedFilesPanel provides a filterable view of all shared files in a conversation with tabs for All, Images, Docs, Media, and Other."
        status="working"
        howTo={[
          'Click the attachment (paperclip) icon in the chat input',
          'Select a file to send',
          'Transfer progress is shown in real-time',
          'View all shared files via the Files button in the chat header',
        ]}
        sourceLinks={[
          { label: 'DmFileMessage.tsx', path: 'components/messaging/DmFileMessage.tsx' },
          { label: 'DmSharedFilesPanel.tsx', path: 'components/messaging/DmSharedFilesPanel.tsx' },
          { label: 'useFileTransfer.ts', path: 'hooks/useFileTransfer.ts' },
          { label: 'ChatInput.tsx', path: 'components/chat/ChatInput.tsx' },
        ]}
        testLinks={[]}
      />

      <FeatureCard
        icon={<ImageIcon size={16} color="#EC4899" />}
        title="Chat Layout & Message Display"
        description="Messages are rendered in the ChatArea component with two display modes: Bubble (default, chat-app style with messages grouped by sender) and Inline (Slack/Discord-style with avatars on the left). Messages from the same sender within a 5-minute window are grouped together. The HoverBubble component wraps each message with a hover action bar (React, Reply, Thread, More) and a right-click context menu with actions for Reply, Thread, Copy, Edit (own messages only), Forward, Pin, and Delete. The ChatHeader displays the conversation name, online status, and buttons for voice/video calls, search, shared files, pinned messages, and members panel."
        status="working"
        howTo={[
          'Messages auto-group by sender within 5-minute windows',
          'Hover over a message for quick actions (React, Reply, Thread)',
          'Right-click for the full context menu',
          'Use the chat header buttons for calls, search, files, and pins',
        ]}
        sourceLinks={[
          { label: 'ChatArea.tsx', path: 'components/chat/ChatArea.tsx' },
          { label: 'HoverBubble.tsx', path: 'components/chat/HoverBubble.tsx' },
          { label: 'MsgGroup.tsx', path: 'components/chat/MsgGroup.tsx' },
          { label: 'InlineMsgGroup.tsx', path: 'components/chat/InlineMsgGroup.tsx' },
          { label: 'ChatHeader.tsx', path: 'components/chat/ChatHeader.tsx' },
        ]}
        testLinks={[
          { label: 'ChatArea.test.tsx', path: '__tests__/components/chat/ChatArea.test.tsx' },
        ]}
      />

      <TechSpec
        title="Message Encryption"
        accentColor="#3B82F6"
        entries={[
          { label: 'Cipher', value: 'AES-256-GCM (AEAD)' },
          { label: 'Key Size', value: '256 bits (32 bytes)' },
          { label: 'Nonce Size', value: '96 bits (12 bytes)' },
          { label: 'Nonce Source', value: 'CSPRNG (never reused)' },
          { label: 'Auth Tag', value: '128 bits (16 bytes, appended)' },
          { label: 'AAD', value: '{sender_did}|{recipient_did}|{timestamp}' },
          { label: 'Max Plaintext', value: '64 KB (65,536 bytes)' },
          { label: 'Key Derivation', value: 'ECDH + HKDF-SHA256 (conv_id salt)' },
          { label: 'Signature', value: 'Ed25519 over full envelope' },
          { label: 'Status Tracking', value: 'sending → sent → delivered → read' },
        ]}
      />

      <TechSpec
        title="Message Operations"
        accentColor="#8B5CF6"
        entries={[
          { label: 'Edit', value: 'Re-encrypt, same ID, edited: true' },
          { label: 'Delete', value: 'deleted: true flag, ciphertext kept' },
          { label: 'Pin', value: 'Local metadata (pinnedBy, pinnedAt)' },
          { label: 'Reactions', value: 'Encrypted reaction type per emoji' },
          { label: 'Threads', value: 'threadId field (1 level deep)' },
          { label: 'Forward', value: 'Decrypt + re-encrypt for target' },
          { label: 'Ack Protocol', value: 'Relay FIFO queue per client' },
          { label: 'Envelope Format', value: 'JSON (versioned schema v1)' },
        ]}
      />

      <TechSpec
        title="Chat Input & UI"
        accentColor="#14B8A6"
        entries={[
          { label: 'Mention Trigger', value: '@ with word boundary detection' },
          { label: 'Max Suggestions', value: '5 (filtered by name/username)' },
          { label: 'Mention Navigation', value: 'Arrow keys + Enter + Escape' },
          { label: 'Picker', value: 'CombinedPicker (emoji + stickers)' },
          { label: 'Custom Emoji', value: 'Community emoji packs' },
          { label: 'File Transfer', value: 'P2P with progress + speed tracking' },
          { label: 'File Filters', value: 'All, Images, Docs, Media, Other' },
          { label: 'Layout Modes', value: 'Bubble (default) + Inline (Slack-style)' },
          { label: 'Message Grouping', value: 'Same sender within 5-min window' },
          { label: 'Context Actions', value: 'Reply, Thread, Copy, Edit, Forward, Pin, Delete' },
        ]}
      />

      <TechSpec
        title="Test Coverage Details"
        accentColor="#22C55E"
        entries={[
          { label: 'Total Tests', value: '117 tests across 6 files' },
          { label: 'Line Coverage', value: '88%' },
          { label: 'Branch Coverage', value: '84%' },
          { label: 'useMessages Hook', value: '32 tests (91% coverage)' },
          { label: 'Integration Flow', value: '22 tests (86% coverage)' },
          { label: 'Chat Features', value: '28 tests (89% coverage)' },
          { label: 'ChatArea Component', value: '15 tests (85% coverage)' },
          { label: 'Edge Cases', value: 'Edit, delete, forward, offline' },
        ]}
      />
    </View>
  );
}
