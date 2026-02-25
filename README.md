<p align="center">
  <img src="assets/images/icon.png" alt="Umbra" width="120" height="120">
</p>

<h1 align="center">Umbra</h1>

<p align="center">
  <strong>Private, peer-to-peer messaging with end-to-end encryption</strong>
</p>

<p align="center">
  <a href="https://umbra.chat">Web App</a> ·
  <a href="https://github.com/InfamousVague/Umbra/releases">Downloads</a> ·
  <a href="https://discord.gg/umbra">Discord</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/platforms-iOS%20%7C%20Android%20%7C%20Web%20%7C%20macOS%20%7C%20Windows%20%7C%20Linux-blue" alt="Platforms">
  <img src="https://img.shields.io/badge/encryption-E2E-green" alt="E2E Encryption">
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="License">
</p>

---

## ✨ Key Features

| | Feature | Description |
|---|---------|-------------|
| 🔐 | **End-to-End Encryption** | X25519 key exchange + AES-256-GCM — nobody can read your messages but you |
| 🪪 | **Self-Sovereign Identity** | Own your identity with a 24-word BIP-39 recovery phrase |
| 🌐 | **Peer-to-Peer** | Direct WebRTC connections when possible, relay-assisted when needed |
| 📬 | **Offline Messaging** | Messages queued and delivered when recipients come online |
| 📞 | **Voice & Video Calls** | Encrypted 1:1 calls with TURN fallback |
| 👥 | **Groups & Communities** | Encrypted group chats and large-scale servers with roles & permissions |
| 🖥️ | **Cross-Platform** | iOS, Android, macOS, Windows, Linux, and Web |
| 🧩 | **Plugins** | Extensible with a sandboxed plugin system |

---

## 🚀 Quick Start

### Use Umbra Now

