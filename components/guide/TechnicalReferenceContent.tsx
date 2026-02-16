/**
 * TechnicalReferenceContent — Architecture, protocols, algorithms, and specs.
 * Covers umbra-core, the Rust/TypeScript split, WASM/Tauri integration,
 * SQLite, cryptography, networking, and code organization.
 */

import React from 'react';
import { View, Pressable, Linking } from 'react-native';
import { Text, useTheme } from '@coexist/wisp-react-native';

import { FeatureCard } from '@/components/guide/FeatureCard';
import { TechSpec } from '@/components/guide/TechSpec';
import {
  ExternalLinkIcon, NetworkIcon, CodeIcon, ServerIcon, DatabaseIcon,
  ZapIcon, GlobeIcon, PuzzleIcon, SettingsIcon, KeyIcon, LockIcon, ShieldIcon,
} from '@/components/icons';

const REPO_BASE = 'https://github.com/InfamousVague/Umbra/blob/main';

function SourceLink({ label, path }: { label: string; path: string }) {
  const { theme } = useTheme();

  const openLink = () => {
    Linking.openURL(`${REPO_BASE}/${path}`).catch(() => {});
  };

  return (
    <Pressable
      onPress={openLink}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: theme.colors.background.raised,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: theme.colors.border.subtle,
        cursor: 'pointer',
      }}
    >
      <ExternalLinkIcon size={10} color={theme.colors.status.info} />
      <Text
        style={{
          fontSize: 11,
          color: theme.colors.status.info,
          fontFamily: 'monospace',
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function SectionHeader({ title, color }: { title: string; color: string }) {
  const { theme, mode } = useTheme();
  const isDark = mode === 'dark';

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 8,
        marginBottom: 4,
      }}
    >
      <View style={{ width: 4, height: 20, backgroundColor: color, borderRadius: 2 }} />
      <Text
        style={{
          fontSize: 14,
          fontWeight: '700',
          color: theme.colors.text.primary,
          letterSpacing: 0.3,
        }}
      >
        {title}
      </Text>
    </View>
  );
}

