# Umbra Development Guide

This guide explains how to set up and run the Umbra project in development and production.

## Related Documentation

- **[Architecture Guide](./architecture/ARCHITECTURE.md)** - Deep dive into how services work and how Rust interfaces with the frontend
- **[Security Guide](./architecture/SECURITY.md)** - Cryptographic architecture and security model
- **[Community Plan](./COMMUNITY_PLAN.md)** - Full community feature plan with implementation status
- **[Frontend Requirements](./frontend_requirements.md)** - WASM function contracts, data types, and UI component specs
- **[Component Checklist](./COMPONENT_CHECKLIST.md)** - 73 UI components to build across all phases

## Table of Contents

1. [Project Structure](#project-structure)
2. [Prerequisites](#prerequisites)
3. [Development Setup](#development-setup)
4. [Building for Production](#building-for-production)
5. [Platform-Specific Notes](#platform-specific-notes)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)
8. [Community Module](#community-module)

---

## 1. Project Structure

```
Umbra/
├── app/                          # Expo Router pages
├── components/                   # React Native components
├── hooks/                        # Custom React hooks
├── data/                         # Mock data (to be replaced)
├── services/                     # Service layer
│
├── packages/
│   ├── umbra-core/              # Rust core library
│   │   ├── Cargo.toml
│   │   ├── src/
│   │   │   ├── lib.rs           # Main entry
│   │   │   ├── crypto/          # Cryptographic primitives
│   │   │   ├── identity/        # Identity management
│   │   │   ├── storage/         # Local storage (schema v7, 26 community tables)
│   │   │   ├── network/         # P2P networking
│   │   │   ├── discovery/       # Peer discovery
│   │   │   ├── friends/         # Friend management
│   │   │   ├── messaging/       # E2E messaging
│   │   │   ├── community/       # Community system (16 modules, 3141 lines)
│   │   │   └── ffi/             # FFI + WASM bindings (122 community functions)
│   │   └── bindings/            # Generated FFI bindings
│   │
│   ├── umbra-service/           # TypeScript API layer
│   │   ├── package.json
│   │   └── src/
│   │       ├── index.ts         # Re-exports
│   │       ├── service.ts       # Main UmbraService class
│   │       ├── types.ts         # Type definitions
│   │       ├── errors.ts        # Error codes & UmbraError
│   │       ├── helpers.ts       # Utility functions
│   │       ├── identity.ts      # Identity operations
│   │       ├── network.ts       # Network operations
│   │       ├── friends.ts       # Friend management
│   │       ├── messaging.ts     # Messaging operations
│   │       ├── calling.ts       # Call records
│   │       ├── groups.ts        # Group operations
│   │       ├── crypto.ts        # Sign/verify
│   │       └── relay.ts         # Relay client
│   │
│   ├── umbra-wasm/              # WASM bindings & web layer
│   │   ├── loader.ts            # WASM/Tauri initialization
│   │   ├── sql-bridge.ts        # sql.js SQLite bridge
│   │   ├── indexed-db.ts        # IndexedDB persistence
│   │   ├── event-bridge.ts      # Rust → JS events
│   │   ├── tauri-backend.ts     # Tauri IPC adapter
│   │   └── index.ts             # Exports
│   │
│   ├── umbra-relay/             # WebSocket relay server
│   │   └── src/
│   │       ├── main.rs          # Server entry
│   │       ├── protocol.rs      # Message types
│   │       ├── handler.rs       # Connection handler
│   │       ├── state.rs         # Server state
│   │       └── federation.rs    # Relay-to-relay mesh
│   │
│   ├── umbra-plugin-sdk/        # Plugin development kit
│   │   └── src/
│   │
│   ├── umbra-plugin-runtime/    # Plugin execution runtime
│   │   └── src/
│   │
│   └── umbra-plugin-template/   # Plugin template
│
├── src-tauri/                   # Tauri desktop app
│   ├── src/
│   │   ├── main.rs              # Entry point
│   │   ├── lib.rs               # Command registration
│   │   ├── state.rs             # App state
│   │   └── commands/            # IPC command handlers
│   ├── Cargo.toml
│   └── tauri.conf.json
│
├── docs/
│   ├── architecture/
│   │   ├── ARCHITECTURE.md      # Architecture deep dive
│   │   └── SECURITY.md          # Security documentation
│   ├── COMMUNITY_PLAN.md        # Community feature plan & implementation status
│   ├── COMPONENT_CHECKLIST.md   # UI component checklist (73 components)
│   ├── frontend_requirements.md # WASM function contracts for frontend
│   └── DEVELOPMENT.md           # This file
│
├── package.json                 # Root package.json
├── app.json                     # Expo configuration
└── RUST_BACKEND_PLAN.md         # Architecture plan
```

---

## 2. Prerequisites

### All Platforms

- **Node.js** 18+ and npm
- **Rust** 1.75+ (for umbra-core)
- **Git**

### iOS Development

- macOS
- Xcode 15+
- iOS Simulator or physical device
- CocoaPods (`sudo gem install cocoapods`)

### Android Development

- Android Studio
- Android SDK (API 24+)
- Android NDK (for Rust cross-compilation)
- Android Emulator or physical device

### Web Development

- Modern browser (Chrome, Firefox, Safari)
- wasm-pack (`cargo install wasm-pack`)

---

## 3. Development Setup

### Step 1: Clone and Install Dependencies

```bash
# Clone the repository
git clone https://github.com/your-org/umbra.git
cd umbra

# Install Node.js dependencies
npm install

# Install Rust dependencies (if not already installed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### Step 2: Set Up Rust Targets

```bash
# For iOS
rustup target add aarch64-apple-ios        # Device
rustup target add aarch64-apple-ios-sim    # Simulator (M1/M2)
rustup target add x86_64-apple-ios         # Simulator (Intel)

# For Android
rustup target add aarch64-linux-android    # ARM64 devices
rustup target add armv7-linux-androideabi  # ARM32 devices
rustup target add x86_64-linux-android     # Emulator (x86)

# For Web
rustup target add wasm32-unknown-unknown
```

### Step 3: Build Rust Core (Development)

```bash
cd packages/umbra-core

# Build for host platform (for testing)
cargo build

# Run tests
cargo test

# Build with verbose output
cargo build --verbose
```

### Step 4: Start the Development Server

```bash
# Return to root
cd ../..

# Start Expo development server
npm start

# Or start for specific platform
npm run ios      # iOS Simulator
npm run android  # Android Emulator
npm run web      # Web browser
```

---

## 4. Building for Production

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        BUILD PIPELINE                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  RUST CORE                                                                 │
│  ─────────                                                                  │
│                                                                             │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐      │
│  │  cargo build    │────►│  uniffi-bindgen │────►│  Swift/Kotlin   │      │
│  │  --release      │     │                 │     │  Bindings       │      │
│  │                 │     │  Generates type-│     │                 │      │
│  │  Compiles Rust  │     │  safe bindings  │     │  Native modules │      │
│  │  to native libs │     │  for each       │     │  for React      │      │
│  │                 │     │  platform       │     │  Native         │      │
│  └─────────────────┘     └─────────────────┘     └─────────────────┘      │
│                                                                             │
│  iOS:    libumbra_core.a (static library)                                  │
│  Android: libumbra_core.so (dynamic library)                               │
│  Web:    umbra_core.wasm + JS glue                                        │
│                                                                             │
│                                                                             │
│  REACT NATIVE APP                                                          │
│  ────────────────                                                           │
│                                                                             │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐      │
│  │  expo prebuild  │────►│  Native build   │────►│  App bundle     │      │
│  │                 │     │                 │     │                 │      │
│  │  Generates      │     │  Xcode (iOS)    │     │  .ipa (iOS)     │      │
│  │  native         │     │  Gradle (And)   │     │  .apk (Android) │      │
│  │  projects       │     │                 │     │  .js (Web)      │      │
│  └─────────────────┘     └─────────────────┘     └─────────────────┘      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Build Rust Core for iOS

```bash
cd packages/umbra-core

# Build for all iOS targets
cargo build --release --target aarch64-apple-ios
cargo build --release --target aarch64-apple-ios-sim

# Create universal library (for simulator)
lipo -create \
  target/aarch64-apple-ios-sim/release/libumbra_core.a \
  -output target/universal-ios-sim/libumbra_core.a

# Generate Swift bindings (when uniffi is set up)
# cargo run --bin uniffi-bindgen generate \
#   --library target/aarch64-apple-ios/release/libumbra_core.a \
#   --language swift \
#   --out-dir bindings/swift
```

### Build Rust Core for Android

```bash
cd packages/umbra-core

# Set up Android NDK (if not done)
export ANDROID_NDK_HOME=$HOME/Android/Sdk/ndk/25.2.9519653

# Build for all Android targets
cargo ndk -t arm64-v8a -t armeabi-v7a -t x86_64 \
  build --release

# Output will be in:
# target/aarch64-linux-android/release/libumbra_core.so
# target/armv7-linux-androideabi/release/libumbra_core.so
# target/x86_64-linux-android/release/libumbra_core.so

# Generate Kotlin bindings (when uniffi is set up)
# cargo run --bin uniffi-bindgen generate \
#   --library target/aarch64-linux-android/release/libumbra_core.so \
#   --language kotlin \
#   --out-dir bindings/kotlin
```

### Build Rust Core for Web

```bash
cd packages/umbra-core

# Build with wasm-pack
wasm-pack build --target web --out-dir ../umbra-web/pkg

# Or for bundler (webpack/vite)
wasm-pack build --target bundler --out-dir ../umbra-web/pkg
```

### Build React Native App

```bash
# Return to root
cd ../..

# Generate native projects
npx expo prebuild

# Build iOS (requires Mac)
cd ios && pod install && cd ..
npx expo run:ios --configuration Release

# Build Android
npx expo run:android --variant release

# Or use EAS Build (recommended for CI/CD)
npx eas build --platform ios
npx eas build --platform android
```

### Build Web App

```bash
# Export static web app
npx expo export --platform web

# Output in dist/ directory
# Deploy to any static hosting (Vercel, Netlify, etc.)
```

---

## 5. Platform-Specific Notes

### iOS

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        iOS INTEGRATION                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Native Module Location: packages/umbra-native/ios/                        │
│                                                                             │
│  Files:                                                                    │
│  • UmbraCore.swift      - Swift wrapper around FFI                        │
│  • UmbraCore.m          - Objective-C bridge for React Native             │
│  • UmbraCore.xcframework - Universal binary (device + simulator)           │
│                                                                             │
│  Key Files to Configure:                                                   │
│  • ios/Podfile          - Add umbra-native pod                            │
│  • ios/Info.plist       - Add network permissions                         │
│                                                                             │
│  Keychain Access:                                                          │
│  Keys are stored in iOS Keychain with:                                     │
│  • kSecAttrAccessible: kSecAttrAccessibleAfterFirstUnlock                 │
│  • Biometric protection optional                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Android

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ANDROID INTEGRATION                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Native Module Location: packages/umbra-native/android/                    │
│                                                                             │
│  Files:                                                                    │
│  • UmbraCoreModule.kt   - Kotlin module for React Native                  │
│  • UmbraCorePackage.kt  - Package registration                            │
│  • jniLibs/             - Native .so libraries per ABI                    │
│    ├── arm64-v8a/libumbra_core.so                                         │
│    ├── armeabi-v7a/libumbra_core.so                                       │
│    └── x86_64/libumbra_core.so                                            │
│                                                                             │
│  Key Files to Configure:                                                   │
│  • android/build.gradle - Add JNA dependency                              │
│  • android/app/build.gradle - Configure native libraries                  │
│  • AndroidManifest.xml  - Add network permissions                         │
│                                                                             │
│  Keystore Access:                                                          │
│  Keys are stored in Android Keystore with:                                 │
│  • Hardware-backed storage (when available)                               │
│  • Biometric protection optional                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Web

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        WEB INTEGRATION                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  WASM Module Location: packages/umbra-web/                                 │
│                                                                             │
│  Files:                                                                    │
│  • pkg/umbra_core.wasm  - WebAssembly module                              │
│  • pkg/umbra_core.js    - JavaScript glue code                            │
│  • src/worker.ts        - Web Worker for background execution             │
│  • src/index.ts         - Main API wrapper                                │
│                                                                             │
│  Why Web Worker?                                                           │
│  • WASM execution can block main thread                                   │
│  • Crypto operations are CPU-intensive                                    │
│  • Better UX with non-blocking operations                                 │
│                                                                             │
│  Storage:                                                                  │
│  • Keys: IndexedDB + WebCrypto for encryption                             │
│  • Database: IndexedDB (SQLite not available in browser)                  │
│                                                                             │
│  Transport:                                                                │
│  • WebSocket to bootstrap nodes                                           │
│  • WebRTC for direct peer connections                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Testing

### Rust Tests

```bash
cd packages/umbra-core

# Run all tests
cargo test

# Run with output
cargo test -- --nocapture

# Run specific test
cargo test test_keypair_generation

# Run benchmarks
cargo bench
```

### TypeScript Tests

```bash
# Run Jest tests
npm test

# Run with coverage
npm run test:coverage
```

### Integration Tests

```bash
# Start local test network (future)
# npm run test:integration
```

---

## 7. Troubleshooting

### Common Issues

#### Rust compilation fails

```bash
# Update Rust
rustup update

# Clean and rebuild
cargo clean
cargo build
```

#### iOS Simulator crashes

```bash
# Reset simulator
xcrun simctl erase all

# Clean Xcode build
cd ios && xcodebuild clean && cd ..
```

#### Android build fails

```bash
# Clean Gradle cache
cd android && ./gradlew clean && cd ..

# Rebuild
npx expo run:android
```

#### WASM doesn't load

```bash
# Check browser console for errors
# Ensure CORS headers are set correctly
# Verify .wasm file is served with correct MIME type
```

### Debug Logging

```bash
# Enable Rust debug logging
RUST_LOG=debug cargo run

# Enable React Native debug
# In app: shake device → "Debug"
```

---

## Environment Variables

### Development

```bash
# .env.development
UMBRA_BOOTSTRAP_NODES=
UMBRA_LOG_LEVEL=debug
```

### Production

```bash
# .env.production
UMBRA_BOOTSTRAP_NODES=/dns/bootstrap1.umbra.chat/tcp/4001
UMBRA_LOG_LEVEL=info
```

---

## CI/CD (GitHub Actions)

```yaml
# .github/workflows/build.yml
name: Build

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  rust:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
      - run: cargo test --manifest-path packages/umbra-core/Cargo.toml

  typescript:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test

  ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx expo prebuild --platform ios
      - run: xcodebuild -workspace ios/Umbra.xcworkspace -scheme Umbra -sdk iphonesimulator

  android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'
      - run: npm ci
      - run: npx expo prebuild --platform android
      - run: cd android && ./gradlew assembleRelease
```

---

## 8. Community Module

The community system is Umbra's largest feature module. All business logic is in Rust with 122 WASM bindings for the frontend. The module spans 16 source files (3141 lines) plus 26 database tables and a comprehensive WASM layer.

### Related Docs

| Document | Path | Description |
|----------|------|-------------|
| Community Plan | [`docs/COMMUNITY_PLAN.md`](./COMMUNITY_PLAN.md) | Full feature plan, data model, implementation phases with status |
| Frontend Requirements | [`docs/frontend_requirements.md`](./frontend_requirements.md) | WASM function signatures, data types, events, UI component specs |
| Component Checklist | [`docs/COMPONENT_CHECKLIST.md`](./COMPONENT_CHECKLIST.md) | 73 UI components to build, organized by phase |

### Source Code

#### Core Service (`packages/umbra-core/src/community/`)

| File | Lines | Purpose | Key Functions |
|------|-------|---------|---------------|
| [`mod.rs`](../packages/umbra-core/src/community/mod.rs) | 53 | Module root, public API | Exports `CommunityService`, `Permission`, `Permissions`, `RolePreset`, `MentionType`, `parse_mentions` |
| [`service.rs`](../packages/umbra-core/src/community/service.rs) | 261 | Community CRUD | `create_community`, `get_community`, `update_community`, `delete_community`, `transfer_ownership` |
| [`spaces.rs`](../packages/umbra-core/src/community/spaces.rs) | 125 | Space organization | `create_space`, `get_spaces`, `update_space`, `reorder_spaces`, `delete_space` |
| [`channels.rs`](../packages/umbra-core/src/community/channels.rs) | 174 | Channel management (6 types) | `create_channel`, `get_channels`, `get_all_channels`, `update_channel`, `delete_channel` |
| [`permissions.rs`](../packages/umbra-core/src/community/permissions.rs) | 357 | 64-bit permission bitfield | `Permission` enum (34+ flags), `Permissions` struct, resolution with administrator bypass |
| [`roles.rs`](../packages/umbra-core/src/community/roles.rs) | 127 | Role presets + hierarchy | `RolePreset` enum (Owner/Admin/Moderator/Member), `create_preset_roles` |
| [`members.rs`](../packages/umbra-core/src/community/members.rs) | 292 | Member lifecycle | `join_community`, `leave_community`, `kick_member`, `ban_member`, `unban_member` |
| [`invites.rs`](../packages/umbra-core/src/community/invites.rs) | 182 | Invite links + vanity URLs | `create_invite`, `use_invite`, `set_vanity`, `delete_invite` |
| [`messaging.rs`](../packages/umbra-core/src/community/messaging.rs) | 382 | Messages, reactions, pins | `send_message`, `add_reaction`, `pin_message`, `mark_as_read`, `parse_mentions` |
| [`threads.rs`](../packages/umbra-core/src/community/threads.rs) | 182 | Threads + search | `create_thread`, `get_thread_messages`, `search_messages`, `follow_thread` |
| [`moderation.rs`](../packages/umbra-core/src/community/moderation.rs) | 261 | Warnings + AutoMod | `warn_member`, `check_warning_escalation`, keyword filter management |
| [`files.rs`](../packages/umbra-core/src/community/files.rs) | 134 | File management + folders | `upload_file`, `get_files`, `create_folder`, `record_file_download` |
| [`customization.rs`](../packages/umbra-core/src/community/customization.rs) | 147 | Branding + emoji | `update_branding`, `set_vanity_url`, `create_emoji`, `create_sticker` |
| [`integrations.rs`](../packages/umbra-core/src/community/integrations.rs) | 241 | Webhooks + permission overrides | `create_webhook`, `set_channel_override`, custom role CRUD |
| [`boost_nodes.rs`](../packages/umbra-core/src/community/boost_nodes.rs) | 104 | Boost node config | `register_boost_node`, `update_boost_node`, `update_boost_node_heartbeat` |
| [`member_experience.rs`](../packages/umbra-core/src/community/member_experience.rs) | 119 | Status, notifications, timeouts | `set_member_status`, `set_notification_settings`, timeout tracking |

#### WASM Bindings (`packages/umbra-core/src/ffi/`)

| File | Lines | Description |
|------|-------|-------------|
| [`wasm.rs`](../packages/umbra-core/src/ffi/wasm.rs) | 7305 | 122 community `umbra_wasm_community_*` functions exposing all service methods to JavaScript |

#### Database Schema (`packages/umbra-core/src/storage/`)

| File | Description |
|------|-------------|
| [`schema.rs`](../packages/umbra-core/src/storage/schema.rs) | Schema v7 — 26 community tables (`communities`, `community_spaces`, `community_channels`, `community_roles`, `community_member_roles`, `community_members`, `community_messages`, `community_reactions`, `community_read_receipts`, `community_pins`, `community_threads`, `community_invites`, `community_bans`, `community_warnings`, `community_audit_log`, `community_emoji`, `community_stickers`, `community_files`, `community_file_folders`, `community_webhooks`, `community_channel_keys`, `boost_nodes`, `community_deleted_messages`, `community_timeouts`, `community_thread_followers`, `community_member_status`, `community_notification_settings`) |

### Tests

| File | Status | Description |
|------|--------|-------------|
| [`permissions.rs`](../packages/umbra-core/src/community/permissions.rs) (inline `#[cfg(test)]`) | ✅ | Permission bitfield creation, has/check, administrator bypass, string conversion |
| `service.rs` | ❌ Needs tests | Community CRUD, ownership transfer |
| `spaces.rs` | ❌ Needs tests | Space CRUD, reordering |
| `channels.rs` | ❌ Needs tests | Channel CRUD, type validation |
| `members.rs` | ❌ Needs tests | Join/leave, kick/ban, ban evasion |
| `invites.rs` | ❌ Needs tests | Invite create/use, expiry, vanity |
| `messaging.rs` | ❌ Needs tests | Message send, reactions, pins, mentions |
| `threads.rs` | ❌ Needs tests | Thread CRUD, search, followers |
| `moderation.rs` | ❌ Needs tests | Warnings, escalation, keyword filters |
| `files.rs` | ❌ Needs tests | File upload, folders, downloads |
| `customization.rs` | ❌ Needs tests | Branding, emoji, stickers |
| `integrations.rs` | ❌ Needs tests | Webhooks, permission overrides |
| `boost_nodes.rs` | ❌ Needs tests | Node registration, heartbeat |
| `member_experience.rs` | ❌ Needs tests | Status, notifications, timeouts |
| `roles.rs` | ❌ Needs tests | Preset creation, hierarchy |

To run existing community tests:

```bash
cd packages/umbra-core
cargo test community -- --nocapture
```

### Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                      Community Module                                │
│                                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │ service  │  │ spaces   │  │ channels │  │ permissions      │   │
│  │ (CRUD)   │──│ (org)    │──│ (6 types)│  │ (64-bit bitfield)│   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘   │
│                                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │ members  │  │ roles    │  │ invites  │  │ messaging        │   │
│  │ (join/   │  │ (4 pre-  │  │ (links,  │  │ (send, reactions,│   │
│  │  ban)    │  │  sets)   │  │  vanity) │  │  pins, mentions) │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘   │
│                                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │ threads  │  │ moderat- │  │ files    │  │ customization    │   │
│  │ (thread, │  │ ion      │  │ (upload, │  │ (branding, emoji,│   │
│  │  search) │  │ (warn)   │  │  folders)│  │  stickers)       │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘   │
│                                                                      │
│  ┌──────────┐  ┌──────────────────┐                                 │
│  │ integra- │  │ member_experience │                                │
│  │ tions    │  │ (status, notif,   │                                │
│  │ (webhook)│  │  timeouts)        │                                │
│  └──────────┘  └──────────────────┘                                 │
│                                                                      │
│  ┌──────────────────┐                                               │
│  │ boost_nodes      │  ← config only; standalone binary planned     │
│  │ (register, CRUD) │                                               │
│  └──────────────────┘                                               │
└─────────────────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────────┐
│  ffi/wasm.rs — 122 WASM bindings (umbra_wasm_community_*)           │
└─────────────────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────────┐
│  storage/schema.rs — Schema v7 (26 community tables)                │
└─────────────────────────────────────────────────────────────────────┘
```

### Running Community Functions

```bash
# Build and test the community module
cd packages/umbra-core
cargo build
cargo test community -- --nocapture

# Run only permission tests
cargo test community::permissions -- --nocapture
```

---

## Next Steps

See [`COMMUNITY_PLAN.md`](./COMMUNITY_PLAN.md) for the full implementation roadmap and [`COMPONENT_CHECKLIST.md`](./COMPONENT_CHECKLIST.md) for frontend work.

See `RUST_BACKEND_PLAN.md` for the overall Rust backend architecture plan.