Visit **[umbra.chat](https://umbra.chat)** — no download required.

### Download

| Platform | Download |
|----------|----------|
| 🍎 macOS (Apple Silicon) | [`Umbra_*_aarch64.dmg`](https://github.com/InfamousVague/Umbra/releases) |
| 🍎 macOS (Intel) | [`Umbra_*_x64.dmg`](https://github.com/InfamousVague/Umbra/releases) |
| 🪟 Windows | [`Umbra_*.msi`](https://github.com/InfamousVague/Umbra/releases) |
| 🐧 Linux | [`Umbra_*.deb`](https://github.com/InfamousVague/Umbra/releases) / [`*.AppImage`](https://github.com/InfamousVague/Umbra/releases) |
| 📱 iOS / Android | Coming soon |

---

## 🛠️ Development Setup

### Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 20+ | [nodejs.org](https://nodejs.org/) or `brew install node` |
| Rust | 1.75+ | [rustup.rs](https://rustup.rs/) |
| wasm-pack | latest | `cargo install wasm-pack` |

### Get Running (Web)

```bash
git clone https://github.com/InfamousVague/Umbra.git
cd Umbra
npm install
rustup target add wasm32-unknown-unknown
npm run build:wasm
npm run web
```

### Get Running (Desktop — Tauri)

```bash
npm run build:desktop:dev    # Dev mode with hot reload
npm run build:desktop        # Production build
```

<details>
<summary>🐧 Linux system dependencies for Tauri</summary>

```bash
# Debian / Ubuntu
sudo apt install -y \
  libwebkit2gtk-4.1-dev libgtk-3-dev libayatana-appindicator3-dev \
  librsvg2-dev patchelf libssl-dev wget curl

# Fedora
sudo dnf install -y \
  webkit2gtk4.1-devel gtk3-devel libappindicator-gtk3-devel \
  librsvg2-devel patchelf openssl-devel

# Arch
sudo pacman -S --needed \
  webkit2gtk-4.1 gtk3 libappindicator-gtk3 librsvg patchelf openssl
```

</details>

### Get Running (iOS)

```bash
rustup target add aarch64-apple-ios aarch64-apple-ios-sim
npm run run:ios:sim          # Simulator
npm run run:ios              # Physical device (requires signing)
```

> Requires Xcode 15+, CocoaPods, and an Apple Developer account for device builds.

### Get Running (Android)

```bash
rustup target add aarch64-linux-android
npm run run:android
```

> Requires Android Studio with SDK 34+ and NDK.

---

## 🏗️ Architecture Overview

```
Umbra/
├── app/                     # 📱 Expo Router pages (auth, main screens)
├── components/              # 🧱 React components
├── hooks/                   # 🪝 Custom React hooks
├── packages/
│   ├── umbra-core/          # 🦀 Rust core (crypto, networking, storage)
│   ├── umbra-service/       # 📦 TypeScript API layer
│   ├── umbra-wasm/          # 🌐 WASM bridge + platform backends
│   ├── umbra-relay/         # 📡 Relay server (Rust)
│   ├── umbra-plugin-sdk/    # 🧩 Plugin dev kit
│   └── umbra-plugin-runtime/# ⚙️ Plugin sandbox
├── modules/
│   └── expo-umbra-core/     # 📲 Expo native module (Swift/Kotlin FFI)
├── src-tauri/               # 🖥️ Tauri desktop shell (Rust)
└── scripts/                 # 🔧 Build & deploy scripts
```

**How it works:** The Rust core (`umbra-core`) handles all cryptography, networking, and storage. It compiles to WASM for web, native code for mobile (via FFI), and runs as a Tauri backend for desktop. The TypeScript service layer (`umbra-service`) provides a unified API across all platforms.

---

## 🔐 Security at a Glance

| | What | How |
|---|------|-----|
| 🔑 | **Key Exchange** | X25519 ECDH ([RFC 7748](https://datatracker.ietf.org/doc/html/rfc7748)) |
| 🔒 | **Message Encryption** | AES-256-GCM ([NIST SP 800-38D](https://csrc.nist.gov/publications/detail/sp/800-38d/final)) |
| ✍️ | **Signatures** | Ed25519 ([RFC 8032](https://datatracker.ietf.org/doc/html/rfc8032)) |
| 🗝️ | **Key Derivation** | HKDF-SHA256 ([RFC 5869](https://datatracker.ietf.org/doc/html/rfc5869)) |
| 🧠 | **Recovery** | BIP-39 24-word mnemonic phrase |
| 🪪 | **Identity** | W3C DID:key self-certifying identifiers |
| 🧹 | **Memory Safety** | All secrets implement `ZeroizeOnDrop` |

**Zero-trust relay:** Relay servers only see encrypted blobs — they never have access to plaintext messages or keys.

---

## 📡 Self-Hosting

### Run Your Own Relay

```bash
cd packages/umbra-relay
cargo build --release
./target/release/umbra-relay --port 8080
```

See [packages/umbra-relay/README.md](packages/umbra-relay/README.md) for Docker deployment, SSL config, and federation setup.

---

## 🤝 Contributing

Contributions are welcome!

1. **Fork** the repository
2. **Create** a feature branch — `git checkout -b feature/my-feature`
3. **Commit** your changes — `git commit -m 'Add my feature'`
4. **Push** to your branch — `git push origin feature/my-feature`
5. **Open** a Pull Request

### Build Commands Reference

| Command | What it does |
|---------|-------------|
| `npm run web` | Start web dev server |
| `npm run build:wasm` | Compile Rust core to WASM |
| `npm run build:desktop:dev` | Desktop dev mode (hot reload) |
| `npm run build:desktop` | Desktop production build |
| `npm run build:mac` | macOS `.dmg` build |
| `npm run build:win` | Windows `.msi` build |
| `npm run build:linux` | Linux `.deb` / `.AppImage` build |
| `npm run run:ios:sim` | Build & run on iOS Simulator |
| `npm run run:ios` | Build & run on iOS device |
| `npm run run:android` | Build & run on Android |
| `npm test` | Run unit tests |

---

## 📄 License

MIT — see [LICENSE](LICENSE) for details.

---

<p align="center">
  <sub>Built with privacy in mind.</sub>
</p>
