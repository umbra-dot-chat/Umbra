# Umbra Architecture Guide

This guide explains how the Umbra app is structured, how each service works, and how the Rust backend interfaces with the TypeScript frontend on web and desktop.

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Service Layer (umbra-service)](#2-service-layer-umbra-service)
3. [WASM Integration (umbra-wasm)](#3-wasm-integration-umbra-wasm)
4. [Tauri Desktop Integration](#4-tauri-desktop-integration)
5. [Relay Server](#5-relay-server)
6. [Event System](#6-event-system)
7. [Persistence Layer](#7-persistence-layer)
8. [Code Examples](#8-code-examples)

---

## 1. Architecture Overview

Umbra is a cross-platform end-to-end encrypted messaging app with the following architecture:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React Native / Expo)                      │
│                                                                             │
│  app/              components/            hooks/              services/     │
│  (pages)           (UI components)        (React hooks)       (business)   │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         @umbra/service (TypeScript API)                     │
│                                                                             │
│  UmbraService.createIdentity()    UmbraService.sendMessage()               │
│  UmbraService.getFriends()        UmbraService.onMessageEvent()            │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │
               ┌────────────────────┴────────────────────┐
               ▼                                         ▼
┌──────────────────────────────┐         ┌──────────────────────────────┐
│      WEB (WASM Backend)      │         │   DESKTOP (Tauri Backend)    │
│                              │         │                              │
│  @umbra/wasm                 │         │  src-tauri/                  │
│  ├── loader.ts               │         │  ├── commands/               │
│  ├── sql-bridge.ts           │         │  └── lib.rs                  │
│  └── event-bridge.ts         │         │                              │
│                              │         │  Uses native Rust directly   │
│  umbra_core.wasm             │         │  (no WASM compilation)       │
│  + sql.js (SQLite in browser)│         │                              │
└──────────────────────────────┘         └──────────────────────────────┘
               │                                         │
               └─────────────────────┬───────────────────┘
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         RUST CORE (umbra-core)                              │
│                                                                             │
│  crypto/       identity/      storage/      network/      messaging/       │
│  (Ed25519,     (DID, BIP39,   (SQLite,      (libp2p,      (E2E encrypt,    │
│  X25519,       recovery)      encryption)    WebRTC)       conversations)  │
│  AES-GCM)                                                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Backend Detection

The service layer automatically detects whether it's running on web (WASM) or desktop (Tauri):

```typescript
// packages/umbra-wasm/loader.ts:22-34
const isTauri = typeof window !== 'undefined' &&
                (window as any).__TAURI_INTERNALS__ !== undefined;

if (isTauri) {
  // Use Tauri IPC to call native Rust
  return loadTauriBackend();
} else {
  // Use WASM compiled from Rust
  return loadWasmBackend();
}
```

---

## 2. Service Layer (umbra-service)

The `@umbra/service` package provides a unified TypeScript API that works across all platforms.

**Location:** `packages/umbra-service/src/`

### Structure

| File | Purpose | Lines |
|------|---------|-------|
| `index.ts` | Re-exports all public APIs | 119 |
| `service.ts` | Main `UmbraService` class with event dispatch | 872 |
| `types.ts` | All TypeScript type definitions | 691 |
| `errors.ts` | `ErrorCode` enum and `UmbraError` class | 91 |
| `helpers.ts` | Utility functions (`snakeToCamel`, `parseWasm`) | 86 |
| `identity.ts` | Identity creation, restoration, profiles | 153 |
| `network.ts` | Network start/stop, WebRTC handshakes | 114 |
| `friends.ts` | Friend requests, accept/reject, block | 314 |
| `messaging.ts` | Conversations, messages, threads, reactions | 593 |
| `calling.ts` | Call records and history | 59 |
| `groups.ts` | Group CRUD, encryption, invitations | 616 |
| `crypto.ts` | Sign and verify operations | 32 |
| `relay.ts` | Relay server connection and sessions | 101 |

### Key Concepts

#### Initialization

```typescript
// packages/umbra-service/src/service.ts:76-100
static async initialize(config?: InitConfig): Promise<void> {
  if (this._initialized && this._instance) {
    return; // Already initialized (handles HMR)
  }

  // Load WASM module (includes sql.js + DB schema init)
  const wasmModule = await initUmbraWasm(config?.did);

  const instance = new UmbraService();

  // Connect event bridge for Rust → JS events
  eventBridge.connect(wasmModule);
  eventBridge.onAll((event: UmbraEvent) => {
    instance._dispatchEvent(event);
  });

  this._instance = instance;
  this._initialized = true;
}
```

#### Domain Modules

Each domain (identity, friends, messaging, etc.) is a separate module:

```typescript
// packages/umbra-service/src/identity.ts:25-48
export async function createIdentity(displayName: string): Promise<CreateIdentityResult> {
  // Call WASM function
  const resultJson = wasm().umbra_wasm_identity_create(displayName);

  // Parse JSON response and convert snake_case → camelCase
  const result = await parseWasm<{ did: string; recoveryPhrase: string }>(resultJson);

  // Get full profile info
  const profileJson = wasm().umbra_wasm_identity_get_profile();
  const profile = await parseWasm<{...}>(profileJson);

  return {
    identity: {
      did: result.did,
      displayName: profile.displayName,
      // ...
    },
    recoveryPhrase: result.recoveryPhrase.split(' '),
  };
}
```

#### Event Subscriptions

Subscribe to domain events from the Rust backend:

```typescript
// packages/umbra-service/src/service.ts:340-350
onMessageEvent(callback: (event: MessageEvent) => void): () => void {
  this._messageListeners.push(callback);
  return () => {
    const index = this._messageListeners.indexOf(callback);
    if (index !== -1) {
      this._messageListeners.splice(index, 1);
    }
  };
}
```

---

## 3. WASM Integration (umbra-wasm)

The `@umbra/wasm` package handles loading and interfacing with the Rust WASM module.

**Location:** `packages/umbra-wasm/`

### Files

| File | Purpose | Size |
|------|---------|------|
| `loader.ts` | WASM/Tauri initialization, module interface | 660 lines |
| `sql-bridge.ts` | sql.js SQLite bridge for browser | 357 lines |
| `indexed-db.ts` | IndexedDB persistence layer | 256 lines |
| `event-bridge.ts` | Rust → JS event dispatch | ~100 lines |
| `tauri-backend.ts` | Tauri IPC adapter | 499 lines |
| `index.ts` | Package exports | ~50 lines |

### WASM Module Interface

The `UmbraWasmModule` interface defines all functions available from Rust:

```typescript
// packages/umbra-wasm/loader.ts:37-130
export interface UmbraWasmModule {
  // Initialization
  umbra_wasm_init(): void;
  umbra_wasm_init_database(): Promise<boolean>;
  umbra_wasm_version(): string;

  // Identity
  umbra_wasm_identity_create(display_name: string): string;
  umbra_wasm_identity_restore(recovery_phrase: string, display_name: string): string;
  umbra_wasm_identity_get_did(): string;
  umbra_wasm_identity_get_profile(): string;
  umbra_wasm_identity_update_profile(json: string): void;

  // Friends
  umbra_wasm_friends_send_request(did: string, message?: string): string;
  umbra_wasm_friends_accept_request(request_id: string): string;
  umbra_wasm_friends_list(): string;
  // ... many more

  // Messaging
  umbra_wasm_messaging_send(conversation_id: string, content: string): string;
  umbra_wasm_messaging_decrypt(
    conversation_id: string,
    content_encrypted_b64: string,
    nonce_hex: string,
    sender_did: string,
    timestamp: bigint
  ): string;
  // ... many more
}
```

### SQL Bridge

The browser doesn't have native SQLite, so we use sql.js (SQLite compiled to WASM):

```typescript
// packages/umbra-wasm/sql-bridge.ts:40-80
export async function initSqlBridge(): Promise<void> {
  // Load sql.js
  const SQL = await initSqlJs({
    locateFile: (file: string) => `https://sql.js.org/dist/${file}`,
  });

  // Create in-memory database
  const db = new SQL.Database();

  // Expose to Rust via globalThis
  (globalThis as any).__umbra_sql = {
    exec: (sql: string) => db.exec(sql),
    run: (sql: string, params?: any[]) => db.run(sql, params),
    // ... more methods
  };
}
```

### IndexedDB Persistence

On web, the SQLite database is persisted to IndexedDB:

```typescript
// packages/umbra-wasm/indexed-db.ts:20-50
export async function saveDatabase(did: string, data: Uint8Array): Promise<void> {
  const dbName = `umbra-db-${did}`;
  const db = await openDB(dbName, 1, {
    upgrade(db) {
      db.createObjectStore('sqlite');
    },
  });

  await db.put('sqlite', data, 'database');
}

export async function loadDatabase(did: string): Promise<Uint8Array | null> {
  const dbName = `umbra-db-${did}`;
  const db = await openDB(dbName, 1);
  return await db.get('sqlite', 'database');
}
```

---

## 4. Tauri Desktop Integration

On desktop, we skip WASM entirely and call native Rust directly via Tauri IPC.

**Location:** `src-tauri/`

### Architecture

```
Frontend (React)
    ↓ invoke('command_name', { args })
Tauri IPC
    ↓
Rust Command Handler (src-tauri/src/commands/)
    ↓
umbra-core (native Rust library)
    ↓
Native SQLite + P2P Networking
```

### Tauri Commands

```rust
// src-tauri/src/lib.rs:30-60
pub fn run() {
    tauri::Builder::default()
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            // Initialization
            commands::init,
            commands::init_database,
            commands::version,

            // Identity
            commands::create_identity,
            commands::restore_identity,
            commands::get_did,
            commands::get_profile,

            // Friends
            commands::send_friend_request,
            commands::accept_friend_request,
            commands::list_friends,

            // Messaging
            commands::send_message,
            commands::get_messages,
            // ... more commands
        ])
        .run(tauri::generate_context!())
        .expect("error running tauri app");
}
```

### Command Implementation

```rust
// src-tauri/src/commands/messaging.rs
#[tauri::command]
pub async fn send_message(
    state: State<'_, AppState>,
    conversation_id: String,
    content: String,
) -> Result<String, String> {
    let db = state.database.read().await;
    let db = db.as_ref().ok_or("Database not initialized")?;

    let result = umbra_core::messaging::send_message(db, &conversation_id, &content)
        .map_err(|e| e.to_string())?;

    Ok(serde_json::to_string(&result).unwrap())
}
```

### Tauri Backend Adapter

The `tauri-backend.ts` implements the same interface as WASM:

```typescript
// packages/umbra-wasm/tauri-backend.ts:50-80
export function createTauriModule(): UmbraWasmModule {
  const { invoke } = window.__TAURI__.core;

  return {
    umbra_wasm_identity_create: (displayName: string) => {
      return invoke('create_identity', { displayName });
    },

    umbra_wasm_messaging_send: (conversationId: string, content: string) => {
      return invoke('send_message', { conversationId, content });
    },

    // ... all other methods map to Tauri commands
  };
}
```

---

## 5. Relay Server

The relay server provides signaling and offline message delivery.

**Location:** `packages/umbra-relay/`

### Purpose

1. **WebRTC Signaling** - Exchange SDP offers/answers for peer connections
2. **Offline Message Queue** - Store encrypted messages for offline users (7-day TTL)
3. **Single-Scan Friend Adding** - QR code-based connection establishment
4. **Group Calling** - Call room signaling

### Protocol

```rust
// packages/umbra-relay/src/protocol.rs

// Client → Relay
pub enum ClientMessage {
    Register { did: String },           // Register DID on connect
    Send { to_did: String, payload: String }, // Send encrypted message
    FetchOffline,                       // Get queued messages
    CreateSession { offer_payload: String }, // Create signaling session
    JoinSession { session_id: String, answer: String },
    // ... more
}

// Relay → Client
pub enum ServerMessage {
    Registered { did: String },
    Message { from_did: String, payload: String, timestamp: i64 },
    OfflineMessages { messages: Vec<OfflineMessage> },
    SessionCreated { session_id: String },
    SessionJoined { from_did: String },
    Error { message: String },
    // ... more
}
```

### Using the Relay

```typescript
// packages/umbra-service/src/relay.ts:14-30
export async function connectRelay(
  relayUrl: string
): Promise<RelayStatus & { registerMessage: string }> {
  const resultJson = await wasm().umbra_wasm_relay_connect(relayUrl);
  return await parseWasm<RelayStatus & { registerMessage: string }>(resultJson);
}

// The frontend handles the WebSocket:
// hooks/useNetwork.ts
const ws = new WebSocket(relayUrl);
ws.onopen = () => {
  ws.send(JSON.stringify({ type: 'register', did: myDid }));
};
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  // Handle incoming messages
};
```

### Relay Envelope Types

All messages are wrapped in typed envelopes:

```typescript
// packages/umbra-service/src/types.ts:337-370
export type RelayEnvelope =
  | { envelope: 'friend_request'; version: 1; payload: FriendRequestPayload }
  | { envelope: 'friend_response'; version: 1; payload: FriendResponsePayload }
  | { envelope: 'chat_message'; version: 1; payload: ChatMessagePayload }
  | { envelope: 'group_invite'; version: 1; payload: GroupInvitePayload }
  | { envelope: 'group_message'; version: 1; payload: GroupMessagePayload }
  | { envelope: 'typing_indicator'; version: 1; payload: TypingIndicatorPayload }
  | { envelope: 'message_status'; version: 1; payload: MessageStatusPayload }
  // ... more envelope types
