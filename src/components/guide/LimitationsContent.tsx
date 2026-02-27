/**
 * LimitationsContent — Known limitations, feature status, and development roadmap.
 */

import React from 'react';
import { View, Pressable, Linking } from 'react-native';
import { Text, useTheme } from '@coexist/wisp-react-native';

import { TechSpec } from '@/components/guide/TechSpec';

const REPO_BASE = 'https://github.com/InfamousVague/Umbra';

function openLink(path: string) {
  Linking.openURL(`${REPO_BASE}${path}`).catch(() => {});
}

export default function LimitationsContent() {
  const { theme, mode } = useTheme();
  const tc = theme.colors;
  const isDark = mode === 'dark';

  return (
    <View style={{ gap: 12 }}>
      {/* Development Overview */}
      <View
        style={{
          backgroundColor: isDark ? '#18181B' : tc.background.sunken,
          borderRadius: 12,
          padding: 16,
          borderWidth: 1,
          borderColor: isDark ? '#27272A' : tc.border.subtle,
        }}
      >
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: tc.text.primary,
            marginBottom: 8,
          }}
        >
          Development Status Overview
        </Text>
        <Text
          style={{
            fontSize: 13,
            color: tc.text.secondary,
            lineHeight: 20,
          }}
        >
          Umbra is in active development with core messaging and calling features
          stable and tested. The codebase includes 43+ test files covering hooks,
          components, services, and integration flows. See the test coverage
          breakdown for each section in the sidebar.
        </Text>
        <Pressable
          onPress={() => openLink('/tree/main/__tests__')}
          style={{ marginTop: 8, cursor: 'pointer' }}
        >
          <Text style={{ fontSize: 12, color: tc.status.info }}>
            View all tests on GitHub
          </Text>
        </Pressable>
      </View>

      <TechSpec
        title="Core Features (Stable)"
        accentColor="#22C55E"
        entries={[
          { label: 'Text Messaging', value: 'Stable (88% coverage)' },
          { label: 'Edit Messages', value: 'Stable' },
          { label: 'Delete Messages', value: 'Stable' },
          { label: 'Pin Messages', value: 'Stable' },
          { label: 'Reactions', value: 'Stable' },
          { label: 'Thread Replies', value: 'Stable' },
          { label: 'Forward Messages', value: 'Stable' },
          { label: 'Group Messaging', value: 'Stable (78% coverage)' },
          { label: 'Friend Management', value: 'Stable (92% coverage)' },
          { label: 'Identity / DID', value: 'Stable (85% coverage)' },
          { label: 'QR Code Sharing', value: 'Stable (share + scan)' },
          { label: 'Friend Discovery', value: 'Stable (cross-platform)' },
          { label: 'Linked Accounts', value: 'Stable (Discord, GitHub, Steam, Bluesky)' },
          { label: 'Username System', value: 'Stable (search + lookup)' },
          { label: 'Connection Links', value: 'Stable (shareable URLs)' },
          { label: '@Mentions', value: 'Stable (autocomplete + filtering)' },
          { label: 'File Transfers', value: 'Stable (P2P encrypted)' },
          { label: 'Emoji & Stickers', value: 'Stable (combined picker)' },
          { label: 'Deep Links', value: 'Stable (umbra:// + https://)' },
        ]}
      />

      <TechSpec
        title="Calling Features (Beta)"
        accentColor="#EAB308"
        entries={[
          { label: 'Voice Calls (1:1)', value: 'Beta (75% coverage)' },
          { label: 'Video Calls (1:1)', value: 'Beta' },
          { label: 'Screen Sharing', value: 'Beta' },
          { label: 'Virtual Backgrounds', value: 'Beta (Web only)' },
          { label: 'Group Calls (Mesh)', value: 'Beta (2-6 peers)' },
          { label: 'Quality Presets', value: 'Beta' },
          { label: 'Audio Codecs', value: 'Beta (Opus + PCM)' },
          { label: 'Frame E2EE', value: 'Beta (Chromium only)' },
          { label: 'Call Diagnostics', value: 'Beta (relay, TURN, loopback, stats)' },
        ]}
      />

      <TechSpec
        title="Community Features (Alpha)"
        accentColor="#F97316"
        entries={[
          { label: 'Community CRUD', value: 'Working (create, update, delete)' },
          { label: 'Spaces & Channels', value: 'Working (6 channel types)' },
          { label: 'Roles & Permissions', value: 'Working (64-bit bitfield)' },
          { label: 'Invites & QR Codes', value: 'Working (link + QR sharing)' },
          { label: 'Community Messaging', value: 'Working (E2EE per channel)' },
          { label: 'Moderation System', value: 'Working (warnings, bans, AutoMod)' },
          { label: 'Discord Import', value: 'Working (structure import)' },
          { label: 'File Channels', value: 'Working (folders, uploads)' },
          { label: 'Emoji & Stickers', value: 'Working (custom packs)' },
          { label: 'Boost Nodes', value: 'Beta (config only, no runtime)' },
        ]}
      />

      <TechSpec
        title="Planned Features"
        accentColor="#6366F1"
        entries={[
          { label: 'Voice Messages', value: 'Planned' },
          { label: 'Link Previews', value: 'Planned' },
          { label: 'SFU Group Calls', value: 'Planned (7-50 peers)' },
          { label: 'Multi-Device Sync', value: 'Planned' },
          { label: 'Push Notifications', value: 'Planned' },
          { label: 'Forward Secrecy', value: 'Planned (Double Ratchet)' },
          { label: 'Xbox Account Linking', value: 'Planned' },
          { label: 'Android Native', value: 'Planned (JNI FFI)' },
          { label: 'Biometric Unlock', value: 'Planned (Face ID / Touch ID)' },
        ]}
      />

      <TechSpec
        title="Platform Support"
        accentColor="#06B6D4"
        entries={[
          { label: 'Web Browser', value: 'Full support' },
          { label: 'Desktop (Tauri)', value: 'In development' },
          { label: 'iOS (Expo)', value: 'TestFlight beta (v1.5.0)' },
          { label: 'Android (Expo)', value: 'In development' },
          { label: 'Database', value: 'sql.js WASM (web), SQLite (native)' },
          { label: 'Data Persistence', value: 'IndexedDB (web), SQLite (native)' },
          { label: 'WebRTC Calls', value: 'Desktop + Web' },
          { label: 'Frame E2EE', value: 'Web only (Insertable Streams)' },
          { label: 'Virtual Backgrounds', value: 'Web only (TensorFlow.js)' },
          { label: 'PiP Mode', value: 'Web (custom), Mobile (native)' },
          { label: 'QR Code Scanner', value: 'Mobile camera, Web text input' },
          { label: 'Native FFI', value: 'Rust → Swift (iOS), JNI planned (Android)' },
          { label: 'Backend Detection', value: 'isTauri() → isReactNative() → WASM' },
          { label: 'Deep Links', value: 'umbra:// + umbra.chat/invite/ (iOS + web)' },
        ]}
      />

      <TechSpec
        title="Test Coverage by Area"
        accentColor="#0EA5E9"
        entries={[
          { label: 'Security / Crypto', value: '95% (WASM + integration)' },
          { label: 'Friends', value: '92% (hooks + flow)' },
          { label: 'Messaging', value: '88% (6 test files)' },
          { label: 'Identity', value: '85% (context + flow)' },
          { label: 'Network', value: '82% (hooks + relay)' },
          { label: 'Groups', value: '78% (hooks + flow)' },
          { label: 'Calling', value: '75% (8 test files)' },
          { label: 'Total Test Files', value: '43+' },
        ]}
      />

      <TechSpec
        title="Known Issues"
        accentColor="#EF4444"
        entries={[
          { label: 'Mesh Group Calls', value: 'Poor scaling beyond 6 peers' },
          { label: 'SFU Group Calls', value: 'Not implemented (7-50 peers)' },
          { label: 'Forward Secrecy', value: 'Static ECDH (no ratcheting yet)' },
          { label: 'Multi-Device Sync', value: 'Single device only' },
          { label: 'Backup / Restore', value: 'Manual export only' },
          { label: 'Push Notifications', value: 'Not yet implemented' },
          { label: 'Community Tests', value: 'Only permissions tested (8%)' },
        ]}
      />
    </View>
  );
}
