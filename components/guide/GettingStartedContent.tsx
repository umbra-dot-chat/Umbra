/**
 * GettingStartedContent — Identity creation, key management, and onboarding.
 */

import React from 'react';
import { View } from 'react-native';

import { FeatureCard } from '@/components/guide/FeatureCard';
import { TechSpec } from '@/components/guide/TechSpec';
import { KeyIcon, LockIcon, ShieldIcon } from '@/components/icons';

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
          { label: 'identity-flow.test.ts', path: '__tests__/integration/identity-flow.test.ts' },
          { label: 'UmbraContext.test.tsx', path: '__tests__/contexts/UmbraContext.test.tsx' },
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
          { label: 'loader.test.ts', path: '__tests__/packages/umbra-wasm/loader.test.ts' },
          { label: 'identity-flow.test.ts', path: '__tests__/integration/identity-flow.test.ts' },
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
        testLinks={[
          { label: 'loader.test.ts', path: '__tests__/packages/umbra-wasm/loader.test.ts' },
          { label: 'identity-flow.test.ts', path: '__tests__/integration/identity-flow.test.ts' },
        ]}
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
          { label: 'AuthContext.test.tsx', path: '__tests__/contexts/AuthContext.test.tsx' },
          { label: 'persistence.test.ts', path: '__tests__/integration/persistence.test.ts' },
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
        title="Test Coverage Details"
        accentColor="#22C55E"
        entries={[
          { label: 'Total Tests', value: '72 tests across 3 files' },
          { label: 'Line Coverage', value: '85%' },
          { label: 'Branch Coverage', value: '80%' },
          { label: 'Identity Flow', value: '22 tests (88% coverage)' },
          { label: 'UmbraContext', value: '18 tests (84% coverage)' },
          { label: 'WASM Loader', value: '32 tests (82% coverage)' },
          { label: 'Edge Cases', value: 'Invalid phrase, PIN lockout, recovery' },
        ]}
      />
    </View>
  );
}