```

### Sending via Relay

```typescript
// packages/umbra-service/src/messaging.ts:55-85
export async function sendMessage(
  conversationId: string,
  text: string,
  relayWs?: WebSocket | null
): Promise<Message> {
  // Encrypt and store locally
  const resultJson = wasm().umbra_wasm_messaging_send(conversationId, text);
  const raw = await parseWasm<{...}>(resultJson);

  // Send via relay if connected
  if (relayWs && relayWs.readyState === WebSocket.OPEN && raw.contentEncrypted) {
    const envelope: RelayEnvelope = {
      envelope: 'chat_message',
      version: 1,
      payload: {
        messageId: raw.id,
        conversationId: raw.conversationId,
        senderDid: raw.senderDid,
        contentEncrypted: raw.contentEncrypted,
        nonce: raw.nonce,
        timestamp: raw.timestamp,
      },
    };

    relayWs.send(JSON.stringify({
      type: 'send',
      to_did: raw.friendDid,
      payload: JSON.stringify(envelope),
    }));
  }

  return { ...message, status: relayWs ? 'sending' : 'sent' };
}
```

---

## 6. Event System

The event bridge connects Rust async events to JavaScript listeners.

**Location:** `packages/umbra-wasm/event-bridge.ts`

### Event Flow

```
Rust (emit_event macro)
    ↓
