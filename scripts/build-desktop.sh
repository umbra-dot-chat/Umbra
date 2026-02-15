#!/bin/bash
# ============================================================================
# Build Umbra Desktop
#
# Unified build script that proxies to Tauri for all desktop platforms.
# Handles prerequisite checks, the Expo web export, Rust compilation,
# and Tauri bundling in one step.
#
# Usage:
#   ./scripts/build-desktop.sh              # build for current platform
#   ./scripts/build-desktop.sh --mac        # macOS  .dmg + .app
#   ./scripts/build-desktop.sh --mac-intel  # macOS  Intel x86_64
#   ./scripts/build-desktop.sh --win        # Windows .exe + .msi
#   ./scripts/build-desktop.sh --linux      # Linux  .deb + .AppImage
#   ./scripts/build-desktop.sh --dev        # dev mode (hot-reload)
#   ./scripts/build-desktop.sh --debug      # debug build (no bundle)
#   ./scripts/build-desktop.sh --clean      # clean build artifacts
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
TAURI_DIR="$ROOT_DIR/src-tauri"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# ── Helpers ──────────────────────────────────────────────────────────────

info()  { echo -e "${BLUE}▸${NC} $*"; }
ok()    { echo -e "${GREEN}✔${NC} $*"; }
warn()  { echo -e "${YELLOW}⚠${NC} $*"; }
fail()  { echo -e "${RED}✖${NC} $*"; exit 1; }

banner() {
    echo ""
    echo -e "${BOLD}════════════════════════════════════════════${NC}"
    echo -e "${BOLD}  $*${NC}"
    echo -e "${BOLD}════════════════════════════════════════════${NC}"
    echo ""
}

# ── Sync Wisp packages ────────────────────────────────────────────────

sync_wisp() {
    info "Syncing Wisp design system packages..."
    if [ -x "$SCRIPT_DIR/patch-wisp.sh" ]; then
        bash "$SCRIPT_DIR/patch-wisp.sh"
        ok "Wisp packages synced"
    else
        warn "patch-wisp.sh not found or not executable — skipping"
    fi
    echo ""
}

# ── Prerequisite checks ─────────────────────────────────────────────────

check_prerequisites() {
    local missing=0

    info "Checking prerequisites..."

    # Rust / Cargo
    if command -v cargo &>/dev/null; then
        ok "cargo $(cargo --version | awk '{print $2}')"
    else
        warn "cargo not found — install from https://rustup.rs"
        missing=1
    fi

    # Tauri CLI
    if command -v tauri &>/dev/null || npx tauri --version &>/dev/null 2>&1; then
        ok "tauri CLI $(npx tauri --version 2>/dev/null || echo 'available')"
    else
        warn "tauri CLI not found — run: npm install -D @tauri-apps/cli"
        missing=1
    fi

    # Node / npm
    if command -v node &>/dev/null; then
        ok "node $(node --version)"
    else
        warn "node not found"
        missing=1
    fi

    # create-dmg (macOS only)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        if command -v create-dmg &>/dev/null; then
            ok "create-dmg $(create-dmg --version 2>/dev/null || echo 'available')"
        else
            warn "create-dmg not found — run: brew install create-dmg"
            warn "(.dmg bundling will fail without it)"
        fi
    fi

    echo ""

    if [[ $missing -ne 0 ]]; then
        fail "Missing prerequisites. Install them and try again."
    fi
}

# ── Clean ────────────────────────────────────────────────────────────────

do_clean() {
    banner "Cleaning build artifacts"

    if [ -d "$TAURI_DIR/target" ]; then
        info "Removing src-tauri/target/release/bundle/..."
        rm -rf "$TAURI_DIR/target/release/bundle"
        ok "Cleaned bundle output"
    fi

    if [ -d "$ROOT_DIR/dist" ]; then
        info "Removing dist/..."
        rm -rf "$ROOT_DIR/dist"
        ok "Cleaned web export"
    fi

    ok "Done"
}

# ── Dev mode ─────────────────────────────────────────────────────────────

