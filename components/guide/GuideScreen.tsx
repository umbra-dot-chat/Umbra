/**
 * GuideScreen — Main in-app user manual and help guide.
 *
 * A rich, interactive help screen with collapsible sections,
 * search, feature documentation, architecture diagrams,
 * and technical specifications. Includes test coverage info,
 * development stages, and links to source code and tests.
 */

import React, { useState, useMemo, useCallback } from 'react';
import { View, ScrollView, StyleSheet, TextInput, Pressable } from 'react-native';
import { Text, useTheme } from '@coexist/wisp-react-native';

import { GuideSection } from './GuideSection';
import { StatCard } from './StatCard';
import {
  BookOpenIcon, UsersIcon, MessageIcon, SettingsIcon, ShieldIcon,
  PlusIcon, GlobeIcon, KeyIcon, LockIcon, PhoneIcon,
  NetworkIcon, DatabaseIcon, SearchIcon, XIcon, CheckCircleIcon,
  ActivityIcon, CodeIcon, PuzzleIcon,
} from '@/components/icons';

// ── Content components ─────────────────────────────────────────────────
import GettingStartedContent from './GettingStartedContent';
import FriendsContent from './FriendsContent';
import MessagingContent from './MessagingContent';
import GroupsContent from './GroupsContent';
import CallingContent from './CallingContent';
import SecurityContent from './SecurityContent';
import NetworkContent from './NetworkContent';
import LimitationsContent from './LimitationsContent';
import TechnicalReferenceContent from './TechnicalReferenceContent';
import PluginsContent from './PluginsContent';
import CommunitiesContent from './CommunitiesContent';

// ── Development stage definitions ──────────────────────────────────────

export type DevelopmentStage = 'stable' | 'beta' | 'alpha' | 'planned';

const STAGE_CONFIG: Record<DevelopmentStage, { label: string; color: string; bgColor: string }> = {
  stable: { label: 'Stable', color: '#22C55E', bgColor: '#22C55E20' },
  beta: { label: 'Beta', color: '#EAB308', bgColor: '#EAB30820' },
  alpha: { label: 'Alpha', color: '#F97316', bgColor: '#F9731620' },
  planned: { label: 'Planned', color: '#6366F1', bgColor: '#6366F120' },
};

// ── Section definitions with test coverage ─────────────────────────────

interface SectionDef {
  id: string;
  title: string;
  subtitle: string;
  iconBg: string;
  keywords: string[];
  stage: DevelopmentStage;
  testCoverage: {
    percentage: number;
    testFiles: string[];
    integrationTests: string[];
  };
}