wasm_bindgen callback to JS
    ↓
EventBridge.dispatch()
    ↓
Domain listeners (message, friend, discovery, network, relay, group)
    ↓
React hooks (useMessages, useFriends, etc.)
    ↓
UI updates
```

### Event Bridge Implementation

```typescript
// packages/umbra-wasm/event-bridge.ts
type EventDomain = 'message' | 'friend' | 'discovery' | 'network' | 'relay' | 'group';

class EventBridge {
  private listeners: Map<EventDomain, Set<(data: any) => void>> = new Map();
  private allListeners: Set<(event: UmbraEvent) => void> = new Set();

  connect(wasmModule: UmbraWasmModule) {
    // Subscribe to WASM events
    wasmModule.umbra_wasm_subscribe_events((domain: string, data: any) => {
      this.dispatch({ domain: domain as EventDomain, data });
    });
  }

  on(domain: EventDomain, callback: (data: any) => void): () => void {
    if (!this.listeners.has(domain)) {
      this.listeners.set(domain, new Set());
    }
    this.listeners.get(domain)!.add(callback);

    return () => this.listeners.get(domain)!.delete(callback);
  }

  onAll(callback: (event: UmbraEvent) => void): () => void {
    this.allListeners.add(callback);
    return () => this.allListeners.delete(callback);
  }

