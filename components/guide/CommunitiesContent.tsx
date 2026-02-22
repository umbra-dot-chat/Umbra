/**
 * CommunitiesContent — Community system documentation.
 *
 * Covers community CRUD, spaces, channels, roles, permissions,
 * messaging, threads, moderation, files, customization,
 * integrations, boost nodes, and member experience.
 */

import React from 'react';
import { View } from 'react-native';

import { FeatureCard } from '@/components/guide/FeatureCard';
import { TechSpec } from '@/components/guide/TechSpec';
import {
  UsersIcon, LockIcon, PlusIcon, SettingsIcon, CrownIcon,
  MessageIcon, ShieldIcon, FileTextIcon, ServerIcon,
  SearchIcon, BellIcon, PaletteIcon, ZapIcon, DatabaseIcon,
  EditIcon, UserMinusIcon, KeyIcon, GlobeIcon,
} from '@/components/icons';

export default function CommunitiesContent() {
  return (
    <View style={{ gap: 12 }}>
      {/* ── Core Infrastructure ──────────────────────────────── */}

      <FeatureCard
        icon={<PlusIcon size={16} color="#22C55E" />}
        title="Create & Manage Communities"
        description="Create a new community with a name and optional description. On creation, the backend atomically generates a unique ID, creates a default 'General' space with welcome and general channels, creates 4 preset roles (Owner, Admin, Moderator, Member), assigns the creator as Owner, and logs the creation to the audit log. Communities can be updated, deleted (owner only), and ownership can be transferred."
        status="working"
        howTo={[
          'Open the community creation dialog',
          'Enter a name, optional description, and optional icon',
          'Click Create — a default space and channels are set up automatically',
          'Transfer ownership via community settings (danger zone)',
        ]}
        limitations={[
          'Community deletion is permanent and owner-only',
          'Ownership transfer swaps roles between old and new owner',
        ]}
        sourceLinks={[
          { label: 'service.rs', path: 'packages/umbra-core/src/community/service.rs' },
          { label: 'mod.rs', path: 'packages/umbra-core/src/community/mod.rs' },
          { label: 'schema.rs', path: 'packages/umbra-core/src/storage/schema.rs' },
        ]}
        testLinks={[
          { label: 'permissions.rs (inline)', path: 'packages/umbra-core/src/community/permissions.rs' },
        ]}
      />

      <FeatureCard
        icon={<DatabaseIcon size={16} color="#06B6D4" />}
        title="Spaces & Channels"
        description="Spaces are one level of organizational nesting within a community. Each space contains channels that can be reordered by position. Six channel types are supported: text, voice, files, announcement (restricted posting), bulletin (admin-only), and welcome (auto-generates join messages). Channels support topics, slow mode, E2EE toggle, and configurable pin limits."
        status="working"
        howTo={[
          'Spaces appear as collapsible sections in the sidebar',
          'Create channels within spaces with a type selector',
          'Drag to reorder spaces and channels',
          'Set channel topic and slow mode in channel settings',
        ]}
        sourceLinks={[
          { label: 'spaces.rs', path: 'packages/umbra-core/src/community/spaces.rs' },
          { label: 'channels.rs', path: 'packages/umbra-core/src/community/channels.rs' },
        ]}
        testLinks={[
          { label: 'permissions.rs (inline)', path: 'packages/umbra-core/src/community/permissions.rs' },
        ]}
      />

      {/* ── Roles & Permissions ──────────────────────────────── */}

      <FeatureCard
        icon={<CrownIcon size={16} color="#EAB308" />}
        title="Roles & Permissions"
        description="A 64-bit permission bitfield system with 34+ permission flags. Four preset roles are created with every community: Owner (#e74c3c, all permissions), Admin (#e67e22, nearly all), Moderator (#2ecc71, message/member management), and Member (#95a5a6, basic access). The Administrator flag (bit 63) bypasses all checks. Permission resolution follows precedence: owner bypass, then role permissions, then channel overrides (deny first, then allow). Custom roles can be created with arbitrary permission sets."
        status="working"
        howTo={[
          'Preset roles are auto-created — no setup needed',
          'Create custom roles via role management panel',
          'Set per-channel overrides with allow/deny/inherit toggles',
          'Assign roles to members in the member list',
        ]}
        limitations={[
          'Permission templates for common configurations are planned',
          'Role color display in messages depends on frontend implementation',
        ]}
        sourceLinks={[
          { label: 'permissions.rs', path: 'packages/umbra-core/src/community/permissions.rs' },
          { label: 'roles.rs', path: 'packages/umbra-core/src/community/roles.rs' },
          { label: 'integrations.rs', path: 'packages/umbra-core/src/community/integrations.rs' },
        ]}
        testLinks={[
          { label: 'permissions.rs (inline)', path: 'packages/umbra-core/src/community/permissions.rs' },
        ]}
      />

      {/* ── Members & Invites ────────────────────────────────── */}

      <FeatureCard
        icon={<UsersIcon size={16} color="#8B5CF6" />}
        title="Members & Invites"
        description="Members join via invite codes that support optional expiration and max use limits. Invite links can be shared as text or as scannable QR codes — the invite panel includes a built-in QR code generator. On join, the system checks ban status, prevents duplicates, auto-assigns the default Member role, and sends a welcome message to the welcome channel. Members can be kicked or banned (with device fingerprint, optional reason, and optional expiry). Ban evasion is detected by matching device fingerprints on join attempts. Vanity URLs provide custom short invite codes."
        status="working"
        howTo={[
          'Create an invite link with optional expiry and max uses',
          'Share via text link or QR code from the invite panel',
          'Set a vanity URL for a memorable invite link',
          'View and manage the ban list in community settings',
        ]}
        limitations={[
          'Owner cannot leave or be kicked/banned',
          'Welcome messages are best-effort (don\'t fail the join)',
        ]}
        sourceLinks={[
          { label: 'members.rs', path: 'packages/umbra-core/src/community/members.rs' },
          { label: 'invites.rs', path: 'packages/umbra-core/src/community/invites.rs' },
          { label: 'CommunityInvitePanel.tsx', path: 'components/community/CommunityInvitePanel.tsx' },
        ]}
        testLinks={[
          { label: 'permissions.rs (inline)', path: 'packages/umbra-core/src/community/permissions.rs' },
        ]}
      />

      {/* ── Messaging ────────────────────────────────────────── */}

      <FeatureCard
        icon={<MessageIcon size={16} color="#3B82F6" />}
        title="Community Messaging"
        description="Messages support plaintext and E2EE (via content_encrypted field with per-channel key versioning). Channel type enforcement blocks text in voice channels and restricts announcement channels to owner/admin/moderator. Slow mode enforces cooldowns per member per channel. Muted members are blocked from sending. Reactions, pins (configurable limit, default 50), read receipts, and reply/quote-reply linking are all built in. Mention parsing supports @everyone, @here, @role:ID, and @user:DID."
        status="working"
        howTo={[
          'Send messages in text channels with rich content',
          'Reply to messages or quote-reply with thread linking',
          'Add reactions with standard or custom emoji',
          'Pin important messages (up to 50 per channel)',
          'Mention @everyone, @here, @role, or @user',
        ]}
        sourceLinks={[
          { label: 'messaging.rs', path: 'packages/umbra-core/src/community/messaging.rs' },
          { label: 'wasm.rs', path: 'packages/umbra-core/src/ffi/wasm.rs' },
        ]}
        testLinks={[
          { label: 'permissions.rs (inline)', path: 'packages/umbra-core/src/community/permissions.rs' },
        ]}
      />

      {/* ── Threads & Search ─────────────────────────────────── */}

      <FeatureCard
        icon={<SearchIcon size={16} color="#14B8A6" />}
        title="Threads & Search"
        description="Threads are created from a parent message with an optional name. The creator is auto-followed. Threads track message count, last activity, and followers (follow/unfollow). Message search queries plaintext content within a channel or across a community. Advanced search supports filters: from user, in channel, before/after date, has file, has reaction, is pinned."
        status="working"
        howTo={[
          'Click "Create Thread" on any message',
          'Follow threads to get notifications',
          'Search messages by content in the search bar',
          'Use advanced filters for targeted search',
        ]}
        limitations={[
          'Search only works on plaintext messages (not E2EE)',
          'Full-text search index (FTS5) planned for future',
        ]}
        sourceLinks={[
          { label: 'threads.rs', path: 'packages/umbra-core/src/community/threads.rs' },
          { label: 'member_experience.rs', path: 'packages/umbra-core/src/community/member_experience.rs' },
        ]}
        testLinks={[
          { label: 'permissions.rs (inline)', path: 'packages/umbra-core/src/community/permissions.rs' },
        ]}
      />

      {/* ── Moderation ───────────────────────────────────────── */}

      <FeatureCard
        icon={<ShieldIcon size={16} color="#EF4444" />}
        title="Moderation System"
        description="A warning/strike system with configurable auto-escalation thresholds (default: timeout at 3 active warnings, ban at 5). Warnings support optional expiry — only non-expired warnings count toward escalation. The check_warning_escalation function recommends 'timeout', 'ban', or nothing. Keyword filters for AutoMod allow content-based moderation. All admin/mod actions are recorded in the audit log with actor, action type, target, and metadata."
        status="working"
        howTo={[
          'Issue warnings to members with a reason and optional expiry',
          'View a member\'s warning history in the moderation panel',
          'Configure keyword filters for automated content moderation',
          'Review the audit log for all admin and mod actions',
        ]}
        limitations={[
          'ML-powered toxicity scoring (ONNX) is planned',
          'Advanced spam detection is planned',
          'Owner cannot be warned',
        ]}
        sourceLinks={[
          { label: 'moderation.rs', path: 'packages/umbra-core/src/community/moderation.rs' },
          { label: 'service.rs (audit)', path: 'packages/umbra-core/src/community/service.rs' },
          { label: 'members.rs (kick/ban)', path: 'packages/umbra-core/src/community/members.rs' },
        ]}
        testLinks={[
          { label: 'permissions.rs (inline)', path: 'packages/umbra-core/src/community/permissions.rs' },
        ]}
      />

      {/* ── Files ────────────────────────────────────────────── */}

      <FeatureCard
        icon={<FileTextIcon size={16} color="#F59E0B" />}
        title="File Management"
        description="File channels support organized file sharing with folder hierarchies (parent_folder_id for nesting). Files store metadata including filename, size, MIME type, version, description, and storage chunk references (JSON for distributed P2P storage). Download counts are tracked per file. Folders can be created, listed, renamed, and deleted within file-type channels."
        status="working"
        howTo={[
          'Upload files to file-type channels',
          'Organize files into folders with nesting',
          'Track download counts per file',
          'Browse with folder breadcrumb navigation',
        ]}
        limitations={[
          'P2P chunk distribution via boost nodes is planned',
          'File versioning and history UI not yet built',
        ]}
        sourceLinks={[
          { label: 'files.rs', path: 'packages/umbra-core/src/community/files.rs' },
        ]}
        testLinks={[
          { label: 'permissions.rs (inline)', path: 'packages/umbra-core/src/community/permissions.rs' },
        ]}
      />

      {/* ── Customization ────────────────────────────────────── */}

      <FeatureCard
        icon={<PaletteIcon size={16} color="#EC4899" />}
        title="Customization & Branding"
        description="Communities can be branded with icon, banner, splash image, accent color, and custom CSS. Custom emoji support includes animated flags and image URLs. Sticker packs can be created and organized. Vanity URLs provide memorable invite links. All customization operations are audit logged."
        status="working"
        howTo={[
          'Upload a community icon, banner, and splash image',
          'Set an accent color and optional custom CSS theme',
          'Create custom emoji with names and optional animation',
          'Set a vanity URL for your community invite link',
        ]}
        sourceLinks={[
          { label: 'customization.rs', path: 'packages/umbra-core/src/community/customization.rs' },
        ]}
        testLinks={[
          { label: 'permissions.rs (inline)', path: 'packages/umbra-core/src/community/permissions.rs' },
        ]}
      />

      {/* ── Integrations ─────────────────────────────────────── */}

      <FeatureCard
        icon={<ZapIcon size={16} color="#6366F1" />}
        title="Webhooks & Integrations"
        description="Webhooks are per-channel with auto-generated authentication tokens. Each webhook has a custom name and optional avatar. Channel-level permission overrides use allow/deny bitfields per role or member, enabling granular access control beyond base role permissions. Custom roles (beyond the 4 presets) can be created with arbitrary permission sets, colors, and hierarchy positions."
        status="working"
        howTo={[
          'Create webhooks in channel settings',
          'Copy the webhook token for external integrations',
          'Set channel permission overrides for specific roles or members',
          'Create custom roles beyond the 4 presets',
        ]}
        sourceLinks={[
          { label: 'integrations.rs', path: 'packages/umbra-core/src/community/integrations.rs' },
        ]}
        testLinks={[
          { label: 'permissions.rs (inline)', path: 'packages/umbra-core/src/community/permissions.rs' },
        ]}
      />

      {/* ── Member Experience ────────────────────────────────── */}

      <FeatureCard
        icon={<BellIcon size={16} color="#0EA5E9" />}
        title="Member Experience"
        description="Custom member status with text, emoji, and optional expiration. Notification settings are configurable per community, per space, or per channel with mute-until, suppress @everyone, suppress @roles, and level (all/mentions/none). Timeouts (mute/restrict) can be issued with durations. Presence and typing indicators provide real-time awareness. System messages are generated for events like member joins."
        status="working"
        howTo={[
          'Set a custom status with text and emoji',
          'Configure notification preferences per channel or community',
          'Timeout disruptive members with a duration and reason',
          'Follow threads to receive notifications on replies',
        ]}
        sourceLinks={[
          { label: 'member_experience.rs', path: 'packages/umbra-core/src/community/member_experience.rs' },
          { label: 'members.rs', path: 'packages/umbra-core/src/community/members.rs' },
        ]}
        testLinks={[
          { label: 'permissions.rs (inline)', path: 'packages/umbra-core/src/community/permissions.rs' },
        ]}
      />

      {/* ── Discord Import ───────────────────────────────────── */}

      <FeatureCard
        icon={<GlobeIcon size={16} color="#5865F2" />}
        title="Discord Import"
        description="Import your existing Discord server structure into Umbra. The import dialog lets you connect to Discord and pull in your server's channels, roles, and organizational structure. This helps communities migrate from Discord to Umbra without manually recreating their entire setup. Imported structures can be customized after import."
        status="working"
        howTo={[
          'Open community settings and select Discord Import',
          'Connect your Discord account',
          'Select the server structure to import',
          'Review and customize the imported channels and roles',
        ]}
        limitations={[
          'Message history is not imported (only structure)',
          'Member accounts must be re-invited on Umbra',
        ]}
        sourceLinks={[
          { label: 'DiscordImportDialog.tsx', path: 'components/community/DiscordImportDialog.tsx' },
        ]}
        testLinks={[]}
      />

      {/* ── Boost Nodes ──────────────────────────────────────── */}

      <FeatureCard
        icon={<ServerIcon size={16} color="#10B981" />}
        title="Boost Nodes"
        description="Boost nodes are user-contributed storage and bandwidth infrastructure for federated community data. Nodes can be local (embedded in the app) or remote (standalone binary on a VPS or home server). Configuration includes storage limits, bandwidth limits, auto-start, and prioritized communities. Remote nodes use pairing tokens for secure linking. Node health is tracked via heartbeat updates."
        status="beta"
        howTo={[
          'Register a boost node (local or remote)',
          'Configure storage and bandwidth limits',
          'Pair remote nodes using a token or QR code',
          'Prioritize which communities your node serves',
        ]}
        limitations={[
          'Standalone boost node binary (umbra-boost-node) is planned',
          'P2P chunk seeding and replication not yet implemented',
          'Only node configuration is stored — runtime is planned',
        ]}
        sourceLinks={[
          { label: 'boost_nodes.rs', path: 'packages/umbra-core/src/community/boost_nodes.rs' },
        ]}
        testLinks={[
          { label: 'permissions.rs (inline)', path: 'packages/umbra-core/src/community/permissions.rs' },
        ]}
      />

      {/* ── Tech Specs ───────────────────────────────────────── */}

      <TechSpec
        title="Permission Bitfield"
        accentColor="#EAB308"
        entries={[
          { label: 'Size', value: '64-bit unsigned integer (u64)' },
          { label: 'Flags', value: '34+ permission bits' },
          { label: 'Admin Flag', value: 'Bit 63 — bypasses all checks' },
          { label: 'Resolution', value: 'Owner → Roles → Channel overrides' },
          { label: 'Override Model', value: 'Allow + Deny bitfields per target' },
          { label: 'Frontend Type', value: 'BigInt or decimal string' },
          { label: 'Preset Roles', value: 'Owner, Admin, Moderator, Member' },
        ]}
      />

      <TechSpec
        title="Community Architecture"
        accentColor="#3B82F6"
        entries={[
          { label: 'Core Modules', value: '16 Rust source files' },
          { label: 'Total Rust Lines', value: '3,141 lines' },
          { label: 'WASM Functions', value: '122 bindings' },
          { label: 'Database Tables', value: '26 community tables' },
          { label: 'Schema Version', value: 'v7 (migrated from v6)' },
          { label: 'Channel Types', value: 'text, voice, files, announce, bulletin, welcome' },
          { label: 'Encryption', value: 'E2EE optional per channel (AES-256-GCM)' },
          { label: 'Invite Sharing', value: 'Text links + QR codes' },
          { label: 'Import', value: 'Discord server structure import' },
          { label: 'Discovery', value: 'Invite links only (no public directory)' },
        ]}
      />

      <TechSpec
        title="WASM Function Categories"
        accentColor="#8B5CF6"
        entries={[
          { label: 'Community CRUD', value: '6 functions' },
          { label: 'Spaces', value: '5 functions' },
          { label: 'Channels', value: '9 functions' },
          { label: 'Members + Bans', value: '9 functions' },
          { label: 'Roles + Overrides', value: '11 functions' },
          { label: 'Invites', value: '5 functions' },
          { label: 'Messages + Reactions', value: '17 functions' },
          { label: 'Threads + Search', value: '10 functions' },
          { label: 'Moderation', value: '8 functions' },
          { label: 'Files + Folders', value: '8 functions' },
          { label: 'Customization', value: '8 functions' },
          { label: 'Webhooks', value: '5 functions' },
          { label: 'Boost Nodes', value: '6 functions' },
          { label: 'Member Experience', value: '15 functions' },
        ]}
      />

      <TechSpec
        title="Database Schema"
        accentColor="#06B6D4"
        entries={[
          { label: 'communities', value: 'Core record + branding fields' },
          { label: 'community_spaces', value: 'Spaces with position ordering' },
          { label: 'community_channels', value: '6 types, slow mode, E2EE, pins' },
          { label: 'community_roles', value: 'Preset + custom, color, hoisted' },
          { label: 'community_members', value: 'Profile, nickname, bio' },
          { label: 'community_messages', value: 'Plaintext + E2EE, replies, threads' },
          { label: 'community_reactions', value: 'Per-emoji per-member' },
          { label: 'community_warnings', value: 'Expiring warnings + escalation' },
          { label: 'community_audit_log', value: 'Actor, action, target, metadata' },
          { label: 'boost_nodes', value: 'Local/remote, config, heartbeat' },
        ]}
      />

      <TechSpec
        title="Test Coverage"
        accentColor="#22C55E"
        entries={[
          { label: 'permissions.rs', value: 'Inline #[cfg(test)] — bitfield, admin bypass' },
          { label: 'service.rs', value: 'Needs tests — CRUD, ownership' },
          { label: 'members.rs', value: 'Needs tests — join, ban, evasion' },
          { label: 'messaging.rs', value: 'Needs tests — send, reactions, pins' },
          { label: 'moderation.rs', value: 'Needs tests — warnings, escalation' },
          { label: 'threads.rs', value: 'Needs tests — threads, search' },
          { label: 'files.rs', value: 'Needs tests — upload, folders' },
          { label: 'integrations.rs', value: 'Needs tests — webhooks, overrides' },
        ]}
      />
    </View>
  );
}