const SECTIONS: SectionDef[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    subtitle: 'Create your identity, connect, and handle invites',
    iconBg: '#22C55E',
    keywords: ['identity', 'create', 'recovery', 'pin', 'start', 'did', 'bip39', 'mnemonic', 'key', 'hkdf', 'deep link', 'invite', 'loading', 'initialization', 'onboarding'],
    stage: 'stable',
    testCoverage: {
      percentage: 85,
      testFiles: [
        '__tests__/integration/identity-flow.test.ts',
        '__tests__/contexts/UmbraContext.test.tsx',
      ],
      integrationTests: [
        '__tests__/integration/persistence.test.ts',
      ],
    },
  },
  {
    id: 'friends',
    title: 'Friends',
    subtitle: 'Add friends, scan QR codes, and discover users',
    iconBg: '#8B5CF6',
    keywords: ['friend', 'request', 'add', 'block', 'accept', 'reject', 'ecdh', 'key exchange', 'sync', 'qr', 'qr code', 'scan', 'discovery', 'discover', 'linked', 'link account', 'discord', 'github', 'steam', 'bluesky', 'username', 'search', 'cross-platform', 'connection link', 'share'],
    stage: 'stable',
    testCoverage: {
      percentage: 92,
      testFiles: [
        '__tests__/hooks/useFriends.test.ts',
        '__tests__/integration/friends-flow.test.ts',
      ],
      integrationTests: [
        '__tests__/integration/relay-e2e.test.ts',
      ],
    },
  },
  {
    id: 'messaging',
    title: 'Messaging',
    subtitle: 'Send encrypted messages, files, and mentions',
    iconBg: '#3B82F6',
    keywords: ['message', 'send', 'edit', 'delete', 'pin', 'reaction', 'thread', 'reply', 'forward', 'aes', 'encrypt', 'nonce', 'gcm', 'mention', 'autocomplete', 'emoji', 'sticker', 'file', 'attachment', 'transfer', 'chat input', 'bubble', 'inline'],
    stage: 'stable',
    testCoverage: {
      percentage: 88,
      testFiles: [
        '__tests__/hooks/useMessages.test.ts',
        '__tests__/components/chat/ChatArea.test.tsx',
        '__tests__/components/chat/ChatInput.test.tsx',
        '__tests__/components/chat/MsgGroup.test.tsx',
      ],
      integrationTests: [
        '__tests__/integration/chat-features.test.ts',
        '__tests__/integration/messaging-flow.test.ts',
      ],
    },
  },
  {
    id: 'groups',
    title: 'Groups',
    subtitle: 'Group conversations',
    iconBg: '#EC4899',
    keywords: ['group', 'create', 'member', 'admin', 'key rotation', 'group key', 'ecdh envelope'],
    stage: 'stable',
    testCoverage: {
      percentage: 78,
      testFiles: [
        '__tests__/hooks/useGroups.test.ts',
        '__tests__/integration/groups-flow.test.ts',
      ],
      integrationTests: [],
    },
  },
  {
    id: 'communities',
    title: 'Communities',
    subtitle: 'Large-scale community spaces',
    iconBg: '#F97316',
    keywords: [
      'community', 'space', 'channel', 'role', 'permission', 'bitfield', 'invite',
      'moderation', 'warning', 'ban', 'kick', 'timeout', 'thread', 'search',
      'webhook', 'emoji', 'sticker', 'branding', 'boost', 'node', 'audit',
      'announcement', 'bulletin', 'file', 'folder', 'mention', 'reaction', 'pin',
      'vanity', 'slow mode', 'e2ee', 'notification', 'status', 'member',
      'qr', 'qr code', 'discord', 'import', 'migrate',
    ],
    stage: 'alpha',
    testCoverage: {
      percentage: 8,
      testFiles: [
        'packages/umbra-core/src/community/permissions.rs',
      ],
      integrationTests: [],
    },
  },
  {
    id: 'calling',
    title: 'Voice & Video Calls',
    subtitle: 'WebRTC calling with E2EE',
    iconBg: '#10B981',
    keywords: ['call', 'voice', 'video', 'webrtc', 'ice', 'stun', 'turn', 'sdp', 'opus', 'codec', 'screen share', 'group call', 'e2ee', 'dtls', 'srtp', 'diagnostics', 'loopback', 'relay test'],
    stage: 'beta',
    testCoverage: {
      percentage: 75,
      testFiles: [
        '__tests__/hooks/useCall.test.ts',
        '__tests__/hooks/useCallSettings.test.ts',
        '__tests__/hooks/useMediaDevices.test.ts',
        '__tests__/services/CallManager.test.ts',
        '__tests__/services/CallManager.video.test.ts',
        '__tests__/services/GroupCallManager.test.ts',
      ],
      integrationTests: [
        '__tests__/integration/calling.test.ts',
        '__tests__/integration/group-calling.test.ts',
      ],
    },
  },
  {
    id: 'security',
    title: 'Security & Privacy',
    subtitle: 'Encryption and key management',
    iconBg: '#EAB308',
    keywords: ['encrypt', 'key', 'privacy', 'security', 'e2e', 'did', 'aes', 'x25519', 'ed25519', 'zero-knowledge', 'gcm', 'nonce', 'aad', 'threat model', 'storage encryption'],
    stage: 'stable',
    testCoverage: {
      percentage: 95,
      testFiles: [
        '__tests__/packages/umbra-wasm/loader.test.ts',
        '__tests__/integration/identity-flow.test.ts',
      ],
      integrationTests: [
        '__tests__/integration/persistence.test.ts',
      ],
    },
  },
  {
    id: 'network',
    title: 'Network & Architecture',
    subtitle: 'How Umbra connects peers',
    iconBg: '#06B6D4',
    keywords: ['network', 'relay', 'p2p', 'webrtc', 'offline', 'federation', 'mesh', 'websocket', 'server', 'routing', 'presence', 'gossip', 'tokio', 'axum'],
    stage: 'stable',
    testCoverage: {
      percentage: 82,
      testFiles: [
        '__tests__/hooks/useNetwork.test.ts',
        '__tests__/integration/networking.test.ts',
      ],
      integrationTests: [
        '__tests__/integration/relay-e2e.test.ts',
        '__tests__/integration/p2p-flow.test.ts',
      ],
    },
  },
  {
    id: 'plugins',
    title: 'Plugins',
    subtitle: 'Extend Umbra with plugins',
    iconBg: '#8B5CF6',
    keywords: ['plugin', 'extension', 'sdk', 'slot', 'permission', 'manifest', 'marketplace', 'api'],
    stage: 'beta',
    testCoverage: {
      percentage: 81,
      testFiles: [
        '__tests__/contexts/PluginContext.test.tsx',
      ],
      integrationTests: [],
    },
  },
  {
    id: 'limitations',
    title: 'Known Limitations',
    subtitle: 'Current feature status',
    iconBg: '#F97316',
    keywords: ['limit', 'known', 'issue', 'status', 'bug', 'platform'],
    stage: 'stable',
    testCoverage: {
      percentage: 100,
      testFiles: [],
      integrationTests: [],
    },
  },
  {
    id: 'technical',
    title: 'Technical Reference',
    subtitle: 'Protocols, formats, mobile FFI, and specs',
    iconBg: '#6366F1',
    keywords: ['technical', 'protocol', 'format', 'crypto', 'spec', 'reference', 'schema', 'envelope', 'database', 'architecture', 'mobile', 'ffi', 'native', 'dispatcher', 'tauri', 'wasm', 'react native', 'expo'],
    stage: 'stable',
    testCoverage: {
      percentage: 100,
      testFiles: [],
      integrationTests: [],
    },
  },
];