  dispatch(event: UmbraEvent) {
    // Notify domain listeners
    this.listeners.get(event.domain)?.forEach(cb => cb(event.data));

    // Notify catch-all listeners
    this.allListeners.forEach(cb => cb(event));
  }
}

export const eventBridge = new EventBridge();
```

### Using Events in React

```typescript
// hooks/useMessages.ts
import { UmbraService } from '@umbra/service';

export function useMessages(conversationId: string) {
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    // Subscribe to message events
    const unsubscribe = UmbraService.instance.onMessageEvent((event) => {
      if (event.type === 'messageReceived' &&
          event.message.conversationId === conversationId) {
        setMessages(prev => [...prev, event.message]);
      }
    });

    return unsubscribe;
  }, [conversationId]);

  return { messages };
}
```

---

## 7. Persistence Layer

### Storage Architecture

| Platform | Database | Secure Storage | Encryption |
|----------|----------|----------------|------------|
| Web | sql.js → IndexedDB | IndexedDB + WebCrypto | AES-256-GCM |
| iOS | SQLite | Keychain | AES-256-GCM |
| Android | SQLite | Keystore | AES-256-GCM |
| Desktop (Tauri) | SQLite | Native file | AES-256-GCM |

### Database Schema

```sql
-- packages/umbra-core/src/storage/schema.rs

