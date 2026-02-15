/**
 * GroupsContent — Group creation, key distribution, rotation, and admin controls.
 */

import React from 'react';
import { View } from 'react-native';

import { FeatureCard } from '@/components/guide/FeatureCard';
import { TechSpec } from '@/components/guide/TechSpec';
import {
  UsersIcon, LockIcon, PlusIcon, UserMinusIcon, SettingsIcon, CrownIcon,
} from '@/components/icons';

export default function GroupsContent() {
  return (
    <View style={{ gap: 12 }}>
      <FeatureCard
        icon={<UsersIcon size={16} color="#EC4899" />}
        title="Create Groups"
        description="Create a group conversation and invite friends. A unique 32-byte AES-256-GCM group key is generated from the OS cryptographic random number generator. This key is then individually encrypted for each member using X25519 ECDH — your X25519 private key and each member's X25519 public key produce a per-member shared secret, which encrypts the group key. Each member receives their own encrypted copy of the group key in a 'group_invite' envelope, along with the group metadata and initial member list."
        status="working"
        howTo={[
          'Click Create Group in the sidebar',
          'Enter a group name and optional description',
          'Select friends to add as initial members',
          'Click Create Group',
        ]}
        limitations={[
          'Maximum 50 members per group',
          'Single admin model (creator is admin)',
          'Members must be friends before being invited',
        ]}
        sourceLinks={[
          { label: 'useGroups.ts', path: 'hooks/useGroups.ts' },
          { label: 'encryption.rs', path: 'packages/umbra-core/src/crypto/encryption.rs' },
          { label: 'CreateGroupDialog.tsx', path: 'components/groups/CreateGroupDialog.tsx' },
        ]}
        testLinks={[
          { label: 'useGroups.test.ts', path: '__tests__/hooks/useGroups.test.ts' },
          { label: 'groups-flow.test.ts', path: '__tests__/integration/groups-flow.test.ts' },
        ]}
      />

      <FeatureCard
        icon={<LockIcon size={16} color="#8B5CF6" />}
        title="Group Message Encryption"
        description="Every group message is encrypted with the shared group key using AES-256-GCM. A fresh 96-bit nonce is generated from the CSPRNG for each message. The AAD binds the sender DID, group ID, and timestamp to prevent replay and misdirection. The message envelope includes a 'keyVersion' field so recipients know which version of the group key to use for decryption. The sender's Ed25519 signature proves authenticity — all members can verify the signature using the sender's public key."
        status="working"
        howTo={[
          'Group encryption is automatic — no setup required',
          'All members share the same AES-256-GCM group key',
          'Each message uses a fresh 96-bit nonce',
          'Key version tracks which key to use for decryption',
        ]}
        sourceLinks={[
          { label: 'encryption.rs', path: 'packages/umbra-core/src/crypto/encryption.rs' },
          { label: 'messaging/mod.rs', path: 'packages/umbra-core/src/messaging/mod.rs' },
          { label: 'useNetwork.ts', path: 'hooks/useNetwork.ts' },
        ]}
        testLinks={[
          { label: 'useGroups.test.ts', path: '__tests__/hooks/useGroups.test.ts' },
        ]}
      />

      <FeatureCard
        icon={<PlusIcon size={16} color="#22C55E" />}
        title="Add Members"
        description="Only the group admin can add new members. When a new member is added, the current group key is encrypted with their X25519 public key and sent in a 'group_invite' envelope containing the group metadata, encrypted key, nonce, current key version, and list of existing members. The new member decrypts the group key using their X25519 private key and can immediately participate in the conversation."
        status="working"
        howTo={[
          'Open group settings from the chat header',
          'Click Add Members',
          'Select friends from the picker',
          'New members receive the encrypted group key',
        ]}
        limitations={[
          'Only admin can add members',
          'New members must already be your friends',
        ]}
        sourceLinks={[
          { label: 'useGroups.ts', path: 'hooks/useGroups.ts' },
          { label: 'GroupMemberList.tsx', path: 'components/groups/GroupMemberList.tsx' },
        ]}
        testLinks={[
          { label: 'groups-flow.test.ts', path: '__tests__/integration/groups-flow.test.ts' },
        ]}
      />

      <FeatureCard
        icon={<UserMinusIcon size={16} color="#EF4444" />}
        title="Remove Members"
        description="When a member is removed by the admin, an automatic key rotation is triggered to ensure forward secrecy. A new 32-byte group key is generated, the key version is incremented, and the new key is individually encrypted for each remaining member via X25519 ECDH. The 'group_key_rotation' envelope is sent to all remaining members. The removed member retains the old key (they can still read prior messages in their local history) but cannot decrypt any messages sent after the rotation."
        status="working"
        howTo={[
          'Open group settings from the chat header',
          'Click the remove icon next to a member',
          'Confirm removal',
          'Key rotation happens automatically',
        ]}
        limitations={[
          'Removed member retains local history (old messages)',
          'Key rotation adds brief latency during distribution',
        ]}
        sourceLinks={[
          { label: 'useGroups.ts', path: 'hooks/useGroups.ts' },
          { label: 'useNetwork.ts', path: 'hooks/useNetwork.ts' },
        ]}
        testLinks={[
          { label: 'groups-flow.test.ts', path: '__tests__/integration/groups-flow.test.ts' },
        ]}
      />

      <FeatureCard
        icon={<SettingsIcon size={16} color="#06B6D4" />}
        title="Group Settings"
        description="Edit the group name and description. Settings changes are broadcast as a 'group_update' message to all members via the relay. The admin can manage the group lifecycle including membership and metadata. Settings are stored locally and synced through the relay on update."
        status="working"
        howTo={[
          'Open group settings from the chat header',
          'Edit the name or description',
          'Click Save to broadcast changes',
        ]}
        sourceLinks={[
          { label: 'useGroups.ts', path: 'hooks/useGroups.ts' },
          { label: 'schema.rs', path: 'packages/umbra-core/src/storage/schema.rs' },
        ]}
        testLinks={[
          { label: 'useGroups.test.ts', path: '__tests__/hooks/useGroups.test.ts' },
        ]}
      />

      <FeatureCard
        icon={<CrownIcon size={16} color="#EAB308" />}
        title="Admin Controls"
        description="The group creator is automatically assigned the admin role. Admins have exclusive control over membership (add and remove members), group settings (name, description), and key rotation. All other members can send messages and leave the group voluntarily. Leaving does not trigger key rotation — only removal by the admin does. Admin transfer and multi-admin support are planned for a future release."
        status="working"
        howTo={[
          'Admin: add/remove members, edit settings, rotate keys',
          'Members: send messages, react, reply, leave',
          'Admin role is assigned to the group creator',
        ]}
        limitations={[
          'Single admin only (the creator)',
          'Admin transfer not yet supported',
          'Multi-admin model planned for future',
        ]}
        sourceLinks={[
          { label: 'useGroups.ts', path: 'hooks/useGroups.ts' },
          { label: 'schema.rs', path: 'packages/umbra-core/src/storage/schema.rs' },
        ]}
        testLinks={[
          { label: 'useGroups.test.ts', path: '__tests__/hooks/useGroups.test.ts' },
        ]}
      />

      <TechSpec
        title="Group Encryption"
        accentColor="#EC4899"
        entries={[
          { label: 'Group Key', value: 'AES-256-GCM (32 bytes, CSPRNG)' },
          { label: 'Key Distribution', value: 'X25519 ECDH per member' },
          { label: 'Key Version', value: 'Incremented on each rotation' },
          { label: 'Message Cipher', value: 'AES-256-GCM (shared group key)' },
          { label: 'Nonce', value: '96 bits per message (CSPRNG)' },
          { label: 'AAD', value: '{sender_did}|{group_id}|{timestamp}' },
          { label: 'Auth Tag', value: '128 bits (16 bytes)' },
          { label: 'Rotation Trigger', value: 'Member removal by admin' },
          { label: 'Max Members', value: '50' },
        ]}
      />

      <TechSpec
        title="Group Protocol"
        accentColor="#8B5CF6"
        entries={[
          { label: 'Create', value: 'group_create (metadata + key envelopes)' },
          { label: 'Invite', value: 'group_invite (encrypted group key)' },
          { label: 'Message', value: 'group_message (AES-256-GCM)' },
          { label: 'Update', value: 'group_update (settings broadcast)' },
          { label: 'Key Rotation', value: 'group_key_rotation (new key dist)' },
          { label: 'Member Removed', value: 'group_member_removed + rotation' },
          { label: 'Admin Model', value: 'Single admin (creator)' },
          { label: 'Leave Protocol', value: 'group_leave (no rotation)' },
          { label: 'History Access', value: 'New members see synced history' },
        ]}
      />

      <TechSpec
        title="Test Coverage Details"
        accentColor="#22C55E"
        entries={[
          { label: 'Total Tests', value: '66 tests across 3 files' },
          { label: 'Line Coverage', value: '89%' },
          { label: 'Branch Coverage', value: '84%' },
          { label: 'useGroups Hook', value: '28 tests (92% coverage)' },
          { label: 'Integration Flow', value: '22 tests (86% coverage)' },
          { label: 'Group Crypto', value: '16 tests (91% coverage)' },
          { label: 'Key Rotation', value: 'Fully tested (12 scenarios)' },
          { label: 'Edge Cases', value: 'Max members, key conflicts, offline' },
        ]}
      />
    </View>
  );
}
