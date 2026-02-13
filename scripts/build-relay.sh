#!/bin/bash
# =============================================================================
# Umbra Relay Build Script
#
# Builds release binaries for multiple platforms.
#
# Usage:
#   ./scripts/build-relay.sh              # Build for current platform
#   ./scripts/build-relay.sh --all        # Build for all platforms
#   ./scripts/build-relay.sh --linux      # Build for Linux only
#   ./scripts/build-relay.sh --macos      # Build for macOS only
#   ./scripts/build-relay.sh --windows    # Build for Windows only
#
# Prerequisites:
#   - Rust toolchain (rustup)
#   - Cross-compilation targets installed
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
RELAY_DIR="$PROJECT_ROOT/packages/umbra-relay"
OUTPUT_DIR="$PROJECT_ROOT/releases/relay"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Supported targets
LINUX_X86="x86_64-unknown-linux-gnu"
LINUX_ARM="aarch64-unknown-linux-gnu"
MACOS_X86="x86_64-apple-darwin"
MACOS_ARM="aarch64-apple-darwin"
WINDOWS_X86="x86_64-pc-windows-gnu"

build_target() {
    local target="$1"
    local output_name="$2"

    log_info "Building for $target..."

    # Check if target is installed
    if ! rustup target list --installed | grep -q "$target"; then
        log_info "Installing target $target..."
        rustup target add "$target" || {
            log_warn "Could not install target $target (may need cross-compilation toolchain)"
            return 1
        }
    fi

    cd "$RELAY_DIR"

    # Build
    if cargo build --release --target "$target" 2>/dev/null; then
        # Copy binary to output
        local binary_name="umbra-relay"
        [[ "$target" == *"windows"* ]] && binary_name="umbra-relay.exe"

        local source_path="$RELAY_DIR/target/$target/release/$binary_name"
        local dest_path="$OUTPUT_DIR/$output_name"

        if [[ -f "$source_path" ]]; then
            cp "$source_path" "$dest_path"
            chmod +x "$dest_path"
            log_success "Built: $output_name ($(du -h "$dest_path" | cut -f1))"
            return 0
        else
            log_error "Binary not found: $source_path"
            return 1
        fi
    else
        log_warn "Failed to build for $target (cross-compilation may not be available)"
        return 1
    fi
}

build_current() {
    log_info "Building for current platform..."
    cd "$RELAY_DIR"
    cargo build --release

    local binary_name="umbra-relay"
    [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]] && binary_name="umbra-relay.exe"

    local source_path="$RELAY_DIR/target/release/$binary_name"
    if [[ -f "$source_path" ]]; then
        cp "$source_path" "$OUTPUT_DIR/"
        log_success "Built: $OUTPUT_DIR/$binary_name"
    fi
}

build_linux() {
    build_target "$LINUX_X86" "umbra-relay-linux-x86_64" || true
    build_target "$LINUX_ARM" "umbra-relay-linux-aarch64" || true
}

build_macos() {
    build_target "$MACOS_X86" "umbra-relay-darwin-x86_64" || true
    build_target "$MACOS_ARM" "umbra-relay-darwin-aarch64" || true
}

build_windows() {
    build_target "$WINDOWS_X86" "umbra-relay-windows-x86_64.exe" || true
}

build_all() {
    build_linux
    build_macos
    build_windows
}

show_help() {
    cat << EOF
Umbra Relay Build Script

Usage:
    $0 [options]

Options:
    --all       Build for all platforms (requires cross-compilation)
    --linux     Build for Linux (x86_64 and aarch64)
    --macos     Build for macOS (x86_64 and aarch64)
    --windows   Build for Windows (x86_64)
    --current   Build for current platform only (default)
    --help      Show this help message

Output:
    Binaries are placed in: releases/relay/

Cross-compilation setup:
    # Install cross-compilation toolchains (Linux)
    apt install gcc-aarch64-linux-gnu gcc-mingw-w64-x86-64

    # Or use cargo-cross for easier cross-compilation
    cargo install cross
EOF
}

main() {
    # Create output directory
    mkdir -p "$OUTPUT_DIR"

    echo ""
    echo "=============================================="
    echo "  Umbra Relay Build"
    echo "=============================================="
    echo ""

    case "${1:-}" in
        --all)
            build_all
            ;;
        --linux)
            build_linux
            ;;
        --macos)
            build_macos
            ;;
        --windows)
            build_windows
            ;;
        --current|"")
            build_current
            ;;
        --help|-h)
            show_help
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac

    echo ""
    echo "=============================================="
    log_success "Build complete!"
    echo "=============================================="
    echo ""
    echo "Binaries in: $OUTPUT_DIR"
    ls -lh "$OUTPUT_DIR" 2>/dev/null || true
    echo ""
}

main "$@"