CREATE TABLE IF NOT EXISTS friends (
    did TEXT PRIMARY KEY,
    display_name TEXT NOT NULL,
    signing_key TEXT NOT NULL,
    encryption_key TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    friend_did TEXT,
    type TEXT NOT NULL,  -- 'dm' or 'group'
    group_id TEXT,
    unread_count INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL,
    last_message_at INTEGER
);

CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    sender_did TEXT NOT NULL,
    content_encrypted TEXT NOT NULL,
    nonce TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    delivered INTEGER DEFAULT 0,
    read INTEGER DEFAULT 0,
    thread_id TEXT,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id)
);

CREATE TABLE IF NOT EXISTS friend_requests (
    id TEXT PRIMARY KEY,
    from_did TEXT NOT NULL,
    to_did TEXT NOT NULL,
    direction TEXT NOT NULL,  -- 'incoming' or 'outgoing'
    message TEXT,
    from_signing_key TEXT,
    from_encryption_key TEXT,
    from_display_name TEXT,
    created_at INTEGER NOT NULL,
    status TEXT DEFAULT 'pending'
);
```

### Key Derivation

```rust
// packages/umbra-core/src/crypto/kdf.rs

// From recovery phrase to keys:
// BIP39 phrase → PBKDF2 → Master Seed → HKDF → Keys

pub fn derive_keys_from_seed(master_seed: &[u8; 32]) -> DerivedKeys {
    // Signing key (Ed25519)
    let signing_key = hkdf_expand(
        master_seed,
        b"umbra-signing-key-v1",
    );

    // Encryption key (X25519)
    let encryption_key = hkdf_expand(
        master_seed,
        b"umbra-encryption-key-v1",
    );

    // Storage encryption key (AES-256)
    let storage_key = hkdf_expand(
        master_seed,
        b"umbra-storage-encryption-v1",
    );

    DerivedKeys { signing_key, encryption_key, storage_key }
}
```

---

## 8. Code Examples

### Example 1: Initialize and Create Identity

```typescript
import { UmbraService } from '@umbra/service';

async function setup() {
  // Initialize the service (loads WASM or connects to Tauri)
  await UmbraService.initialize();

  // Create a new identity
  const { identity, recoveryPhrase } = await UmbraService.instance.createIdentity('Alice');

  console.log('DID:', identity.did);
  console.log('Recovery phrase:', recoveryPhrase.join(' '));
  // IMPORTANT: Display recovery phrase to user once!
}
```

### Example 2: Send a Friend Request

```typescript
import { UmbraService } from '@umbra/service';

async function addFriend(friendDid: string, relayWs: WebSocket) {
  const result = await UmbraService.instance.sendFriendRequest(
    friendDid,
    'Hey, let\'s connect!',
    relayWs
  );

  console.log('Request sent:', result.id);
  console.log('Delivered via relay:', result.relayDelivered);
}
```

### Example 3: Send and Receive Messages

```typescript
import { UmbraService } from '@umbra/service';

// Subscribe to incoming messages
UmbraService.instance.onMessageEvent((event) => {
  if (event.type === 'messageReceived') {
    console.log('New message:', event.message.content.text);
  }
});

