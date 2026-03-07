/**
 * GettingStartedContent — Identity creation, key management, and onboarding.
 */

import React from 'react';
import { View } from 'react-native';

import { FeatureCard } from '@/components/guide/FeatureCard';
import { TechSpec } from '@/components/guide/TechSpec';
import { KeyIcon, LockIcon, ShieldIcon, ExternalLinkIcon, GlobeIcon } from '@/components/ui';

export default function GettingStartedContent() {
  return (
    <View style={{ gap: 12 }}>
      <FeatureCard
        icon={<KeyIcon size={16} color="#22C55E" />}
        title="Create Identity"
        description="Generate a new decentralized identity (DID) with a unique cryptographic key pair. Your identity uses the did:key method — your Ed25519 public key is encoded with multicodec prefix 0xed01, base58btc-encoded, and prefixed with 'z' to form a W3C-compliant self-sovereign identifier. No central server, email, or phone number is involved. Your DID is your permanent address on the network and is cryptographically verifiable by anyone."
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
          'No multi-device sync yet — one device per identity',
        ]}
        sourceLinks={[
          { label: 'did.rs', path: 'packages/umbra-core/src/identity/did.rs' },
          { label: 'keys.rs', path: 'packages/umbra-core/src/crypto/keys.rs' },
          { label: 'CreateWalletFlow.tsx', path: 'components/auth/CreateWalletFlow.tsx' },
        ]}
        testLinks={[
          { label: 'umbra-context.test.tsx', path: '__tests__/identity/umbra-context.test.tsx' },
          { label: 'auth-screen.spec.ts', path: '__tests__/e2e/identity/account-creation/auth-screen.spec.ts' },
          { label: 'display-name.spec.ts', path: '__tests__/e2e/identity/account-creation/display-name.spec.ts' },
          { label: 'completion.spec.ts', path: '__tests__/e2e/identity/account-creation/completion.spec.ts' },
        ]}
      />

      <FeatureCard
        icon={<ShieldIcon size={16} color="#8B5CF6" />}
        title="Recovery Phrase"
        description="A 24-word BIP39 mnemonic generated from 256 bits of OS-level cryptographic randomness (CSPRNG). The entropy is checksummed with 8 bits of SHA-256, then split into 24 eleven-bit segments mapped to the BIP39 English wordlist (2048 words). This phrase deterministically generates your master seed via PBKDF2-HMAC-SHA512 with 2048 iterations using the mnemonic as password and 'mnemonic' as salt. The first 32 bytes of the 64-byte output become your master seed — from which all cryptographic keys are derived."
        status="working"
        howTo={[
          'Write down all 24 words in exact order',
          'Store them in a secure, offline location',
          'Never share your recovery phrase with anyone',
          'Verify by writing the phrase down a second time',
        ]}
        limitations={[
          'If lost, your identity cannot be recovered',
          'Anyone with your phrase can impersonate you',
          'No cloud backup — physical security only',
        ]}
        sourceLinks={[
          { label: 'recovery.rs', path: 'packages/umbra-core/src/identity/recovery.rs' },
          { label: 'kdf.rs', path: 'packages/umbra-core/src/crypto/kdf.rs' },
          { label: 'ImportWalletFlow.tsx', path: 'components/auth/ImportWalletFlow.tsx' },
        ]}
        testLinks={[
          { label: 'recovery-phrase.spec.ts', path: '__tests__/e2e/identity/account-creation/recovery-phrase.spec.ts' },
          { label: 'confirm-backup.spec.ts', path: '__tests__/e2e/identity/account-creation/confirm-backup.spec.ts' },
          { label: 'account-import.spec.ts', path: '__tests__/e2e/identity/account-import.spec.ts' },
        ]}
      />

      <FeatureCard
        icon={<KeyIcon size={16} color="#3B82F6" />}
        title="Derived Key Types"
        description="From your master seed, HKDF-SHA256 derives three purpose-specific keys using unique domain-separation strings. The signing key (Ed25519, info='umbra-signing-key-v1') proves your identity and signs every message envelope. The encryption key (X25519, info='umbra-encryption-key-v1') participates in ECDH key exchanges to establish shared secrets with other users. The storage key (info='umbra-storage-encryption-v1') encrypts your local SQLite database. Domain separation ensures that compromising one key does not compromise the others."
        status="working"
        howTo={[
          'Keys are generated automatically from your recovery phrase',
          'Ed25519 key: identity verification and message signatures',
          'X25519 key: establishing encrypted channels via ECDH',
          'Storage key: encrypting your local database at rest',
        ]}
        sourceLinks={[
          { label: 'kdf.rs', path: 'packages/umbra-core/src/crypto/kdf.rs' },
          { label: 'keys.rs', path: 'packages/umbra-core/src/crypto/keys.rs' },
          { label: 'signing.rs', path: 'packages/umbra-core/src/crypto/signing.rs' },
        ]}
        testLinks={[]}
      />

      <FeatureCard
        icon={<LockIcon size={16} color="#F97316" />}
        title="PIN Lock"
        description="Set a numeric PIN to lock the app without re-entering your full recovery phrase. The PIN is stored locally and verified on each unlock attempt. After 5 consecutive failures, a 30-second cooldown is enforced with a shake animation on incorrect entry. The PIN is a convenience lock — it does not replace your recovery phrase for identity restoration."
        status="working"
        howTo={[
          'Go to Settings',
          'Enable PIN lock',
          'Enter and confirm your desired PIN',
          'PIN is required on each app launch',
        ]}
        limitations={[
          'Biometric unlock not yet available',
          'PIN does not encrypt your recovery phrase',
          'Forgetting PIN requires recovery phrase to reset',
        ]}
        sourceLinks={[
          { label: 'PinLockScreen.tsx', path: 'components/auth/PinLockScreen.tsx' },
          { label: 'AuthContext.tsx', path: 'contexts/AuthContext.tsx' },
          { label: 'secure_store.rs', path: 'packages/umbra-core/src/storage/secure_store.rs' },
        ]}
        testLinks={[
          { label: 'auth-context.test.tsx', path: '__tests__/identity/auth-context.test.tsx' },
          { label: 'pin-lock.spec.ts', path: '__tests__/e2e/identity/pin-lock.spec.ts' },
          { label: 'security-pin.spec.ts', path: '__tests__/e2e/identity/account-creation/security-pin.spec.ts' },
        ]}
      />

      <FeatureCard
        icon={<ExternalLinkIcon size={16} color="#06B6D4" />}
        title="Deep Links & Invites"
        description="Umbra handles deep links for community invites via two URL schemes: umbra://invite/CODE and https://umbra.chat/invite/CODE. When the app receives a URL, the AuthGate component in the root layout parses the path, extracts the invite code, and routes to the invite acceptance screen. If the app is launched from a cold start via a deep link, the URL is captured via Linking.getInitialURL(). If the app is already running, a Linking event listener catches the URL in real-time. Invite codes received before authentication completes are stored as pending invites via usePendingInvite() and consumed after login."
        status="working"
        howTo={[
          'Tap a link like umbra://invite/CODE or umbra.chat/invite/CODE',
          'App opens and navigates to the invite screen',
          'If not logged in, the invite is stored and consumed after auth',
          'Accept to join the community, or dismiss to ignore',
        ]}
        sourceLinks={[
          { label: '_layout.tsx (AuthGate)', path: 'app/_layout.tsx' },
          { label: 'usePendingInvite.ts', path: 'hooks/usePendingInvite.ts' },
          { label: 'invite/[code].tsx', path: 'app/(main)/invite/[code].tsx' },
        ]}
        testLinks={[]}
      />

      <FeatureCard
        icon={<GlobeIcon size={16} color="#8B5CF6" />}
        title="App Loading & Service Initialization"
        description="On launch, the app goes through a multi-step initialization sequence. The root layout loads fonts and the splash screen, then renders the AuthGate component. AuthGate checks for an existing identity in the encrypted local database. If found, it initializes the UmbraService (which connects to the WASM, Tauri, or native FFI backend depending on the platform), establishes the relay WebSocket connection, and loads friends, conversations, and group data. The loading screen shows progress steps as each subsystem comes online. If no identity exists, the onboarding flow (CreateWalletFlow) is presented."
        status="working"
        howTo={[
          'App launch → font loading → splash screen',
          'AuthGate checks for stored identity',
          'If identity exists: initialize service → connect relay → load data',
          'If no identity: show Create or Import wallet flow',
        ]}
        sourceLinks={[
          { label: '_layout.tsx', path: 'app/_layout.tsx' },
          { label: 'AuthContext.tsx', path: 'contexts/AuthContext.tsx' },
          { label: 'UmbraContext.tsx', path: 'contexts/UmbraContext.tsx' },
          { label: 'loader.ts', path: 'packages/umbra-wasm/loader.ts' },
        ]}
        testLinks={[
          { label: 'umbra-context.test.tsx', path: '__tests__/identity/umbra-context.test.tsx' },
          { label: 'loading-splash.spec.ts', path: '__tests__/e2e/identity/loading-splash.spec.ts' },
          { label: 'multi-account.spec.ts', path: '__tests__/e2e/identity/multi-account.spec.ts' },
          { label: 'logout.spec.ts', path: '__tests__/e2e/identity/logout.spec.ts' },
        ]}
      />

      <TechSpec
        title="Identity Cryptography"
        accentColor="#22C55E"
        entries={[
          { label: 'DID Format', value: 'did:key:z... (Ed25519 0xed01)' },
          { label: 'DID Encoding', value: 'Multicodec + Base58btc + z prefix' },
          { label: 'Entropy Source', value: 'OS CSPRNG (256 bits)' },
          { label: 'Mnemonic', value: 'BIP39 (24 words, 2048-word list)' },
          { label: 'Seed Derivation', value: 'PBKDF2-HMAC-SHA512 (2048 iter)' },
          { label: 'Key Derivation', value: 'HKDF-SHA256 (domain separated)' },
          { label: 'Signing Key', value: 'Ed25519 (32-byte seed)' },
          { label: 'Encryption Key', value: 'X25519 (32-byte secret)' },
          { label: 'Storage Key', value: 'AES-256 (32 bytes via HKDF)' },
          { label: 'PIN Security', value: 'Max 5 attempts, 30s cooldown' },
        ]}
      />

      <TechSpec
        title="Deep Links & Initialization"
        accentColor="#06B6D4"
        entries={[
          { label: 'URL Schemes', value: 'umbra:// and https://umbra.chat/' },
          { label: 'Invite Path', value: '/invite/{CODE}' },
          { label: 'Cold Start', value: 'Linking.getInitialURL()' },
          { label: 'Warm Start', value: 'Linking.addEventListener("url")' },
          { label: 'Pending Invites', value: 'Stored pre-auth, consumed post-login' },
          { label: 'Backends', value: 'WASM (web), Tauri (desktop), FFI (mobile)' },
          { label: 'Init Sequence', value: 'Splash → Auth → Service → Relay → Data' },
          { label: 'Identity Storage', value: 'Encrypted SQLite (native) / IndexedDB (web)' },
        ]}
      />

      <TechSpec
        title="Test Coverage Details"
        accentColor="#22C55E"
        entries={[
          { label: 'Unit Tests', value: '65 tests across 2 files' },
          { label: 'auth-context.test.tsx', value: '54 tests (PIN, auth flows, multi-account)' },
          { label: 'umbra-context.test.tsx', value: '11 tests (service init, loading)' },
          { label: 'E2E Playwright', value: '83 tests across 13 spec files' },
          { label: 'Account Creation', value: '35 tests (auth-screen, display-name, username, recovery-phrase, PIN, backup, completion)' },
          { label: 'Account Import', value: '14 tests (restore from recovery phrase)' },
          { label: 'PIN Lock', value: '14 tests (set, unlock, lockout)' },
          { label: 'Multi-Account', value: '9 tests (add, switch accounts)' },
          { label: 'E2E iOS (Detox)', value: '100+ tests across 17 files (full auth flow on native iOS)' },
        ]}
      />
    </View>
  );
}
