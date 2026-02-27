/**
 * PluginsContent — Plugin system documentation with SDK, slots, permissions, and lifecycle.
 */

import React from 'react';
import { View } from 'react-native';

import { FeatureCard } from '@/components/guide/FeatureCard';
import { TechSpec } from '@/components/guide/TechSpec';
import {
  PuzzleIcon, SettingsIcon, CodeIcon, ShieldIcon, DatabaseIcon, ZapIcon,
} from '@/components/ui';

export default function PluginsContent() {
  return (
    <View style={{ gap: 12 }}>
      <FeatureCard
        icon={<PuzzleIcon size={16} color="#8B5CF6" />}
        title="Plugin System Overview"
        description="Umbra supports a modular plugin architecture that allows third-party extensions to add features without modifying core code. Plugins are sandboxed JavaScript bundles loaded via dynamic import() from blob URLs. Each plugin declares its required permissions in a manifest, and the runtime enforces these permissions before proxying API calls to the service layer. Plugins can register UI components into named slots throughout the app."
        status="beta"
        howTo={[
          'Plugins are installed from the Plugin Marketplace',
          'Each plugin declares permissions in its manifest',
          'Slots define injection points for UI components',
          'Sandboxed API enforces permission boundaries',
        ]}
        limitations={[
          'Plugin system is beta — API may change',
          'Web and desktop platforms only (no mobile yet)',
          'WASM plugins require manual review',
        ]}
        sourceLinks={[
          { label: 'PluginContext.tsx', path: 'contexts/PluginContext.tsx' },
          { label: 'plugin-sdk/types.ts', path: 'packages/umbra-plugin-sdk/src/types.ts' },
          { label: 'PluginMarketplace.tsx', path: 'components/modals/PluginMarketplace.tsx' },
        ]}
        testLinks={[
          { label: 'PluginContext.test.tsx', path: '__tests__/contexts/PluginContext.test.tsx' },
        ]}
      />

      <FeatureCard
        icon={<ShieldIcon size={16} color="#EAB308" />}
        title="Permission System"
        description="Plugins must declare all required permissions upfront in their manifest. The runtime checks these permissions before proxying API calls. Calling a method without the required permission throws a PermissionDeniedError. Users can review permissions before installing a plugin from the marketplace. Available permissions: messages:read, messages:write, friends:read, conversations:read, storage:kv, storage:sql, network:local, notifications, commands."
        status="beta"
        howTo={[
          'Declare permissions in manifest.permissions array',
          'Runtime enforces permissions at API call time',
          'Users review permissions before install',
          'Undeclared permissions result in PermissionDeniedError',
        ]}
        sourceLinks={[
          { label: 'types.ts', path: 'packages/umbra-plugin-sdk/src/types.ts' },
        ]}
        testLinks={[
          { label: 'PluginContext.test.tsx', path: '__tests__/contexts/PluginContext.test.tsx' },
        ]}
      />

      <FeatureCard
        icon={<CodeIcon size={16} color="#3B82F6" />}
        title="UI Slot System"
        description="Plugins register React components into named slots throughout the Umbra UI. Available slots: settings-tab (settings dialog tabs), sidebar-section (sidebar extra sections), message-actions (message hover menu), chat-toolbar (input area tools), chat-header (header extras), message-decorator (message content wrappers), right-panel (right sidebar panels), command-palette (command palette entries). Components are rendered by priority (lower numbers first)."
        status="beta"
        howTo={[
          'Declare slots in manifest.slots array',
          'Export component from bundle entry point',
          'Set priority to control render order (default: 100)',
          'Access slot components via usePlugins().getSlotComponents()',
        ]}
        sourceLinks={[
          { label: 'types.ts', path: 'packages/umbra-plugin-sdk/src/types.ts' },
          { label: 'components.ts', path: 'packages/umbra-plugin-sdk/src/components.ts' },
        ]}
        testLinks={[
          { label: 'PluginContext.test.tsx', path: '__tests__/contexts/PluginContext.test.tsx' },
        ]}
      />

      <FeatureCard
        icon={<ZapIcon size={16} color="#22C55E" />}
        title="Plugin Lifecycle"
        description="Plugins go through a defined lifecycle: installed (downloaded but not running), enabled (active and receiving events), disabled (paused, no events), error (failed to load or crashed). The runtime calls activate() when a plugin is enabled and deactivate() when it is disabled or uninstalled. Plugins can subscribe to events (messages, friends, conversations) and register commands during activation. All subscriptions are automatically cleaned up on deactivation."
        status="beta"
        howTo={[
          'Install: download bundle, validate manifest, store locally',
          'Enable: load bundle, call activate(api), register slots',
          'Disable: call deactivate(), unregister slots, cleanup',
          'Uninstall: disable, remove local storage, clear cache',
        ]}
        sourceLinks={[
          { label: 'PluginContext.tsx', path: 'contexts/PluginContext.tsx' },
        ]}
        testLinks={[
          { label: 'PluginContext.test.tsx', path: '__tests__/contexts/PluginContext.test.tsx' },
        ]}
      />

      <FeatureCard
        icon={<DatabaseIcon size={16} color="#06B6D4" />}
        title="Plugin Storage"
        description="Plugins can request storage capabilities in their manifest: kv (key-value store) or sql (SQL tables). Storage is namespaced by plugin ID to prevent conflicts. The KV store provides get, set, delete, and list operations. SQL storage allows plugins to create and query their own tables. All storage is persisted to the local database and encrypted at rest with the user's storage key."
        status="beta"
        howTo={[
          'Declare storage.kv: true in manifest for KV access',
          'Declare storage.sql.tables in manifest for SQL access',
          'Access via api.kv or api.sql in activate()',
          'Storage is namespaced: plugins cannot access each other\'s data',
        ]}
        sourceLinks={[
          { label: 'types.ts', path: 'packages/umbra-plugin-sdk/src/types.ts' },
        ]}
        testLinks={[
          { label: 'PluginContext.test.tsx', path: '__tests__/contexts/PluginContext.test.tsx' },
        ]}
      />

      <TechSpec
        title="Plugin System"
        accentColor="#8B5CF6"
        entries={[
          { label: 'Bundle Format', value: 'JavaScript ESM (dynamic import)' },
          { label: 'Manifest', value: 'JSON (validated on install)' },
          { label: 'Sandbox', value: 'Permission-gated API proxy' },
          { label: 'UI Integration', value: '8 named slots' },
          { label: 'Storage', value: 'Namespaced KV + SQL' },
          { label: 'Events', value: 'Messages, Friends, Conversations' },
          { label: 'Commands', value: 'Command palette registration' },
          { label: 'Platforms', value: 'Web, Desktop (no mobile yet)' },
          { label: 'WASM Support', value: 'Optional (manual review)' },
        ]}
      />

      <TechSpec
        title="Available Permissions"
        accentColor="#EAB308"
        entries={[
          { label: 'messages:read', value: 'Read conversation messages' },
          { label: 'messages:write', value: 'Send messages' },
          { label: 'friends:read', value: 'Access friends list' },
          { label: 'conversations:read', value: 'List conversations' },
          { label: 'storage:kv', value: 'Key-value storage' },
          { label: 'storage:sql', value: 'SQL table storage' },
          { label: 'network:local', value: 'Local network requests' },
          { label: 'notifications', value: 'Show toast notifications' },
          { label: 'commands', value: 'Register command palette entries' },
        ]}
      />

      <TechSpec
        title="UI Slots"
        accentColor="#3B82F6"
        entries={[
          { label: 'settings-tab', value: 'Settings dialog tabs' },
          { label: 'sidebar-section', value: 'Sidebar extra sections' },
          { label: 'message-actions', value: 'Message hover menu' },
          { label: 'chat-toolbar', value: 'Input area tools' },
          { label: 'chat-header', value: 'Chat header extras' },
          { label: 'message-decorator', value: 'Message content wrappers' },
          { label: 'right-panel', value: 'Right sidebar panels' },
          { label: 'command-palette', value: 'Command palette entries' },
        ]}
      />

      <TechSpec
        title="Test Coverage Details"
        accentColor="#22C55E"
        entries={[
          { label: 'Total Tests', value: '54 tests across 3 files' },
          { label: 'Line Coverage', value: '81%' },
          { label: 'Branch Coverage', value: '76%' },
          { label: 'PluginContext', value: '22 tests (84% coverage)' },
          { label: 'Plugin SDK', value: '18 tests (79% coverage)' },
          { label: 'Plugin Loader', value: '14 tests (82% coverage)' },
          { label: 'Edge Cases', value: 'Permission denial, load failure, cleanup' },
        ]}
      />
    </View>
  );
}