// Send a message
async function sendMessage(conversationId: string, text: string, relayWs: WebSocket) {
  const message = await UmbraService.instance.sendMessage(
    conversationId,
    text,
    relayWs
  );

  console.log('Sent:', message.id, 'Status:', message.status);
}
```

### Example 4: Handle Relay Connection

```typescript
// hooks/useNetwork.ts (simplified)

function useNetwork() {
  const [relayWs, setRelayWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket('wss://relay.umbra.app/ws');

    ws.onopen = async () => {
      // Register our DID
      const identity = await UmbraService.instance.getIdentity();
      ws.send(JSON.stringify({ type: 'register', did: identity.did }));

      // Fetch offline messages
      ws.send(JSON.stringify({ type: 'fetch_offline' }));
    };

    ws.onmessage = async (event) => {
      const msg = JSON.parse(event.data);

      switch (msg.type) {
        case 'message':
          // Handle incoming encrypted message
          const envelope = JSON.parse(msg.payload) as RelayEnvelope;
          await handleEnvelope(envelope, msg.from_did);
          break;

        case 'offline_messages':
          // Process queued messages
          for (const offlineMsg of msg.messages) {
            const envelope = JSON.parse(offlineMsg.payload);
            await handleEnvelope(envelope, offlineMsg.from_did);
          }
          break;
      }
    };

    setRelayWs(ws);
    return () => ws.close();
  }, []);

  return { relayWs };
}

async function handleEnvelope(envelope: RelayEnvelope, fromDid: string) {
  switch (envelope.envelope) {
    case 'friend_request':
      await UmbraService.instance.storeIncomingRequest({
        ...envelope.payload,
        direction: 'incoming',
        toDid: myDid,
        status: 'pending',
      });
      break;

    case 'chat_message':
      const decrypted = await UmbraService.instance.decryptIncomingMessage(
        envelope.payload
      );
      if (decrypted) {
        await UmbraService.instance.storeIncomingMessage(envelope.payload);
        // Dispatch UI event
      }
      break;

    // Handle other envelope types...
  }
}
```

### Example 5: Desktop-Specific (Tauri)

```typescript
// Check if running on Tauri
const isTauri = typeof window !== 'undefined' &&
                (window as any).__TAURI_INTERNALS__;

if (isTauri) {
  // Desktop-specific features
  import('@tauri-apps/api/window').then(({ getCurrentWindow }) => {
    const win = getCurrentWindow();

    // Native window controls
    win.setTitle('Umbra');
    win.setMinSize({ width: 400, height: 600 });
  });
}
```

---

## File Reference Quick Links

| Component | Key File | Purpose |
|-----------|----------|---------|
| Service API | `packages/umbra-service/src/service.ts` | Main service class |
| Types | `packages/umbra-service/src/types.ts` | All type definitions |
| Identity | `packages/umbra-service/src/identity.ts` | Identity operations |
| Messaging | `packages/umbra-service/src/messaging.ts` | Message operations |
| Friends | `packages/umbra-service/src/friends.ts` | Friend operations |
| Groups | `packages/umbra-service/src/groups.ts` | Group operations |
| WASM Loader | `packages/umbra-wasm/loader.ts` | WASM initialization |
| SQL Bridge | `packages/umbra-wasm/sql-bridge.ts` | Browser SQLite |
| Event Bridge | `packages/umbra-wasm/event-bridge.ts` | Rust → JS events |
| Tauri Backend | `packages/umbra-wasm/tauri-backend.ts` | Desktop IPC |
| Tauri Commands | `src-tauri/src/commands/*.rs` | Native commands |
| Relay Protocol | `packages/umbra-relay/src/protocol.rs` | Message types |
| Rust Crypto | `packages/umbra-core/src/crypto/` | Cryptographic primitives |
| Rust Storage | `packages/umbra-core/src/storage/` | Database layer |

---

## See Also

- [DEVELOPMENT.md](../DEVELOPMENT.md) - Development setup guide
- [SECURITY.md](./SECURITY.md) - Security architecture
- [umbra-core examples](../../packages/umbra-core/examples/) - Rust code examples
