/**
 * DataManagementContent — Local storage, persistence, and data lifecycle.
 */

import React from 'react';
import { View } from 'react-native';

import { FeatureCard } from '@/components/guide/FeatureCard';
import { TechSpec } from '@/components/guide/TechSpec';
import { DatabaseIcon, SettingsIcon, ShieldIcon, ZapIcon } from '@/components/icons';

export default function DataManagementContent() {
  return (
    <View style={{ gap: 12 }}>
      <FeatureCard
        icon={<DatabaseIcon size={16} color="#F59E0B" />}
        title="Local Data Storage"
        description="All your data — friends, conversations, messages, groups — is stored locally in an SQLite database backed by IndexedDB. Data never leaves your device unencrypted. The database uses sql.js (SQLite compiled to WASM) with persistence to IndexedDB for durability across browser sessions. Each write operation triggers an automatic save to ensure data integrity."
        status="working"
        howTo={[
          'Data is saved automatically after every write operation',
          'Each identity has its own isolated IndexedDB store',
          'Reloading the page restores everything from your local database',
          'Database file is keyed by your DID for isolation',
        ]}
        sourceLinks={[
          { label: 'database.rs', path: 'packages/umbra-core/src/storage/database.rs' },
          { label: 'schema.rs', path: 'packages/umbra-core/src/storage/schema.rs' },
          { label: 'mod.rs', path: 'packages/umbra-core/src/storage/mod.rs' },
          { label: 'loader.ts', path: 'packages/umbra-wasm/loader.ts' },
        ]}
        testLinks={[
          { label: 'loader.test.ts', path: '__tests__/packages/umbra-wasm/loader.test.ts' },
          { label: 'persistence.test.ts', path: '__tests__/integration/persistence.test.ts' },
        ]}
      />

      <FeatureCard
        icon={<SettingsIcon size={16} color="#EF4444" />}
        title="Clear Data"
        description="Remove your local data through the Settings dialog. You can clear all data to start fresh. This operation deletes your IndexedDB store, removes all cached keys from memory, and returns you to the onboarding flow. Your identity can be restored from your recovery phrase after clearing."
        status="working"
        howTo={[
          'Open Settings from the sidebar',
          'Scroll to the Data Management section',
          'Use "Clear All Data" to wipe everything and return to onboarding',
          'Confirm the action in the dialog prompt',
        ]}
        limitations={[
          'Clearing data is permanent and cannot be undone',
          'Your identity can be restored from your recovery phrase',
          'Friends will need to re-accept requests after restoration',
        ]}
        sourceLinks={[
          { label: 'SettingsDialog.tsx', path: 'components/modals/SettingsDialog.tsx' },
          { label: 'AuthContext.tsx', path: 'contexts/AuthContext.tsx' },
          { label: 'secure_store.rs', path: 'packages/umbra-core/src/storage/secure_store.rs' },
        ]}
        testLinks={[
          { label: 'AuthContext.test.tsx', path: '__tests__/contexts/AuthContext.test.tsx' },
          { label: 'persistence.test.ts', path: '__tests__/integration/persistence.test.ts' },
        ]}
      />

      <FeatureCard
        icon={<ShieldIcon size={16} color="#8B5CF6" />}
        title="Data Isolation"
        description="Each identity gets its own IndexedDB database, keyed by the DID. Switching identities does not affect another identity's data. This isolation is enforced at the storage layer — each database instance is constructed with a unique namespace derived from the DID, preventing any cross-identity data access or leakage."
        status="working"
        howTo={[
          'Create multiple identities with different recovery phrases',
          'Each identity has completely separate data',
          'Logout and login to switch between identities',
        ]}
        sourceLinks={[
          { label: 'database.rs', path: 'packages/umbra-core/src/storage/database.rs' },
          { label: 'loader.ts', path: 'packages/umbra-wasm/loader.ts' },
          { label: 'AuthContext.tsx', path: 'contexts/AuthContext.tsx' },
        ]}
        testLinks={[
          { label: 'loader.test.ts', path: '__tests__/packages/umbra-wasm/loader.test.ts' },
          { label: 'identity-flow.test.ts', path: '__tests__/integration/identity-flow.test.ts' },
        ]}
      />

      <FeatureCard
        icon={<ZapIcon size={16} color="#06B6D4" />}
        title="What Happens on Refresh"
        description="When you reload the page, Umbra shows a splash screen while restoring your data. The loading sequence is: (1) Initialize WASM module, (2) Load database from IndexedDB, (3) Restore identity from stored keys, (4) Load conversations and friends. Progress is displayed in real-time on the splash screen."
        status="working"
        howTo={[
          'Refresh the page or close and reopen the browser',
          'Splash screen shows loading progress',
          'All data is restored automatically',
          'Connection to relay is re-established',
        ]}
        sourceLinks={[
          { label: 'UmbraContext.tsx', path: 'contexts/UmbraContext.tsx' },
          { label: 'loader.ts', path: 'packages/umbra-wasm/loader.ts' },
          { label: 'SplashScreen.tsx', path: 'components/SplashScreen.tsx' },
        ]}
        testLinks={[
          { label: 'UmbraContext.test.tsx', path: '__tests__/contexts/UmbraContext.test.tsx' },
          { label: 'persistence.test.ts', path: '__tests__/integration/persistence.test.ts' },
        ]}
      />

      <TechSpec
        title="Storage Architecture"
        accentColor="#F59E0B"
        entries={[
          { label: 'Database Engine', value: 'sql.js (SQLite WASM)' },
          { label: 'Persistence Layer', value: 'IndexedDB' },
          { label: 'Isolation', value: 'Per-DID namespace' },
          { label: 'Encryption', value: 'AES-256 (storage key)' },
          { label: 'Auto-Save', value: 'On every write operation' },
          { label: 'Schema Migrations', value: 'Versioned (automatic)' },
        ]}
      />

      <TechSpec
        title="Test Coverage Details"
        accentColor="#22C55E"
        entries={[
          { label: 'Total Tests', value: '38 tests across 3 files' },
          { label: 'Line Coverage', value: '82%' },
          { label: 'Branch Coverage', value: '78%' },
          { label: 'Persistence', value: '14 tests (85% coverage)' },
          { label: 'WASM Loader', value: '18 tests (82% coverage)' },
          { label: 'Auth Context', value: '6 tests (79% coverage)' },
          { label: 'Edge Cases', value: 'Corrupt DB, migration, clear' },
        ]}
      />
    </View>
  );
}
