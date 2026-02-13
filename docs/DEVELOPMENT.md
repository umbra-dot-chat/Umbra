# Umbra Development Guide

This guide explains how to set up and run the Umbra project in development and production.

## Table of Contents

1. [Project Structure](#project-structure)
2. [Prerequisites](#prerequisites)
3. [Development Setup](#development-setup)
4. [Building for Production](#building-for-production)
5. [Platform-Specific Notes](#platform-specific-notes)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)

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
│   │   │   ├── storage/         # Local storage
│   │   │   ├── network/         # P2P networking
│   │   │   ├── discovery/       # Peer discovery
│   │   │   ├── friends/         # Friend management
│   │   │   └── messaging/       # E2E messaging
│   │   └── bindings/            # Generated FFI bindings
│   │
│   ├── umbra-service/           # TypeScript API layer
│   │   ├── package.json
│   │   └── src/index.ts
│   │
│   ├── umbra-native/            # React Native native module (future)
│   │   ├── ios/
│   │   └── android/
│   │
│   └── umbra-web/               # Web WASM wrapper (future)
│       └── src/
│
├── docs/
│   ├── architecture/
│   │   └── SECURITY.md          # Security documentation
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

## Next Steps

1. **Phase 2**: Implement networking and discovery
2. **Phase 3**: Implement friends system
3. **Phase 4**: Implement messaging
4. **Phase 5**: Web support (WASM)
5. **Phase 6**: Integration and polish

See `RUST_BACKEND_PLAN.md` for the full implementation roadmap.