export default function TechnicalReferenceContent() {
  const { theme, mode } = useTheme();
  const tc = theme.colors;
  const isDark = mode === 'dark';

  return (
    <View style={{ gap: 12 }}>
      {/* Quick links */}
      <View
        style={{
          backgroundColor: isDark ? '#18181B' : tc.background.sunken,
          borderRadius: 10,
          padding: 14,
          borderWidth: 1,
          borderColor: isDark ? '#27272A' : tc.border.subtle,
        }}
      >
        <Text
          style={{
            fontSize: 12,
            fontWeight: '600',
            color: tc.text.muted,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: 8,
          }}
        >
          Source Code Reference
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          <SourceLink label="umbra-core/lib.rs" path="packages/umbra-core/src/lib.rs" />
          <SourceLink label="ffi/wasm.rs" path="packages/umbra-core/src/ffi/wasm.rs" />
          <SourceLink label="crypto/mod.rs" path="packages/umbra-core/src/crypto/mod.rs" />
          <SourceLink label="storage/database.rs" path="packages/umbra-core/src/storage/database.rs" />
          <SourceLink label="network/mod.rs" path="packages/umbra-core/src/network/mod.rs" />
          <SourceLink label="messaging/mod.rs" path="packages/umbra-core/src/messaging/mod.rs" />
          <SourceLink label="service.ts" path="packages/umbra-service/src/service.ts" />
          <SourceLink label="loader.ts" path="packages/umbra-wasm/loader.ts" />
          <SourceLink label="sql-bridge.ts" path="packages/umbra-wasm/sql-bridge.ts" />
        </View>
      </View>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <SectionHeader title="Rust Core (umbra-core)" color="#F97316" />

      <FeatureCard
        icon={<CodeIcon size={16} color="#F97316" />}
        title="umbra-core — The Rust Engine"
        description="umbra-core is a cross-platform Rust library that contains all cryptographic operations, identity management, peer-to-peer networking, and data storage. It compiles to multiple targets: WebAssembly for browsers, native binaries for desktop (via Tauri), and static/dynamic libraries for iOS and Android. The entire security-critical codebase lives here — TypeScript never touches private keys or plaintext messages."
        status="working"
        howTo={[
          'Build targets: wasm32-unknown-unknown, x86_64, aarch64',
          'Entry point: src/lib.rs with UmbraCore singleton',
          'Feature flags: "wasm" for browser, "native" for desktop/mobile',
          'All crypto uses audited Rust crates (dalek, aes-gcm, hkdf)',
          'Keys are zeroized on drop (ZeroizeOnDrop trait)',
        ]}
        sourceLinks={[
          { label: 'lib.rs', path: 'packages/umbra-core/src/lib.rs' },
          { label: 'Cargo.toml', path: 'packages/umbra-core/Cargo.toml' },
        ]}
      />

      <FeatureCard
        icon={<PuzzleIcon size={16} color="#8B5CF6" />}
        title="Rust Module Structure"
        description="umbra-core is organized into domain modules: crypto/ (Ed25519, X25519, AES-GCM, HKDF), identity/ (DID generation, BIP39 recovery, profiles), storage/ (SQLite wrapper, secure keystore), network/ (libp2p, WebRTC, relay client), friends/ (friend requests, blocking), messaging/ (E2E encryption, conversations), discovery/ (DHT, connection info), and ffi/ (WASM bindings, C API, JNI). Each module is self-contained with clear boundaries."
        status="working"
        howTo={[
          'crypto/ — All cryptographic primitives (4000+ lines)',
          'identity/ — Identity creation, recovery, DIDs (400+ lines)',
          'storage/ — Database, keystore, schema (4000+ lines)',
          'network/ — P2P networking, WebRTC (3000+ lines)',
          'messaging/ — Message encryption (1200+ lines)',
          'friends/ — Friend management (1100+ lines)',
          'ffi/wasm.rs — JavaScript bindings (4000+ lines)',
        ]}
        sourceLinks={[
          { label: 'crypto/mod.rs', path: 'packages/umbra-core/src/crypto/mod.rs' },
          { label: 'identity/mod.rs', path: 'packages/umbra-core/src/identity/mod.rs' },
          { label: 'storage/mod.rs', path: 'packages/umbra-core/src/storage/mod.rs' },
          { label: 'network/mod.rs', path: 'packages/umbra-core/src/network/mod.rs' },
        ]}
      />

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <SectionHeader title="Rust vs TypeScript Split" color="#3B82F6" />

      <FeatureCard
        icon={<ShieldIcon size={16} color="#22C55E" />}
        title="What Runs in Rust"
        description="All security-critical operations run in Rust, never in JavaScript. This includes: key generation and derivation (Ed25519, X25519, HKDF), message encryption/decryption (AES-256-GCM), digital signatures (Ed25519), identity management (BIP39 mnemonics, DID creation), database operations (SQLite queries, encrypted storage), and P2P networking (libp2p swarm, WebRTC data channels). Rust code runs either as native binary (desktop) or as WASM in the browser."
        status="working"
        howTo={[
          'Key generation: Rust generates from OS CSPRNG',
          'Encryption: Rust performs X25519 ECDH + AES-GCM',
          'Signatures: Rust signs with Ed25519 private key',
          'Storage: Rust executes all SQL queries',
          'Networking: Rust manages libp2p swarm',
          'Keys NEVER exposed to JavaScript',
        ]}
        sourceLinks={[
          { label: 'encryption.rs', path: 'packages/umbra-core/src/crypto/encryption.rs' },
          { label: 'keys.rs', path: 'packages/umbra-core/src/crypto/keys.rs' },
          { label: 'signing.rs', path: 'packages/umbra-core/src/crypto/signing.rs' },
        ]}
      />

      <FeatureCard
        icon={<GlobeIcon size={16} color="#3B82F6" />}
        title="What Runs in TypeScript"
        description="TypeScript handles the UI layer and orchestration: React Native components, state management, event handling, and API calls to the Rust backend. The @umbra/service package provides a high-level TypeScript API that wraps WASM/Tauri calls. TypeScript receives encrypted payloads and passes them to Rust for decryption — it never sees plaintext. The UI layer also handles WebRTC DOM APIs (getUserMedia, RTCPeerConnection) which WASM cannot directly access."
        status="working"
        howTo={[
          'React Native UI components (Expo Router)',
          'State management (React Context, hooks)',
          'Event subscriptions (EventBridge → React)',
          'WebRTC media (getUserMedia, video elements)',
          'IndexedDB persistence (sql.js ↔ browser storage)',
          'JSON serialization between JS and Rust',
        ]}
        sourceLinks={[
          { label: 'service.ts', path: 'packages/umbra-service/src/service.ts' },
          { label: 'UmbraContext.tsx', path: 'contexts/UmbraContext.tsx' },
          { label: 'useMessages.ts', path: 'hooks/useMessages.ts' },
        ]}
      />

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <SectionHeader title="WASM & Browser Integration" color="#22C55E" />

      <FeatureCard
        icon={<CodeIcon size={16} color="#22C55E" />}
        title="WASM Compilation (wasm-bindgen)"
        description="umbra-core compiles to WebAssembly using wasm-pack and wasm-bindgen. The ffi/wasm.rs file (4000+ lines) exports functions to JavaScript with #[wasm_bindgen] annotations. Functions like umbra_wasm_identity_create() return JSON strings that TypeScript parses. Async Rust functions become JavaScript Promises via wasm-bindgen-futures. The WASM module is loaded once on app initialization and cached in memory."
        status="working"
        howTo={[
          'Build: wasm-pack build --target web',
          'Output: umbra_core.wasm + umbra_core.js glue',
          '#[wasm_bindgen] exports functions to JS',
          'Async functions → Promises via wasm-bindgen-futures',
          'JSON for complex types (structs → serde_json)',
          'Single-threaded: uses SendWrapper for !Send types',
        ]}
        sourceLinks={[
          { label: 'wasm.rs', path: 'packages/umbra-core/src/ffi/wasm.rs' },
          { label: 'loader.ts', path: 'packages/umbra-wasm/loader.ts' },
        ]}
      />

      <FeatureCard
        icon={<ZapIcon size={16} color="#EAB308" />}
        title="WASM ↔ JavaScript Bridge"
        description="The loader.ts file initializes the WASM module and creates the UmbraWasmModule interface. All umbra_wasm_* functions are wrapped with proper error handling and JSON parsing. The event-bridge.ts connects Rust async events to JavaScript callbacks — when Rust emits an event (new message, friend request), it calls a registered callback that dispatches to React. The bridge handles snake_case ↔ camelCase conversion automatically."
        status="working"
        howTo={[
          'initUmbraWasm() loads .wasm file and sql.js',
          'UmbraWasmModule interface: all exported functions',
          'Event callbacks registered via set_event_callback()',
          'Events dispatched to EventBridge singleton',
          'React hooks subscribe: useEffect(() => bridge.on(...))',
          'Unsubscribe on cleanup to prevent memory leaks',
        ]}
        sourceLinks={[
          { label: 'loader.ts', path: 'packages/umbra-wasm/loader.ts' },
          { label: 'event-bridge.ts', path: 'packages/umbra-wasm/event-bridge.ts' },
        ]}
      />

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <SectionHeader title="SQLite & Data Persistence" color="#EC4899" />

      <FeatureCard
        icon={<DatabaseIcon size={16} color="#EC4899" />}
        title="sql.js — SQLite in the Browser"
        description="Browsers cannot access native SQLite, so Umbra uses sql.js — the SQLite C library compiled to WebAssembly. sql.js runs an in-memory SQLite database entirely in the browser tab. The sql-bridge.ts file exposes database functions on globalThis.__umbra_sql so Rust WASM can execute SQL queries. The bridge supports exec(), run(), get(), all(), and changes(). This gives us a full relational database with zero server dependency."
        status="working"
        howTo={[
          'sql.js loaded alongside umbra_core.wasm',
          'Creates in-memory SQLite database',
          'Rust calls globalThis.__umbra_sql.exec(sql)',
          'Supports parameters, transactions, migrations',
          'Same schema as native SQLite (rusqlite)',
          '~1MB WASM file for sql.js runtime',
        ]}
        sourceLinks={[
          { label: 'sql-bridge.ts', path: 'packages/umbra-wasm/sql-bridge.ts' },
          { label: 'wasm_database.rs', path: 'packages/umbra-core/src/storage/wasm_database.rs' },
        ]}
      />

      <FeatureCard
        icon={<DatabaseIcon size={16} color="#06B6D4" />}
        title="IndexedDB Persistence"
        description="sql.js databases are in-memory and lost on page refresh. To persist data, Umbra serializes the entire SQLite database to a Uint8Array and stores it in IndexedDB. Each identity (DID) gets its own IndexedDB database named 'umbra-db-{did}'. On app load, the database is restored from IndexedDB. Writes are persisted asynchronously (debounced) to avoid blocking the UI. This provides durable, offline-capable storage."
        status="working"
        howTo={[
          'Database serialized: db.export() → Uint8Array',
          'Stored in IndexedDB: "umbra-db-{did}"',
          'Restore on init: new SQL.Database(savedData)',
          'Persist after writes (debounced 500ms)',
          'Multiple identities = multiple IndexedDB databases',
          'Data survives browser restarts, clearing cache',
        ]}
        sourceLinks={[
          { label: 'indexed-db.ts', path: 'packages/umbra-wasm/indexed-db.ts' },
          { label: 'sql-bridge.ts', path: 'packages/umbra-wasm/sql-bridge.ts' },
        ]}
      />

      <FeatureCard
        icon={<ServerIcon size={16} color="#F97316" />}
        title="Native SQLite (Desktop)"
        description="On desktop (Tauri), Umbra uses rusqlite — native SQLite bindings for Rust. The database is stored as a file in the app data directory (~/.umbra/umbra.db on macOS/Linux, %APPDATA%\\Umbra on Windows). Native SQLite is faster and supports more features than sql.js, including full-text search and larger databases. The storage/database.rs wrapper provides the same API for both WASM and native targets."
        status="working"
        howTo={[
          'rusqlite crate: native SQLite bindings',
          'Database file: ~/.umbra/umbra.db',
          'Connection pool: Arc<Mutex<Connection>>',
          'Same schema.rs for both platforms',
          'Migrations run on first open',
          'No IndexedDB needed — direct file I/O',
        ]}
        sourceLinks={[
          { label: 'database.rs', path: 'packages/umbra-core/src/storage/database.rs' },
          { label: 'schema.rs', path: 'packages/umbra-core/src/storage/schema.rs' },
        ]}
      />

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <SectionHeader title="Cryptography Module" color="#6366F1" />

      <FeatureCard
        icon={<KeyIcon size={16} color="#6366F1" />}
        title="Key Management"
        description="Each identity has two keypairs: a signing keypair (Ed25519) for authentication and signatures, and an encryption keypair (X25519) for key exchange. Both are deterministically derived from a 32-byte master seed using HKDF-SHA256 with domain separation ('umbra-signing-key-v1', 'umbra-encryption-key-v1'). The master seed is derived from a BIP39 mnemonic (24 words) via PBKDF2-HMAC-SHA512. Keys implement ZeroizeOnDrop to clear memory on destruction."
        status="working"
        howTo={[
          'BIP39 mnemonic → PBKDF2 → 64-byte seed',
          'Seed → HKDF → signing key + encryption key',
          'Ed25519: 32-byte private, 32-byte public',
          'X25519: 32-byte private, 32-byte public',
          'DID: did:key:z6Mk{base58(0xed01 || pubkey)}',
          'Keys zeroized on drop (secure memory)',
        ]}
        sourceLinks={[
          { label: 'keys.rs', path: 'packages/umbra-core/src/crypto/keys.rs' },
          { label: 'kdf.rs', path: 'packages/umbra-core/src/crypto/kdf.rs' },
        ]}
      />

      <FeatureCard
        icon={<LockIcon size={16} color="#22C55E" />}
        title="Message Encryption"
        description="Messages are encrypted using X25519 ECDH + HKDF + AES-256-GCM. The sender computes a shared secret from their private key and the recipient's public key (Diffie-Hellman). The shared secret is expanded via HKDF with a conversation-specific salt. Each message gets a unique 96-bit random nonce. AES-256-GCM provides authenticated encryption — tampering is detected. Additional Authenticated Data (AAD) binds the ciphertext to sender, recipient, and timestamp."
        status="working"
        howTo={[
          '1. X25519 ECDH: sender_priv × recipient_pub → shared',
          '2. HKDF-SHA256: shared + salt → encryption_key',
          '3. Generate random 96-bit nonce',
          '4. AES-256-GCM encrypt with AAD',
          '5. Output: nonce || ciphertext || auth_tag',
          'AAD format: {sender_did}|{recipient_did}|{timestamp}',
        ]}
        sourceLinks={[
          { label: 'encryption.rs', path: 'packages/umbra-core/src/crypto/encryption.rs' },
        ]}
      />

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <SectionHeader title="Networking & P2P" color="#06B6D4" />

      <FeatureCard
        icon={<NetworkIcon size={16} color="#06B6D4" />}
        title="libp2p Network Stack"
        description="Umbra uses libp2p for peer-to-peer networking. On native platforms, it supports TCP, QUIC, and DNS transports. On web, it uses WebSocket and WebRTC. The network layer includes: Noise protocol (encrypted handshake), Yamux (stream multiplexing), Kademlia DHT (peer discovery), Identify (peer info exchange), and custom Umbra protocols for friends, messaging, and presence. The event loop handles connection lifecycle and message routing."
        status="working"
        howTo={[
          'Native: TCP/QUIC/DNS transports',
          'Web: WebSocket/WebRTC transports',
          'Noise: encrypted channel setup',
          'Kademlia: DID → PeerId + addresses',
          'Protocols: /umbra/friends/1.0.0, /umbra/messaging/1.0.0',
          'Event loop polls swarm for incoming events',
        ]}
        sourceLinks={[
          { label: 'network/mod.rs', path: 'packages/umbra-core/src/network/mod.rs' },
          { label: 'event_loop.rs', path: 'packages/umbra-core/src/network/event_loop.rs' },
          { label: 'protocols.rs', path: 'packages/umbra-core/src/network/protocols.rs' },
        ]}
      />

      <FeatureCard
        icon={<GlobeIcon size={16} color="#8B5CF6" />}
        title="WebRTC (Browser P2P)"
        description="In browsers, direct peer connections use WebRTC Data Channels. The webrtc_transport.rs module handles connection setup: generating SDP offers/answers, exchanging ICE candidates, and establishing encrypted data channels. Signaling happens via the relay server — peers exchange connection info, then connect directly. Once connected, messages flow peer-to-peer without relay involvement. This enables low-latency messaging and calling."
        status="working"
        howTo={[
          'Offerer: createOffer() → SDP offer + ICE candidates',
          'Share offer via relay (QR code, link)',
          'Answerer: acceptOffer() → SDP answer + ICE candidates',
          'Offerer: completeHandshake() with answer',
          'Data channel established → direct P2P',
          'Falls back to relay if P2P fails (NAT issues)',
        ]}
        sourceLinks={[
          { label: 'webrtc_transport.rs', path: 'packages/umbra-core/src/network/webrtc_transport.rs' },
          { label: 'relay_client.rs', path: 'packages/umbra-core/src/network/relay_client.rs' },
        ]}
      />

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <SectionHeader title="Service Layer (TypeScript)" color="#3B82F6" />

      <FeatureCard
        icon={<NetworkIcon size={16} color="#3B82F6" />}
        title="@umbra/service Package"
        description="The @umbra/service package provides a unified TypeScript API for all platforms. It wraps WASM calls (web) and Tauri IPC (desktop) behind a single UmbraService class. Methods handle JSON serialization, snake_case ↔ camelCase conversion, and error normalization. The service is a singleton initialized once on app start. Event subscriptions allow React components to react to incoming messages, friend requests, etc."
        status="working"
        howTo={[
          'import { UmbraService } from "@umbra/service"',
          'await UmbraService.initialize()',
          'UmbraService.instance.createIdentity("Alice")',
          'UmbraService.instance.sendMessage(did, content)',
          'UmbraService.instance.onMessageEvent(callback)',
          'Same API on web and desktop',
        ]}
        sourceLinks={[
          { label: 'service.ts', path: 'packages/umbra-service/src/service.ts' },
          { label: 'types.ts', path: 'packages/umbra-service/src/types.ts' },
          { label: 'index.ts', path: 'packages/umbra-service/src/index.ts' },
        ]}
      />

      <FeatureCard
        icon={<SettingsIcon size={16} color="#06B6D4" />}
        title="Backend Detection"
        description="The loader automatically detects which backend to use based on the runtime environment. It checks for window.__TAURI_INTERNALS__ to determine if running in Tauri. If present, it loads the Tauri IPC adapter (tauri-backend.ts). Otherwise, it loads the WASM module and initializes sql.js. This abstraction allows the same TypeScript code to run on web and desktop without changes."
        status="working"
        howTo={[
          'Detection in initUmbraWasm() in loader.ts',
          'Tauri: window.__TAURI_INTERNALS__ present',
          'Web: loads WASM + sql.js + IndexedDB',
          'Desktop: loads Tauri IPC adapter',
          'Both return UmbraWasmModule interface',
        ]}
        sourceLinks={[
          { label: 'loader.ts', path: 'packages/umbra-wasm/loader.ts' },
          { label: 'tauri-backend.ts', path: 'packages/umbra-wasm/tauri-backend.ts' },
        ]}
      />

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <SectionHeader title="Technical Specifications" color="#6366F1" />

      <TechSpec
        title="umbra-core Module Sizes"
        accentColor="#F97316"
        entries={[
          { label: 'ffi/wasm.rs', value: '4015 lines — JS bindings' },
          { label: 'storage/database.rs', value: '2102 lines — SQLite wrapper' },
          { label: 'messaging/mod.rs', value: '1247 lines — E2E messaging' },
          { label: 'storage/wasm_database.rs', value: '1116 lines — sql.js bridge' },
          { label: 'friends/mod.rs', value: '1094 lines — Friend management' },
          { label: 'network/webrtc_transport.rs', value: '909 lines — WebRTC' },
          { label: 'network/mod.rs', value: '859 lines — libp2p swarm' },
          { label: 'network/event_loop.rs', value: '854 lines — Async events' },
          { label: 'discovery/mod.rs', value: '684 lines — Peer discovery' },
          { label: 'storage/secure_store.rs', value: '635 lines — Keystore' },
        ]}
      />

      <TechSpec
        title="Cryptographic Algorithms"
        accentColor="#6366F1"
        entries={[
          { label: 'Signing', value: 'Ed25519 (ed25519-dalek)' },
          { label: 'Key Exchange', value: 'X25519 ECDH (x25519-dalek)' },
          { label: 'Symmetric Cipher', value: 'AES-256-GCM (aes-gcm)' },
          { label: 'Key Derivation', value: 'HKDF-SHA256 (hkdf)' },
          { label: 'Seed Derivation', value: 'PBKDF2-HMAC-SHA512 (2048 rounds)' },
          { label: 'Mnemonic', value: 'BIP39 (24 words, 256-bit entropy)' },
          { label: 'Hash Function', value: 'SHA-256 / SHA-512 (sha2)' },
          { label: 'CSPRNG', value: 'getrandom (OS entropy)' },
          { label: 'Nonce Size', value: '96 bits (12 bytes), unique per message' },
        ]}
      />

      <TechSpec
        title="Rust vs TypeScript Split"
        accentColor="#22C55E"
        entries={[
          { label: 'Rust', value: 'Keys, crypto, storage, P2P, signatures' },
          { label: 'TypeScript', value: 'UI, state, events, media, IndexedDB' },
          { label: 'Boundary', value: 'ffi/wasm.rs (#[wasm_bindgen])' },
          { label: 'Data Format', value: 'JSON (serde ↔ JSON.parse)' },
          { label: 'Async', value: 'Promises (wasm-bindgen-futures)' },
          { label: 'Events', value: 'Callbacks (thread_local! in WASM)' },
          { label: 'Security', value: 'Private keys never in JS heap' },
        ]}
      />

      <TechSpec
        title="SQLite Configuration"
        accentColor="#EC4899"
        entries={[
          { label: 'Web Engine', value: 'sql.js (SQLite 3.x WASM)' },
          { label: 'Desktop Engine', value: 'rusqlite (native SQLite)' },
          { label: 'Web Persistence', value: 'IndexedDB (umbra-db-{did})' },
          { label: 'Desktop Persistence', value: 'File (~/.umbra/umbra.db)' },
          { label: 'Schema Version', value: '2 (with migrations)' },
          { label: 'Tables', value: '10 (friends, messages, groups, etc.)' },
          { label: 'Encryption', value: 'HKDF-derived storage key' },
          { label: 'sql.js Size', value: '~1MB WASM runtime' },
        ]}
      />

      <TechSpec
        title="Database Tables"
        accentColor="#8B5CF6"
        entries={[
          { label: 'friends', value: 'Friend list with public keys' },
          { label: 'friend_requests', value: 'Pending requests' },
          { label: 'blocked_users', value: 'Block list' },
          { label: 'conversations', value: 'DM and group metadata' },
          { label: 'messages', value: 'Encrypted message content' },
          { label: 'groups', value: 'Group info and settings' },
          { label: 'group_members', value: 'Membership + roles' },
          { label: 'group_keys', value: 'Rotating encryption keys' },
          { label: 'reactions', value: 'Message reactions' },
          { label: 'settings', value: 'User preferences' },
        ]}
      />

      <TechSpec
        title="WASM Build Configuration"
        accentColor="#06B6D4"
        entries={[
          { label: 'Target', value: 'wasm32-unknown-unknown' },
          { label: 'Build Tool', value: 'wasm-pack + Cargo' },
          { label: 'Bindings', value: 'wasm-bindgen 0.2.x' },
          { label: 'Futures', value: 'wasm-bindgen-futures' },
          { label: 'Web APIs', value: 'web-sys, js-sys' },
          { label: 'Random', value: 'getrandom with js feature' },
          { label: 'Threading', value: 'Single-threaded (SendWrapper)' },
          { label: 'Output', value: 'umbra_core.wasm + .js glue' },
        ]}
      />

      <TechSpec
        title="Platform Architecture"
        accentColor="#3B82F6"
        entries={[
          { label: 'Web Frontend', value: 'React Native Web + Expo' },
          { label: 'Web Backend', value: 'Rust WASM (wasm-bindgen)' },
          { label: 'Web Database', value: 'sql.js + IndexedDB' },
          { label: 'Desktop Frontend', value: 'React Native + Tauri' },
          { label: 'Desktop Backend', value: 'Native Rust (Tauri IPC)' },
          { label: 'Desktop Database', value: 'rusqlite (native file)' },
          { label: 'Relay Server', value: 'Rust (Tokio + Axum)' },
          { label: 'UI Library', value: 'Wisp React Native' },
        ]}
      />
    </View>
  );
}
