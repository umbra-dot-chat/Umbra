/**
 * DataManagementContent — Local storage, persistence, and data lifecycle.
 */

import React from 'react';
import { View } from 'react-native';

import { FeatureCard } from '@/components/guide/FeatureCard';
import { TechSpec } from '@/components/guide/TechSpec';
import { DatabaseIcon, SettingsIcon, ShieldIcon, ZapIcon, DownloadIcon, KeyIcon, AlertTriangleIcon } from '@/components/ui';

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
        testLinks={[]}
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
          { label: 'auth-context.test.tsx', path: '__tests__/identity/auth-context.test.tsx' },
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
        testLinks={[]}
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
          { label: 'umbra-context.test.tsx', path: '__tests__/identity/umbra-context.test.tsx' },
        ]}
      />

      <FeatureCard
        icon={<DownloadIcon size={16} color="#22C55E" />}
        title="Account Backup"
        description="Back up your entire account state — settings, friend list, conversations, groups, and blocked users — to the relay as an encrypted payload. The backup is encrypted with a key derived from your recovery phrase using HKDF-SHA256, so only someone with your 24-word phrase can decrypt it. Backups are compressed, split into 64KB chunks, and sent to your own relay address. This means you can restore your full account on any device just by entering your recovery phrase."
        status="working"
        howTo={[
          'Open Settings and navigate to the Data Management section',
          'Click "Backup Account" to create an encrypted backup',
          'Your data is compressed, encrypted, and uploaded to the relay',
          'A success toast confirms when the backup is complete',
        ]}
        limitations={[
          'Message history is not included (messages are stored on the relay separately)',
          'Backup is overwritten each time — only one backup is kept per account',
          'Requires an active relay connection to upload the backup',
        ]}
        sourceLinks={[
          { label: 'backup.ts', path: 'packages/umbra-service/src/backup.ts' },
          { label: 'kdf.rs', path: 'packages/umbra-core/src/crypto/kdf.rs' },
          { label: 'database.rs', path: 'packages/umbra-core/src/storage/database.rs' },
          { label: 'wasm.rs', path: 'packages/umbra-core/src/ffi/wasm.rs' },
        ]}
        testLinks={[
          { label: 'useBackup.test.ts', path: '__tests__/settings/useBackup.test.ts' },
          { label: 'account-backup.spec.ts', path: '__tests__/e2e/settings/account-backup.spec.ts' },
        ]}
      />

      <FeatureCard
        icon={<KeyIcon size={16} color="#8B5CF6" />}
        title="Account Restore"
        description="When you import your identity on a new device using your recovery phrase, Umbra can automatically restore your full account state from the relay. The same HKDF-derived backup key is recomputed from your phrase, used to decrypt the backup chunks, and the data is imported into your local database. Settings, friends, conversations, groups, and blocked users are all restored without needing to re-add anyone."
        status="working"
        howTo={[
          'Import your account using your 24-word recovery phrase',
          'Connect to the relay — offline messages (including backup) are fetched automatically',
          'If a backup exists, it is decrypted and restored in the background',
          'A notification confirms when restoration is complete',
        ]}
        limitations={[
          'Restore requires the same relay where the backup was stored',
          'If no backup exists on the relay, a "No backup found" message is shown',
          'Conflicting local data is overwritten by the backup (upsert)',
        ]}
        sourceLinks={[
          { label: 'backup.ts', path: 'packages/umbra-service/src/backup.ts' },
          { label: 'useNetwork.ts', path: 'src/hooks/useNetwork.ts' },
          { label: 'wasm.rs', path: 'packages/umbra-core/src/ffi/wasm.rs' },
        ]}
        testLinks={[
          { label: 'useBackup.test.ts', path: '__tests__/settings/useBackup.test.ts' },
          { label: 'account-backup.spec.ts', path: '__tests__/e2e/settings/account-backup.spec.ts' },
        ]}
      />

      <FeatureCard
        icon={<AlertTriangleIcon size={16} color="#F97316" />}
        title="Multi-Instance Detection"
        description="Umbra detects when you have multiple browser tabs running simultaneously and warns you about potential conflicts. Since local data is stored in IndexedDB (which uses a last-write-wins strategy), running two tabs at once can cause data corruption. The first tab to open becomes the primary instance; additional tabs are detected via the BroadcastChannel API and shown a warning banner. On platforms without BroadcastChannel (like React Native), each instance safely assumes it is primary."
        status="working"
        howTo={[
          'Open Umbra in one browser tab — it becomes the primary instance',
          'If you open a second tab, a warning banner appears',
          'Close extra tabs to prevent data conflicts',
          'The primary instance (earliest opened) retains write access',
        ]}
        limitations={[
          'BroadcastChannel only works within the same browser — cross-browser detection is not supported',
          'Playwright tests use isolated contexts, so cross-tab detection tests verify the API shape rather than real cross-tab behavior',
          'React Native has no BroadcastChannel — falls back to single-instance mode',
        ]}
        sourceLinks={[
          { label: 'instance-coordinator.ts', path: 'packages/umbra-service/src/instance-coordinator.ts' },
          { label: 'useInstanceDetection.ts', path: 'src/hooks/useInstanceDetection.ts' },
        ]}
        testLinks={[
          { label: 'useInstanceDetection.test.ts', path: '__tests__/settings/useInstanceDetection.test.ts' },
          { label: 'multi-instance.spec.ts', path: '__tests__/e2e/settings/multi-instance.spec.ts' },
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
        title="Backup Architecture"
        accentColor="#22C55E"
        entries={[
          { label: 'Backup Cipher', value: 'AES-256-GCM' },
          { label: 'Key Derivation', value: 'HKDF-SHA256 (domain: umbra-account-backup-v1)' },
          { label: 'Compression', value: 'DEFLATE (miniz_oxide)' },
          { label: 'Chunk Size', value: '64 KB per relay envelope' },
          { label: 'Transport', value: 'Relay envelopes to own DID' },
          { label: 'Envelope Types', value: 'account_backup_manifest + account_backup_chunk' },
          { label: 'Data Included', value: 'Settings, friends, conversations, groups, blocked users' },
          { label: 'Data Excluded', value: 'Message history (stored on relay separately)' },
          { label: 'Instance Detection', value: 'BroadcastChannel (web) / disabled (React Native)' },
          { label: 'Message Dedup', value: 'INSERT OR IGNORE (SQLite UNIQUE constraint)' },
        ]}
      />

      <FeatureCard
        icon={<DownloadIcon size={16} color="#3B82F6" />}
        title="Account Recovery Details"
        description="Generate a printable, black-and-white PDF containing your account recovery information. The document includes your profile picture, display name, DID, and a QR code. You can optionally include your 24-word recovery phrase for a complete offline backup — designed to be printed and stored in a safe or other secure location."
        status="working"
        howTo={[
          'Open Settings and go to the Account section',
          'Click "Account Recovery Details" below your identity info',
          'Preview the document in the dialog',
          'Toggle "Include Recovery Phrase" if you want the 24 words on the document',
          'Click "Download PDF" to save the file',
        ]}
        limitations={[
          'PDF preview requires a web browser (not available on mobile)',
          'Including the recovery phrase creates a sensitive document — store it securely',
          'Generated entirely client-side — no external network requests are made',
        ]}
        sourceLinks={[
          { label: 'identity-card-pdf.ts', path: 'src/utils/identity-card-pdf.ts' },
          { label: 'IdentityCardDialog.tsx', path: 'src/components/modals/IdentityCardDialog.tsx' },
          { label: 'SettingsDialog.tsx', path: 'src/components/modals/SettingsDialog.tsx' },
        ]}
        testLinks={[
          { label: 'identityCardPdf.test.ts', path: '__tests__/settings/identityCardPdf.test.ts' },
          { label: 'identity-card.spec.ts', path: '__tests__/e2e/settings/identity-card.spec.ts' },
        ]}
      />

      <TechSpec
        title="Test Coverage Details"
        accentColor="#22C55E"
        entries={[
          { label: 'Unit Tests', value: '102 tests across 6 files' },
          { label: 'auth-context.test.tsx', value: '54 tests (clear data, isolation)' },
          { label: 'umbra-context.test.tsx', value: '11 tests (init, restore)' },
          { label: 'useBackup.test.ts', value: '13 tests (backup/restore flow)' },
          { label: 'useInstanceDetection.test.ts', value: '5 tests (multi-tab detection)' },
          { label: 'identityCardPdf.test.ts', value: '8 tests (PDF generation)' },
          { label: 'useStorageManager.test.ts', value: '11 tests (storage management)' },
          { label: 'E2E Playwright', value: '14 tests across 4 spec files' },
          { label: 'account-backup.spec.ts', value: '4 tests' },
          { label: 'data-section.spec.ts', value: '5 tests (export/import)' },
          { label: 'identity-card.spec.ts', value: '3 tests (PDF preview)' },
          { label: 'multi-instance.spec.ts', value: '2 tests (tab detection)' },
        ]}
      />
    </View>
  );
}