do_dev() {
    banner "Starting Umbra Desktop (dev mode)"
    check_prerequisites
    sync_wisp

    info "Launching tauri dev with hot-reload..."
    info "  Frontend: http://localhost:8081 (Expo web)"
    info "  Backend:  native Rust (debug build)"
    echo ""

    cd "$ROOT_DIR"
    exec npx tauri dev
}

# ── Debug build (no bundle) ─────────────────────────────────────────────

do_debug() {
    banner "Building Umbra Desktop (debug)"
    check_prerequisites
    sync_wisp

    info "Exporting Expo web bundle..."
    cd "$ROOT_DIR"
    npx expo export --platform web
    ok "Web export → dist/"

    echo ""
    info "Compiling Rust (debug)..."
    cd "$TAURI_DIR"
    cargo build
    ok "Binary → src-tauri/target/debug/umbra-desktop"

    echo ""
    banner "Debug build complete"
    echo "Run with:"
    echo "  ./src-tauri/target/debug/umbra-desktop"
    echo ""
}

# ── Release build ────────────────────────────────────────────────────────

do_build() {
    local target_flag="$1"
    local label="$2"

    banner "Building Umbra Desktop — $label"
    check_prerequisites
    sync_wisp

    cd "$ROOT_DIR"

    local args=()
    if [[ -n "$target_flag" ]]; then
        args+=(--target "$target_flag")
    fi

    info "Running tauri build${target_flag:+ (target: $target_flag)}..."
    echo ""

    if [[ ${#args[@]} -gt 0 ]]; then
        npx tauri build "${args[@]}"
    else
        npx tauri build
    fi

    echo ""
    banner "Build complete — $label"

    # Show output
    local bundle_dir="$TAURI_DIR/target"
    if [[ -n "$target_flag" ]]; then
        bundle_dir="$bundle_dir/$target_flag/release/bundle"
    else
        bundle_dir="$bundle_dir/release/bundle"
    fi

    info "Output:"
    if [ -d "$bundle_dir" ]; then
        find "$bundle_dir" -maxdepth 2 \( -name "*.dmg" -o -name "*.app" -o -name "*.exe" -o -name "*.msi" -o -name "*.deb" -o -name "*.AppImage" -o -name "*.rpm" \) -exec ls -lh {} \; 2>/dev/null | while read -r line; do
            echo "  $line"
        done
    fi
    echo ""
}

# ── Main ─────────────────────────────────────────────────────────────────

main() {
    local mode="${1:---current}"

    case "$mode" in
        --dev|-d)
            do_dev
            ;;
        --debug)
            do_debug
            ;;
        --clean|-c)
            do_clean
            ;;
        --mac|-m)
            do_build "aarch64-apple-darwin" "macOS (Apple Silicon)"
            ;;
        --mac-intel)
            do_build "x86_64-apple-darwin" "macOS (Intel)"
            ;;
        --mac-universal)
            do_build "universal-apple-darwin" "macOS (Universal)"
            ;;
        --win|-w)
            do_build "x86_64-pc-windows-msvc" "Windows (x86_64)"
            ;;
        --linux|-l)
            do_build "x86_64-unknown-linux-gnu" "Linux (x86_64)"
            ;;
        --current)
            do_build "" "current platform"
            ;;
        --help|-h)
            echo "Usage: $0 [option]"
            echo ""
            echo "Options:"
            echo "  --dev, -d         Dev mode with hot-reload"
            echo "  --debug           Debug build (no installer bundle)"
            echo "  --clean, -c       Clean build artifacts"
            echo "  --mac, -m         macOS Apple Silicon (.dmg + .app)"
            echo "  --mac-intel       macOS Intel x86_64 (.dmg + .app)"
            echo "  --mac-universal   macOS Universal binary (.dmg + .app)"
            echo "  --win, -w         Windows (.exe + .msi)"
            echo "  --linux, -l       Linux (.deb + .AppImage)"
            echo "  (no option)       Build for current platform"
            echo "  --help, -h        Show this help"
            echo ""
            ;;
        *)
            fail "Unknown option: $mode — run with --help for usage"
            ;;
    esac
}

main "$@"