// ── Section icon + content mapping ─────────────────────────────────────

const SECTION_CONFIG: Record<string, {
  icon: React.ReactNode;
  defaultExpanded?: boolean;
  content: React.ReactNode;
}> = {
  'getting-started': {
    icon: <PlusIcon size={20} color="#FFF" />,
    defaultExpanded: true,
    content: <GettingStartedContent />,
  },
  friends: {
    icon: <UsersIcon size={20} color="#FFF" />,
    content: <FriendsContent />,
  },
  messaging: {
    icon: <MessageIcon size={20} color="#FFF" />,
    content: <MessagingContent />,
  },
  groups: {
    icon: <UsersIcon size={20} color="#FFF" />,
    content: <GroupsContent />,
  },
  communities: {
    icon: <GlobeIcon size={20} color="#FFF" />,
    content: <CommunitiesContent />,
  },
  calling: {
    icon: <PhoneIcon size={20} color="#FFF" />,
    content: <CallingContent />,
  },
  security: {
    icon: <ShieldIcon size={20} color="#FFF" />,
    content: <SecurityContent />,
  },
  network: {
    icon: <GlobeIcon size={20} color="#FFF" />,
    content: <NetworkContent />,
  },
  plugins: {
    icon: <PuzzleIcon size={20} color="#FFF" />,
    content: <PluginsContent />,
  },
  limitations: {
    icon: <BookOpenIcon size={20} color="#FFF" />,
    content: <LimitationsContent />,
  },
  technical: {
    icon: <SettingsIcon size={20} color="#FFF" />,
    content: <TechnicalReferenceContent />,
  },
};

// ── Search bar component ───────────────────────────────────────────────

function SearchBar({
  value,
  onChangeText,
  onClear,
}: {
  value: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
}) {
  const { theme, mode } = useTheme();
  const tc = theme.colors;
  const isDark = mode === 'dark';

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: isDark ? '#18181B' : tc.background.sunken,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: isDark ? '#27272A' : tc.border.subtle,
        paddingHorizontal: 14,
        paddingVertical: 10,
        gap: 10,
      }}
    >
      <SearchIcon size={18} color={tc.text.muted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Search guide sections, features, keywords..."
        placeholderTextColor={tc.text.muted}
        style={{
          flex: 1,
          fontSize: 14,
          color: tc.text.primary,
          outlineStyle: 'none',
        } as any}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {value.length > 0 && (
        <Pressable onPress={onClear} hitSlop={8}>
          <XIcon size={16} color={tc.text.muted} />
        </Pressable>
      )}
    </View>
  );
}

// ── Section header with test coverage ──────────────────────────────────

function SectionMeta({ section }: { section: SectionDef }) {
  const { theme, mode } = useTheme();
  const tc = theme.colors;
  const isDark = mode === 'dark';
  const stageCfg = STAGE_CONFIG[section.stage];
  const totalTests = section.testCoverage.testFiles.length + section.testCoverage.integrationTests.length;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 4,
        flexWrap: 'wrap',
      }}
    >
      {/* Stage badge */}
      <View
        style={{
          backgroundColor: stageCfg.bgColor,
          paddingHorizontal: 8,
          paddingVertical: 2,
          borderRadius: 6,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <CheckCircleIcon size={10} color={stageCfg.color} />
        <Text style={{ fontSize: 10, fontWeight: '600', color: stageCfg.color }}>
          {stageCfg.label}
        </Text>
      </View>

      {/* Test coverage badge */}
      {totalTests > 0 && (
        <View
          style={{
            backgroundColor: isDark ? '#1E293B' : '#E0F2FE',
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 6,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <ActivityIcon size={10} color="#0EA5E9" />
          <Text style={{ fontSize: 10, fontWeight: '600', color: '#0EA5E9' }}>
            {section.testCoverage.percentage}% coverage
          </Text>
        </View>
      )}

      {/* Test count badge */}
      {totalTests > 0 && (
        <View
          style={{
            backgroundColor: isDark ? '#1C1917' : '#FEF3C7',
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 6,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <CodeIcon size={10} color="#D97706" />
          <Text style={{ fontSize: 10, fontWeight: '600', color: '#D97706' }}>
            {totalTests} test {totalTests === 1 ? 'file' : 'files'}
          </Text>
        </View>
      )}
    </View>
  );
}

// ── Main component ────────────────────────────────────────────────────

export function GuideScreen() {
  const { theme, mode } = useTheme();
  const tc = theme.colors;
  const isDark = mode === 'dark';
  const [search, setSearch] = useState('');

  const handleClearSearch = useCallback(() => setSearch(''), []);

  const filteredSections = useMemo(() => {
    if (!search.trim()) return SECTIONS;
    const q = search.toLowerCase();
    return SECTIONS.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.subtitle.toLowerCase().includes(q) ||
        s.keywords.some((k) => k.includes(q)) ||
        s.stage.includes(q)
    );
  }, [search]);

  // Calculate overall test stats
  const overallStats = useMemo(() => {
    const totalTests = SECTIONS.reduce(
      (acc, s) => acc + s.testCoverage.testFiles.length + s.testCoverage.integrationTests.length,
      0
    );
    const avgCoverage = Math.round(
      SECTIONS.filter((s) => s.testCoverage.percentage < 100).reduce(
        (acc, s, _, arr) => acc + s.testCoverage.percentage / arr.length,
        0
      )
    );
    const stableCount = SECTIONS.filter((s) => s.stage === 'stable').length;
    return { totalTests, avgCoverage, stableCount };
  }, []);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isDark ? '#09090B' : tc.background.canvas }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <BookOpenIcon size={28} color="#FAFAFA" />
        </View>
        <Text style={[styles.headerTitle, { color: tc.text.primary }]}>Umbra User Guide</Text>
        <Text style={[styles.headerSubtitle, { color: tc.text.muted }]}>
          End-to-end encrypted, decentralized messaging
        </Text>
      </View>

      {/* Search Bar */}
      <SearchBar value={search} onChangeText={setSearch} onClear={handleClearSearch} />

      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <StatCard label="Encryption" value="E2E" color="#22C55E" icon={<LockIcon size={20} color="#22C55E" />} />
        <StatCard label="Protocol" value="DID" color="#8B5CF6" icon={<KeyIcon size={20} color="#8B5CF6" />} />
        <StatCard label="Relay" value="Mesh" color="#06B6D4" icon={<NetworkIcon size={20} color="#06B6D4" />} />
        <StatCard label="Storage" value="Local" color="#3B82F6" icon={<DatabaseIcon size={20} color="#3B82F6" />} />
      </View>

      {/* Development Stats */}
      <View
        style={{
          flexDirection: 'row',
          gap: 12,
          paddingVertical: 8,
          flexWrap: 'wrap',
        }}
      >
        <View
          style={{
            flex: 1,
            minWidth: 100,
            backgroundColor: isDark ? '#18181B' : tc.background.sunken,
            borderRadius: 10,
            padding: 12,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: isDark ? '#27272A' : tc.border.subtle,
          }}
        >
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#22C55E' }}>
            {overallStats.stableCount}/{SECTIONS.length}
          </Text>
          <Text style={{ fontSize: 11, color: tc.text.muted, marginTop: 2 }}>
            Stable Sections
          </Text>
        </View>
        <View
          style={{
            flex: 1,
            minWidth: 100,
            backgroundColor: isDark ? '#18181B' : tc.background.sunken,
            borderRadius: 10,
            padding: 12,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: isDark ? '#27272A' : tc.border.subtle,
          }}
        >
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#0EA5E9' }}>
            {overallStats.avgCoverage}%
          </Text>
          <Text style={{ fontSize: 11, color: tc.text.muted, marginTop: 2 }}>
            Avg Test Coverage
          </Text>
        </View>
        <View
          style={{
            flex: 1,
            minWidth: 100,
            backgroundColor: isDark ? '#18181B' : tc.background.sunken,
            borderRadius: 10,
            padding: 12,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: isDark ? '#27272A' : tc.border.subtle,
          }}
        >
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#D97706' }}>
            {overallStats.totalTests}
          </Text>
          <Text style={{ fontSize: 11, color: tc.text.muted, marginTop: 2 }}>
            Test Files
          </Text>
        </View>
      </View>

      {/* Search results info */}
      {search.trim() && (
        <View style={{ paddingVertical: 4 }}>
          <Text style={{ fontSize: 13, color: tc.text.muted }}>
            Found {filteredSections.length} {filteredSections.length === 1 ? 'section' : 'sections'} matching "{search}"
          </Text>
        </View>
      )}

      {/* Sections */}
      {filteredSections.map((section) => {
        const config = SECTION_CONFIG[section.id];
        if (!config) return null;
        return (
          <GuideSection
            key={section.id}
            title={section.title}
            subtitle={section.subtitle}
            icon={config.icon}
            iconBg={section.iconBg}
            defaultExpanded={config.defaultExpanded}
            headerExtra={<SectionMeta section={section} />}
          >
            {config.content}
          </GuideSection>
        );
      })}

      {/* No results */}
      {filteredSections.length === 0 && search.trim() && (
        <View
          style={{
            alignItems: 'center',
            paddingVertical: 40,
            gap: 8,
          }}
        >
          <SearchIcon size={32} color={tc.text.muted} />
          <Text style={{ fontSize: 15, color: tc.text.muted, textAlign: 'center' }}>
            No sections found for "{search}"
          </Text>
          <Pressable onPress={handleClearSearch}>
            <Text style={{ fontSize: 13, color: tc.status.info }}>Clear search</Text>
          </Pressable>
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: tc.text.muted }]}>
          Umbra v1.5.0 — Built with privacy in mind
        </Text>
        <Text style={[styles.footerSub, { color: isDark ? '#3F3F46' : tc.text.muted }]}>
          All data is encrypted locally. No servers can read your messages.
        </Text>
      </View>
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    gap: 16,
    maxWidth: 800,
    alignSelf: 'center' as const,
  },
  header: {
    alignItems: 'center' as const,
    gap: 8,
    paddingVertical: 16,
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
    textAlign: 'center' as const,
  },
  headerSubtitle: {
    fontSize: 15,
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
    fontWeight: '500' as const,
  },
  footerSub: {
    fontSize: 12,
  },
});
